import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Splash } from './screens/Splash';
import { Welcome } from './screens/Welcome';
import { Login } from './screens/Login';
import { Mpin } from './screens/Mpin';
import { ProfileSetup } from './screens/ProfileSetup';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { BuyGold } from './screens/BuyGold';
import { SellGold } from './screens/SellGold';
import { SchemeExplorer } from './screens/SchemeExplorer';
import { SchemeDetail } from './screens/SchemeDetail';
import { SchemeRedemption } from './screens/SchemeRedemption';
import { AddBankAccount } from './screens/AddBankAccount';
import { PortfolioAnalytics } from './screens/PortfolioAnalytics';
import { PaymentSuccess } from './screens/PaymentSuccess';
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
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <AppProvider>
        <Router>
          <PushNotificationHandler />
          <BackButtonHandler />
          <Routes>
            {/* Auth & Onboarding Flow */}
            <Route path="/" element={<Splash />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
          <Route path="/mpin/:mode" element={<Mpin />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Main Dashboard & Actions */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/buy-gold" element={<BuyGold />} />
          <Route path="/sell-gold" element={<SellGold />} />
          <Route path="/scheme-explorer" element={<SchemeExplorer />} />
          <Route path="/scheme-detail/:schemeId" element={<SchemeDetail />} />
          <Route path="/scheme-redemption/:schemeId" element={<SchemeRedemption />} />
          <Route path="/add-bank-account" element={<AddBankAccount />} />
          <Route path="/portfolio-analytics" element={<PortfolioAnalytics />} />
          <Route path="/payment-success/:receiptJson" element={<PaymentSuccess />} />

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
          <Route path="/gold_rate_alerts" element={<GoldRateAlerts />} />
          <Route path="/my_bonuses" element={<MyBonuses />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AppProvider>
    </div>
  );
};

export default App;
