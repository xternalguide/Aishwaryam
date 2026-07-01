import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { receiptJson } = useParams<{ receiptJson: string }>();

  let receipt: any = {};
  try {
    if (receiptJson) {
      receipt = JSON.parse(decodeURIComponent(receiptJson));
    }
  } catch (e) {
    console.error(e);
  }

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  };

  const transactionId = receipt.transactionId || 'pay_razor_mock_12345';
  const type = receipt.type || 'BUY';
  const amountPaise = receipt.amountPaise || 300000;
  const goldWeightMg = receipt.goldWeightMg || 3850;
  const createdAt = receipt.createdAt || new Date().toISOString();
  const rateSource = receipt.rateSource || 'Live';
  const schemeName = receipt.schemeName || 'Aishwaryam Gold Saver 11 Months';

  const pricePerGmPaise = receipt.pricePerGmPaise || 701000;
  const bonusGoldMg = receipt.bonusGoldMg || 0;
  const bonusPercentage = receipt.bonusPercentage || 0;
  const baseAmountPaise = receipt.baseAmountPaise || Math.round((amountPaise * 100) / 103);
  const gstAmountPaise = receipt.gstAmountPaise || (amountPaise - baseAmountPaise);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB', justifyContent: 'space-between', padding: '24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Checkmark Circle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--success-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)',
          animation: 'pulse 2s infinite alternate'
        }}>
          <CheckCircle2 size={48} color="var(--success-green)" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          color: 'var(--success-green)',
          fontSize: '26px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Payment Successful!
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Your transaction has been verified and metal credited to your vault.
        </p>

        {/* Invoice Card */}
        <div className="glass-card" style={{
          width: '100%',
          borderRadius: '20px',
          background: 'white',
          padding: '20px',
          border: '1px solid #ECECEC',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={18} color="var(--brand-dark)" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Transaction Receipt</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{transactionId.slice(0, 16)}...</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Type</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {new Date(createdAt).toLocaleDateString()} {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Metal Weight</span>
              <span style={{ color: '#FFB300', fontWeight: 'bold' }}>{(goldWeightMg / 1000).toFixed(4)} g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Chit Plan Name</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', textAlign: 'right', maxWidth: '180px' }}>{schemeName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Price Source</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{rateSource}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gold Rate (per gram)</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatRupees(pricePerGmPaise)} /g</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Amount (Excl. GST)</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatRupees(baseAmountPaise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>GST (3%)</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatRupees(gstAmountPaise)}</span>
            </div>
            {bonusGoldMg > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                background: '#ECFDF5',
                padding: '6px 10px',
                borderRadius: '8px',
                margin: '4px 0',
                border: '1px solid #A7F3D0'
              }}>
                <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>Loyalty Bonus ({bonusPercentage}%)</span>
                <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>+{(bonusGoldMg / 1000).toFixed(4)} g</span>
              </div>
            )}

            <div style={{ height: '1px', background: '#F3F4F6', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Total Paid Amount</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                {formatRupees(amountPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--brand-dark)',
            color: 'white',
            border: 'none',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 16px var(--brand-glow)'
          }}
        >
          View Portfolio <ArrowRight size={16} />
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--brand-mid)',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};
