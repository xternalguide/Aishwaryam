import React, { useState, useEffect } from 'react';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminTokens } from './pages/SuperAdminTokens';
import { SuperAdminErrors } from './pages/SuperAdminErrors';
import { SuperAdminAudit } from './pages/SuperAdminAudit';
import { SuperAdminSettings } from './pages/SuperAdminSettings';
import { SuperAdminEnv } from './pages/SuperAdminEnv';
import { Shield, Key, ShieldAlert, FileSpreadsheet, Settings, LogOut, LayoutDashboard, Sliders } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5044';

function App() {
  const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('super_admin_key'));
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [tokens, setTokens] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (key: string) => {
    sessionStorage.setItem('super_admin_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('super_admin_key');
    setApiKey(null);
  };

  const fetchData = async () => {
    if (!apiKey) return;
    setIsLoading(true);
    try {
      const headers = { 'X-Super-Admin-Key': apiKey };

      // Tokens
      const resTokens = await fetch(`${API_BASE}/api/SuperAdmin/tokens`, { headers });
      if (resTokens.ok) setTokens(await resTokens.json());

      // Errors
      const resErrors = await fetch(`${API_BASE}/api/SuperAdmin/errors`, { headers });
      if (resErrors.ok) setErrors(await resErrors.json());

      // Logs
      const resLogs = await fetch(`${API_BASE}/api/SuperAdmin/admin-logs`, { headers });
      if (resLogs.ok) setLogs(await resLogs.json());

      // Emails
      const resEmails = await fetch(`${API_BASE}/api/SuperAdmin/settings/emails`, { headers });
      if (resEmails.ok) setEmails(await resEmails.json());

    } catch (err) {
      console.error('Failed to retrieve telemetry data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchData();
    }
  }, [apiKey]);

  const handleRevokeToken = async (id: string) => {
    if (!apiKey) return;
    try {
      const res = await fetch(`${API_BASE}/api/SuperAdmin/tokens/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Super-Admin-Key': apiKey
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to revoke session token:', err);
    }
  };

  const handleSaveEmails = async (emailList: string[]) => {
    if (!apiKey) return;
    try {
      const res = await fetch(`${API_BASE}/api/SuperAdmin/settings/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Super-Admin-Key': apiKey
        },
        body: JSON.stringify(emailList)
      });
      if (res.ok) {
        setEmails(emailList);
        alert('Alert recipients updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update alert recipients:', err);
    }
  };

  if (!apiKey) {
    return <SuperAdminLogin onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <SuperAdminDashboard
            tokensCount={tokens.length}
            errorsCount={errors.length}
            logsCount={logs.length}
            onNavigate={setActiveTab}
          />
        );
      case 'tokens':
        return <SuperAdminTokens tokens={tokens} onRevoke={handleRevokeToken} isLoading={isLoading} />;
      case 'errors':
        return <SuperAdminErrors errors={errors} isLoading={isLoading} />;
      case 'admin-logs':
        return <SuperAdminAudit logs={logs} isLoading={isLoading} />;
      case 'env':
        return <SuperAdminEnv />;
      case 'settings':
        return <SuperAdminSettings emails={emails} onSave={handleSaveEmails} />;
      default:
        return <SuperAdminDashboard tokensCount={tokens.length} errorsCount={errors.length} logsCount={logs.length} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: "'Poppins', 'Outfit', sans-serif"
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(91, 77, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 20px',
        boxSizing: 'border-box'
      }}>
        {/* Brand Logo matching weihu style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #5B4DFF 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Shield size={16} />
          </div>
          <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text)', fontFamily: "'Outfit', sans-serif" }}>
            super admin
          </span>
        </div>

        {/* Navigation Items with Wehiu active styling */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { id: 'tokens', label: 'Telemetry Tokens', icon: <Key size={18} /> },
            { id: 'errors', label: 'Exception Inspector', icon: <ShieldAlert size={18} /> },
            { id: 'admin-logs', label: 'Admin Activities', icon: <FileSpreadsheet size={18} /> },
            { id: 'env', label: 'ENV Config', icon: <Sliders size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  height: '46px',
                  borderRadius: '14px',
                  background: isActive ? '#F1F0FF' : 'transparent',
                  color: isActive ? '#5B4DFF' : 'var(--text-2)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  padding: '0 16px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Profile Card Footer at Bottom Left */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          borderRadius: '16px',
          background: '#F8FAFC',
          marginBottom: '16px',
          border: '1px solid rgba(91, 77, 255, 0.04)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#E0E7FF',
            color: '#5B4DFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            SA
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              Super Admin
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              system@aishwaryam.com
            </div>
          </div>
        </div>

        {/* Footer Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            height: '46px',
            borderRadius: '14px',
            background: 'transparent',
            color: '#f43f5e',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13.5px',
            padding: '0 16px',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'background 0.2s'
          }}
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '80px',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          boxSizing: 'border-box'
        }}>
          {/* Welcome and Search Bar inspired by the mockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>Welcome,</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', fontFamily: "'Outfit', sans-serif" }}>System Controller</div>
            </div>
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                placeholder="Find something..."
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '20px',
                  border: '1px solid rgba(91, 77, 255, 0.08)',
                  background: 'var(--surface)',
                  padding: '0 16px 0 16px',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'var(--text)'
                }}
              />
            </div>
          </div>

          <button
            onClick={fetchData}
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(91, 77, 255, 0.08)',
              borderRadius: '20px',
              padding: '10px 20px',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#5B4DFF',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            Refresh Telemetry
          </button>
        </header>
        <div style={{ flex: 1, padding: '0 40px 40px 40px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
