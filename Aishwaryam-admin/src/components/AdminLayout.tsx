import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Receipt,
  Coins,
  Tag,
  UserCheck,
  ClipboardList,
  Image,
  Bell,
  Terminal,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AdminLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { logout, showToast } = useAdmin();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('aishwaryam-admin-theme') as 'light' | 'dark') || 'dark';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aishwaryam-admin-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    showToast(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} mode`, 'info');
  };

  const navItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'kyc', label: 'KYC Verification', icon: <ShieldCheck size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <Receipt size={18} /> },
    { id: 'redemptions', label: 'Redemptions', icon: <Coins size={18} /> },
    { id: 'enrollments', label: 'Scheme Enrollments', icon: <UserCheck size={18} /> },
    { id: 'schemes', label: 'Scheme Master', icon: <ClipboardList size={18} /> },
    { id: 'offers', label: 'Offers & Promos', icon: <Tag size={18} /> },
    { id: 'marketing', label: 'Marketing Assets', icon: <Image size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <Terminal size={18} /> },
  ];

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  const handleNavSelect = (id: string) => {
    setCurrentTab(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            color: '#ffffff'
          }}>
            A
          </div>
          <h1>Aishwaryam</h1>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{ marginLeft: 'auto', display: 'var(--mobile-close-btn, none)', padding: '4px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
          {/* Inject style helper to render close button on small screens */}
          <style>{`
            @media (max-width: 1024px) {
              .sidebar-logo button { display: block !important; }
            }
          `}</style>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-link ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavSelect(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div
            className="nav-link"
            style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '12px' }}
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        {/* Topbar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '8px'
              }}
              className="mobile-toggle-btn"
            >
              <Menu size={22} />
            </button>
            <style>{`
              @media (max-width: 1024px) {
                .mobile-toggle-btn { display: flex !important; }
              }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-3)' }}>Admin</span>
              <span style={{ color: 'var(--border)' }}>/</span>
              <span style={{ fontWeight: '600' }}>
                {navItems.find((n) => n.id === currentTab)?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Info Chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="admin-profile-chip">
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px'
              }}>
                A
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }} className="admin-profile-details">
                <span style={{ fontWeight: '700', fontSize: '13px' }}>Admin</span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>blazewingwebs@gmail.com</span>
              </div>
            </div>
            <style>{`
              @media (max-width: 640px) {
                .admin-profile-details { display: none !important; }
              }
            `}</style>
          </div>
        </header>

        {/* Dynamic Inner Component Render */}
        <main className="page-container fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
