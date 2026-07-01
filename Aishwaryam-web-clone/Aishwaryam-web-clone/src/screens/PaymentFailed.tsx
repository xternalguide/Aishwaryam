import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { XCircle, FileText, ArrowLeft, RefreshCw } from 'lucide-react';

export const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const { errorJson } = useParams<{ errorJson: string }>();

  let errorDetails: any = {};
  try {
    if (errorJson) {
      errorDetails = JSON.parse(decodeURIComponent(errorJson));
    }
  } catch (e) {
    console.error('Error parsing errorJson:', e);
  }

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  };

  const schemeName = errorDetails.schemeName || 'Savings Plan';
  const amountPaise = errorDetails.amountPaise || 0;
  const errorMessage = errorDetails.errorMessage || 'Payment was cancelled by the user.';
  const transactionId = errorDetails.orderId || 'N/A';
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#F9FAFB',
      justifyContent: 'space-between',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Error Circle */}
        <div 
          className="animate-shake"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--error-light)',
            display: 'flex',
            alignItems: 'center',
            alignContent: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.15)',
          }}
        >
          <XCircle size={48} color="var(--error-red)" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          color: 'var(--error-red)',
          fontSize: '26px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Payment Failed
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '280px',
          lineHeight: '18px'
        }}>
          {errorMessage}
        </p>

        {/* Details Card */}
        <div className="glass-card" style={{
          width: '100%',
          maxWidth: '380px',
          borderRadius: '20px',
          background: 'white',
          padding: '20px',
          border: '1px solid #ECECEC',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={18} color="var(--brand-dark)" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Transaction Details</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Savings Scheme</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', textAlign: 'right', maxWidth: '180px' }}>{schemeName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reference ID</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{transactionId.slice(0, 16)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span style={{ color: 'var(--error-red)', fontWeight: 'bold' }}>FAILED</span>
            </div>

            <div style={{ height: '1px', background: '#F3F4F6', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Amount Attempted</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                {formatRupees(amountPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
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
          <RefreshCw size={16} /> Try Again
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--brand-mid)',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};
