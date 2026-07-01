import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../utils/translation';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [isAccepted, setIsAccepted] = useState(() => {
    return localStorage.getItem('PRIVACY_POLICY_ACCEPTED') === 'true';
  });

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handleAccept = () => {
    localStorage.setItem('PRIVACY_POLICY_ACCEPTED', 'true');
    setIsAccepted(true);
    alert(t('privacy_thank_accept'));
    handleBack();
  };

  const sections = [
    {
      title: t('privacy_sec1_title'),
      text: t('privacy_sec1_text')
    },
    {
      title: t('privacy_sec2_title'),
      text: t('privacy_sec2_text'),
      bullets: [
        t('privacy_sec2_bullet1'),
        t('privacy_sec2_bullet2'),
        t('privacy_sec2_bullet3'),
        t('privacy_sec2_bullet4'),
        t('privacy_sec2_bullet5'),
        t('privacy_sec2_bullet6')
      ]
    },
    {
      title: t('privacy_sec3_title'),
      text: t('privacy_sec3_text')
    },
    {
      title: t('privacy_sec4_title'),
      text: t('privacy_sec4_text'),
      bullets: [
        t('privacy_sec4_bullet1'),
        t('privacy_sec4_bullet2'),
        t('privacy_sec4_bullet3')
      ]
    },
    {
      title: t('privacy_sec5_title'),
      text: t('privacy_sec5_text'),
      bullets: [
        t('privacy_sec5_bullet1'),
        t('privacy_sec5_bullet2'),
        t('privacy_sec5_bullet3'),
        t('privacy_sec5_bullet4')
      ]
    },
    {
      title: t('privacy_sec6_title'),
      text: t('privacy_sec6_text')
    },
    {
      title: t('privacy_sec7_title'),
      text: t('privacy_sec7_text')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'white' }}>
      
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
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(41, 0, 29, 0.15)'
      }}>
        <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={24} color="var(--gold-primary)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', textAlign: 'center', flex: 1, marginRight: '40px', letterSpacing: '0.5px' }}>
          {t('privacy_title')}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '22px', boxSizing: 'border-box' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3.5px solid var(--brand-accent)', paddingLeft: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0, fontFamily: 'var(--font-poppins)' }}>
              {section.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '18px', fontFamily: 'var(--font-poppins)' }}>
              {section.text}
            </p>
            {section.bullets && (
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {section.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', fontFamily: 'var(--font-poppins)' }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '10px', fontStyle: 'italic', fontFamily: 'var(--font-poppins)' }}>
          {t('privacy_no_desc')}
        </div>
        
        {/* Extra spacer for scroll buffer */}
        <div style={{ height: isAccepted ? '20px' : '80px' }} />
      </div>

      {/* Conditional Accept button fixed at the bottom */}
      {!isAccepted && (
        <div style={{
          background: 'white',
          padding: '16px 20px',
          borderTop: '1px solid #ECECEC',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
          position: 'sticky',
          bottom: 0
        }}>
          <button
            onClick={handleAccept}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-poppins)',
              boxShadow: '0 4px 12px var(--brand-glow)'
            }}
          >
            {t('privacy_accept_continue')}
          </button>
        </div>
      )}

    </div>
  );
};
