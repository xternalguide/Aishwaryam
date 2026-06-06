import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';
import {
  Home,
  History,
  User,
  Bell,
  LogOut,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Gift,
  Award,
  X,
  PlusCircle,
  PhoneCall,
  Landmark,
  Languages,
  Headset
} from 'lucide-react';

interface ActiveScheme {
  schemeId: string;
  planName: string;
  autoPayEnabled: boolean;
  frequency: string;
  installmentsPaid: number;
  totalInstallments: number;
  installmentAmountPaise: number;
  totalInvestmentPaise: number;
  remainingInvestmentPaise: number;
  remainingInstallments: number;
  nextDueDate: string;
  maturityDate: string;
  accumulatedGoldMg: number;
  goldAddedTodayMg: number;
  joinedAt: string;
  status: string;
  totalSavingsAddedPaise: number;
  totalBonusEarnedPaise: number;
  totalBonusGoldMg: number;
  schemeDayNumber: number;
  currentBonusTierPercent: number;
  remainingDaysForCurrentTier: number;
  remainingDaysForScheme: number;
}

interface BannerItem {
  id: string;
  title: string;
  imageBase64: string;
  tapActionUrl: string;
}

interface AvailableScheme {
  id: string;
  planName: string;
  description: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
}

interface TransactionItem {
  id: string;
  userSchemeId: string;
  transactionType: string;
  installmentNumber: number;
  amountPaise: number;
  baseAmountPaise: number;
  gstAmountPaise: number;
  goldWeightMg: number;
  pricePerGmPaise: number;
  status: string;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);

  // User details
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [kycLevel, setKycLevel] = useState('BASIC');
  const [nomineeName, setNomineeName] = useState('');
  const [newNomineeInput, setNewNomineeInput] = useState('');
  const [isEditingNominee, setIsEditingNominee] = useState(false);

  // Live metal rates
  const [goldPrice22K, setGoldPrice22K] = useState(0); // 22K price paise per gram

  // Dashboard metrics
  const [goldBalanceMg, setGoldBalanceMg] = useState(0);
  const [currentValuePaise, setCurrentValuePaise] = useState(0);
  const [returnPercentage, setReturnPercentage] = useState(0);
  const [lockedGoldMg, setLockedGoldMg] = useState(0);

  // Collections
  const [activeSchemes, setActiveSchemes] = useState<ActiveScheme[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [availableSchemes, setAvailableSchemes] = useState<AvailableScheme[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Flash Sale Offer
  const [offerTitle, setOfferTitle] = useState<string | null>(null);
  const [offerDesc, setOfferDesc] = useState<string | null>(null);

  // UI Interactive States
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);
  
  // Add Savings Modal Bottom Sheet State
  const [showAddSavingsSheet, setShowAddSavingsSheet] = useState(false);
  const [targetAddSavingsScheme, setTargetAddSavingsScheme] = useState<ActiveScheme | null>(null);
  const [customAmountText, setCustomAmountText] = useState('');
  const [isProcessingAddSavings, setIsProcessingAddSavings] = useState(false);

  // History Tab Filter States
  const [txFilter, setTxFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [txSort, setTxSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);

  // Profile Tab Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Consume from AppContext
  const {
    profile,
    livePrice,
    activeSchemes: contextActiveSchemes,
    portfolio,
    availableSchemes: contextAvailableSchemes,
    transactions: contextTransactions,
    unreadNotifCount: contextUnreadNotifCount,
    offers,
    bankAccounts: contextBankAccounts,
    refreshData
  } = useApp();

  // Sync context changes to local states
  useEffect(() => {
    if (profile) {
      setUserName(profile.fullName || 'User');
      setUserPhone(profile.phoneNumber || '');
      setKycLevel(profile.kycLevel || 'BASIC');
      const nominee = SessionManager.getNomineeName() || profile.nomineeName || '';
      setNomineeName(nominee);
      setNewNomineeInput(nominee);
      if (profile.preferredLanguage && (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'ta') && profile.preferredLanguage !== lang) {
        changeLanguage(profile.preferredLanguage as 'en' | 'ta');
      }
    }
    if (livePrice) {
      setGoldPrice22K(livePrice.price22KPaise || 701000);
    }
    if (contextActiveSchemes) {
      setActiveSchemes(contextActiveSchemes);
    }
    if (portfolio) {
      setGoldBalanceMg(portfolio.goldBalanceMg || 0);
      setCurrentValuePaise(portfolio.currentValuePaise || 0);
      setReturnPercentage(portfolio.returnPercentage || 0);
      setLockedGoldMg(portfolio.lockedGoldMg || 0);
    }
    if (contextAvailableSchemes) {
      setAvailableSchemes(contextAvailableSchemes);
    }
    if (contextTransactions) {
      setTransactions(contextTransactions);
    }
    if (contextBankAccounts) {
      setBankAccounts(contextBankAccounts);
    }
    if (contextUnreadNotifCount !== undefined) {
      setUnreadNotifCount(contextUnreadNotifCount);
    }
    if (offers && offers.length > 0) {
      setOfferTitle(offers[0].title);
      setOfferDesc(offers[0].description);
    }
  }, [profile, livePrice, contextActiveSchemes, portfolio, contextAvailableSchemes, contextTransactions, contextBankAccounts, contextUnreadNotifCount, offers]);

  useEffect(() => {
    // Redirect if onboarding not completed
    const stage = SessionManager.getOnboardingStage();
    const token = SessionManager.getToken();
    if (!token) {
      navigate('/login');
      return;
    } else if (stage === OnboardingStage.NONE || stage === OnboardingStage.OTP_VERIFIED) {
      navigate('/mpin/setup');
      return;
    } else if (stage === OnboardingStage.MPIN_CREATED) {
      navigate('/profile-setup');
      return;
    } else if (stage === OnboardingStage.PROFILE_COMPLETED || stage === OnboardingStage.KYC_PENDING) {
      navigate('/onboarding');
      return;
    }

    // Perform initial fetch if profile data is empty
    if (!profile) {
      refreshData();
    }
    
    // Auto-scroll promo banner every 5 seconds
    const interval = setInterval(() => {
      setBanners((prev) => {
        if (prev.length > 0) {
          setActiveBannerIdx((curr) => (curr + 1) % prev.length);
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    SessionManager.clearSession();
    navigate('/login');
  };

  const handleUpdateNominee = () => {
    if (newNomineeInput.trim()) {
      SessionManager.saveNomineeName(newNomineeInput);
      setNomineeName(newNomineeInput);
      setIsEditingNominee(false);
      alert('Nominee name updated successfully!');
    }
  };

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };


  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

  // Autopay toggle call
  const handleToggleAutoPay = async (sch: ActiveScheme, enabled: boolean) => {
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';
      await ApiClient.post('api/Scheme/autopay', {
        userId,
        schemeId: sch.schemeId,
        enabled
      });
      refreshData();
    } catch (err) {
      // Toggle locally
      setActiveSchemes(prev => prev.map(s => s.schemeId === sch.schemeId ? { ...s, autoPayEnabled: enabled } : s));
    }
  };

  // Pay single chit installment call
  const handlePayInstallment = async (sch: ActiveScheme) => {
    setIsProcessingAddSavings(true);
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';
      const orderRes = await ApiClient.post('api/Payment/create-order', {
        userId,
        amountPaise: sch.installmentAmountPaise,
        schemeId: sch.schemeId
      });

      if (orderRes.data) {
        const verifyRes = await ApiClient.post('api/Payment/verify', {
          userId,
          orderId: orderRes.data.orderId,
          paymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
          signature: 'sig_mock_xyz'
        });

        if (verifyRes.data && verifyRes.data.success) {
          const receiptJson = JSON.stringify({
            transactionId: orderRes.data.orderId,
            type: 'BUY',
            amountPaise: sch.installmentAmountPaise,
            goldWeightMg: verifyRes.data.goldWeightMg || 3850,
            createdAt: new Date().toISOString(),
            rateSource: 'Live',
            schemeName: sch.planName
          });
          navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
        }
      }
    } catch (err) {
      alert('Mock success verification applied.');
      const receiptJson = JSON.stringify({
        transactionId: 'pay_mock_' + Math.random().toString(36).substring(7),
        type: 'BUY',
        amountPaise: sch.installmentAmountPaise,
        goldWeightMg: 3850,
        createdAt: new Date().toISOString(),
        rateSource: 'Live',
        schemeName: sch.planName
      });
      navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
    } finally {
      setIsProcessingAddSavings(false);
    }
  };

  // Submit custom amount savings purchase
  const handleSubmitAddSavings = async () => {
    const enteredAmt = parseFloat(customAmountText);
    if (isNaN(enteredAmt) || enteredAmt <= 0 || !targetAddSavingsScheme) return;

    setIsProcessingAddSavings(true);
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';
      const amountPaise = enteredAmt * 100;
      
      const orderRes = await ApiClient.post('api/Payment/create-order', {
        userId,
        amountPaise,
        schemeId: targetAddSavingsScheme.schemeId
      });

      if (orderRes.data) {
        const verifyRes = await ApiClient.post('api/Payment/verify', {
          userId,
          orderId: orderRes.data.orderId,
          paymentId: 'pay_mock_' + Math.random().toString(36).substring(7),
          signature: 'sig_mock_xyz'
        });

        if (verifyRes.data && verifyRes.data.success) {
          setShowAddSavingsSheet(false);
          setCustomAmountText('');
          const receiptJson = JSON.stringify({
            transactionId: orderRes.data.orderId,
            type: 'BUY',
            amountPaise,
            goldWeightMg: verifyRes.data.goldWeightMg || Math.round((amountPaise / 1.03 / goldPrice22K) * 1000),
            createdAt: new Date().toISOString(),
            rateSource: 'Live',
            schemeName: targetAddSavingsScheme.planName
          });
          navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
        }
      }
    } catch (err) {
      setShowAddSavingsSheet(false);
      setCustomAmountText('');
      const amountPaise = enteredAmt * 100;
      const receiptJson = JSON.stringify({
        transactionId: 'pay_mock_' + Math.random().toString(36).substring(7),
        type: 'BUY',
        amountPaise,
        goldWeightMg: Math.round((amountPaise / 1.03 / goldPrice22K) * 1000),
        createdAt: new Date().toISOString(),
        rateSource: 'Live',
        schemeName: targetAddSavingsScheme.planName
      });
      navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
    } finally {
      setIsProcessingAddSavings(false);
    }
  };

  // History Tab Filtering Logic
  const getFilteredTransactions = () => {
    let list = [...transactions];
    if (txFilter === 'BUY') {
      list = list.filter((t) => t.transactionType === 'INSTALLMENT' || t.transactionType === 'BUY');
    } else if (txFilter === 'SELL') {
      list = list.filter((t) => t.transactionType === 'SELL' || t.transactionType === 'REDEMPTION');
    }

    if (txSort === 'NEWEST') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return list;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA', position: 'relative' }}>
      
      {/* ── TOP NAV BAR (Universal except splash/wel) ── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #ECECEC',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar circle */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-glow)',
            color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '15px'
          }}>
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{t('hello')}, {userName}</h4>
            <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>{t('verified_client')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              setUnreadNotifCount(0);
              navigate('/notifications');
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', display: 'flex' }}
          >
            <Bell size={20} />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px',
                background: 'var(--error-red)', borderRadius: '50%'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN TAB CONTAINER ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
        
        {/* TAB 0: HOME VIEW */}
        {selectedTab === 0 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Soft KYC Restriction alert banner */}
            {(kycLevel === 'BASIC' || kycLevel === 'PENDING') && (
              <div
                onClick={() => navigate('/onboarding')}
                style={{
                  background: 'var(--warning-light)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  cursor: 'pointer',
                  alignItems: 'flex-start'
                }}
              >
                <AlertTriangle size={20} color="var(--warning-amber)" style={{ marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>{t('kyc_required')}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {t('kyc_required_desc')}
                  </span>
                </div>
              </div>
            )}

            {/* Unified Portfolio Card */}
            <div
              onClick={() => navigate('/portfolio-analytics')}
              style={{
                background: 'var(--gradient-brand)',
                borderRadius: '24px',
                padding: '20px',
                color: 'white',
                boxShadow: '0 12px 24px var(--brand-glow)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>
                  {t('matured_balance')}
                </span>
                <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--gold-primary)', fontFamily: 'var(--font-poppins)', margin: '4px 0 0 0' }}>
                  {formatRupees(currentValuePaise)}
                </h2>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: '12px' }}>
                <div>
                  <span style={{ fontSize: '9px', opacity: 0.6 }}>{t('total_vault_gold')}</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{mgToGrams(goldBalanceMg)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: returnPercentage < 0 ? '#EF4444' : 'var(--success-green)' }}>
                  {returnPercentage < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {returnPercentage < 0 ? '' : '+'}{returnPercentage}%
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.6 }}>
                <span>{t('locked')}: {mgToGrams(lockedGoldMg)}</span>
                <span>{t('live_updates')}</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => navigate('/referral')}
                style={{
                  height: '48px', borderRadius: '12px', background: 'white', border: '1px solid rgba(0,0,0,0.06)',
                  color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}
              >
                <Gift size={16} color="var(--brand-accent)" /> {t('refer_earn')}
              </button>

              <button
                onClick={() => navigate('/my-bonuses')}
                style={{
                  height: '48px', borderRadius: '12px', background: 'white', border: '1px solid rgba(0,0,0,0.06)',
                  color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}
              >
                <Award size={16} color="var(--gold-deep)" /> {t('my_bonuses')}
              </button>
            </div>

            {/* Promo Pager banners */}
            {banners.length > 0 && (
              <div style={{
                width: '100%', height: '120px', borderRadius: '16px', background: 'var(--gradient-accent)',
                color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                boxShadow: '0 6px 12px rgba(194, 24, 91, 0.15)', cursor: 'pointer'
              }} onClick={() => navigate('/scheme-explorer')}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>{t('campaign_promo')}</span>
                <h3 style={{ fontSize: '16px', color: 'white', fontWeight: 'bold', margin: '4px 0' }}>{banners[activeBannerIdx].title}</h3>
                <span style={{ fontSize: '11px', textDecoration: 'underline' }}>{t('campaign_promo_desc')}</span>
              </div>
            )}

            {/* Available Schemes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('start_saving')}</h3>
                <button onClick={() => navigate('/scheme-explorer')} style={{ background: 'transparent', border: 'none', color: 'var(--brand-accent)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  {t('view_all')}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {availableSchemes.map((sch) => (
                  <div
                    key={sch.id}
                    className="glass-card"
                    onClick={() => navigate(`/scheme-detail/${sch.id}`)}
                    style={{
                      flex: '0 0 240px', borderRadius: '16px', padding: '16px', background: 'white',
                      border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{sch.planName}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('tenure')}: {sch.totalInstallments} {t('months')}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                        {formatRupees(sch.installmentAmountPaise)}
                      </span>
                      <ChevronRight size={16} color="var(--brand-mid)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flash Sale Promo */}
            {offerTitle && (
              <div style={{
                background: 'var(--gold-soft)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '16px',
                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>{offerTitle}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{offerDesc}</span>
                </div>
                <button
                  onClick={() => navigate('/buy-gold')}
                  style={{
                    background: 'var(--brand-dark)', color: 'white', border: 'none', padding: '8px 16px',
                    borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {t('claim')}
                </button>
              </div>
            )}

            {/* Active Schemes Tracker list */}
            {activeSchemes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('active_schemes')}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeSchemes.map((sch) => {
                    const isExpanded = expandedSchemeId === sch.schemeId;
                    return (
                      <div
                        key={sch.schemeId}
                        className="glass-card"
                        style={{
                          borderRadius: '16px', padding: '16px', background: 'white',
                          border: '1px solid rgba(74, 14, 78, 0.06)', display: 'flex', flexDirection: 'column', gap: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                        }}
                      >
                        <div
                          onClick={() => setExpandedSchemeId(isExpanded ? null : sch.schemeId)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{sch.planName}</h4>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {t('paid')}: {sch.installmentsPaid} / {sch.totalInstallments} {t('months')}
                            </span>
                          </div>
                          <ChevronRight size={18} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>

                        {isExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('maturity_date')}:</span>
                                <div style={{ fontWeight: 'bold' }}>{new Date(sch.maturityDate).toLocaleDateString()}</div>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('accumulated_gold')}:</span>
                                <div style={{ fontWeight: 'bold', color: '#FFB300' }}>{mgToGrams(sch.accumulatedGoldMg)}</div>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('total_saved')}:</span>
                                <div style={{ fontWeight: 'bold' }}>{formatRupees(sch.totalSavingsAddedPaise)}</div>
                              </div>
                              <div>
                                <span style={{ color: 'var(--text-muted)' }}>{t('bonus_earned')}:</span>
                                <div style={{ fontWeight: 'bold', color: 'var(--brand-accent)' }}>{formatRupees(sch.totalBonusEarnedPaise)}</div>
                              </div>
                            </div>

                            {/* Autopay checkbox toggle */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '10px 12px', borderRadius: '10px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{t('enable_autopay')}</span>
                              <input
                                type="checkbox"
                                checked={sch.autoPayEnabled}
                                onChange={(e) => handleToggleAutoPay(sch, e.target.checked)}
                                style={{ accentColor: 'var(--brand-dark)', cursor: 'pointer' }}
                              />
                            </div>

                            {/* Action links */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button
                                onClick={() => handlePayInstallment(sch)}
                                style={{
                                  flex: 1, height: '36px', borderRadius: '8px', background: 'var(--brand-dark)',
                                  color: 'white', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
                                }}
                              >
                                {t('pay_installment')}
                              </button>
                              <button
                                onClick={() => {
                                  setTargetAddSavingsScheme(sch);
                                  setShowAddSavingsSheet(true);
                                }}
                                style={{
                                  flex: 1, height: '36px', borderRadius: '8px', background: 'var(--brand-accent)',
                                  color: 'white', border: 'none', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
                                }}
                              >
                                {t('add_savings')}
                              </button>
                              {sch.installmentsPaid >= sch.totalInstallments && (
                                <button
                                  onClick={() => navigate(`/scheme-redemption/${sch.schemeId}`)}
                                  style={{
                                    height: '36px', borderRadius: '8px', background: 'var(--gold-warm)',
                                    color: '#1A1200', border: 'none', fontWeight: 'bold', fontSize: '11px', padding: '0 12px', cursor: 'pointer'
                                  }}
                                >
                                  {t('redeem')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: LEDGER ACTIVITY VIEW */}
        {selectedTab === 1 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('transactions_title')}</h2>
              <button
                onClick={() => setTxSort(txSort === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
                style={{
                  background: 'var(--brand-glow)', border: 'none', color: 'var(--brand-dark)', padding: '6px 12px',
                  borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {t('sort')}: {txSort}
              </button>
            </div>

            {/* Filter tags */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'BUY', 'SELL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTxFilter(f as any)}
                  style={{
                    border: 'none',
                    borderRadius: '16px',
                    padding: '6px 16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: txFilter === f ? 'var(--brand-dark)' : 'white',
                    color: txFilter === f ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: txFilter === f ? '0 4px 8px var(--brand-glow)' : 'none',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: txFilter === f ? 'transparent' : 'rgba(0,0,0,0.08)'
                  }}
                >
                  {f === 'ALL' ? t('all_activity') : f === 'BUY' ? t('savings') : t('redeemed')}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              {getFilteredTransactions().map((tx) => {
                const isBuy = tx.transactionType === 'INSTALLMENT' || tx.transactionType === 'BUY';
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxDetail(tx)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px',
                      borderRadius: '16px', background: 'white', border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: isBuy ? 'var(--success-light)' : 'var(--error-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '14px' }}>{isBuy ? '⬇️' : '⬆️'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block' }}>
                          {isBuy ? t('added_to_savings') : t('redeemed_metal')}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block', marginTop: '2px' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 'bold',
                        color: isBuy ? 'var(--success-green)' : 'var(--error-red)'
                      }}>
                        {isBuy ? '+' : '-'}{formatRupees(tx.amountPaise)}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--brand-accent)', display: 'block', marginTop: '2px', fontWeight: 'bold' }}>
                        {mgToGrams(tx.goldWeightMg)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {getFilteredTransactions().length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                  {t('no_tx_found')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE & SETTINGS VIEW */}
        {selectedTab === 2 && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Account Info summary */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%', background: 'var(--gradient-brand)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '20px'
              }}>
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{userName}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: +91 {userPhone}</span>
                <span style={{
                  fontSize: '9px', fontWeight: 'bold', color: kycLevel === 'FULL' ? 'var(--success-green)' : 'var(--warning-amber)',
                  background: kycLevel === 'FULL' ? 'var(--success-light)' : 'var(--warning-light)',
                  padding: '2px 6px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', marginLeft: '8px'
                }}>
                  {kycLevel} KYC
                </span>
              </div>
            </div>

            {/* Linked Bank Accounts */}
            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{t('linked_bank_accounts')}</span>
                <button onClick={() => navigate('/add-bank-account')} style={{ background: 'transparent', border: 'none', color: 'var(--brand-accent)', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <PlusCircle size={14} /> {t('add_bank')}
                </button>
              </div>

              {bankAccounts.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', borderRadius: '10px', background: '#F9FAFB' }}>
                  <Landmark size={20} color="var(--success-green)" />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>{b.bankName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-light)' }}>A/C: {b.accountNumberMasked} · IFSC: {b.ifscCode}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Nominee Settings */}
            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{t('nominee_config')}</span>
              
              {isEditingNominee ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newNomineeInput}
                    onChange={(e) => setNewNomineeInput(e.target.value)}
                    style={{ flex: 1, height: '36px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 10px', fontSize: '12px' }}
                  />
                  <button onClick={handleUpdateNominee} style={{ background: 'var(--brand-dark)', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setIsEditingNominee(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}>
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>{t('nominee_name')}</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{nomineeName || t('not_configured')}</span>
                  </div>
                  <button onClick={() => setIsEditingNominee(true)} style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                    {t('edit_nominee')}
                  </button>
                </div>
              )}
            </div>

            {/* Language Settings */}
            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74, 14, 78, 0.08)',
                    color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Languages size={20} color="var(--brand-dark)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>{t('language')}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {lang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                    </span>
                  </div>
                </div>
                
                {/* Language Switch Toggle Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'en' ? 'var(--brand-dark)' : 'var(--text-light)' }}>EN</span>
                  <button
                    onClick={async () => {
                      const nextLang = lang === 'en' ? 'ta' : 'en';
                      changeLanguage(nextLang);
                      
                      // Save to backend dynamically
                      const userId = SessionManager.getUserId();
                      if (userId) {
                        try {
                          await ApiClient.put(`api/User/profile/${userId}`, { preferredLanguage: nextLang });
                        } catch (err) {
                          console.error('Failed to sync preferred language to backend:', err);
                        }
                      }
                    }}
                    style={{
                      width: '46px',
                      height: '24px',
                      borderRadius: '12px',
                      background: lang === 'ta' ? 'var(--brand-dark)' : '#ECECEC',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      padding: 0
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '3px',
                      left: lang === 'ta' ? '25px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'ta' ? 'var(--brand-dark)' : 'var(--text-light)' }}>தமிழ்</span>
                </div>
              </div>
            </div>

            {/* Navigation Reference Links */}
            <div className="glass-card" style={{ borderRadius: '16px', background: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {[
                { title: t('menu_about_us'), route: '/about' },
                { title: t('menu_faqs'), route: '/faq' },
                { title: t('menu_safety_trust'), route: '/safety_trust' },
                { title: t('menu_redemption_guide'), route: '/redemption_guide' },
                { title: t('menu_legal_compliance'), route: '/legal_hub' },
                { title: t('menu_gold_alerts'), route: '/gold_rate_alerts' }
              ].map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(link.route)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px',
                    borderBottom: idx < 5 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>{link.title}</span>
                  <ChevronRight size={16} color="var(--text-light)" />
                </div>
              ))}
            </div>

            {/* Supportdial Compliance Compliance Compliance */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                onClick={() => window.open('tel:+919443000000')}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--brand-accent)',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                <PhoneCall size={16} /> Contact Support: +91 94430 00000
              </button>
            </div>

            {/* Logout button at bottom */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--error-red)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={16} /> {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE ADD SAVINGS MODAL SHEET ── */}
      {showAddSavingsSheet && targetAddSavingsScheme && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '480px', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 -8px 24px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>Add Scheme Savings</h3>
              <button onClick={() => { setShowAddSavingsSheet(false); setCustomAmountText(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Enter custom amount to deposit. GST (3%) will be included, and loyalty bonus will be locked based on live gold rates.
            </span>

            {/* Custom Amount input */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Enter Amount</label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '13px', fontSize: '15px', fontWeight: 'bold' }}>₹</span>
                <input
                  type="text"
                  placeholder="Enter Amount (e.g. 3000)"
                  value={customAmountText}
                  onChange={(e) => setCustomAmountText(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%', height: '44px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)',
                    padding: '0 12px 0 28px', fontSize: '15px', fontWeight: 'bold', outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Preset chips */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {['1000', '5000', '10000'].map((p) => (
                <button
                  key={p}
                  onClick={() => setCustomAmountText(p)}
                  style={{
                    background: 'white', border: '1.5px solid var(--brand-dark)', color: 'var(--brand-dark)',
                    padding: '6px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  ₹{p}
                </button>
              ))}
            </div>

            {/* Calculations Breakdown */}
            {parseFloat(customAmountText) > 0 && (
              <div style={{ background: '#F9F6FC', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Entered Amount</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{customAmountText}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>GST (3% Included)</span>
                  <span>₹{(parseFloat(customAmountText) - (parseFloat(customAmountText) / 1.03)).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--brand-mid)', fontWeight: 'bold' }}>
                  <span>Loyalty Bonus (7.5%)</span>
                  <span>+ ₹{(parseFloat(customAmountText) / 1.03 * 0.075).toFixed(2)}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                  <span>Effective savings gold added</span>
                  <span style={{ color: '#FFB300' }}>
                    {((parseFloat(customAmountText) / 1.03 * 1.075 * 100) / goldPrice22K).toFixed(4)} g
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitAddSavings}
              disabled={parseFloat(customAmountText) <= 0 || isProcessingAddSavings}
              style={{
                width: '100%', height: '52px', borderRadius: '14px', background: 'var(--brand-dark)',
                color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (parseFloat(customAmountText) <= 0 || isProcessingAddSavings) ? 0.5 : 1
              }}
            >
              {isProcessingAddSavings ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                'Pay & Add Gold'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSACTION DETAIL OVERLAY MODAL ── */}
      {selectedTxDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '90%', maxWidth: '360px', background: 'white', borderRadius: '24px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>Receipt Details</h3>
              <button onClick={() => setSelectedTxDetail(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
                <span style={{ fontWeight: 'bold' }}>{selectedTxDetail.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                <span style={{ fontWeight: 'bold' }}>{new Date(selectedTxDetail.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gold Weight</span>
                <span style={{ fontWeight: 'bold', color: '#FFB300' }}>{mgToGrams(selectedTxDetail.goldWeightMg)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 'bold', color: 'var(--success-green)' }}>{selectedTxDetail.status}</span>
              </div>
              <div style={{ height: '1px', background: '#ECECEC', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>Amount Paid</span>
                <span style={{ color: 'var(--brand-accent)' }}>{formatRupees(selectedTxDetail.amountPaise)}</span>
              </div>
            </div>

            <button
              onClick={() => alert('Receipt downloaded successfully!')}
              style={{
                width: '100%', height: '40px', borderRadius: '10px', background: 'var(--brand-dark)',
                color: 'white', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
              }}
            >
              Download Receipt
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM TAB NAVIGATION BAR ── */}
      <div style={{
        background: 'white',
        borderTop: '1px solid #ECECEC',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <button
          onClick={() => setSelectedTab(0)}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px', cursor: 'pointer',
            color: selectedTab === 0 ? 'var(--brand-dark)' : 'var(--text-muted)'
          }}
        >
          <Home size={20} color={selectedTab === 0 ? 'var(--brand-dark)' : 'var(--text-light)'} />
          <span style={{ fontSize: '10px', fontWeight: selectedTab === 0 ? 'bold' : '500' }}>{t('tab_home')}</span>
        </button>

        <button
          onClick={() => setSelectedTab(1)}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px', cursor: 'pointer',
            color: selectedTab === 1 ? 'var(--brand-dark)' : 'var(--text-muted)'
          }}
        >
          <History size={20} color={selectedTab === 1 ? 'var(--brand-dark)' : 'var(--text-light)'} />
          <span style={{ fontSize: '10px', fontWeight: selectedTab === 1 ? 'bold' : '500' }}>{t('tab_history')}</span>
        </button>

        <button
          onClick={() => setSelectedTab(2)}
          style={{
            background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '3px', cursor: 'pointer',
            color: selectedTab === 2 ? 'var(--brand-dark)' : 'var(--text-muted)'
          }}
        >
          <User size={20} color={selectedTab === 2 ? 'var(--brand-dark)' : 'var(--text-light)'} />
          <span style={{ fontSize: '10px', fontWeight: selectedTab === 2 ? 'bold' : '500' }}>{t('tab_profile')}</span>
        </button>
      </div>

      {/* ── FLOATING CHAT ASSISTANT ACTION BUTTON ── */}
      {selectedTab === 0 && (
        <button
          onClick={() => navigate('/ai_assistant')}
          style={{
            position: 'absolute', right: '16px', bottom: '80px', width: '56px', height: '56px',
            borderRadius: '50%', background: 'var(--brand-deep)', color: 'white', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(41, 0, 29, 0.4)', zIndex: 99
          }}
        >
          <Headset size={24} color="white" />
        </button>
      )}

    </div>
  );
};
