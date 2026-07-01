import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useTranslation } from '../utils/translation';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const ChangeMpin: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const newMpinRef = useRef<HTMLInputElement[]>([]);
  const confirmMpinRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (newMpinRef.current[0]) {
      newMpinRef.current[0].focus();
    }
  }, []);

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
      if (inputsRef.current[index]) {
        inputsRef.current[index].blur();
      }
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    currentState: string,
    stateSetter: React.Dispatch<React.SetStateAction<string>>,
    inputsRef: React.MutableRefObject<HTMLInputElement[]>
  ) => {
    if (e.key === 'Backspace' && !currentState[index] && index > 0) {
      const pinArray = currentState.split('');
      pinArray[index - 1] = '';
      stateSetter(pinArray.join(''));
      if (inputsRef.current[index - 1]) inputsRef.current[index - 1].focus();
    }
  };

  const handleSave = async (overrideConfirm?: string) => {
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

  const handleSuccessDismiss = () => {
    setShowSuccessDialog(false);
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  useEffect(() => {
    if (showSuccessDialog) {
      const timer = setTimeout(() => {
        handleSuccessDismiss();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog]);

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      {/* Header */}
      <div className="app-header-bar" style={{
        background: 'var(--gradient-brand)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(41, 0, 29, 0.15)',
        zIndex: 10
      }}>
        <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', letterSpacing: '0.5px' }}>
          {t('change_mpin')}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--brand-dark)', textAlign: 'center', margin: 0, lineHeight: '20px' }}>
            {t('create_secure_pin_desc')}
          </h3>

          {errorMsg && (
            <div style={{ color: 'var(--error-red)', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {/* New PIN Input Row */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>{t('enter_new_pin')}</span>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <input
                  key={i}
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
              ))}
            </div>
          </div>

          {/* Confirm PIN Input Row */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>{t('confirm_new_pin')}</span>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={1}
                  value={confirmMpin[i] || ''}
                  disabled={newMpin.length !== 4}
                  onChange={(e) => handlePinBoxChange(i, e.target.value, setConfirmMpin, confirmMpin, confirmMpinRef, 4, (completedVal) => {
                    if (newMpin === completedVal) {
                      handleSave(completedVal);
                    }
                  })}
                  onKeyDown={(e) => handleKeyDown(i, e, confirmMpin, setConfirmMpin, confirmMpinRef)}
                  ref={(el) => { if (el) confirmMpinRef.current[i] = el; }}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(74, 14, 78, 0.15)',
                    textAlign: 'center',
                    fontSize: '24px',
                    outline: 'none',
                    background: newMpin.length === 4 ? '#F9F9F9' : '#ECECEC',
                    WebkitTextSecurity: 'disc',
                    textSecurity: 'disc'
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {newMpin.length === 4 && confirmMpin.length === 4 && newMpin !== confirmMpin && (
            <span style={{ color: 'var(--error-red)', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
              {t('pins_do_not_match')}
            </span>
          )}

          <button
            onClick={() => handleSave()}
            disabled={newMpin.length !== 4 || confirmMpin.length !== 4 || newMpin !== confirmMpin || isLoading}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: (newMpin.length === 4 && confirmMpin.length === 4 && newMpin === confirmMpin) ? 'var(--gradient-brand)' : 'var(--text-light)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              cursor: (newMpin.length === 4 && confirmMpin.length === 4 && newMpin === confirmMpin) ? 'pointer' : 'default',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (newMpin.length === 4 && confirmMpin.length === 4 && newMpin === confirmMpin) ? '0 4px 12px var(--brand-glow)' : 'none'
            }}
          >
            {isLoading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              t('save_update_pin')
            )}
          </button>

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
            🔐 <strong>{t('relationship') === 'உறவுமுறை' ? 'உங்கள் பாதுகாப்பிற்கு:' : 'For your security:'}</strong> {t('pin_security_notice')}
          </div>
        </div>
      </div>

      {/* Success tick full screen overlay */}
      {showSuccessDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(41, 0, 29, 0.95)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, color: 'white'
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--success-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={60} color="var(--success-green)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', textAlign: 'center', margin: 0 }}>
            {t('pin_changed_success')}
          </h2>
        </div>
      )}
    </div>
  );
};
