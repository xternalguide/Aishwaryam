import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuditLogger } from './utils/auditLogger';

// ── TELEMETRY TRACKER COMPONENT ─────────────────────────────────────────────
const TelemetryTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the page view
    AuditLogger.log('View', location.pathname, `Navigated to ${location.pathname}`);
  }, [location.pathname]);

  useEffect(() => {
    // Click tracker
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest interactive element
      const interactiveEl = target.closest('button, a, input, select, textarea, [role="button"]');
      if (interactiveEl) {
        const text = (interactiveEl.textContent || (interactiveEl as HTMLInputElement).value || interactiveEl.getAttribute('aria-label') || '').trim().substring(0, 50);
        const typeName = interactiveEl.tagName.toLowerCase();
        AuditLogger.log(
          'Click',
          location.pathname,
          `Clicked ${typeName} "${text}"`,
          {
            element: typeName,
            text,
            id: interactiveEl.id,
            className: interactiveEl.className
          }
        );
      }
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [location.pathname]);

  return null;
};
// ────────────────────────────────────────────────────────────────────────────

// ── SCROLL TO TOP ON EVERY ROUTE CHANGE ─────────────────────────────────────
// Resets both window scroll and the #root element scroll on every navigation.
// This replaces the deleted ScrollToTop component.
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Reset window scroll
    window.scrollTo(0, 0);
    // Also reset the #root element which is the main scroll container
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;

    // Dynamically sync body background color to match active screen theme
    const path = pathname.toLowerCase();
    if (path.includes('/welcome')) {
      document.body.style.background = 'var(--gradient-brand)';
    } else if (path.includes('/login') || path.includes('/mpin') || path.includes('/profilesetup') || path.includes('/onboarding')) {
      document.body.style.background = 'var(--surface-light)';
    } else if (
      path.includes('/price-calculator') || 
      path.includes('/scheme') || 
      path.includes('/completed-schemes') ||
      path.includes('/portfolio') ||
      path.includes('/privacy') ||
      path.includes('/terms') ||
      path.includes('/faq') ||
      path.includes('/how-it-works') ||
      path.includes('/my-bonuses')
    ) {
      document.body.style.background = '#F8F9FA';
    } else if (path.includes('/dashboard')) {
      document.body.style.background = '#F0EDE8'; // Matches the home/dashboard tab page background
    } else {
      document.body.style.background = '#ffffff';
    }
  }, [pathname]);
  return null;
};
// ────────────────────────────────────────────────────────────────────────────

import { Splash } from './screens/Splash';
import { Welcome } from './screens/Welcome';
import { Login } from './screens/Login';
import { Mpin } from './screens/Mpin';
import { ProfileSetup } from './screens/ProfileSetup';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { SchemeExplorer } from './screens/SchemeExplorer';
import { SchemeDetail } from './screens/SchemeDetail';
import { PortfolioAnalytics } from './screens/PortfolioAnalytics';
import { PaymentSuccess } from './screens/PaymentSuccess';
import { PaymentFailed } from './screens/PaymentFailed';
import { PrivacyPolicy } from './screens/PrivacyPolicy';
import { TermsConditions } from './screens/TermsConditions';
import { ProfileAddress, ProfileKyc } from './screens/ProfilePages';
import { ChangeMpin } from './screens/ChangeMpin';
import { PriceCalculatorPage } from './screens/PriceCalculatorPage';
import { CompletedSchemesPage } from './screens/CompletedSchemesPage';
import {
  HowItWorks,
  Faq,
  SafetyTrust,
  About,
  RedemptionGuide,
  WhyGold,
  DigiGoldInfo,
  AiAssistant,
  Referral,
  LegalHub,
  GoldRateAlerts,
  MyBonuses,
  Notifications
} from './screens/InfoPages';
import { AppProvider } from './context/AppContext';
import { PushNotificationHandler } from './components/PushNotificationHandler';
import { BackButtonHandler } from './components/BackButtonHandler';
import { SuperAdminDashboard } from './screens/super-admin/SuperAdminDashboard';
import { PromotionalOffersPage } from './screens/PromotionalOffersPage';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import './App.css';

// ── CUSTOM PREMIUM OFFLINE SCREEN ──────────────────────────────────────────
const OfflineScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'white',
      padding: '24px',
      boxSizing: 'border-box',
      textAlign: 'center',
      fontFamily: 'var(--font-poppins)'
    }}>
      <style>{`
        @keyframes float-sat {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
      
      {/* Animated SVG Satellite Illustration matching the screenshot */}
      <div style={{ animation: 'float-sat 4s ease-in-out infinite', width: '220px', height: '220px', marginBottom: '24px' }}>
        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none">
          {/* Earth/Signal lines in background */}
          <path d="M40,150 Q100,120 160,150" stroke="#E0E0E0" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M60,165 Q100,140 140,165" stroke="#E0E0E0" strokeWidth="2" strokeDasharray="4 4" />

          {/* Left Solar Panel */}
          <rect x="25" y="75" width="45" height="25" rx="3" fill="url(#panelGrad)" stroke="#1976D2" strokeWidth="1.5" transform="rotate(-15 47 87)" />
          <line x1="28" y1="84" x2="68" y2="74" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="32" y1="94" x2="63" y2="86" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          
          {/* Right Solar Panel */}
          <rect x="130" y="85" width="45" height="25" rx="3" fill="url(#panelGrad)" stroke="#1976D2" strokeWidth="1.5" transform="rotate(15 152 97)" />
          <line x1="132" y1="92" x2="172" y2="102" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="137" y1="83" x2="167" y2="91" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

          {/* Panel connectors */}
          <line x1="70" y1="92" x2="88" y2="98" stroke="#78909C" strokeWidth="3" strokeLinecap="round" />
          <line x1="112" y1="102" x2="130" y2="96" stroke="#78909C" strokeWidth="3" strokeLinecap="round" />

          {/* Satellite Body */}
          <rect x="85" y="80" width="30" height="42" rx="4" fill="url(#bodyGrad)" stroke="#B71C1C" strokeWidth="2" transform="rotate(10 100 101)" />
          <circle cx="100" cy="101" r="5" fill="#FFE082" />

          {/* Dish Antenna */}
          <path d="M82,132 C82,118 118,118 118,132" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" transform="rotate(10 100 126)" />
          <line x1="100" y1="124" x2="100" y2="136" stroke="#5D4037" strokeWidth="3" transform="rotate(10 100 126)" />
          
          {/* Signal waves (fading/disabled) */}
          <path d="M90,146 Q100,152 110,146" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round" />
          <path d="M85,154 Q100,162 115,154" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />

          {/* Red Circle with "X" Badge overlaid at the bottom-right of the satellite */}
          <circle cx="116" cy="122" r="15" fill="#EF4444" stroke="white" strokeWidth="2.5" />
          <path d="M111,117 L121,127 M121,117 L111,127" stroke="white" strokeWidth="2.5" strokeLinecap="round" />

          {/* Gradients */}
          <defs>
            <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#42A5F5" />
              <stop offset="100%" stopColor="#0D47A1" />
            </linearGradient>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF7043" />
              <stop offset="100%" stopColor="#D84315" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h2 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1A1200',
        margin: '0 0 8px 0',
        letterSpacing: '0.5px'
      }}>
        No Internet Connection
      </h2>
      
      <p style={{
        fontSize: '12.5px',
        color: '#666666',
        margin: '0 0 28px 0',
        lineHeight: '18px',
        maxWidth: '260px'
      }}>
        Please check your connection or try again later.
      </p>

      <button
        onClick={onRetry}
        style={{
          width: '180px',
          height: '44px',
          borderRadius: '22px',
          background: 'var(--brand-dark)',
          color: 'white',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '13.5px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px var(--brand-glow)',
          transition: 'transform 0.1s ease'
        }}
      >
        Try Again
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Initialize audit logger
    AuditLogger.initialize();

    // Programmatically style and set translucent to false for native platforms
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false })
        .then(() => StatusBar.setBackgroundColor({ color: '#4A0E4E' }))
        .then(() => StatusBar.setStyle({ style: Style.Dark }))
        .catch(err => console.log('Capacitor StatusBar error:', err));
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Global error listener for automatic bug tracking
    const handleGlobalError = (event: ErrorEvent) => {
      AuditLogger.logError(event.error || event.message, 'UnhandledError');
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      AuditLogger.logError(event.reason, 'UnhandledPromiseRejection');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetryConnection = () => {
    setIsOffline(!navigator.onLine);
  };

  if (isOffline) {
    return <OfflineScreen onRetry={handleRetryConnection} />;
  }

  return (
    <div className="app-container">
      <AppProvider>
        <Router>
          <ScrollToTop />
          <TelemetryTracker />
          <PushNotificationHandler />
          <BackButtonHandler />
          <Routes>
            {/* Auth & Onboarding Flow */}
            <Route path="/" element={<Splash />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mpin/change" element={<ChangeMpin />} />
            <Route path="/mpin/:mode" element={<Mpin />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* Main Dashboard & Actions */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scheme-explorer" element={<SchemeExplorer />} />
            <Route path="/scheme-detail/:schemeId" element={<SchemeDetail />} />
            <Route path="/portfolio-analytics" element={<PortfolioAnalytics />} />
            <Route path="/payment-success/:receiptJson" element={<PaymentSuccess />} />
            <Route path="/payment-failed/:errorJson" element={<PaymentFailed />} />

            {/* Profile Sub Pages */}
            <Route path="/profile/address" element={<ProfileAddress />} />
            <Route path="/profile/kyc" element={<ProfileKyc />} />
            <Route path="/profile/price-calculator" element={<PriceCalculatorPage />} />
            <Route path="/profile/completed-schemes" element={<CompletedSchemesPage />} />

            {/* Informational Guides & Alerts */}
            <Route path="/how_it_works" element={<HowItWorks />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/safety_trust" element={<SafetyTrust />} />
            <Route path="/about" element={<About />} />
            <Route path="/redemption_guide" element={<RedemptionGuide />} />
            <Route path="/why_gold" element={<WhyGold />} />
            <Route path="/digi_gold_info" element={<DigiGoldInfo />} />
            <Route path="/ai_assistant" element={<AiAssistant />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/legal_hub" element={<LegalHub />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/gold_rate_alerts" element={<GoldRateAlerts />} />
            <Route path="/my-bonuses" element={<MyBonuses />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/offers" element={<PromotionalOffersPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </div>
  );
};

export default App;
