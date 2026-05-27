// ==========================================================================
// DeepScan Client Application Logic
// ==========================================================================

// Base API URL configuration
const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:5000' 
  : '';

// Global State
let token = localStorage.getItem('token') || '';
let user = null;
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) user = JSON.parse(storedUser);
} catch (e) {
  console.error('Failed to parse stored user data:', e);
}
let selectedFile = null;
let currentPreviewUrl = null;

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

// Initialize Application State and View
function initApp() {
  if (token && user) {
    document.getElementById('user-display-name').textContent = user.username;
    showView('dashboard');
    fetchHistory();
  } else {
    showView('login');
  }
}

// Simple SPA View Router
function showView(view) {
  const authContainer = document.getElementById('auth-container');
  const loginCard = document.getElementById('login-card');
  const registerCard = document.getElementById('register-card');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (view === 'dashboard') {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
  } else {
    dashboardContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    
    if (view === 'login') {
      loginCard.classList.remove('hidden');
      registerCard.classList.add('hidden');
    } else if (view === 'register') {
      loginCard.classList.add('hidden');
      registerCard.classList.remove('hidden');
    }
  }
}

// Setup DOM Event Listeners
function setupEventListeners() {
  // Navigation & Auth Toggles
  document.getElementById('link-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showView('register');
  });

  document.getElementById('link-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showView('login');
  });

  document.getElementById('btn-logout').addEventListener('click', logout);

  // Form Submissions
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);

  // File Upload Drag & Drop
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', () => {
    if (!selectedFile) fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  document.getElementById('btn-clear-file').addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid triggering dropZone click
    clearFileSelection();
  });

  // Action Buttons
  document.getElementById('btn-analyse').addEventListener('click', runAnalysis);
  document.getElementById('btn-refresh-history').addEventListener('click', fetchHistory);
}

// Toast Notification Manager
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' 
             : type === 'error' ? 'fa-circle-xmark' 
             : 'fa-circle-info';
             
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
  `;
  
  container.appendChild(toast);
  
  // Trigger transition
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });
  
  // Auto dismiss
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Handle User Registration
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const btn = document.getElementById('btn-register');

  try {
    btn.disabled = true;
    btn.innerHTML = `<span>Registering...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>`;

    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    showToast('Success', 'Registered successfully!', 'success');
    
    // Auto-login after registration
    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    document.getElementById('user-display-name').textContent = user.username;
    
    // Clear forms
    document.getElementById('register-form').reset();
    showView('dashboard');
    fetchHistory();

  } catch (error) {
    showToast('Registration Error', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Create Account</span> <i class="fa-solid fa-user-plus"></i>`;
  }
}

// Handle User Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login');

  try {
    btn.disabled = true;
    btn.innerHTML = `<span>Signing In...</span> <i class="fa-solid fa-circle-notch fa-spin"></i>`;

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    showToast('Welcome', 'Login successful!', 'success');
    
    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    document.getElementById('user-display-name').textContent = user.username;
    
    document.getElementById('login-form').reset();
    showView('dashboard');
    fetchHistory();

  } catch (error) {
    showToast('Login Error', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Sign In</span> <i class="fa-solid fa-right-to-bracket"></i>`;
  }
}

// Handle Logout
function logout() {
  token = '';
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear UI elements
  clearFileSelection();
  document.getElementById('result-placeholder').classList.remove('hidden');
  document.getElementById('result-card').classList.add('hidden');
  document.getElementById('history-list').innerHTML = '';
  
  showToast('Logged Out', 'You have been successfully logged out.', 'info');
  showView('login');
}

// Handle File Selection
function handleFileSelected(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/avi', 'video/x-msvideo', 'video/mkv', 'video/x-matroska'
  ];

  if (!allowedTypes.includes(file.type)) {
    showToast('Invalid File', 'Only JPG, PNG, WEBP, MP4, AVI, and MKV files are supported.', 'error');
    return;
  }

  if (file.size > maxSize) {
    showToast('File Too Large', 'Maximum file size permitted is 50MB.', 'error');
    return;
  }

  selectedFile = file;

  // Clean old URL if exists
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(file);

  // Setup preview UI
  const previewDetails = document.getElementById('preview-container');
  const prompt = document.querySelector('.drop-zone-prompt');
  const mediaContainer = document.getElementById('file-media-preview');
  
  document.getElementById('preview-filename').textContent = file.name;
  document.getElementById('preview-filesize').textContent = formatBytes(file.size);

  mediaContainer.innerHTML = '';
  if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = currentPreviewUrl;
    img.alt = 'Uploaded Image';
    mediaContainer.appendChild(img);
  } else {
    // Premium feature: dynamic playing video preview
    const video = document.createElement('video');
    video.src = currentPreviewUrl;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    mediaContainer.appendChild(video);
  }

  prompt.classList.add('hidden');
  previewDetails.classList.remove('hidden');
  
  // Enable scanning action
  document.getElementById('btn-analyse').disabled = false;
}

// Clear File Input selection
function clearFileSelection() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl);
    currentPreviewUrl = null;
  }

  document.getElementById('preview-container').classList.add('hidden');
  document.querySelector('.drop-zone-prompt').classList.remove('hidden');
  document.getElementById('btn-analyse').disabled = true;
  document.getElementById('laser-scanner').classList.add('hidden');
  document.getElementById('scan-progress-container').classList.add('hidden');
}

// Trigger Deepfake Scan
function runAnalysis() {
  if (!selectedFile) return;

  const btnAnalyse = document.getElementById('btn-analyse');
  const progressContainer = document.getElementById('scan-progress-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressPercent = document.getElementById('progress-percent');
  const progressStatus = document.querySelector('.progress-status');
  const laserScanner = document.getElementById('laser-scanner');
  
  // Hide current result cards
  document.getElementById('result-placeholder').classList.remove('hidden');
  document.getElementById('result-card').classList.add('hidden');

  btnAnalyse.disabled = true;
  progressContainer.classList.remove('hidden');
  laserScanner.classList.remove('hidden');

  const formData = new FormData();
  formData.append('file', selectedFile);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/api/scan/upload`, true);
  
  // Attach authorization headers
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  // Track upload progress (representing upload phase)
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      // Scale upload to 0-85% progress, leave 15% for server analysis wait state
      const percent = Math.round((e.loaded / e.total) * 85);
      progressBarFill.style.width = `${percent}%`;
      progressPercent.textContent = `${percent}%`;
      progressStatus.textContent = 'Uploading media asset...';
    }
  };

  // Wait/load handler
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const responseData = JSON.parse(xhr.responseText);
        
        // Push progress to 100%
        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressStatus.textContent = 'Scan Analysis Complete!';
        
        setTimeout(() => {
          showScanResult(responseData);
          showToast('Scan Successful', `${responseData.filename} was successfully analyzed.`, 'success');
          
          // Cleanup UI
          progressContainer.classList.add('hidden');
          progressBarFill.style.width = '0%';
          progressPercent.textContent = '0%';
          laserScanner.classList.add('hidden');
          btnAnalyse.disabled = false;
          
          fetchHistory(); // Refresh historical logs
        }, 600);

      } catch (err) {
        handleScanError('Failed to parse scan response.');
      }
    } else {
      let errMsg = 'Scan request failed.';
      try {
        const errObj = JSON.parse(xhr.responseText);
        errMsg = errObj.error || errMsg;
      } catch (e) {}
      handleScanError(errMsg);
    }
  };

  xhr.onerror = () => {
    handleScanError('Network error connecting to scan services.');
  };

  // Trigger send
  xhr.send(formData);

  // Helper inside scan thread
  function handleScanError(message) {
    showToast('Scan Failed', message, 'error');
    progressContainer.classList.add('hidden');
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    laserScanner.classList.add('hidden');
    btnAnalyse.disabled = false;
  }

  // Monitor server processing states in 85% to 98% loop while waiting
  let processSimTimer = setInterval(() => {
    let currentWidth = parseFloat(progressBarFill.style.width) || 0;
    if (currentWidth >= 85 && currentWidth < 98) {
      progressStatus.textContent = 'Analyzing frame spatial matrices...';
      const step = currentWidth + 2;
      progressBarFill.style.width = `${step}%`;
      progressPercent.textContent = `${Math.round(step)}%`;
    } else if (currentWidth >= 98 && currentWidth < 100) {
      progressStatus.textContent = 'Synthesizing verdict signatures...';
    } else {
      clearInterval(processSimTimer);
    }
  }, 1200);
}

// Display Diagnostic Scan Card details
function showScanResult(scan) {
  const resultPlaceholder = document.getElementById('result-placeholder');
  const resultCard = document.getElementById('result-card');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictIcon = document.getElementById('verdict-icon-container');
  const verdictTitle = document.getElementById('verdict-title');
  const confidencePercent = document.getElementById('confidence-percentage');
  const radialFill = document.getElementById('radial-bar-fill');
  const filenameVal = document.getElementById('result-filename');
  const mediatypeVal = document.getElementById('result-mediatype');
  const timestampVal = document.getElementById('result-timestamp');
  const explanation = document.getElementById('verdict-explanation');

  // Fill data
  filenameVal.textContent = scan.filename;
  mediatypeVal.textContent = scan.file_type === 'image' ? 'Image File' : 'Video Clip';
  
  // Format Date
  const dateObj = new Date(scan.scanned_at);
  timestampVal.textContent = dateObj.toLocaleString();

  // Reset classes
  verdictBanner.className = 'verdict-banner';
  
  // Format confidence score
  const confidenceValue = parseFloat(scan.confidence) * 100;
  confidencePercent.textContent = `${confidenceValue.toFixed(1)}%`;

  // Draw Radial Progress Circle
  // Circumference is 251.2
  const circ = 251.2;
  const strokeOffset = circ - (scan.confidence * circ);
  radialFill.style.strokeDasharray = circ;
  radialFill.style.strokeDashoffset = strokeOffset;

  if (scan.verdict === 'real') {
    verdictBanner.classList.add('real');
    verdictTitle.textContent = 'AUTHENTIC';
    verdictIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    explanation.innerHTML = `<strong>Diagnostic Summary:</strong> The scan reveals zero detectable GAN signatures, pixel distortion boundaries, or frame rate mismatches. Face geometries and visual shadows match camera metadata criteria. File is assessed as <strong>highly credible</strong>.`;
  } else {
    verdictBanner.classList.add('fake');
    verdictTitle.textContent = 'AI GENERATED';
    verdictIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
    explanation.innerHTML = `<strong>Diagnostic Summary:</strong> High frequency structural anomalies identified in facial textures and shadow reflections. Face boundary edges show artifacts aligned with AI auto-generation models. File is assessed as <strong>AI Generated</strong>.`;
  }

  // Toggle layout
  resultPlaceholder.classList.add('hidden');
  resultCard.classList.remove('hidden');
}

// Fetch user history from Backend
async function fetchHistory() {
  if (!token) return;

  const refreshBtn = document.getElementById('btn-refresh-history');
  refreshBtn.classList.add('disabled');
  refreshBtn.querySelector('i').classList.add('fa-spin');

  try {
    const response = await fetch(`${API_BASE}/api/scan/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return;
      }
      throw new Error('Could not pull scan history logs.');
    }

    const scans = await response.json();
    renderHistory(scans);

  } catch (error) {
    showToast('Logs Fetch Failure', error.message, 'error');
  } finally {
    refreshBtn.classList.remove('disabled');
    refreshBtn.querySelector('i').classList.remove('fa-spin');
  }
}

// Render history records list to HTML DOM
function renderHistory(scans) {
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const table = document.getElementById('history-table');

  historyList.innerHTML = '';

  if (scans.length === 0) {
    historyEmpty.classList.remove('hidden');
    table.classList.add('hidden');
    return;
  }

  historyEmpty.classList.add('hidden');
  table.classList.remove('hidden');

  scans.forEach(scan => {
    const row = document.createElement('tr');
    row.className = scan.verdict === 'real' ? 'real-row' : 'fake-row';

    const dateStr = new Date(scan.scanned_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const confidenceValue = (parseFloat(scan.confidence) * 100).toFixed(1);
    const mediaIcon = scan.file_type === 'image' ? 'fa-image' : 'fa-film';

    row.innerHTML = `
      <td>
        <div class="file-type-badge">
          <i class="fa-solid ${mediaIcon}"></i>
          <span title="${scan.filename}">${truncateFilename(scan.filename, 22)}</span>
        </div>
      </td>
      <td style="text-transform: capitalize;">${scan.file_type}</td>
      <td>
        <span class="badge ${scan.verdict === 'real' ? 'badge-real' : 'badge-fake'}">
          <i class="fa-solid ${scan.verdict === 'real' ? 'fa-check' : 'fa-triangle-exclamation'}"></i>
          ${scan.verdict === 'real' ? 'real' : 'AI Generated'}
        </span>
      </td>
      <td><strong>${confidenceValue}%</strong></td>
      <td>${dateStr}</td>
      <td class="text-right">
        <button class="delete-action-btn" data-id="${scan.id}" title="Remove this record">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    `;

    // Hook delete record
    row.querySelector('.delete-action-btn').addEventListener('click', async (e) => {
      const scanId = e.currentTarget.getAttribute('data-id');
      await deleteScanRecord(scanId, row);
    });

    historyList.appendChild(row);
  });
}

// Delete specific scan record
async function deleteScanRecord(id, rowElement) {
  if (!confirm('Are you sure you want to delete this scan record?')) return;

  try {
    const response = await fetch(`${API_BASE}/api/scan/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete record.');
    }

    showToast('Deleted', 'Scan record deleted.', 'success');
    
    // Animate row removal and update state
    rowElement.style.opacity = '0';
    rowElement.style.transform = 'scale(0.95)';
    rowElement.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      rowElement.remove();
      const tbody = document.getElementById('history-list');
      if (tbody.children.length === 0) {
        fetchHistory(); // Triggers display of empty log placeholder card
      }
    }, 300);

  } catch (error) {
    showToast('Deletion Failure', error.message, 'error');
  }
}

// Utilities helper: truncate file names
function truncateFilename(str, n) {
  return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str;
}

// Utilities helper: format file sizes
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
