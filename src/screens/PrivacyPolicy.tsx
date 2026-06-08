import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const [isAccepted, setIsAccepted] = useState(() => {
    return localStorage.getItem('PRIVACY_POLICY_ACCEPTED') === 'true';
  });

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handleAccept = () => {
    localStorage.setItem('PRIVACY_POLICY_ACCEPTED', 'true');
    setIsAccepted(true);
    alert('Thank you for accepting our Privacy Policy.');
    handleBack();
  };

  const sections = [
    {
      title: 'Information Collection',
      text: 'The platform collects personally identifiable information (“Personal Data”), including but not limited to name, contact information, demographic details, identification numbers, address, and login activity for the purpose of account creation and service delivery.'
    },
    {
      title: 'Purpose of Processing',
      text: 'Personal Data is processed for:',
      bullets: [
        'Account registration and authentication',
        'Compliance with legal and regulatory requirements',
        'Communication of transactional or service-related information',
        'Enhancing platform features, security, and user experience',
        'Fraud detection and prevention',
        'Internal analytics and performance improvement'
      ]
    },
    {
      title: 'Data Retention',
      text: 'Personal Data will be retained only as long as necessary for service usage, compliance, or dispute resolution.'
    },
    {
      title: 'Data Disclosure',
      text: 'Personal Data may be disclosed to authorized entities only:',
      bullets: [
        'Government or regulatory authorities upon lawful request',
        'Verified third-party service providers under confidentiality obligations',
        'Internal departments requiring information for service fulfillment'
      ]
    },
    {
      title: 'User Rights and Control',
      text: 'Users have the right to:',
      bullets: [
        'Access their stored Personal Data',
        'Request rectification or deletion of inaccurate, outdated, or unnecessary information',
        'Withdraw consent where applicable',
        'Raise grievances regarding data use or privacy'
      ]
    },
    {
      title: 'Security Measures',
      text: 'The company implements administrative, technical, and physical safeguards to protect Personal Data from breach, unauthorized access, destruction, or alteration.'
    },
    {
      title: 'Policy Amendments',
      text: 'The company reserves the right to modify or update this Privacy Policy at any time. Continued use of the platform constitutes acceptance of the modified policy.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'white' }}>
      
      {/* Header */}
      <div style={{
        background: 'var(--gradient-brand)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(41, 0, 29, 0.15)'
      }}>
        <button onClick={handleBack} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={24} color="var(--gold-primary)" />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', textAlign: 'center', flex: 1, marginRight: '40px', letterSpacing: '0.5px' }}>
          Privacy Policy
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '22px', boxSizing: 'border-box' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '3.5px solid var(--brand-accent)', paddingLeft: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0, fontFamily: 'var(--font-poppins)' }}>
              {section.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '18px', fontFamily: 'var(--font-poppins)' }}>
              {section.text}
            </p>
            {section.bullets && (
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {section.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', fontFamily: 'var(--font-poppins)' }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '10px', fontStyle: 'italic', fontFamily: 'var(--font-poppins)' }}>
          No description available.
        </div>
        
        {/* Extra spacer for scroll buffer */}
        <div style={{ height: isAccepted ? '20px' : '80px' }} />
      </div>

      {/* Conditional Accept button fixed at the bottom */}
      {!isAccepted && (
        <div style={{
          background: 'white',
          padding: '16px 20px',
          borderTop: '1px solid #ECECEC',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
          position: 'sticky',
          bottom: 0
        }}>
          <button
            onClick={handleAccept}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-poppins)',
              boxShadow: '0 4px 12px var(--brand-glow)'
            }}
          >
            Accept & Continue
          </button>
        </div>
      )}

    </div>
  );
};
