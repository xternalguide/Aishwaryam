import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';
import { ArrowLeft, Landmark, ShieldCheck, MapPin, PlusCircle, User } from 'lucide-react';

const ProfileHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
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
    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
      <ArrowLeft size={24} color="var(--gold-primary)" />
    </button>
    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', letterSpacing: '0.5px' }}>
      {title}
    </span>
  </div>
);

// ── PROFILE ADDRESS PAGE ──────────────────────────────────────────────────
export const ProfileAddress: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [addressArea, setAddressArea] = useState(() => SessionManager.getPartialArea());
  const [addressCity, setAddressCity] = useState(() => SessionManager.getPartialCity());
  const [addressState, setAddressState] = useState(() => SessionManager.getPartialState());
  const [addressPincode, setAddressPincode] = useState(() => SessionManager.getPartialPincode());

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handleSave = () => {
    SessionManager.saveStep1Data({
      area: addressArea,
      city: addressCity,
      state: addressState,
      pincode: addressPincode
    });
    alert("Address updated successfully!");
    handleBack();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <ProfileHeader title={t('address_label')} onBack={handleBack} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: '4.5px solid var(--brand-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <MapPin size={22} color="var(--brand-accent)" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Edit Your Address</h4>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Area / Street</label>
            <input
              type="text"
              placeholder="e.g. Gandhipuram"
              value={addressArea}
              onChange={(e) => setAddressArea(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>City</label>
            <input
              type="text"
              placeholder="e.g. Coimbatore"
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>State</label>
            <input
              type="text"
              placeholder="e.g. Tamil Nadu"
              value={addressState}
              onChange={(e) => setAddressState(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Pincode</label>
            <input
              type="text"
              placeholder="e.g. 641012"
              value={addressPincode}
              onChange={(e) => setAddressPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', height: '52px', borderRadius: '14px', background: 'var(--gradient-brand)',
            color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 8px 16px var(--brand-glow)'
          }}
        >
          Save Address
        </button>
      </div>
    </div>
  );
};

// ── PROFILE KYC DETAILS PAGE ──────────────────────────────────────────────
export const ProfileKyc: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useApp();

  const [nomineeName, setNomineeName] = useState('');
  const [newNomineeInput, setNewNomineeInput] = useState('');
  const [isEditingNominee, setIsEditingNominee] = useState(false);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kycStatusMsg, setKycStatusMsg] = useState('PENDING');

  const kycLevel = profile?.kycLevel || 'BASIC';
  const userName = profile?.fullName || 'User';
  const userPhone = profile?.phoneNumber || '';

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  useEffect(() => {
    const nominee = SessionManager.getNomineeName() || profile?.nomineeName || '';
    setNomineeName(nominee);
    setNewNomineeInput(nominee);

    const fetchKycStatus = async () => {
      const userId = SessionManager.getUserId();
      if (!userId) return;
      try {
        const res = await ApiClient.get(`api/Kyc/status/${userId}`);
        if (res.data && res.data.success) {
          setKycDocs(res.data.documents || []);
          setKycStatusMsg(res.data.status || 'PENDING');
        }
      } catch (err) {
        console.error('Failed to load KYC documents:', err);
      }
    };
    fetchKycStatus();
  }, [profile]);

  const handleUpdateNominee = () => {
    if (newNomineeInput.trim()) {
      SessionManager.saveNomineeName(newNomineeInput);
      setNomineeName(newNomineeInput);
      setIsEditingNominee(false);
      alert('Nominee name updated successfully!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <ProfileHeader title={t('kyc_details')} onBack={handleBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Status banner */}
        <div style={{
          background: kycLevel === 'FULL' ? 'var(--success-light)' : 'var(--warning-light)',
          border: `1.5px solid ${kycLevel === 'FULL' ? 'var(--success-green)' : 'var(--warning-amber)'}`,
          padding: '18px', borderRadius: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start'
        }}>
          <ShieldCheck size={28} color={kycLevel === 'FULL' ? 'var(--success-green)' : 'var(--warning-amber)'} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
              KYC Level: {kycLevel}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '16px', display: 'block', marginTop: '2px' }}>
              {kycLevel === 'FULL' 
                ? 'Your identity is fully verified. You can start physical gold redemptions.' 
                : 'Please upload PAN and Aadhaar documents to complete verification.'}
            </span>
          </div>
        </div>

        {/* Details card */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: '4.5px solid var(--brand-accent)' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Personal Details</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('full_name_label')}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{userName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('phone_number_label')}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>+91 {userPhone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('nominee_label')}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{nomineeName || t('not_configured')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('verification_status_label')}</span>
              <span style={{ fontWeight: 'bold', color: 'var(--brand-dark)' }}>{kycStatusMsg || 'PENDING'}</span>
            </div>
          </div>
        </div>

        {/* Nominee Config card */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            {t('nominee_config')}
          </span>
          {isEditingNominee ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newNomineeInput}
                onChange={(e) => setNewNomineeInput(e.target.value)}
                style={{ flex: 1, height: '40px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white' }}
              />
              <button 
                onClick={handleUpdateNominee} 
                style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px var(--brand-glow)' }}
              >
                Save
              </button>
              <button onClick={() => setIsEditingNominee(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0 8px', fontSize: '12px', cursor: 'pointer' }}>
                {t('cancel')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{nomineeName || t('not_configured')}</span>
              <button onClick={() => { setNewNomineeInput(nomineeName); setIsEditingNominee(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}>
                {t('edit_nominee')}
              </button>
            </div>
          )}
        </div>

        {/* KYC Documents card */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block' }}>
            {t('kyc_documents_label')}
          </span>
          
          {kycDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', display: 'block', marginBottom: '14px' }}>
                {t('no_kyc_documents')}
              </span>
              <button
                onClick={() => navigate('/onboarding')}
                style={{
                  padding: '10px 20px', borderRadius: '10px', background: 'var(--gradient-brand)', color: 'white',
                  border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px var(--brand-glow)'
                }}
              >
                Upload KYC Documents
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kycDocs.map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', color: 'var(--brand-dark)' }}>
                      {doc.documentType === 'pan' ? 'PAN Card' : 'Aadhaar Card'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      No: {doc.documentNumber}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px',
                    background: doc.status === 'APPROVED' ? 'var(--success-light)' : doc.status === 'REJECTED' ? 'var(--error-light)' : 'var(--warning-light)',
                    color: doc.status === 'APPROVED' ? 'var(--success-green)' : doc.status === 'REJECTED' ? 'var(--error-red)' : 'var(--warning-amber)'
                  }}>
                    {doc.status === 'APPROVED' ? t('approved_status') : doc.status === 'REJECTED' ? t('rejected_status') : t('review_status')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── PROFILE LINKED BANK ACCOUNTS PAGE ──────────────────────────────────────
export const ProfileBankAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { bankAccounts } = useApp();

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <ProfileHeader title={t('linked_bank_accounts')} onBack={handleBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: '4.5px solid var(--brand-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Landmark size={22} color="var(--brand-accent)" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Your Linked Accounts</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bankAccounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <Landmark size={44} color="var(--text-light)" style={{ marginBottom: '12px' }} />
                <span style={{ fontSize: '13px', display: 'block' }}>No bank accounts linked yet.</span>
              </div>
            ) : (
              bankAccounts.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px', borderRadius: '12px', background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={20} color="var(--success-green)" />
                  </div>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 'bold', display: 'block', color: 'var(--brand-dark)' }}>{b.bankName}</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>A/C: {b.accountNumberMasked} · IFSC: {b.ifscCode}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/add-bank-account')}
          style={{
            width: '100%', height: '52px', borderRadius: '14px', background: 'var(--gradient-brand)',
            color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 8px 16px var(--brand-glow)', marginTop: '8px'
          }}
        >
          <PlusCircle size={18} />
          {t('add_bank')}
        </button>

      </div>
    </div>
  );
};

// ── PROFILE PERSONAL DETAILS PAGE ──────────────────────────────────────────
export const ProfilePersonalDetails: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, refreshData } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setNomineeName(profile.nomineeName || SessionManager.getNomineeName() || '');
      setPhone(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      const userId = SessionManager.getUserId();
      if (userId) {
        await ApiClient.put(`api/User/profile/${userId}`, {
          fullName: fullName.trim(),
          email: email.trim(),
          nomineeName: nomineeName.trim() || null
        });
        
        SessionManager.savePartialProfile(fullName.trim(), email.trim());
        if (nomineeName.trim()) {
          SessionManager.saveNomineeName(nomineeName.trim());
        }
        
        await refreshData();
        alert("Personal details updated successfully!");
        handleBack();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <ProfileHeader title={t('personal_details')} onBack={handleBack} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: '4.5px solid var(--brand-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <User size={22} color="var(--brand-accent)" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Edit Personal Details</h4>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Phone Number</label>
            <input
              type="text"
              value={phone ? `+91 ${phone}` : ''}
              disabled
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px', background: '#F5F5F5', color: 'var(--text-muted)'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nominee Name</label>
            <input
              type="text"
              placeholder="Enter Nominee Name"
              value={nomineeName}
              onChange={(e) => setNomineeName(e.target.value)}
              style={{
                width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            width: '100%', height: '52px', borderRadius: '14px', background: 'var(--gradient-brand)',
            color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
            boxShadow: '0 8px 16px var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {isSaving ? (
            <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};
