import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../utils/translation';
import { useApp } from '../context/AppContext';

interface AvailableScheme {
  id: string;
  planName: string;
  description: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
  keywordsJson: string;
  durationUnit?: string;
}

export const SchemeExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { t, autoT } = useTranslation();
  const { availableSchemes, activeSchemes, refreshData } = useApp();

  const [schemes, setSchemes] = useState<AvailableScheme[]>(availableSchemes);
  const [activeNames, setActiveNames] = useState<string[]>(() =>
    activeSchemes
      .filter((s: any) => s.status?.toUpperCase() === 'ACTIVE')
      .map((s: any) => s.planName)
  );
  const [isLoading, setIsLoading] = useState(availableSchemes.length === 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (availableSchemes.length === 0) {
          setIsLoading(true);
          await refreshData(false);
        } else {
          refreshData(true); // background silent update
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [availableSchemes.length]);

  useEffect(() => {
    setSchemes(availableSchemes);
    setActiveNames(
      activeSchemes
        .filter((s: any) => s.status?.toUpperCase() === 'ACTIVE')
        .map((s: any) => s.planName)
    );
    if (availableSchemes.length > 0) {
      setIsLoading(false);
    }
  }, [availableSchemes, activeSchemes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100%', background: '#F8F9FA' }}>
      {/* Top Bar */}
      <div className="app-header-bar" style={{
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
          {t('explore_gold_schemes')}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: '4px 0 0 0' }}>
          {t('choose_savings_plan')}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {t('accumulate_metals_desc')}
        </p>

        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--brand-mid)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {schemes.map((scheme) => {
              const joined = activeNames.includes(scheme.planName);

              const isSilver = scheme.planName.toLowerCase().includes('silver');
              const bannerUrl = (scheme as any).posterImageBase64 || (isSilver ? '/silver_scheme_banner.png' : '/gold_scheme_banner.png');
              const metalTypeLabel = isSilver ? 'Digi Silver Scheme' : 'Digi Gold Scheme';

              return (
                <div
                  key={scheme.id}
                  onClick={() => navigate(`/scheme-detail/${scheme.id}`)}
                  style={{
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0px',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '180px',
                    border: '1px solid rgba(74,14,78,0.1)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }}
                >
                  <img 
                    src={bannerUrl} 
                    alt={scheme.planName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                  />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.15) 100%)', zIndex: 2 }} />
                  <div style={{ position: 'relative', zIndex: 3, height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize:'10px', fontWeight:'700', color: 'var(--gold-primary)', textTransform:'uppercase', letterSpacing:'1px' }}>
                        {metalTypeLabel}
                      </span>
                      {joined && (
                        <span style={{
                          fontSize: '9px', fontWeight: 'bold', color: 'var(--success-green)', background: 'var(--success-light)',
                          padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                          {t('active_badge')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize:'16px', fontWeight:'800', color:'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontFamily: 'var(--font-poppins)' }}>
                      {autoT(scheme.planName)}
                    </span>
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
