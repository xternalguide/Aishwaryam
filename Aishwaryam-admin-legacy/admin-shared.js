// admin-shared.js — included by every admin page
// Auth Guard Check
(function() {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const isAuthenticated = localStorage.getItem('aishwaryam-admin-auth') === 'true';
  if (!isAuthenticated && !isLoginPage) {
    window.location.href = 'login.html';
  }
})();

// Theme persistence
(function() {
  const saved = localStorage.getItem('aishwaryam-admin-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5044'
  : 'https://aishwaryam-production.up.railway.app';

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('aishwaryam-admin-theme', next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  btn.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();

  // Dynamic sidebar navigation hiding logic
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  const knownPages = ['index.html', 'users.html', 'kyc.html', 'transactions.html', 'redemptions.html', 'scheme-joined.html', 'schemes.html', 'offers.html', 'onboarding-banners.html', 'posters.html', 'notifications.html', 'audit.html'];
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.trim() === '' || href === '#' || href === 'javascript:void(0)') {
      link.style.display = 'none';
      return;
    }
    
    const pageName = href.split('?')[0].split('#')[0];
    
    // Perform HEAD request to check if the page actually exists
    fetch(pageName, { method: 'HEAD' })
      .then(res => {
        if (!res.ok || res.status === 404) {
          link.style.display = 'none';
        }
      })
      .catch(() => {
        // Fallback if fetch is blocked or fails
        if (!knownPages.includes(pageName)) {
          link.style.display = 'none';
        }
      });
  });

  // Dynamic user chip updates
  const userRole = document.querySelector('.user-role');
  if (userRole) {
    userRole.textContent = 'blazewingwebs@gmail.com';
  }

  const userChip = document.querySelector('.user-chip');
  if (userChip) {
    userChip.title = 'Click to sign out';
    userChip.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('aishwaryam-admin-auth');
        window.location.href = 'login.html';
      }
    });
  }
});

function exportToCSV(filename, data) {
  if (!data || !data.length) {
    showToast('No data to export', 'info');
    return;
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

let cachedUsersMap = null;
async function getUsersMap() {
  if (cachedUsersMap) return cachedUsersMap;
  try {
    const res = await fetch(`${API_BASE}/api/User/all`);
    const users = await res.json();
    cachedUsersMap = {};
    users.forEach(u => {
      cachedUsersMap[u.id.toLowerCase()] = u;
    });
    return cachedUsersMap;
  } catch (e) {
    console.error("Failed to load user map", e);
    return {};
  }
}

// --- Real-time KYC Notifications and Alerts ---
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .admin-kyc-alert-popup {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface, #ffffff);
      border: 2px solid var(--amber, #f39c12);
      border-radius: 16px;
      padding: 16px;
      width: 340px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
      z-index: 99999;
      color: var(--text, #1c1d21);
      font-family: inherit;
      animation: kycSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .admin-kyc-alert-popup h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--amber, #f39c12);
    }
    .admin-kyc-alert-popup p {
      margin: 0;
      font-size: 12.5px;
      color: var(--text-2, #5c5d64);
      line-height: 1.5;
    }
    .admin-kyc-alert-popup .btn-wrap {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
    @keyframes kycSlideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  window.showKycNotificationPopup = function(user) {
    const exists = document.getElementById(`kyc-alert-${user.id}`);
    if (exists) return;
    
    const popup = document.createElement('div');
    popup.id = `kyc-alert-${user.id}`;
    popup.className = 'admin-kyc-alert-popup';
    popup.innerHTML = `
      <h4>
        <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2.5;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
        New KYC Document Upload
      </h4>
      <p>User <strong>${user.fullName || 'Unknown'}</strong> (${user.phoneNumber}) has submitted KYC documents and is waiting for review.</p>
      <div class="btn-wrap">
        <button class="btn btn-outline btn-xs" onclick="document.getElementById('kyc-alert-${user.id}').remove()">Dismiss</button>
        <button class="btn btn-primary btn-xs" onclick="location.href='kyc.html?filter=PENDING&uid=${user.id}'">Review Now</button>
      </div>
    `;
    document.body.appendChild(popup);
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 15000);
  };

  let isKycInit = false;
  async function checkNewKycAlerts() {
    try {
      const res = await fetch(`${API_BASE}/api/Kyc/all`);
      if (!res.ok) return;
      const users = await res.json();
      const pending = users.filter(u => u.kycLevel === 'PENDING');
      
      let seenStr = localStorage.getItem('aishwaryam-seen-kyc-pending');
      let seenIds = seenStr ? JSON.parse(seenStr) : [];
      
      if (!isKycInit) {
        // First fetch: initialize seen list without popups to avoid alerting existing pending items
        const currentPendingIds = pending.map(u => u.id);
        // Only merge if seenIds is completely empty
        if (seenIds.length === 0) {
          seenIds = currentPendingIds;
          localStorage.setItem('aishwaryam-seen-kyc-pending', JSON.stringify(seenIds));
        }
        isKycInit = true;
        return;
      }
      
      const newPending = pending.filter(u => !seenIds.includes(u.id));
      if (newPending.length > 0) {
        newPending.forEach(u => {
          showKycNotificationPopup(u);
          seenIds.push(u.id);
        });
        localStorage.setItem('aishwaryam-seen-kyc-pending', JSON.stringify(seenIds));
      }
    } catch (e) {
      console.error("Failed to check KYC alerts", e);
    }
  }

  // Start polling alerts check every 5 seconds using db-version check
  let lastAlertsVersion = 0;
  async function runAlertsCheckWithVersion() {
    try {
      const res = await fetch(`${API_BASE}/api/Admin/db-version`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.version !== lastAlertsVersion) {
        lastAlertsVersion = data.version;
        await checkNewKycAlerts();
      }
    } catch (e) {
      console.error("Failed to check KYC alerts database version", e);
    }
  }

  setInterval(runAlertsCheckWithVersion, 5000);
  setTimeout(runAlertsCheckWithVersion, 1000);
})();

// Global helper to setup auto-refresh of data pages using lightweight db-version polling
window.setupAutoRefresh = function(callback, intervalMs = 5000) {
  let localLastVersion = sessionStorage.getItem('admin-db-version') || '0';
  
  const check = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/Admin/db-version`);
      if (!res.ok) return;
      const data = await res.json();
      const serverVersion = String(data.version);
      if (serverVersion !== localLastVersion) {
        localLastVersion = serverVersion;
        sessionStorage.setItem('admin-db-version', serverVersion);
        callback();
      }
    } catch (e) {
      console.error("Failed to check database version for page refresh", e);
    }
  };
  
  // Run once immediately
  check();
  
  // Setup polling
  setInterval(check, intervalMs);
};

// Global helper to cache GET API requests across multiple page reloads
window.fetchWithCache = async function(url, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  
  if (!isGet) {
    // For modifying mutations (POST, PUT, DELETE, etc.), do the actual fetch
    const response = await fetch(url, options);
    
    // Auto-invalidate database version so other tabs know to pull fresh data
    try {
      const vRes = await fetch(`${API_BASE}/api/Admin/db-version`);
      if (vRes.ok) {
        const vData = await vRes.json();
        sessionStorage.setItem('admin-db-version', String(vData.version));
      }
    } catch (e) {}
    
    return response;
  }

  const currentVersion = sessionStorage.getItem('admin-db-version') || '0';
  const cacheKey = `cache:${url}`;
  const cachedDataStr = sessionStorage.getItem(cacheKey);

  if (cachedDataStr) {
    try {
      const cacheObj = JSON.parse(cachedDataStr);
      if (cacheObj.version === currentVersion) {
        return {
          ok: true,
          status: 200,
          json: async () => cacheObj.data,
          text: async () => JSON.stringify(cacheObj.data),
          clone: function() { return this; }
        };
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  // Fetch from network
  const response = await fetch(url, options);
  if (response.ok) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      sessionStorage.setItem(cacheKey, JSON.stringify({
        version: currentVersion,
        data: data
      }));
    } catch (e) {}
  }
  return response;
};


