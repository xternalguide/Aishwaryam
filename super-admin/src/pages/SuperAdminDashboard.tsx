import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, FileSpreadsheet, Server, Database, RefreshCw } from 'lucide-react';

interface StatsProps {
  tokensCount: number;
  errorsCount: number;
  logsCount: number;
  onNavigate: (tab: string) => void;
}

export const SuperAdminDashboard: React.FC<StatsProps> = ({
  tokensCount,
  errorsCount,
  logsCount,
  onNavigate
}) => {
  const [health, setHealth] = useState<{ server: string; database: string; loading: boolean }>({
    server: 'PENDING',
    database: 'PENDING',
    loading: true
  });

  const checkHealth = async () => {
    setHealth(prev => ({ ...prev, loading: true }));
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5044';
    try {
      const res = await fetch(`${apiBase}/api/SuperAdmin/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setHealth({
          server: data.server || 'UP',
          database: data.database || 'UP',
          loading: false
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setHealth({
          server: 'UP',
          database: data.database || 'DOWN',
          loading: false
        });
      }
    } catch (err) {
      // Entire server is unreachable or timed out
      setHealth({
        server: 'DOWN',
        database: 'DOWN',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // check health every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', 'Outfit', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', fontFamily: "'Outfit', sans-serif" }}>
          Security Operations
        </h1>
        <button
          onClick={checkHealth}
          disabled={health.loading}
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(91, 77, 255, 0.08)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: '#5B4DFF'
          }}
          title="Refresh Health Status"
        >
          <RefreshCw size={16} className={health.loading ? "spin" : ""} style={{ animation: health.loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>
      <p style={{ fontSize: '13.5px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Live system metrics, token telemetry, error logs, and administrative audit trails.
      </p>

      {/* Health Monitor Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Railway Server Status Card */}
        <div style={{
          background: health.server === 'UP' ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${health.server === 'UP' ? 'rgba(4, 120, 87, 0.08)' : 'rgba(190, 24, 93, 0.08)'}`,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            background: health.server === 'UP' ? 'rgba(4, 120, 87, 0.15)' : 'rgba(190, 24, 93, 0.15)',
            color: health.server === 'UP' ? 'var(--green)' : 'var(--red)',
            padding: '12px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: health.server === 'UP' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Render Host API
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: health.server === 'UP' ? 'var(--green)' : 'var(--red)', margin: '2px 0 0 0' }}>
              {health.server === 'UP' ? 'ONLINE' : health.server === 'PENDING' ? 'CHECKING...' : 'OFFLINE / DOWN'}
            </div>
          </div>
        </div>

        {/* Supabase Database Status Card */}
        <div style={{
          background: health.database === 'UP' ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${health.database === 'UP' ? 'rgba(4, 120, 87, 0.08)' : 'rgba(190, 24, 93, 0.08)'}`,
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            background: health.database === 'UP' ? 'rgba(4, 120, 87, 0.15)' : 'rgba(190, 24, 93, 0.15)',
            color: health.database === 'UP' ? 'var(--green)' : 'var(--red)',
            padding: '12px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: health.database === 'UP' ? 'var(--green)' : 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Supabase DB
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: health.database === 'UP' ? 'var(--green)' : 'var(--red)', margin: '2px 0 0 0' }}>
              {health.database === 'UP' ? 'CONNECTED' : health.database === 'PENDING' ? 'CHECKING...' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards in Wehiu Soft Colors */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Active Session Tokens (Soft Blue Card) */}
        <div 
          onClick={() => onNavigate('tokens')}
          style={{
            background: 'var(--blue-dim)',
            border: '1px solid rgba(3, 105, 161, 0.08)',
            borderRadius: '20px',
            padding: '28px 24px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', letterSpacing: '0.5px' }}>TRACKED TOKENS</span>
            <div style={{ color: 'var(--blue)', background: 'rgba(3, 105, 161, 0.1)', padding: '8px', borderRadius: '12px' }}>
              <Key size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--blue)', margin: '0 0 4px 0', fontFamily: "'Outfit', sans-serif" }}>
            {tokensCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--blue)', opacity: 0.8 }}>Total active session logs</span>
        </div>

        {/* API Exceptions (Soft Red/Pink Card) */}
        <div 
          onClick={() => onNavigate('errors')}
          style={{
            background: 'var(--red-dim)',
            border: '1px solid rgba(190, 24, 93, 0.08)',
            borderRadius: '20px',
            padding: '28px 24px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--red)', letterSpacing: '0.5px' }}>API EXCEPTIONS</span>
            <div style={{ color: 'var(--red)', background: 'rgba(190, 24, 93, 0.1)', padding: '8px', borderRadius: '12px' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--red)', margin: '0 0 4px 0', fontFamily: "'Outfit', sans-serif" }}>
            {errorsCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--red)', opacity: 0.8 }}>Logged failed requests</span>
        </div>

        {/* Admin Actions (Soft Orange/Amber Card) */}
        <div 
          onClick={() => onNavigate('admin-logs')}
          style={{
            background: 'var(--amber-dim)',
            border: '1px solid rgba(180, 83, 9, 0.08)',
            borderRadius: '20px',
            padding: '28px 24px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--amber)', letterSpacing: '0.5px' }}>ADMIN ACTIONS</span>
            <div style={{ color: 'var(--amber)', background: 'rgba(180, 83, 9, 0.1)', padding: '8px', borderRadius: '12px' }}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--amber)', margin: '0 0 4px 0', fontFamily: "'Outfit', sans-serif" }}>
            {logsCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--amber)', opacity: 0.8 }}>Logged actions by administrators</span>
        </div>
      </div>
    </div>
  );
};
