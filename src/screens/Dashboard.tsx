import React, { useState, useEffect, useRef } from 'react';
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
  Gift,
  Award,
  X,
  PhoneCall,
  Landmark,
  Languages,
  Headset,
  Mail,
  ChevronLeft,
  Calculator,
  MapPin,
  Lock,
  FileText,
  Pencil,
  ShieldCheck
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
  const isAndroidApp = !!(window as any).Capacitor && /android/i.test(navigator.userAgent);
  const { t, lang, changeLanguage } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(() => {
    const saved = localStorage.getItem('DASHBOARD_ACTIVE_TAB');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // User details
  const [userName, setUserName] = useState('');
  const [kycLevel, setKycLevel] = useState('BASIC');

  // Live metal rates

  // Dashboard metrics (removed for live rates top card)

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

  // Profile Interactive Modals & Sub-states (moved to separate pages)

  // Manual banner swiping/dragging states & handlers
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - dragStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - dragStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const touch = e.changedTouches[0];
    const distance = dragStartPosRef.current.x - touch.clientX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && banners.length > 0) {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe && banners.length > 0) {
      setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
    }
    dragStartPosRef.current = { x: 0, y: 0 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
    const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const distance = dragStartPosRef.current.x - e.clientX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && banners.length > 0) {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe && banners.length > 0) {
      setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
    }
    dragStartPosRef.current = { x: 0, y: 0 };
  };


  // History Tab Filter States
  const [txFilter, setTxFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [txSort, setTxSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionItem | null>(null);

  // Profile Tab states (moved to ProfilePages.tsx)

  // Consume from AppContext
  const {
    profile,
    livePrice,
    portfolio,
    activeSchemes: contextActiveSchemes,
    availableSchemes: contextAvailableSchemes,
    transactions: contextTransactions,
    unreadNotifCount: contextUnreadNotifCount,
    offers,
    refreshData
  } = useApp();

  // Sync context changes to local states
  useEffect(() => {
    if (profile) {
      setUserName(profile.fullName || 'User');
      setKycLevel(profile.kycLevel || 'BASIC');
      if (profile.preferredLanguage && (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'ta') && profile.preferredLanguage !== lang) {
        changeLanguage(profile.preferredLanguage as 'en' | 'ta');
      }
    }

    if (contextActiveSchemes) {
      setActiveSchemes(contextActiveSchemes);
    }
    if (contextAvailableSchemes) {
      setAvailableSchemes(contextAvailableSchemes);
    }
    if (contextTransactions) {
      setTransactions(contextTransactions);
    }
    if (contextUnreadNotifCount !== undefined) {
      setUnreadNotifCount(contextUnreadNotifCount);
    }
    if (offers && offers.length > 0) {
      setOfferTitle(offers[0].title);
      setOfferDesc(offers[0].description);
    }
  }, [profile, livePrice, contextActiveSchemes, contextAvailableSchemes, contextTransactions, contextUnreadNotifCount, offers]);

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

    const fetchBanners = async () => {
      try {
        const res = await ApiClient.get('api/Banner/active');
        if (res.data && res.data.success) {
          setBanners(res.data.banners || []);
        }
      } catch (err) {
        console.error('Failed to load active banners:', err);
      }
    };
    fetchBanners();
    
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

  useEffect(() => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', String(selectedTab));
  }, [selectedTab]);

  useEffect(() => {
    const handleTabChange = () => {
      const saved = localStorage.getItem('DASHBOARD_ACTIVE_TAB');
      if (saved) {
        setSelectedTab(parseInt(saved, 10));
      }
    };
    window.addEventListener('dashboardTabChange', handleTabChange);
    return () => {
      window.removeEventListener('dashboardTabChange', handleTabChange);
    };
  }, []);

  const handleLogout = () => {
    SessionManager.clearSession();
    localStorage.removeItem('ONBOARDING_STAGE');
    localStorage.removeItem('PHONE_NUMBER');
    navigate('/login');
  };

  // Nominee update logic moved to ProfilePages.tsx

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
      ? 'http://192.168.1.36:5044/'
      : 'https://aishwaryam.blazewing.in/';
    const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const relative = url.startsWith('/') ? url.substring(1) : url;
    return base + relative;
  };

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };


  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;



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

  const totalBonusGoldMg = activeSchemes.reduce((sum, s) => sum + (s.totalBonusGoldMg || 0), 0);

  const renderVaultCard = () => (
    <div
      className="glass-card"
      style={{
        background: 'linear-gradient(135deg, var(--brand-deep) 0%, #3D002B 50%, var(--brand-dark) 100%)',
        borderRadius: '24px',
        padding: '24px',
        color: 'white',
        boxShadow: '0 12px 28px rgba(74, 14, 78, 0.25)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        border: '1.5px solid rgba(255, 215, 0, 0.25)',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px',
        background: 'radial-gradient(circle, rgba(194, 24, 91, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--gold-primary)" />
          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)' }}>
            SECURED DIGITAL VAULT
          </span>
        </div>
        <div style={{
          width: '32px', height: '24px', borderRadius: '6px',
          background: 'linear-gradient(135deg, #FFE082 0%, #FFB300 100%)',
          border: '1px solid #FFD54F', opacity: 0.8
        }} />
      </div>

      <div>
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Total Gold Saved
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', margin: 0, fontFamily: 'var(--font-poppins)', textShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
            {((portfolio?.goldBalanceMg || 0) / 1000).toFixed(4)}
          </h1>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gold-primary)', textTransform: 'uppercase' }}>
            grams
          </span>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '4px'
      }}>
        <div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Current Value
          </span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gold-primary)', display: 'block', marginTop: '2px' }}>
            {formatRupees(portfolio?.currentValuePaise || 0)}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Total Invested
          </span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', display: 'block', marginTop: '2px' }}>
            {formatRupees(portfolio?.investedAmountPaise || 0)}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Bonus Gold
          </span>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--success-green)', display: 'block', marginTop: '2px' }}>
            {(totalBonusGoldMg / 1000).toFixed(4)} g
          </span>
        </div>
      </div>
    </div>
  );

  const renderLiveRatesCard = () => (
    <div
      className="glass-card"
      style={{
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
          Live Metal Rates
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-green)' }} />
          <span style={{ fontSize: '10px', color: 'var(--success-green)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            ● LIVE
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* Gold Rates (22K) */}
        <div style={{ background: '#FFFDF9', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.15)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Gold 22K (per g)
          </span>
          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
            ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((livePrice?.price22KPaise || 701000) / 100)}
          </span>
        </div>

        {/* Silver Rates (99.9%) */}
        <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Silver 99.9% (per g)
          </span>
          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
            ₹{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((livePrice?.priceSilverPaise || 9900) / 100)}
          </span>
        </div>
      </div>
    </div>
  );

  const renderQuickActionsGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
      <div 
        onClick={() => navigate('/buy-gold')}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
          background: 'white', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.01)', transition: 'all 0.2s ease'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,215,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-deep)' }}>
          <TrendingUp size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center' }}>Buy Gold</span>
      </div>

      <div 
        onClick={() => navigate('/sell-gold')}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
          background: 'white', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.01)', transition: 'all 0.2s ease'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(74,14,78,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-dark)' }}>
          <Landmark size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center' }}>Sell Gold</span>
      </div>

      <div 
        onClick={() => navigate('/my-bonuses')}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
          background: 'white', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.01)', transition: 'all 0.2s ease'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-accent)' }}>
          <Award size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center' }}>Bonuses</span>
      </div>

      <div 
        onClick={() => navigate('/referral')}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer',
          background: 'white', padding: '12px 6px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.01)', transition: 'all 0.2s ease'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-green)' }}>
          <Gift size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center' }}>Refer</span>
      </div>
    </div>
  );

  const renderActiveSchemesSection = () => {
    const activeList = activeSchemes.filter((s) => s.status?.toLowerCase() === 'active');
    if (activeList.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>Active Schemes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeList.map((sch) => {
            const totalDays = (sch.schemeDayNumber || 0) + (sch.remainingDaysForScheme || 0);
            const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, ((sch.schemeDayNumber || 0) / totalDays) * 100)) : 0;
            return (
              <div
                key={sch.schemeId}
                className="glass-card"
                onClick={() => navigate(`/scheme-detail/${sch.schemeId}`)}
                style={{
                  borderRadius: '20px', padding: '16px', background: 'white',
                  border: '1px solid rgba(74, 14, 78, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.02)', cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--brand-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {sch.frequency === 'Daily' ? 'DAILY SCHEME' : 'MONTHLY SCHEME'}
                    </span>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: '2px 0 0 0' }}>
                      {sch.planName}
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', background: 'var(--brand-glow)', color: 'var(--brand-dark)', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                    Day {sch.schemeDayNumber || 1}
                  </span>
                </div>

                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 'bold' }}>
                    <span>Progress</span>
                    <span>{sch.remainingDaysForScheme} Days Left</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#ECEFF1', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '8px', marginTop: '2px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>ACCUMULATED GOLD</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-deep)' }}>
                      {((sch.accumulatedGoldMg || 0) / 1000).toFixed(4)} g
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>EARNED BONUS GOLD</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--success-green)' }}>
                      {((sch.totalBonusGoldMg || 0) / 1000).toFixed(4)} g
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAvailableSchemesSection = () => (
    <div className="available-schemes-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('start_saving')}</h3>
        <button onClick={() => navigate('/scheme-explorer')} style={{ background: 'transparent', border: 'none', color: 'var(--brand-accent)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
          {t('view_all')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
        {availableSchemes.map((sch) => (
          <div
            key={sch.id}
            className="glass-card"
            onClick={() => navigate(`/scheme-detail/${sch.id}`)}
            style={{
              flex: '0 0 310px',
              height: '190px',
              borderRadius: '20px',
              padding: '22px',
              background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-deep) 100%)',
              border: '1.5px solid rgba(255, 215, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(41, 0, 29, 0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
              transform: 'rotate(-15deg)'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{
                width: '38px',
                height: '28px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #FFE082 0%, #FFB300 100%)',
                position: 'relative',
                border: '1px solid #FFD54F',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)'
              }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.15)' }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.15)' }} />
              </div>
              
              <span style={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 'bold',
                fontSize: '15px',
                color: 'var(--gold-primary)',
                letterSpacing: '1px'
              }}>
                Aishwaryam
              </span>
            </div>

            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0, fontFamily: 'var(--font-poppins)', letterSpacing: '0.5px' }}>
                {sch.planName}
              </h4>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>
                Gold Savings Chit
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', zIndex: 2 }}>
              <div>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>
                  {sch.frequency === 'Daily' ? 'Daily Savings' : 'Monthly Savings'}
                </span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--gold-primary)', fontFamily: 'var(--font-poppins)' }}>
                  {formatRupees(sch.installmentAmountPaise)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>
                  Tenure
                </span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>
                  {sch.totalInstallments} {sch.frequency === 'Daily' ? 'Days' : t('months')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecentTransactionsPreview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>Recent Activity</h3>
        <button
          onClick={() => setSelectedTab(1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--brand-accent)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
        >
          View All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {transactions.slice(0, 3).map((tx) => {
          const isBuy = tx.transactionType === 'INSTALLMENT' || tx.transactionType === 'BUY';
          return (
            <div
              key={tx.id}
              onClick={() => setSelectedTxDetail(tx)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px',
                borderRadius: '16px', background: 'white', border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.005)', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isBuy ? 'var(--success-light)' : 'var(--error-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                }}>
                  {isBuy ? '⬇' : '⬆'}
                </div>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>
                    {isBuy ? 'Added to Savings' : 'Redeemed Metal'}
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-light)', display: 'block', marginTop: '1px' }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: isBuy ? 'var(--success-green)' : 'var(--error-red)', display: 'block' }}>
                  {isBuy ? '+' : '-'}{formatRupees(tx.amountPaise)}
                </span>
                <span style={{ fontSize: '9.5px', color: 'var(--brand-accent)', fontWeight: 'bold', display: 'block', marginTop: '1px' }}>
                  {mgToGrams(tx.goldWeightMg)}
                </span>
              </div>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', borderRadius: '16px', background: 'white', color: 'var(--text-muted)', fontSize: '12px' }}>
            No transactions yet. Start saving in a scheme to view your activity!
          </div>
        )}
      </div>
    </div>
  );

  const renderPromosAndBanners = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {offerTitle && (
        <div className="flash-sale-promo" style={{
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

      {banners.length > 0 && (
        <div 
          className="promo-banner-container" 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: '100%',
            height: '160px',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            background: '#EAEAEA',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            userSelect: 'none',
            cursor: 'grab'
          }}
        >
          <div 
            style={{
              display: 'flex',
              width: `${banners.length * 100}%`,
              height: '100%',
              transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: `translateX(-${activeBannerIdx * (100 / banners.length)}%)`
            }}
          >
            {banners.map((banner, index) => (
              <div 
                key={banner.id || index}
                onClick={(e) => {
                  if (isDraggingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  navigate(banner.tapActionUrl || '/scheme-explorer');
                }}
                style={{
                  width: `${100 / banners.length}%`,
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <img 
                  src={getImageUrl(banner.imageBase64)} 
                  alt={banner.title} 
                  draggable="false"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    display: 'block',
                    pointerEvents: 'none'
                  }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60%',
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '16px 20px 24px 20px',
                  color: 'white',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ 
                    fontSize: '9px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px', 
                    color: 'var(--gold-primary)', 
                    fontWeight: 'bold',
                    marginBottom: '2px' 
                  }}>
                    {t('campaign_promo')}
                  </span>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '15px', 
                    fontWeight: 'bold', 
                    fontFamily: 'var(--font-poppins)', 
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    lineHeight: '1.2' 
                  }}>
                    {banner.title}
                  </h4>
                  <span style={{ 
                    fontSize: '10px', 
                    opacity: 0.9, 
                    marginTop: '3px', 
                    textDecoration: 'underline' 
                  }}>
                    {t('campaign_promo_desc')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 5
          }}>
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBannerIdx(idx);
                }}
                style={{
                  width: activeBannerIdx === idx ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: activeBannerIdx === idx ? 'var(--gold-primary)' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderNeedHelpCard = () => (
    <div
      className="dashboard-help-card"
      style={{
        background: 'white',
        border: '1.5px solid var(--border-light)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(74, 14, 78, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-dark)',
          flexShrink: 0
        }}>
          <Headset size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
            {t('need_help_title')}
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {t('need_help_desc')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.open('tel:+919443000000')}
          style={{
            flex: 1,
            height: '42px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '12.5px',
            fontFamily: 'var(--font-poppins)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(74, 14, 78, 0.12)'
          }}
        >
          <PhoneCall size={14} color="var(--gold-primary)" />
          <span>{t('call_us')}</span>
        </button>
        <button
          onClick={() => window.open('mailto:support@aishwaryam.com')}
          style={{
            flex: 1,
            height: '42px',
            borderRadius: '12px',
            background: 'white',
            color: 'var(--brand-dark)',
            border: '1.5px solid var(--brand-dark)',
            fontWeight: 'bold',
            fontSize: '12.5px',
            fontFamily: 'var(--font-poppins)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Mail size={14} color="var(--brand-dark)" />
          <span>{t('email_us')}</span>
        </button>
      </div>
    </div>
  );

  const renderLedgerSection = () => {
    const list = getFilteredTransactions();
    return (
      <div style={{ padding: isDesktop ? '32px' : '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('transactions_title')}</h2>
          <button
            onClick={() => setTxSort(txSort === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
            style={{
              background: 'var(--brand-glow)', border: 'none', color: 'var(--brand-dark)', padding: '8px 16px',
              borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {t('sort')}: {txSort}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {['ALL', 'BUY', 'SELL'].map((f) => (
            <button
              key={f}
              onClick={() => setTxFilter(f as any)}
              style={{
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: txFilter === f ? 'var(--brand-dark)' : 'white',
                color: txFilter === f ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: txFilter === f ? '0 4px 12px var(--brand-glow)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: txFilter === f ? 'transparent' : 'rgba(0,0,0,0.08)'
              }}
            >
              {f === 'ALL' ? t('all_activity') : f === 'BUY' ? t('savings') : t('redeemed')}
            </button>
          ))}
        </div>

        {isDesktop ? (
          <div className="glass-card" style={{ borderRadius: '20px', background: 'white', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--brand-glow)', borderBottom: '1px solid rgba(74, 14, 78, 0.08)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>Transaction Type</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>Date & Time</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>Weight (Grams)</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {list.map((tx) => {
                  const isBuy = tx.transactionType === 'INSTALLMENT' || tx.transactionType === 'BUY';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTxDetail(tx)}
                      style={{ borderBottom: '1px solid #F1F3F4', cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                      <td style={{ padding: '18px 24px', fontSize: '13.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px' }}>{isBuy ? '⬇️' : '⬆️'}</span>
                        {isBuy ? 'Added to Savings' : 'Redeemed Metal'}
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: '13.5px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>
                        {mgToGrams(tx.goldWeightMg)}
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 'bold', color: 'var(--success-green)',
                          background: 'var(--success-light)', padding: '4px 10px', borderRadius: '12px'
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: '13.5px', fontWeight: 'bold', color: isBuy ? 'var(--success-green)' : 'var(--error-red)', textAlign: 'right' }}>
                        {isBuy ? '+' : '-'}{formatRupees(tx.amountPaise)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {list.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
                {t('no_tx_found')}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {list.map((tx) => {
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
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            {list.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                {t('no_tx_found')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      height: '100vh',
      width: '100vw',
      maxWidth: '100%',
      overflow: 'hidden',
      background: '#F8F9FA',
      position: 'relative'
    }}>
      
      {/* ── DESKTOP SIDEBAR ── */}
      {isDesktop && (
        <div style={{
          width: '280px',
          background: 'white',
          borderRight: '1px solid #ECECEC',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'var(--gradient-brand)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px var(--brand-glow)'
              }}>
                <Award size={24} color="var(--gold-primary)" />
              </div>
              <span style={{
                fontFamily: 'var(--font-playfair)', fontWeight: '900',
                fontSize: '22px', color: 'var(--brand-deep)', letterSpacing: '0.5px'
              }}>
                Aishwaryam
              </span>
            </div>

            {/* Sidebar Navigation Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setSelectedTab(0)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', height: '48px',
                  borderRadius: '12px', border: 'none', background: selectedTab === 0 ? 'var(--brand-glow)' : 'transparent',
                  color: selectedTab === 0 ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  fontWeight: selectedTab === 0 ? 'bold' : '500', cursor: 'pointer', padding: '0 16px',
                  fontSize: '14px', transition: 'all 0.2s ease', textAlign: 'left'
                }}
              >
                <Home size={18} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setSelectedTab(1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', height: '48px',
                  borderRadius: '12px', border: 'none', background: selectedTab === 1 ? 'var(--brand-glow)' : 'transparent',
                  color: selectedTab === 1 ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  fontWeight: selectedTab === 1 ? 'bold' : '500', cursor: 'pointer', padding: '0 16px',
                  fontSize: '14px', transition: 'all 0.2s ease', textAlign: 'left'
                }}
              >
                <History size={18} />
                <span>Ledger Activity</span>
              </button>

              <button
                onClick={() => setSelectedTab(2)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', height: '48px',
                  borderRadius: '12px', border: 'none', background: selectedTab === 2 ? 'var(--brand-glow)' : 'transparent',
                  color: selectedTab === 2 ? 'var(--brand-dark)' : 'var(--text-secondary)',
                  fontWeight: selectedTab === 2 ? 'bold' : '500', cursor: 'pointer', padding: '0 16px',
                  fontSize: '14px', transition: 'all 0.2s ease', textAlign: 'left'
                }}
              >
                <User size={18} />
                <span>Profile & Settings</span>
              </button>

              <button
                onClick={() => navigate('/ai_assistant')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', height: '48px',
                  borderRadius: '12px', border: 'none', background: 'transparent',
                  color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', padding: '0 16px',
                  fontSize: '14px', transition: 'all 0.2s ease', textAlign: 'left'
                }}
              >
                <Headset size={18} />
                <span>AI Assistant Chat</span>
              </button>
            </div>
          </div>

          {/* User info & Logout at sidebar bottom */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '16px',
            borderTop: '1px solid #ECECEC', paddingTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-glow)',
                color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '15px'
              }}>
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </h4>
                <span style={{ fontSize: '10px', color: 'var(--text-light)', display: 'block' }}>Verified Client</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--error-red)', border: '1px solid rgba(239, 68, 68, 0.15)',
                fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        
        {/* Top Navbar */}
        {(!isDesktop || selectedTab !== 2) && (
          <div style={{
            background: 'white',
            borderBottom: '1px solid #ECECEC',
            paddingTop: isDesktop ? '16px' : 'calc(16px + env(safe-area-inset-top, 0px))',
            paddingLeft: '20px',
            paddingRight: '20px',
            paddingBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!isDesktop && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-glow)',
                  color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '15px'
                }}>
                  {userName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                  {isDesktop ? `Welcome Back, ${userName}` : `${t('hello')}, ${userName}`}
                </h4>
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
        )}

        {/* ── MAIN TAB CONTAINER ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: isDesktop ? '32px' : (isAndroidApp ? '96px' : '32px')
        }}>
          
          {/* TAB 0: HOME VIEW */}
          {selectedTab === 0 && (
            <div className="dashboard-home-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Soft KYC Restriction alert banner */}
              {(kycLevel === 'BASIC' || kycLevel === 'PENDING') && (
                <div
                  className="kyc-alert-banner"
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

              {isDesktop ? (
                /* ── DESKTOP MULTI-COLUMN LAYOUT ── */
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', width: '100%', alignItems: 'start' }}>
                  
                  {/* Desktop Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {renderVaultCard()}
                    {renderQuickActionsGrid()}
                    {renderRecentTransactionsPreview()}
                    {renderAvailableSchemesSection()}
                  </div>

                  {/* Desktop Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {renderLiveRatesCard()}
                    {renderActiveSchemesSection()}
                    {renderPromosAndBanners()}
                    {renderNeedHelpCard()}
                  </div>
                </div>
              ) : (
                /* ── MOBILE SINGLE-COLUMN LAYOUT ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {renderVaultCard()}
                  {renderLiveRatesCard()}
                  {renderQuickActionsGrid()}
                  {renderActiveSchemesSection()}
                  {renderAvailableSchemesSection()}
                  {renderRecentTransactionsPreview()}
                  {renderPromosAndBanners()}
                  {renderNeedHelpCard()}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: LEDGER ACTIVITY VIEW */}
          {selectedTab === 1 && renderLedgerSection()}

          {/* TAB 2: PROFILE & SETTINGS VIEW */}
          {selectedTab === 2 && (
            <div className="dashboard-profile-container" style={{
              minHeight: 'calc(100vh - 64px)',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              width: '100%',
              maxWidth: '100%',
              padding: 0
            }}>
              {/* HEADER BAR (only mobile) */}
              {!isDesktop && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'white',
                  zIndex: 10
                }}>
                  <button 
                    onClick={() => setSelectedTab(0)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-deep)'
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--brand-deep)',
                    margin: 0,
                    fontFamily: 'var(--font-poppins)',
                    textAlign: 'center',
                    flex: 1,
                    marginRight: '40px'
                  }}>
                    {t('my_profile')}
                  </h2>
                </div>
              )}

              {/* AVATAR & USER DETAILS SECTION */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 20px',
                background: 'white',
              }}>
                <div style={{
                  position: 'relative',
                  width: '95px',
                  height: '95px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#ECEFF1',
                    border: '3px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                  }}>
                    <svg viewBox="0 0 100 100" width="100%" height="100%">
                      <circle cx="50" cy="50" r="48" fill="#E8EAF6" />
                      <path d="M25,50 C25,30 35,22 50,22 C65,22 75,30 75,50 C75,55 70,55 70,50 C70,35 62,30 50,30 C38,30 30,35 30,50 C30,55 25,55 25,50 Z" fill="#6D4C41" />
                      <circle cx="32" cy="52" r="5" fill="#FFCC80" />
                      <circle cx="68" cy="52" r="5" fill="#FFCC80" />
                      <circle cx="50" cy="50" r="18" fill="#FFE0B2" />
                      <path d="M32,45 C35,32 45,34 50,38 C55,34 65,32 68,45 C62,38 55,40 50,42 C45,40 38,38 32,45 Z" fill="#5D4037" />
                      <path d="M32,40 C35,28 65,28 68,40" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="44" cy="48" r="1.5" fill="#212121" />
                      <circle cx="56" cy="48" r="1.5" fill="#212121" />
                      <rect x="38" y="44" width="12" height="8" rx="3" fill="none" stroke="#37474F" strokeWidth="1.5" />
                      <rect x="50" y="44" width="12" height="8" rx="3" fill="none" stroke="#37474F" strokeWidth="1.5" />
                      <line x1="48" y1="47" x2="52" y2="47" stroke="#37474F" strokeWidth="1.5" />
                      <path d="M47,54 Q50,56 53,54" fill="none" stroke="#E53935" strokeWidth="1" strokeLinecap="round" />
                      <rect x="47" y="59" width="6" height="8" fill="#FFE0B2" />
                      <path d="M30,85 L70,85 L65,65 C60,61 40,61 35,65 Z" fill="#1565C0" />
                      <path d="M43,62 L50,72 L57,62 Z" fill="#FFFFFF" />
                      <path d="M36,65 L44,78 L50,85 L56,78 L64,65 Z" fill="#0D47A1" />
                    </svg>
                  </div>
                  <button 
                    onClick={() => {
                      const newName = prompt("Enter new full name:", userName);
                      if (newName && newName.trim()) {
                        setUserName(newName.trim());
                        const userId = SessionManager.getUserId();
                        if (userId) {
                          ApiClient.put(`api/User/profile/${userId}`, { fullName: newName.trim() });
                        }
                      }
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'white',
                      border: '1.5px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <Pencil size={12} color="var(--text-secondary)" />
                  </button>
                </div>

                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: 'var(--brand-deep)',
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: 'var(--font-poppins)'
                }}>
                  {userName}
                </h3>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-poppins)',
                  fontWeight: '500'
                }}>
                  {profile?.email || 'srivenkatesh118@gmail.com'}
                </span>
              </div>

              {/* LOWER MENU CARDS CONTAINER */}
              <div style={{
                flex: 1,
                background: 'white',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px 100px 20px',
                boxShadow: '0 -6px 20px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                
                {/* GROUP 1: ACTIONS */}
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '12px' }}>
                  
                  <div 
                    onClick={() => navigate('/profile/price-calculator')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', borderRadius: '16px', padding: '16px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', background: '#FFEBEE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF5350'
                      }}>
                        <Calculator size={20} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {t('price_calculator')}
                      </span>
                    </div>
                    <ChevronRight size={18} color="var(--text-light)" />
                  </div>

                  <div 
                    onClick={() => navigate('/profile/completed-schemes')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'white', borderRadius: '16px', padding: '16px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px', background: '#E0F7FA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ACC1'
                      }}>
                        <Award size={20} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {t('completed_schemes')}
                      </span>
                    </div>
                    <ChevronRight size={18} color="var(--text-light)" />
                  </div>

                </div>

                {/* GROUP 2: GENERAL SETTINGS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{
                    fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)',
                    margin: '0 0 4px 4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {t('general_settings')}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    
                    <div 
                      onClick={() => navigate('/profile/address')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#F3E5F5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9C27B0'
                        }}>
                          <MapPin size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('address_label')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                    <div 
                      onClick={() => navigate('/profile/kyc')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#E1F5FE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0288D1'
                        }}>
                          <ShieldCheck size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('kyc_details')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                    <div 
                      onClick={() => navigate('/profile/bank-accounts')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#FFF3E0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F57C00'
                        }}>
                          <Landmark size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('linked_bank_accounts')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                    <div 
                      onClick={() => navigate('/mpin/change')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#FFE0B2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E65100'
                        }}>
                          <Lock size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('change_mpin')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                  </div>
                </div>

                {/* GROUP 3: SECURITY & PRIVACY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{
                    fontSize: '13px', fontWeight: 'bold', color: 'var(--text-muted)',
                    margin: '0 0 4px 4px', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {t('security_privacy')}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    
                    <div 
                      onClick={() => navigate('/privacy-policy')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#ECEFF1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#607D8B'
                        }}>
                          <ShieldCheck size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('privacy_policy_label')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                    <div 
                      onClick={() => navigate('/terms-conditions')}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', borderRadius: '16px', padding: '16px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(74, 14, 78, 0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px', background: '#ECEFF1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#607D8B'
                        }}>
                          <FileText size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {t('terms_conditions_label')}
                        </span>
                      </div>
                      <ChevronRight size={18} color="var(--text-light)" />
                    </div>

                  </div>
                </div>

                {/* LANGUAGE SELECTOR */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', background: 'rgba(74, 14, 78, 0.02)',
                  borderRadius: '16px', border: '1.5px solid rgba(74, 14, 78, 0.05)',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74, 14, 78, 0.08)',
                      color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Languages size={20} color="var(--brand-dark)" />
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
                        {t('language')}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {lang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'en' ? 'var(--brand-dark)' : 'var(--text-light)' }}>EN</span>
                    <button
                      onClick={async () => {
                        const nextLang = lang === 'en' ? 'ta' : 'en';
                        changeLanguage(nextLang);
                        
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
                        width: '46px', height: '24px', borderRadius: '12px',
                        background: lang === 'ta' ? 'var(--brand-dark)' : '#ECECEC',
                        border: 'none', position: 'relative', cursor: 'pointer',
                        transition: 'background-color 0.2s ease', padding: 0
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '3px', left: lang === 'ta' ? '25px' : '3px',
                        transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'ta' ? 'var(--brand-dark)' : 'var(--text-light)' }}>தமிழ்</span>
                  </div>
                </div>

                {/* LOGOUT BUTTON (only mobile) */}
                {!isDesktop && (
                  <div style={{ marginTop: '16px' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', height: '52px', borderRadius: '16px',
                        background: 'rgba(239, 68, 68, 0.08)', color: 'var(--error-red)',
                        border: '1.5px solid rgba(239, 68, 68, 0.15)', fontWeight: 'bold',
                        fontSize: '14.5px', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s ease', fontFamily: 'var(--font-poppins)'
                      }}
                    >
                      <LogOut size={16} /> {t('logout')}
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM TAB NAVIGATION BAR (Mobile only) ── */}
        {!isDesktop && (
          <div style={{
            background: 'white',
            borderTop: '1px solid #ECECEC',
            height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
            zIndex: 10,
            boxSizing: 'border-box'
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
        )}
      </div>

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
                <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
                <span style={{ fontWeight: 'bold' }}>
                  {new Date(selectedTxDetail.createdAt).toLocaleDateString()} {new Date(selectedTxDetail.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
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
    </div>
  );
};
