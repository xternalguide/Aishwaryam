export const OnboardingStage = {
  NONE: 'NONE',
  OTP_VERIFIED: 'OTP_VERIFIED',
  MPIN_CREATED: 'MPIN_CREATED',
  PROFILE_COMPLETED: 'PROFILE_COMPLETED',
  KYC_PENDING: 'KYC_PENDING',
  FULLY_VERIFIED: 'FULLY_VERIFIED'
} as const;

export type OnboardingStage = typeof OnboardingStage[keyof typeof OnboardingStage];


export class SessionManager {
  private static readonly USER_ID_KEY = 'USER_ID';
  private static readonly JWT_TOKEN_KEY = 'JWT_TOKEN';
  private static readonly REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';
  private static readonly PHONE_NUMBER_KEY = 'PHONE_NUMBER';
  private static readonly ONBOARDING_STAGE_KEY = 'ONBOARDING_STAGE';
  private static readonly HAS_SEEN_WELCOME_KEY = 'HAS_SEEN_WELCOME';
  private static readonly CACHED_DASHBOARD_KEY = 'CACHED_DASHBOARD';
  private static readonly PENDING_ORDER_ID_KEY = 'PENDING_ORDER_ID';
  private static readonly NOMINEE_NAME_KEY = 'PARTIAL_NOMINEE';

  static saveSession(userId: string, token: string, refreshToken: string): void {
    localStorage.setItem(this.USER_ID_KEY, userId);
    localStorage.setItem(this.JWT_TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  static savePhoneNumber(phoneNumber: string): void {
    localStorage.setItem(this.PHONE_NUMBER_KEY, phoneNumber);
  }

  static getPhoneNumber(): string | null {
    return localStorage.getItem(this.PHONE_NUMBER_KEY);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.JWT_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearSession(): void {
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.JWT_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static saveOnboardingStage(stage: OnboardingStage): void {
    localStorage.setItem(this.ONBOARDING_STAGE_KEY, stage);
  }

  static getOnboardingStage(): OnboardingStage {
    const stage = localStorage.getItem(this.ONBOARDING_STAGE_KEY) as OnboardingStage | null;
    return stage || OnboardingStage.NONE;
  }

  static saveStep1Data(data: Record<string, any>): void {
    Object.keys(data).forEach((key) => {
      localStorage.setItem(`PARTIAL_${key.toUpperCase()}`, String(data[key]));
    });
  }

  static savePartialProfile(name: string, email: string): void {
    localStorage.setItem('PARTIAL_NAME', name);
    localStorage.setItem('PARTIAL_EMAIL', email);
  }

  static getPartialName(): string {
    return localStorage.getItem('PARTIAL_NAME') || '';
  }

  static getPartialEmail(): string {
    return localStorage.getItem('PARTIAL_EMAIL') || '';
  }

  static getPartialDob(): string {
    return localStorage.getItem('PARTIAL_DOB') || '';
  }

  static getPartialIsMarried(): boolean {
    return localStorage.getItem('PARTIAL_IS_MARRIED') === 'true';
  }

  static getPartialWeddingDate(): string {
    return localStorage.getItem('PARTIAL_WEDDING_DATE') || '';
  }

  static getPartialGender(): string {
    return localStorage.getItem('PARTIAL_GENDER') || 'Male';
  }

  static getPartialPincode(): string {
    return localStorage.getItem('PARTIAL_PINCODE') || '';
  }

  static getPartialState(): string {
    return localStorage.getItem('PARTIAL_STATE') || '';
  }

  static getPartialCity(): string {
    return localStorage.getItem('PARTIAL_CITY') || '';
  }

  static getPartialArea(): string {
    return localStorage.getItem('PARTIAL_AREA') || '';
  }

  static getPartialIsManualArea(): boolean {
    return localStorage.getItem('PARTIAL_IS_MANUAL_AREA') === 'true';
  }

  static getPartialTermsAccepted(): boolean {
    return localStorage.getItem('PARTIAL_TERMS_ACCEPTED') === 'true';
  }

  static savePendingOrderId(orderId: string): void {
    localStorage.setItem(this.PENDING_ORDER_ID_KEY, orderId);
  }

  static getPendingOrderId(): string | null {
    return localStorage.getItem(this.PENDING_ORDER_ID_KEY);
  }

  static clearPendingOrderId(): void {
    localStorage.removeItem(this.PENDING_ORDER_ID_KEY);
  }

  static hasSeenWelcomeOnboarding(): boolean {
    return localStorage.getItem(this.HAS_SEEN_WELCOME_KEY) === 'true';
  }

  static markWelcomeOnboardingSeen(): void {
    localStorage.setItem(this.HAS_SEEN_WELCOME_KEY, 'true');
  }

  static saveCachedDashboard(json: string): void {
    localStorage.setItem(this.CACHED_DASHBOARD_KEY, json);
  }

  static getCachedDashboard(): string | null {
    return localStorage.getItem(this.CACHED_DASHBOARD_KEY);
  }

  static saveNomineeName(name: string): void {
    localStorage.setItem(this.NOMINEE_NAME_KEY, name);
  }

  static getNomineeName(): string {
    return localStorage.getItem(this.NOMINEE_NAME_KEY) || '';
  }

  private static readonly LANGUAGE_KEY = 'PREFERRED_LANGUAGE';

  static saveLanguage(lang: 'en' | 'ta'): void {
    localStorage.setItem(this.LANGUAGE_KEY, lang);
  }

  static getLanguage(): 'en' | 'ta' {
    return (localStorage.getItem(this.LANGUAGE_KEY) as 'en' | 'ta') || 'en';
  }
}
