import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Info } from 'lucide-react';

export const BuyGold: React.FC = () => {
  const navigate = useNavigate();
  const { livePrice, refreshData } = useApp();

  const [buyPricePaise, setBuyPricePaise] = useState(754200); // ₹7,542.00 paise fallback
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  
  const [amountInput, setAmountInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [totalToPayPaise, setTotalToPayPaise] = useState(0);
  const [gstPaise, setGstPaise] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load price from context and set lock expiry
  useEffect(() => {
    if (livePrice) {
      setBuyPricePaise(livePrice.buyPricePaise || 754200);
      setPriceUpdatedAt(livePrice.updatedAt || new Date().toISOString());
      // Set mock lock expiry 5 minutes from now
      const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      setLockExpiresAt(expiry);
    }
  }, [livePrice]);

  // Timer countdown
  useEffect(() => {
    if (!lockExpiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(lockExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const min = Math.floor((diff / 1000) / 60);
        const sec = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const onAmountChanged = (val: string) => {
    const clean = val.replace(/[^\d.]/g, '');
    setAmountInput(clean);
    
    const parsedAmt = parseFloat(clean);
    if (!isNaN(parsedAmt) && parsedAmt > 0) {
      // 3% GST logic
      const totalPaise = Math.round(parsedAmt * 100);
      const basePaise = Math.round(totalPaise / 1.03);
      const calculatedGst = totalPaise - basePaise;

      setTotalToPayPaise(totalPaise);
      setGstPaise(calculatedGst);

      // Convert amount to weight: weight = baseValuePaise / pricePerGramPaise
      const pricePerGm = buyPricePaise;
      if (pricePerGm > 0) {
        const wt = basePaise / pricePerGm;
        setWeightInput(wt.toFixed(4));
      }
    } else {
      setTotalToPayPaise(0);
      setGstPaise(0);
      setWeightInput('');
    }
  };

  const onWeightChanged = (val: string) => {
    const clean = val.replace(/[^\d.]/g, '');
    setWeightInput(clean);

    const parsedWt = parseFloat(clean);
    if (!isNaN(parsedWt) && parsedWt > 0) {
      const pricePerGm = buyPricePaise;
      const basePaise = Math.round(parsedWt * pricePerGm);
      const totalPaise = Math.round(basePaise * 1.03);
      const calculatedGst = totalPaise - basePaise;

      setTotalToPayPaise(totalPaise);
      setGstPaise(calculatedGst);
      setAmountInput((totalPaise / 100).toFixed(2));
    } else {
      setTotalToPayPaise(0);
      setGstPaise(0);
      setAmountInput('');
    }
  };

  const handlePay = async () => {
    if (totalToPayPaise <= 0) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const userId = SessionManager.getUserId() || 'user-id-999';
      const response = await ApiClient.post('api/Payment/create-order', {
        userId,
        amountPaise: totalToPayPaise,
        schemeId: null
      });

      if (response.data) {
        const order = response.data;
        // Verify payment mock
        const verifyRes = await ApiClient.post('api/Payment/verify', {
          userId,
          orderId: order.orderId,
          paymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
          signature: 'sig_mock_xyz'
        });

        if (verifyRes.data && verifyRes.data.success) {
          const receiptJson = JSON.stringify({
            transactionId: order.orderId,
            type: 'BUY',
            amountPaise: totalToPayPaise,
            goldWeightMg: Math.round(parseFloat(weightInput) * 1000),
            createdAt: new Date().toISOString(),
            rateSource: 'Live',
            schemeName: 'Digital Gold Savings'
          });
          await refreshData();
          navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
        } else {
          setErrorMsg(verifyRes.data.message || 'Payment verification failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction processing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      {/* Top Bar */}
      <div style={{
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
          Buy Gold / Silver
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Live Card */}
        <div style={{
          background: 'var(--gradient-brand)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          position: 'relative',
          boxShadow: '0 8px 16px rgba(74, 14, 78, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>Current Gold Price</span>
                <span style={{
                  fontSize: '9px', fontWeight: 'bold', color: '#FFB300', background: 'rgba(255, 179, 0, 0.15)',
                  padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 179, 0, 0.3)'
                }}>
                  LOCKED
                </span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--gold-primary)', fontFamily: 'var(--font-poppins)', margin: 0 }}>
                {formatRupees(buyPricePaise)} <span style={{ fontSize: '14px', color: 'white', opacity: 0.8 }}>/ g</span>
              </h2>
              {priceUpdatedAt && (
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                  Last updated: {formatDate(priceUpdatedAt)}
                </span>
              )}
            </div>

            {timeLeft && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <Info size={16} color="rgba(255,255,255,0.5)" />
                <span style={{ fontSize: '11px', color: '#FFB300', fontWeight: 'bold' }}>
                  {timeLeft}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Enter investment amount</span>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>Amount (Rupees)</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '14px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>₹</span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="Enter Amount"
                value={amountInput}
                onChange={(e) => onAmountChanged(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0 16px 0 32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>OR</span>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', marginLeft: '4px' }}>Weight (Grams)</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                placeholder="Enter Weight"
                value={weightInput}
                onChange={(e) => onWeightChanged(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0 40px 0 16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
              />
              <span style={{ position: 'absolute', right: '16px', top: '14px', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>g</span>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        {totalToPayPaise > 0 && (
          <div className="glass-card" style={{
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '1px solid #ECECEC'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Installment Value</span>
              <span style={{ fontWeight: '500' }}>{formatRupees(totalToPayPaise - gstPaise)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>GST (3%)</span>
              <span style={{ fontWeight: '500' }}>{formatRupees(gstPaise)}</span>
            </div>
            <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
              <span>Total to Pay</span>
              <span style={{ fontSize: '16px', color: 'var(--brand-accent)' }}>{formatRupees(totalToPayPaise)}</span>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {errorMsg && (
          <div style={{ color: 'var(--error-red)', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', marginBottom: '12px' }}>
            {errorMsg}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={totalToPayPaise <= 0 || isLoading}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--brand-dark)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: totalToPayPaise > 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (totalToPayPaise <= 0 || isLoading) ? 0.5 : 1,
            boxShadow: '0 8px 16px var(--brand-glow)'
          }}
        >
          {isLoading ? (
            <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </div>
  );
};
