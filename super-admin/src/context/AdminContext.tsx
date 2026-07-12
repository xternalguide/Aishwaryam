import React, { createContext, useContext, useState, useEffect } from 'react';

// Define window.fetchWithCache globally
window.fetchWithCache = async function (url: string, options: any = {}) {
  const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5044'
    : 'https://aiswaryam.onrender.com';
    
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  const reportFailure = async (response: Response) => {
    try {
      if (!url.includes('/api/Audit/report') && !url.includes('/api/Audit/logs')) {
        const errorText = await response.clone().text().catch(() => '');
        fetch(`${apiBase}/api/Audit/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'API_FAILURE',
            details: `Failed API call: ${options.method || 'GET'} ${url} returned HTTP ${response.status}`,
            status: 'FAILED',
            errorMessage: errorText.substring(0, 1000)
          })
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const reportNetworkError = async (err: any) => {
    try {
      if (!url.includes('/api/Audit/report')) {
        fetch(`${apiBase}/api/Audit/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'API_FAILURE',
            details: `Failed API call: ${options.method || 'GET'} ${url} encountered network error`,
            status: 'FAILED',
            errorMessage: err.message || String(err)
          })
        }).catch(() => {});
      }
    } catch (e) {}
  };
  
  if (!isGet) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        await reportFailure(response);
      } else {
        try {
          const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
          if (vRes.ok) {
            const vData = await vRes.json();
            sessionStorage.setItem('admin-db-version', String(vData.version));
          }
        } catch (e) {}
      }
      return response;
    } catch (err: any) {
      await reportNetworkError(err);
      throw err;
    }
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
        } as any;
      }
    } catch (e) {
      sessionStorage.removeItem(cacheKey);
    }
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      await reportFailure(response);
    } else {
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
  } catch (err: any) {
    await reportNetworkError(err);
    throw err;
  }
};


export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

interface AdminContextProps {
  apiBase: string;
  dbVersion: string;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'info' | 'success' | 'error') => void;
  removeToast: (id: string) => void;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  triggerGlobalReload: () => void;
  globalReloadToken: number;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbVersion, setDbVersion] = useState<string>('0');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aishwaryam-admin-auth') === 'true';
  });
  const [globalReloadToken, setGlobalReloadToken] = useState<number>(0);

  const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5044'
    : 'https://aiswaryam.onrender.com';

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = () => {
    localStorage.setItem('aishwaryam-admin-auth', 'true');
    setIsAuthenticated(true);
    showToast('Logged in successfully', 'success');
  };

  const logout = () => {
    localStorage.removeItem('aishwaryam-admin-auth');
    setIsAuthenticated(false);
    showToast('Logged out successfully', 'info');
  };

  const triggerGlobalReload = () => {
    setGlobalReloadToken((prev) => prev + 1);
  };

  // Poll database version every 5 seconds to automatically keep lists synced in the background
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`${apiBase}/api/Admin/db-version`);
        if (res.ok) {
          const data = await res.json();
          const serverVersion = String(data.version);
          const cachedVersion = sessionStorage.getItem('admin-db-version') || '0';
          if (serverVersion !== cachedVersion) {
            sessionStorage.setItem('admin-db-version', serverVersion);
            setDbVersion(serverVersion);
            triggerGlobalReload();
          }
        }
      } catch (e) {
        console.error('Failed to check database version', e);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, apiBase]);

  return (
    <AdminContext.Provider
      value={{
        apiBase,
        dbVersion,
        toasts,
        showToast,
        removeToast,
        isAuthenticated,
        login,
        logout,
        triggerGlobalReload,
        globalReloadToken,
      }}
    >
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
