import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../utils/translation';

export const TermsConditions: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const sections = [
    {
      title: t('terms_sec1_title'),
      text: t('terms_sec1_text')
    },
    {
      title: t('terms_sec2_title'),
      text: t('terms_sec2_text'),
      bullets: [
        t('terms_sec2_bullet1'),
        t('terms_sec2_bullet2'),
        t('terms_sec2_bullet3')
      ]
    },
    {
      title: t('terms_sec3_title'),
      text: t('terms_sec3_text')
    },
    {
      title: t('terms_sec4_title'),
      text: t('terms_sec4_text'),
      bullets: [
        t('terms_sec4_bullet1'),
        t('terms_sec4_bullet2'),
        t('terms_sec4_bullet3')
      ]
    },
    {
      title: t('terms_sec5_title'),
      text: t('terms_sec5_text'),
      bullets: [
        t('terms_sec5_bullet1'),
        t('terms_sec5_bullet2'),
        t('terms_sec5_bullet3')
      ]
    },
    {
      title: t('terms_sec6_title'),
      text: t('terms_sec6_text')
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
          {t('terms_title')}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '22px', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '20px', fontStyle: 'italic', fontFamily: 'var(--font-poppins)' }}>
          {t('terms_subtitle')}
        </p>

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
        
        <div style={{ height: '40px' }} />
      </div>

    </div>
  );
};
