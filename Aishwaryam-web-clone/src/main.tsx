import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './android.css'
import './web.css'
import App from './App.tsx'

// Restrict web client rendering to Capacitor Native Wrapper environments (APK) to prevent browser access
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isCapacitor = !!(window as any).Capacitor || navigator.userAgent.includes('Capacitor');

if (!isLocalhost && !isCapacitor) {
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background-color:#0F172A;font-family:sans-serif;color:#F8FAFC;padding:24px;text-align:center;">
      <h1 style="font-size:72px;font-weight:800;color:#E2E8F0;margin:0 0 16px 0;letter-spacing:-1px;">403</h1>
      <h2 style="font-size:20px;font-weight:600;color:#F1F5F9;margin:0 0 12px 0;">Access Denied</h2>
      <p style="font-size:14px;color:#94A3B8;max-width:320px;line-height:20px;margin:0;">This application is restricted. Please install and run the official mobile app from the Google Play Store.</p>
    </div>
  `;
  throw new Error("Access Denied: Web-browser rendering is disabled in production.");
}


// Override default window.alert with a premium, gold-themed dialog popup for Cordova/mobile view compatibility
window.alert = function(message: string) {
  // Create backdrop container
  const backdrop = document.createElement('div');
  backdrop.id = 'custom-alert-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.right = '0';
  backdrop.style.bottom = '0';
  backdrop.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
  backdrop.style.backdropFilter = 'blur(10px)';
  (backdrop.style as any).webkitBackdropFilter = 'blur(10px)';
  backdrop.style.display = 'flex';
  backdrop.style.alignItems = 'center';
  backdrop.style.justifyContent = 'center';
  backdrop.style.zIndex = '999999';
  backdrop.style.padding = '24px';
  backdrop.style.animation = 'customFadeIn 0.25s ease-out';

  // Create alert box container
  const alertBox = document.createElement('div');
  alertBox.style.background = 'rgba(255, 255, 255, 0.98)';
  alertBox.style.border = '1px solid rgba(212, 175, 55, 0.4)'; // Gold border
  alertBox.style.borderRadius = '24px';
  alertBox.style.padding = '28px 24px';
  alertBox.style.maxWidth = '360px';
  alertBox.style.width = '100%';
  alertBox.style.boxShadow = '0 24px 48px -12px rgba(0, 0, 0, 0.3)';
  alertBox.style.display = 'flex';
  alertBox.style.flexDirection = 'column';
  alertBox.style.alignItems = 'center';
  alertBox.style.textAlign = 'center';
  alertBox.style.animation = 'customScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

  // Alert Icon (Gold Circle with Exclamation Point)
  const iconContainer = document.createElement('div');
  iconContainer.style.width = '56px';
  iconContainer.style.height = '56px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.background = 'linear-gradient(135deg, #FFF8E7 0%, #FFEFA7 100%)';
  iconContainer.style.border = '1.5px solid #D4AF37';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.marginBottom = '16px';
  iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

  // Title
  const title = document.createElement('h3');
  title.innerText = 'Notification';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '17px';
  title.style.fontWeight = '800';
  title.style.color = '#111827';
  title.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Message Content
  const msgText = document.createElement('p');
  msgText.innerText = message;
  msgText.style.margin = '0 0 20px 0';
  msgText.style.fontSize = '14px';
  msgText.style.lineHeight = '1.5';
  msgText.style.color = '#4B5563';
  msgText.style.fontWeight = '500';
  msgText.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // OK Button (Premium Dark Purple to match primary theme)
  const btn = document.createElement('button');
  btn.innerText = 'OK';
  btn.style.width = '100%';
  btn.style.padding = '12px';
  btn.style.border = 'none';
  btn.style.borderRadius = '14px';
  btn.style.background = 'linear-gradient(135deg, #1C0826 0%, #0F0114 100%)';
  btn.style.color = '#FFFFFF';
  btn.style.fontSize = '14px';
  btn.style.fontWeight = '700';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 4px 12px rgba(28, 8, 38, 0.2)';
  btn.style.outline = 'none';

  const closeAlert = () => {
    backdrop.style.animation = 'customFadeOut 0.2s ease-in forwards';
    alertBox.style.animation = 'customScaleOut 0.2s ease-in forwards';
    setTimeout(() => {
      if (document.body.contains(backdrop)) {
        document.body.removeChild(backdrop);
      }
    }, 200);
  };

  btn.addEventListener('click', closeAlert);
  
  // Assemble & Inject CSS
  alertBox.appendChild(iconContainer);
  alertBox.appendChild(title);
  alertBox.appendChild(msgText);
  alertBox.appendChild(btn);
  backdrop.appendChild(alertBox);

  if (!document.getElementById('custom-alert-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'custom-alert-animations';
    styleSheet.innerHTML = `
      @keyframes customFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes customFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes customScaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes customScaleOut {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(0.9); opacity: 0; }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  document.body.appendChild(backdrop);
};

import { Provider } from 'react-redux'
import { store } from './store/index'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
