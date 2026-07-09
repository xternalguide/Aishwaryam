import React from 'react';
import { Key, ShieldAlert, FileSpreadsheet, Activity } from 'lucide-react';

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
  return (
    <div style={{ padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
        Security Operations Center
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Live system metrics, token telemetry, error logs, and administrative audit trails.
      </p>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Active Session Tokens */}
        <div 
          onClick={() => onNavigate('tokens')}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-2)' }}>TRACKED TOKENS</span>
            <div style={{ color: 'var(--blue)', background: 'var(--blue-dim)', padding: '8px', borderRadius: '10px' }}>
              <Key size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text)', margin: '0 0 4px 0' }}>
            {tokensCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Total JWT security logs tracked</span>
        </div>

        {/* API Exceptions */}
        <div 
          onClick={() => onNavigate('errors')}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-2)' }}>API EXCEPTIONS</span>
            <div style={{ color: 'var(--red)', background: 'var(--red-dim)', padding: '8px', borderRadius: '10px' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text)', margin: '0 0 4px 0' }}>
            {errorsCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Logged exceptions & failed requests</span>
        </div>

        {/* Admin Actions */}
        <div 
          onClick={() => onNavigate('admin-logs')}
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-2)' }}>ADMIN ACTIONS</span>
            <div style={{ color: 'var(--amber)', background: 'var(--amber-dim)', padding: '8px', borderRadius: '10px' }}>
              <FileSpreadsheet size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text)', margin: '0 0 4px 0' }}>
            {logsCount}
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Modifications logged by sub-admins</span>
        </div>
      </div>

      {/* Quick status information */}
      <div style={{
        background: 'var(--surface2)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          background: 'var(--green-dim)',
          color: 'var(--green)',
          padding: '12px',
          borderRadius: '50%'
        }}>
          <Activity size={24} className="pulse" />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text)', margin: '0 0 4px 0' }}>
            System Integrity Safe
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0 }}>
            API logging middleware is active. Inspect HTTP headers and requests payload on demand.
          </p>
        </div>
      </div>
    </div>
  );
};
