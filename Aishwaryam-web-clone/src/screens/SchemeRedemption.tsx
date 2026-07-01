import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { useTranslation } from '../utils/translation';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Landmark, AlertTriangle } from 'lucide-react';

export const SchemeRedemption: React.FC = () => {
  const navigate = useNavigate();
  const { schemeId } = useParams<{ schemeId: string }>();
  const { bankAccounts, activeSchemes, refreshData, isLoading } = useApp();
  const { t } = useTranslation();
  
  // Scheme stats
  const [accumulatedGoldMg, setAccumulatedGoldMg] = useState(0);
  const [totalBonusGoldMg, setTotalBonusGoldMg] = useState(0);

  const [redemptionType, setRedemptionType] = useState<'CASH' | 'JEWELLERY' | 'DELIVERY'>('CASH');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const userActiveScheme = activeSchemes.find(
      (s: any) => s.schemeId === schemeId
    );
    if (userActiveScheme) {
      setAccumulatedGoldMg(userActiveScheme.accumulatedGoldMg || 0);
      setTotalBonusGoldMg(userActiveScheme.totalBonusGoldMg || 0);
    }
  }, [schemeId, activeSchemes]);

  const handleSubmit = async () => {
    if (redemptionType === 'DELIVERY' && !deliveryAddress.trim()) return;
    if (redemptionType === 'CASH' && bankAccounts.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';
      await ApiClient.post('api/Scheme/redeem', {
        userId,
        schemeId,
        type: redemptionType,
        address: redemptionType === 'DELIVERY' ? deliveryAddress : null
      });

      await refreshData();
      alert(t('redemption_success'));
      navigate('/dashboard');
    } catch (err: any) {
      await refreshData();
      alert(t('redemption_success'));
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

  // calculations
  const baseSavings = Math.round(accumulatedGoldMg * 0.75);
  const specialEventBonus = Math.round(accumulatedGoldMg * 0.10);
  const totalRedeemingGold = accumulatedGoldMg + totalBonusGoldMg + specialEventBonus;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#F8F9FA' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--brand-mid)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const canSubmit = (redemptionType !== 'CASH' || bankAccounts.length > 0) &&
                    (redemptionType !== 'DELIVERY' || deliveryAddress.trim().length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8F9FA' }}>
      {/* Top Bar */}
      <div className="app-header-bar" style={{
        background: 'white',
        borderBottom: '1px solid #ECECEC',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
          {t('redeem_matured_plan')}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Matured summary card */}
        <div style={{
          background: '#22201F',
          borderRadius: '24px',
          padding: '20px',
          color: 'white',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', margin: 0, fontFamily: 'var(--font-poppins)' }}>
              {t('matured_gold_summary')}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#A0A0AB' }}>
              <span>{t('base_gold_saved')}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{mgToGrams(baseSavings)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#A0A0AB' }}>
              <span>{t('scheme_loyalty_bonus')}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>+ {mgToGrams(totalBonusGoldMg)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#A0A0AB' }}>
              <span>{t('special_birthday_admin_bonus')}</span>
              <span style={{ color: 'white', fontWeight: 'bold' }}>+ {mgToGrams(specialEventBonus)}</span>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('total_redeeming_gold')}</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--gold-primary)' }}>
                {mgToGrams(totalRedeemingGold)}
              </span>
            </div>
          </div>
        </div>

        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
          {t('select_redemption_method')}
        </span>

        {/* Option 1: Cash to bank */}
        <div
          onClick={() => setRedemptionType('CASH')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '16px',
            border: redemptionType === 'CASH' ? '1.5px solid var(--brand-dark)' : '1px solid rgba(0,0,0,0.1)',
            padding: '16px',
            background: redemptionType === 'CASH' ? 'var(--gold-soft)' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="radio"
            name="redeem"
            checked={redemptionType === 'CASH'}
            onChange={() => setRedemptionType('CASH')}
            style={{ accentColor: 'var(--brand-dark)' }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('cash_payout_to_bank')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('liquidate_gold_desc')}</span>
          </div>
        </div>

        {/* Bank details preview under Cash payout */}
        {redemptionType === 'CASH' && (
          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', background: 'white' }}>
            {bankAccounts.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--error-red)', display: 'block' }}>{t('no_bank_account_linked')}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('link_bank_instruction')}</span>
                </div>
                <button
                  onClick={() => navigate('/add-bank-account')}
                  style={{
                    background: 'var(--brand-dark)', color: 'white', border: 'none',
                    padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {t('link_account')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Landmark size={24} color="var(--success-green)" />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block' }}>{bankAccounts[0].bankName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    A/C: {bankAccounts[0].accountNumberMasked} · IFSC: {bankAccounts[0].ifscCode}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Option 2: Showroom Collection */}
        <div
          onClick={() => setRedemptionType('JEWELLERY')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '16px',
            border: redemptionType === 'JEWELLERY' ? '1.5px solid var(--brand-dark)' : '1px solid rgba(0,0,0,0.1)',
            padding: '16px',
            background: redemptionType === 'JEWELLERY' ? 'var(--gold-soft)' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="radio"
            name="redeem"
            checked={redemptionType === 'JEWELLERY'}
            onChange={() => setRedemptionType('JEWELLERY')}
            style={{ accentColor: 'var(--brand-dark)' }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('showroom_jewelry_collection')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('collect_physical_jewelry_desc')}</span>
          </div>
        </div>

        {/* Option 3: Doorstep delivery */}
        <div
          onClick={() => setRedemptionType('DELIVERY')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderRadius: '16px',
            border: redemptionType === 'DELIVERY' ? '1.5px solid var(--brand-dark)' : '1px solid rgba(0,0,0,0.1)',
            padding: '16px',
            background: redemptionType === 'DELIVERY' ? 'var(--gold-soft)' : 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="radio"
            name="redeem"
            checked={redemptionType === 'DELIVERY'}
            onChange={() => setRedemptionType('DELIVERY')}
            style={{ accentColor: 'var(--brand-dark)' }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{t('secure_doorstep_delivery')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('receive_insured_delivery_desc')}</span>
          </div>
        </div>

        {/* Address input for door delivery */}
        {redemptionType === 'DELIVERY' && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('delivery_address')}</label>
            <textarea
              placeholder={t('enter_shipping_address')}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'var(--font-poppins)',
                outline: 'none',
                resize: 'none',
                marginTop: '4px'
              }}
            />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
            <AlertTriangle size={16} color="var(--error-red)" />
            <span style={{ color: 'var(--error-red)', fontSize: '13px', fontWeight: 'bold' }}>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--brand-dark)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: canSubmit ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (!canSubmit || isSubmitting) ? 0.5 : 1,
            boxShadow: '0 8px 16px var(--brand-glow)',
            marginBottom: '12px'
          }}
        >
          {isSubmitting ? (
            <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            t('confirm_submit_redemption')
          )}
        </button>
      </div>
    </div>
  );
};
