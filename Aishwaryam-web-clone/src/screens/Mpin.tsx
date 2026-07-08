import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';
import { AuditLogger } from '../utils/auditLogger';

const MpinFlowState = {
  ENTER_PIN: 'ENTER_PIN',
  SETUP_PIN: 'SETUP_PIN',
  FORGOT_ENTER_OTP: 'FORGOT_ENTER_OTP',
  FORGOT_NEW_PIN: 'FORGOT_NEW_PIN'
} as const;

type MpinFlowState = typeof MpinFlowState[keyof typeof MpinFlowState];

export const Mpin: React.FC = () => {
  const navigate = useNavigate();
  const { refreshData } = useApp();
  const { t, lang } = useTranslation();
  const { mode } = useParams<{ mode: 'setup' | 'verify' | 'change' }>();
  const isSetupMode = mode === 'setup' || mode === 'change';

  // Screen state machine
  const [flowState, setFlowState] = useState<MpinFlowState>(
    isSetupMode ? MpinFlowState.SETUP_PIN : MpinFlowState.ENTER_PIN
  );

  // Input states
  const [mpin, setMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [otp, setOtp] = useState('');

  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Focus states for derived visual active styling
  const [isMpinFocused, setIsMpinFocused] = useState(false);
  const [isNewMpinFocused, setIsNewMpinFocused] = useState(false);
  const [isConfirmMpinFocused, setIsConfirmMpinFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);

  // Refs for focusing inputs
  const mpinInputRef = useRef<HTMLInputElement>(null);
  const newMpinInputRef = useRef<HTMLInputElement>(null);
  const confirmMpinInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Focus helper on flow switch
  useEffect(() => {
    setErrorMsg(null);
    setMpin('');
    setNewMpin('');
    setConfirmMpin('');
    setOtp('');

    setTimeout(() => {
      if (flowState === MpinFlowState.ENTER_PIN && mpinInputRef.current) {
        mpinInputRef.current.focus();
      } else if ((flowState === MpinFlowState.SETUP_PIN || flowState === MpinFlowState.FORGOT_NEW_PIN) && newMpinInputRef.current) {
        newMpinInputRef.current.focus();
      } else if (flowState === MpinFlowState.FORGOT_ENTER_OTP && otpInputRef.current) {
        otpInputRef.current.focus();
      }
    }, 150);
  }, [flowState]);

  // Countdown timer for OTP reset
  useEffect(() => {
    let interval: any;
    if (flowState === MpinFlowState.FORGOT_ENTER_OTP && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [flowState, secondsRemaining]);

  // Kotak-style blinking pin box style
  const mpinStyles = `
    @keyframes pinBoxBlink {
      0%, 100% { border-color: #4A0E4E; box-shadow: 0 0 0 2px rgba(74,14,78,0.2); }
      50%       { border-color: rgba(74,14,78,0.25); box-shadow: none; }
    }
    .pin-box-active { animation: pinBoxBlink 0.9s ease-in-out infinite !important; border-color: #4A0E4E !important; }
    @keyframes spin  { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  // Layer 1: Reactively clear error whenever ANY pin input value is actively typed/changed (non-empty).
  useEffect(() => {
    if (errorMsg && (mpin || newMpin || confirmMpin || otp)) {
      setErrorMsg(null);
    }
  }, [mpin, newMpin, confirmMpin, otp]);

  // Layer 2: Auto-dismiss error after 4 seconds as an absolute safety net.
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // Handle verify existing MPIN
  const handleVerifyExistingMpin = async (val: string) => {
    if (val.length !== 4) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await ApiClient.post('api/Auth/verify-mpin', {
        mpin: val,
        phoneNumber: SessionManager.getPhoneNumber() || '',
        deviceFingerprint: ApiClient.getDeviceFingerprint()
      });
      if (response.data && response.data.success) {
        const userId = response.data.userId || SessionManager.getUserId() || '';
        const token = response.data.token || response.data.accessToken || SessionManager.getToken() || '';
        const refreshToken = response.data.refreshToken || SessionManager.getRefreshToken() || '';
        SessionManager.saveSession(userId, token, refreshToken);
        SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
        
        try {
          await refreshData(false);
        } catch (preloadErr) {
          console.warn('Preload failed on login:', preloadErr);
        }
        setSuccessMessage(lang === 'ta' ? 'யாஹூ! உங்கள் கணக்கு வெற்றிகரமாக சரிபார்க்கப்பட்டது.' : 'Yahoo! You have successfully verified the account.');
        setShowSuccessDialog(true);
      } else {
        const errorText = response.data.message || 'Incorrect PIN. Please try again.';
        AuditLogger.log('Error', '/mpin/verify', `Failed MPIN authentication attempt: ${errorText}`);
        if (errorText.toLowerCase().includes('not found')) {
          SessionManager.clearSession();
          setErrorMsg('User not found. Redirecting to registration...');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setErrorMsg(errorText);
          setMpin('');
          mpinInputRef.current?.focus();
        }
      }
    } catch (err: any) {
      const errorText = err.response?.data?.message || 'Incorrect PIN. Please try again.';
      AuditLogger.log('Error', '/mpin/verify', `MPIN verification error: ${errorText}`);
      
      const isIncorrectMpin = err.response?.status === 401 && 
                              (errorText.toLowerCase().includes('incorrect') || errorText.toLowerCase().includes('pin'));

      const isUserNotFound = !isIncorrectMpin && (
                               err.response?.status === 404 || 
                               err.response?.status === 401 || 
                               errorText.toLowerCase().includes('not found') || 
                               errorText.toLowerCase().includes('unauthorized')
                             );
                             
      if (isUserNotFound) {
        SessionManager.clearSession();
        setErrorMsg(lang === 'ta' ? 'பயனர் கண்டறியப்படவில்லை. மீண்டும் பதிவு செய்யவும்...' : 'User not found. Redirecting to registration...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setErrorMsg(errorText);
        setMpin('');
        mpinInputRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save/create MPIN
  const handleSaveMpin = async (overrideConfirm?: string) => {
    const finalConfirm = overrideConfirm !== undefined ? overrideConfirm : confirmMpin;
    if (newMpin !== finalConfirm) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await ApiClient.post('api/Auth/set-mpin', {
        mpin: newMpin,
        phoneNumber: SessionManager.getPhoneNumber() || ''
      });
      if (response.data && response.data.success) {
        setSuccessMessage(
          mode === 'change'
            ? (lang === 'ta' ? 'பின் எண் வெற்றிகரமாக மாற்றப்பட்டது!' : 'PIN Changed Successfully!')
            : flowState === MpinFlowState.SETUP_PIN
              ? (lang === 'ta' ? 'பின் எண் வெற்றிகரமாக அமைக்கப்பட்டது!' : 'PIN Set Successfully!')
              : (lang === 'ta' ? 'பின் எண் வெற்றிகரமாக மீட்டமைக்கப்பட்டது!' : 'PIN Reset Successfully!')
        );
        setShowSuccessDialog(true);
      } else {
        setErrorMsg(response.data.message || 'Failed to update PIN.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot PIN OTP verification
  const handleVerifyOtp = async (val: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await ApiClient.post('api/Auth/verify-otp', {
        phoneNumber: SessionManager.getPhoneNumber() || '',
        otp: val,
        deviceFingerprint: ApiClient.getDeviceFingerprint()
      });
      if (response.data && response.data.success) {
        const { token, refreshToken, userId } = response.data;
        SessionManager.saveSession(userId, token, refreshToken);
        setFlowState(MpinFlowState.FORGOT_NEW_PIN);
      } else {
        setErrorMsg(response.data.message || 'Invalid verification code.');
        setOtp('');
        otpInputRef.current?.focus();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid verification code.');
      setOtp('');
      otpInputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const triggerForgotPinOtp = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const phoneNum = SessionManager.getPhoneNumber() || '';
      await ApiClient.post('api/Auth/send-otp', { phoneNumber: phoneNum });
      setSecondsRemaining(60);
      setFlowState(MpinFlowState.FORGOT_ENTER_OTP);
    } catch (err) {
      setSecondsRemaining(60);
      setFlowState(MpinFlowState.FORGOT_ENTER_OTP);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccessDialog(false);
    if (mode === 'change') {
      localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
      navigate('/dashboard');
    } else if (flowState === MpinFlowState.SETUP_PIN) {
      SessionManager.saveOnboardingStage(OnboardingStage.MPIN_CREATED);
      navigate('/profile-setup');
    } else if (flowState === MpinFlowState.FORGOT_NEW_PIN) {
      setFlowState(MpinFlowState.ENTER_PIN);
    } else if (flowState === MpinFlowState.ENTER_PIN) {
      localStorage.setItem('DASHBOARD_ACTIVE_TAB', '0');
      navigate('/dashboard');
    }
  };

  // Auto-dismiss success dialog and transition automatically
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleSuccessDismiss();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, flowState]);

  return (
    <div className="auth-page-root auth-page-bg" style={{
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      <style>{mpinStyles}</style>
      <div className="responsive-form-container" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* MPIN Central Card */}
        <div className="glass-card" style={{
          width: '100%',
          borderRadius: '24px',
          background: 'white',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 'auto',
          marginBottom: 'auto'
        }}>
          {/* Branding Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
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
            <span style={{
              fontFamily: 'var(--font-playfair)',
              color: 'var(--brand-deep)',
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {t('app_name')}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-playfair)',
            color: 'var(--brand-deep)',
            fontSize: lang === 'ta' ? '18px' : '22px',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {flowState === MpinFlowState.ENTER_PIN && t('enter_pin')}
            {flowState === MpinFlowState.SETUP_PIN && (mode === 'change' ? t('change_login_pin') : t('set_your_pin'))}
            {flowState === MpinFlowState.FORGOT_ENTER_OTP && t('verify_otp')}
            {flowState === MpinFlowState.FORGOT_NEW_PIN && t('reset_your_pin')}
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: '16px',
            marginBottom: '24px',
            padding: '0 8px'
          }}>
            {flowState === MpinFlowState.ENTER_PIN && t('enter_pin_desc')}
            {flowState === MpinFlowState.SETUP_PIN && (mode === 'change' ? t('create_confirm_pin_desc') : t('create_secure_pin_desc'))}
            {flowState === MpinFlowState.FORGOT_ENTER_OTP && t('otp_sent_desc')}
            {flowState === MpinFlowState.FORGOT_NEW_PIN && t('create_repeat_pin_desc')}
          </p>

          {errorMsg && (
            <div style={{
              color: 'var(--error-red)',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              {errorMsg}
            </div>
          )}

          {/* State Renderers */}
          {flowState === MpinFlowState.ENTER_PIN && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}>
              {/* Hidden input for PIN */}
              <input
                ref={mpinInputRef}
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={mpin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setMpin(val);
                  if (errorMsg) setErrorMsg(null);
                  if (val.length === 4) {
                    mpinInputRef.current?.blur();
                    handleVerifyExistingMpin(val);
                  }
                }}
                onFocus={() => setIsMpinFocused(true)}
                onBlur={() => setIsMpinFocused(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '56px',
                  opacity: 0,
                  zIndex: 2,
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              />

              <div 
                style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px', cursor: 'pointer' }}
              >
                {Array.from({ length: 4 }).map((_, i) => {
                  const isFocused = isMpinFocused && (mpin.length < 4 ? mpin.length === i : i === 3);
                  return (
                    <div
                      key={i}
                      className={isFocused ? 'pin-box-active' : ''}
                      style={{
                        width: 'clamp(40px, 12vw, 52px)',
                        height: 'clamp(40px, 12vw, 52px)',
                        borderRadius: '14px',
                        border: `2px solid ${isFocused ? '#4A0E4E' : mpin[i] ? '#4A0E4E' : 'rgba(74,14,78,0.2)'}`,
                        textAlign: 'center',
                        fontSize: mpin[i] ? 'clamp(20px, 6vw, 28px)' : '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: mpin[i] ? 'rgba(74,14,78,0.06)' : '#F9F9F9',
                        color: '#4A0E4E',
                        fontWeight: '900',
                        transition: 'border-color 0.2s ease, background 0.2s ease',
                      } as React.CSSProperties}
                    >
                      {mpin[i] ? '●' : ''}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleVerifyExistingMpin(mpin)}
                disabled={mpin.length !== 4 || isLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  background: mpin.length === 4 ? 'var(--brand-dark)' : 'var(--text-light)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: mpin.length === 4 ? 'pointer' : 'default',
                  marginTop: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  t('verify_pin')
                )}
              </button>

              <button
                onClick={triggerForgotPinOtp}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brand-dark)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {t('forgot_pin_reset')}
              </button>
            </div>
          )}

          {(flowState === MpinFlowState.SETUP_PIN || flowState === MpinFlowState.FORGOT_NEW_PIN) && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
              {/* Hidden inputs for Set PIN */}

              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>{t('enter_new_pin')}</span>
                <input
                  ref={newMpinInputRef}
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={newMpin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setNewMpin(val);
                    if (errorMsg) setErrorMsg(null);
                    if (val.length === 4) {
                      confirmMpinInputRef.current?.focus();
                    }
                  }}
                  onFocus={() => setIsNewMpinFocused(true)}
                  onBlur={() => setIsNewMpinFocused(false)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    zIndex: 2,
                    cursor: 'pointer',
                    fontSize: '24px'
                  }}
                />
                <div 
                  style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px', cursor: 'pointer' }}
                >
                  {Array.from({ length: 4 }).map((_, i) => {
                    const isFocused = isNewMpinFocused && (newMpin.length < 4 ? newMpin.length === i : i === 3);
                    return (
                      <div
                        key={i}
                        className={isFocused ? 'pin-box-active' : ''}
                      style={{
                          width: 'clamp(36px, 11vw, 48px)',
                          height: 'clamp(36px, 11vw, 48px)',
                          borderRadius: '12px',
                          border: `2px solid ${isFocused ? '#4A0E4E' : newMpin[i] ? '#4A0E4E' : 'rgba(74,14,78,0.2)'}`,
                          textAlign: 'center',
                          fontSize: '20px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: newMpin[i] ? 'rgba(74,14,78,0.06)' : '#F9F9F9',
                          color: '#4A0E4E',
                          transition: 'border-color 0.2s ease, background 0.2s ease',
                        } as React.CSSProperties}
                      >
                        {newMpin[i] || ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>{t('confirm_new_pin')}</span>
                <input
                  ref={confirmMpinInputRef}
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmMpin}
                  disabled={newMpin.length !== 4}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setConfirmMpin(val);
                    if (errorMsg) setErrorMsg(null);
                    if (val.length === 4) {
                      confirmMpinInputRef.current?.blur();
                    }
                  }}
                  onFocus={() => setIsConfirmMpinFocused(true)}
                  onBlur={() => setIsConfirmMpinFocused(false)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    zIndex: 2,
                    cursor: newMpin.length === 4 ? 'pointer' : 'default',
                    fontSize: '24px'
                  }}
                />
                <div 
                  style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px', cursor: newMpin.length === 4 ? 'pointer' : 'default' }}
                >
                  {Array.from({ length: 4 }).map((_, i) => {
                    const isFocused = isConfirmMpinFocused && (confirmMpin.length < 4 ? confirmMpin.length === i : i === 3);
                    return (
                      <div
                        key={i}
                        className={isFocused ? 'pin-box-active' : ''}
                      style={{
                          width: 'clamp(36px, 11vw, 48px)',
                          height: 'clamp(36px, 11vw, 48px)',
                          borderRadius: '12px',
                          border: `2px solid ${isFocused ? '#4A0E4E' : confirmMpin[i] ? '#4A0E4E' : newMpin.length === 4 ? 'rgba(74,14,78,0.2)' : 'rgba(74,14,78,0.08)'}`,
                          textAlign: 'center',
                          fontSize: '20px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: confirmMpin[i] ? 'rgba(74,14,78,0.06)' : newMpin.length === 4 ? '#F9F9F9' : '#ECECEC',
                          color: '#4A0E4E',
                          transition: 'border-color 0.2s ease, background 0.2s ease',
                        } as React.CSSProperties}
                      >
                        {confirmMpin[i] || ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {newMpin.length === 4 && confirmMpin.length === 4 && newMpin !== confirmMpin && (
                <span style={{ color: 'var(--error-red)', fontSize: '12px', textAlign: 'center', fontWeight: 'bold', marginTop: '4px' }}>
                  {t('pins_do_not_match')}
                </span>
              )}

              <button
                onClick={() => handleSaveMpin()}
                disabled={newMpin.length !== 4 || confirmMpin.length !== 4 || newMpin !== confirmMpin || isLoading}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '12px',
                  background: (newMpin.length === 4 && confirmMpin.length === 4 && newMpin === confirmMpin) ? 'var(--brand-dark)' : 'var(--text-light)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: (newMpin.length === 4 && confirmMpin.length === 4 && newMpin === confirmMpin) ? 'pointer' : 'default',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isLoading ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  lang === 'ta' ? 'சேமி' : 'Save'
                )}
              </button>

              {flowState === MpinFlowState.FORGOT_NEW_PIN && (
                <button
                  onClick={() => setFlowState(MpinFlowState.ENTER_PIN)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '500',
                    marginTop: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel')}
                </button>
              )}
            </div>
          )}

          {flowState === MpinFlowState.FORGOT_ENTER_OTP && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {/* Hidden OTP input */}
              <input
                ref={otpInputRef}
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                  if (errorMsg) setErrorMsg(null);
                  if (val.length === 6) {
                    otpInputRef.current?.blur();
                    handleVerifyOtp(val);
                  }
                }}
                onFocus={() => setIsOtpFocused(true)}
                onBlur={() => setIsOtpFocused(false)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  width: '1px',
                  height: '1px'
                }}
              />

              <div 
                onClick={() => otpInputRef.current?.focus()}
                style={{ display: 'flex', gap: 'clamp(4px, 2vw, 8px)', justifyContent: 'center', marginBottom: '24px', width: '100%', cursor: 'pointer' }}
              >
                {Array.from({ length: 6 }).map((_, i) => {
                  const isFocused = isOtpFocused && (otp.length < 6 ? otp.length === i : i === 5);
                  return (
                    <div
                      key={i}
                      className={isFocused ? 'pin-box-active' : ''}
                      style={{
                        width: 'clamp(28px, 8.5vw, 36px)',
                        height: 'clamp(28px, 8.5vw, 36px)',
                        borderRadius: '8px',
                        border: `1.5px solid ${isFocused ? '#4A0E4E' : otp[i] ? '#4A0E4E' : 'rgba(74,14,78,0.15)'}`,
                        textAlign: 'center',
                        fontSize: 'clamp(12px, 4vw, 16px)',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F9F9F9',
                        color: '#4A0E4E',
                        transition: 'border-color 0.2s ease, background 0.2s ease',
                      } as React.CSSProperties}
                    >
                      {otp[i] || ''}
                    </div>
                  );
                })}
              </div>

              {secondsRemaining > 0 ? (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {lang === 'ta' ? `மீண்டும் அனுப்ப ${secondsRemaining} விநாடிகள்` : `Resend in ${secondsRemaining}s`}
                </span>
              ) : (
                <button
                  onClick={triggerForgotPinOtp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-dark)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  {lang === 'ta' ? 'மீண்டும் OTP அனுப்பவும்' : 'Resend OTP'}
                </button>
              )}

              <button
                onClick={() => setFlowState(MpinFlowState.ENTER_PIN)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ta' ? 'பின் உள்நுழைவுக்குத் திரும்பவும்' : 'Back to PIN Login'}
              </button>
            </div>
          )}

          {/* Security Notice */}
          <div style={{
            background: 'rgba(74, 14, 78, 0.04)',
            border: '1px solid rgba(74, 14, 78, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '11px',
            color: 'var(--brand-deep)',
            lineHeight: '16px',
            textAlign: 'center',
            marginTop: '20px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            🔐 <strong>{lang === 'ta' ? 'உங்கள் பாதுகாப்பிற்கு:' : 'For your security:'}</strong> {t('pin_security_notice')}
          </div>
        </div>
      </div>

      {/* Success tick full screen overlay */}
      {showSuccessDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, #111a14 0%, #060907 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          color: 'white',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Circular Success Checkmark Container with sparks */}
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px'
          }}>
            {/* Sparkles / Dots around the circle to match the image */}
            {/* Dot 1: Top-Right green */}
            <div style={{ position: 'absolute', top: '22px', right: '55px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.8 }} />
            {/* Dot 2: Right medium green */}
            <div style={{ position: 'absolute', top: '62px', right: '28px', width: '13px', height: '13px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)' }} />
            {/* Dot 3: Bottom-Right small white */}
            <div style={{ position: 'absolute', bottom: '60px', right: '22px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ffffff', opacity: 0.6 }} />
            {/* Dot 4: Bottom green */}
            <div style={{ position: 'absolute', bottom: '30px', left: '110px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.9 }} />
            {/* Dot 5: Bottom-Left small white */}
            <div style={{ position: 'absolute', bottom: '25px', left: '60px', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#ffffff', opacity: 0.5 }} />
            {/* Dot 6: Left-Bottom green */}
            <div style={{ position: 'absolute', bottom: '65px', left: '32px', width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            {/* Dot 7: Left-Top small white */}
            <div style={{ position: 'absolute', top: '75px', left: '18px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ffffff', opacity: 0.7 }} />
            {/* Dot 8: Top-Left small green */}
            <div style={{ position: 'absolute', top: '40px', left: '72px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#22c55e', opacity: 0.8 }} />
            
            {/* Inner Circle containing checkmark */}
            <div className="animate-tick-success" style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'transparent',
              border: '3px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(34, 197, 94, 0.4)'
            }}>
              {/* Clean Checkmark SVG */}
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12L12 20L28 4" stroke="#22c55e" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Title: Successfully */}
          <h2 style={{
            fontSize: '34px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-poppins)',
            color: 'white',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            {lang === 'ta' ? 'வெற்றிகரமாக முடிந்தது' : 'Successfully'}
          </h2>

          {/* Subtitle: Details */}
          <p style={{
            fontSize: '15px',
            color: '#A0AEC0',
            textAlign: 'center',
            marginTop: '16px',
            maxWidth: '280px',
            lineHeight: '1.6',
            marginRight: 'auto',
            marginLeft: 'auto',
            padding: '0 16px',
            fontFamily: 'var(--font-poppins)'
          }}>
            {successMessage}
          </p>
        </div>
      )}

      {/* Minimal loading indicator - thin top bar instead of full overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 2000,
          background: 'linear-gradient(90deg, #FFD700, #C2185B, #4A0E4E)',
          animation: 'loadingBar 1.2s ease-in-out infinite'
        }} />
      )}
    </div>
  );
};

export default Mpin;
