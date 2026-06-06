import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';

export const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      const currentPath = location.pathname;
      const rootRoutes = ['/', '/welcome', '/login', '/dashboard'];

      if (rootRoutes.includes(currentPath)) {
        await App.exitApp();
      } else {
        navigate(-1);
      }
    };

    const setupListener = async () => {
      const listener = await App.addListener('backButton', handleBackButton);
      return listener;
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};
