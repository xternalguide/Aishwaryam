import React, { useState, useEffect } from 'react';
import { ApiClient } from '../utils/ApiClient';
import { 
  ArrowLeft, 
  Gift, 
  Award, 
  HelpCircle,
  Clock
} from 'lucide-react';

const CountdownTimer: React.FC<{ expiresAt: string }> = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiresAt) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let str = '';
      if (days > 0) str += `${days}d `;
      str += `${hours.toString().padStart(2, '0')}h : `;
      str += `${minutes.toString().padStart(2, '0')}m : `;
      str += `${seconds.toString().padStart(2, '0')}s`;
      setTimeLeft(str);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
};

interface ActiveOffer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  bonusWorthPaise: number;
  bonusGoldMg: number;
  bonusPercent: number;
  minPurchaseAmountPaise: number;
  minPurchaseGoldMg: number;
  bannerUrl: string | null;
  expiresAt: string;
}

interface ClaimedOffer {
  id: string;
  offerTitle: string;
  offerType: string;
  claimedAt: string;
  awardedGoldMg: number;
  awardedAmountPaise: number;
}

export const PromotionalOffersPage: React.FC = () => {
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [claimedOffers, setClaimedOffers] = useState<ClaimedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const userId = localStorage.getItem('userId') || '';

  const fetchData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // Get active offers
      const activeRes = await ApiClient.get(`api/Offers/active/${userId}`);
      if (activeRes.data) {
        setActiveOffers(activeRes.data);
      }

      // Get user claimed offers
      const claimsRes = await ApiClient.get('api/Offers/claimed-users');
      if (claimsRes.data) {
        const userClaims = claimsRes.data.filter((c: any) => c.userId === userId);
        setClaimedOffers(userClaims);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleGoBack = () => {
    window.location.hash = '#/dashboard';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0C20', // Sleek Premium Dark Background
      color: '#FFFFFF',
      fontFamily: 'var(--font-poppins)',
      padding: '24px 16px 80px 16px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
        maxWidth: '600px',
        margin: '0 auto 28px auto'
      }}>
        <button
          onClick={handleGoBack}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>Offers &amp; Campaigns</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '2px 0 0 0' }}>Seasonal savings &amp; purchase rewards</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Active Campaigns Section */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Gift size={18} />
            <span>Active Seasonal Campaigns</span>
          </h2>

          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading campaigns...</div>
          ) : activeOffers.length === 0 ? (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <HelpCircle size={32} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
              <p style={{ fontSize: '13.5px', margin: 0 }}>No active promotional campaigns at the moment.</p>
              <p style={{ fontSize: '11px', margin: 0 }}>Check back during Pongal, Diwali, and festive seasons!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeOffers.map(offer => (
                <div key={offer.id} style={{
                  background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 12, 32, 0.8) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.25)', // Elegant Gold Border hint
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Visual Accent */}
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span style={{
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--gold-primary)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}>
                      {offer.offerType === 'SEASONAL' ? '🌸 FESTIVE OFFER' : '⚡ SPECIAL OFFER'}
                    </span>
                    
                    <span style={{
                      fontSize: '11.5px',
                      color: '#FF8A8A',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4.5px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace'
                    }}>
                      <Clock size={12} />
                      <CountdownTimer expiresAt={offer.expiresAt} />
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    {offer.title}
                  </h3>
                   <p 
                     style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 16px 0', lineHeight: '1.5' }}
                     dangerouslySetInnerHTML={{ __html: offer.description }}
                   />
                  
                  {offer.bannerUrl && (
                    <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={offer.bannerUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Campaign Poster" />
                    </div>
                  )}

                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>Locked Bonus Reward</span>
                      <strong style={{ fontSize: '15px', color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                        {offer.bonusWorthPaise > 0 ? `₹${offer.bonusWorthPaise / 100} Gold` : ''}
                        {offer.bonusGoldMg > 0 ? `${offer.bonusGoldMg / 1000}g Gold` : ''}
                        {offer.bonusPercent > 0 ? `${offer.bonusPercent}% Extra Gold` : ''}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase' }}>Rule Threshold</span>
                      <strong style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 'bold' }}>
                        {offer.minPurchaseGoldMg > 0 && `Buy > ${offer.minPurchaseGoldMg / 1000}g`}
                        {offer.minPurchaseAmountPaise > 0 && `Buy > ₹${offer.minPurchaseAmountPaise / 100}`}
                        {offer.minPurchaseGoldMg === 0 && offer.minPurchaseAmountPaise === 0 && 'Any Purchase'}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Claimed/Awarded Rewards Section */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Award size={18} />
            <span>My Unlocked Bonus Earnings</span>
          </h2>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {claimedOffers.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                You have not availed any purchase offer bonuses yet.
              </div>
            ) : (
              claimedOffers.map(claim => (
                <div key={claim.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  borderLeft: '4px solid #10B981'
                }}>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#FFFFFF', margin: 0 }}>
                      {claim.offerTitle}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '2px' }}>
                      Claimed: {new Date(claim.claimedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14.5px', color: '#10B981', fontWeight: 'bold', display: 'block' }}>
                      +{claim.awardedGoldMg > 0 ? (claim.awardedGoldMg / 1000).toFixed(4) : '0.0000'}g
                    </span>
                    {claim.awardedAmountPaise > 0 && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        (Worth ₹{claim.awardedAmountPaise / 100})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
