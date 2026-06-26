import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { useTranslation } from '../utils/translation';
import { ApiClient } from '../utils/ApiClient';
import { Star } from 'lucide-react';

interface Slide {
  id?: string;
  title: string;
  subtitle?: string;
  body?: string;
  stat?: string;
  statLabel?: string;
  badge?: string;
  accent?: string;
  imageBase64?: string;
  iconBg?: string;
}

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWelcomeSlides = async () => {
      try {
        const res = await ApiClient.get('api/Welcome/slides');
        if (res.data && res.data.success && res.data.slides && res.data.slides.length > 0) {
          setSlides(res.data.slides);
        } else {
          // If no sliders are configured in the admin panel, skip completely
          SessionManager.markWelcomeOnboardingSeen();
          navigate('/login');
        }
      } catch (err) {
        console.warn('Failed to load dynamic welcome slides, skipping onboarding sliders view:', err);
        SessionManager.markWelcomeOnboardingSeen();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWelcomeSlides();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--gradient-brand)',
        color: 'white'
      }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

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
  const accentColor = slide.accent || 'var(--gold-warm)';

  const getSlideImage = (base64?: string) => {
    if (!base64) return '';
    if (base64.startsWith('data:')) return base64;
    return `data:image/png;base64,${base64}`;
  };

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
        {/* Top Header Row with Skip Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '16px', width: '100%' }}>
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
          {/* Animated Image/Icon Container */}
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 30px rgba(0, 0, 0, 0.3)`,
            marginBottom: '28px',
            animation: 'pulse 3s infinite alternate',
            overflow: 'hidden',
            background: slide.iconBg || 'rgba(255, 255, 255, 0.05)'
          }}>
            {slide.imageBase64 ? (
              <img
                src={getSlideImage(slide.imageBase64)}
                alt={slide.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: slide.iconBg || 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={48} color="white" fill="white" />
              </div>
            )}
          </div>

          {/* Badge */}
          {slide.badge && (
            <div style={{
              background: `${accentColor}2E`,
              border: `1px solid ${accentColor}4D`,
              padding: '6px 14px',
              borderRadius: '20px',
              marginBottom: '16px'
            }}>
              <span style={{
                color: accentColor,
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}>
                {slide.badge}
              </span>
            </div>
          )}

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
          {slide.subtitle && (
            <h3 style={{
              fontSize: '14px',
              color: accentColor,
              fontWeight: 600,
              marginBottom: '16px'
            }}>
              {slide.subtitle}
            </h3>
          )}

          {/* Body Text */}
          {slide.body && (
            <p style={{
              fontSize: '13px',
              lineHeight: '20px',
              color: 'rgba(255, 255, 255, 0.75)',
              maxWidth: '300px',
              marginBottom: '28px'
            }}>
              {slide.body}
            </p>
          )}

          {/* Stats highlight chip */}
          {slide.stat && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${accentColor}4D`,
              borderRadius: '20px',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: '900',
                color: accentColor
              }}>
                {slide.stat}
              </span>
              {slide.statLabel && (
                <span style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textAlign: 'left'
                }}>
                  {slide.statLabel}
                </span>
              )}
            </div>
          )}
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
                    background: isActive ? accentColor : 'rgba(255, 255, 255, 0.4)',
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
