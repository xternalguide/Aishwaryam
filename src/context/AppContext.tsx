import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../utils/ApiClient';
import { SessionManager } from '../utils/SessionManager';

interface AppContextType {
  profile: any;
  livePrice: any;
  activeSchemes: any[];
  portfolio: any;
  availableSchemes: any[];
  transactions: any[];
  notifications: any[];
  unreadNotifCount: number;
  offers: any[];
  bankAccounts: any[];
  isLoading: boolean;
  refreshData: (silent?: boolean) => Promise<void>;
  clearData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getCache = (key: string, defaultValue: any) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<any>(() => getCache('CACHE_PROFILE', null));
  const [livePrice, setLivePrice] = useState<any>(() => getCache('CACHE_LIVE_PRICE', { buyPricePaise: 0, sellPricePaise: 0, price24KPaise: 0, price22KPaise: 0 }));
  const [activeSchemes, setActiveSchemes] = useState<any[]>(() => getCache('CACHE_ACTIVE_SCHEMES', []));
  const [portfolio, setPortfolio] = useState<any>(() => getCache('CACHE_PORTFOLIO', { goldBalanceMg: 0, investedAmountPaise: 0, currentValuePaise: 0, returnPercentage: 0, lockedGoldMg: 0, redeemableGoldMg: 0 }));
  const [availableSchemes, setAvailableSchemes] = useState<any[]>(() => getCache('CACHE_AVAILABLE_SCHEMES', []));
  const [transactions, setTransactions] = useState<any[]>(() => getCache('CACHE_TRANSACTIONS', []));
  const [notifications, setNotifications] = useState<any[]>(() => getCache('CACHE_NOTIFICATIONS', []));
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() => {
    try {
      const val = localStorage.getItem('CACHE_UNREAD_COUNT');
      return val ? Number(val) : 0;
    } catch {
      return 0;
    }
  });
  const [offers, setOffers] = useState<any[]>(() => getCache('CACHE_OFFERS', []));
  const [bankAccounts, setBankAccounts] = useState<any[]>(() => getCache('CACHE_BANK_ACCOUNTS', []));
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async (silent: boolean = false) => {
    const userId = SessionManager.getUserId();
    if (!userId) return;
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [
        profileRes,
        priceRes,
        dashRes,
        portfolioRes,
        listRes,
        ledgerRes,
        offersRes,
        bankRes,
        notifRes
      ] = await Promise.allSettled([
        ApiClient.get(`api/User/profile/${userId}`),
        ApiClient.get('api/Gold/price'),
        ApiClient.get(`api/Scheme/dashboard/${userId}`),
        ApiClient.get(`api/Dashboard/portfolio/${userId}`),
        ApiClient.get('api/Scheme/list'),
        ApiClient.get('api/Gold/transactions?page=1&pageSize=100'),
        ApiClient.get(`api/Offers/active/${userId}`),
        ApiClient.get(`api/Banking/accounts/${userId}`),
        ApiClient.get('api/Notification')
      ]);

      if (profileRes.status === 'rejected') {
        const reason = profileRes.reason;
        if (reason && reason.response && (reason.response.status === 404 || reason.response.status === 401)) {
          console.warn('User profile not found or unauthorized on server. Logging out...');
          SessionManager.clearSession();
          clearData();
          if (SessionManager.getOnboardingStage() === 'FULLY_VERIFIED') {
            window.location.hash = '#/mpin/verify';
          } else {
            window.location.hash = '#/login';
          }
          return;
        }
      }
      if (profileRes.status === 'fulfilled' && profileRes.value.data) {
        setProfile(profileRes.value.data);
        localStorage.setItem('CACHE_PROFILE', JSON.stringify(profileRes.value.data));
      }
      if (priceRes.status === 'fulfilled' && priceRes.value.data) {
        setLivePrice(priceRes.value.data);
        localStorage.setItem('CACHE_LIVE_PRICE', JSON.stringify(priceRes.value.data));
      }
      if (dashRes.status === 'fulfilled' && dashRes.value.data) {
        const schemes = dashRes.value.data.activeSchemes || [];
        setActiveSchemes(schemes);
        localStorage.setItem('CACHE_ACTIVE_SCHEMES', JSON.stringify(schemes));
      }
      if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data) {
        setPortfolio(portfolioRes.value.data);
        localStorage.setItem('CACHE_PORTFOLIO', JSON.stringify(portfolioRes.value.data));
      }
      if (listRes.status === 'fulfilled' && listRes.value.data) {
        setAvailableSchemes(listRes.value.data);
        localStorage.setItem('CACHE_AVAILABLE_SCHEMES', JSON.stringify(listRes.value.data));
      }
      if (ledgerRes.status === 'fulfilled' && ledgerRes.value.data) {
        const rawTxs = ledgerRes.value.data.transactions || [];
        const txList = rawTxs.map((t: any) => ({
          ...t,
          id: t.transactionId || t.id,
          transactionType: t.type || t.transactionType || 'BUY'
        }));
        setTransactions(txList);
        localStorage.setItem('CACHE_TRANSACTIONS', JSON.stringify(txList));
      }
      if (offersRes.status === 'fulfilled' && offersRes.value.data) {
        setOffers(offersRes.value.data);
        localStorage.setItem('CACHE_OFFERS', JSON.stringify(offersRes.value.data));
      }
      if (bankRes.status === 'fulfilled' && bankRes.value.data && Array.isArray(bankRes.value.data)) {
        setBankAccounts(bankRes.value.data);
        localStorage.setItem('CACHE_BANK_ACCOUNTS', JSON.stringify(bankRes.value.data));
      } else {
        setBankAccounts([]);
        localStorage.setItem('CACHE_BANK_ACCOUNTS', JSON.stringify([]));
      }
      if (notifRes.status === 'fulfilled' && notifRes.value.data) {
        setNotifications(notifRes.value.data);
        const count = notifRes.value.data.filter((n: any) => !n.isRead).length;
        setUnreadNotifCount(count);
        localStorage.setItem('CACHE_NOTIFICATIONS', JSON.stringify(notifRes.value.data));
        localStorage.setItem('CACHE_UNREAD_COUNT', String(count));
      }
    } catch (err) {
      console.error('Error refreshing app context data:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const clearData = () => {
    setProfile(null);
    setActiveSchemes([]);
    setTransactions([]);
    setNotifications([]);
    setUnreadNotifCount(0);
    setOffers([]);
    setBankAccounts([]);

    localStorage.removeItem('CACHE_PROFILE');
    localStorage.removeItem('CACHE_LIVE_PRICE');
    localStorage.removeItem('CACHE_ACTIVE_SCHEMES');
    localStorage.removeItem('CACHE_PORTFOLIO');
    localStorage.removeItem('CACHE_AVAILABLE_SCHEMES');
    localStorage.removeItem('CACHE_TRANSACTIONS');
    localStorage.removeItem('CACHE_NOTIFICATIONS');
    localStorage.removeItem('CACHE_UNREAD_COUNT');
    localStorage.removeItem('CACHE_OFFERS');
    localStorage.removeItem('CACHE_BANK_ACCOUNTS');
  };

  useEffect(() => {
    const userId = SessionManager.getUserId();
    if (userId) {
      refreshData();
    } else {
      clearData();
    }

    // Set up silent polling every 8 seconds to fetch database changes immediately in the background
    const interval = setInterval(() => {
      const currentUserId = SessionManager.getUserId();
      if (currentUserId) {
        refreshData(true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      profile,
      livePrice,
      activeSchemes,
      portfolio,
      availableSchemes,
      transactions,
      notifications,
      unreadNotifCount,
      offers,
      bankAccounts,
      isLoading,
      refreshData,
      clearData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
