# DeepScan - Deepfake Image & Video Detector

An advanced, responsive, single-page application for detecting deepfake images and videos using a Node.js + Express backend, a MySQL database, and a Python Flask ML microservice.

## Project Structure

```text
deepfake-detector/
├── backend/
│   ├── db.js               # Database pool configuration
│   ├── server.js           # Express main server entry point
│   ├── .env                # Server configuration (credentials)
│   ├── .env.example        # Environment variables template
│   ├── middleware/
│   │   └── auth.js         # JWT validation middleware
│   └── routes/
│       ├── authRoutes.js   # User registration and login endpoints
│       └── scanRoutes.js   # Media upload, scan processing and logging endpoints
├── ml-service/
│   ├── app.py              # Flask ML simulator service
│   └── requirements.txt    # Python Flask dependencies
└── frontend/
    ├── index.html          # Dynamic Single-Page app markup
    ├── style.css           # Premium sci-fi dark theme styling
    └── app.js              # State manager and HTTP fetch routes
```

## Setup Instructions

Follow these steps to set up and run the application locally on Windows.

### 1. Database Setup

1. Make sure MySQL Server is running on your machine.
2. Log into MySQL shell or your favorite client (e.g. phpMyAdmin, DBeaver) and run the database schema:
   ```sql
   CREATE DATABASE deepfake_detector;
   USE deepfake_detector;

   CREATE TABLE users (
     id         INT AUTO_INCREMENT PRIMARY KEY,
     username   VARCHAR(100) NOT NULL UNIQUE,
     email      VARCHAR(150) NOT NULL UNIQUE,
     password   VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE scans (
     id          INT AUTO_INCREMENT PRIMARY KEY,
     user_id     INT,
     filename    VARCHAR(255) NOT NULL,
     file_type   ENUM('image', 'video') NOT NULL,
     verdict     ENUM('real', 'fake') NOT NULL,
     confidence  FLOAT NOT NULL,
     scanned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

### 2. Node.js Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
   *Note: On Windows PowerShell, if you face execution policy restrictions with script running, use:*
   ```powershell
   npm.cmd install
   ```
3. Edit the `.env` file inside the `backend` directory to input your MySQL credentials (username and password):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=deepfake_detector
   JWT_SECRET=super_secret_deepscan_token_key_2026!
   ML_SERVICE_URL=http://localhost:5001/detect
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   Or for development mode (using nodemon):
   ```bash
   npm run dev
   ```

### 3. Python Flask ML Service Setup

1. Open a new terminal and navigate to the `ml-service/` directory:
   ```bash
   cd ml-service
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
   The mock detector will run on `http://localhost:5001`.

### 4. Viewing the Application

The Express backend serves the frontend static directory directly.
- Open your browser and go to: **[http://localhost:5000](http://localhost:5000)**.
- Alternative: You can open the raw `frontend/index.html` file directly in your browser. The client-side logic will auto-detect the environment and query `http://localhost:5000` via CORS.

## Scanning Simulator Behaviors (Testing Hints)

To test specific scanner output verdicts on the dashboard, upload files matching these name criteria:
- **For a FAKE verdict**: Save or rename your media file to include the word `fake` or `deepfake` in the file name (e.g. `test_fake_video.mp4`, `my_deepfake_face.png`).
- **For a REAL verdict**: Save or rename your media file to include the word `real` in the file name (e.g. `real_photo.jpg`, `my_real_vlog.avi`).
- **For default behavior**: Any other file name will yield a deterministic verdict based on the hash of its file name. The scan will return consistent verdicts and confidence values when scanning the same file multiple times.
