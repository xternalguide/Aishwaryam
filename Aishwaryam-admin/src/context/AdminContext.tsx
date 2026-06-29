import React, { createContext, useContext, useState, useEffect } from 'react';

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
    : 'https://aishwaryam-production.up.railway.app';

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
