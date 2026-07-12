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
      fontFamily: "'Poppins', 'Outfit', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px -15px rgba(91, 77, 255, 0.08)',
        padding: '48px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Wehiu style purple brand logo icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #5B4DFF 0%, #7C3AED 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          color: '#ffffff',
          boxShadow: '0 8px 20px rgba(91, 77, 255, 0.3)'
        }}>
          <Shield size={28} />
        </div>

        <h1 style={{
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--text)',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif"
        }}>
          super admin
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-2)',
          marginBottom: '32px',
          textAlign: 'center',
          lineHeight: '18px'
        }}>
          Securely log in to manage your system settings and integrations.
        </p>

        {error && (
          <div style={{
            width: '100%',
            background: 'var(--red-dim)',
            color: 'var(--red)',
            fontSize: '12.5px',
            fontWeight: '600',
            padding: '12px 16px',
            borderRadius: '14px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-2)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              API ACCESS KEY
            </label>
            <input
              type="password"
              placeholder="Enter access token..."
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0 16px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #5B4DFF 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(91, 77, 255, 0.2)',
              fontFamily: 'inherit',
              transition: 'transform 0.1s ease'
            }}
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
