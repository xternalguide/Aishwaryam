import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Terminal, Calendar, User, Eye, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress: string;
  status: string;
  createdAt: string;
  resolvedName?: string;
  resolvedPhone?: string;
}

export const AuditLogs: React.FC = () => {
  const { apiBase, globalReloadToken } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        window.fetchWithCache(`${apiBase}/api/User/all`),
        window.fetchWithCache(`${apiBase}/api/Audit/logs?limit=100`)
      ]);

      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const list = Array.isArray(logsData) ? logsData : [];
        const enriched = list.map((l: any) => {
          const u = l.userId ? usersMap[l.userId.toLowerCase()] : null;
          return {
            ...l,
            resolvedName: u ? u.fullName : (l.userId || 'System'),
            resolvedPhone: u ? u.phoneNumber : ''
          };
        });
        setLogs(enriched);
        setFilteredLogs(enriched);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [globalReloadToken]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = logs.filter((l) => {
      const matchQuery =
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.resolvedName || '').toLowerCase().includes(q);

      const matchSource =
        sourceFilter === 'All' ||
        (sourceFilter === 'User' && l.userId) ||
        (sourceFilter === 'System' && !l.userId);

      return matchQuery && matchSource;
    });
    setFilteredLogs(filtered);
  }, [searchQuery, sourceFilter, logs]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Platform Audit Trail</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Browse transaction events, API error traces, KYC overrides, and administrative audit logs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-3)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px', width: '100%' }}
              placeholder="Search by action keyword, details description, or user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Log Source:</span>
            <select
              className="form-control"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="All">All Operations</option>
              <option value="User">User Action</option>
              <option value="System">System/Cron</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Security & System Events</span>
          <span className="badge badge-amber">Enforced Audit Enabled</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '20px' }}>Loading audit trails...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event Source</th>
                  <th>Action type</th>
                  <th>Log Details</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      No audit events logged matching the search rules.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {l.userId ? <User size={14} style={{ color: 'var(--blue)' }} /> : <Terminal size={14} style={{ color: 'var(--text-3)' }} />}
                          <span style={{ fontWeight: '600' }}>{l.resolvedName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-2)', maxWidth: '400px', wordBreak: 'break-word' }}>
                        {l.details}
                      </td>
                      <td className="text-xs" style={{ fontFamily: 'monospace' }}>{l.ipAddress || '127.0.0.1'}</td>
                      <td>
                        <span className={`badge ${l.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} /> {new Date(l.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
