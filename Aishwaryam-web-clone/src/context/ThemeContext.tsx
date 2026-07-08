import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface FestivalTheme {
  id: string;
  name: string;
  description: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  statusBarColorHex: string;
  splashBgColorHex: string;
  splashIllustrationUrl: string | null;
  loginIllustrationUrl: string | null;
  homeIllustrationUrl: string | null;
  sidebarIllustrationUrl: string | null;
  welcomeBannerUrl: string | null;
  decorationsJson: string | null;
  lottieAnimationsJson: string | null;
  startDate: string | null;
  endDate: string | null;
  isRecurring: boolean;
  isSystemDefault: boolean;
}

interface ThemeContextType {
  activeTheme: FestivalTheme | null;
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Default system theme properties for local fallback
const defaultSystemTheme: FestivalTheme = {
  id: 'default',
  name: 'Default Theme',
  description: 'Aishwaryam default color scheme and illustrations',
  primaryColorHex: '#4A0E4E',
  secondaryColorHex: '#E8A83A',
  statusBarColorHex: '#4A0E4E',
  splashBgColorHex: '#FFFFFF',
  splashIllustrationUrl: null,
  loginIllustrationUrl: null,
  homeIllustrationUrl: null,
  sidebarIllustrationUrl: null,
  welcomeBannerUrl: null,
  decorationsJson: null,
  lottieAnimationsJson: null,
  startDate: null,
  endDate: null,
  isRecurring: false,
  isSystemDefault: true,
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<FestivalTheme>(() => {
    try {
      const cached = localStorage.getItem('aishwaryam-cached-theme');
      return cached ? JSON.parse(cached) : defaultSystemTheme;
    } catch {
      return defaultSystemTheme;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const applyThemeColors = (theme: FestivalTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColorHex);
    root.style.setProperty('--secondary-color', theme.secondaryColorHex);
    root.style.setProperty('--status-bar-color', theme.statusBarColorHex);
    root.style.setProperty('--splash-bg-color', theme.splashBgColorHex);
    
    // Attempt status bar background updates dynamically if running under Capacitor
    if ((window as any).Capacitor) {
      try {
        const { StatusBar } = (window as any).Capacitor.Plugins;
        if (StatusBar) {
          StatusBar.setBackgroundColor({ color: theme.statusBarColorHex });
        }
      } catch (e) {
        console.warn('Failed to update Capacitor StatusBar color:', e);
      }
    }
  };

  const refreshTheme = async () => {
    try {
      const res = await axios.get<FestivalTheme>(`${API_URL}/api/themes/active`);
      if (res.data) {
        setActiveTheme(res.data);
        applyThemeColors(res.data);
        localStorage.setItem('aishwaryam-cached-theme', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Failed to fetch active theme from server. Using cached theme.', err);
      // Fallback is already loaded from local storage via initial state
      applyThemeColors(activeTheme);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ activeTheme, isLoading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
