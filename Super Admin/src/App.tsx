import React, { useState, useEffect } from 'react';
import { SuperAdminLogin } from './pages/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminTokens } from './pages/SuperAdminTokens';
import { SuperAdminErrors } from './pages/SuperAdminErrors';
import { SuperAdminAudit } from './pages/SuperAdminAudit';
import { SuperAdminSettings } from './pages/SuperAdminSettings';
import { Shield, Key, ShieldAlert, FileSpreadsheet, Settings, LogOut, LayoutDashboard } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      fontFamily: 'Montserrat, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: 'var(--sidebar-bg)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        boxSizing: 'border-box'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <Shield size={24} color="#f8fafc" />
          <span style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.5px' }}>
            SUPER ADMIN
          </span>
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              background: activeTab === 'dashboard' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'dashboard' ? 'white' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '0 16px',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              background: activeTab === 'tokens' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'tokens' ? 'white' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '0 16px',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <Key size={18} /> Telemetry Tokens
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              background: activeTab === 'errors' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'errors' ? 'white' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '0 16px',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <ShieldAlert size={18} /> Exception Inspector
          </button>

          <button
            onClick={() => setActiveTab('admin-logs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              background: activeTab === 'admin-logs' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'admin-logs' ? 'white' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '0 16px',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <FileSpreadsheet size={18} /> Admin Activities
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              background: activeTab === 'settings' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              padding: '0 16px',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <Settings size={18} /> Settings
          </button>
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
            borderRadius: '10px',
            background: 'transparent',
            color: '#f43f5e',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            padding: '0 16px',
            textAlign: 'left',
            marginTop: 'auto'
          }}
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        <header style={{
          height: '70px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 32px'
        }}>
          <button
            onClick={fetchData}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            Refresh Telemetry
          </button>
        </header>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
