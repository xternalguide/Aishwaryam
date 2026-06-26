import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';
import { ArrowLeft, ShieldCheck, MapPin, PlusCircle, Trash2, Edit } from 'lucide-react';

const ProfileHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
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
    <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}>
      <ArrowLeft size={24} color="var(--gold-primary)" />
    </button>
    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-poppins)', letterSpacing: '0.5px' }}>
      {title}
    </span>
  </div>
);

const STATES = ["Tamil Nadu", "Puducherry", "Kerala", "Karnataka"];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tirunelveli"],
  "Puducherry": ["Puducherry", "Karaikal"],
  "Kerala": ["Kochi", "Thiruvananthapuram"],
  "Karnataka": ["Bengaluru", "Mysuru"]
};

const PIN_PREFIXES: Record<string, string[]> = {
  "Chennai": ["600"],
  "Coimbatore": ["641"],
  "Madurai": ["625"],
  "Salem": ["636"],
  "Trichy": ["620"],
  "Tirunelveli": ["627"],
  "Puducherry": ["605"],
  "Karaikal": ["609"],
  "Kochi": ["682"],
  "Thiruvananthapuram": ["695"],
  "Bengaluru": ["560"],
  "Mysuru": ["570"]
};

// ── PROFILE ADDRESS PAGE ──────────────────────────────────────────────────
export const ProfileAddress: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userId = SessionManager.getUserId() || '';

  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);

  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await ApiClient.get(`api/Address/user/${userId}`);
      if (res.data) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  const handleStateChange = (state: string) => {
    setFormState(state);
    setFormCity("");
    setFormPincode("");
    setPinError(null);
  };

  const handleCityChange = (city: string) => {
    setFormCity(city);
    setFormPincode("");
    setPinError(null);
  };

  const handlePincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setFormPincode(numericValue);

    if (numericValue.length >= 3) {
      const prefix = numericValue.substring(0, 3);
      let foundCity = "";
      let foundState = "";
      for (const [city, prefixes] of Object.entries(PIN_PREFIXES)) {
        if (prefixes.includes(prefix)) {
          foundCity = city;
          break;
        }
      }
      if (foundCity) {
        for (const [state, cities] of Object.entries(CITIES_BY_STATE)) {
          if (cities.includes(foundCity)) {
            foundState = state;
            break;
          }
        }
      }
      if (foundCity && foundState) {
        setFormCity(foundCity);
        setFormState(foundState);
        setPinError(null);
      }
    }

    if (numericValue.length > 0) {
      if (numericValue.length < 6) {
        setPinError("PIN Code must be exactly 6 digits.");
      } else {
        if (formCity) {
          const prefixes = PIN_PREFIXES[formCity] || [];
          const isValidPrefix = prefixes.some(prefix => numericValue.startsWith(prefix));
          if (!isValidPrefix) {
            setPinError(`PIN Code must start with ${prefixes.join(', ')} for ${formCity}.`);
          } else {
            setPinError(null);
          }
        } else {
          setPinError(null);
        }
      }
    } else {
      setPinError(null);
    }
  };

  const startAdd = () => {
    if (addresses.length >= 3) {
      alert("Maximum limit of 3 addresses reached. Please delete an address before adding a new one.");
      return;
    }
    setEditId(null);
    setFormState("");
    setFormCity("");
    setFormStreet("");
    setFormPincode("");
    setFormIsDefault(false);
    setPinError(null);
    setShowForm(true);
  };

  const startEdit = (addr: any) => {
    setEditId(addr.id);
    setFormState(addr.state);
    setFormCity(addr.city);
    setFormStreet(addr.streetAddress);
    setFormPincode(addr.pincode);
    setFormIsDefault(addr.isDefault);
    setPinError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formState || !formCity || !formStreet.trim() || formPincode.length !== 6 || pinError) {
      alert("Please fill all fields correctly.");
      return;
    }
    try {
      if (editId) {
        await ApiClient.put(`api/Address/update/${editId}`, {
          state: formState,
          city: formCity,
          streetAddress: formStreet,
          pincode: formPincode,
          isDefault: formIsDefault
        });
      } else {
        await ApiClient.post(`api/Address/add`, {
          userId,
          state: formState,
          city: formCity,
          streetAddress: formStreet,
          pincode: formPincode,
          isDefault: formIsDefault
        });
      }
      setShowForm(false);
      loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save address.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await ApiClient.delete(`api/Address/delete/${id}`);
      loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await ApiClient.put(`api/Address/set-default/${id}`);
      loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to set default address.");
    }
  };

  const isFormValid = formState && formCity && formStreet.trim() && formPincode.length === 6 && !pinError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      <ProfileHeader title={t('address_label')} onBack={handleBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {showForm ? (
          /* Address Form View */
          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: '4.5px solid var(--brand-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <MapPin size={22} color="var(--brand-accent)" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                {editId ? 'Edit Address' : 'Add New Address'}
              </h4>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>PIN Code</label>
              <input
                type="text"
                placeholder="6-digit PIN Code"
                value={formPincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                style={{
                  width: '100%', height: '44px', borderRadius: '8px', border: pinError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                  padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
                }}
              />
              {pinError && (
                <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                  {pinError}
                </span>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>State</label>
              <select
                value={formState}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{
                  width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px', background: 'white'
                }}
              >
                <option value="">Select State</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>City</label>
              <select
                value={formCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!formState}
                style={{
                  width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px', background: !formState ? '#F3F4F6' : 'white'
                }}
              >
                <option value="">Select City</option>
                {(CITIES_BY_STATE[formState] || []).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Street Address</label>
              <input
                type="text"
                placeholder="Enter street name, flat/house no."
                value={formStreet}
                onChange={(e) => setFormStreet(e.target.value)}
                style={{
                  width: '100%', height: '44px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
                  padding: '0 12px', fontSize: '14px', outline: 'none', marginTop: '6px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="defaultCheck"
                checked={formIsDefault}
                onChange={(e) => setFormIsDefault(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="defaultCheck" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Set as Default Address
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={handleSave}
                disabled={!isFormValid}
                style={{
                  flex: 1, height: '46px', borderRadius: '10px', background: 'var(--gradient-brand)',
                  color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                  opacity: isFormValid ? 1 : 0.5, boxShadow: '0 4px 10px var(--brand-glow)'
                }}
              >
                Save Address
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, height: '46px', borderRadius: '10px', background: 'transparent',
                  color: 'var(--text-secondary)', border: '1px solid rgba(0,0,0,0.15)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Address List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {addresses.length >= 3 && (
              <div style={{ background: '#FFF9C4', border: '1px solid #FBC02D', color: '#F57F17', padding: '12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                Maximum limit of 3 addresses reached. Please delete an address before creating a new one.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Saved Addresses ({addresses.length}/3)
              </span>
              {addresses.length < 3 && (
                <button
                  onClick={startAdd}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--brand-mid)',
                    fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <PlusCircle size={16} /> Add Address
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                Loading addresses...
              </div>
            ) : addresses.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px', borderRadius: '16px', background: 'white', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <MapPin size={40} color="var(--text-light)" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  No addresses saved yet.
                </p>
                <button
                  onClick={startAdd}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', background: 'var(--gradient-brand)', color: 'white',
                    border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px var(--brand-glow)'
                  }}
                >
                  Add Your Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="glass-card"
                    style={{
                      padding: '16px 20px', borderRadius: '16px', background: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderLeft: addr.isDefault ? '4px solid var(--success-green)' : '1px solid rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column', gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                          {addr.city}, {addr.state}
                        </span>
                        {addr.isDefault && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#E8F5E9', color: 'var(--success-green)', padding: '2px 8px', borderRadius: '12px' }}>
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => startEdit(addr)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', cursor: 'pointer', padding: 0 }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(addr.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--error-red)', cursor: 'pointer', padding: 0 }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '18px' }}>
                      {addr.streetAddress}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        PIN Code: {addr.pincode}
                      </span>

                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          style={{
                            background: 'transparent', border: 'none', color: 'var(--brand-mid)',
                            fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', padding: 0
                          }}
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ── PROFILE KYC DETAILS PAGE ──────────────────────────────────────────────
export const ProfileKyc: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, refreshData } = useApp();

  const [nomineeName, setNomineeName] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeRelationship, setNomineeRelationship] = useState('');

  const [newNomineeInput, setNewNomineeInput] = useState('');
  const [newNomineePhone, setNewNomineePhone] = useState('');
  const [newNomineeRelationship, setNewNomineeRelationship] = useState('');

  const [isEditingNominee, setIsEditingNominee] = useState(false);
  const [isSavingNominee, setIsSavingNominee] = useState(false);
  const [nomineeError, setNomineeError] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kycStatusMsg, setKycStatusMsg] = useState('PENDING');

  const kycLevel = profile?.kycLevel || 'BASIC';
  const userName = profile?.fullName || 'User';
  const userPhone = profile?.phoneNumber || '';

  const RELATIONSHIPS = ["Father", "Mother", "Wife", "Husband", "Son", "Daughter", "Brother", "Guardian"];

  const handleBack = () => {
    localStorage.setItem('DASHBOARD_ACTIVE_TAB', '2');
    navigate('/dashboard');
  };

  useEffect(() => {
    const name = profile?.nomineeName || SessionManager.getNomineeName() || '';
    const phone = profile?.nomineePhoneNumber || '';
    const relationship = profile?.nomineeRelationship || '';

    setNomineeName(name);
    setNomineePhone(phone);
    setNomineeRelationship(relationship);

    setNewNomineeInput(name);
    setNewNomineePhone(phone);
    setNewNomineeRelationship(relationship);

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

  const handleUpdateNominee = async () => {
    setNomineeError(null);
    if (!newNomineeInput.trim()) {
      setNomineeError('Nominee Name is required.');
      return;
    }
    if (!newNomineePhone.trim() || !/^\d{10}$/.test(newNomineePhone)) {
      setNomineeError('Valid 10-digit Nominee Mobile Number is required.');
      return;
    }
    if (!newNomineeRelationship) {
      setNomineeError('Nominee Relationship is required.');
      return;
    }

    const userId = SessionManager.getUserId();
    if (!userId) return;

    // Guard: prevent double-clicks
    if (isSavingNominee) return;
    setIsSavingNominee(true);

    try {
      await ApiClient.put(`api/User/profile/${userId}`, {
        fullName: profile?.fullName || 'User',
        email: profile?.email || null,
        dateOfBirth: profile?.dateOfBirth || null,
        weddingAnniversaryDate: profile?.weddingAnniversaryDate || null,
        gender: profile?.gender || null,
        nomineeName: newNomineeInput,
        nomineePhoneNumber: newNomineePhone,
        nomineeRelationship: newNomineeRelationship,
        profilePictureBase64: profile?.profilePictureBase64 || null
      });
      
      SessionManager.saveNomineeName(newNomineeInput);
      setNomineeName(newNomineeInput);
      setNomineePhone(newNomineePhone);
      setNomineeRelationship(newNomineeRelationship);
      setIsEditingNominee(false);
      refreshData();
    } catch (err: any) {
      setNomineeError(err.response?.data?.message || 'Failed to update nominee details. Please try again.');
    } finally {
      setIsSavingNominee(false);
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
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {nomineeName ? `${nomineeName} (${nomineeRelationship})` : t('not_configured')}
              </span>
            </div>
            {nomineePhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nominee Phone</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>+91 {nomineePhone}</span>
              </div>
            )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nominee Name</label>
                <input
                  type="text"
                  placeholder="Enter nominee name"
                  value={newNomineeInput}
                  onChange={(e) => setNewNomineeInput(e.target.value)}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nominee Mobile</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={newNomineePhone}
                  onChange={(e) => setNewNomineePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Relationship</label>
                <select
                  value={newNomineeRelationship}
                  onChange={(e) => setNewNomineeRelationship(e.target.value)}
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', background: 'white', marginTop: '4px' }}
                >
                  <option value="">Select Relationship</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* Inline error */}
              {nomineeError && (
                <span style={{ fontSize: '12px', color: 'var(--error-red)', fontWeight: '600', display: 'block', background: 'var(--error-light)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  ⚠ {nomineeError}
                </span>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  onClick={handleUpdateNominee}
                  disabled={isSavingNominee}
                  style={{ background: isSavingNominee ? 'rgba(74,14,78,0.5)' : 'var(--gradient-brand)', color: 'white', border: 'none', padding: '0 20px', height: '40px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: isSavingNominee ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px var(--brand-glow)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px', justifyContent: 'center', transition: 'all 0.2s ease' }}
                >
                  {isSavingNominee ? (
                    <>
                      <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                      Saving...
                    </>
                  ) : (
                    'Save Nominee'
                  )}
                </button>
                <button onClick={() => { setIsEditingNominee(false); setNomineeError(null); }} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-secondary)', padding: '0 16px', height: '40px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
                  {nomineeName || t('not_configured')}
                </span>
                {nomineePhone && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Phone: {nomineePhone} | Relationship: {nomineeRelationship}
                  </span>
                )}
              </div>
              <button onClick={() => { setNewNomineeInput(nomineeName); setNewNomineePhone(nomineePhone); setNewNomineeRelationship(nomineeRelationship); setIsEditingNominee(true); }} style={{ background: 'transparent', border: 'none', color: 'var(--brand-mid)', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer' }}>
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
