import React, { useState, useEffect } from 'react';
import { SetupGuide } from './SetupGuide';
import { DatabaseViewer } from './DatabaseViewer';
import { LogsViewer } from './LogsViewer';
import { AuditLogger } from '../../utils/auditLogger';
import type { AuditLog } from '../../utils/auditLogger';
import { 
  BarChart2, 
  Database, 
  BookOpen, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Users, 
  Server, 
  ArrowLeft 
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'logs' | 'database' | 'setup'>('dashboard');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [liveActivities, setLiveActivities] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Audit Logger Initialization
    const initialLogs = AuditLogger.getLogs();
    setLogs(initialLogs);
    setLiveActivities(initialLogs.slice(0, 10));

    const handleLogAdded = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLog>;
      if (customEvent.detail) {
        setLogs(prev => [customEvent.detail, ...prev]);
        setLiveActivities(prev => [customEvent.detail, ...prev.slice(0, 9)]);
      }
    };

    window.addEventListener('audit_log_added', handleLogAdded);
    return () => window.removeEventListener('audit_log_added', handleLogAdded);
  }, []);

  const handleGoBack = () => {
    window.location.hash = '#/dashboard';
  };

  // Calculations for stats
  const totalLogs = logs.length;
  const uniqueDevices = new Set(logs.map(l => l.deviceId)).size || 1;
  const uniqueSessions = new Set(logs.map(l => l.sessionId)).size || 1;
  const errorCount = logs.filter(l => l.type === 'Error').length;
  const errorRate = totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(1) : '0.0';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--surface-light)',
      fontFamily: 'var(--font-poppins)',
      overflow: 'hidden'
    }}>
      {/* 1. Left Sidebar Navigation */}
      <div style={{
        width: '260px',
        background: 'var(--gradient-brand)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button 
            onClick={handleGoBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--gold-primary)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12.5px',
              padding: '0'
            }}
          >
            <ArrowLeft size={16} />
            <span>Exit Admin</span>
          </button>
          <div>
            <h2 style={{ fontSize: '18px', color: 'white', fontWeight: 'bold', margin: 0 }}>Super Admin</h2>
            <span style={{ fontSize: '11px', color: 'var(--gold-primary)', fontWeight: '600', letterSpacing: '1px' }}>AISHWARYAM SYSTEMS</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <div style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 'bold',
              backgroundColor: activeView === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'dashboard' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('logs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 'bold',
              backgroundColor: activeView === 'logs' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'logs' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <Activity size={18} />
            <span>Logs &amp; Tracking</span>
          </button>

          <button
            onClick={() => setActiveView('database')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 'bold',
              backgroundColor: activeView === 'database' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'database' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <Database size={18} />
            <span>Database Viewer</span>
          </button>

          <button
            onClick={() => setActiveView('setup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 'bold',
              backgroundColor: activeView === 'setup' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'setup' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <BookOpen size={18} />
            <span>Setup Guide</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center'
        }}>
          v1.0.0 Stable Build
        </div>
      </div>

      {/* 2. Main Page Content Window */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Content Header */}
        <div style={{
          height: '70px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <h1 style={{ fontSize: '20px', textTransform: 'capitalize', color: 'var(--brand-deep)' }}>
            {activeView === 'setup' ? 'A to Z Setup Guide' : activeView === 'database' ? 'Database Manager' : activeView}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-green)',
              animation: 'pulse 1.5s infinite'
            }}></span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Systems Online</span>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          {activeView === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stats Counters Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(74,14,78,0.06)', color: 'var(--brand-dark)' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unique Devices</span>
                    <h3 style={{ fontSize: '20px', margin: '4px 0 0 0' }}>{uniqueDevices}</h3>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,215,0,0.1)', color: 'var(--gold-deep)' }}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active Sessions</span>
                    <h3 style={{ fontSize: '20px', margin: '4px 0 0 0' }}>{uniqueSessions}</h3>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.06)', color: 'var(--success-green)' }}>
                    <Server size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Activity Logs</span>
                    <h3 style={{ fontSize: '20px', margin: '4px 0 0 0' }}>{totalLogs}</h3>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.06)', color: 'var(--error-red)' }}>
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Failure / Crash Rate</span>
                    <h3 style={{ fontSize: '20px', margin: '4px 0 0 0' }}>{errorRate}%</h3>
                  </div>
                </div>
              </div>

              {/* Live Activity & Features Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
                {/* Live Activity Feed */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-light)',
                  height: '420px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--brand-deep)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--success-green)', borderRadius: '50%', display: 'inline-block' }}></span>
                    <span>Live Telemetry Activity Monitor</span>
                  </h4>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {liveActivities.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                        Waiting for user interactions to track...
                      </div>
                    ) : (
                      liveActivities.map((act) => (
                        <div key={act.id} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          border: '1px solid #F1F5F9'
                        }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: act.type === 'Click' ? 'var(--gold-soft)' : act.type === 'View' ? 'var(--success-light)' : '#E2E8F0',
                            color: act.type === 'Click' ? 'var(--gold-deep)' : act.type === 'View' ? 'var(--success-green)' : 'var(--text-secondary)'
                          }}>
                            {act.type}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{act.description}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Screen: <span style={{ fontWeight: 'bold' }}>{act.screenName}</span> • Session: <span style={{ fontFamily: 'monospace' }}>{act.sessionId}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                            {new Date(act.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Developer shortcuts */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-light)',
                  height: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--brand-deep)', margin: 0 }}>System Operations</h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Use the controls below to trigger simulated logs and test dashboard observability states.
                  </p>
                  
                  <button
                    onClick={() => AuditLogger.log('Click', 'Home', 'Clicked Buy Gold shortcut banner')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--brand-glow)',
                      backgroundColor: 'var(--brand-glow)',
                      color: 'var(--brand-dark)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Simulate Clicks Action
                  </button>

                  <button
                    onClick={() => AuditLogger.log('View', 'Profile', 'Navigated to user security profile')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--gold-glow)',
                      backgroundColor: 'var(--gold-soft)',
                      color: 'var(--gold-deep)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Simulate Page Navigation View
                  </button>

                  <button
                    onClick={() => AuditLogger.logError(new Error('Timeout connecting to Razorpay host API gateway'), 'Payment')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--error-light)',
                      backgroundColor: 'var(--error-light)',
                      color: 'var(--error-red)',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Simulate API System Failure Error
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === 'logs' && <LogsViewer />}
          {activeView === 'database' && <DatabaseViewer />}
          {activeView === 'setup' && <SetupGuide />}
        </div>
      </div>
    </div>
  );
};
