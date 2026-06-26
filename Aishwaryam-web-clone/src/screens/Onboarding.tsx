import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager, OnboardingStage } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Calendar, ShieldCheck, CheckCircle, Upload } from 'lucide-react';
import { useTranslation } from '../utils/translation';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { refreshData } = useApp();
  const { t, lang } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const getEighteenYearsAgoDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  };
  const maxDobStr = getEighteenYearsAgoDate();

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
  const [isManualArea] = useState(SessionManager.getPartialIsManualArea() || false);
  const [termsAccepted, setTermsAccepted] = useState(SessionManager.getPartialTermsAccepted() || false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [dbTerms, setDbTerms] = useState<string | null>(null);
  const [dbPrivacy, setDbPrivacy] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await ApiClient.get('api/User/config');
        if (res.data) {
          const terms = res.data.termsAndConditionsUrl;
          const privacy = res.data.privacyPolicyUrl;
          if (terms && !terms.startsWith('http')) {
            setDbTerms(terms);
          }
          if (privacy && !privacy.startsWith('http')) {
            setDbPrivacy(privacy);
          }
        }
      } catch (err) {
        console.error('Failed to load terms/privacy from config', err);
      }
    };
    fetchConfig();
  }, []);

  // --- Step 2 State Variables ---
  const [showKycPendingModal, setShowKycPendingModal] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState<string | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);

  const handlePanNumberChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    
    // Check character position rules
    let isValidChar = true;
    for (let i = 0; i < uppercaseVal.length; i++) {
      const char = uppercaseVal[i];
      if (i < 5 && !/[A-Z]/.test(char)) isValidChar = false;
      if (i >= 5 && i < 9 && !/[0-9]/.test(char)) isValidChar = false;
      if (i === 9 && !/[A-Z]/.test(char)) isValidChar = false;
    }

    if (isValidChar || uppercaseVal === '') {
      setPanNumber(uppercaseVal);
      if (uppercaseVal.length === 10) {
        setPanError(null);
      } else {
        setPanError('PAN must be exactly 10 characters (e.g. ABCDE1234F)');
      }
    } else {
      // Show position-specific errors
      const index = uppercaseVal.length - 1;
      if (index < 5) {
        setPanError(`Character at position ${index + 1} must be an alphabet (A-Z)`);
      } else if (index >= 5 && index < 9) {
        setPanError(`Character at position ${index + 1} must be a number (0-9)`);
      } else if (index === 9) {
        setPanError(`Character at position 10 must be an alphabet (A-Z)`);
      }
    }
  };



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
      if (!isWedding) {
        const age = calculateAge(input);
        if (age === null || age < 18) {
          setDobError('You must be at least 18 years old');
          return;
        }
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
    const age = calculateAge(dob);
    const dobValid = isValidDateString(dob) && dobError === null && age !== null && age >= 18;
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
        // Submit Aadhaar Front
        await ApiClient.post('api/Kyc/submit', {
          userId,
          documentType: 'AADHAAR_FRONT',
          documentNumber: aadhaarNumber.replace(/\s/g, ''),
          documentUrl: aadhaarFrontImage || 'https://placeholder.url/aadhaar-front.jpg'
        });
        // Submit Aadhaar Back
        await ApiClient.post('api/Kyc/submit', {
          userId,
          documentType: 'AADHAAR_BACK',
          documentNumber: aadhaarNumber.replace(/\s/g, ''),
          documentUrl: aadhaarBackImage || 'https://placeholder.url/aadhaar-back.jpg'
        });
        // Update user KYC level to PENDING
        await ApiClient.post('api/Kyc/update-status', {
          userId,
          newLevel: 'PENDING'
        });
        await refreshData();
        
        // Show pending modal for 3 seconds before navigating to dashboard
        setShowKycPendingModal(true);
        setTimeout(async () => {
          setShowKycPendingModal(false);
          SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
          await refreshData();
          navigate('/dashboard');
        }, 3000);
      } catch (err: any) {
        // Fallback for network/test error
        setShowKycPendingModal(true);
        setTimeout(async () => {
          setShowKycPendingModal(false);
          SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
          await refreshData();
          navigate('/dashboard');
        }, 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSkip = async () => {
    if (currentStep === 2) {
      SessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED);
      navigate('/dashboard');
      refreshData().catch(err => console.error("Error refreshing data:", err));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--surface-light)' }}>
      {/* Header */}
      <div className="app-header-bar" style={{
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
          <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-poppins)' }}>
            Aishwaryam · {lang === 'ta' ? `படி ${currentStep} / ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
          </span>
        </div>
      </div>

      <div className="onboarding-form-container" style={{ flex: 1, overflowY: 'auto', padding: '5px 20px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Progress Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0px 0 16px 0' }}>
          {[1, 2].map((num) => (
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
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('step_1_basic_profile')}</h2>
              </div>

              {/* Box 1: Core Details */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('full_name_label')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder={t('enter_full_name')}
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
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('dob_placeholder')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      value={convertToInputDateFormat(dob)}
                      min="1926-06-06"
                      max={maxDobStr}
                      onKeyDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        try {
                          (e.target as any).showPicker();
                        } catch (err) {}
                      }}
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
                      {lang === 'ta' ? 'வயது' : 'Age'}: {calculateAge(dob)} {lang === 'ta' ? 'ஆண்டுகள்' : 'years'}
                    </span>
                  )}
                  {dobError && <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>{dobError}</span>}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('nominee_label')}</label>
                  <input
                    type="text"
                    placeholder={t('enter_nominee_name')}
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
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{t('marital_status')}: {isMarried ? t('marital_married') : t('marital_single')}</span>
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
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('wedding_date_placeholder')}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={convertToInputDateFormat(weddingDate)}
                        min={dob ? convertToInputDateFormat(dob) : "1940-01-01"}
                        max={todayStr}
                        onKeyDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          try {
                            (e.target as any).showPicker();
                          } catch (err) {}
                        }}
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
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('phone_number_label')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
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
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('email_address_label')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="email"
                    placeholder={t('enter_email_address')}
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
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('gender_label')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
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
                        {g === 'Male' ? t('gender_male') : t('gender_female')}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Address & Pincode */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('pincode_label')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t('enter_pincode')}
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
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('state_label')}</label>
                    <input
                      type="text"
                      disabled
                      value={state}
                      placeholder={t('auto_populated')}
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
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('city_label')}</label>
                    <input
                      type="text"
                      disabled
                      value={city}
                      placeholder={t('auto_populated')}
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
                    {t('area_label')} <span style={{ color: 'var(--error-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder={t('enter_area_name')}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'white',
                      marginTop: '4px'
                    }}
                  />
                </div>
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
                  {t('accept_terms_prefix')}{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    style={{ color: 'var(--brand-mid)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {t('terms_of_service')}
                  </span>
                  {t('accept_terms_and')}{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPrivacyModal(true);
                    }}
                    style={{ color: 'var(--brand-mid)', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {t('privacy_policy')}
                  </span>
                  {lang === 'ta' ? ' ஆகியவற்றை ஒப்புக்கொள்கிறேன்.' : '.'}
                </span>
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck color="var(--brand-accent)" size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('step_2_kyc_verification')}</h2>
              </div>

              {/* PAN Verification */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('pan_verification')}</h3>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('pan_card_number')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="text"
                    placeholder={t('enter_pan_placeholder')}
                    value={panNumber}
                    onChange={(e) => handlePanNumberChange(e.target.value)}
                    maxLength={10}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '8px',
                      border: panError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '6px',
                      background: 'white',
                      fontFamily: 'var(--font-poppins)',
                      textTransform: 'uppercase'
                    }}
                  />
                  {panError && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {panError}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('upload_pan_photo')} <span style={{ color: 'var(--error-red)' }}>*</span></span>
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
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{t('tap_scan_upload_pan')}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Aadhaar Verification */}
              <div className="glass-card" style={{ borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('identity_verification_aadhaar')}</h3>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('aadhaar_card_number')} <span style={{ color: 'var(--error-red)' }}>*</span></label>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder={t('enter_aadhaar_placeholder')}
                    value={aadhaarNumber}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                      let formatted = '';
                      for (let i = 0; i < raw.length; i++) {
                        if (i === 4 || i === 8) {
                          formatted += ' ';
                        }
                        formatted += raw[i];
                      }
                      setAadhaarNumber(formatted);
                      if (raw.length === 12) {
                        setAadhaarError(null);
                      } else {
                        setAadhaarError(lang === 'ta' ? 'ஆதார் எண் 12 இலக்கங்களாக இருக்க வேண்டும்' : 'Aadhaar number must be exactly 12 digits');
                      }
                    }}
                    maxLength={14}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '8px',
                      border: aadhaarError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)',
                      padding: '0 12px',
                      fontSize: '14px',
                      outline: 'none',
                      marginTop: '6px',
                      background: 'white',
                      fontFamily: 'var(--font-poppins)'
                    }}
                  />
                  {aadhaarError && (
                    <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {aadhaarError}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('upload_aadhaar_front')} <span style={{ color: 'var(--error-red)' }}>*</span></span>
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
                          <span style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>{t('tap_scan_upload_front')}</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('upload_aadhaar_back')} <span style={{ color: 'var(--error-red)' }}>*</span></span>
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
                          <span style={{ fontSize: '11px', fontWeight: '500', textAlign: 'center' }}>{t('tap_scan_upload_back')}</span>
                        </div>
                      )}
                    </label>
                  </div>
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
                {lang === 'ta' ? 'முந்தைய' : 'Previous'}
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={
                isSaving ||
                dobError !== null ||
                weddingDateError !== null ||
                (currentStep === 1 && !isStep1Valid()) ||
                (currentStep === 2 && (
                  !panImage || !aadhaarFrontImage || !aadhaarBackImage ||
                  panNumber.length !== 10 || panError !== null ||
                  aadhaarNumber.replace(/\s/g, '').length !== 12 || aadhaarError !== null
                ))
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
                  (currentStep === 2 && (
                    !panImage || !aadhaarFrontImage || !aadhaarBackImage ||
                    panNumber.length !== 10 || panError !== null ||
                    aadhaarNumber.replace(/\s/g, '').length !== 12 || aadhaarError !== null
                  ))
                ) ? 0.5 : 1
              }}
            >
              {isSaving ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                currentStep === totalSteps ? (lang === 'ta' ? 'முடிக்கவும்' : 'Finish') : (lang === 'ta' ? 'அடுத்து' : 'Next')
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
              {lang === 'ta' ? 'இந்தப்படியைத் தவிர்க்கவும்' : 'Skip this step'}
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
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-dark)' }}>{t('terms_of_service')}</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '13px', lineHeight: '20px', color: 'var(--text-secondary)' }}>
              {dbTerms ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{dbTerms}</div>
              ) : (
                <>
                  <p>{t('terms_welcome_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('savings_scheme_terms')}</h4>
                  <p>{t('terms_savings_scheme_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('physical_backing_terms')}</h4>
                  <p>{t('terms_physical_backing_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('maturity_redemptions_terms')}</h4>
                  <p>{t('terms_maturity_redemptions_desc')}</p>
                </>
              )}
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
                {t('btn_close')}
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
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--brand-dark)' }}>{t('privacy_policy_title')}</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '13px', lineHeight: '20px', color: 'var(--text-secondary)' }}>
              {dbPrivacy ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{dbPrivacy}</div>
              ) : (
                <>
                  <p>{t('privacy_welcome_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('data_collection_policy')}</h4>
                  <p>{t('privacy_data_collection_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('data_encryption_policy')}</h4>
                  <p>{t('privacy_data_encryption_desc')}</p>
                  <h4 style={{ color: 'var(--brand-dark)', margin: '14px 0 6px 0', fontSize: '14px' }}>{t('data_sharing_policy')}</h4>
                  <p>{t('privacy_data_sharing_desc')}</p>
                </>
              )}
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
                {t('btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Pending Modal */}
      {showKycPendingModal && (
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
            borderRadius: '24px',
            width: '100%',
            maxWidth: '360px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--amber-dim, rgba(243, 156, 18, 0.15))',
              color: 'var(--amber, #f39c12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{t('kyc_under_verification')}</h3>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: 'var(--text-secondary, #5c5d64)' }}>
              {t('kyc_duration_desc')}
            </p>
            <div className="spinner" style={{
              width: '24px',
              height: '24px',
              border: '3px solid var(--brand-mid)',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginTop: '8px'
            }} />
          </div>
        </div>
      )}
    </div>
  );
};
