import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';

export const CompletedSchemesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeSchemes } = useApp();

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const completed = activeSchemes?.filter(s => 
    s.status?.toLowerCase() === 'matured' || 
    s.status?.toLowerCase() === 'claimed' || 
    s.status?.toLowerCase() === 'completed'
  ) || [];

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };

  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

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
          {t('completed_schemes')}
        </span>
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        
        {completed.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            border: '1.5px dashed rgba(74, 14, 78, 0.1)',
            padding: '60px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '40px'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--gold-soft)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--gold-warm)'
            }}>
              <Award size={44} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                {t('no_completed_schemes')}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '18px' }}>
                {t('completed_schemes_desc')}
              </p>
            </div>
            <button
              onClick={() => navigate('/scheme-explorer')}
              style={{
                marginTop: '12px',
                height: '42px',
                padding: '0 24px',
                borderRadius: '21px',
                background: 'var(--gradient-brand)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--brand-glow)'
              }}
            >
              {t('explore_schemes_cta')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {completed.map((sch) => (
              <div key={sch.schemeId} className="glass-card" style={{
                padding: '20px', borderRadius: '20px', background: 'white',
                border: '1.5px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{sch.planName}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('matured_on')} {new Date(sch.maturityDate).toLocaleDateString()}</span>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px',
                    background: 'var(--success-light)', color: 'var(--success-green)', border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    {t('completed_badge')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{t('total_saved_amount')}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatRupees(sch.totalSavingsAddedPaise)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{t('total_bonus_earned')}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--brand-accent)' }}>{formatRupees(sch.totalBonusEarnedPaise)}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{t('total_accumulated_gold')}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--gold-deep)', fontSize: '14px' }}>{mgToGrams(sch.accumulatedGoldMg)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={() => navigate(`/scheme-detail/${sch.schemeId}`)}
                    style={{
                      flex: 1, height: '42px', borderRadius: '10px',
                      background: 'var(--brand-dark)', color: 'white', border: 'none',
                      fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    {t('view_history_btn')}
                  </button>
                  {sch.status?.toLowerCase() !== 'claimed' ? (
                    <button
                      onClick={() => navigate(`/scheme-redemption/${sch.schemeId}`)}
                      style={{
                        flex: 1, height: '42px', borderRadius: '10px',
                        background: 'var(--gradient-gold)', color: '#1A1200', border: 'none',
                        fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      {t('redeem_plan')}
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
                        flex: 1, height: '42px', borderRadius: '10px',
                        background: '#ECECEC', color: 'var(--text-muted)', border: 'none',
                        fontWeight: 'bold', fontSize: '12px', cursor: 'default'
                      }}
                    >
                      {t('redeemed_status')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
