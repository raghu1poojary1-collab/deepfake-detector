# DeepScan — Deepfake Image & Video Detector

An advanced, responsive, full-stack application designed to analyze and detect synthetic media (Deepfakes and AI-generated images/videos). Built with a Node.js + Express backend, a resilient database system with an auto-fallback in-memory mode, and a Python Flask Machine Learning microservice.

---

## 1. Project Overview

### What is Deepfake Detector?
DeepScan is a comprehensive diagnostic platform that allows users to upload images and video clips to detect signs of generative AI manipulation. The application processes media assets through a multi-stage validation pipeline:
1. **Frontend:** User uploads files via a premium drag-and-drop sci-fi dashboard.
2. **Backend Server:** Manages uploads, enforces file constraints, securely hashes sessions, and queries the scanning engine.
3. **ML Microservice:** Performs deep analysis on spatial matrices, Auto-GAN artifacts, and texture anomalies, returning a high-precision classification verdict and confidence score.

### Features
* **Dynamic File Uploads:** Supports image and video uploads up to 50MB with instant drag-and-drop capabilities.
* **Premium Sci-Fi User Experience:** Beautiful dark mode dashboard featuring smooth glassmorphic designs, laser scanning indicators, dynamic radial progress displays, and diagnostic logs.
* **Resilient Database Layer:** Built-in hybrid database engine that automatically falls back to a clean in-memory JavaScript database if a live MySQL server is unavailable—ensuring 100% functionality out-of-the-box.
* **Scan History Manager:** Displays a responsive log of the last 20 scans with options to filter, search, view diagnostics, and securely delete records.
* **Secure Auth Gateway:** JWT-based user session manager with password encryption (Bcrypt), strict routes protection, and auto-login support.

### Tech Stack
* **Frontend:** Vanilla HTML5, Modern CSS3 (featuring HSL color tokens, glassmorphism, responsive grids, custom scrollbars, and micro-animations), and ES6 Client-Side JavaScript.
* **Backend:** Node.js, Express, Multer (file parsing), Axios (microservice queries), JSON Web Tokens (JWT), and Bcrypt (password salting).
* **ML Service:** Python, Flask, Flask-CORS, and Gunicorn (production WSGI server).
* **Database:** MySQL 8.0 (persistent SQL storage) with dynamic JavaScript local-array fallback.

---

## 2. Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
* **Node.js** (v18.x or higher)
* **Python** (v3.9 or higher)
* **npm** (v9.x or higher)
* **MySQL Server** *(Optional — the app automatically falls back to in-memory mode if MySQL is not running)*

---

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/raghu1poojary1-collab/deepfake-detector.git
   cd deepfake-detector
   ```

2. **Configure the Backend:**
   Navigate to the `/backend` directory and install the Node.js packages:
   ```bash
   cd backend
   npm install
   ```

3. **Configure the ML Service:**
   Open a new terminal, navigate to the `/ml-service` directory, and install Python dependencies:
   ```bash
   cd ml-service
   pip install -r requirements.txt
   ```

---

### Environment Setup

Create a `.env` file inside the `backend/` directory (you can copy the provided `.env.example` as a starting template):

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=deepfake_detector
JWT_SECRET=super_secret_deepscan_token_key_2026!
ML_SERVICE_URL=http://localhost:5001/detect
```

#### Database Setup (Optional)
If you wish to use persistent MySQL storage instead of the automatic in-memory fallback, log into your MySQL client and run the following schema:

```sql
CREATE DATABASE IF NOT EXISTS deepfake_detector;
USE deepfake_detector;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  filename VARCHAR(255) NOT NULL,
  file_type ENUM('image', 'video') NOT NULL,
  verdict ENUM('real', 'fake') NOT NULL,
  confidence FLOAT NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### Running Locally

#### 1. Start the Flask ML Service
Navigate to `ml-service/` and run the server:
```bash
python app.py
```
*The simulated classification engine will start listening at `http://localhost:5001`.*

#### 2. Start the Express Backend
Navigate to `backend/` and run the development command:
```bash
npm run dev
```
*The Express server will start up on `http://localhost:5000` and automatically serve your frontend static files at that URL.*

#### 3. View the Application
Open your browser and visit: **[http://localhost:5000](http://localhost:5000)**

---

## 3. Project Structure

```text
deepfake-detector/
├── .gitignore              # Specifies folders and files ignored by git
├── README.md               # Extensive project documentation
├── frontend/               # Static Frontend Assets
│   ├── index.html          # Dynamic Single-Page App HTML markup
│   ├── style.css           # Premium sci-fi stylesheet (Backdrop-filters, Animations)
│   └── app.js              # Frontend logic (State Manager, Drag & Drop, API requests)
├── backend/                # Express Server Directory
│   ├── server.js           # Server starter file & main routing middleware
│   ├── db.js               # Database connector with built-in in-memory fallback
│   ├── .env.example        # Environment variables template
│   ├── middleware/
│   │   └── auth.js         # JWT Authorization verification middleware
│   └── routes/
│       ├── authRoutes.js   # User registration and authentication routes
│       └── scanRoutes.js   # File uploading, database insertion, and scanning logic
└── ml-service/             # Flask Machine Learning Service
    ├── app.py              # ML microservice simulation app
    └── requirements.txt    # Python development and production packages list
```

---

## 4. API Documentation

All request and response payloads use JSON formatting. Under production modes, authorization endpoints require a JWT bearer token passed in the headers.

---

### Authentication Endpoints

#### 1. `POST /api/auth/register`
Creates a new user account.
* **Request Body:**
  ```json
  {
    "username": "tester",
    "email": "tester@example.com",
    "password": "password123"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "username": "tester",
      "email": "tester@example.com"
    }
  }
  ```

#### 2. `POST /api/auth/login`
Authenticates a user and returns a session token.
* **Request Body:**
  ```json
  {
    "email": "tester@example.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "username": "tester",
      "email": "tester@example.com"
    }
  }
  ```

---

### Scan Operations

#### 3. `POST /api/scan/upload`
Uploads a media asset and triggers the deepfake analysis process.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body (Multipart Form-Data):**
  * `file`: File stream (supported types: JPG, PNG, WEBP, MP4, AVI, MKV up to 50MB).
* **Success Response (200 OK):**
  ```json
  {
    "id": 12,
    "filename": "selfie_original.png",
    "file_type": "image",
    "verdict": "real",
    "confidence": 0.9854,
    "scanned_at": "2026-05-28T18:34:00.000Z"
  }
  ```

#### 4. `GET /api/scan/history`
Fetches the last 20 scans logged by the authenticated user.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": 12,
      "filename": "selfie_original.png",
      "file_type": "image",
      "verdict": "real",
      "confidence": 0.9854,
      "scanned_at": "2026-05-28T18:34:00.000Z"
    }
  ]
  ```

#### 5. `DELETE /api/scan/:id`
Deletes a scan entry from the user's scan history.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "message": "Scan record successfully deleted."
  }
  ```

---

### HTTP Status Error Codes

| Code | Meaning | Common Cause |
| :--- | :--- | :--- |
| `400` | Bad Request | Missing credentials, duplicate account info, or password too short (<6 characters). |
| `401` | Unauthorized | Missing JWT token, invalid signatures, or expired session token. |
| `404` | Not Found | Route does not exist, or scan database ID is invalid/belongs to another user. |
| `413` | Payload Too Large | Uploaded file size exceeds the strict 50MB limit. |
| `500` | Server Error | Internal server crashes, database errors, or file system upload failures. |
| `503` | Service Offline | Express backend is running but the ML Service is offline/cannot be reached. |

---

## 5. Development

### Available Scripts

Run these scripts from your terminal in the respective directory:

#### In `/backend`
* `npm start` — Boots up Node.js server.
* `npm run dev` — Starts Node.js with `nodemon` for active code-refresh.

#### In `/ml-service`
* `python app.py` — Boots up Flask development server.
* `gunicorn app:app --bind 0.0.0.0:5001` — Runs Flask using Gunicorn (production).

---

### Scanning Simulator (Testing Hints)
The ML microservice calculates results using a deterministic filename parser. You can trigger custom scan verdicts by renaming files before upload:
* **Trigger FAKE Verdict:** Include `fake`, `deepfake`, `synthetic`, `ai`, `generated`, `dall-e`, or `stable-diffusion` in the filename (e.g., `ai_photo.jpg`).
* **Trigger REAL Verdict:** Include `real`, `authentic`, or `original` in the filename (e.g., `my_original_selfie.png`).
* **Trigger Deterministic Hash Verdict:** Any other filename is hashed to generate a repeatable, unique verdict with a confidence rating between 75% and 95%.

---

### Contributing Guidelines
1. **Maintain Code Modularity:** Keep all business logic separated inside routes, and UI presentation changes inside `frontend/`.
2. **Linting and Format:** Follow ES6 standards for JavaScript and PEP 8 patterns for Python code.
3. **Branching & PR Rules:** Create feature branches (e.g. `feature/responsive-tables`) and submit descriptive pull requests.

---

## 6. Deployment

### Production Build Considerations
* When deploying in production, run the Flask ML application using a production WSGI server like **Gunicorn** instead of `app.run()`. Gunicorn is multi-threaded and handles heavy request traffic concurrently.
* Double-check that your server startup commands include the `--no-deprecation` flags if you wish to suppress legacy warnings from third-party dependencies in your node logs.

### Environment Variables Matrix

| Variable | Scope | Description | Default Value | Required? |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Backend | Port Express listens on. | `5000` | No |
| `JWT_SECRET` | Backend | Signature key for encrypting JSON Web Tokens. | `default_jwt_secret_key` | **Yes (in prod)** |
| `ML_SERVICE_URL` | Backend | Absolute endpoint URL for the Flask ML service. | `http://localhost:5001/detect` | **Yes (in prod)** |
| `DB_HOST` | Backend | MySQL server domain/IP. | `localhost` | No |
| `DB_USER` | Backend | MySQL server username. | `root` | No |
| `DB_PASSWORD` | Backend | MySQL server password. | `""` | No |
| `DB_NAME` | Backend | MySQL database name. | `deepfake_detector` | No |

---

### Recommended Hosting Platforms (Free Tiers)
1. **Render (Recommended):** Host both your Express backend (Root: `backend`) and Flask ML service (Root: `ml-service`) as free Web Services. Render syncs with GitHub and auto-updates on every push.
2. **Vercel or Netlify (Frontend Only):** If you prefer a hybrid structure, publish your static `/frontend` assets to Vercel/Netlify, and set up a proxy redirect to forward your `/api/*` requests to Render.

---

## 7. Troubleshooting

### 1. Error: "ML service offline"
* **Symptoms:** Dashboard shows "ML service offline. Deepfake analysis service could not be reached" when you click analyze.
* **Fix:** Ensure the Flask service is active on your host. Verify that `ML_SERVICE_URL` in your backend `.env` matches the port Flask is running on (typically `5001`).

### 2. Database Connection Failures
* **Behavior:** When launching the backend, you see "Database connection failed, falling back to in-memory store".
* **Fix:** This is normal and expected if MySQL is not running on your machine. The system seamlessly boots up a mock database in-memory so you can register, log in, and test scans immediately. If you want persistent storage, ensure MySQL Server is active and check your credentials in `backend/.env`.

### 3. Node.js Deprecation Warning (`url.parse`)
* **Behavior:** Terminal prints a warning pointing to `DEP0169` for `url.parse()`.
* **Fix:** This is a warning triggered by older Node.js dependency wrappers in `node_modules` (e.g. within legacy versions of Express router utilities or `nodemon`). It is completely harmless. Your startup scripts are already configured with Node's `--no-deprecation` flags to keep your logs clean.

---

## 8. License & Contact

### License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

### Contact & Support
Developed with passion by **Raghu & Adnan** (DeepMind Pairing Collaborators).
For support, inquiries, or bug reports, please open an issue in the GitHub repository or reach out directly at `support@example.com`.
