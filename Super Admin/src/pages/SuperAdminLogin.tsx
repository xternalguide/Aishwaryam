import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (apiKey: string) => void;
}

export const SuperAdminLogin: React.FC<LoginProps> = ({ onLogin }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('API Access Key is required.');
      return;
    }
    onLogin(key.trim());
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: 'Montserrat, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'var(--accent-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: 'var(--text)'
        }}>
          <Shield size={32} />
        </div>

        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: 'var(--text)',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Super Admin Console
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-2)',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '18px'
        }}>
          Authenticate using your secure master API access credential.
        </p>

        {error && (
          <div style={{
            width: '100%',
            background: 'var(--red-dim)',
            color: 'var(--red)',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-2)',
              marginBottom: '8px'
            }}>
              API ACCESS KEY
            </label>
            <input
              type="password"
              placeholder="Enter X-Super-Admin-Key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0 16px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'var(--accent-glow)'
            }}
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
