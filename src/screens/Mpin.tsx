import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';

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
  const { t } = useTranslation();
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for focusing inputs
  const mpinRef = useRef<HTMLInputElement[]>([]);
  const newMpinRef = useRef<HTMLInputElement[]>([]);
  const confirmMpinRef = useRef<HTMLInputElement[]>([]);
  const otpRef = useRef<HTMLInputElement[]>([]);

  // Focus helper on flow switch
  useEffect(() => {
    setErrorMsg(null);
    setMpin('');
    setNewMpin('');
    setConfirmMpin('');
    setOtp('');

    setTimeout(() => {
      if (flowState === MpinFlowState.ENTER_PIN && mpinRef.current[0]) {
        mpinRef.current[0].focus();
      } else if ((flowState === MpinFlowState.SETUP_PIN || flowState === MpinFlowState.FORGOT_NEW_PIN) && newMpinRef.current[0]) {
        newMpinRef.current[0].focus();
      } else if (flowState === MpinFlowState.FORGOT_ENTER_OTP && otpRef.current[0]) {
        otpRef.current[0].focus();
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

  // Loading progress animation effect (0% to 95%)
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          const next = prev + Math.floor(Math.random() * 8) + 3; // increment by 3-10%
          return next > 95 ? 95 : next;
        });
      }, 50);
    } else {
      setLoadingProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

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
        SessionManager.saveSession(response.data.userId, response.data.token, response.data.refreshToken);
        SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
        
        // Await all API calls so Dashboard gets live prices and schemes before transition
        await refreshData();
        
        // Complete the progress to 100% smoothly
        setLoadingProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 250));
        
        setSuccessMessage('Login Successful!');
        setShowSuccessDialog(true);
      } else {
        setErrorMsg(response.data.message || 'Incorrect PIN. Please try again.');
        setMpin('');
        if (mpinRef.current[0]) mpinRef.current[0].focus();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Incorrect PIN. Please try again.');
      setMpin('');
      if (mpinRef.current[0]) mpinRef.current[0].focus();
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
        // Complete progress to 100% smoothly
        setLoadingProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 250));
        setSuccessMessage(mode === 'change' ? 'PIN Changed Successfully!' : flowState === MpinFlowState.SETUP_PIN ? 'PIN Set Successfully!' : 'PIN Reset Successfully!');
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
        otp: val
      });
      if (response.data && response.data.success) {
        // Complete progress to 100% smoothly
        setLoadingProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 250));
        const { token, refreshToken, userId } = response.data;
        SessionManager.saveSession(userId, token, refreshToken);
        setFlowState(MpinFlowState.FORGOT_NEW_PIN);
      } else {
        setErrorMsg(response.data.message || 'Invalid verification code.');
        setOtp('');
        if (otpRef.current[0]) otpRef.current[0].focus();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid verification code.');
      setOtp('');
      if (otpRef.current[0]) otpRef.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Keypad navigation helpers
  const handlePinBoxChange = (
    index: number,
    val: string,
    stateSetter: React.Dispatch<React.SetStateAction<string>>,
    currentState: string,
    inputsRef: React.MutableRefObject<HTMLInputElement[]>,
    length: number,
    onComplete: (completedVal: string) => void
  ) => {
    const clean = val.replace(/\D/g, '').slice(0, 1);
    const pinArray = currentState.split('');
    pinArray[index] = clean;
    const nextVal = pinArray.join('');
    stateSetter(nextVal);

    if (clean && index < length - 1) {
      if (inputsRef.current[index + 1]) inputsRef.current[index + 1].focus();
    }

    if (nextVal.length === length) {
      // Auto blur to dismiss keyboard
      if (inputsRef.current[index]) {
        inputsRef.current[index].blur();
      }
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, currentState: string, stateSetter: React.Dispatch<React.SetStateAction<string>>, inputsRef: React.MutableRefObject<HTMLInputElement[]>) => {
    if (e.key === 'Backspace' && !currentState[index] && index > 0) {
      const pinArray = currentState.split('');
      pinArray[index - 1] = '';
      stateSetter(pinArray.join(''));
      if (inputsRef.current[index - 1]) inputsRef.current[index - 1].focus();
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
      navigate('/dashboard');
    }
  };

  // Auto-dismiss success dialog and transition automatically
  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleSuccessDismiss();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, flowState]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--gradient-brand)',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
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
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--brand-dark)',
            marginBottom: '8px',
            fontFamily: 'var(--font-poppins)',
            textAlign: 'center'
          }}>
            {flowState === MpinFlowState.ENTER_PIN && 'Enter your PIN'}
            {flowState === MpinFlowState.SETUP_PIN && (mode === 'change' ? 'Change Login PIN' : 'Set your 4-Digit PIN')}
            {flowState === MpinFlowState.FORGOT_ENTER_OTP && 'Verify OTP'}
            {flowState === MpinFlowState.FORGOT_NEW_PIN && 'Reset your 4-Digit PIN'}
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
            {flowState === MpinFlowState.ENTER_PIN && 'Enter your 4-digit PIN to access your account.'}
            {flowState === MpinFlowState.SETUP_PIN && (mode === 'change' ? 'Create and confirm your new 4-digit login PIN.' : 'Create a secure PIN for quick login.')}
            {flowState === MpinFlowState.FORGOT_ENTER_OTP && 'OTP sent to your registered phone number.'}
            {flowState === MpinFlowState.FORGOT_NEW_PIN && 'Create and repeat your new 4-digit login PIN.'}
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      maxLength={1}
                      value={mpin[i] || ''}
                      onChange={(e) => handlePinBoxChange(i, e.target.value, setMpin, mpin, mpinRef, 4, (completedVal) => {
                        handleVerifyExistingMpin(completedVal);
                      })}
                      onKeyDown={(e) => handleKeyDown(i, e, mpin, setMpin, mpinRef)}
                      ref={(el) => { if (el) mpinRef.current[i] = el; }}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(74, 14, 78, 0.15)',
                        textAlign: 'center',
                        fontSize: '24px',
                        outline: 'none',
                        background: '#F9F9F9',
                        WebkitTextSecurity: 'disc',
                        textSecurity: 'disc'
                      } as React.CSSProperties}
                    />
                  </div>
                ))}
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
                Forgot PIN? Reset via OTP
              </button>
            </div>
          )}

          {(flowState === MpinFlowState.SETUP_PIN || flowState === MpinFlowState.FORGOT_NEW_PIN) && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>Enter New PIN</span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={newMpin[i] || ''}
                        onChange={(e) => handlePinBoxChange(i, e.target.value, setNewMpin, newMpin, newMpinRef, 4, () => {
                          if (confirmMpinRef.current[0]) confirmMpinRef.current[0].focus();
                        })}
                        onKeyDown={(e) => handleKeyDown(i, e, newMpin, setNewMpin, newMpinRef)}
                        ref={(el) => { if (el) newMpinRef.current[i] = el; }}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1.5px solid rgba(74,14,78,0.15)',
                          textAlign: 'center',
                          fontSize: '20px',
                          outline: 'none',
                          background: '#F9F9F9',
                          WebkitTextSecurity: 'disc',
                          textSecurity: 'disc'
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>Confirm New PIN</span>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '6px' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={confirmMpin[i] || ''}
                        disabled={newMpin.length !== 4}
                        onChange={(e) => handlePinBoxChange(i, e.target.value, setConfirmMpin, confirmMpin, confirmMpinRef, 4, (completedVal) => {
                          if (newMpin === completedVal) {
                            handleSaveMpin(completedVal);
                          }
                        })}
                        onKeyDown={(e) => handleKeyDown(i, e, confirmMpin, setConfirmMpin, confirmMpinRef)}
                        ref={(el) => { if (el) confirmMpinRef.current[i] = el; }}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          border: '1.5px solid rgba(74,14,78,0.15)',
                          textAlign: 'center',
                          fontSize: '20px',
                          outline: 'none',
                          background: newMpin.length === 4 ? '#F9F9F9' : '#ECECEC',
                          WebkitTextSecurity: 'disc',
                          textSecurity: 'disc'
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {newMpin.length === 4 && confirmMpin.length === 4 && newMpin !== confirmMpin && (
                <span style={{ color: 'var(--error-red)', fontSize: '12px', textAlign: 'center', fontWeight: 'bold', marginTop: '4px' }}>
                  PINs do not match
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
                  'Save'
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
                  Cancel
                </button>
              )}
            </div>
          )}

          {flowState === MpinFlowState.FORGOT_ENTER_OTP && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ''}
                    onChange={(e) => handlePinBoxChange(i, e.target.value, setOtp, otp, otpRef, 6, handleVerifyOtp)}
                    onKeyDown={(e) => handleKeyDown(i, e, otp, setOtp, otpRef)}
                    ref={(el) => { if (el) otpRef.current[i] = el; }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1.5px solid rgba(74,14,78,0.15)',
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      outline: 'none',
                      background: '#F9F9F9'
                    }}
                  />
                ))}
              </div>

              {secondsRemaining > 0 ? (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Resend in {secondsRemaining}s
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
                  Resend OTP
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
                Back to PIN Login
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
            🔐 <strong>For your security:</strong> Do not share your PIN with anyone. Aishwaryam @ Your Home will never ask for your PIN.
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
          background: 'rgba(41, 0, 29, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          color: 'white',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="animate-tick-success" style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid var(--success-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={72} color="var(--success-green)" />
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-poppins)',
            color: 'white',
            textAlign: 'center',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            {successMessage}
          </h2>
        </div>
      )}

      {/* Loading full screen overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(41, 0, 29, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          color: 'white',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Circular SVG Progress Loader */}
          <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '20px' }}>
            <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="5"
              />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="transparent"
                stroke="var(--gold-primary)"
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 * (1 - loadingProgress / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.12s ease-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '900',
              color: 'var(--gold-primary)',
              fontFamily: 'var(--font-poppins)'
            }}>
              {loadingProgress}%
            </div>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--font-poppins)', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: '0.5px' }}>
            {flowState === MpinFlowState.ENTER_PIN ? 'Verifying PIN...' : 'Saving PIN...'}
          </span>
        </div>
      )}
    </div>
  );
};
