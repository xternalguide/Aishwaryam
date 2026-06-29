import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Users,
  Coins,
  TrendingUp,
  Download,
  AlertOctagon,
  Percent,
  Calendar
} from 'lucide-react';

interface KPIs {
  totalUsers: number;
  totalGoldGrams: number;
  activeSchemes: number;
  liveGoldPriceBuy: number;
  liveGoldPriceSell: number;
}

interface Offer {
  id: string;
  title: string;
  offerType: string;
  status: string;
  discountPercentage: number;
  expiresAt: string;
}

export const DashboardOverview: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const loadData = async () => {
    try {
      const kpiRes = await window.fetchWithCache(`${apiBase}/api/Admin/kpis`);
      const offerRes = await window.fetchWithCache(`${apiBase}/api/Offers/all-enriched`);
      
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (offerRes.ok) setOffers(await offerRes.json());
    } catch (e) {
      console.error('Failed to load dashboard KPIs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [globalReloadToken]);

  const handleDownloadReconciliation = () => {
    const today = new Date().toISOString().split('T')[0];
    window.open(`${apiBase}/api/Admin/reports/daily-reconciliation?date=${today}`, '_blank');
    showToast('Reconciliation report download started', 'success');
  };

  const handleClearData = async () => {
    const doubleCheck = window.confirm(
      'WARNING: This will reset all wallets, ledger records, transactions, schemes, and user profiles back to base test settings. Are you absolutely sure?'
    );
    if (!doubleCheck) return;

    setIsClearing(true);
    try {
      const res = await fetch(`${apiBase}/api/Admin/clear-user-data`, { method: 'POST' });
      if (res.ok) {
        showToast('All transaction and user data has been cleared successfully.', 'success');
        // Force version increment trigger
        const vRes = await fetch(`${apiBase}/api/Admin/db-version`);
        if (vRes.ok) {
          const vData = await vRes.json();
          sessionStorage.setItem('admin-db-version', String(vData.version));
        }
        loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'Failed to clear test data', 'error');
      }
    } catch (e: any) {
      showToast('Network error while resetting database: ' + e.message, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return <div style={{ color: 'var(--text-2)', padding: '20px' }}>Loading operational statistics...</div>;
  }

  const activeOffers = offers.filter((o) => o.status === 'Active' || o.status === 'ACTIVE');

  return (
    <>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Platform Overview</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Real-time operations, pricing, and system configurations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleDownloadReconciliation}>
            <Download size={16} /> Download Daily Report
          </button>
          <button
            className="btn btn-danger"
            onClick={handleClearData}
            disabled={isClearing}
            style={{ opacity: isClearing ? 0.7 : 1 }}
          >
            <AlertOctagon size={16} /> {isClearing ? 'Clearing Database...' : 'Reset Test Data'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-4">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <Users size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Registered Users</span>
            <span className="kpi-value">{kpis?.totalUsers || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <Coins size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Gold Saved</span>
            <span className="kpi-value">{(kpis?.totalGoldGrams || 0).toFixed(4)} g</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Active Schemes</span>
            <span className="kpi-value">{kpis?.activeSchemes || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
            <Coins size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Live 24K Price</span>
            <span className="kpi-value" style={{ fontSize: '16px' }}>
              Buy: ₹{(kpis?.liveGoldPriceBuy || 0).toFixed(2)}/g <br />
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Sell: ₹{(kpis?.liveGoldPriceSell || 0).toFixed(2)}/g
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Active Offers Card */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Active Events & Coupons</span>
          <span className="badge badge-green">{activeOffers.length} running</span>
        </div>
        
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Offer Type</th>
                <th>Discount/Bonus</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {activeOffers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                    No active promotional offers currently running.
                  </td>
                </tr>
              ) : (
                activeOffers.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: '600' }}>{o.title}</td>
                    <td><span className="badge badge-blue">{o.offerType}</span></td>
                    <td style={{ color: 'var(--green)', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Percent size={14} /> {o.discountPercentage}%
                      </div>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> {new Date(o.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
