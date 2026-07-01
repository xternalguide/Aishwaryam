import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';

export const PushNotificationHandler: React.FC = () => {
  const navigate = useNavigate();
  const userId = SessionManager.getUserId();

  useEffect(() => {
    // 1. Only run on native mobile platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push Notifications: Not on a native platform, skipping registration.');
      return;
    }

    const initPush = async () => {
      // 2. Add listener to handle registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM Token registration error: ', error);
      });

      // 3. Add listener to receive FCM registration token
      await PushNotifications.addListener('registration', async (token) => {
        const fcmToken = token.value;
        console.log('FCM Token registered successfully: ', fcmToken);
        localStorage.setItem('FCM_TOKEN', fcmToken);
        
        // Register token with backend
        await syncFcmToken(fcmToken, SessionManager.getUserId());
      });

      // 4. Add listener to handle notification receipt when app is open/foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received in foreground: ', notification);
      });

      // 5. Add listener to handle user clicking/tapping on a push notification
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push action performed: ', action);
        const data = action.notification.data;
        const screen = data?.screen || data?.target_screen;
        const entityId = data?.entityId || data?.entity_id;

        if (screen === 'scheme_details' && entityId) {
          navigate(`/scheme-detail/${entityId}`);
        } else if (screen === 'notifications') {
          navigate('/notifications');
        } else {
          navigate('/notifications');
        }
      });

      // 6. Request notification permissions (required for Android 13+)
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        // Register with Apple / Google to receive a token
        await PushNotifications.register();
      }
    };

    initPush();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [navigate]);

  // Sync token whenever userId changes (e.g. login, logout)
  useEffect(() => {
    const fcmToken = localStorage.getItem('FCM_TOKEN');
    if (fcmToken && Capacitor.isNativePlatform()) {
      if (userId) {
        syncFcmToken(fcmToken, userId);
      } else {
        unsyncFcmToken(fcmToken);
      }
    }
  }, [userId]);

  return null;
};

// Helper function to register token with backend
async function syncFcmToken(token: string, userId: string | null) {
  try {
    const payload: { token: string; deviceType: string; userId?: string } = {
      token,
      deviceType: 'ANDROID'
    };
    if (userId) {
      payload.userId = userId;
    }
    const response = await ApiClient.post('api/Notification/register-token', payload);
    console.log('FCM Token successfully synced with server: ', response.data);
  } catch (error) {
    console.error('Failed to sync FCM Token with server: ', error);
  }
}

// Helper function to unregister token on logout
async function unsyncFcmToken(token: string) {
  try {
    const response = await ApiClient.post('api/Notification/unregister-token', { token });
    console.log('FCM Token successfully unregistered from server: ', response.data);
  } catch (error) {
    console.error('Failed to unregister FCM Token from server: ', error);
  }
}
