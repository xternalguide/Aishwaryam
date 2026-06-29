import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { useApp } from '../context/AppContext';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading } = useApp();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [maxTimeReached, setMaxTimeReached] = useState(false);

  // Enforce minimum display time of 2.2s for the premium splash animation
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2200);
    return () => clearTimeout(minTimer);
  }, []);

  // Enforce maximum timeout of 5.0s to avoid getting stuck if offline
  useEffect(() => {
    const maxTimer = setTimeout(() => {
      setMaxTimeReached(true);
    }, 5000);
    return () => clearTimeout(maxTimer);
  }, []);

  useEffect(() => {
    const userId = SessionManager.getUserId();
    const hasSeenWelcome = SessionManager.hasSeenWelcomeOnboarding();
    const hasToken = SessionManager.getToken() != null;
    const stage = SessionManager.getOnboardingStage();

    // We wait for data pre-fetching if the user has an active session
    const isWaitingForData = hasToken && userId && isLoading && !maxTimeReached;

    if (minTimeElapsed && !isWaitingForData) {
      if (!hasSeenWelcome) {
        navigate('/welcome');
      } else if (!hasToken) {
        if (SessionManager.getPhoneNumber()) {
          navigate('/mpin/verify');
        } else {
          navigate('/login');
        }
      } else if (stage === OnboardingStage.OTP_VERIFIED) {
        navigate('/mpin/setup');
      } else if (stage === OnboardingStage.MPIN_CREATED) {
        navigate('/profile-setup');
      } else {
        // Option B: Show the MPIN screen on reopen, bypassing the login/OTP screens
        navigate('/mpin/verify');
      }
    }
  }, [minTimeElapsed, maxTimeReached, isLoading, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--gradient-brand)',
      color: 'white',
      textAlign: 'center'
    }}>
      <div className="splash-logo-animated">
        <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                boxShadow: '0 6px 12px rgba(74, 14, 78, 0.15)',
                objectFit: 'cover',
                marginBottom: '8px'
              }}
            />
        <h1 style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-playfair)', fontSize: '26px', marginBottom: '8px' }}>
          AISHWARYAM @ YOUR HOME
        </h1>
        {/* <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', letterSpacing: '2px' }}>
          
        </p> */}
      </div>
    </div>
  );
};
