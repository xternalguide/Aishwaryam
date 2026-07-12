import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Bell, Send, ShieldAlert, ToggleLeft, ToggleRight, RefreshCw, Smartphone } from 'lucide-react';

export const NotificationPanel: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [dailyReminders, setDailyReminders] = useState(false);
  const [priceSnapshot, setPriceSnapshot] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Broadcast state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadData = async () => {
    try {
      const [settingRes, snapshotRes] = await Promise.all([
        fetch(`${apiBase}/api/Admin/daily-notification-setting`),
        fetch(`${apiBase}/api/Gold/price`)
      ]);

      if (settingRes.ok) {
        const setObj = await settingRes.json();
        setDailyReminders(setObj.isActive);
      }

      if (snapshotRes.ok) {
        const priceData = await snapshotRes.json();
        setPriceSnapshot({
          raw24KPrice: priceData.price24KPaise / 100,
          raw22KPrice: priceData.price22KPaise / 100,
          timestamp: priceData.updatedAt
        });
      }
    } catch (e) {
      console.error('Failed to load notifications state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [globalReloadToken]);

  const handleToggleDailyReminders = async () => {
    try {
      const res = await fetch(`${apiBase}/api/Admin/daily-notification-setting/toggle`, { method: 'POST' });
      if (res.ok) {
        showToast('Daily installment reminders configuration updated', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        showToast('Failed to toggle settings', 'error');
      }
    } catch (e) {
      showToast('Network error while toggling configuration', 'error');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      showToast('Title and message body are required.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${apiBase}/api/Notification/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });

      if (res.ok) {
        showToast('FCM Notification broadcasted successfully to all users.', 'success');
        setTitle('');
        setMessage('');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
      } else {
        showToast('Failed to broadcast push notification', 'error');
      }
    } catch (e) {
      showToast('Network error while broadcasting', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>In-App Push Center</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Broadcast real-time push announcements via Firebase FCM, and control automated reminders.
          </p>
        </div>
      </div>

      <div className="grid-cols-2" style={{ alignItems: 'start' }}>
        {/* Broadcast Form */}
        <form className="card" onSubmit={handleBroadcast}>
          <div className="card-head">
            <span className="card-title">Broadcast Notification</span>
            <Send size={18} style={{ color: 'var(--accent)' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Alert Header / Title</label>
            <input
              className="form-control"
              type="text"
              placeholder="e.g. Swarna Varshini Scheme Update"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Details Body</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Type announcement message details here..."
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSending}>
            {isSending ? 'Broadcasting...' : 'Broadcast Announcement'}
          </button>
        </form>

        {/* Configurations status panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Automated setting */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Cron & Scheduled Alerts</span>
              <Smartphone size={18} style={{ color: 'var(--blue)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13.5px' }}>Daily Live Gold &amp; Silver Price Alerts</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Automatically triggers live price pushes to all user apps when the market opens (9:30 AM IST).
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={handleToggleDailyReminders}
                style={{ padding: '4px', color: dailyReminders ? 'var(--green)' : 'var(--red)' }}
              >
                {dailyReminders ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>

          {/* Pricing info */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Gold Rate Status Snapshot</span>
              <Coins size={18} style={{ color: 'var(--accent)' }} />
            </div>

            {isLoading ? (
              <div style={{ color: 'var(--text-3)', fontSize: '12.5px' }}>Loading rate snapshots...</div>
            ) : priceSnapshot ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Raw 24K Gold Price</span>
                  <span style={{ fontWeight: '700' }}>₹{priceSnapshot.raw24KPrice?.toFixed(2)}/g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Raw 22K Gold Price</span>
                  <span style={{ fontWeight: '700' }}>₹{priceSnapshot.raw22KPrice?.toFixed(2)}/g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Timestamp Update</span>
                  <span style={{ fontWeight: '700', fontSize: '11px', color: 'var(--text-3)' }}>
                    {new Date(priceSnapshot.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--red)' }}>Pricing services disconnected.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
import { Coins } from 'lucide-react';
