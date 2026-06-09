import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { useTranslation } from '../utils/translation';
import { Star, Shield, Award } from 'lucide-react';

interface Slide {
  icon: React.ReactNode;
  iconBg: string;
  badge: string;
  title: string;
  subtitle: string;
  body: string;
  stat: string;
  statLabel: string;
  accent: string;
}

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [current, setCurrent] = useState(0);

  const slides: Slide[] = [
    {
      icon: <Star size={48} color="white" fill="white" />,
      iconBg: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
      badge: t('trusted_gold_platform'),
      title: t('save_for_future'),
      subtitle: t('start_with_small_steps'),
      body: t('save_for_future_body'),
      stat: '₹100',
      statLabel: t('min_starting_savings'),
      accent: 'var(--gold-warm)'
    },
    {
      icon: <Shield size={48} color="white" fill="white" />,
      iconBg: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      badge: t('secured_vault'),
      title: t('safe_and_certified'),
      subtitle: t('pure_gold_guaranteed'),
      body: t('safe_and_certified_body'),
      stat: '99.9%',
      statLabel: t('purity_guarantee'),
      accent: 'var(--success-green)'
    },
    {
      icon: <Award size={48} color="white" fill="white" />,
      iconBg: 'linear-gradient(135deg, #C2185B 0%, #4A0E4E 100%)',
      badge: t('extra_bonus_benefits'),
      title: t('loyalty_bonus_rewards'),
      subtitle: t('up_to_bonus'),
      body: t('loyalty_bonus_rewards_body'),
      stat: '7.5%',
      statLabel: t('max_loyalty_bonus'),
      accent: 'var(--brand-accent)'
    }
  ];

  const isLast = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      SessionManager.markWelcomeOnboardingSeen();
      navigate('/login');
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    SessionManager.markWelcomeOnboardingSeen();
    navigate('/login');
  };

  const slide = slides[current];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--gradient-brand)',
      boxSizing: 'border-box',
      position: 'relative',
      color: 'white',
      overflow: 'hidden'
    }}>
      <div className="responsive-form-container" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}>
        {/* Top Header Row with Language Selector & Skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', width: '100%' }}>
          {/* Language Toggle EN/தமிழ் */}
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'en' ? 'white' : 'rgba(255,255,255,0.6)' }}>EN</span>
            <button
              onClick={() => changeLanguage(lang === 'en' ? 'ta' : 'en')}
              style={{
                width: '40px', height: '20px', borderRadius: '10px',
                background: lang === 'ta' ? 'var(--gold-warm)' : 'rgba(255,255,255,0.2)',
                border: 'none', position: 'relative', cursor: 'pointer',
                transition: 'background-color 0.2s ease', padding: 0
              }}
            >
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%', background: lang === 'ta' ? '#1A1200' : 'white',
                position: 'absolute', top: '3px', left: lang === 'ta' ? '23px' : '3px',
                transition: 'left 0.2s ease'
              }} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: lang === 'ta' ? 'var(--gold-warm)' : 'rgba(255,255,255,0.6)' }}>தமிழ்</span>
          </div> */}
          {!isLast && (
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'var(--font-poppins)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {t('skip')}
            </button>
          )}
        </div>

        {/* Slide Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingTop: isLast ? '40px' : '0'
        }}>
          {/* Animated Icon Container */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: slide.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 30px rgba(0, 0, 0, 0.3)`,
            marginBottom: '28px',
            animation: 'pulse 3s infinite alternate'
          }}>
            {slide.icon}
          </div>

          {/* Badge */}
          <div style={{
            background: `${slide.accent}2E`,
            border: `1px solid ${slide.accent}4D`,
            padding: '6px 14px',
            borderRadius: '20px',
            marginBottom: '16px'
          }}>
            <span style={{
              color: slide.accent,
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              {slide.badge}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '28px',
            lineHeight: '36px',
            color: 'white',
            marginBottom: '8px'
          }}>
            {slide.title}
          </h1>

          {/* Subtitle */}
          <h3 style={{
            fontSize: '14px',
            color: slide.accent,
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            {slide.subtitle}
          </h3>

          {/* Body Text */}
          <p style={{
            fontSize: '13px',
            lineHeight: '20px',
            color: 'rgba(255, 255, 255, 0.75)',
            maxWidth: '300px',
            marginBottom: '28px'
          }}>
            {slide.body}
          </p>

          {/* Stats highlight chip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${slide.accent}4D`,
            borderRadius: '20px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '24px',
              fontWeight: '900',
              color: slide.accent
            }}>
              {slide.stat}
            </span>
            <span style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'left'
            }}>
              {slide.statLabel}
            </span>
          </div>
        </div>

        {/* Bottom Pager Indicators & CTA Button */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          paddingBottom: '32px'
        }}>
          {/* Indicators */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {slides.map((_, i) => {
              const isActive = i === current;
              return (
                <div
                  key={i}
                  style={{
                    width: isActive ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: isActive ? slide.accent : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                />
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '16px',
              background: isLast ? 'var(--gold-warm)' : 'var(--brand-accent)',
              color: isLast ? '#1A1200' : 'white',
              border: 'none',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)',
              transition: 'background-color 0.3s ease'
            }}
          >
            {isLast ? t('start_saving_gold_cta') : t('next')}
          </button>

          {/* Already have an account nudging */}
          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontFamily: 'var(--font-poppins)',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t('already_have_account_login')}
          </button>
        </div>
      </div>
    </div>
  );
};
