import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aishwaryam.app',
  appName: 'Aishwaryam@yourhome',
  webDir: 'dist',
  server: {
    url: 'https://aishwaryam-web.pages.dev',
    cleartext: true
  },
  android: {
    appendUserAgent: 'AishwaryamAPK'
  },
  ios: {
    appendUserAgent: 'AishwaryamAPK'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#4A0E4E',
      style: 'DARK'
    }
  }
};

export default config;
