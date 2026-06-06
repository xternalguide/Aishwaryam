import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Calendar, ShieldCheck, Landmark, CheckCircle, Upload } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshData } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Step 2 base64 document images
  const [panImage, setPanImage] = useState<string | null>(null);
  const [aadhaarFrontImage, setAadhaarFrontImage] = useState<string | null>(null);
  const [aadhaarBackImage, setAadhaarBackImage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pan' | 'aadhaar-front' | 'aadhaar-back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'pan') setPanImage(base64);
      else if (type === 'aadhaar-front') setAadhaarFrontImage(base64);
      else if (type === 'aadhaar-back') setAadhaarBackImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // --- Step 1 State Variables ---
  const [name, setName] = useState(SessionManager.getPartialName() || '');
  const [dob, setDob] = useState(SessionManager.getPartialDob() || '');
  const [dobError, setDobError] = useState<string | null>(null);
  const [nomineeName, setNomineeName] = useState(SessionManager.getNomineeName() || '');
  const [isMarried, setIsMarried] = useState(SessionManager.getPartialIsMarried() || false);
  const [weddingDate, setWeddingDate] = useState(SessionManager.getPartialWeddingDate() || '');
  const [weddingDateError, setWeddingDateError] = useState<string | null>(null);
  const [phone] = useState(SessionManager.getPhoneNumber() || '');
  const [email, setEmail] = useState(SessionManager.getPartialEmail() || '');
  const [gender, setGender] = useState(SessionManager.getPartialGender() || 'Male');
  const [pincode, setPincode] = useState(SessionManager.getPartialPincode() || '');
  const [state, setState] = useState(SessionManager.getPartialState() || '');
  const [city, setCity] = useState(SessionManager.getPartialCity() || '');
  const [area, setArea] = useState(SessionManager.getPartialArea() || '');
  const [isManualArea, setIsManualArea] = useState(SessionManager.getPartialIsManualArea() || false);
  const [termsAccepted, setTermsAccepted] = useState(SessionManager.getPartialTermsAccepted() || false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Auto-save Step 1 to Session Storage reactively
  useEffect(() => {
    SessionManager.saveStep1Data({
      name,
      email,
      dob,
      isMarried,
      weddingDate,
      gender,
      pincode,
      state,
      city,
      area,
      isManualArea,
      termsAccepted,
    });
    SessionManager.saveNomineeName(nomineeName);
  }, [name, email, dob, isMarried, weddingDate, gender, pincode, state, city, area, isManualArea, termsAccepted, nomineeName]);

  // --- Step 2 State Variables ---
  const [panNumber, setPanNumber] = useState('');
  const [isPanOtpSent, setIsPanOtpSent] = useState(false);
  const [panOtp, setPanOtp] = useState('');
  const [isPanVerified, setIsPanVerified] = useState(false);
  const [fetchedPanName, setFetchedPanName] = useState('');

  const [identityNumber, setIdentityNumber] = useState('');
  const [isIdOtpSent, setIsIdOtpSent] = useState(false);
  const [idOtp, setIdOtp] = useState('');
  const [isIdVerified, setIsIdVerified] = useState(false);

  // --- Step 3 State Variables ---
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [ifscError, setIfscError] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountNumberError, setAccountNumberError] = useState<string | null>(null);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  // Date validators

  const convertToInputDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return '';
  };

  const convertFromInputDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  };

  const validateDate = (input: string, isWedding: boolean) => {
    const errorCallback = isWedding ? setWeddingDateError : setDobError;
    if (!input) {
      errorCallback(null);
      return;
    }
    if (/[^0-9/]/.test(input)) {
      errorCallback('Only numbers and "/" are allowed');
      return;
    }
    if (input.length === 10) {
      const parts = input.split('/');
      if (parts.length !== 3) {
        errorCallback('Format must be DD/MM/YYYY');
        return;
      }
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (isNaN(d) || isNaN(m) || isNaN(y)) {
        errorCallback('Invalid numbers in date');
        return;
      }
      const currentYear = new Date().getFullYear();
      if (y < 1900 || y > currentYear) {
        errorCallback(`Year must be between 1900 and ${currentYear}`);
        return;
      }
      if (m < 1 || m > 12) {
        errorCallback('Month must be between 01 and 12');
        return;
      }
      let days = 31;
      if (m === 2) {
        days = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(m)) {
        days = 30;
      }
      if (d < 1 || d > days) {
        errorCallback('Invalid day for the selected month');
        return;
      }
      errorCallback(null);
    } else if (input.length > 10) {
      errorCallback('Date cannot exceed 10 characters');
    } else {
      errorCallback(null);
    }
  };

  const isValidDateString = (str: string): boolean => {
    if (str.length !== 10) return false;
    const parts = str.split('/');
    if (parts.length !== 3) return false;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (y < 1900 || y > new Date().getFullYear()) return false;
    if (m < 1 || m > 12) return false;
    let days = 31;
    if (m === 2) {
      days = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
    } else if ([4, 6, 9, 11].includes(m)) {
      days = 30;
    }
    return d >= 1 && d <= days;
  };

  // Pincode auto-fill
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      if (clean.startsWith('641')) {
        setState('Tamil Nadu');
        setCity('Coimbatore');
        setArea('Gandhipuram');
      } else {
        setState('Tamil Nadu');
        setCity('Chennai');
        setArea('T. Nagar');
      }
    }
  };

  // IFSC auto-fill & validation
  const handleIfscChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfscCode(clean);
    if (clean.length === 11) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(clean)) {
        setIfscError('Invalid IFSC format (e.g. SBIN0000843)');
        setBankName('');
        setBranchName('');
      } else {
        setIfscError(null);
        setBankName('State Bank of India');
        setBranchName('T. Nagar Branch');
      }
    } else {
      setIfscError(null);
      setBankName('');
      setBranchName('');
    }
  };

  const handleAccountNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setAccountNumber(clean);
    if (clean.length > 0 && (clean.length < 9 || clean.length > 18)) {
      setAccountNumberError('Account number must be between 9 and 18 digits');
    } else {
      setAccountNumberError(null);
    }
  };

  const calculateAge = (dateStr: string): number | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() + 1 - month;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  const isStep1Valid = () => {
    const basicInfo = name.trim().length > 0 && phone.trim().length > 0 && termsAccepted && email.includes('@');
    const dobValid = isValidDateString(dob) && dobError === null;
    const marriageValid = !isMarried || (isValidDateString(weddingDate) && weddingDateError === null);
    return basicInfo && dobValid && marriageValid;
  };

  const handleNext = async () => {
    const userId = SessionManager.getUserId() || 'user-id-999';
    if (currentStep === 1) {
      setIsSaving(true);
      setSaveError(null);
      try {
        const parts = dob.split('/');
        const formattedDob = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : null;
        const formattedWeddingDate = isMarried && weddingDate && weddingDate.split('/').length === 3 
          ? `${weddingDate.split('/')[2]}-${weddingDate.split('/')[1]}-${weddingDate.split('/')[0]}` 
          : null;

        await ApiClient.put(`api/User/profile/${userId}`, {
          fullName: name,
          email,
          dateOfBirth: formattedDob,
          nomineeName: nomineeName.trim() || null,
          weddingAnniversaryDate: formattedWeddingDate
        });
        await refreshData();
        setCurrentStep(2);
      } catch (err: any) {
        setSaveError(err.message || 'Failed to save profile. Please try again.');
      } finally {
        setIsSaving(false);
      }
    } else if (currentStep === 2) {
      setIsSaving(true);
      setSaveError(null);
      try {
        // Submit PAN
        await ApiClient.post('api/Kyc/submit', {
          userId,
          documentType: 'PAN',
          documentNumber: panNumber,
          documentUrl: panImage || 'https://placeholder.url/pan.jpg'
        });
        // Submit Aadhaar
        await ApiClient.post('api/Kyc/submit', {
          userId,
          documentType: 'AADHAAR',
          documentNumber: identityNumber,
          documentUrl: aadhaarFrontImage || 'https://placeholder.url/aadhaar.jpg'
        });
        // Update user KYC level to FULL
        await ApiClient.post('api/Kyc/update-status', {
          userId,
          newLevel: 'FULL'
        });
        await refreshData();
        setCurrentStep(3);
      } catch (err: any) {
        // Fallback for network error
        setCurrentStep(3);
      } finally {
        setIsSaving(false);
      }
    } else if (currentStep === 3) {
      setIsSaving(true);
      setSaveError(null);
      try {
        await ApiClient.post('api/Banking/add-account', {
          userId,
          accountHolderName: accountName,
          accountNumber,
          ifscCode,
          bankName
        });
        SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
        await refreshData();
        navigate('/dashboard');
      } catch (err: any) {
        // Fallback for network error
        SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
        await refreshData();
        navigate('/dashboard');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSkip = async () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
      await refreshData();
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface-light)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--brand-dark)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              objectFit: 'cover'
            }}
          />
          <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-poppins)' }}>
            Aishwaryam · Step {currentStep} of 3
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {/* Progress Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '12px 0 24px 0' }}>
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: num <= currentStep ? 'var(--brand-mid)' : '#D1D5DB',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}>
                {num}
              </div>
              {num < totalSteps && (
                <div style={{
                  width: '48px',
                  height: '2px',
                  background: num < currentStep ? 'var(--brand-mid)' : '#D1D5DB',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ flex: 1 }}>
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle color="var(--brand-accent)" size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Step 1: Basic Profile</h2>
              </div>

              {/* Box 1: Core Details */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Full Name <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Enter Full Name"
                    value={name}
                    onChange={(e) => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                        setName(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Date of Birth (DD/MM/YYYY) <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      value={convertToInputDateFormat(dob)}
                      min="1926-06-06"
                      max={todayStr}
                      onKeyDown={(e) => e.preventDefault()}
                      onChange={(e) => {
                        const formatted = convertFromInputDateFormat(e.target.value);
                        setDob(formatted);
                        validateDate(formatted, false);
                      }}
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: dobError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                        padding: '0 40px 0 12px',
                        fontSize: '14px',
                        outline: 'none',
                        marginTop: '4px',
                        background: 'white'
                      }}
                    />
                    <Calendar size={18} color="var(--brand-mid)" style={{ position: 'absolute', right: '12px', top: '19px', pointerEvents: 'none' }} />
                  </div>
                  {dob && isValidDateString(dob) && dobError === null && (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--brand-mid)', marginTop: '6px', display: 'block' }}>
                      Age: {calculateAge(dob)} years
                    </span>
                  )}
                  {dobError && <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>{dobError}</span>}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nominee Name</label>
                  <input
                    type="text"
                    placeholder="Enter Nominee Name"
                    value={nomineeName}
                    onChange={(e) => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                        setNomineeName(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>Marital Status: {isMarried ? 'Married' : 'Single'}</span>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={isMarried}
                      onChange={(e) => setIsMarried(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider-switch" style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: isMarried ? 'var(--brand-mid)' : '#ccc', borderRadius: '34px',
                      transition: '0.4s'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '18px', width: '18px', left: isMarried ? '22px' : '4px', bottom: '3px',
                        backgroundColor: 'white', borderRadius: '50%', transition: '0.4s'
                      }} />
                    </span>
                  </label>
                </div>

                {isMarried && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Wedding Date (DD/MM/YYYY)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={convertToInputDateFormat(weddingDate)}
                        min={dob ? convertToInputDateFormat(dob) : "1940-01-01"}
                        max={todayStr}
                        onKeyDown={(e) => e.preventDefault()}
                        onChange={(e) => {
                          const formatted = convertFromInputDateFormat(e.target.value);
                          setWeddingDate(formatted);
                          validateDate(formatted, true);
                        }}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: '8px',
                          border: weddingDateError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                          padding: '0 40px 0 12px',
                          fontSize: '14px',
                          outline: 'none',
                          marginTop: '4px',
                          background: 'white'
                        }}
                      />
                      <Calendar size={18} color="var(--brand-mid)" style={{ position: 'absolute', right: '12px', top: '19px', pointerEvents: 'none' }} />
                    </div>
                    {weddingDateError && <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>{weddingDateError}</span>}
                  </div>
                )}
              </div>

              {/* Box 2: Contact Details */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Phone Number <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="tel"
                    disabled
                    value={phone}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      padding: '0 12px',
                      fontSize: '14px',
                      background: '#F3F4F6',
                      color: 'var(--text-secondary)',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Address <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="email"
                    placeholder="Enter Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Gender <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                    {['Male', 'Female'].map((g) => (
                      <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          style={{ accentColor: 'var(--brand-mid)' }}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Address & Pincode */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Pincode <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="tel"
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>State</label>
                    <input
                      type="text"
                      disabled
                      value={state}
                      placeholder="Auto-populated"
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        padding: '0 12px',
                        fontSize: '14px',
                        background: '#F3F4F6',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>City</label>
                    <input
                      type="text"
                      disabled
                      value={city}
                      placeholder="Auto-populated"
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        padding: '0 12px',
                        fontSize: '14px',
                        background: '#F3F4F6',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    Area {isManualArea ? '(Enter Manually)' : '(Auto-populated)'}
                  </label>
                  <input
                    type="text"
                    disabled={!isManualArea}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={isManualArea ? "Enter your area name" : "Auto-populated"}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: isManualArea ? 'white' : '#F3F4F6',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={isManualArea}
                    onChange={(e) => setIsManualArea(e.target.checked)}
                    style={{ accentColor: 'var(--brand-mid)' }}
                  />
                  Area not listed? Enter manually
                </label>
              </div>

              {/* Terms Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', lineHeight: '18px', padding: '0 4px' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ accentColor: 'var(--brand-mid)', marginTop: '3px' }}
                />
                <span>
                  I accept the{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    style={{ color: 'var(--brand-mid)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Terms of Service
                  </span>
                  {' '}and{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPrivacyModal(true);
                    }}
                    style={{ color: 'var(--brand-mid)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck color="var(--brand-accent)" size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Step 2: KYC Verification</h2>
              </div>

              {/* PAN Card Box */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>PAN Verification</h3>

                <div>
                  <input
                    type="text"
                    placeholder="Enter PAN Number (e.g. ABCDE1234F)"
                    value={panNumber}
                    disabled={isPanVerified}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Upload PAN Card Photo</span>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '110px',
                    borderRadius: '12px',
                    border: '1.5px dashed rgba(74, 14, 78, 0.2)',
                    background: panImage ? 'rgba(74, 14, 78, 0.02)' : 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'pan')}
                      style={{ display: 'none' }}
                    />
                    {panImage ? (
                      <img src={panImage} alt="PAN Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--brand-mid)' }}>
                        <Upload size={24} />
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Tap to Scan / Upload PAN</span>
                      </div>
                    )}
                  </label>
                </div>

                {!isPanOtpSent && !isPanVerified && (
                  <button
                    onClick={() => setIsPanOtpSent(true)}
                    disabled={panNumber.length !== 10}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '12px',
                      background: panNumber.length === 10 ? 'var(--brand-mid)' : '#D1D5DB',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: panNumber.length === 10 ? 'pointer' : 'default'
                    }}
                  >
                    Authorize / Get OTP
                  </button>
                )}

                {isPanOtpSent && !isPanVerified && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="password"
                      placeholder="Enter 4-digit OTP (Use 1234)"
                      value={panOtp}
                      onChange={(e) => setPanOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        padding: '0 12px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (panOtp === '1234') {
                          setIsPanVerified(true);
                          setFetchedPanName('JOHN DOE');
                          setAccountName('JOHN DOE'); // Sync placeholder name for bank holder name
                        } else {
                          alert('Invalid OTP. Use 1234 for testing.');
                        }
                      }}
                      disabled={panOtp.length !== 4}
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '12px',
                        background: panOtp.length === 4 ? 'var(--brand-dark)' : '#D1D5DB',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: panOtp.length === 4 ? 'pointer' : 'default'
                      }}
                    >
                      Verify OTP
                    </button>
                  </div>
                )}

                {isPanVerified && (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ color: 'var(--success-green)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ PAN Verified Successfully
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Name on Card: <strong>{fetchedPanName}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Identity Aadhaar Box */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>Identity Verification (Aadhaar)</h3>

                <div>
                  <input
                    type="tel"
                    placeholder="Enter Aadhaar Number"
                    value={identityNumber}
                    disabled={isIdVerified}
                    onChange={(e) => setIdentityNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Aadhaar Front</span>
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '110px',
                      borderRadius: '12px',
                      border: '1.5px dashed rgba(74, 14, 78, 0.2)',
                      background: aadhaarFrontImage ? 'rgba(74, 14, 78, 0.02)' : 'white',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'aadhaar-front')}
                        style={{ display: 'none' }}
                      />
                      {aadhaarFrontImage ? (
                        <img src={aadhaarFrontImage} alt="Aadhaar Front Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--brand-mid)' }}>
                          <Upload size={20} />
                          <span style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>Upload Front</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Aadhaar Back</span>
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '110px',
                      borderRadius: '12px',
                      border: '1.5px dashed rgba(74, 14, 78, 0.2)',
                      background: aadhaarBackImage ? 'rgba(74, 14, 78, 0.02)' : 'white',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'aadhaar-back')}
                        style={{ display: 'none' }}
                      />
                      {aadhaarBackImage ? (
                        <img src={aadhaarBackImage} alt="Aadhaar Back Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--brand-mid)' }}>
                          <Upload size={20} />
                          <span style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>Upload Back</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {!isIdOtpSent && !isIdVerified && (
                  <button
                    onClick={() => setIsIdOtpSent(true)}
                    disabled={identityNumber.length !== 12}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '12px',
                      background: identityNumber.length === 12 ? 'var(--brand-mid)' : '#D1D5DB',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: identityNumber.length === 12 ? 'pointer' : 'default'
                    }}
                  >
                    Get OTP
                  </button>
                )}

                {isIdOtpSent && !isIdVerified && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="password"
                      placeholder="Enter 4-digit OTP (Use 1234)"
                      value={idOtp}
                      onChange={(e) => setIdOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        padding: '0 12px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (idOtp === '1234') {
                          setIsIdVerified(true);
                        } else {
                          alert('Invalid OTP. Use 1234.');
                        }
                      }}
                      disabled={idOtp.length !== 4}
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '12px',
                        background: idOtp.length === 4 ? 'var(--brand-dark)' : '#D1D5DB',
                        color: 'white',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: idOtp.length === 4 ? 'pointer' : 'default'
                      }}
                    >
                      Verify OTP
                    </button>
                  </div>
                )}

                {isIdVerified && (
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ color: 'var(--success-green)', fontWeight: 'bold', fontSize: '13px' }}>
                      ✓ Identity Verified Successfully
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Landmark color="var(--brand-accent)" size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>Step 3: Financial Setup</h2>
              </div>

              {/* Financial Box */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Must match KYC Name"
                    value={accountName}
                    onChange={(e) => {
                      if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                        setAccountName(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: accountName && accountName.toUpperCase() !== fetchedPanName ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                  {accountName && accountName.toUpperCase() !== fetchedPanName && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                      Name must match KYC name: {fetchedPanName}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>IFSC Code</label>
                  <input
                    type="text"
                    placeholder="Enter 11-digit IFSC"
                    value={ifscCode}
                    onChange={(e) => handleIfscChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: ifscError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                  {ifscError && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                      {ifscError}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Bank Name</label>
                    <input
                      type="text"
                      disabled
                      value={bankName}
                      placeholder="Auto-populated"
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        padding: '0 12px',
                        fontSize: '14px',
                        background: '#F3F4F6',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Branch</label>
                    <input
                      type="text"
                      disabled
                      value={branchName}
                      placeholder="Auto-populated"
                      style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        padding: '0 12px',
                        fontSize: '14px',
                        background: '#F3F4F6',
                        color: 'var(--text-secondary)',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Account Number</label>
                  <input
                    type="password"
                    placeholder="Enter Bank Account Number"
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: accountNumberError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                  {accountNumberError && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                      {accountNumberError}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Confirm Account Number</label>
                  <input
                    type="text"
                    placeholder="Re-enter Account Number"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: confirmAccountNumber && confirmAccountNumber !== accountNumber ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '4px'
                    }}
                  />
                  {confirmAccountNumber && confirmAccountNumber !== accountNumber && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                      Account numbers do not match
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <div style={{ color: 'var(--error-red)', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', margin: '12px 0' }}>
            {saveError}
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '24px 0 12px 0' }}>
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  height: '52px',
                  borderRadius: '12px',
                  border: '1px solid var(--brand-dark)',
                  color: 'var(--brand-dark)',
                  background: 'transparent',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '15px'
                }}
              >
                Previous
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={
                isSaving ||
                dobError !== null ||
                weddingDateError !== null ||
                (currentStep === 1 && !isStep1Valid()) ||
                (currentStep === 2 && (!isPanVerified || !isIdVerified)) ||
                (currentStep === 3 &&
                  (!accountName ||
                    !bankName ||
                    !accountNumber ||
                    ifscError !== null ||
                    accountNumberError !== null ||
                    accountNumber !== confirmAccountNumber ||
                    accountName.toUpperCase() !== fetchedPanName))
              }
              style={{
                flex: 1,
                height: '52px',
                borderRadius: '12px',
                background: 'var(--gradient-brand)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (
                  isSaving ||
                  dobError !== null ||
                  weddingDateError !== null ||
                  (currentStep === 1 && !isStep1Valid()) ||
                  (currentStep === 2 && (!isPanVerified || !isIdVerified)) ||
                  (currentStep === 3 &&
                    (!accountName ||
                      !bankName ||
                      !accountNumber ||
                      ifscError !== null ||
                      accountNumberError !== null ||
                      accountNumber !== confirmAccountNumber ||
                      accountName.toUpperCase() !== fetchedPanName))
                ) ? 0.5 : 1
              }}
            >
              {isSaving ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                currentStep === totalSteps ? 'Finish' : 'Next'
              )}
            </button>
          </div>

          {currentStep > 1 && (
            <button
              onClick={handleSkip}
              disabled={isSaving}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px dashed rgba(0,0,0,0.15)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Skip this step
            </button>
          )}
        </div>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-dark)' }}>Terms of Service</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '13px', lineHeight: '20px', color: 'var(--text-secondary)' }}>
              <p>Welcome to Aishwaryam. These Terms of Service govern your use of the Aishwaryam Digital Metal Platform and services.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>1. Savings Scheme</h4>
              <p>Aishwaryam provides metal accumulation chits. Installment savings plan starting at ₹100 allows users to save in pure 24K gold and 99.9% silver. Instalments are calculated at live market gold rates at the time of transaction.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>2. Physical Backing</h4>
              <p>Every purchase is backed by physical gold/silver stored securely in independent insured third-party vault lockers.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>3. Maturity and Redemptions</h4>
              <p>Upon scheme maturity, the accumulated metal weight can be exchanged for physical jewelry at designated partner showrooms, or shipped as physical bullion coins, or sold back for cash payouts directly into the user's linked bank account.</p>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #ECECEC', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: 'var(--brand-dark)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-dark)' }}>Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '13px', lineHeight: '20px', color: 'var(--text-secondary)' }}>
              <p>We values your privacy and is committed to protecting your personal information.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>1. Data Collection</h4>
              <p>We collect personal information such as Name, Phone Number, Email, Date of Birth, and Nominee details during registration. For KYC verification, documents like Aadhaar Card and PAN Card are collected.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>2. Data Encryption and Security</h4>
              <p>All user profiles, bank account details, and KYC scanned images are encrypted and securely stored. We use industry-standard encryption protocols to protect your transactions and identity data.</p>
              <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>3. Data Sharing</h4>
              <p>We do not sell or lease your personal information to third parties. Data is shared with bank transfer partners, custodian vaults, and government regulatory agencies strictly for transactions compliance.</p>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #ECECEC', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: 'var(--brand-dark)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
