import React, { useState } from 'react';
import { Plus, Trash2, Mail } from 'lucide-react';

interface SettingsProps {
  emails: string[];
  onSave: (emails: string[]) => void;
}

export const SuperAdminSettings: React.FC<SettingsProps> = ({ emails, onSave }) => {
  const [list, setList] = useState<string[]>(emails);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (list.includes(newEmail.trim())) {
      setError('Email address is already in the list.');
      return;
    }
    setList([...list, newEmail.trim()]);
    setNewEmail('');
    setError(null);
  };

  const handleRemove = (index: number) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
  };

  const handleSave = () => {
    if (list.length === 0) {
      setError('At least one notification email is required.');
      return;
    }
    onSave(list);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
        Operational Settings
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '32px' }}>
        Configure operational configurations, security rules, and alert notification dispatchers.
      </p>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        padding: '32px',
        maxWidth: '600px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} /> API Exception Email Alerts
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '24px', lineHeight: '18px' }}>
          Configure recipient email addresses that will receive the daily aggregated security report detailing unhandled exceptions and threat assessments.
        </p>

        {error && (
          <div style={{
            background: 'var(--red-dim)',
            color: 'var(--red)',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Input box */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="email"
            placeholder="Add new notification email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setError(null);
            }}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text)',
              padding: '0 16px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              height: '46px',
              width: '46px',
              borderRadius: '12px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Email list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          {list.map((email, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 'bold' }}>
                {email}
              </span>
              <button
                onClick={() => handleRemove(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            padding: '0 32px',
            cursor: 'pointer',
            boxShadow: 'var(--accent-glow)'
          }}
        >
          Save Configurations
        </button>
      </div>
    </div>
  );
};
