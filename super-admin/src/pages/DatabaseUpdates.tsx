import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Database, Calendar, User, Eye, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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

export const DatabaseUpdates: React.FC = () => {
  const { apiBase, globalReloadToken } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Log state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        fetch(`${apiBase}/api/User/all`),
        fetch(`${apiBase}/api/Audit/logs?limit=250`)
      ]);

      let usersMap: Record<string, any> = {};
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach((u: any) => {
          usersMap[u.id.toLowerCase()] = u;
        });
      }

      if (logsRes.ok) {
        const list = await logsRes.json();
        const enriched = (list || []).map((l: any) => {
          const u = l.userId ? usersMap[l.userId.toLowerCase()] : null;
          return {
            id: l.id,
            userId: l.userId,
            action: l.action || 'MUTATION',
            details: l.details || '',
            ipAddress: l.ipAddress || 'unknown',
            status: l.status || 'SUCCESS',
            createdAt: l.createdAt,
            resolvedName: u ? u.fullName : (l.userId ? 'Unknown User' : 'System Engine'),
            resolvedPhone: u ? u.phoneNumber : ''
          };
        });
        setLogs(enriched);
        setFilteredLogs(enriched);
      }
    } catch (e) {
      console.error('Failed to load database logs', e);
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
        (l.resolvedName || '').toLowerCase().includes(q) ||
        (l.ipAddress || '').includes(q);

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'SUCCESS' && l.status === 'SUCCESS') ||
        (statusFilter === 'ERROR' && l.status !== 'SUCCESS');

      const matchAction =
        actionFilter === 'All' ||
        (actionFilter === 'MUTATION' && (l.action.toUpperCase().includes('CREATE') || l.action.toUpperCase().includes('UPDATE') || l.action.toUpperCase().includes('DELETE') || l.action.toUpperCase().includes('EDIT') || l.action.toUpperCase().includes('ADD') || l.action.toUpperCase().includes('REMOVE'))) ||
        (actionFilter === 'READ' && !l.action.toUpperCase().includes('CREATE') && !l.action.toUpperCase().includes('UPDATE') && !l.action.toUpperCase().includes('DELETE'));

      return matchQuery && matchStatus && matchAction;
    });
    setFilteredLogs(filtered);
  }, [searchQuery, statusFilter, actionFilter, logs]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: '800' }}>
            <Database size={24} style={{ color: 'var(--blue)' }} /> Database Updates & Activity Ledger
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            A complete system-wide log of database insertions, updates, deletes, profile adjustments, and operations.
          </p>
        </div>
        <div>
          <button className="btn btn-outline" onClick={loadLogs} title="Refresh activity ledger">
            <RefreshCw size={14} /> Refresh Logs
          </button>
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
              placeholder="Search by action text, mutation details, IP, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Operation:</span>
              <select
                className="form-control"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="All">All Operations</option>
                <option value="MUTATION">Mutations (Add/Edit/Delete)</option>
                <option value="READ">System Reads / Logins</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="form-label" style={{ whiteSpace: 'nowrap' }}>Status:</span>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="ERROR">Exceptions & Fails</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '40px' }}>Loading activity ledger...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action / Operation</th>
                  <th>Initiated By</th>
                  <th>Status</th>
                  <th>Details Summary</th>
                  <th>IP Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px' }}>
                      No database activity logs matched the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="text-xs" style={{ whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {new Date(l.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                          {l.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} style={{ color: 'var(--text-3)' }} />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{l.resolvedName}</div>
                            {l.resolvedPhone && <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{l.resolvedPhone}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${l.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {l.status === 'SUCCESS' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                          {l.status}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-2)' }}>
                        {l.details}
                      </td>
                      <td className="text-xs" style={{ fontFamily: 'monospace', color: 'var(--text-3)' }}>
                        {l.ipAddress}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-xs" onClick={() => setSelectedLog(l)}>
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Dialog Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '560px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ borderBottom: '1px solid var(--border)', padding: '20px 24px', margin: 0 }}>
              <span className="card-title" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: 'var(--blue)' }} /> Activity Log Entry Details
              </span>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelectedLog(null)} style={{ padding: '4px', borderRadius: '50%' }}>
                <AlertCircle size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <strong style={{ color: 'var(--text-3)' }}>Log ID:</strong>
                  <div style={{ fontFamily: 'monospace', padding: '6px 12px', background: 'var(--surface2)', borderRadius: '6px', fontSize: '12px', marginTop: '4px' }}>
                    {selectedLog.id}
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-3)' }}>Operation:</strong>
                    <div style={{ fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>{selectedLog.action}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-3)' }}>Status:</strong>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${selectedLog.status === 'SUCCESS' ? 'badge-green' : 'badge-red'}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--text-3)' }}>User Initiator:</strong>
                    <div style={{ fontWeight: '600', marginTop: '2px' }}>{selectedLog.resolvedName}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-3)' }}>IP Address:</strong>
                    <div style={{ fontFamily: 'monospace', marginTop: '2px' }}>{selectedLog.ipAddress}</div>
                  </div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-3)' }}>Timestamp:</strong>
                  <div style={{ marginTop: '2px' }}>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>

                <div>
                  <strong style={{ color: 'var(--text-3)' }}>Logged Details:</strong>
                  <div style={{ whiteSpace: 'pre-wrap', padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.4', marginTop: '6px' }}>
                    {selectedLog.details || 'No additional details captured.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => setSelectedLog(null)}>Close Details</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
