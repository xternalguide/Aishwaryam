import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient, BASE_URL } from '../utils/ApiClient';
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
  ShieldCheck,
  PlusCircle,
  Clock,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   INLINE STYLES  – design tokens kept in JS so
   we don't need to touch index.css
───────────────────────────────────────────── */
const DS = {
  // Background
  bgPage:   '#0F0F1A',
  bgCard:   'rgba(255,255,255,0.05)',
  bgCardHover: 'rgba(255,255,255,0.08)',
  bgSurface:'rgba(255,255,255,0.03)',

  // Brand
  purple:   '#4A0E4E',
  magenta:  '#C2185B',
  gold:     '#FFD700',
  goldSoft: '#FFB300',

  // Glassmorphism card
  glass: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
  } as React.CSSProperties,

  // Text
  textWhite:   '#FFFFFF',
  textSub:     'rgba(255,255,255,0.55)',
  textMuted:   'rgba(255,255,255,0.35)',

  // Fonts
  font: "'Montserrat', sans-serif",
};

/* ── Keyframes injected once ── */
const globalStyles = `

  .dash-btn-hover:hover { opacity: 0.85; transform: translateY(-1px); }
  .dash-card-hover:hover { background: rgba(255,255,255,0.09) !important; transform: translateY(-2px); }
  .dash-action-hover:hover { background: rgba(255,255,255,0.1) !important; transform: scale(1.03); }

  @keyframes dash-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .live-dot { animation: dash-pulse 1.8s ease-in-out infinite; }

  @keyframes dash-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dash-fade-in { animation: dash-fade-in 0.35s ease forwards; }

  /* light variant for desktop sidebar */
  .sidebar-nav-btn:hover { background: rgba(74,14,78,0.08) !important; }
`;

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────
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

interface TransactionItem {
  id: string;
  userSchemeId: string;
  transactionType: string;
  type?: string;
  schemeName?: string;
  bonusPercentage?: number;
  bonusGoldMg?: number;
  installmentNumber: number;
  amountPaise: number;
  baseAmountPaise: number;
  gstAmountPaise: number;
  goldWeightMg: number;
  pricePerGmPaise: number;
  status: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
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
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [userName, setUserName] = useState('');
  const [kycLevel, setKycLevel] = useState('BASIC');
  const [activeSchemes, setActiveSchemes] = useState<ActiveScheme[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [offerTitle, setOfferTitle] = useState<string | null>(null);
  const [offerDesc, setOfferDesc] = useState<string | null>(null);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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
    if (dx > 10 || dy > 10) isDraggingRef.current = true;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const touch = e.changedTouches[0];
    const distance = dragStartPosRef.current.x - touch.clientX;
    if (distance > minSwipeDistance && banners.length > 0)
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    else if (distance < -minSwipeDistance && banners.length > 0)
      setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
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
    if (dx > 10 || dy > 10) isDraggingRef.current = true;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartPosRef.current.x === 0) return;
    const distance = dragStartPosRef.current.x - e.clientX;
    if (distance > minSwipeDistance && banners.length > 0)
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    else if (distance < -minSwipeDistance && banners.length > 0)
      setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);
    dragStartPosRef.current = { x: 0, y: 0 };
  };

  const [txFilter, setTxFilter] = useState<'ALL' | 'BONUS' | 'PURCHASES' | 'SCHEME'>('ALL');
  const [txSort, setTxSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [selectedTxDetail, setSelectedTxDetail] = useState<any | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editWeddingDate, setEditWeddingDate] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editNomineeName, setEditNomineeName] = useState('');
  const [editNomineePhone, setEditNomineePhone] = useState('');
  const [editNomineeRelation, setEditNomineeRelation] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const calculatedAge = editDob ? calculateAge(editDob) : 0;
  const isMinor = editDob ? calculatedAge < 18 : false;

  const openEditProfile = () => {
    setEditName(profile?.fullName || '');
    setEditEmail(profile?.email || '');
    setEditDob(profile?.dateOfBirth || '');
    const toTitleCase = (str: string) => {
      if (!str) return '';
      const trimmed = str.trim();
      if (trimmed.length === 0) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };
    setEditGender(profile?.gender ? toTitleCase(profile.gender) : '');
    setEditWeddingDate(profile?.weddingAnniversaryDate || '');
    setEditNomineeName(profile?.nomineeName || '');
    setEditNomineePhone(profile?.nomineePhoneNumber || '');
    setEditNomineeRelation(profile?.nomineeRelationship || '');
    setEditImageBase64(profile?.profilePictureBase64 || null);
    setUploadError(null);
    setShowEditProfileModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) { setUploadError('Only JPG, JPEG, and PNG formats are allowed.'); setEditImageBase64(null); return; }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) { setUploadError('Image size must be less than 2MB.'); setEditImageBase64(null); return; }
    setUploadError(null);
    const reader = new FileReader();
    reader.onloadend = () => setEditImageBase64(reader.result as string);
    reader.onerror = () => setUploadError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { alert('Full Name is required.'); return; }
    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) { alert('Please enter a valid email address.'); return; }
    if (editNomineePhone.trim() && !/^\d{10}$/.test(editNomineePhone.trim())) { alert('Nominee mobile number must be exactly 10 digits.'); return; }
    setIsSavingProfile(true);
    try {
      const userId = SessionManager.getUserId();
      if (!userId) return;
      await ApiClient.put(`api/User/profile/${userId}`, {
        fullName: editName.trim(), email: editEmail.trim() || null, dateOfBirth: editDob ? editDob : null,
        weddingAnniversaryDate: editWeddingDate ? editWeddingDate : null, gender: editGender || null,
        nomineeName: editNomineeName.trim() || null, nomineePhoneNumber: editNomineePhone.trim() || null,
        nomineeRelationship: editNomineeRelation || null, profilePictureBase64: editImageBase64
      });
      alert('Profile updated successfully!');
      setShowEditProfileModal(false);
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally { setIsSavingProfile(false); }
  };

  const {
    profile, livePrice, portfolio, activeSchemes: contextActiveSchemes,
    availableSchemes: contextAvailableSchemes, transactions: contextTransactions,
    unreadNotifCount: contextUnreadNotifCount, offers, refreshData
  } = useApp();

  useEffect(() => {
    if (profile) { setUserName(profile.fullName || 'User'); setKycLevel(profile.kycLevel || 'BASIC'); }
    if (contextActiveSchemes) setActiveSchemes(contextActiveSchemes);
    if (contextTransactions) setTransactions(contextTransactions);
    if (contextUnreadNotifCount !== undefined) setUnreadNotifCount(contextUnreadNotifCount);
    if (offers && offers.length > 0) { setOfferTitle(offers[0].title); setOfferDesc(offers[0].description); }
  }, [profile, livePrice, contextActiveSchemes, contextAvailableSchemes, contextTransactions, contextUnreadNotifCount, offers]);

  useEffect(() => {
    const stage = SessionManager.getOnboardingStage();
    const token = SessionManager.getToken();
    if (!token) { navigate('/login'); return; }
    else if (stage === OnboardingStage.NONE || stage === OnboardingStage.OTP_VERIFIED) { navigate('/mpin/setup'); return; }
    else if (stage === OnboardingStage.MPIN_CREATED) { navigate('/profile-setup'); return; }
    else if (stage === OnboardingStage.PROFILE_COMPLETED || stage === OnboardingStage.KYC_PENDING) { navigate('/onboarding'); return; }
    refreshData(!profile);
    const fetchBanners = async () => {
      try {
        const res = await ApiClient.get('api/Banner/active');
        if (res.data && res.data.success) setBanners(res.data.banners || []);
      } catch (err) { console.error('Failed to load active banners:', err); }
    };
    fetchBanners();
    const interval = setInterval(() => {
      setBanners((prev) => { if (prev.length > 0) setActiveBannerIdx((curr) => (curr + 1) % prev.length); return prev; });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', String(selectedTab));
    if (selectedTab === 1) refreshData(true);
  }, [selectedTab]);

  useEffect(() => {
    const handleTabChange = () => {
      const saved = localStorage.getItem('DASHBOARD_ACTIVE_TAB');
      if (saved) setSelectedTab(parseInt(saved, 10));
    };
    window.addEventListener('dashboardTabChange', handleTabChange);
    return () => window.removeEventListener('dashboardTabChange', handleTabChange);
  }, []);

  const handleLogout = () => {
    SessionManager.clearSession();
    localStorage.removeItem('ONBOARDING_STAGE');
    localStorage.removeItem('PHONE_NUMBER');
    navigate('/login');
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.protocol === 'file:';
    const activeBaseUrl = isLocalHost ? 'http://192.168.1.36:5044/' : 'https://aishwaryam.blazewing.in/';
    const activeBase = activeBaseUrl.endsWith('/') ? activeBaseUrl : activeBaseUrl + '/';
    if (url.includes('/uploads/')) { const parts = url.split('/uploads/'); return activeBase + 'uploads/' + parts[1]; }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const relative = url.startsWith('/') ? url.substring(1) : url;
    return activeBase + relative;
  };

  const formatRupees = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);
  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

  const getStatusDetails = (status: string) => {
    const norm = (status || '').toUpperCase();
    if (norm === 'SUCCESS' || norm === 'COMPLETED' || norm === 'PAID' || norm === 'APPROVED')
      return { text: t('tx_success'), color: '#10B981', bgColor: 'rgba(16,185,129,0.15)' };
    else if (norm === 'PENDING')
      return { text: t('tx_pending'), color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' };
    else
      return { text: t('tx_failed'), color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' };
  };

  const getTxTypeDetails = (type: string) => {
    switch (type) {
      case 'INSTALLMENT': return { label: t('tx_installment_paid'), icon: <Landmark size={16} color="#FFD700" />, bgColor: 'rgba(255,215,0,0.15)', isCredit: true };
      case 'BONUS': case 'EVENT_BONUS': return { label: type === 'BONUS' ? t('tx_scheme_bonus_gold') : t('tx_loyalty_bonus_gold'), icon: <Award size={16} color="#C2185B" />, bgColor: 'rgba(194,24,91,0.15)', isCredit: true };
      case 'REDEMPTION': return { label: t('tx_gold_redeemed'), icon: <ShieldCheck size={16} color="#10B981" />, bgColor: 'rgba(16,185,129,0.15)', isCredit: false };
      case 'SELL': return { label: t('tx_gold_sold'), icon: <ShieldCheck size={16} color="#10B981" />, bgColor: 'rgba(16,185,129,0.15)', isCredit: false };
      case 'SCHEME_JOIN': return { label: t('tx_joined_scheme'), icon: <PlusCircle size={16} color="#FFD700" />, bgColor: 'rgba(255,215,0,0.15)', isCredit: true };
      case 'REDEMPTION_REQUEST': return { label: t('tx_redemption_requested'), icon: <Clock size={16} color="#F59E0B" />, bgColor: 'rgba(245,158,11,0.15)', isCredit: false };
      case 'BUY': return { label: t('tx_gold_saved'), icon: <TrendingUp size={16} color="#C2185B" />, bgColor: 'rgba(194,24,91,0.15)', isCredit: true };
      default: return { label: t('tx_transaction'), icon: <FileText size={16} color="rgba(255,255,255,0.5)" />, bgColor: 'rgba(255,255,255,0.08)', isCredit: true };
    }
  };

  const getFilteredTransactions = () => {
    let list = transactions;
    if (txFilter === 'BONUS') list = list.filter((tx) => tx.transactionType === 'BONUS' || tx.transactionType === 'EVENT_BONUS' || tx.type === 'BONUS' || tx.type === 'EVENT_BONUS');
    else if (txFilter === 'PURCHASES') list = list.filter((tx) => tx.transactionType === 'INSTALLMENT' || tx.transactionType === 'BUY' || tx.type === 'INSTALLMENT' || tx.type === 'BUY');
    else if (txFilter === 'SCHEME') list = list.filter((tx) => tx.transactionType === 'SCHEME_JOIN' || tx.transactionType === 'REDEMPTION_REQUEST' || tx.transactionType === 'REDEMPTION' || tx.transactionType === 'SELL' || tx.type === 'SCHEME_JOIN' || tx.type === 'REDEMPTION_REQUEST' || tx.type === 'REDEMPTION' || tx.type === 'SELL');
    if (txSort === 'NEWEST') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  };

  const totalBonusGoldMg = portfolio?.totalBonusGoldMg || 0;

  // ═══════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════

  /** Top vault / balance card */
  const renderVaultCard = () => (
    <div
      className="dash-fade-in"
      style={{
        position: 'relative', borderRadius: '24px', padding: '24px', overflow: 'hidden',
        background: 'linear-gradient(135deg, #29001D 0%, #4A0E4E 60%, #6A1B9A 100%)',
        boxShadow: '0 20px 60px rgba(74,14,78,0.45)',
        border: '1px solid rgba(255,215,0,0.2)',
      }}
    >
      {/* decorative glows */}
      <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,215,0,0.18) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'radial-gradient(circle, rgba(194,24,91,0.2) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <ShieldCheck size={14} color={DS.gold} />
          <span style={{ fontFamily:DS.font, fontSize:'10px', fontWeight:'700', letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.6)' }}>
            SECURED DIGITAL VAULT
          </span>
        </div>
        <div style={{ width:'32px', height:'22px', borderRadius:'6px', background:'linear-gradient(135deg,#FFE082 0%,#FFB300 100%)', border:'1px solid #FFD54F', opacity:0.85 }} />
      </div>

      {/* balance */}
      <div style={{ marginBottom:'8px' }}>
        <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.5)', letterSpacing:'0.5px', textTransform:'uppercase' }}>Total Gold Saved</span>
        <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginTop:'6px' }}>
          <span style={{ fontFamily:DS.font, fontSize:'40px', fontWeight:'900', color:'#FFFFFF', lineHeight:1 }}>
            {((portfolio?.goldBalanceMg || 0) / 1000).toFixed(4)}
          </span>
          <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'700', color:DS.gold, letterSpacing:'1px', textTransform:'uppercase' }}>grams</span>
        </div>
      </div>

      {/* stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'16px', marginTop:'8px' }}>
        {[
          { label:'Current Value', value:formatRupees(portfolio?.currentValuePaise||0), color:DS.gold },
          { label:'Total Invested', value:formatRupees(portfolio?.investedAmountPaise||0), color:'#FFFFFF' },
          { label:'Bonus Gold', value:`${(totalBonusGoldMg/1000).toFixed(4)} g`, color:'#10B981' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <span style={{ fontFamily:DS.font, fontSize:'9px', color:'rgba(255,255,255,0.4)', display:'block', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'3px' }}>{label}</span>
            <span style={{ fontFamily:DS.font, fontSize:'12px', fontWeight:'800', color, display:'block' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /** Live metal rates */
  const renderLiveRatesCard = () => (
    <div style={{ ...DS.glass, padding:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'700', color:DS.textWhite }}>Live Metal Rates</span>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span className="live-dot" style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#10B981', display:'inline-block' }} />
          <span style={{ fontFamily:DS.font, fontSize:'10px', color:'#10B981', fontWeight:'700', letterSpacing:'0.5px' }}>LIVE</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        {/* Gold */}
        <div style={{ background:'rgba(255,215,0,0.08)', padding:'14px', borderRadius:'14px', border:'1px solid rgba(255,215,0,0.2)' }}>
          <span style={{ fontFamily:DS.font, fontSize:'10px', color:'rgba(255,215,0,0.7)', display:'block', marginBottom:'6px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>Gold 22K (per g)</span>
          <span style={{ fontFamily:DS.font, fontSize:'20px', fontWeight:'900', color:DS.gold, display:'block' }}>
            ₹{new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format((livePrice?.price22KPaise||701000)/100)}
          </span>
        </div>
        {/* Silver */}
        <div style={{ background:'rgba(207,216,220,0.08)', padding:'14px', borderRadius:'14px', border:'1px solid rgba(207,216,220,0.15)' }}>
          <span style={{ fontFamily:DS.font, fontSize:'10px', color:'rgba(207,216,220,0.7)', display:'block', marginBottom:'6px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.3px' }}>Silver 99.9% (per g)</span>
          <span style={{ fontFamily:DS.font, fontSize:'20px', fontWeight:'900', color:'#CFD8DC', display:'block' }}>
            ₹{new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format((livePrice?.priceSilverPaise||9900)/100)}
          </span>
        </div>
      </div>
    </div>
  );

  /** Quick actions 3×1 grid */
  const renderQuickActionsGrid = () => {
    const actions = [
      { label:'Explore Schemes', icon:<TrendingUp size={22} color="#FFD700" />, bg:'rgba(255,215,0,0.15)', onClick:()=>navigate('/scheme-explorer') },
      { label:'My Bonuses',      icon:<Award size={22} color="#C2185B" />,      bg:'rgba(194,24,91,0.15)',  onClick:()=>navigate('/my-bonuses') },
      { label:'Refer & Earn',   icon:<Gift size={22} color="#10B981" />,        bg:'rgba(16,185,129,0.15)', onClick:()=>navigate('/referral') },
    ];
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
        {actions.map(({ label, icon, bg, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className="dash-action-hover"
            style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
              padding:'16px 8px', borderRadius:'18px', cursor:'pointer',
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)',
              transition:'all 0.2s ease'
            }}
          >
            <div style={{ width:'46px', height:'46px', borderRadius:'14px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {icon}
            </div>
            <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textWhite, textAlign:'center', lineHeight:1.3 }}>{label}</span>
          </div>
        ))}
      </div>
    );
  };

  /** Active schemes */
  const renderActiveSchemesSection = () => {
    const activeList = activeSchemes.filter((s) => s.status?.toLowerCase() === 'active');
    if (activeList.length === 0) return null;
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:DS.font, fontSize:'16px', fontWeight:'800', color:DS.textWhite }}>Active Schemes</span>
          <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'600', color:DS.gold }}>{activeList.length} running</span>
        </div>
        {activeList.map((sch) => {
          const totalDays = (sch.schemeDayNumber||0) + (sch.remainingDaysForScheme||0);
          const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, ((sch.schemeDayNumber||0)/totalDays)*100)) : 0;
          return (
            <div
              key={sch.schemeId}
              className="dash-card-hover"
              onClick={() => navigate(`/scheme-detail/${sch.schemeId}`)}
              style={{ ...DS.glass, padding:'18px', cursor:'pointer', transition:'all 0.25s ease' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div>
                  <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.magenta, fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:'3px' }}>
                    {sch.frequency === 'Daily' ? 'DAILY SCHEME' : 'MONTHLY SCHEME'}
                  </span>
                  <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'800', color:DS.textWhite }}>{sch.planName}</span>
                </div>
                <span style={{ fontFamily:DS.font, fontSize:'10px', background:'rgba(255,215,0,0.15)', color:DS.gold, padding:'4px 10px', borderRadius:'20px', fontWeight:'700', border:'1px solid rgba(255,215,0,0.2)' }}>
                  Day {sch.schemeDayNumber||1}
                </span>
              </div>

              {/* progress */}
              <div style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontFamily:DS.font, fontSize:'10px', color:DS.textMuted, marginBottom:'6px', fontWeight:'600' }}>
                  <span>Progress</span>
                  <span>{sch.remainingDaysForScheme} days left</span>
                </div>
                <div style={{ width:'100%', height:'5px', background:'rgba(255,255,255,0.1)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ width:`${progressPercent}%`, height:'100%', background:'linear-gradient(90deg, #C2185B 0%, #FFD700 100%)', borderRadius:'3px', transition:'width 0.5s ease' }} />
                </div>
              </div>

              {/* stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'12px' }}>
                <div>
                  <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.textMuted, display:'block', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'2px' }}>ACCUMULATED</span>
                  <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.gold }}>{((sch.accumulatedGoldMg||0)/1000).toFixed(4)} g</span>
                </div>
                <div>
                  <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.textMuted, display:'block', textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:'2px' }}>BONUS EARNED</span>
                  <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:'#10B981' }}>{((sch.totalBonusGoldMg||0)/1000).toFixed(4)} g</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /** Available schemes carousel */
  const renderAvailableSchemesSection = () => {
    if (!contextAvailableSchemes || contextAvailableSchemes.length === 0) return null;
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <span style={{ fontFamily:DS.font, fontSize:'16px', fontWeight:'800', color:DS.textWhite }}>{t('start_saving')}</span>
        <div className="no-scrollbar" style={{ display:'flex', gap:'16px', overflowX:'auto', scrollSnapType:'x mandatory', paddingBottom:'4px', WebkitOverflowScrolling:'touch' }}>
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {contextAvailableSchemes.map((scheme) => {
            let keywords: string[] = [];
            try { keywords = JSON.parse(scheme.keywordsJson || '[]'); } catch (e) {}
            let maxBonus = '7.5%';
            try {
              if (scheme.bonusConfigJson) {
                const tiers = JSON.parse(scheme.bonusConfigJson);
                if (Array.isArray(tiers) && tiers.length > 0) {
                  const maxVal = Math.max(...tiers.map((ti: any) => ti.bonusPercentage || 0));
                  if (maxVal > 0) maxBonus = `${maxVal}%`;
                }
              }
            } catch (e) {}
            return (
              <div
                key={scheme.id}
                onClick={() => navigate(`/scheme-detail/${scheme.id}`)}
                className="dash-card-hover"
                style={{
                  flex: isDesktop ? '0 0 280px' : '0 0 100%', scrollSnapAlign:'start',
                  ...DS.glass, padding:'20px', cursor:'pointer', transition:'all 0.25s ease',
                  display:'flex', flexDirection:'column', gap:'12px', position:'relative', overflow:'hidden'
                }}
              >
                <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'90px', height:'90px', borderRadius:'50%', background:'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <span style={{ fontFamily:DS.font, fontSize:'15px', fontWeight:'800', color:DS.textWhite, flex:1, marginRight:'12px' }}>{scheme.planName}</span>
                  <span style={{ fontFamily:DS.font, fontSize:'9px', fontWeight:'700', color:DS.magenta, background:'rgba(194,24,91,0.15)', padding:'3px 8px', borderRadius:'10px', border:'1px solid rgba(194,24,91,0.2)', whiteSpace:'nowrap' }}>
                    {scheme.frequency === 'Daily' ? 'DAILY' : 'MONTHLY'}
                  </span>
                </div>
                <div style={{ display:'flex', gap:'16px' }}>
                  <div>
                    <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'2px' }}>Duration</span>
                    <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'800', color:DS.textWhite }}>
                      {scheme.totalInstallments} {scheme.durationUnit ? (scheme.durationUnit.toLowerCase().startsWith('day') ? t('days') : t('months')) : (scheme.frequency === 'Daily' ? t('days') : t('months'))}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.textMuted, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'2px' }}>Min. Investment</span>
                    <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'800', color:DS.textWhite }}>{formatRupees(scheme.installmentAmountPaise)}</span>
                  </div>
                </div>
                <div style={{ background:'rgba(255,215,0,0.1)', borderRadius:'10px', padding:'8px 12px', border:'1px solid rgba(255,215,0,0.2)' }}>
                  <span style={{ fontFamily:DS.font, fontSize:'9px', color:'rgba(255,215,0,0.7)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.3px', display:'block', marginBottom:'2px' }}>Bonus Offer</span>
                  <span style={{ fontFamily:DS.font, fontSize:'12px', fontWeight:'800', color:DS.gold }}>Get up to {maxBonus} Extra Gold!</span>
                </div>
                {keywords.length > 0 && (
                  <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                    {keywords.slice(0,2).map((kw, i) => (
                      <span key={i} style={{ fontFamily:DS.font, fontSize:'9px', color:DS.magenta, background:'rgba(194,24,91,0.12)', padding:'3px 8px', borderRadius:'6px', border:'1px solid rgba(194,24,91,0.15)', fontWeight:'600' }}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                  <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.gold }}>View Plan</span>
                  <ChevronRight size={13} color={DS.gold} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /** Promos & banners */
  const renderPromosAndBanners = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      {offerTitle && (
        <div style={{ ...DS.glass, padding:'16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderColor:'rgba(255,215,0,0.2)' }}>
          <div>
            <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.textWhite, display:'block' }}>{offerTitle}</span>
            <span style={{ fontFamily:DS.font, fontSize:'11px', color:DS.textSub }}>{offerDesc}</span>
          </div>
          <button
            onClick={() => navigate('/buy-gold')}
            style={{ background:'linear-gradient(135deg,#C2185B,#4A0E4E)', color:'white', border:'none', padding:'8px 16px', borderRadius:'10px', fontFamily:DS.font, fontSize:'11px', fontWeight:'700', cursor:'pointer' }}
          >
            {t('claim')}
          </button>
        </div>
      )}
      {banners.length > 0 && (
        <>
          <span style={{ fontFamily:DS.font, fontSize:'16px', fontWeight:'800', color:DS.textWhite }}>Special Promotion</span>
          <div
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
            style={{ width:'100%', height:'160px', borderRadius:'20px', overflow:'hidden', position:'relative', background:'#1A1A2E', userSelect:'none', cursor:'grab' }}
          >
            <div style={{ display:'flex', width:`${banners.length*100}%`, height:'100%', transition:'transform 0.6s cubic-bezier(0.25,1,0.5,1)', transform:`translateX(-${activeBannerIdx*(100/banners.length)}%)` }}>
              {banners.map((banner, index) => {
                const bannerKey = banner.id || banner.title || index.toString();
                return (
                  <div
                    key={banner.id||index}
                    onClick={(e)=>{ if(isDraggingRef.current){e.preventDefault();e.stopPropagation();return;} navigate(banner.tapActionUrl||'/scheme-explorer'); }}
                    style={{ width:`${100/banners.length}%`, height:'100%', position:'relative', cursor:'pointer' }}
                  >
                    {!imageErrors[bannerKey] ? (
                      <img src={getImageUrl(banner.imageBase64)} alt={banner.title} draggable="false" onError={()=>setImageErrors(prev=>({...prev,[bannerKey]:true}))} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none' }} />
                    ) : (
                      <div style={{ width:'100%',height:'100%',background:'linear-gradient(135deg,#29001D,#4A0E4E)',display:'flex',alignItems:'center',justifyContent:'center' }} />
                    )}
                    <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'60%',background:'linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 100%)',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'16px 20px 24px 20px' }}>
                      <span style={{ fontFamily:DS.font,fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px',color:DS.gold,fontWeight:'700',marginBottom:'3px' }}>{t('campaign_promo')}</span>
                      <span style={{ fontFamily:DS.font,fontSize:'15px',fontWeight:'800',color:'white',lineHeight:1.2 }}>{banner.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ position:'absolute',bottom:'10px',left:'50%',transform:'translateX(-50%)',display:'flex',gap:'6px',zIndex:5 }}>
              {banners.map((_,idx)=>(
                <button key={idx} onClick={(e)=>{e.stopPropagation();setActiveBannerIdx(idx);}} style={{ width:activeBannerIdx===idx?'16px':'6px',height:'6px',borderRadius:'3px',background:activeBannerIdx===idx?DS.gold:'rgba(255,255,255,0.4)',border:'none',cursor:'pointer',padding:0,transition:'all 0.3s ease' }} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  /** Need Help card */
  const renderNeedHelpCard = () => (
    <div style={{ ...DS.glass, padding:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(74,14,78,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Headset size={20} color={DS.gold} />
        </div>
        <div>
          <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'800', color:DS.textWhite, display:'block' }}>{t('need_help_title')}</span>
          <span style={{ fontFamily:DS.font, fontSize:'11px', color:DS.textSub }}>{t('need_help_desc')}</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:'12px' }}>
        <button onClick={()=>window.open('tel:+919443000000')} style={{ flex:1, height:'42px', borderRadius:'12px', background:'linear-gradient(135deg,#29001D,#4A0E4E)', color:'white', border:'1px solid rgba(255,215,0,0.2)', fontFamily:DS.font, fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer' }}>
          <PhoneCall size={14} color={DS.gold} /><span>{t('call_us')}</span>
        </button>
        <button onClick={()=>window.open('mailto:support@aishwaryam.com')} style={{ flex:1, height:'42px', borderRadius:'12px', background:'rgba(255,255,255,0.05)', color:DS.textWhite, border:'1px solid rgba(255,255,255,0.1)', fontFamily:DS.font, fontWeight:'700', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', cursor:'pointer' }}>
          <Mail size={14} color={DS.textSub} /><span>{t('email_us')}</span>
        </button>
      </div>
    </div>
  );

  /** Ledger/History section */
  const renderLedgerSection = () => {
    const list = getFilteredTransactions();
    return (
      <div style={{ padding: isDesktop ? '32px' : '20px', display:'flex', flexDirection:'column', gap:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:DS.font, fontSize:'22px', fontWeight:'900', color:DS.textWhite }}>{t('transactions_title')}</span>
          <button
            onClick={()=>setTxSort(txSort==='NEWEST'?'OLDEST':'NEWEST')}
            style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:DS.textSub, padding:'8px 16px', borderRadius:'20px', fontFamily:DS.font, fontSize:'11px', fontWeight:'700', cursor:'pointer' }}
          >
            {t('sort')}: {txSort}
          </button>
        </div>

        {/* filter chips */}
        <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
          {['ALL','BONUS','PURCHASES','SCHEME'].map((f) => (
            <button
              key={f}
              onClick={()=>setTxFilter(f as any)}
              style={{
                border:'none', borderRadius:'20px', padding:'8px 18px',
                fontFamily:DS.font, fontSize:'11px', fontWeight:'700',
                background: txFilter===f ? 'linear-gradient(135deg,#C2185B,#4A0E4E)' : 'rgba(255,255,255,0.07)',
                color: txFilter===f ? 'white' : DS.textSub,
                cursor:'pointer', whiteSpace:'nowrap',
                boxShadow: txFilter===f ? '0 4px 16px rgba(194,24,91,0.35)' : 'none',
                transition:'all 0.2s ease'
              }}
            >
              {f === 'ALL' ? 'All Activities' : f === 'BONUS' ? 'Bonus' : f === 'PURCHASES' ? 'Purchases' : 'Scheme Activities'}
            </button>
          ))}
        </div>

        {/* transaction list */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {list.map((tx) => {
            const details = getTxTypeDetails(tx.transactionType);
            const isBuy = tx.transactionType === 'INSTALLMENT' || tx.transactionType === 'BONUS' || tx.transactionType === 'EVENT_BONUS' || tx.transactionType === 'BUY' || tx.transactionType === 'SCHEME_JOIN';
            return (
              <div
                key={tx.id}
                onClick={()=>setSelectedTxDetail(tx)}
                className="dash-card-hover"
                style={{ ...DS.glass, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all 0.2s ease' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:details.bgColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {details.icon}
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'700', color:DS.textWhite }}>{tx.schemeName || details.label}</span>
                      <span style={{ fontFamily:DS.font, fontSize:'9px', fontWeight:'700', color:getStatusDetails(tx.status).color, background:getStatusDetails(tx.status).bgColor, padding:'2px 7px', borderRadius:'8px' }}>
                        {getStatusDetails(tx.status).text}
                      </span>
                    </div>
                    <span style={{ fontFamily:DS.font, fontSize:'10px', color:DS.textMuted }}>
                      {tx.schemeName ? `${details.label} • ` : ''}{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0, marginLeft:'8px' }}>
                  {(tx.transactionType==='BONUS'||tx.transactionType==='EVENT_BONUS'||tx.type==='BONUS'||tx.type==='EVENT_BONUS') ? (
                    <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:'#10B981' }}>+{mgToGrams(tx.goldWeightMg)}</span>
                  ) : (
                    <>
                      <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:isBuy?'#10B981':'#EF4444', display:'block' }}>
                        {isBuy?'+':'-'}{formatRupees(tx.amountPaise)}
                      </span>
                      <span style={{ fontFamily:DS.font, fontSize:'10px', color:DS.gold, fontWeight:'600' }}>{mgToGrams(tx.goldWeightMg)}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:DS.textMuted, fontFamily:DS.font, fontSize:'13px', fontWeight:'600' }}>{t('no_tx_found')}</div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════
  return (
    <div style={{ display:'flex', flexDirection:isDesktop?'row':'column', height:'100vh', width:'100vw', maxWidth:'100%', overflow:'hidden', background:DS.bgPage, fontFamily:DS.font, position:'relative' }}>
      <style>{globalStyles}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      {isDesktop && (
        <div style={{ width:'260px', background:'rgba(255,255,255,0.03)', borderRight:'1px solid rgba(255,255,255,0.07)', padding:'28px 20px', display:'flex', flexDirection:'column', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'32px' }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'0 8px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#29001D,#4A0E4E)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(74,14,78,0.5)' }}>
                <Award size={22} color={DS.gold} />
              </div>
              <span style={{ fontFamily:DS.font, fontWeight:'900', fontSize:'20px', color:'white', letterSpacing:'0.3px' }}>Aishwaryam</span>
            </div>

            {/* Nav */}
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {[
                { tab:0, icon:<Home size={18} />, label:'Dashboard' },
                { tab:1, icon:<History size={18} />, label:'Ledger Activity' },
                { tab:2, icon:<User size={18} />, label:'Profile & Settings' },
              ].map(({ tab, icon, label }) => (
                <button
                  key={tab}
                  className="sidebar-nav-btn"
                  onClick={()=>setSelectedTab(tab)}
                  style={{
                    display:'flex', alignItems:'center', gap:'12px', width:'100%', height:'48px',
                    borderRadius:'12px', border:'none', padding:'0 16px', cursor:'pointer', textAlign:'left',
                    fontFamily:DS.font, fontSize:'13px', fontWeight:selectedTab===tab?'800':'500',
                    background:selectedTab===tab?'rgba(74,14,78,0.5)':'transparent',
                    color:selectedTab===tab?DS.gold:DS.textSub,
                    transition:'all 0.2s ease',
                    boxShadow:selectedTab===tab?'0 2px 12px rgba(74,14,78,0.3)':'none'
                  }}
                >
                  {icon}<span>{label}</span>
                </button>
              ))}
              <button
                className="sidebar-nav-btn"
                onClick={()=>navigate('/ai_assistant')}
                style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', height:'48px', borderRadius:'12px', border:'none', background:'transparent', color:DS.textSub, fontFamily:DS.font, fontWeight:'500', cursor:'pointer', padding:'0 16px', fontSize:'13px', textAlign:'left', transition:'all 0.2s ease' }}
              >
                <Headset size={18} /><span>AI Assistant</span>
              </button>
            </div>
          </div>

          {/* User info + logout */}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'0 8px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'rgba(74,14,78,0.4)', border:'1px solid rgba(255,215,0,0.2)' }}>
                {profile?.profilePictureBase64 ? <img src={profile.profilePictureBase64} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Avatar" /> : <User size={20} color={DS.gold} />}
              </div>
              <div style={{ overflow:'hidden' }}>
                <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.textWhite, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block' }}>{userName}</span>
                <span style={{ fontFamily:DS.font, fontSize:'10px', color:DS.textMuted, display:'block' }}>Verified Client</span>
              </div>
            </div>
            <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', height:'40px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)', fontFamily:DS.font, fontWeight:'700', fontSize:'12px', cursor:'pointer' }}>
              <LogOut size={14} /><span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100%', overflowY:'auto', overflowX:'hidden' }}>

        {/* TOP NAVBAR */}
        {selectedTab !== 2 && (
          <div style={{
            background:'rgba(15,15,26,0.9)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            borderBottom:'1px solid rgba(255,255,255,0.07)',
            paddingTop: isDesktop ? '16px' : 'calc(0px + env(safe-area-inset-top, 0px))',
            paddingLeft:'20px', paddingRight:'20px',
            paddingBottom: isDesktop ? '16px' : '12px',
            display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:'rgba(74,14,78,0.5)', border:'1.5px solid rgba(255,215,0,0.25)' }}>
                {profile?.profilePictureBase64 ? <img src={profile.profilePictureBase64} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Avatar" /> : <User size={20} color={DS.gold} />}
              </div>
              <div>
                <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'800', color:DS.textWhite, display:'block' }}>
                  {isDesktop ? `Welcome Back, ${userName}` : `${t('hello')}, ${userName}`}
                </span>
                <span style={{ fontFamily:DS.font, fontSize:'10px', color:DS.textMuted, display:'block' }}>{t('verified_client')}</span>
              </div>
            </div>
            <button
              onClick={()=>{ setUnreadNotifCount(0); navigate('/notifications'); }}
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'50%', width:'38px', height:'38px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}
            >
              <Bell size={18} color={DS.textSub} />
              {unreadNotifCount > 0 && <span style={{ position:'absolute', top:'7px', right:'7px', width:'8px', height:'8px', background:'#EF4444', borderRadius:'50%' }} />}
            </button>
          </div>
        )}

        {/* TAB CONTAINER */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', paddingBottom:isDesktop?'32px':(isAndroidApp?'96px':'32px') }}>

          {/* ── TAB 0: HOME ── */}
          {selectedTab === 0 && (
            <div className="dash-fade-in" style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* KYC alert */}
              {(kycLevel === 'BASIC' || kycLevel === 'PENDING') && (
                <div onClick={()=>navigate('/onboarding')} style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'16px', padding:'14px 16px', display:'flex', gap:'12px', cursor:'pointer', alignItems:'center' }}>
                  <AlertTriangle size={18} color="#F59E0B" />
                  <div>
                    <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.textWhite, display:'block' }}>{t('kyc_required')}</span>
                    <span style={{ fontFamily:DS.font, fontSize:'11px', color:DS.textSub }}>{t('kyc_required_desc')}</span>
                  </div>
                </div>
              )}

              {isDesktop ? (
                <div style={{ display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:'24px', alignItems:'start' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                    {renderVaultCard()}
                    {renderQuickActionsGrid()}
                    {renderAvailableSchemesSection()}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                    {renderLiveRatesCard()}
                    {renderActiveSchemesSection()}
                    {renderPromosAndBanners()}
                    {renderNeedHelpCard()}
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                  {renderVaultCard()}
                  {renderLiveRatesCard()}
                  {renderQuickActionsGrid()}
                  {renderActiveSchemesSection()}
                  {renderAvailableSchemesSection()}
                  {renderPromosAndBanners()}
                  {renderNeedHelpCard()}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 1: LEDGER ── */}
          {selectedTab === 1 && <div className="dash-fade-in">{renderLedgerSection()}</div>}

          {/* ── TAB 2: PROFILE ── */}
          {selectedTab === 2 && (
            <div className="dash-fade-in" style={{ minHeight:'calc(100vh - 64px)', display:'flex', flexDirection:'column', position:'relative', width:'100%', padding:0 }}>

              {/* mobile profile header */}
              {!isDesktop && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'16px 20px', background:'rgba(255,255,255,0.02)', position:'relative', zIndex:10, marginTop:'30px' }}>
                  <button onClick={()=>setSelectedTab(0)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:DS.textWhite, position:'absolute', left:'12px', zIndex:11 }}>
                    <ChevronLeft size={24} color={DS.textWhite} />
                  </button>
                  <span style={{ fontFamily:DS.font, fontSize:'18px', fontWeight:'900', color:DS.textWhite, textAlign:'center' }}>{t('my_profile')}</span>
                </div>
              )}

              {/* Avatar + user details */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px 24px 20px' }}>
                <div style={{ position:'relative', width:'96px', height:'96px', marginBottom:'16px' }}>
                  <div style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden', background:'rgba(74,14,78,0.4)', border:'3px solid rgba(255,215,0,0.3)', boxShadow:'0 8px 32px rgba(74,14,78,0.4)' }}>
                    {profile?.profilePictureBase64 ? (
                      <img src={profile.profilePictureBase64} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Avatar" />
                    ) : (
                      <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <User size={40} color={DS.gold} />
                      </div>
                    )}
                  </div>
                  <button onClick={openEditProfile} style={{ position:'absolute', bottom:'0px', right:'0px', width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,#C2185B,#4A0E4E)', border:'2px solid rgba(255,215,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:0 }}>
                    <Pencil size={13} color="white" />
                  </button>
                </div>
                <span style={{ fontFamily:DS.font, fontSize:'20px', fontWeight:'900', color:DS.textWhite, letterSpacing:'0.3px', marginBottom:'4px' }}>{userName}</span>
                <span style={{ fontFamily:DS.font, fontSize:'13px', color:DS.textSub }}>{profile?.email || ''}</span>
              </div>

              {/* menu cards */}
              <div style={{ flex:1, padding:'0 20px 120px 20px', display:'flex', flexDirection:'column', gap:'24px' }}>

                {/* Quick actions */}
                <div style={{ display:'grid', gridTemplateColumns:isDesktop?'1fr 1fr':'1fr', gap:'10px' }}>
                  {[
                    { label:t('price_calculator'), icon:<Calculator size={20} />, iconBg:'rgba(239,83,80,0.15)', iconColor:'#EF5350', onClick:()=>navigate('/profile/price-calculator') },
                    { label:t('completed_schemes'), icon:<Award size={20} />, iconBg:'rgba(0,172,193,0.15)', iconColor:'#00ACC1', onClick:()=>navigate('/profile/completed-schemes') },
                  ].map(({ label, icon, iconBg, iconColor, onClick }) => (
                    <div key={label} onClick={onClick} className="dash-card-hover" style={{ ...DS.glass, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', cursor:'pointer', transition:'all 0.2s ease' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                        <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor }}>{icon}</div>
                        <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'700', color:DS.textWhite }}>{label}</span>
                      </div>
                      <ChevronRight size={18} color={DS.textMuted} />
                    </div>
                  ))}
                </div>

                {/* General Settings */}
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textMuted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'2px' }}>{t('general_settings')}</span>
                  <div style={{ display:'grid', gridTemplateColumns:isDesktop?'1fr 1fr':'1fr', gap:'10px' }}>
                    {[
                      { label:t('address_label'), icon:<MapPin size={20} />, iconBg:'rgba(156,39,176,0.15)', iconColor:'#9C27B0', onClick:()=>navigate('/profile/address') },
                      { label:t('kyc_details'), icon:<ShieldCheck size={20} />, iconBg:'rgba(2,136,209,0.15)', iconColor:'#0288D1', onClick:()=>navigate('/profile/kyc') },
                      { label:t('change_mpin'), icon:<Lock size={20} />, iconBg:'rgba(230,81,0,0.15)', iconColor:'#E65100', onClick:()=>navigate('/mpin/change') },
                    ].map(({ label, icon, iconBg, iconColor, onClick }) => (
                      <div key={label} onClick={onClick} className="dash-card-hover" style={{ ...DS.glass, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', cursor:'pointer', transition:'all 0.2s ease' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                          <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:iconColor }}>{icon}</div>
                          <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'700', color:DS.textWhite }}>{label}</span>
                        </div>
                        <ChevronRight size={18} color={DS.textMuted} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security & Privacy */}
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textMuted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'2px' }}>{t('security_privacy')}</span>
                  <div style={{ display:'grid', gridTemplateColumns:isDesktop?'1fr 1fr':'1fr', gap:'10px' }}>
                    {[
                      { label:t('privacy_policy_label'), icon:<ShieldCheck size={20} />, onClick:()=>navigate('/privacy-policy') },
                      { label:t('terms_conditions_label'), icon:<FileText size={20} />, onClick:()=>navigate('/terms-conditions') },
                    ].map(({ label, icon, onClick }) => (
                      <div key={label} onClick={onClick} className="dash-card-hover" style={{ ...DS.glass, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', cursor:'pointer', transition:'all 0.2s ease' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                          <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(96,125,139,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#78909C' }}>{icon}</div>
                          <span style={{ fontFamily:DS.font, fontSize:'14px', fontWeight:'700', color:DS.textWhite }}>{label}</span>
                        </div>
                        <ChevronRight size={18} color={DS.textMuted} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language selector */}
                <div style={{ ...DS.glass, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:'rgba(74,14,78,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Languages size={20} color={DS.gold} />
                    </div>
                    <div>
                      <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.textWhite, display:'block' }}>{t('language')}</span>
                      <span style={{ fontFamily:DS.font, fontSize:'11px', color:DS.textSub }}>{lang === 'ta' ? 'தமிழ் (Tamil)' : 'English'}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:lang==='en'?DS.gold:DS.textMuted }}>EN</span>
                    <button
                      onClick={async()=>{ const nextLang=lang==='en'?'ta':'en'; changeLanguage(nextLang); const userId=SessionManager.getUserId(); if(userId){try{await ApiClient.put(`api/User/profile/${userId}`,{preferredLanguage:nextLang});}catch(err){}} }}
                      style={{ width:'46px', height:'24px', borderRadius:'12px', background:lang==='ta'?'linear-gradient(135deg,#C2185B,#4A0E4E)':'rgba(255,255,255,0.1)', border:'none', position:'relative', cursor:'pointer', transition:'background 0.2s ease', padding:0 }}
                    >
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left:lang==='ta'?'25px':'3px', transition:'left 0.2s ease', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                    </button>
                    <span style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:lang==='ta'?DS.gold:DS.textMuted }}>தமிழ்</span>
                  </div>
                </div>

                {/* Logout (mobile) */}
                {!isDesktop && (
                  <button onClick={handleLogout} style={{ width:'100%', height:'52px', borderRadius:'16px', background:'rgba(239,68,68,0.1)', color:'#EF4444', border:'1.5px solid rgba(239,68,68,0.2)', fontFamily:DS.font, fontWeight:'800', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <LogOut size={16} />{t('logout')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM TAB BAR (mobile only) ── */}
        {!isDesktop && (
          <div style={{ background:'rgba(15,15,26,0.95)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderTop:'1px solid rgba(255,255,255,0.07)', height:`calc(64px + env(safe-area-inset-bottom, 0px))`, paddingBottom:'env(safe-area-inset-bottom, 0px)', display:'flex', justifyContent:'space-around', alignItems:'center', zIndex:10, boxSizing:'border-box' }}>
            {[
              { tab:0, icon:Home, label:t('tab_home') },
              { tab:1, icon:History, label:t('tab_history') },
              { tab:2, icon:User, label:t('tab_profile') },
            ].map(({ tab, icon: Icon, label }) => (
              <button
                key={tab}
                onClick={()=>setSelectedTab(tab)}
                style={{ background:'transparent', border:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', cursor:'pointer', padding:'0 12px', position:'relative' }}
              >
                {selectedTab === tab && (
                  <div style={{ position:'absolute', top:'-8px', left:'50%', transform:'translateX(-50%)', width:'28px', height:'3px', borderRadius:'2px', background:'linear-gradient(90deg,#C2185B,#FFD700)' }} />
                )}
                <Icon size={22} color={selectedTab===tab ? DS.gold : 'rgba(255,255,255,0.3)'} />
                <span style={{ fontFamily:DS.font, fontSize:'10px', fontWeight:selectedTab===tab?'800':'500', color:selectedTab===tab?DS.gold:'rgba(255,255,255,0.3)' }}>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── TRANSACTION DETAIL MODAL ── */}
      {selectedTxDetail && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ width:'90%', maxWidth:'360px', background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'24px', padding:'24px', display:'flex', flexDirection:'column', gap:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:DS.font, fontSize:'16px', fontWeight:'900', color:DS.textWhite }}>Receipt Details</span>
              <button onClick={()=>setSelectedTxDetail(null)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <X size={16} color={DS.textSub} />
              </button>
            </div>

            {(selectedTxDetail.transactionType==='BONUS'||selectedTxDetail.transactionType==='EVENT_BONUS'||selectedTxDetail.type==='BONUS'||selectedTxDetail.type==='EVENT_BONUS') ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { label:'Transaction ID', value:selectedTxDetail.id },
                  { label:'Date & Time', value:`${new Date(selectedTxDetail.createdAt).toLocaleDateString()} ${new Date(selectedTxDetail.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` },
                  { label:'Scheme Name', value:selectedTxDetail.schemeName||'N/A' },
                  { label:'Bonus Percentage', value:selectedTxDetail.bonusPercentage?`${selectedTxDetail.bonusPercentage}%`:'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                    <span style={{ fontFamily:DS.font, color:DS.textMuted, fontWeight:'600' }}>{label}</span>
                    <span style={{ fontFamily:DS.font, fontWeight:'800', color:DS.textWhite, textAlign:'right', maxWidth:'55%', wordBreak:'break-all' }}>{value}</span>
                  </div>
                ))}
                <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', fontWeight:'800' }}>
                  <span style={{ fontFamily:DS.font, color:DS.textWhite }}>Bonus Gold Earned</span>
                  <span style={{ fontFamily:DS.font, color:'#10B981' }}>{mgToGrams(selectedTxDetail.goldWeightMg)}</span>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { label:'Transaction ID', value:selectedTxDetail.id, show:true },
                  { label:'Date & Time', value:`${new Date(selectedTxDetail.createdAt).toLocaleDateString()} ${new Date(selectedTxDetail.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`, show:true },
                  { label:'Scheme Name', value:selectedTxDetail.schemeName, show:!!selectedTxDetail.schemeName },
                  { label:'Gold Weight', value:mgToGrams(selectedTxDetail.goldWeightMg), show:selectedTxDetail.type!=='SCHEME_JOIN' },
                  { label:'Bonus Gold Earned', value:mgToGrams(selectedTxDetail.bonusGoldMg), show:selectedTxDetail.bonusGoldMg>0 },
                  { label:'Status', value:getStatusDetails(selectedTxDetail.status).text, show:true, color:getStatusDetails(selectedTxDetail.status).color },
                ].filter(i=>i.show).map(({ label, value, color }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                    <span style={{ fontFamily:DS.font, color:DS.textMuted, fontWeight:'600' }}>{label}</span>
                    <span style={{ fontFamily:DS.font, fontWeight:'800', color:color||DS.textWhite, textAlign:'right', maxWidth:'55%', wordBreak:'break-all' }}>{value}</span>
                  </div>
                ))}
                <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', fontWeight:'800' }}>
                  <span style={{ fontFamily:DS.font, color:DS.textWhite }}>{selectedTxDetail.type==='SCHEME_JOIN'?'Installment Size':'Amount Paid'}</span>
                  <span style={{ fontFamily:DS.font, color:DS.magenta }}>{formatRupees(selectedTxDetail.amountPaise)}</span>
                </div>
              </div>
            )}

            <button
              onClick={()=>{ if(selectedTxDetail&&selectedTxDetail.transactionId) window.open(`${BASE_URL}api/Gold/receipt/download/${selectedTxDetail.transactionId}`,'_blank'); }}
              style={{ width:'100%', height:'44px', borderRadius:'12px', background:'linear-gradient(135deg,#29001D,#C2185B)', color:'white', border:'none', fontFamily:DS.font, fontWeight:'800', fontSize:'13px', cursor:'pointer', boxShadow:'0 4px 16px rgba(194,24,91,0.35)' }}
            >
              Download Receipt
            </button>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfileModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, overflowY:'auto' }}>
          <div style={{ width:'90%', maxWidth:'450px', background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'24px', padding:'24px', display:'flex', flexDirection:'column', gap:'16px', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:DS.font, fontSize:'18px', fontWeight:'900', color:DS.textWhite }}>Edit Profile</span>
              <button onClick={()=>setShowEditProfileModal(false)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <X size={16} color={DS.textSub} />
              </button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* photo upload */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'85px', height:'85px', borderRadius:'50%', overflow:'hidden', background:'rgba(74,14,78,0.4)', border:'2px solid rgba(255,215,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {editImageBase64 ? <img src={editImageBase64} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Preview" /> : <User size={36} color={DS.gold} />}
                </div>
                <label style={{ fontFamily:DS.font, fontSize:'12px', fontWeight:'700', color:DS.magenta, cursor:isMinor?'not-allowed':'pointer', padding:'6px 16px', borderRadius:'16px', border:`1.5px solid ${DS.magenta}`, background:'transparent', opacity:isMinor?0.5:1, pointerEvents:isMinor?'none':'auto' }}>
                  Change Photo<input type="file" accept="image/*" disabled={isMinor} onChange={handleImageChange} style={{ display:'none' }} />
                </label>
                {uploadError && <span style={{ fontFamily:DS.font, fontSize:'11px', color:'#EF4444', textAlign:'center' }}>{uploadError}</span>}
                <span style={{ fontFamily:DS.font, fontSize:'9px', color:DS.textMuted }}>Allowed: JPG, JPEG, PNG (Max 2MB)</span>
              </div>

              {/* input fields styling */}
              {[
                { label:'Full Name', value:editName, onChange:(v:string)=>setEditName(v), type:'text', disabled:isMinor },
                { label:'Mobile Number', value:profile?.phoneNumber?`+91 ${profile.phoneNumber}`:'', onChange:()=>{}, type:'text', disabled:true },
                { label:'Email Address', value:editEmail, onChange:(v:string)=>setEditEmail(v), type:'email', disabled:isMinor },
              ].map(({ label, value, onChange, type, disabled }) => (
                <div key={label}>
                  <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>{label}</label>
                  <input type={type} value={value} disabled={disabled} onChange={(e)=>onChange(e.target.value)}
                    style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:disabled?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:disabled?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                  />
                </div>
              ))}

              <div style={{ display:'flex', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Date of Birth{editDob&&calculatedAge>0?` (Age: ${calculatedAge}${isMinor?' - Minor':''})`:''}</label>
                  <input type="date" value={editDob} onChange={(e)=>setEditDob(e.target.value)} onClick={(e)=>{try{(e.target as any).showPicker();}catch(err){}}}
                    style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:'rgba(255,255,255,0.06)', color:DS.textWhite, boxSizing:'border-box' }}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Gender</label>
                  <select value={editGender} disabled={isMinor} onChange={(e)=>setEditGender(e.target.value)}
                    style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:isMinor?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:isMinor?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Wedding Anniversary Date</label>
                <input type="date" value={editWeddingDate} disabled={isMinor} onChange={(e)=>setEditWeddingDate(e.target.value)} onClick={(e)=>{try{(e.target as any).showPicker();}catch(err){}}}
                  style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:isMinor?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:isMinor?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                />
              </div>

              <div style={{ height:'1px', background:'rgba(255,255,255,0.07)', margin:'4px 0' }} />
              <span style={{ fontFamily:DS.font, fontSize:'13px', fontWeight:'800', color:DS.textWhite }}>Nominee Details</span>

              <div>
                <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Nominee Name</label>
                <input type="text" value={editNomineeName} disabled={isMinor} onChange={(e)=>setEditNomineeName(e.target.value)}
                  style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:isMinor?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:isMinor?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                />
              </div>

              <div style={{ display:'flex', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Nominee Mobile</label>
                  <input type="text" value={editNomineePhone} disabled={isMinor} onChange={(e)=>setEditNomineePhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:isMinor?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:isMinor?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontFamily:DS.font, fontSize:'11px', fontWeight:'700', color:DS.textSub }}>Relationship</label>
                  <select value={editNomineeRelation} disabled={isMinor} onChange={(e)=>setEditNomineeRelation(e.target.value)}
                    style={{ width:'100%', height:'42px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', padding:'0 14px', fontFamily:DS.font, fontSize:'13px', outline:'none', marginTop:'5px', background:isMinor?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.06)', color:isMinor?DS.textMuted:DS.textWhite, boxSizing:'border-box' }}
                  >
                    <option value="">Select</option>
                    {['Father','Mother','Wife','Husband','Son','Daughter','Brother','Guardian'].map((rel)=>(<option key={rel} value={rel}>{rel}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'12px', marginTop:'4px' }}>
              <button onClick={handleSaveProfile} disabled={isSavingProfile} style={{ flex:1, height:'46px', borderRadius:'12px', background:'linear-gradient(135deg,#29001D,#C2185B)', color:'white', border:'none', fontFamily:DS.font, fontWeight:'800', fontSize:'13px', cursor:'pointer', opacity:isSavingProfile?0.7:1, boxShadow:'0 4px 16px rgba(194,24,91,0.35)' }}>
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={()=>setShowEditProfileModal(false)} style={{ flex:1, height:'46px', borderRadius:'12px', background:'rgba(255,255,255,0.06)', color:DS.textSub, border:'1px solid rgba(255,255,255,0.1)', fontFamily:DS.font, fontWeight:'700', fontSize:'13px', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
