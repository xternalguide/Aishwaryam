import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, showToast } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('All fields are required', 'error');
      return;
    }
    setIsLoading(true);
    // Mimic the backend admin login check or static login checks
    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase() === 'blazewingwebs@gmail.com' && password === 'aishwaryam2026') {
        login();
      } else if (email.toLowerCase() === 'admin@aishwaryam.com' && password === 'admin123') {
        login();
      } else {
        showToast('Invalid credentials provided.', 'error');
      }
    }, 800);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '20px'
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '420px', gap: '20px', padding: '40px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px' }}>Aishwaryam Enterprise Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-3)' }} />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="admin@aishwaryam.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-3)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
