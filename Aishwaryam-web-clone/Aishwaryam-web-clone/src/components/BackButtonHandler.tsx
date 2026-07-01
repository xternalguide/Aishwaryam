import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const handleBackButton = async () => {
      // 1. Dismiss Modal/Popup Priority first
      const activeModals = (window as any).activeModals || [];
      if (activeModals.length > 0) {
        const dismiss = activeModals.pop();
        if (dismiss) {
          dismiss();
          return;
        }
      }

      const currentPath = pathRef.current;
      const rootRoutes = ['/', '/welcome', '/dashboard'];

      if (currentPath === '/dashboard') {
        const activeTab = localStorage.getItem('DASHBOARD_ACTIVE_TAB');
        if (activeTab && activeTab !== '0') {
          localStorage.setItem('DASHBOARD_ACTIVE_TAB', '0');
          window.dispatchEvent(new Event('dashboardTabChange'));
          return;
        }
      }

      if (rootRoutes.includes(currentPath)) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          await App.exitApp();
        } else {
          lastBackPressRef.current = now;
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 2000);
        }
      } else {
        navigate(-1);
      }
    };

    let listener: any = null;
    const setupListener = async () => {
      listener = await App.addListener('backButton', handleBackButton);
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);

  return (
    <>
      {showExitToast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '12px',
          fontFamily: 'sans-serif',
          fontWeight: '500',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          Press back again to exit
        </div>
      )}
    </>
  );
};
