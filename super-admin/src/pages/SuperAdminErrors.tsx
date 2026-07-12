import React, { useState } from 'react';
import { Eye, ShieldAlert, X } from 'lucide-react';

interface ApiErrorLog {
  id: string;
  requestPath: string;
  method: string;
  headers: string;
  requestPayload: string | null;
  responsePayload: string | null;
  clientIp: string;
  errorMessage: string;
  stackTrace: string | null;
  createdAt: string;
}

interface ErrorsProps {
  errors: ApiErrorLog[];
  isLoading: boolean;
}

export const SuperAdminErrors: React.FC<ErrorsProps> = ({ errors, isLoading }) => {
  const [selectedError, setSelectedError] = useState<ApiErrorLog | null>(null);

  const getPrettifiedHeaders = (headersStr: string) => {
    try {
      const parsed = JSON.parse(headersStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return headersStr;
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
        Exception & Threat Inspector
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Real-time API error tracking. Examine client request payloads, header templates, and host IPs to detect penetration attempts.
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
            Loading API error logs...
          </div>
        ) : errors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            No API errors logged. The firewall and API are operating smoothly.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>METHOD</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>PATH</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>CLIENT IP</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>ERROR MESSAGE</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>TIMESTAMP</th>
                  <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-2)' }}>INSPECT</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err) => (
                  <tr key={err.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: err.method === 'GET' ? 'var(--blue)' : 'var(--amber)',
                        background: err.method === 'GET' ? 'var(--blue-dim)' : 'var(--amber-dim)'
                      }}>
                        {err.method}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text)' }}>
                      {err.requestPath}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                      {err.clientIp}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '13px',
                      color: 'var(--red)',
                      maxWidth: '300px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {err.errorMessage}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                      {new Date(err.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => setSelectedError(err)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert color="var(--red)" size={20} />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>
                  Inspect API Error Payload
                </h3>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Request Route</h5>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>
                    {selectedError.method} {selectedError.requestPath}
                  </p>
                </div>
                <div>
                  <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Client IP</h5>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text)', margin: 0 }}>
                    {selectedError.clientIp}
                  </p>
                </div>
              </div>

              <div>
                <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>HTTP Headers</h5>
                <pre style={{
                  background: 'var(--surface3)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--text)',
                  overflowX: 'auto',
                  margin: 0
                }}>{getPrettifiedHeaders(selectedError.headers)}</pre>
              </div>

              <div>
                <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Request Body</h5>
                <pre style={{
                  background: 'var(--surface3)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--text)',
                  overflowX: 'auto',
                  margin: 0
                }}>{selectedError.requestPayload || 'No request payload sent.'}</pre>
              </div>

              <div>
                <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Response Payload</h5>
                <pre style={{
                  background: 'var(--surface3)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--text)',
                  overflowX: 'auto',
                  margin: 0
                }}>{selectedError.responsePayload || 'No response payload.'}</pre>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <h5 style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Exception Stack Trace</h5>
                  <pre style={{
                    background: 'var(--surface3)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--red)',
                    overflowX: 'auto',
                    margin: 0
                  }}>{selectedError.stackTrace}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
