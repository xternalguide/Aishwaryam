import React from 'react';
import { Ban, CheckCircle, ShieldAlert } from 'lucide-react';

interface TokenTracker {
  id: string;
  userId: string;
  phoneNumber: string;
  fullName: string | null;
  token: string;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

interface TokensProps {
  tokens: TokenTracker[];
  onRevoke: (id: string) => void;
  isLoading: boolean;
}

export const SuperAdminTokens: React.FC<TokensProps> = ({ tokens, onRevoke, isLoading }) => {
  const getStatus = (token: TokenTracker) => {
    if (token.isRevoked) return { text: 'Revoked', color: 'var(--red)', bg: 'var(--red-dim)' };
    const expired = new Date(token.expiresAt) < new Date();
    if (expired) return { text: 'Expired', color: 'var(--amber)', bg: 'var(--amber-dim)' };
    return { text: 'Active', color: 'var(--green)', bg: 'var(--green-dim)' };
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
        Token Session Monitor
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Live view of active authentication sessions. Revoke access instantly if suspicious activity is detected.
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
            Loading token tracking statistics...
          </div>
        ) : tokens.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            No tokens tracked yet. Users must log in first to generate sessions.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>USER</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>MOBILE</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>TOKEN ID</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>ISSUED AT</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>EXPIRY</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>STATUS</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => {
                  const status = getStatus(token);
                  return (
                    <tr key={token.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' }}>
                        {token.fullName || 'Anonymous User'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                        {token.phoneNumber}
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
                        {token.id}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                        {new Date(token.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                        {new Date(token.expiresAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: status.color,
                          background: status.bg
                        }}>
                          {status.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {!token.isRevoked && (status.text === 'Active') ? (
                          <button
                            onClick={() => onRevoke(token.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--red)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}
                          >
                            <Ban size={14} /> Revoke
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
