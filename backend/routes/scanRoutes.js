const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const axios = require('axios');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Setup uploads folder directory absolute path
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Mime check filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/x-msvideo',
    'video/mkv',
    'video/x-matroska'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Supported formats: JPG, PNG, WEBP, MP4, AVI, MKV.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
});

// Protect all routes under this router
router.use(authMiddleware);

// POST /api/scan/upload -> Upload & Analyse
// Multer middleware wraps upload.single('file') and handles file filter exceptions.
router.post('/upload', (req, res) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum limit is 50MB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const localFilePath = req.file.path;

    try {
      // Call Python flask ML microservice
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001/detect';
      
      const response = await axios.post(mlUrl, {
        filepath: localFilePath
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout
      });

      const { verdict, confidence } = response.data;

      if (!verdict || confidence === undefined) {
        throw new Error('Invalid response payload from ML service.');
      }

      // Determine file type category ('image' | 'video')
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

      // Insert record to database
      const [dbResult] = await pool.query(
        'INSERT INTO scans (user_id, filename, file_type, verdict, confidence) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, req.file.originalname, fileType, verdict, confidence]
      );

      return res.status(200).json({
        id: dbResult.insertId,
        filename: req.file.originalname,
        file_type: fileType,
        verdict: verdict,
        confidence: confidence,
        scanned_at: new Date()
      });

    } catch (error) {
      console.error('Scan processing error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(500).json({
          error: 'ML service offline. Deepfake analysis service could not be reached.'
        });
      }

      return res.status(500).json({
        error: `Deepfake scan analysis failed: ${error.message}`
      });
    } finally {
      // Cleanup: Delete the local file asynchronously
      try {
        await fsPromises.unlink(localFilePath);
      } catch (unlinkErr) {
        console.error(`Failed to delete temp file at ${localFilePath}:`, unlinkErr.message);
      }
    }
  });
});

// GET /api/scan/history -> Get last 20 scans for user
router.get('/history', async (req, res) => {
  try {
    const [scans] = await pool.query(
      'SELECT id, filename, file_type, verdict, confidence, scanned_at FROM scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 20',
      [req.user.id]
    );
    return res.status(200).json(scans);
  } catch (error) {
    console.error('Fetch history error:', error);
    return res.status(500).json({ error: 'Internal server error while retrieving scan history.' });
  }
});

// DELETE /api/scan/:id -> Delete a scan
router.delete('/:id', async (req, res) => {
  try {
    const scanId = req.params.id;

    // Check if the scan exists and belongs to the user
    const [scanCheck] = await pool.query(
      'SELECT id FROM scans WHERE id = ? AND user_id = ?',
      [scanId, req.user.id]
    );

    if (scanCheck.length === 0) {
      return res.status(404).json({ error: 'Scan record not found or access denied.' });
    }

    // Delete record
    await pool.query('DELETE FROM scans WHERE id = ?', [scanId]);

    return res.status(200).json({ message: 'Scan record successfully deleted.' });
  } catch (error) {
    console.error('Delete scan error:', error);
    return res.status(500).json({ error: 'Internal server error while deleting scan record.' });
  }
});

module.exports = router;
