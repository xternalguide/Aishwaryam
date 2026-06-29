import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';

export const PriceCalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { livePrice } = useApp();

  const [calcAmount, setCalcAmount] = useState('');
  const [calcType, setCalcType] = useState<'RUPEES' | 'GRAMS'>('RUPEES');

  const goldPrice22K = livePrice?.price22KPaise || 701000;

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handlePresetClick = (val: string) => {
    setCalcAmount(val);
  };

  const parsedVal = parseFloat(calcAmount) || 0;

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
          {t('price_calculator')}
        </span>
      </div>

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
        
        {/* Main interactive calculation card */}
        <div className="glass-card" style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'white',
          border: '1.5px solid var(--border-light)',
          boxShadow: '0 8px 24px rgba(74, 14, 78, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(74, 14, 78, 0.06)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--brand-dark)'
            }}>
              <Calculator size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                {t('live_rate_estimation')}
              </h4>
            </div>
          </div>

          {/* Toggle Type button row */}
          <div style={{ display: 'flex', background: '#F5F5F5', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => { setCalcType('RUPEES'); setCalcAmount(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold',
                background: calcType === 'RUPEES' ? 'white' : 'transparent',
                color: calcType === 'RUPEES' ? 'var(--brand-dark)' : 'var(--text-muted)',
                boxShadow: calcType === 'RUPEES' ? '0 3px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('amount_to_gold')}
            </button>
            <button 
              onClick={() => { setCalcType('GRAMS'); setCalcAmount(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold',
                background: calcType === 'GRAMS' ? 'white' : 'transparent',
                color: calcType === 'GRAMS' ? 'var(--brand-dark)' : 'var(--text-muted)',
                boxShadow: calcType === 'GRAMS' ? '0 3px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t('gold_to_amount')}
            </button>
          </div>

          {/* Input block */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              {calcType === 'RUPEES' ? t('calc_amount_label') : t('calc_weight_label')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '15px', fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                {calcType === 'RUPEES' ? '₹' : 'g'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                style={{
                  width: '100%', height: '52px', borderRadius: '12px', border: '1.5px solid rgba(74, 14, 78, 0.15)',
                  padding: '0 16px 0 36px', fontSize: '16px', fontWeight: 'bold', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'var(--font-poppins)'
                }}
              />
            </div>
          </div>

          {/* Preset Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(calcType === 'RUPEES' ? ['1000', '3000', '5000', '10000'] : ['0.5', '1', '2', '5']).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetClick(p)}
                style={{
                  background: calcAmount === p ? 'var(--brand-dark)' : 'white',
                  border: '1.5px solid var(--brand-dark)',
                  color: calcAmount === p ? 'white' : 'var(--brand-dark)',
                  padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {calcType === 'RUPEES' ? `₹${p}` : `${p} g`}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        {parsedVal > 0 ? (
          <div className="glass-card" style={{
            background: 'var(--surface-gold)',
            border: '1.5px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(255, 215, 0, 0.05)'
          }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', borderBottom: '1px solid rgba(74, 14, 78, 0.05)', paddingBottom: '8px' }}>
              {t('estimated_breakdown')}
            </h4>

            {calcType === 'RUPEES' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('savings_deposit')}</span>
                  <span style={{ fontWeight: 'bold' }}>₹{parsedVal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('gst_included')}</span>
                  <span>₹{(parsedVal - (parsedVal / 1.03)).toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(74, 14, 78, 0.08)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', color: 'var(--brand-dark)' }}>
                  <span>{t('effective_gold_added')}</span>
                  <span style={{ color: 'var(--gold-deep)' }}>
                    {((parsedVal / 1.03 * 100) / goldPrice22K).toFixed(4)} {t('grams_suffix')}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('base_metal_value_22k')}</span>
                  <span style={{ fontWeight: 'bold' }}>₹{(parsedVal * goldPrice22K / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('gst_3_percent')}</span>
                  <span>₹{(parsedVal * goldPrice22K / 100 * 0.03).toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(74, 14, 78, 0.08)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', color: 'var(--brand-dark)' }}>
                  <span>{t('total_amount_payable')}</span>
                  <span style={{ color: 'var(--brand-dark)' }}>
                    ₹{(parsedVal * goldPrice22K / 100 * 1.03).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
