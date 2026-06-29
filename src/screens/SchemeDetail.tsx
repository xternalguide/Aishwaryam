import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SessionManager } from '../utils/SessionManager';
import { ApiClient } from '../utils/ApiClient';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../utils/translation';
import { ArrowLeft, ShieldAlert, Award, X, Calculator, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Checkout } from 'capacitor-razorpay';

interface AvailableScheme {
  id: string;
  planName: string;
  description: string;
  installmentAmountPaise: number;
  totalInstallments: number;
  frequency: string;
  bonusConfigJson: string | null;
  customSectionsJson: string | null;
  durationUnit?: string;
}

interface MilestoneItem {
  name: string;
  targetDay: number;
  bonusPercentage: number;
  isAchieved: boolean;
}

export const SchemeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { schemeId } = useParams<{ schemeId: string }>();
  const { t, lang, autoT } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [scheme, setScheme] = useState<AvailableScheme | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [joinAmount, setJoinAmount] = useState('100');
  const [joinType, setJoinType] = useState<'RUPEES' | 'GRAMS'>('RUPEES');
  const [userSchemeId, setUserSchemeId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isJoinFormCompleted, setIsJoinFormCompleted] = useState(false);

  // Active chit progress states
  const [installmentsPaid, setInstallmentsPaid] = useState(0);
  const [accumulatedGoldMg, setAccumulatedGoldMg] = useState(0);
  const [totalSavingsAddedPaise, setTotalSavingsAddedPaise] = useState(0);
  const [totalBonusEarnedPaise, setTotalBonusEarnedPaise] = useState(0);
  const [totalBonusGoldMg, setTotalBonusGoldMg] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [remainingDaysForScheme, setRemainingDaysForScheme] = useState(0);
  const [ledger, setLedger] = useState<any[]>([]);
  const [joinedAt, setJoinedAt] = useState<string>('');
  const [maturityDate, setMaturityDate] = useState<string>('');
  const [schemeStatus, setSchemeStatus] = useState<string>('');

  // UI Interactive States
  const [openTabs, setOpenTabs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (userSchemeId) {
      ApiClient.get(`api/Scheme/${userSchemeId}/ledger`)
        .then(res => {
          if (res.data) {
            setLedger(res.data);
          }
        })
        .catch(err => console.error('Error fetching scheme ledger:', err));
    } else {
      setLedger([]);
    }
  }, [userSchemeId]);

  // General configuration/metadata
  const [kycLevel, setKycLevel] = useState('BASIC');
  const [isProcessing, setIsProcessing] = useState(false);

  // Consume from AppContext
  const {
    availableSchemes,
    activeSchemes,
    profile,
    livePrice,
    refreshData
  } = useApp();

  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'JOIN' | 'PAY' | null>(null);

  // Nominee form fields
  const [setupNomineeName, setSetupNomineeName] = useState('');
  const [setupNomineePhone, setSetupNomineePhone] = useState('');
  const [setupNomineeRelationship, setSetupNomineeRelationship] = useState('');

  // Address form fields
  const [setupState, setSetupState] = useState('');
  const [setupCity, setSetupCity] = useState('');
  const [setupStreet, setSetupStreet] = useState('');
  const [setupPincode, setSetupPincode] = useState('');
  const [setupPinError, setSetupPinError] = useState<string | null>(null);

  const RELATIONSHIPS = ["Father", "Mother", "Wife", "Husband", "Son", "Daughter", "Brother", "Guardian"];
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

  useEffect(() => {
    const fetchAddresses = async () => {
      const userId = SessionManager.getUserId();
      if (!userId) return;
      try {
        const res = await ApiClient.get(`api/Address/user/${userId}`);
        if (res.data) {
          setUserAddresses(res.data);
        }
      } catch (err) {
        console.error("Failed to load addresses in SchemeDetail", err);
      }
    };
    fetchAddresses();
  }, [profile]);

  // Back button dismiss registers for hardware back button on Android
  useEffect(() => {
    if (showJoinSheet) {
      const dismiss = () => setShowJoinSheet(false);
      (window as any).activeModals = (window as any).activeModals || [];
      (window as any).activeModals.push(dismiss);
      return () => {
        (window as any).activeModals = ((window as any).activeModals || []).filter((d: any) => d !== dismiss);
      };
    }
  }, [showJoinSheet]);

  useEffect(() => {
    if (showSuccessPopup) {
      const dismiss = () => setShowSuccessPopup(false);
      (window as any).activeModals = (window as any).activeModals || [];
      (window as any).activeModals.push(dismiss);
      return () => {
        (window as any).activeModals = ((window as any).activeModals || []).filter((d: any) => d !== dismiss);
      };
    }
  }, [showSuccessPopup]);

  useEffect(() => {
    if (showSetupModal) {
      const dismiss = () => setShowSetupModal(false);
      (window as any).activeModals = (window as any).activeModals || [];
      (window as any).activeModals.push(dismiss);
      return () => {
        (window as any).activeModals = ((window as any).activeModals || []).filter((d: any) => d !== dismiss);
      };
    }
  }, [showSetupModal]);

  const handleSetupPincodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setSetupPincode(numericValue);

    if (numericValue.length >= 3) {
      const prefix = numericValue.substring(0, 3);
      let foundCity = '';
      let foundState = '';
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
        setSetupCity(foundCity);
        setSetupState(foundState);
        setSetupPinError(null);
      }
    }

    if (numericValue.length > 0) {
      if (numericValue.length < 6) {
        setSetupPinError("PIN Code must be exactly 6 digits.");
      } else {
        if (setupCity) {
          const prefixes = PIN_PREFIXES[setupCity] || [];
          const isValidPrefix = prefixes.some(prefix => numericValue.startsWith(prefix));
          if (!isValidPrefix) {
            setSetupPinError(`PIN Code must start with ${prefixes.join(', ')} for ${setupCity}.`);
          } else {
            setSetupPinError(null);
          }
        } else {
          setSetupPinError(null);
        }
      }
    } else {
      setSetupPinError(null);
    }
  };

  const parseMilestones = (
    bonusConfigJson: string | null,
    activeDays: number
  ): MilestoneItem[] => {
    if (!bonusConfigJson) {
      return [
        { name: 'Join Bonus', targetDay: 1, bonusPercentage: 7.5, isAchieved: activeDays >= 1 },
        { name: 'Month 3 Milestone', targetDay: 90, bonusPercentage: 5.5, isAchieved: activeDays >= 90 },
        { name: 'Month 6 Milestone', targetDay: 180, bonusPercentage: 3.5, isAchieved: activeDays >= 180 },
        { name: 'Maturity Bonus', targetDay: 330, bonusPercentage: 1.5, isAchieved: activeDays >= 330 }
      ];
    }

    try {
      const config = JSON.parse(bonusConfigJson);
      
      if (Array.isArray(config)) {
        return config.map((tier: any) => {
          const start = tier.startDay ?? tier.StartDay ?? 0;
          const end = tier.endDay ?? tier.EndDay ?? 0;
          const pct = tier.bonusPercentage ?? tier.BonusPercentage ?? 0;
          return {
            name: `${t('payment_day')} ${start} - ${end}`,
            targetDay: end,
            bonusPercentage: pct,
            isAchieved: activeDays >= start
          };
        });
      }

      if (typeof config === 'object') {
        const startPct = config.startingBonusPercent ?? 7.5;
        const msList = config.milestones || [];
        const list: MilestoneItem[] = [
          { name: t('loyalty_bonus_structure'), targetDay: 1, bonusPercentage: startPct, isAchieved: activeDays >= 1 }
        ];
        
        msList.forEach((ms: any) => {
          if (ms.days !== undefined) {
            list.push({
              name: `${t('day_number')} ${ms.days} ${t('milestone_target')}`,
              targetDay: ms.days,
              bonusPercentage: ms.bonusPercent || 0,
              isAchieved: activeDays >= ms.days
            });
          } else if (ms.installment !== undefined) {
            const targetInst = ms.installment;
            const label = `${t('installment')} ${targetInst} ${t('milestone_target')}`;
            const isMonthAchieved = installmentsPaid >= targetInst;
            list.push({
              name: label,
              targetDay: targetInst,
              bonusPercentage: ms.bonusPercent || 0,
              isAchieved: isMonthAchieved
            });
          }
        });
        return list;
      }
    } catch (e) {
      console.error('Error parsing milestones:', e);
    }

    return [];
  };

  useEffect(() => {
    // 1. If not loaded, run refresh
    if (availableSchemes.length === 0) {
      refreshData();
      return;
    }
    
    setIsLoading(true);
    
    // 3. Find available master chit
    let matching = availableSchemes.find((s) => s.id === schemeId);

    // 2. Fetch scheme dashboards to look for active chits
    const userActiveScheme = activeSchemes.find(
      (s: any) => s.schemeId === schemeId || s.planName === matching?.planName || schemeId === 'active'
    );

    if (!matching && userActiveScheme) {
      matching = availableSchemes.find((s) => s.planName === userActiveScheme.planName);
    }

    if (matching) {
      setScheme(matching);
    }

    if (userActiveScheme) {
      setIsActive(true);
      setUserSchemeId(userActiveScheme.schemeId);
      setInstallmentsPaid(userActiveScheme.installmentsPaid);
      setAccumulatedGoldMg(userActiveScheme.accumulatedGoldMg || 0);
      setTotalSavingsAddedPaise(userActiveScheme.totalSavingsAddedPaise || 0);
      setTotalBonusEarnedPaise(userActiveScheme.totalBonusEarnedPaise || 0);
      setTotalBonusGoldMg(userActiveScheme.totalBonusGoldMg || 0);
      setAutoPayEnabled(userActiveScheme.autoPayEnabled || false);
      setRemainingDaysForScheme(userActiveScheme.remainingDaysForScheme || 0);
      setJoinedAt(userActiveScheme.joinedAt || userActiveScheme.JoinedAt || '');
      setMaturityDate(userActiveScheme.maturityDate || userActiveScheme.MaturityDate || '');
      setSchemeStatus(userActiveScheme.status || userActiveScheme.Status || '');
      setIsJoinFormCompleted(userActiveScheme.isJoinFormCompleted || userActiveScheme.IsJoinFormCompleted || false);

      // Setup milestones
      setMilestones(parseMilestones(
        matching?.bonusConfigJson || null,
        userActiveScheme.schemeDayNumber
      ));
    } else {
      setIsActive(false);
      setUserSchemeId(null);
      setIsJoinFormCompleted(false);
    }

    // 4. Fetch profile for KYC verification checks
    if (profile) {
      setKycLevel(profile.kycLevel || 'BASIC');
    }
    
    setIsLoading(false);
  }, [schemeId, availableSchemes, activeSchemes, profile]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const launchRazorpayCheckout = async (amountPaise: number, isJoiningFlow: boolean, goldWeightGrams: number, customSchemeId?: string | null) => {
    if (!scheme) return;
    setIsProcessing(true);
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';

      // 1. Create payment order on backend
      const res = await ApiClient.post('api/Payment/create-order', {
        userId,
        amountPaise,
        userSchemeId: customSchemeId || userSchemeId || null
      }, { timeout: 60000 });

      if (res.data) {
        const orderData = res.data;
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Aishwaryam Digital Gold',
          description: isJoiningFlow ? `Join ${scheme.planName}` : `Pay Installment - ${scheme.planName}`,
          order_id: orderData.orderId,
          prefill: {
            name: profile?.fullName || '',
            email: profile?.email || '',
            contact: profile?.phoneNumber || ''
          },
          notes: {
            userId: userId,
            userName: profile?.fullName || '',
            schemeId: customSchemeId || userSchemeId || '',
            schemeName: scheme.planName,
            investmentAmount: (amountPaise / 100).toString(),
            transactionReference: orderData.orderId
          },
          theme: {
            color: '#4A0E4E'
          }
        };

        if (Capacitor.isNativePlatform()) {
          // ─── Capacitor Native SDK Integration ───
          try {
            const result = (await Checkout.open(options as any)) as any;
            const rzpResponse = typeof result.response === 'string'
              ? JSON.parse(result.response)
              : result.response;

            // 2. Verify payment order on backend (with extended 60-second timeout)
            setIsProcessing(true);
            const verifyRes = await ApiClient.post('api/Payment/verify', {
              userId,
              razorpayOrderId: orderData.orderId,
              razorpayPaymentId: rzpResponse.razorpay_payment_id,
              razorpaySignature: rzpResponse.razorpay_signature
            }, { timeout: 60000 });

            if (verifyRes.data && verifyRes.data.success) {
              const receiptJson = JSON.stringify({
                transactionId: orderData.orderId,
                type: 'BUY',
                amountPaise,
                goldWeightMg: verifyRes.data.goldWeightMg || Math.round(goldWeightGrams * 1000),
                createdAt: new Date().toISOString(),
                rateSource: 'Live',
                schemeName: scheme.planName
              });
              refreshData();
              setShowJoinSheet(false);
              navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
            } else {
              alert(verifyRes.data.message || 'Payment verification failed.');
            }
          } catch (error: any) {
            console.error('Native payment failed:', error);
            const errorDescription = error.description || error.message || 'Payment was cancelled or failed.';
            
            // Log failure to DB asynchronously
            ApiClient.post('api/Payment/log-failure', {
              userId,
              orderId: orderData.orderId,
              paymentId: error.metadata?.payment_id || '',
              amountPaise,
              errorCode: error.code || 'PAYMENT_FAILED',
              errorMessage: errorDescription
            }).catch(() => {});

            const errorJson = JSON.stringify({
              schemeName: scheme.planName,
              amountPaise,
              errorMessage: errorDescription,
              orderId: orderData.orderId
            });
            navigate(`/payment-failed/${encodeURIComponent(errorJson)}`);
          } finally {
            setIsProcessing(false);
          }
        } else {
          // ─── Standard Web Checkout Fallback ───
          // 1. Load Razorpay script
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert('Failed to load Razorpay SDK. Please check your network connection.');
            setIsProcessing(false);
            return;
          }

          const webOptions = {
            ...options,
            handler: async function (response: any) {
              setIsProcessing(true);
              try {
                // 3. Verify payment order on backend (with extended 60-second timeout)
                const verifyRes = await ApiClient.post('api/Payment/verify', {
                  userId,
                  razorpayOrderId: orderData.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                }, { timeout: 60000 });

                if (verifyRes.data && verifyRes.data.success) {
                  const receiptJson = JSON.stringify({
                    transactionId: orderData.orderId,
                    type: 'BUY',
                    amountPaise,
                    goldWeightMg: verifyRes.data.goldWeightMg || Math.round(goldWeightGrams * 1000),
                    createdAt: new Date().toISOString(),
                    rateSource: 'Live',
                    schemeName: scheme.planName
                  });
                  refreshData();
                  setShowJoinSheet(false);
                  navigate(`/payment-success/${encodeURIComponent(receiptJson)}`);
                } else {
                  alert(verifyRes.data.message || 'Payment verification failed.');
                }
              } catch (e: any) {
                alert('Verification failed: ' + (e.response?.data?.message || e.message));
              } finally {
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
                const errorJson = JSON.stringify({
                  schemeName: scheme.planName,
                  amountPaise,
                  errorMessage: 'Payment was cancelled by the user.',
                  orderId: orderData.orderId
                });
                // Log failure to DB asynchronously
                ApiClient.post('api/Payment/log-failure', {
                  userId,
                  orderId: orderData.orderId,
                  paymentId: '',
                  amountPaise,
                  errorCode: 'BAD_REQUEST_ERROR',
                  errorMessage: 'Payment dismissed by user'
                }).catch(() => {});
                
                navigate(`/payment-failed/${encodeURIComponent(errorJson)}`);
              }
            }
          };

          const rzp = new (window as any).Razorpay(webOptions);
          
          rzp.on('payment.failed', async function (response: any) {
            setIsProcessing(false);
            try {
              await ApiClient.post('api/Payment/log-failure', {
                userId,
                orderId: orderData.orderId,
                paymentId: response.error?.metadata?.payment_id || '',
                amountPaise,
                errorCode: response.error?.code || 'PAYMENT_FAILED',
                errorMessage: response.error?.description || 'Payment failed or cancelled'
              });
            } catch (e) {
              console.error('Error logging payment failure:', e);
            }

            const errorJson = JSON.stringify({
              schemeName: scheme.planName,
              amountPaise,
              errorMessage: response.error?.description || 'Payment was cancelled or failed.',
              orderId: orderData.orderId
            });
            navigate(`/payment-failed/${encodeURIComponent(errorJson)}`);
          });

          rzp.open();
        }
      }
    } catch (err: any) {
      alert('Error launching checkout: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleInitiatePayment = () => {
    if (!isJoinFormCompleted) {
      setSetupNomineeName(profile?.nomineeName || '');
      setSetupNomineePhone(profile?.nomineePhoneNumber || '');
      setSetupNomineeRelationship(profile?.nomineeRelationship || '');
 
      if (userAddresses && userAddresses.length > 0) {
        const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
        setSetupState(defaultAddr.state || '');
        setSetupCity(defaultAddr.city || '');
        setSetupStreet(defaultAddr.streetAddress || defaultAddr.street || '');
        setSetupPincode(defaultAddr.pincode || '');
      } else {
        setSetupState('');
        setSetupCity('');
        setSetupStreet('');
        setSetupPincode('');
      }
 
      setPendingAction('PAY');
      setShowSetupModal(true);
      return;
    }
 
    setShowJoinSheet(true);
  };

  const handleJoinScheme = async () => {
    if (!scheme) return;
    if (kycLevel === 'BASIC') {
      alert(t('kyc_basic_block'));
      navigate('/onboarding');
      return;
    }
    if (kycLevel === 'PENDING') {
      alert(t('kyc_pending_block'));
      return;
    }
    if (kycLevel === 'REJECTED') {
      alert(t('kyc_rejected_block'));
      return;
    }

    setIsProcessing(true);
    try {
      const joinRes = await ApiClient.post('api/Scheme/join', {
        userId: SessionManager.getUserId(),
        schemeMasterId: scheme.id
      });

      if (joinRes.data && (joinRes.data.success || joinRes.data.Success)) {
        const newSchemeId = joinRes.data.schemeId || joinRes.data.SchemeId;
        setUserSchemeId(newSchemeId);
        await refreshData();
        setShowSuccessPopup(true);
      } else {
        alert(joinRes.data?.message || 'Failed to join scheme.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join scheme.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSetup = async () => {
    const userId = SessionManager.getUserId();
    if (!userId) return;
    
    const hasAddress = userAddresses && userAddresses.length > 0;
    setIsProcessing(true);
    
    try {
      // 1. Save nominee details
      await ApiClient.put(`api/User/profile/${userId}`, {
        nomineeName: setupNomineeName,
        nomineePhoneNumber: setupNomineePhone,
        nomineeRelationship: setupNomineeRelationship
      });

      // 2. Save address if missing
      if (!hasAddress) {
        await ApiClient.post(`api/Address/add`, {
          userId,
          state: setupState,
          city: setupCity,
          streetAddress: setupStreet,
          pincode: setupPincode,
          isDefault: true
        });
      }

      // Refresh context profile and local address list
      await refreshData();
      
      // Reload user addresses list
      const res = await ApiClient.get(`api/Address/user/${userId}`);
      if (res.data) {
        setUserAddresses(res.data);
      }

      // 3. Proceed to the pending action
      if (pendingAction === 'JOIN') {
        const joinRes = await ApiClient.post('api/Scheme/join', {
          userId,
          schemeMasterId: scheme!.id,
          nomineeName: setupNomineeName,
          nomineePhone: setupNomineePhone,
          nomineeRelationship: setupNomineeRelationship,
          state: setupState,
          city: setupCity,
          streetAddress: setupStreet,
          pincode: setupPincode
        });

        if (joinRes.data && (joinRes.data.success || joinRes.data.Success)) {
          const newSchemeId = joinRes.data.schemeId || joinRes.data.SchemeId;
          setUserSchemeId(newSchemeId);
          await refreshData();
          setShowSetupModal(false);
          setShowSuccessPopup(true);
        } else {
          alert(joinRes.data?.message || 'Failed to join scheme.');
        }
      } else if (pendingAction === 'PAY') {
        if (userSchemeId) {
          const submitRes = await ApiClient.post(`api/Scheme/${userSchemeId}/submit-form`, {
            userId,
            nomineeName: setupNomineeName,
            nomineePhone: setupNomineePhone,
            nomineeRelationship: setupNomineeRelationship,
            state: setupState,
            city: setupCity,
            streetAddress: setupStreet,
            pincode: setupPincode
          });
 
          if (submitRes.data && (submitRes.data.success || submitRes.data.Success)) {
            setIsJoinFormCompleted(true);
            await refreshData();
            setShowSetupModal(false);
            setShowJoinSheet(true);
          } else {
            alert(submitRes.data?.message || 'Failed to save scheme join form.');
          }
        } else {
          setShowSetupModal(false);
          setShowJoinSheet(true);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayJoinPlan = async () => {
    if (!scheme) return;
    if (kycLevel === 'BASIC') {
      alert(t('kyc_basic_block'));
      navigate('/onboarding');
      return;
    }
    if (kycLevel === 'PENDING') {
      alert(t('kyc_pending_block'));
      return;
    }
    if (kycLevel === 'REJECTED') {
      alert(t('kyc_rejected_block'));
      return;
    }
    const parsedVal = parseFloat(joinAmount) || 0;
    if (parsedVal <= 0) return;

    const goldPrice22K = livePrice?.price22KPaise || 701000;
    let amountPaise = 0;
    let fallbackGrams = 0;

    if (joinType === 'RUPEES') {
      amountPaise = Math.round(parsedVal * 100);
      fallbackGrams = (parsedVal / 1.03 * 1.075 * 100) / goldPrice22K;
    } else {
      const baseMetalVal = (parsedVal * goldPrice22K) / 100;
      amountPaise = Math.round(baseMetalVal * 1.03);
      fallbackGrams = parsedVal * 1.075;
    }

    if (amountPaise < 10000) {
      setValidationError('Minimum investment amount is ₹100.');
      return;
    }

    setIsProcessing(true);
    try {
      const userId = SessionManager.getUserId() || 'user-id-999';

      if (userSchemeId) {
        // Already enrolled! Just pay directly
        await launchRazorpayCheckout(amountPaise, false, fallbackGrams, userSchemeId);
      } else {
        // Fallback: enroll and pay
        const joinRes = await ApiClient.post('api/Scheme/join', {
          userId,
          schemeMasterId: scheme.id
        });

        if (joinRes.data && (joinRes.data.success || joinRes.data.Success)) {
          const newSchemeId = joinRes.data.schemeId || joinRes.data.SchemeId;
          setUserSchemeId(newSchemeId);
          setIsActive(true);
          await launchRazorpayCheckout(amountPaise, true, fallbackGrams, newSchemeId);
        } else {
          alert(joinRes.data?.message || 'Failed to join scheme.');
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      alert('Failed to process payment: ' + (err.response?.data?.message || err.message));
      setIsProcessing(false);
    }
  };

  const formatRupees = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
  };

  const formatRupeesFull = (paise: number) => {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  };

  const mgToGrams = (mg: number) => `${(mg / 1000).toFixed(4)} g`;

  const renderContentWithTable = (text: string) => {
    if (!text) return null;
    const startIdx = text.indexOf('[TABLE]');
    const endIdx = text.indexOf('[/TABLE]');

    if (startIdx === -1 || endIdx === -1) {
      return <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '20px', margin: 0, whiteSpace: 'pre-line' }}>{text}</p>;
    }

    const cleanText = text.substring(0, startIdx).trim();
    const tablePart = text.substring(startIdx + 7, endIdx).trim();
    const restText = text.substring(endIdx + 8).trim();

    const lines = tablePart.split('\n').map(l => l.trim()).filter(Boolean);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cleanText && <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '20px', margin: 0, whiteSpace: 'pre-line' }}>{cleanText}</p>}
        
        {lines.length > 0 && (
          <div style={{ overflowX: 'auto', border: '1px solid #ECECEC', borderRadius: '8px', marginTop: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #ECECEC' }}>
                  {lines[0].split('|').map((h, i) => (
                    <th key={i} style={{ padding: '8px 12px', fontWeight: 'bold', color: 'var(--brand-dark)', borderRight: '1px solid #ECECEC', textAlign: 'left' }}>
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.slice(1).map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: ri < lines.length - 2 ? '1px solid #ECECEC' : 'none' }}>
                    {row.split('|').map((c, ci) => (
                      <td key={ci} style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderRight: '1px solid #ECECEC' }}>
                        {c.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {restText && <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '20px', margin: 0, whiteSpace: 'pre-line' }}>{restText}</p>}
      </div>
    );
  };

  const renderCustomSections = () => {
    if (!scheme || !scheme.customSectionsJson) return null;
    try {
      const sections = JSON.parse(scheme.customSectionsJson);
      if (!Array.isArray(sections) || sections.length === 0) return null;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.map((sec: any, idx: number) => {
            const type = sec.type !== undefined ? sec.type : 0;
            
            if (type === 0) {
              // Accordion FAQ Style
              const isOpen = !!openTabs[idx];
              return (
                <div key={idx} className="glass-card" style={{ borderRadius: '16px', padding: '0', background: 'white', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenTabs({ ...openTabs, [idx]: !isOpen })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--brand-dark)',
                      fontFamily: 'var(--font-poppins)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      textAlign: 'left'
                    }}
                  >
                    <span>{sec.title}</span>
                    <span style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      display: 'inline-block',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'var(--brand-accent)'
                    }}>
                      ▼
                    </span>
                  </button>
                  <div style={{
                    maxHeight: isOpen ? '2000px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    borderTop: isOpen ? '1px solid #ECECEC' : 'none'
                  }}>
                    <div style={{ padding: '16px 20px' }}>
                      {renderContentWithTable(sec.content)}
                    </div>
                  </div>
                </div>
              );
            } else if (type === 1) {
              // Premium Highlights Card
              return (
                <div key={idx} className="glass-card" style={{
                  borderRadius: '16px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #FFFDF9 0%, #FFFFFF 100%)',
                  border: '1.5px solid #FFD700',
                  boxShadow: '0 4px 20px rgba(255, 215, 0, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Award size={18} color="#FFB300" />
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>
                      {sec.title}
                    </h3>
                  </div>
                  {renderContentWithTable(sec.content)}
                </div>
              );
            } else {
              // 2-Column Grid/Card Style
              return (
                <div key={idx} className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', marginBottom: '12px', marginTop: 0 }}>
                    {sec.title}
                  </h3>
                  {renderContentWithTable(sec.content)}
                </div>
              );
            }
          })}
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  const renderLoyaltyBonusStructure = () => {
    if (!scheme) return null;
    if (!scheme.bonusConfigJson) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
            <span>{t('payment_day')}</span>
            <span>{t('bonus_credited')}</span>
          </div>
          <div style={{ height: '1px', background: '#F3F4F6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Day 1 to 75</span>
            <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>7.5% Bonus weight</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Day 76 to 150</span>
            <span style={{ color: 'var(--warning-amber)', fontWeight: 'bold' }}>5.5% Bonus weight</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Day 151 to 330</span>
            <span style={{ color: 'var(--brand-accent)', fontWeight: 'bold' }}>3.5% Bonus weight</span>
          </div>
        </div>
      );
    }

    try {
      const config = JSON.parse(scheme.bonusConfigJson);
      if (Array.isArray(config)) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
              <span>{t('payment_interval')}</span>
              <span>{t('bonus_credited')}</span>
            </div>
            <div style={{ height: '1px', background: '#F3F4F6' }} />
            {config.map((tier: any, idx: number) => {
              const start = tier.startDay ?? tier.StartDay ?? 0;
              const end = tier.endDay ?? tier.EndDay ?? 0;
              const pct = tier.bonusPercentage ?? tier.BonusPercentage ?? 0;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Day {start} to {end}</span>
                  <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{pct}% Bonus weight</span>
                </div>
              );
            })}
          </div>
        );
      }
      
      if (typeof config === 'object') {
        const startPct = config.startingBonusPercent ?? 7.5;
        const milestones = config.milestones || [];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
              <span>{t('milestone_target')}</span>
              <span>{t('bonus_value')}</span>
            </div>
            <div style={{ height: '1px', background: '#F3F4F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Starting Loyalty Bonus</span>
              <span style={{ color: 'var(--success-green)', fontWeight: 'bold' }}>{startPct}% Bonus weight</span>
            </div>
            {milestones.map((ms: any, idx: number) => {
              let label = '';
              let val = '';
              if (ms.days !== undefined) {
                label = `Day ${ms.days} Completed`;
                val = `+${ms.bonusPercent}% Bonus`;
              } else if (ms.installment !== undefined) {
                label = `Installment ${ms.installment} Reached`;
                val = ms.flatGoldBonusMg ? `+${ms.flatGoldBonusMg} mg Gold` : `+${ms.bonusPercent || ms.freeMonthBonusPercent}%`;
              }
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--brand-accent)', fontWeight: 'bold' }}>{val}</span>
                </div>
              );
            })}
          </div>
        );
      }
    } catch (e) {
      return <span style={{ color: 'red', fontSize: '11px' }}>Failed to parse bonus methodology</span>;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8F9FA' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid var(--brand-mid)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: '100px' }}>
        <h3 style={{ color: 'var(--brand-dark)' }}>Scheme Not Found</h3>
        <button onClick={() => navigate(-1)} style={{ marginTop: '16px', background: 'var(--brand-dark)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px' }}>Back</button>
      </div>
    );
  }

  const goldPrice22K = livePrice?.price22KPaise || 701000;
  
  // Real-time Join Sheet Validations
  const parsedJoinVal = parseFloat(joinAmount) || 0;
  let joinAmountRupees = 0;
  if (joinType === 'RUPEES') {
    joinAmountRupees = parsedJoinVal;
  } else {
    const baseMetalVal = (parsedJoinVal * goldPrice22K) / 100;
    joinAmountRupees = (baseMetalVal * 1.03) / 100;
  }
  const isJoinAmountValid = parsedJoinVal > 0 && joinAmountRupees >= 100;

  // Helper to calculate days-based progress
  const getDaysProgress = () => {
    if (!joinedAt || !maturityDate) return { totalDays: 75, elapsedDays: 0, progressPct: 0 };
    const start = new Date(joinedAt).getTime();
    const end = new Date(maturityDate).getTime();
    const totalMs = end - start;
    if (totalMs <= 0) return { totalDays: 75, elapsedDays: 75, progressPct: 100 };
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, totalDays - remainingDaysForScheme);
    const progressPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    return {
      totalDays,
      elapsedDays,
      progressPct
    };
  };

  const { progressPct } = getDaysProgress();
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FA' }}>
      {/* Top Bar */}
      <div className="app-header-bar" style={{
        background: 'white',
        borderBottom: '1px solid #ECECEC',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', fontFamily: 'var(--font-poppins)' }}>
          {isActive ? t('my_saving_plan') : t('plan_specifications')}
        </span>
      </div>
 
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
        {/* Scheme Intro Header Card */}
        <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', marginBottom: '8px' }}>{autoT(scheme.planName)}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', margin: 0 }}>
            {autoT(scheme.description)}
          </p>
 
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('tenure').toUpperCase()}</span>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{scheme.totalInstallments} {scheme.durationUnit ? (scheme.durationUnit.toLowerCase().startsWith('day') ? t('days') : t('months')) : (scheme.frequency === 'Daily' ? t('days') : t('months'))}</div>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)' }} />
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('min_investment')}</span>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{t('start_from')} {formatRupees(scheme.installmentAmountPaise)}</div>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)' }} />
            <div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('frequency').toUpperCase()}</span>
              <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'capitalize' }}>{autoT(scheme.frequency)}</div>
            </div>
          </div>
        </div>
 
        {/* Dynamic Section: Renders details if Joined */}
        {isActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Days-Based Progress Card */}
            <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                  {t('scheme_duration_progress')}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--brand-accent)' }}>
                  {remainingDaysForScheme} {remainingDaysForScheme === 1 ? t('days_remaining_singular') : t('days_remaining_plural')}
                </span>
              </div>
  
              {/* Progress Line */}
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'var(--gradient-accent)',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
  
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{t('start_date')}: {joinedAt ? new Date(joinedAt).toLocaleDateString() : '—'}</span>
                <span>{t('maturity_date')}: {maturityDate ? new Date(maturityDate).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            {/* Loyalty Milestones Timeline */}
            {milestones.length > 0 && (
              <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>
                  {t('milestone_roadmap')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px', position: 'relative', paddingLeft: '8px' }}>
                  {milestones.map((ms, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                      {/* Vertical line connecting nodes */}
                      {idx < milestones.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '5px',
                          top: '16px',
                          width: '2px',
                          height: '24px',
                          background: ms.isAchieved && milestones[idx + 1].isAchieved ? 'var(--success-green)' : '#E5E7EB',
                          zIndex: 1
                        }} />
                      )}
                      {/* Timeline node dot */}
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: ms.isAchieved ? 'var(--success-green)' : '#E5E7EB',
                        border: ms.isAchieved ? '2px solid #D1FAE5' : '2px solid white',
                        boxShadow: ms.isAchieved ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                        zIndex: 2
                      }} />
                      
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '12.5px',
                          color: ms.isAchieved ? 'var(--brand-dark)' : 'var(--text-secondary)',
                          fontWeight: ms.isAchieved ? 'bold' : 'normal'
                        }}>
                          {ms.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: ms.isAchieved ? 'var(--success-green)' : 'var(--text-muted)'
                        }}>
                          {ms.bonusPercentage}% {ms.isAchieved ? t('achieved') : t('pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Plan Summary Table (Bilingual simplified breakdown for accessibility) */}
            <div className="glass-card" style={{ borderRadius: '16px', padding: '0', background: 'white', overflow: 'hidden', border: '1.5px solid #FFD700', boxShadow: '0 4px 16px rgba(255, 215, 0, 0.06)' }}>
              <div style={{ background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF9F0 100%)', padding: '12px 16px', borderBottom: '1px solid #ECECEC' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
                  {t('plan_summary_table')}
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('total_gold_purchased')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: '#FFB300' }}>
                      {mgToGrams(accumulatedGoldMg)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('total_bonus_gold_earned')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--brand-accent)' }}>
                      {mgToGrams(totalBonusGoldMg)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('total_deposited')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--brand-dark)' }}>
                      {formatRupeesFull(totalSavingsAddedPaise)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('start_date')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--brand-dark)' }}>
                      {joinedAt ? new Date(joinedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('maturity_date')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--brand-dark)' }}>
                      {maturityDate ? new Date(maturityDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ECECEC' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{t('days_remaining')}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 'bold', textAlign: 'right', color: 'var(--brand-dark)' }}>
                      {remainingDaysForScheme} {remainingDaysForScheme === 1 ? t('days_remaining_singular') : t('days_remaining_plural')}
                    </td>
                  </tr>
                  <tr style={{ background: '#FFFDF9', fontWeight: 'bold' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--brand-dark)' }}>{t('total_weight_vault')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--brand-accent)', fontSize: '14px' }}>
                      {mgToGrams(accumulatedGoldMg + totalBonusGoldMg)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            {/* Balances Grid Card */}
            <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('accumulated_balances')}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('total_gold_saved')}</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFB300' }}>{mgToGrams(accumulatedGoldMg)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('total_saving_value')}</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{formatRupeesFull(totalSavingsAddedPaise)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('bonus_gold_weight')}</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-accent)' }}>{mgToGrams(totalBonusGoldMg)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t('total_bonus_earned')}</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{formatRupeesFull(totalBonusEarnedPaise)}</div>
                </div>
              </div>
            </div>

            {/* Transaction History Ledger */}
            <div className="glass-card" style={{ borderRadius: '16px', padding: '0', background: 'white', overflow: 'hidden', border: '1px solid #ECECEC', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ background: '#F9FAFB', padding: '12px 16px', borderBottom: '1px solid #ECECEC' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>
                  {t('transaction_history')}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', minWidth: '340px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #ECECEC', background: '#F3F4F6' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{t('date_and_time')}</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'right' }}>{t('amount')}</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'right' }}>{t('gold_purchased')}</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 'bold', textAlign: 'right' }}>{t('bonus_gold')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger && ledger.filter(item => (item.transactionType || item.TransactionType) === 'INSTALLMENT').length > 0 ? (
                      ledger
                        .filter(item => (item.transactionType || item.TransactionType) === 'INSTALLMENT')
                        .map((item, index) => {
                          const dateStr = item.createdAt || item.CreatedAt || '';
                          const formattedDate = dateStr ? new Date(dateStr).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : '—';
                          const amt = item.amountPaise ?? item.AmountPaise ?? 0;
                          const goldMg = item.goldWeightMg ?? item.GoldWeightMg ?? 0;
                          const bonusMg = item.bonusGoldMg ?? item.BonusGoldMg ?? 0;

                          return (
                            <tr key={item.id || index} style={{ borderBottom: '1px solid #ECECEC' }}>
                              <td style={{ padding: '10px 12px', color: 'var(--brand-dark)', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {formatRupeesFull(amt)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#FFB300', fontWeight: 'bold' }}>
                                {mgToGrams(goldMg)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--brand-accent)', fontWeight: 'bold' }}>
                                {mgToGrams(bonusMg)}
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {t('no_transactions_found')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
  
            {/* Autopay Subscription config */}
            <div className="glass-card" style={{
              borderRadius: '16px', padding: '16px', background: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block' }}>{t('autopay_subscription')}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('autopay_desc')}</span>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input
                  type="checkbox"
                  checked={autoPayEnabled}
                  onChange={(e) => setAutoPayEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider-switch" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: autoPayEnabled ? 'var(--brand-mid)' : '#ccc', borderRadius: '34px',
                  transition: '0.4s'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '16px', width: '16px', left: autoPayEnabled ? '20px' : '4px', bottom: '3px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '0.4s'
                  }} />
                </span>
              </label>
            </div>
          </div>
        ) : (
          /* Render Specs and Join details if NOT Joined */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Dynamic Custom content sections (FAQs, Highlights, Grids) */}
            {renderCustomSections()}
 
            {/* Loyalty Bonus Structure */}
            <div className="glass-card" style={{ borderRadius: '16px', padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="var(--brand-accent)" />
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>{t('loyalty_bonus_structure')}</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '18px', margin: 0 }}>
                {t('loyalty_bonus_desc')}
              </p>
              
              {renderLoyaltyBonusStructure()}
            </div>
 
            {/* KYC warnings if basic */}
            {kycLevel === 'BASIC' && (
              <div className="glass-card" style={{
                borderRadius: '16px', padding: '16px', background: 'var(--warning-light)',
                border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <ShieldAlert size={20} color="var(--warning-amber)" style={{ marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)', display: 'block' }}>{t('kyc_completion_required')}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {t('kyc_required_detail')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Fixed Bottom CTA Bar */}
      <div style={{
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #ECECEC',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.03)',
        zIndex: 10,
        boxSizing: 'border-box',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))'
      }}>
        {isActive ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            {schemeStatus.toLowerCase() === 'claimed' ? (
              <button
                disabled
                style={{
                  flex: 1, height: '52px', borderRadius: '14px', background: '#ECECEC',
                  color: 'var(--text-muted)', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {t('redeemed')}
              </button>
            ) : schemeStatus.toLowerCase() === 'matured' ? (
              <div style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1.5px solid #FFD700',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-dark)', fontWeight: 'bold', fontSize: '14.5px' }}>
                  <Award size={18} color="#FFB300" />
                  <span>{t('scheme_matured')}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '17px' }}>
                  {lang === 'en' ? t('matured_redemption_instruction_en') : t('matured_redemption_instruction_ta')}
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  style={{
                    flex: 1, height: '52px', borderRadius: '14px', background: 'var(--gradient-accent)',
                    color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px var(--brand-glow)'
                  }}
                >
                  {isProcessing ? (
                    <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    t('pay_installment') || 'Make Payment'
                  )}
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={handleJoinScheme}
            disabled={isProcessing}
            style={{
              width: '100%', height: '52px', borderRadius: '14px', background: 'var(--brand-dark)',
              color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px var(--brand-glow)'
            }}
          >
            {isProcessing ? (
              <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              kycLevel === 'BASIC' ? t('complete_kyc_join') : t('join_scheme_plan')
            )}
          </button>
        )}
      </div>

      {/* Nominee & Address Setup Modal */}
      {showSetupModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1002,
          backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '20px 0'
        }}>
          <div className="glass-card" style={{
            width: '90%', maxWidth: '400px', background: 'white', borderRadius: '24px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            margin: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>
                {t('scheme_join_form')}
              </h3>
              <button onClick={() => setShowSetupModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '16px' }}>
              {t('scheme_join_form_desc')}
            </span>

            {/* Nominee details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{t('nominee_information')}</span>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('nominee_name_label')}</label>
                <input
                  type="text"
                  placeholder={t('enter_nominee_name')}
                  value={setupNomineeName}
                  onChange={(e) => setSetupNomineeName(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('nominee_mobile')}</label>
                <input
                  type="text"
                  placeholder={t('ten_digit_mobile')}
                  value={setupNomineePhone}
                  onChange={(e) => setSetupNomineePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('relationship')}</label>
                <select
                  value={setupNomineeRelationship}
                  onChange={(e) => setSetupNomineeRelationship(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px', background: 'white' }}
                >
                  <option value="">{t('select_relationship')}</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>{autoT(rel)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>{t('primary_address')}</span>
              
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('pincode_label')}</label>
                <input
                  type="text"
                  placeholder={t('enter_pincode')}
                  value={setupPincode}
                  onChange={(e) => handleSetupPincodeChange(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: setupPinError ? '1px solid var(--error-red)' : '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px' }}
                />
                {setupPinError && (
                  <span style={{ fontSize: '11px', color: 'var(--error-red)', marginTop: '4px', display: 'block' }}>
                    {setupPinError}
                  </span>
                )}
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('state_label')}</label>
                <select
                  value={setupState}
                  onChange={(e) => {
                    setSetupState(e.target.value);
                    setSetupCity('');
                    setSetupPincode('');
                    setSetupPinError(null);
                  }}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px', background: 'white' }}
                >
                  <option value="">{t('select_state')}</option>
                  {STATES.map((st) => (
                    <option key={st} value={st}>{autoT(st)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('city_label')}</label>
                <select
                  value={setupCity}
                  onChange={(e) => {
                    setSetupCity(e.target.value);
                    setSetupPincode('');
                    setSetupPinError(null);
                  }}
                  disabled={!setupState}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px', background: !setupState ? '#F3F4F6' : 'white' }}
                >
                  <option value="">{t('select_city')}</option>
                  {(CITIES_BY_STATE[setupState] || []).map((ct) => (
                    <option key={ct} value={ct}>{autoT(ct)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('street_address')}</label>
                <input
                  type="text"
                  placeholder={t('street_address_placeholder')}
                  value={setupStreet}
                  onChange={(e) => setSetupStreet(e.target.value)}
                  style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', padding: '0 12px', fontSize: '13px', outline: 'none', marginTop: '4px' }}
                />
              </div>
            </div>

            {/* Save & Proceed button */}
            <button
              onClick={handleSaveSetup}
              disabled={
                isProcessing ||
                !setupNomineeName.trim() ||
                setupNomineePhone.length !== 10 ||
                !setupNomineeRelationship ||
                !setupState || 
                !setupCity || 
                !setupStreet.trim() || 
                setupPincode.length !== 6 || 
                setupPinError !== null
              }
              style={{
                width: '100%', height: '46px', borderRadius: '12px', background: 'var(--gradient-brand)',
                color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                marginTop: '10px', boxShadow: '0 4px 10px var(--brand-glow)',
                opacity: (
                  isProcessing ||
                  !setupNomineeName.trim() ||
                  setupNomineePhone.length !== 10 ||
                  !setupNomineeRelationship ||
                  !setupState || 
                  !setupCity || 
                  !setupStreet.trim() || 
                  setupPincode.length !== 6 || 
                  setupPinError !== null
                ) ? 0.5 : 1
              }}
            >
              {isProcessing ? t('saving') : t('save_proceed')}
            </button>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{
            width: '90%', maxWidth: '380px', background: 'white', borderRadius: '24px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <CheckCircle2 size={56} color="var(--success-green)" style={{ margin: '8px 0' }} />
            
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: '0 0 8px 0' }}>
                {t('scheme_joined_successfully')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '18px', margin: 0 }}>
                {t('scheme_joined_successfully_desc')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  handleInitiatePayment();
                }}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px', background: 'var(--gradient-accent)',
                  color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--brand-glow)'
                }}
              >
                {t('start_investing_now')}
              </button>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  setIsActive(true);
                }}
                style={{
                  width: '100%', height: '48px', borderRadius: '12px', background: 'transparent',
                  color: 'var(--text-secondary)', border: '1px solid rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {t('invest_later')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Popup Sheet */}
      {showJoinSheet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{
            width: '90%', maxWidth: '380px', background: 'white', borderRadius: '24px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} color="var(--brand-dark)" />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--brand-dark)', margin: 0 }}>
                  {userSchemeId ? t('make_payment') : t('join_savings_plan')}
                </h3>
              </div>
              <button onClick={() => setShowJoinSheet(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
 
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '16px' }}>
              {t('join_sheet_desc')}
            </span>
 
            {/* Toggle tabs */}
            <div style={{ display: 'flex', background: '#F5F5F5', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => { setJoinType('RUPEES'); setJoinAmount('100'); }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                  background: joinType === 'RUPEES' ? 'white' : 'transparent',
                  color: joinType === 'RUPEES' ? 'var(--brand-dark)' : 'var(--text-muted)',
                  boxShadow: joinType === 'RUPEES' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer'
                }}
              >
                {t('amount_to_gold')}
              </button>
              <button
                onClick={() => { setJoinType('GRAMS'); setJoinAmount('0.1'); }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                  background: joinType === 'GRAMS' ? 'white' : 'transparent',
                  color: joinType === 'GRAMS' ? 'var(--brand-dark)' : 'var(--text-muted)',
                  boxShadow: joinType === 'GRAMS' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer'
                }}
              >
                {t('gold_to_amount')}
              </button>
            </div>
 
            {/* Inputs */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                {joinType === 'RUPEES' ? t('enter_amount') : t('enter_weight')}
              </label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '11px', fontSize: '15px', fontWeight: 'bold' }}>
                  {joinType === 'RUPEES' ? '₹' : 'g'}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={joinAmount}
                  onChange={(e) => setJoinAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  style={{
                    width: '100%', height: '40px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)',
                    padding: '0 12px 0 26px', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>
            </div>
 
            {/* Preset chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(joinType === 'RUPEES' ? ['100', '500', '1000', '3000', '5000'] : ['0.1', '0.5', '1', '2', '5']).map((p) => (
                <button
                  key={p}
                  onClick={() => setJoinAmount(p)}
                  style={{
                    background: joinAmount === p ? 'var(--brand-dark)' : 'white',
                    border: '1px solid var(--brand-dark)',
                    color: joinAmount === p ? 'white' : 'var(--brand-dark)',
                    padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {joinType === 'RUPEES' ? `₹${p}` : `${p} g`}
                </button>
              ))}
            </div>
 
            {/* Calculations Breakdown */}
            {parseFloat(joinAmount) > 0 && (
              <div style={{ background: '#FFF9F0', border: '1px solid rgba(255, 215, 0, 0.2)', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {joinType === 'RUPEES' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{t('savings_deposit')}</span>
                      <span style={{ fontWeight: 'bold' }}>₹{parseFloat(joinAmount).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{t('gst_included')}</span>
                      <span>₹{(parseFloat(joinAmount) - (parseFloat(joinAmount) / 1.03)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--brand-mid)', fontWeight: 'bold' }}>
                      <span>{t('loyalty_bonus_structure')} (7.5%)</span>
                      <span>+ ₹{(parseFloat(joinAmount) / 1.03 * 0.075).toFixed(2)} equivalent</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                      <span>{t('effective_gold_added')}</span>
                      <span style={{ color: 'var(--gold-deep)' }}>
                        {((parseFloat(joinAmount) / 1.03 * 1.075 * 100) / goldPrice22K).toFixed(4)} {t('grams_suffix')}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{t('base_metal_value_22k')}</span>
                      <span style={{ fontWeight: 'bold' }}>₹{(parseFloat(joinAmount) * goldPrice22K / 100).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{t('gst_3_percent')}</span>
                      <span>₹{(parseFloat(joinAmount) * goldPrice22K / 100 * 0.03).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--brand-mid)', fontWeight: 'bold' }}>
                      <span>{t('loyalty_bonus_structure')} (7.5%)</span>
                      <span>+ {(parseFloat(joinAmount) * 0.075).toFixed(4)} {t('grams_suffix')} equivalent</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: 'var(--brand-dark)' }}>
                      <span>{t('total_amount_payable')}</span>
                      <span style={{ color: 'var(--brand-dark)' }}>
                        ₹{(parseFloat(joinAmount) * goldPrice22K / 100 * 1.03).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
 
            {/* Validation warning */}
            {(validationError || (parsedJoinVal > 0 && !isJoinAmountValid)) && (
              <span style={{ fontSize: '11px', color: 'var(--error-red)', fontWeight: 'bold', textAlign: 'center', display: 'block', marginTop: '-4px' }}>
                {validationError || `${t('minimum_investment_amount')} (Current: ₹${joinAmountRupees.toFixed(2)})`}
              </span>
            )}
 
            <button
              onClick={handlePayJoinPlan}
              disabled={parsedJoinVal <= 0 || !isJoinAmountValid || isProcessing}
              style={{
                width: '100%', height: '48px', borderRadius: '12px', background: 'var(--brand-dark)',
                color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (parsedJoinVal <= 0 || !isJoinAmountValid || isProcessing) ? 0.5 : 1
              }}
            >
              {isProcessing ? (
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                userSchemeId ? t('make_payment') : t('pay_and_join_plan')
              )}
            </button>
          </div>
        </div>
      )}

      {/* Full-screen Loading Overlay for Payment Processing/Verification */}
      {isProcessing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(41, 0, 29, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.25)',
            borderTop: '4px solid var(--gold-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '24px'
          }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--gold-primary)',
            margin: '0 0 10px 0',
            fontFamily: 'var(--font-poppins)',
            letterSpacing: '0.5px'
          }}>
            Verifying Transaction...
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            maxWidth: '300px',
            lineHeight: '20px',
            fontFamily: 'var(--font-poppins)'
          }}>
            Confirming your purchase. Please do not close the application or go back.
          </p>
        </div>
      )}
    </div>
  );
};
