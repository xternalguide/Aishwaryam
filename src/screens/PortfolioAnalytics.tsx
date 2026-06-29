import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';

export const PortfolioAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { portfolio } = useApp();
  
  const [goldBalanceMg, setGoldBalanceMg] = useState(19800);
  const [investedAmountPaise, setInvestedAmountPaise] = useState(1500000);
  const [currentValuePaise, setCurrentValuePaise] = useState(1493300);
  const [returnPercentage, setReturnPercentage] = useState(-0.45);
  const [redeemableGoldMg, setRedeemableGoldMg] = useState(0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (portfolio) {
      setGoldBalanceMg(portfolio.goldBalanceMg || 0);
      setInvestedAmountPaise(portfolio.investedAmountPaise || 0);
      setCurrentValuePaise(portfolio.currentValuePaise || 0);
      setReturnPercentage(portfolio.returnPercentage || 0);
      setRedeemableGoldMg(portfolio.redeemableGoldMg || 0);

      // Populate chart history
      const monthly = portfolio.monthlyBalances || [12000, 14000, 16000, 18000, 19800];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Map to chart items
      const mapped = monthly.map((bal: number, idx: number) => ({
        month: months[idx % 12],
        weight: bal / 1000 // convert mg to grams
      }));
      setChartData(mapped);
      setIsLoading(false);
    }
  }, [portfolio]);

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  };

  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

  const totalGainPaise = currentValuePaise - investedAmountPaise;
  const isLoss = totalGainPaise < 0;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F9FA' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--brand-mid)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      {/* Top Bar */}
      <div className="app-header-bar" style={{
        background: 'white',
        borderBottom: '1px solid #ECECEC',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
          Portfolio Analytics
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Card 1: Main statistics overview */}
        <div className="glass-card" style={{
          borderRadius: '18px',
          background: 'var(--gradient-brand)',
          color: 'white',
          padding: '20px',
          boxShadow: '0 8px 16px rgba(74, 14, 78, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Current Portfolio Value
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', margin: '4px 0 0 0' }}>
              {formatRupees(currentValuePaise)}
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.08)', padding: '12px 16px', borderRadius: '12px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'block' }}>INVESTED AMOUNT</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatRupees(investedAmountPaise)}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLoss ? '#EF4444' : 'var(--success-green)' }}>
              {isLoss ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>
                  {isLoss ? '' : '+'}{returnPercentage}%
                </span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>
                  {formatRupees(Math.abs(totalGainPaise))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="glass-card" style={{ borderRadius: '18px', padding: '20px', background: 'white' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', marginBottom: '16px', marginTop: 0 }}>
            Accumulated Gold Weight Progress (Grams)
          </h3>
          
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-mid)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--brand-mid)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECEC" />
                <XAxis dataKey="month" stroke="var(--text-light)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-light)" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} g`, 'Gold Weight']} />
                <Area type="monotone" dataKey="weight" stroke="var(--brand-mid)" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Locked vs Redeemable details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', background: 'white' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TOTAL GOLD SAVED</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFB300', marginTop: '4px' }}>
              {mgToGrams(goldBalanceMg)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px', display: 'block' }}>
              Vault Locker Value
            </span>
          </div>

          <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', background: 'white' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SELLABLE / MATURED</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--success-green)', marginTop: '4px' }}>
              {mgToGrams(redeemableGoldMg)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px', display: 'block' }}>
              Available to liquidate
            </span>
          </div>
        </div>

        {/* Extra promotional highlight */}
        <div className="glass-card" style={{
          borderRadius: '16px',
          padding: '16px',
          background: 'var(--gold-soft)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Secure Digital Metal vault</span>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '16px', margin: 0 }}>
            Every purchase adds 99.9% physical gold backings securely credited under your locker in registered trust vaults.
          </p>
        </div>
      </div>
    </div>
  );
};
