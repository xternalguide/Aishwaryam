import React from 'react';

interface AdminAuditLog {
  id: string;
  adminEmail: string;
  actionType: string;
  targetEntityId: string | null;
  notes: string;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditProps {
  logs: AdminAuditLog[];
  isLoading: boolean;
}

export const SuperAdminAudit: React.FC<AuditProps> = ({ logs, isLoading }) => {
  return (
    <div style={{ padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
        Admin Activities
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Audit trail tracking all modifications, scheme alterations, and actions completed by standard admin accounts.
      </p>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            Loading administrative audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            No admin actions logged yet. Standard admins have not performed write actions.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>ADMIN EMAIL</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>ACTION</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>IP ADDRESS</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>PAYLOAD / NOTES</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' }}>
                      {log.adminEmail}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text)' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'var(--text)',
                        background: 'var(--surface3)',
                        border: '1px solid var(--border)'
                      }}>
                        {log.actionType}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                      {log.ipAddress || 'unknown'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-2)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.notes || 'No details provided.'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
