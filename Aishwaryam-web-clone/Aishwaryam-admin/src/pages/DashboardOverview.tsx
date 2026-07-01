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

interface PriceLog {
  createdAt: string;
  buyPricePaise: number;
  sellPricePaise: number;
  priceSilverPaise: number;
  isAdminOverride: boolean;
}

export const DashboardOverview: React.FC = () => {
  const { apiBase, globalReloadToken, showToast } = useAdmin();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>([]);
  const [livePrice, setLivePrice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'gold' | 'silver'>('gold');

  const loadData = async () => {
    try {
      const [kpiRes, offerRes, priceLogsRes, livePriceRes] = await Promise.all([
        fetch(`${apiBase}/api/Admin/kpis`),
        fetch(`${apiBase}/api/Offers/all-enriched`),
        fetch(`${apiBase}/api/Gold/price-logs?limit=15`),
        fetch(`${apiBase}/api/Gold/price`)
      ]);
      
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (offerRes.ok) setOffers(await offerRes.json());
      if (livePriceRes.ok) setLivePrice(await livePriceRes.json());
      if (priceLogsRes.ok) {
        const logs = await priceLogsRes.json();
        // Reverse array to render chronologically left-to-right
        setPriceLogs(Array.isArray(logs) ? [...logs].reverse() : []);
      }
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

  const renderChart = () => {
    if (priceLogs.length === 0) return null;

    const width = 1000;
    const height = 240;
    const padding = 50;

    const prices = priceLogs.map(l => {
      if (activeMetric === 'gold') {
        return l.buyPricePaise / 100;
      } else {
        // Fallback older mock priceLogs without silver prices to 99.00
        return l.priceSilverPaise > 0 ? l.priceSilverPaise / 100 : 99.00;
      }
    });

    const maxPrice = Math.max(...prices) * 1.002;
    const minPrice = Math.min(...prices) * 0.998;
    const priceRange = maxPrice - minPrice || 1;

    const getX = (index: number) => padding + (index / (priceLogs.length - 1)) * (width - padding * 2);
    const getY = (price: number) => height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);

    let pathD = '';
    let areaD = '';

    priceLogs.forEach((log, i) => {
      const val = activeMetric === 'gold' 
        ? log.buyPricePaise / 100 
        : (log.priceSilverPaise > 0 ? log.priceSilverPaise / 100 : 99.00);

      const x = getX(i);
      const y = getY(val);
      if (i === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${height - padding} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
      if (i === priceLogs.length - 1) {
        areaD += ` L ${x} ${y} L ${x} ${height - padding} Z`;
      } else if (i > 0) {
        areaD += ` L ${x} ${y}`;
      }
    });

    const colorVar = activeMetric === 'gold' ? 'var(--amber)' : 'var(--blue)';

    return (
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="card-title">{activeMetric === 'gold' ? 'Gold Rate Trend Ledger' : 'Silver Rate Trend Ledger'}</span>
            <p className="card-desc">Tracking historical rates per gram (INR) fetched from The Jewellers Association.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn btn-xs ${activeMetric === 'gold' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMetric('gold')}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Gold (22K)
            </button>
            <button 
              className={`btn btn-xs ${activeMetric === 'silver' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMetric('silver')}
              style={{ fontSize: '11px', padding: '4px 10px' }}
            >
              Silver
            </button>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '650px' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorVar} stopOpacity="0.25" />
                <stop offset="100%" stopColor={colorVar} stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const val = minPrice + ratio * priceRange;
              const y = getY(val);
              return (
                <g key={index}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-3)">
                    ₹{val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Chart Area Fill */}
            {areaD && <path d={areaD} fill="url(#chartGrad)" />}

            {/* Trend Line */}
            {pathD && <path d={pathD} fill="none" stroke={colorVar} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

            {/* Chart Dots */}
            {priceLogs.map((log, i) => {
              const val = activeMetric === 'gold' 
                ? log.buyPricePaise / 100 
                : (log.priceSilverPaise > 0 ? log.priceSilverPaise / 100 : 99.00);

              const x = getX(i);
              const y = getY(val);
              const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="var(--surface)" stroke={colorVar} strokeWidth="2" />
                  <circle cx={x} cy={y} r="12" fill={colorVar} fillOpacity="0" style={{ cursor: 'pointer' }}>
                    <title>
                      {dateStr} &#10; {activeMetric === 'gold' ? '22K Rate' : 'Silver Rate'}: ₹{val.toFixed(2)}/g
                    </title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div style={{ color: 'var(--text-2)', padding: '20px' }}>Loading operational statistics...</div>;
  }

  const activeOffers = offers.filter((o) => o.status === 'Active' || o.status === 'ACTIVE');

  return (
    <>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Platform Overview</h2>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>
            Real-time operations, pricing, and system configurations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
      <div className="grid-cols-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
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
            <span className="kpi-title">Live 22K Price</span>
            <span className="kpi-value" style={{ fontSize: '16px' }}>
              Buy: ₹{livePrice ? (livePrice.price22KPaise / 100).toFixed(2) : '0.00'}/g <br />
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Sell: ₹{livePrice ? (livePrice.sellPricePaise / 100).toFixed(2) : '0.00'}/g
              </span>
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
            <Coins size={20} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Live Silver Price</span>
            <span className="kpi-value" style={{ fontSize: '16px' }}>
              Spot: ₹{livePrice ? (livePrice.priceSilverPaise / 100).toFixed(2) : '0.00'}/g <br />
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Per Kg: ₹{livePrice ? ((livePrice.priceSilverPaise / 100) * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Gold/Silver Price History Chart */}
      {renderChart()}

      {/* Active Offers Card */}
      <div className="card" style={{ marginTop: '24px' }}>
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
