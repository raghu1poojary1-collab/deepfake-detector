const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const realPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'deepfake_detector',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let useFallback = false;

// Pre-populate default users for testing in fallback mode
const defaultPasswordHash = bcrypt.hashSync('password123', 10);
const inMemoryUsers = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: defaultPasswordHash,
    created_at: new Date()
  },
  {
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    password: defaultPasswordHash,
    created_at: new Date()
  }
];
const inMemoryScans = [];
let nextUserId = 3;
let nextScanId = 1;

// Verify connection on startup
(async () => {
  try {
    const connection = await realPool.getConnection();
    console.log('Database connected successfully to pool.');
    connection.release();
  } catch (err) {
    console.error('Database connection failed, falling back to in-memory store:', err.message);
    useFallback = true;
  }
})();

const poolWrapper = {
  async query(sql, params = []) {
    if (!useFallback) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND') {
          console.warn('Database error encountered. Switching to in-memory fallback database:', err.message);
          useFallback = true;
        } else {
          throw err;
        }
      }
    }

    // In-memory Fallback logic:
    const cleanSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
    console.log(`[Fallback DB Query] SQL: "${cleanSql}" | Params:`, params);

    // 1. SELECT id, username, email FROM users WHERE username = ? OR email = ?
    if (cleanSql.includes('select id, username, email from users where username = ? or') || cleanSql.includes('username = ? or email = ?')) {
      const [username, email] = params;
      const results = inMemoryUsers.filter(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
      console.log(`[Fallback DB Result] SELECT users check:`, results);
      return [results];
    }

    // 2. SELECT * FROM users WHERE email = ?
    if (cleanSql.includes('select * from users where email = ?')) {
      const [email] = params;
      const results = inMemoryUsers.filter(u => u.email.toLowerCase() === email.toLowerCase());
      console.log(`[Fallback DB Result] SELECT user by email:`, results);
      return [results];
    }

    // 3. INSERT INTO users (username, email, password) VALUES (?, ?, ?)
    if (cleanSql.includes('insert into users')) {
      const [username, email, password] = params;
      const newUser = { id: nextUserId++, username, email, password, created_at: new Date() };
      inMemoryUsers.push(newUser);
      console.log(`[Fallback DB Result] INSERT user:`, newUser);
      return [{ insertId: newUser.id }];
    }

    // 4. INSERT INTO scans (user_id, filename, file_type, verdict, confidence) VALUES (?, ?, ?, ?, ?)
    if (cleanSql.includes('insert into scans')) {
      const [user_id, filename, file_type, verdict, confidence] = params;
      const newScan = { id: nextScanId++, user_id, filename, file_type, verdict, confidence, scanned_at: new Date() };
      inMemoryScans.push(newScan);
      console.log(`[Fallback DB Result] INSERT scan:`, newScan);
      return [{ insertId: newScan.id }];
    }

    // 5. SELECT id, filename, file_type, verdict, confidence, scanned_at FROM scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 20
    if (cleanSql.includes('select id, filename, file_type, verdict, confidence, scanned_at from scans where user_id = ?')) {
      const [user_id] = params;
      const results = inMemoryScans
        .filter(s => s.user_id === user_id)
        .sort((a, b) => b.scanned_at - a.scanned_at)
        .slice(0, 20);
      console.log(`[Fallback DB Result] SELECT scans history (count: ${results.length})`);
      return [results];
    }

    // 6. SELECT id FROM scans WHERE id = ? AND user_id = ?
    if (cleanSql.includes('select id from scans where id = ? and user_id = ?')) {
      const [id, user_id] = params;
      const results = inMemoryScans.filter(s => s.id === parseInt(id) && s.user_id === user_id);
      console.log(`[Fallback DB Result] SELECT scan check:`, results);
      return [results];
    }

    // 7. DELETE FROM scans WHERE id = ?
    if (cleanSql.includes('delete from scans where id = ?')) {
      const [id] = params;
      const idx = inMemoryScans.findIndex(s => s.id === parseInt(id));
      if (idx !== -1) {
        inMemoryScans.splice(idx, 1);
      }
      console.log(`[Fallback DB Result] DELETE scan: id = ${id}`);
      return [{ affectedRows: 1 }];
    }

    console.error(`[Fallback DB Error] Unsupported SQL query: ${sql}`);
    throw new Error(`Unsupported SQL query in fallback DB: ${sql}`);
  },

  async getConnection() {
    if (useFallback) {
      return {
        release() {}
      };
    }
    return await realPool.getConnection();
  }
};

module.exports = poolWrapper;


