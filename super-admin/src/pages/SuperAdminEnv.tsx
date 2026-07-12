import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';

interface EnvItem {
  key: string;
  value: string;
}

export const SuperAdminEnv: React.FC = () => {
  const [items, setItems] = useState<EnvItem[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const apiKey = sessionStorage.getItem('super_admin_key') || '';
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5044';

  const fetchEnv = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/SuperAdmin/env`, {
        headers: { 'X-Super-Admin-Key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to fetch environment variables.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while contacting backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnv();
  }, []);

  const handleValueChange = (key: string, val: string) => {
    setItems(prev => prev.map(item => item.key === key ? { ...item, value: val } : item));
    setSuccessMsg(null);
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    
    if (items.some(item => item.key === formattedKey)) {
      alert(`Variable "${formattedKey}" already exists.`);
      return;
    }

    setItems(prev => [...prev, { key: formattedKey, value: newValue }]);
    setNewKey('');
    setNewValue('');
    setSuccessMsg(null);
  };

  const handleDelete = (keyToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${keyToDelete}"?`)) {
      setItems(prev => prev.filter(item => item.key !== keyToDelete));
      setSuccessMsg(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiBase}/api/SuperAdmin/env`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Super-Admin-Key': apiKey
        },
        body: JSON.stringify(items)
      });

      if (res.ok) {
        setSuccessMsg('Environment variables updated and applied successfully!');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to save environment variables.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ fontFamily: "'Poppins', 'Outfit', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', fontFamily: "'Outfit', sans-serif" }}>
            Environment Configurations
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-2)', margin: '4px 0 0 0' }}>
            Manage database connection strings, API keys, and server environment variables (.env).
          </p>
        </div>

        <button
          onClick={fetchEnv}
          disabled={isLoading}
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(91, 77, 255, 0.08)',
            borderRadius: '20px',
            padding: '10px 20px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#5B4DFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <RefreshCw size={14} className={isLoading ? "spin" : ""} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          Reload File
        </button>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-dim)',
          border: '1px solid rgba(190, 24, 93, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          color: 'var(--red)',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: 'var(--green-dim)',
          border: '1px solid rgba(4, 120, 87, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          color: 'var(--green)',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          {successMsg}
        </div>
      )}

      <div style={{
        background: 'var(--surface)',
        borderRadius: '24px',
        border: '1px solid rgba(91, 77, 255, 0.08)',
        boxShadow: 'var(--shadow)',
        padding: '32px',
        marginBottom: '32px'
      }}>
        {/* Table Head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 2fr 100px',
          paddingBottom: '12px',
          borderBottom: '2px solid rgba(91, 77, 255, 0.08)',
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--text-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <div>Key / Variable</div>
          <div>Value</div>
          <div style={{ textAlign: 'center' }}>Actions</div>
        </div>

        {/* Loading placeholder */}
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            Loading .env variables from server...
          </div>
        )}

        {/* Empty placeholder */}
        {!isLoading && items.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-2)' }}>
            No environment variables found in .env.
          </div>
        )}

        {/* Variables List */}
        {!isLoading && items.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 2fr 100px',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
              fontSize: '13.5px'
            }}
          >
            <div style={{ fontWeight: '600', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={14} color="#5B4DFF" style={{ opacity: 0.7 }} />
              {item.key}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px' }}>
              <input
                type={showValues[item.key] ? "text" : "password"}
                value={item.value}
                onChange={(e) => handleValueChange(item.key, e.target.value)}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(91, 77, 255, 0.08)',
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  padding: '0 12px',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: showValues[item.key] ? 'inherit' : 'monospace'
                }}
              />
              <button
                onClick={() => toggleShowValue(item.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showValues[item.key] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => handleDelete(item.key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Delete variable"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Variable & Actions Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Add Form */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid rgba(91, 77, 255, 0.08)',
          boxShadow: 'var(--shadow)',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
            Add New Variable
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input
              type="text"
              placeholder="VARIABLE_KEY (e.g. JWT_SECRET)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              style={{
                flex: 1,
                height: '42px',
                borderRadius: '12px',
                border: '1px solid rgba(91, 77, 255, 0.08)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0 16px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Variable Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              style={{
                flex: 1.5,
                height: '42px',
                borderRadius: '12px',
                border: '1px solid rgba(91, 77, 255, 0.08)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                padding: '0 16px',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: '#5B4DFF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0 20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Action Panel */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid rgba(91, 77, 255, 0.08)',
          boxShadow: 'var(--shadow)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', fontFamily: "'Outfit', sans-serif" }}>
            Save Changes
          </h3>
          <p style={{ fontSize: '11.5px', color: 'var(--text-2)', margin: 0, lineHeight: '16px' }}>
            Saving configuration will overwrite your local `.env` file and dynamically update backend memory context instantly.
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            style={{
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #5B4DFF 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(91, 77, 255, 0.2)',
              marginTop: '8px'
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Apply & Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
};
