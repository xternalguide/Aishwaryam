import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { ArrowLeft } from 'lucide-react';

interface AvailableScheme {
  id: string;
  planName: string;
  description: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
  keywordsJson: string;
}

export const SchemeExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<AvailableScheme[]>([]);
  const [activeNames, setActiveNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = SessionManager.getUserId() || 'user-id-999';
        // 1. Fetch available chits
        const schemesRes = await ApiClient.get('api/Scheme/list');
        if (schemesRes.data) {
          setSchemes(schemesRes.data);
        }

        // 2. Fetch active dashboards to mark already joined
        const dashRes = await ApiClient.get(`api/Scheme/dashboard/${userId}`);
        if (dashRes.data && dashRes.data.activeSchemes) {
          const names = dashRes.data.activeSchemes
            .filter((s: any) => s.status === 'ACTIVE')
            .map((s: any) => s.planName);
          setActiveNames(names);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F5F5F5' }}>
      {/* Top Bar */}
      <div style={{
        background: 'var(--gradient-brand)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(41, 0, 29, 0.15)',
        zIndex: 10
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', letterSpacing: '0.5px' }}>
          Explore Gold Schemes
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: '4px 0 0 0' }}>
          Choose a Gold Savings Plan
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          Accumulate certified metals regularly and claim bonuses upon maturity.
        </p>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--brand-mid)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {schemes.map((scheme) => {
              const joined = activeNames.includes(scheme.planName);
              const keywords: string[] = JSON.parse(scheme.keywordsJson || '[]');

              return (
                <div
                  key={scheme.id}
                  className="glass-card"
                  onClick={() => navigate(`/scheme-detail/${scheme.id}`)}
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    border: '1px solid rgba(74, 14, 78, 0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    background: 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0, flex: 1 }}>
                      {scheme.planName}
                    </h3>
                    {joined && (
                      <span style={{
                        fontSize: '9px', fontWeight: 'bold', color: 'var(--success-green)', background: 'var(--success-light)',
                        padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', margin: 0 }}>
                    {scheme.description}
                  </p>

                  {/* Highlights */}
                  {keywords.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {keywords.map((kw, idx) => (
                        <span key={idx} style={{
                          fontSize: '10px', fontWeight: '500', color: 'var(--brand-accent)', background: '#FFF0F5',
                          padding: '2px 8px', borderRadius: '8px'
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>INSTALLMENT</span>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {formatRupees(scheme.installmentAmountPaise)} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>/ month</span>
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textAlign: 'right' }}>TENURE</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', textAlign: 'right' }}>
                        {scheme.totalInstallments} Months
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
