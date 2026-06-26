import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { ArrowLeft, Send, Copy, Share2, Bell, Clock, Headset } from 'lucide-react';
import { useTranslation } from '../utils/translation';
import { useApp } from '../context/AppContext';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';


const Header: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="app-header-bar" style={{
    background: 'white',
    borderBottom: '1px solid #ECECEC',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }}>
    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <ArrowLeft size={24} />
    </button>
    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
      {title}
    </span>
  </div>
);

// ── HOW IT WORKS ───────────────────────────────────────────────────────────
export const HowItWorks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="How It Works" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { step: '1', title: 'Start Savings', desc: 'Choose gold or silver, select installment chits starting at ₹100, and setup recurring payments.' },
          { step: '2', title: 'Accumulate Pure Weight', desc: 'Every payment purchases certified 24K Gold or 99.9% Silver backed in vault reserves at live market rates.' },
          { step: '3', title: 'Earn Milestones Bonus', desc: 'Earn loyalty bonuses of up to 7.5% depending on when you make your monthly payments.' },
          { step: '4', title: 'Maturity Payout', desc: 'Exchange matured metal balance for physical jewelry, coins, or liquidate back into cash payouts.' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', background: 'white' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-mid)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              {item.step}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── FAQ ────────────────────────────────────────────────────────────────────
export const Faq: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const faqs = [
    { q: t('faq_1_q'), a: t('faq_1_a') },
    { q: t('faq_2_q'), a: t('faq_2_a') },
    { q: t('faq_3_q'), a: t('faq_3_a') },
    { q: t('faq_4_q'), a: t('faq_4_a') }
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title={t('faqs')} onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-card" style={{ borderRadius: '12px', background: 'white', overflow: 'hidden' }}>
            <div
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              style={{ padding: '16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{faq.q}</span>
              <span>{activeIdx === idx ? '−' : '+'}</span>
            </div>
            {activeIdx === idx && (
              <div style={{ padding: '0 16px 16px 16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', borderTop: '1px solid #F3F4F6' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── SAFETY & TRUST ─────────────────────────────────────────────────────────
export const SafetyTrust: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="Safety & Trust" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <span style={{ fontSize: '48px' }}>🛡️</span>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', marginTop: '8px' }}>Your Trust is Our Priority</h2>
        </div>
        {[
          { title: '100% Insured Bullion', desc: 'All gold and silver holdings are fully insured against any theft or damage under registered trust vaults.' },
          { title: 'Independent Audits', desc: 'Third-party custodians audit the physical lockbox periodically to verify exact backings matching digital balances.' },
          { title: 'Secure Payout Transfers', desc: 'Withdrawals are direct bank transfers processed securely using validated payout interfaces.' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'white' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{item.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ABOUT ──────────────────────────────────────────────────────────────────
export const About: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="About Us" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <h1 style={{ fontSize: '26px', color: 'var(--brand-dark)' }}>Aishwaryam</h1>
          <p style={{ fontSize: '12px', color: 'var(--gold-deep)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Digital Metal Platform</p>
        </div>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '20px' }}>
          Aishwaryam provides automated metal accumulation savings plans to empower families to invest in certified 24K gold and 99.9% silver. Start small, save monthly, earn loyalty bonuses, and claim ornaments seamlessly.
          <br /><br />
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};

// ── REDEMPTION GUIDE ───────────────────────────────────────────────────────
export const RedemptionGuide: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="Redemption Guide" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { title: 'Jewelry showroom swap', desc: 'Navigate to matured plan details, choose Showroom Collection, confirm credentials, and visit partner showrooms to pick gold ornaments with zero making wastage.' },
          { title: 'Secured Home Delivery', desc: 'Select Gold Coin Delivery, choose coins or bars denominations, verify shipping address, and receive insured doorstep courier shipments.' },
          { title: 'Cash liquidation to bank', desc: 'Select Payout to Bank, sell metal back at live market sell rates, and receive immediate money credited into linked bank account.' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'white' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold' }}>{item.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── WHY GOLD ───────────────────────────────────────────────────────────────
export const WhyGold: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="Why Invest in Gold?" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { title: 'Inflation Shield', desc: 'Gold historically preserves purchasing power, making it the ultimate hedge against inflation and currency depreciation.' },
          { title: 'High Liquidity', desc: 'Convert digital gold balances into cash transfers or physical ornaments instantly without delays.' },
          { title: 'Tangible Wealth Security', desc: 'Gold is a globally accepted asset class, providing reliable financial backup during emergencies.' }
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'white' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{item.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── DIGI GOLD INFO ─────────────────────────────────────────────────────────
export const DigiGoldInfo: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title="Digital Metal chits" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <span style={{ fontSize: '48px' }}>✨</span>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Accumulate Bullion Online</h2>
          </div>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '20px' }}>
            Aishwaryam Digital Gold plans allow you to purchase pure gold and silver fractions starting at ₹100. Skip the hassle of storage locks and enjoy live market rate conversions, zero wastage swaps, and secure payouts.
          </div>
        </div>
        <button
          onClick={() => navigate('/scheme-explorer')}
          style={{
            width: '100%', height: '52px', borderRadius: '14px', background: 'var(--brand-dark)', color: 'white',
            border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginBottom: '16px'
          }}
        >
          Explore Saving Plans
        </button>
      </div>
    </div>
  );
};

// ── AI ASSISTANT CHATBOT ───────────────────────────────────────────────────
export const AiAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
    { 
      sender: 'bot', 
      text: t('ai_greeting'), 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Keep greeting in sync if language switches
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{
          sender: 'bot',
          text: t('ai_greeting'),
          time: prev[0].time
        }];
      }
      return prev;
    });
  }, [lang]);

  const quickReplies = [
    { titleKey: 'qr_scheme_title', responseKey: 'qr_scheme_response' },
    { titleKey: 'qr_bonus_title', responseKey: 'qr_bonus_response' },
    { titleKey: 'qr_safety_title', responseKey: 'qr_safety_response' },
    { titleKey: 'qr_redemption_title', responseKey: 'qr_redemption_response' },
    { titleKey: 'qr_missed_title', responseKey: 'qr_missed_response' },
    { titleKey: 'qr_kyc_title', responseKey: 'qr_kyc_response' },
    { titleKey: 'qr_gst_title', responseKey: 'qr_gst_response' }
  ] as const;

  const handleSend = async (customText?: string, botStaticResponse?: string) => {
    const textToSend = (customText || inputVal).trim();
    if (!textToSend) return;
    if (!customText) setInputVal('');

    // Add user message bubble
    setMessages((prev) => [...prev, {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsTyping(true);

    if (botStaticResponse) {
      // Simulate static quick-reply response (FAQ fallback)
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          sender: 'bot',
          text: botStaticResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 600);
    } else {
      // Dynamic LLM query to Backend
      try {
        const userId = SessionManager.getUserId() || '00000000-0000-0000-0000-000000000000';
        const res = await ApiClient.post('api/Chatbot/query', {
          userId: userId,
          message: textToSend
        });
        
        setMessages((prev) => [...prev, {
          sender: 'bot',
          text: res.data.message || t('qr_missed_response'), // fallback
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } catch (err) {
        setMessages((prev) => [...prev, {
          sender: 'bot',
          text: lang === 'ta' 
            ? 'மன்னிக்கவும்! தற்காலிக சேவை கோளாறு. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' 
            : 'Apologies, a network glitch occurred. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F5F5', position: 'relative' }}>
      
      {/* Custom localized header with Talk to a Human button */}
      <div className="app-header-bar" style={{
        background: 'white',
        borderBottom: '1px solid #ECECEC',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>
              {t('ai_assistant_title')}
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {t('ai_assistant_subtitle')}
            </span>
          </div>
        </div>

        <button 
          onClick={() => window.location.href = 'tel:+919443000000'}
          style={{
            background: 'rgba(74, 14, 78, 0.06)',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--brand-dark)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Headset size={14} />
          <span>{t('escalate_support')}</span>
        </button>
      </div>
      
      {/* Messages view */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={i} style={{
              alignSelf: isBot ? 'flex-start' : 'flex-end',
              maxWidth: '80%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                background: isBot ? 'white' : 'var(--brand-dark)',
                color: isBot ? 'var(--text-primary)' : 'white',
                padding: '12px 16px',
                borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                fontSize: '13px',
                lineHeight: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                whiteSpace: 'pre-line'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-light)', alignSelf: isBot ? 'flex-start' : 'flex-end' }}>
                {msg.time}
              </span>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ 
            alignSelf: 'flex-start', 
            background: 'white', 
            padding: '10px 16px', 
            borderRadius: '16px 16px 16px 4px', 
            fontSize: '12px', 
            color: 'var(--text-light)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ animation: 'pulse 1s infinite' }}>●</span>
            <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
            <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Replies chips - Horizontal scroll container */}
      <div style={{ 
        padding: '0 16px 8px 16px', 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {quickReplies.map((qr, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(t(qr.titleKey), t(qr.responseKey))}
            style={{
              display: 'inline-block',
              background: 'white',
              border: '1px solid rgba(74, 14, 78, 0.15)',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--brand-dark)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {t(qr.titleKey)}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #ECECEC', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={t('type_message')}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          style={{
            flex: 1,
            height: '46px',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.1)',
            padding: '0 16px',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSend()}
          style={{
            width: '46px', height: '46px', borderRadius: '50%', background: 'var(--brand-dark)', color: 'white',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// ── REFERRAL SCREEN ────────────────────────────────────────────────────────
export const Referral: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useApp();
  const { t, lang } = useTranslation();
  const [refCode, setRefCode] = useState(profile?.referralCode || 'AISH987');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalBonusMg, setTotalBonusMg] = useState(0);

  useEffect(() => {
    if (profile?.referralCode) {
      setRefCode(profile.referralCode);
    }
  }, [profile]);

  useEffect(() => {
    const loadRef = async () => {
      try {
        const userId = SessionManager.getUserId() || 'user-id-999';
        const res = await ApiClient.get(`api/ReferralNetwork/${userId}`);
        if (res.data) {
          setTotalReferrals(res.data.totalReferrals || 0);
          setTotalBonusMg(res.data.totalBonusBonusMg || res.data.totalBonusMg || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadRef();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    alert(lang === 'ta' ? 'பரிந்துரைக் குறியீடு நகலெடுக்கப்பட்டது!' : 'Referral code copied to clipboard!');
  };

  const handleShare = async () => {
    const shareText = lang === 'ta'
      ? `ஐஸ்வர்யாSavings திட்டத்தில் தங்கம் அல்லது வெள்ளி சேமிக்கத் தொடங்குங்கள்! எனது பரிந்துரைக் குறியீடு: ${refCode} பயன்படுத்தி முதல் தவணையில் போனஸ் பெறுங்கள்.`
      : `Start saving in gold or silver on Aishwaryam! Use my referral code: ${refCode} to get a bonus on your first chit payment.`;
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: 'Aishwaryam Referral',
          text: shareText,
          url: window.location.origin,
          dialogTitle: 'Share with friends'
        });
      } catch (err) {
        console.error('Error sharing via Capacitor:', err);
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aishwaryam Referral',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Error sharing via Web API:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert(lang === 'ta' ? 'பரிந்துரைச் செய்தி நகலெடுக்கப்பட்டது! நண்பர்களுடன் பகிர்ந்து கொள்ளுங்கள்.' : 'Referral message copied to clipboard! Share it with your friends.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <Header title={t('referrals_rewards')} onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <span style={{ fontSize: '48px' }}>🎁</span>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', marginTop: '8px' }}>{t('invite_friends_earn')}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{t('invite_desc')}</p>
        </div>

        {/* Stats view */}
        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px', borderRadius: '16px', background: 'white', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{t('total_invited')}</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{totalReferrals} {t('friends_suffix')}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{t('gold_earned')}</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFB300' }}>{(totalBonusMg / 1000).toFixed(3)} g</span>
          </div>
        </div>

        {/* Code copier */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('your_referral_code')}</span>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--brand-accent)', letterSpacing: '2px' }}>{refCode}</div>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button onClick={handleCopy} style={{ flex: 1, height: '44px', borderRadius: '10px', background: 'var(--gold-soft)', color: 'var(--gold-deep)', border: '1px solid rgba(184, 134, 11, 0.2)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Copy size={16} /> {t('copy')}
            </button>
            <button onClick={handleShare} style={{ flex: 1, height: '44px', borderRadius: '10px', background: 'var(--brand-dark)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Share2 size={16} /> {t('share')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── LEGAL HUB ─────────────────────────────────────────────────────────────
export const LegalHub: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F9FAFB' }}>
      <Header title={t('legal_compliance')} onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { title: t('terms_of_service'), desc: t('legal_terms_desc') },
          { title: t('privacy_policy_title'), desc: t('legal_privacy_desc') },
          { title: t('refunds_cancellations'), desc: t('legal_refunds_desc') }
        ].map((item, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'white', cursor: 'pointer' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{item.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '18px' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── GOLD RATE ALERTS ──────────────────────────────────────────────────────
export const GoldRateAlerts: React.FC = () => {
  const navigate = useNavigate();
  const [alertPrice, setAlertPrice] = useState('7500');
  const [isEnabled, setIsEnabled] = useState(true);

  const handleSave = () => {
    alert('Rate alert preference saved successfully!');
    navigate(-1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <Header title="Gold Rate Alerts" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Target Gold Price (₹/g)</label>
            <input
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              style={{
                width: '100%', height: '48px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Notify via Push Notification</span>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span className="slider-switch" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isEnabled ? 'var(--brand-mid)' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: isEnabled ? '20px' : '4px', bottom: '3px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s' }} />
              </span>
            </label>
          </div>
        </div>

        <button onClick={handleSave} style={{ width: '100%', height: '52px', borderRadius: '14px', background: 'var(--brand-dark)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 16px var(--brand-glow)' }}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

// ── MY BONUSES ─────────────────────────────────────────────────────────────
export const MyBonuses: React.FC = () => {
  const navigate = useNavigate();
  const { transactions } = useApp();

  const getBonusDisplayDetails = (tx: any) => {
    if (tx.transactionType === 'EVENT_BONUS') {
      return {
        name: tx.rateSource ? `Promotional Reward (${tx.rateSource})` : 'Promotional Bonus Reward',
        weight: `${tx.goldWeightMg} mg`,
        amount: 'Promo Reward',
        percentage: tx.bonusPercentage ? `${tx.bonusPercentage}%` : 'N/A'
      };
    }
    if (tx.transactionType === 'BONUS') {
      return {
        name: tx.schemeName ? `Scheme Loyalty Reward (${tx.schemeName})` : 'Scheme Loyalty Bonus',
        weight: `${tx.goldWeightMg} mg`,
        amount: 'Loyalty Reward',
        percentage: tx.bonusPercentage ? `${tx.bonusPercentage}%` : 'N/A'
      };
    }
    return {
      name: tx.schemeName ? `Loyalty Bonus on ${tx.schemeName}` : 'Installment Loyalty Bonus',
      weight: `${tx.bonusGoldMg} mg`,
      amount: `Paid ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tx.amountPaise / 100)}`,
      percentage: tx.bonusPercentage ? `${tx.bonusPercentage}%` : '7.5%'
    };
  };

  const bonusTransactions = transactions.filter(t => 
    ((t.transactionType === 'BUY' || t.transactionType === 'INSTALLMENT') && t.bonusGoldMg > 0) ||
    t.transactionType === 'EVENT_BONUS'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <Header title="My Bonuses" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bonusTransactions.map((tx, idx) => {
          const details = getBonusDisplayDetails(tx);
          return (
            <div key={tx.id || idx} className="glass-card" style={{ padding: '16px', borderRadius: '12px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', color: 'var(--brand-dark)' }}>{details.name}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ccc', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {details.amount} ({details.percentage})
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success-green)', whiteSpace: 'nowrap', flexShrink: 0, textAlign: 'right' }}>+ {details.weight}</span>
            </div>
          );
        })}
        {bonusTransactions.length === 0 && (
          <div className="glass-card" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: '16px', background: 'white', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No bonuses earned yet. Start saving in a scheme or refer friends to earn bonus gold!
          </div>
        )}
      </div>
    </div>
  );
};

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, refreshData } = useApp();
  const [localNotifs, setLocalNotifs] = useState<any[]>([]);

  useEffect(() => {
    refreshData().catch(err => console.error("Error refreshing notifications:", err));
  }, []);

  useEffect(() => {
    if (notifications) {
      setLocalNotifs(notifications);
    }
  }, [notifications]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      if (id && id !== 'n1') {
        await ApiClient.put(`api/Notification/${id}/read`);
      }
      refreshData(true);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      refreshData();
    }
  };

  const handleClearNotification = async (id: string) => {
    // Optimistic UI update
    setLocalNotifs(prev => prev.filter(n => n.id !== id));
    try {
      if (id && id !== 'n1') {
        await ApiClient.delete(`api/Notification/${id}`);
      }
      refreshData(true);
    } catch (err) {
      console.error("Error clearing notification:", err);
      refreshData();
    }
  };

  const displayNotifs = localNotifs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <Header title="Notifications" onBack={() => navigate(-1)} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayNotifs.map((n) => (
          <div 
            key={n.id} 
            className="glass-card" 
            onClick={() => handleMarkAsRead(n.id)}
            style={{ padding: '16px', borderRadius: '12px', background: 'white', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="var(--brand-dark)" />
            </div>
            <div style={{ flex: 1, marginRight: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {n.title}
                  {!n.isRead && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--error-red)',
                      display: 'inline-block'
                    }} />
                  )}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '16px', margin: 0 }}>{n.message}</p>
            </div>
            <button 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                fontSize: '11px',
                opacity: 0.5
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClearNotification(n.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        {localNotifs.length === 0 && (!notifications || notifications.length === 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-light)', gap: '12px' }}>
            <span style={{ fontSize: '40px' }}>🔔</span>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>No new notifications</span>
          </div>
        )}
      </div>
    </div>
  );
};
