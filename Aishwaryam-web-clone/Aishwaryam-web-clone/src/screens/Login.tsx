import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { useTranslation } from '../utils/translation';
import { ApiClient } from '../utils/ApiClient';
import { Phone, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{ isNewUser: boolean; isMpinSet: boolean } | null>(null);

  // OTP inputs focus handling
  const otpInputsRef = useRef<HTMLInputElement[]>([]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isOtpFlow && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpFlow, secondsRemaining]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length === 0) {
      setErrorMsg(t('empty_phone_err'));
      return;
    }
    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      setErrorMsg(t('invalid_phone_err'));
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await ApiClient.post('api/Auth/send-otp', { phoneNumber: phone });
      if (response.data && response.data.success) {
        SessionManager.savePhoneNumber(phone);
        setIsOtpFlow(true);
        setSecondsRemaining(30);
        setOtp('');
        // Focus first OTP field after state updates
        setTimeout(() => {
          if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
        }, 100);
      } else {
        setErrorMsg(response.data.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Network error occurred. Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (enteredOtp: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await ApiClient.post('api/Auth/verify-otp', {
        phoneNumber: phone,
        otp: enteredOtp,
        deviceFingerprint: ApiClient.getDeviceFingerprint()
      });
      if (response.data && response.data.success) {
        const { token, refreshToken, userId, isNewUser, isMpinSet } = response.data;
        SessionManager.saveSession(userId, token, refreshToken);
        setSuccessData({ isNewUser, isMpinSet });
        setShowSuccessDialog(true);
      } else {
        setErrorMsg(response.data.message || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 1);
    const otpArray = otp.split('');
    otpArray[index] = clean;
    const newOtp = otpArray.join('');
    setOtp(newOtp);

    // Auto-focus next input
    if (clean && index < 5) {
      if (otpInputsRef.current[index + 1]) {
        otpInputsRef.current[index + 1].focus();
      }
    }

    // Auto-submit on 6th digit
    if (newOtp.length === 6) {
      handleVerifyOtp(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const otpArray = otp.split('');
      otpArray[index - 1] = '';
      setOtp(otpArray.join(''));
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  const handleResendOtp = () => {
    setSecondsRemaining(30);
    handleSendOtp();
  };

  const handleSuccessDismiss = () => {
    setShowSuccessDialog(false);
    if (successData) {
      const { isMpinSet } = successData;
      if (!isMpinSet) {
        SessionManager.saveOnboardingStage(OnboardingStage.OTP_VERIFIED);
        navigate('/mpin/setup');
      } else {
        SessionManager.saveOnboardingStage(OnboardingStage.PROFILE_COMPLETED);
        navigate('/mpin/verify');
      }
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
  }, [showSuccessDialog, successData]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--surface-light)',
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
        {/* Top Header Row with Language Selector */}
          {/* Language Toggle EN/தமிழ் */}
        {/* <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '8px', width: '100%', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'en' ? 'var(--brand-dark)' : 'var(--text-light)' }}>EN</span>
            <button
              onClick={() => changeLanguage(lang === 'en' ? 'ta' : 'en')}
              style={{
                width: '40px', height: '20px', borderRadius: '10px',
                background: lang === 'ta' ? 'var(--brand-dark)' : '#ECECEC',
                border: 'none', position: 'relative', cursor: 'pointer',
                transition: 'background-color 0.2s ease', padding: 0
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px', left: lang === 'ta' ? '23px' : '3px',
                transition: 'left 0.2s ease'
              }} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'ta' ? 'var(--brand-dark)' : 'var(--text-light)' }}>தமிழ்</span>
          </div>
        </div> */}

        {/* Top Section */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          {/* Branding Logo */}

          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            color: 'var(--brand-deep)',
            fontSize: 'clamp(20px, 6.5vw, 26px)',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {isOtpFlow ? t('verify_otp') : t('enter_mobile_number')}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(11.5px, 3.5vw, 13.5px)',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {isOtpFlow ? t('otp_sent_to').replace('{phone}', phone) : t('send_otp_instruction')}
          </p>

          {errorMsg && (
            <div style={{
              color: 'var(--error-red)',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              padding: '0 16px'
            }}>
              {errorMsg}
            </div>
          )}

          {isOtpFlow ? (
            /* OTP 6-Digit input layout */
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'clamp(4px, 2vw, 8px)', justifyContent: 'center', marginBottom: '24px', width: '100%' }}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ''}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').trim();
                      if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
                        setOtp(pastedData);
                        if (otpInputsRef.current[5]) {
                          otpInputsRef.current[5].focus();
                        }
                        handleVerifyOtp(pastedData);
                      }
                    }}
                    ref={(el) => { if (el) otpInputsRef.current[index] = el; }}
                    style={{
                      width: 'clamp(32px, 10vw, 46px)',
                      height: 'clamp(32px, 10vw, 46px)',
                      borderRadius: '12px',
                      border: '1.5px solid rgba(74, 14, 78, 0.15)',
                      textAlign: 'center',
                      fontSize: 'clamp(14px, 4.5vw, 18px)',
                      fontWeight: 'bold',
                      color: 'var(--brand-dark)',
                      outline: 'none',
                      background: 'white',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--brand-mid)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(74, 14, 78, 0.15)'}
                  />
                ))}
              </div>

              {secondsRemaining > 0 ? (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  {t('resend_otp_in').replace('{seconds}', String(secondsRemaining))}
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--brand-dark)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {t('resend_otp')}
                </button>
              )}
            </div>
          ) : (
            /* Phone Entry form */
            <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '56px',
                borderRadius: '16px',
                border: '1px solid rgba(74,14,78,0.15)',
                padding: '0 16px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <Phone size={20} color="var(--brand-dark)" style={{ marginRight: '8px', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: 'clamp(14px, 4.5vw, 16px)', marginRight: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t('phone_placeholder')}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    if (val === '' || /^[6-9]/.test(val)) {
                      setPhone(val);
                    }
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    fontSize: 'clamp(14px, 4.5vw, 16px)',
                    outline: 'none',
                    fontFamily: 'var(--font-poppins)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                {t('phone_hint')}
              </p>
            </form>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '24px', paddingBottom: '24px', flexShrink: 0 }}>
          {!isOtpFlow && (
            <button
              onClick={handleSendOtp}
              disabled={isLoading}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--brand-dark)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-poppins)',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 16px var(--brand-glow)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                t('get_otp')
              )}
            </button>
          )}

          {isOtpFlow && (
            <button
              onClick={() => handleVerifyOtp(otp)}
              disabled={otp.length !== 6 || isLoading}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '16px',
                background: otp.length === 6 ? 'var(--brand-dark)' : 'var(--text-light)',
                color: 'white',
                border: 'none',
                fontFamily: 'var(--font-poppins)',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: otp.length === 6 ? 'pointer' : 'default',
                boxShadow: otp.length === 6 ? '0 8px 16px var(--brand-glow)' : 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                t('verify_and_continue')
              )}
            </button>
          )}

          <button
            onClick={() => window.location.href = 'tel:+919443000000'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-mid)',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'underline'
            }}
          >
            {t('contact_support_login')}
          </button>
        </div>
      </div>
      {/* Success Tick Dialog Overlay */}
      {showSuccessDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{
            width: '200px',
            height: '200px',
            borderRadius: '28px',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Animated Checkmark */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(123, 31, 162, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <CheckCircle size={48} color="var(--brand-mid)" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center' }}>
              {t('login_successful')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
