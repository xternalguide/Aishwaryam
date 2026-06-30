import React, { useState, useEffect } from 'react';
import { SetupGuide } from './SetupGuide';
import { DatabaseViewer } from './DatabaseViewer';
import { LogsViewer } from './LogsViewer';
import { AdminOffersManager } from './AdminOffersManager';
import { AuditLogger } from '../../utils/auditLogger';
import type { AuditLog } from '../../utils/auditLogger';
import { ApiClient } from '../../utils/ApiClient';
import { 
  BarChart2, 
  Database, 
  BookOpen, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Users, 
  Server, 
  ArrowLeft,
  ShieldCheck,
  FileText,
  Check,
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  Tag
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'logs' | 'database' | 'setup' | 'kyc' | 'offers'>('dashboard');
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

          <button
            onClick={() => setActiveView('kyc')}
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
              backgroundColor: activeView === 'kyc' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'kyc' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <ShieldCheck size={18} />
            <span>KYC Verification</span>
          </button>

          <button
            onClick={() => setActiveView('offers')}
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
              backgroundColor: activeView === 'offers' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeView === 'offers' ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <Tag size={18} />
            <span>Promotional Offers</span>
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
            {activeView === 'setup' ? 'A to Z Setup Guide' : activeView === 'database' ? 'Database Manager' : activeView === 'kyc' ? 'KYC Verification Portal' : activeView}
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
          {activeView === 'kyc' && <KycVerificationPortal />}
          {activeView === 'offers' && <AdminOffersManager />}
        </div>
      </div>
    </div>
  );
};

const KycVerificationPortal: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);

  const fetchKycUsers = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.get('api/Kyc/admin/pending');
      if (res.data && res.data.success) {
        setUsers(res.data.users || []);
        // Maintain selection
        if (selectedUser) {
          const updatedSelected = res.data.users.find((u: any) => u.userId === selectedUser.userId);
          if (updatedSelected) {
            setSelectedUser(updatedSelected);
          }
        } else if (res.data.users.length > 0) {
          setSelectedUser(res.data.users[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycUsers();
    window.addEventListener('storage', fetchKycUsers);
    return () => window.removeEventListener('storage', fetchKycUsers);
  }, []);

  const handleVerify = async (userId: string, documentId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const res = await ApiClient.post('api/Kyc/admin/verify', {
        userId,
        documentId,
        status,
        rejectedReason: reason
      });
      if (res.data && res.data.success) {
        AuditLogger.log('Click', 'SuperAdmin', `Admin ${status} KYC Document ID ${documentId} for User ${userId}`);
        setRejectingDocId(null);
        setRejectReason('');
        
        // Fetch updated users and update the selected user view
        const updatedRes = await ApiClient.get('api/Kyc/admin/pending');
        if (updatedRes.data && updatedRes.data.success) {
          setUsers(updatedRes.data.users || []);
          const updatedUser = updatedRes.data.users.find((u: any) => u.userId === userId);
          if (updatedUser) {
            setSelectedUser(updatedUser);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update verification status.');
    }
  };

  const documents = selectedUser?.documents || [];
  const pendingDocs = documents.filter((d: any) => d.status === 'PENDING');
  const rejectedDocs = documents.filter((d: any) => d.status === 'REJECTED');
  const approvedDocs = documents.filter((d: any) => d.status === 'APPROVED');

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
      {/* Users List Sidebar */}
      <div style={{
        width: '300px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--brand-deep)', margin: 0, fontWeight: 'bold' }}>KYC Submissions</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select a user to review documents</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading && users.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
          ) : users.map((u) => {
            const isSelected = selectedUser?.userId === u.userId;
            const userPendingCount = u.documents?.filter((d: any) => d.status === 'PENDING').length || 0;
            return (
              <div
                key={u.userId}
                onClick={() => setSelectedUser(u)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--brand-dark)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--brand-glow)' : '#F8FAFC',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{u.fullName}</span>
                  {userPendingCount > 0 && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: 'var(--warning-amber)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      {userPendingCount} pending
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Phone: +91 {u.phoneNumber}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Level: {u.kycLevel}
                  </span>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: u.kycLevel === 'FULL' ? 'var(--success-green)' : u.kycLevel === 'REJECTED' ? 'var(--error-red)' : 'var(--warning-amber)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Portal */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '24px'
      }}>
        {selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
            {/* User Overview Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-deep)', fontWeight: 'bold' }}>{selectedUser.fullName}</h2>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  User ID: <span style={{ fontFamily: 'monospace' }}>{selectedUser.userId}</span> | Phone: +91 {selectedUser.phoneNumber}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Overall Status:</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backgroundColor: selectedUser.kycLevel === 'FULL' ? 'var(--success-light)' : selectedUser.kycLevel === 'REJECTED' ? 'var(--error-light)' : 'var(--warning-light)',
                  color: selectedUser.kycLevel === 'FULL' ? 'var(--success-green)' : selectedUser.kycLevel === 'REJECTED' ? 'var(--error-red)' : 'var(--warning-amber)',
                  border: `1px solid ${selectedUser.kycLevel === 'FULL' ? 'var(--success-green)' : selectedUser.kycLevel === 'REJECTED' ? 'var(--error-red)' : 'var(--warning-amber)'}`
                }}>
                  {selectedUser.kycLevel}
                </span>
              </div>
            </div>

            {/* Split Screen Document Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
              {/* LEFT: Waiting for Verification Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
                <h3 style={{ fontSize: '14.5px', color: 'var(--brand-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid var(--warning-amber)', paddingBottom: '8px' }}>
                  <Clock size={16} color="var(--warning-amber)" />
                  <span>Waiting for Verification ({pendingDocs.length})</span>
                </h3>

                {pendingDocs.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                    <ShieldCheck size={28} style={{ color: 'var(--success-green)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>No Documents Pending Verification</div>
                    <div style={{ fontSize: '11px' }}>All submitted documents for this user have been processed.</div>
                  </div>
                ) : (
                  pendingDocs.map((doc: any) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(74,14,78,0.06)',
                            color: 'var(--brand-dark)'
                          }}>
                            {doc.documentType === 'PAN' ? 'PAN Card' : doc.documentType === 'AADHAAR_FRONT' ? 'Aadhaar Card (Front)' : 'Aadhaar Card (Back)'}
                          </span>
                          <div style={{ fontSize: '13.5px', fontWeight: 'bold', marginTop: '6px', color: 'var(--text-primary)' }}>
                            No: {doc.documentNumber}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <Calendar size={12} />
                          {new Date(doc.submittedAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Image Preview Container */}
                      <div
                        onClick={() => setShowImagePreview(doc.documentUrl)}
                        style={{
                          height: '140px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#F8FAFC',
                          position: 'relative',
                          cursor: 'zoom-in',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {doc.documentUrl.startsWith('data:image') || doc.documentUrl.startsWith('http') ? (
                          <img src={doc.documentUrl} alt="KYC Doc" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <FileText size={24} />
                            <span>Click to view document file</span>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(15,23,42,0.7)',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Eye size={12} />
                          <span>Preview</span>
                        </div>
                      </div>

                      {/* Reject Form / Button Panel */}
                      {rejectingDocId === doc.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--error-red)' }}>Reason for Rejection:</span>
                          <textarea
                            placeholder="e.g. Blurry photo, incorrect name matching, invalid details..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            style={{
                              width: '100%',
                              height: '56px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239,68,68,0.3)',
                              fontSize: '12.5px',
                              outline: 'none',
                              resize: 'none'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setRejectingDocId(null); setRejectReason(''); }}
                              style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: 'white', fontSize: '11.5px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleVerify(selectedUser.userId, doc.id, 'REJECTED', rejectReason)}
                              disabled={!rejectReason.trim()}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: 'var(--error-red)',
                                color: 'white',
                                fontSize: '11.5px',
                                fontWeight: 'bold',
                                cursor: !rejectReason.trim() ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleVerify(selectedUser.userId, doc.id, 'APPROVED')}
                            style={{
                              flex: 1,
                              height: '36px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'var(--success-green)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectingDocId(doc.id)}
                            style={{
                              flex: 1,
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid var(--error-red)',
                              backgroundColor: 'transparent',
                              color: 'var(--error-red)',
                              fontWeight: 'bold',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <X size={14} />
                            <span>Reject Document</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT: Rejected & History Tab (Accounting Log) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                {/* Rejected History Card */}
                <div>
                  <h3 style={{ fontSize: '14.5px', color: 'var(--brand-deep)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid var(--error-red)', paddingBottom: '8px' }}>
                    <AlertTriangle size={16} color="var(--error-red)" />
                    <span>Rejected Documents (Accounting Tab)</span>
                  </h3>
                  
                  {rejectedDocs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed #E2E8F0', borderRadius: '12px', fontSize: '12px' }}>
                      No previously rejected documents found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {rejectedDocs.map((doc: any) => (
                        <div
                          key={doc.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(239, 68, 68, 0.03)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                              {doc.documentType === 'PAN' ? 'PAN Card' : doc.documentType === 'AADHAAR_FRONT' ? 'Aadhaar (Front)' : 'Aadhaar (Back)'}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              No: {doc.documentNumber}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--error-red)', fontWeight: '500', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <strong>Reason:</strong> <span>{doc.rejectedReason}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>Uploaded: {new Date(doc.submittedAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => setShowImagePreview(doc.documentUrl)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', cursor: 'pointer', fontWeight: 'bold', fontSize: '10.5px', padding: 0 }}
                            >
                              View Rejected File
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved History Card */}
                <div style={{ marginTop: '12px' }}>
                  <h3 style={{ fontSize: '14.5px', color: 'var(--brand-deep)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid var(--success-green)', paddingBottom: '8px' }}>
                    <ShieldCheck size={16} color="var(--success-green)" />
                    <span>Approved Documents ({approvedDocs.length})</span>
                  </h3>
                  
                  {approvedDocs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed #E2E8F0', borderRadius: '12px', fontSize: '12px' }}>
                      No approved documents yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {approvedDocs.map((doc: any) => (
                        <div
                          key={doc.id}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.03)',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
                              {doc.documentType === 'PAN' ? 'PAN Card' : doc.documentType === 'AADHAAR_FRONT' ? 'Aadhaar (Front)' : 'Aadhaar (Back)'}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              No: {doc.documentNumber}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowImagePreview(doc.documentUrl)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                          >
                            View File
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Clock size={40} style={{ color: 'var(--brand-mid)', marginBottom: '12px' }} />
            <span>Select a user from the sidebar to review KYC documents</span>
          </div>
        )}
      </div>

      {/* Large Image Preview Lightbox Modal */}
      {showImagePreview && (
        <div
          onClick={() => setShowImagePreview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '40px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            {showImagePreview.startsWith('data:image') || showImagePreview.startsWith('http') ? (
              <img src={showImagePreview} alt="Zoomed KYC" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            ) : (
              <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--brand-mid)', marginBottom: '16px' }} />
                <h3>Document File URL</h3>
                <p style={{ wordBreak: 'break-all', fontSize: '13px' }}>{showImagePreview}</p>
              </div>
            )}
            <button
              onClick={() => setShowImagePreview(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
