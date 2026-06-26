import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useTranslation } from '../utils/translation';

export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(SessionManager.getPartialName() || '');
  const [email, setEmail] = useState(SessionManager.getPartialEmail() || '');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && email.trim() && email.includes('@')) {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const userId = SessionManager.getUserId() || '00000000-0000-0000-0000-000000000000';
        await ApiClient.put(`api/User/profile/${userId}`, {
          fullName,
          email,
          referredByCode: referralCode.trim() || null
        });
        
        SessionManager.savePartialProfile(fullName, email);
        SessionManager.saveOnboardingStage(OnboardingStage.PROFILE_COMPLETED);
        
        // Setup done, redirect to KYC onboarding form
        navigate('/onboarding');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormValid = fullName.trim().length > 0 && email.trim().length > 0 && email.includes('@');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#F5F7F5',
      boxSizing: 'border-box'
    }}>
      <div className="responsive-form-container" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', width: '100%', flex: 1, marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            color: 'var(--brand-deep)',
            fontSize: '26px',
            fontWeight: 'bold',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {t('account_registration')}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            {t('provide_contact_info')}
          </p>

          {errorMsg && (
            <div style={{
              color: 'var(--error-red)',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                {t('full_name_label')} <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder={t('enter_full_name')}
                value={fullName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val)) {
                    setFullName(val);
                  }
                }}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1px solid rgba(74, 14, 78, 0.15)',
                  padding: '0 16px',
                  fontSize: '15px',
                  outline: 'none',
                  marginTop: '4px',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                {t('email_address_label')} <span style={{ color: 'var(--error-red)' }}>*</span>
              </label>
              <input
                type="email"
                placeholder={t('enter_email_address')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1px solid rgba(74, 14, 78, 0.15)',
                  padding: '0 16px',
                  fontSize: '15px',
                  outline: 'none',
                  marginTop: '4px',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                {t('referral_code_optional')}
              </label>
              <input
                type="text"
                placeholder={t('enter_referral_code')}
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '12px',
                  border: '1px solid rgba(74, 14, 78, 0.15)',
                  padding: '0 16px',
                  fontSize: '15px',
                  outline: 'none',
                  marginTop: '4px',
                  background: 'white'
                }}
              />
            </div>
          </form>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '16px',
            background: isFormValid ? 'var(--brand-dark)' : 'var(--text-light)',
            color: 'white',
            border: 'none',
            fontFamily: 'var(--font-poppins)',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: isFormValid ? 'pointer' : 'default',
            marginTop: '16px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isFormValid ? '0 8px 16px var(--brand-glow)' : 'none',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}
        >
          {isLoading ? (
            <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            t('complete_registration')
          )}
        </button>
      </div>
    </div>
  );
};
