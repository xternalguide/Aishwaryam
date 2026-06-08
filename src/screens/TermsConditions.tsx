import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsConditions: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const sections = [
    {
      title: '1. Agreement to Terms',
      text: 'By accessing and utilizing the Aishwaryam Digital Gold platform, you agree to be bound by these Terms and Conditions. These terms govern your subscription to and participation in all digital metal accumulation schemes.'
    },
    {
      title: '2. Savings Scheme Details',
      text: 'Aishwaryam provides automated metal accumulation savings plans (chits) designed to help you save systematically:',
      bullets: [
        'Tenure: Schemes operate for a fixed tenure (typically 11 months or 12 months).',
        'Installments: Installments must be paid monthly. The minimum installment begins at ₹100.',
        'Bullion Quality: Every payment purchases certified 24K Gold (99.9% purity) or 99.9% Silver at the live market rates in effect at the time of transaction verification.'
      ]
    },
    {
      title: '3. GST and Taxes',
      text: 'As per prevailing Government of India regulations, a 3% Goods and Services Tax (GST) is applicable on all digital bullion purchases. The GST amount is calculated and included in the total value of each monthly installment chit transaction.'
    },
    {
      title: '4. Loyalty Bonus Milestones',
      text: 'Aishwaryam rewards disciplined savers with loyalty bonus weights added to their metal accounts, calculated based on the day number of the installment deposit:',
      bullets: [
        'Early Deposit Bonus: Payments completed on Day 1 to Day 75 of the scheme cycle qualify for a 7.5% loyalty bonus weight.',
        'Late Deposit Bonus: The bonus weight percentage reduces progressively for payments completed after Day 75.',
        'Bonus Credit: Bonus weights are locked in your locker and credited fully upon successful completion/maturity of the scheme.'
      ]
    },
    {
      title: '5. Redemption Guidelines',
      text: 'Upon completing all monthly installments, users can redeem their accumulated metal balance through three distinct channels:',
      bullets: [
        'Showroom Jewelry Collection: Exchange your metal balance for physical ornaments at any of our authorized retail jewelry showroom partners with zero making wastage/charges.',
        'Home Delivery: Request secure doorstep delivery of 24K gold coins or silver bars in available denominations. Shipments are fully insured.',
        'Cash Liquidation: Liquidate/sell your metal balance back to the platform at live market sell rates and transfer cash immediately to your linked bank account.'
      ]
    },
    {
      title: '6. Cancellations and Pre-closures',
      text: 'Active schemes cannot be cancelled or refunded in cash prior to maturity. In the event of early termination, accumulated savings balances will remain locked as physical metal weight and can only be redeemed as gold/silver ornaments or coins at the end of the tenure.'
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
          Terms & Conditions
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '22px', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '20px', fontStyle: 'italic', fontFamily: 'var(--font-poppins)' }}>
          Please read these Terms and Conditions carefully before enrolling in our saving schemes.
        </p>

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
        
        <div style={{ height: '40px' }} />
      </div>

    </div>
  );
};
