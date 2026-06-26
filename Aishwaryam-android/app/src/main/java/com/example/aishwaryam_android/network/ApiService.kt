package com.example.aishwaryam_android.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

// ── AUTH REQUESTS ──────────────────────────────────────────────────────────
data class SendOtpRequest(val phoneNumber: String)
data class VerifyOtpRequest(val phoneNumber: String, val otp: String, val deviceFingerprint: String)
data class VerifyFirebaseTokenRequest(
    val firebaseIdToken: String,
    val phoneNumber: String,
    val deviceFingerprint: String
)
data class SetMpinRequest(val userId: String, val mpin: String)
data class VerifyMpinRequest(val userId: String, val mpin: String, val deviceFingerprint: String)
data class UpdateProfileRequest(
    val fullName: String?, 
    val email: String?,
    val nomineeName: String? = null,
    val dateOfBirth: String? = null,
    val biometricEnabled: Boolean? = null,
    val preferredLanguage: String? = null,
    val referredByCode: String? = null
)

data class ChangeMpinRequest(
    val userId: String,
    val oldMpin: String,
    val newMpin: String
)

data class SubmitKycRequest(
    val userId: String,
    val documentType: String,
    val documentNumber: String,
    val documentUrl: String
)

data class AddBankAccountRequest(
    val userId: String,
    val accountNumber: String,
    val ifscCode: String,
    val bankName: String
)

data class ChatbotQueryRequest(
    val userId: String,
    val message: String
)

data class ChatbotQueryResponse(
    val message: String,
    val timestamp: Long
)

// ── GOLD REQUESTS ──────────────────────────────────────────────────────────
data class BuyGoldRequest(
    val userId: String,
    val totalAmountPaise: Long,
    val deviceFingerprint: String,
    var priceLockId: String? = null
)

data class SellGoldRequest(
    val userId: String,
    val goldWeightMg: Long,
    val deviceFingerprint: String,
    var priceLockId: String? = null
)

// ── RESPONSES ──────────────────────────────────────────────────────────────
data class SendOtpResponse(val success: Boolean, val message: String)
data class VerifyOtpResponse(val token: String?, val refreshToken: String?, val userId: String?, val isNewUser: Boolean, val isMpinSet: Boolean, val success: Boolean, val message: String)
data class GenericAuthResponse(val success: Boolean, val message: String, val token: String?, val refreshToken: String?, val userId: String?, val isNewUser: Boolean? = false, val isMpinSet: Boolean? = false)
data class RefreshTokenApiRequest(val refreshToken: String, val deviceFingerprint: String)

data class CurrentGoldPriceResponse(
    val buyPricePaise: Long,
    val sellPricePaise: Long,
    val price24KPaise: Long,
    val price22KPaise: Long,
    val updatedAt: String,
    val source: String = "Live",
    val isFallback: Boolean = false
)

data class PriceLockResponse(
    val lockId: String,
    val lockedBuyPricePaise: Long,
    val lockedSellPricePaise: Long,
    val lockedAt: String,
    val expiresAt: String,
    val expiresInSeconds: Int
)

data class GoldTransactionResponse(
    val success: Boolean,
    val message: String,
    val goldWeightMg: Long,
    val pricePerGmPaise: Long,
    val totalAmountPaise: Long,
    val baseAmountPaise: Long = 0,
    val gstAmountPaise: Long = 0,
    val bonusPercentage: Double = 0.0,
    val bonusAmountPaise: Long = 0,
    val bonusGoldMg: Long = 0,
    val totalGoldCreditedMg: Long = 0,
    val newWalletBalancePaise: Long,
    val newGoldBalanceMg: Long,
    val lockedGoldMg: Long = 0,
    val redeemableGoldMg: Long = 0
)

data class UserProfileResponse(
    val fullName: String?,
    val phoneNumber: String?,
    val email: String?,
    val kycLevel: String?,
    val biometricEnabled: Boolean,
    val referralCode: String?,
    val referredByCode: String?,
    val dateOfBirth: String?,
    val nomineeName: String?,
    val preferredLanguage: String?
)

data class BankAccountDto(
    val id: String,
    val bankName: String,
    val accountNumberMasked: String,
    val ifscCode: String,
    val isVerified: Boolean,
    val createdAt: String
)

// ── DASHBOARD DTOs ────────────────────────────────────────────────────────
data class DashboardOverviewResponse(
    val goldBalanceMg: Long,
    val buyPricePaise: Long,
    val sellPricePaise: Long,
    val price24KPaise: Long,
    val price22KPaise: Long,
    val priceUpdatedAt: String,
    val investedAmountPaise: Long,
    val currentValuePaise: Long,
    val returnPercentage: Double,
    val recentTransactions: List<TransactionItem>,
    val activeBanners: List<BannerItem>,
    val hasActiveScheme: Boolean,
    val schemePlanName: String?,
    val schemeInstallmentsPaid: Int,
    val schemeTotalInstallments: Int,
    val schemeInstallmentAmountPaise: Long,
    val schemeNextDueDate: String?,
    val goldAddedTodayMg: Long,
    val autoPayEnabled: Boolean
)

data class TransactionItem(
    val transactionId: String,
    val type: String,           // "BUY" | "SELL"
    val goldWeightMg: Long,
    val amountPaise: Long,
    val createdAt: String,
    val rateSource: String? = null,
    val schemeName: String? = null
)

data class BannerItem(
    val id: String,
    val title: String,
    val imageBase64: String,
    val tapActionUrl: String?,
    val displayOrder: Int,
    val expiresAt: String? = null
)

data class BannerListResponse(
    val success: Boolean,
    val banners: List<BannerItem>
)


data class AppConfigResponse(
    val faqJson: String?,
    val referralBonusMsg: String?
)

data class ActiveSchemeItem(
    val schemeId: String,
    val planName: String,
    val autoPayEnabled: Boolean,
    val frequency: String,
    val installmentsPaid: Int,
    val totalInstallments: Int,
    val installmentAmountPaise: Long,
    val totalInvestmentPaise: Long,
    val remainingInvestmentPaise: Long,
    val remainingInstallments: Int,
    val nextDueDate: String?,
    val maturityDate: String?,
    val accumulatedGoldMg: Long,
    val goldAddedTodayMg: Long = 0,
    val joinedAt: String?,
    val status: String?,
    val totalSavingsAddedPaise: Long = 0L,
    val totalBonusEarnedPaise: Long = 0L,
    val totalBonusGoldMg: Long = 0L,
    val schemeDayNumber: Int = 0,
    val currentBonusTierPercent: Double = 0.0,
    val remainingDaysForCurrentTier: Int = 0,
    val remainingDaysForScheme: Int = 0
)

data class SchemeDashboardResponse(
    val hasActiveScheme: Boolean,
    val activeSchemes: List<ActiveSchemeItem> = emptyList(),
    val schemeId: String?,
    val planName: String?,
    val autoPayEnabled: Boolean?,
    val frequency: String?,
    val installmentsPaid: Int?,
    val totalInstallments: Int?,
    val installmentAmountPaise: Long?,
    val totalInvestmentPaise: Long?,
    val remainingInvestmentPaise: Long?,
    val remainingInstallments: Int?,
    val nextDueDate: String?,
    val maturityDate: String?,
    val accumulatedGoldMg: Long?,
    val goldAddedTodayMg: Long,
    val joinedAt: String?,
    val lockedGoldMg: Long = 0,
    val maturedRedeemableGoldMg: Long = 0,
    val redeemableGoldMg: Long = 0,
    val redeemedGoldMg: Long = 0,
    val status: String? = null,
    val totalSavingsAddedPaise: Long? = 0L,
    val totalBonusEarnedPaise: Long? = 0L,
    val totalBonusGoldMg: Long? = 0L,
    val schemeDayNumber: Int? = 0,
    val currentBonusTierPercent: Double? = 0.0,
    val remainingDaysForCurrentTier: Int? = 0,
    val remainingDaysForScheme: Int? = 0
)

data class PortfolioResponse(
    val userId: String,
    val goldBalanceMg: Long,
    val investedAmountPaise: Long,
    val currentValuePaise: Long,
    val returnPercentage: Double,
    val lockedGoldMg: Long = 0,
    val maturedRedeemableGoldMg: Long = 0,
    val redeemableGoldMg: Long = 0,
    val redeemedGoldMg: Long = 0,
    val monthlyBalances: List<Long>? = null
)

data class ClaimSchemeRequest(
    val userId: String,
    val schemeId: String
)

// ── SCHEME & REFERRAL REQUESTS / RESPONSES ────────────────────────────────
// Removed duplicate SchemeDashboardResponse (already defined above)


data class AvailableScheme(
    val id: String,
    val planName: String,
    val description: String,
    val installmentAmountPaise: Long,
    val totalInstallments: Int,
    val frequency: String,
    val bonusConfigJson: String?,
    val customSectionsJson: String?,
    val posterImageBase64: String? = null,   // Admin-uploaded full-bleed card image
    val paymentRulesJson: String? = null,    // JSON payment config from admin
    val keywordsJson: String? = null         // JSON array of badge keywords for card
)

data class JoinSchemeRequest(
    val userId: String,
    val schemeMasterId: String
)

data class JoinSchemeResponseDto(
    val schemeId: String?,
    val planName: String?,
    val message: String?,
    val alreadyEnrolled: Boolean?
)

data class ToggleAutoPayRequest(
    val userId: String,
    val schemeId: String,
    val enableAutoPay: Boolean
)

data class ReferralNetworkResponse(
    val totalReferrals: Int,
    val totalBonusMg: Long,
    val network: List<ReferralNetworkItem>
)

data class PaymentOrderRequest(
    val userId: String,
    val amountPaise: Long,
    val userSchemeId: String? = null
)

data class PaymentOrderResponse(
    val orderId: String,
    val amount: Long,
    val currency: String,
    val keyId: String
)

data class PaymentVerificationRequest(
    val userId: String,
    val razorpayOrderId: String,
    val razorpayPaymentId: String,
    val razorpaySignature: String
)

data class ReferralNetworkItem(
    val referredUserName: String,
    val joinedAt: String,
    val rewardStatus: String,
    val bonusAwardedMg: Long
)

// ── OFFERS REQUESTS / RESPONSES ───────────────────────────────────────────
data class OfferItemDto(
    val id: String,
    val title: String,
    val description: String,
    val bonusWorthPaise: Long,
    val expiresAt: String
)

data class MaturitySummaryResponse(
    val schemeId: String,
    val planName: String,
    val totalInstallments: Int,
    val totalGoldAccumulatedMg: Long,
    val maturityDate: String,
    val eligibility: String
)

data class SchemeMilestoneItem(
    val name: String,
    val targetDay: Int,
    val bonusPercentage: Double,
    val isAchieved: Boolean
)

data class SchemeProgressResponse(
    val schemeId: String,
    val planName: String,
    val installmentsPaid: Int,
    val totalInstallments: Int,
    val installmentAmountPaise: Long,
    val totalSavingsAddedPaise: Long,
    val totalBonusEarnedPaise: Long,
    val totalBonusGoldMg: Long,
    val accumulatedGoldMg: Long,
    val redeemedGoldMg: Long = 0L,
    val schemeDayNumber: Int,
    val currentBonusTierPercent: Double,
    val remainingDaysForCurrentTier: Int,
    val remainingDaysForScheme: Int,
    val status: String,
    val joinedAt: String,
    val maturityDate: String,
    val milestones: List<SchemeMilestoneItem>
)

data class SchemeLedgerItem(
    val id: String,
    val userSchemeId: String,
    val userId: String,
    val transactionType: String,
    val installmentNumber: Long,
    val amountPaise: Long,
    val baseAmountPaise: Long,
    val gstAmountPaise: Long,
    val goldWeightMg: Long,
    val pricePerGmPaise: Long,
    val bonusPercentage: Double,
    val bonusAmountPaise: Long,
    val bonusGoldMg: Long,
    val razorpayPaymentId: String?,
    val status: String,
    val createdAt: String
)

data class InvestSchemeRequest(
    val userId: String,
    val schemeId: String,
    val amountPaise: Long,
    val razorpayPaymentId: String?,
    val ipAddress: String = "127.0.0.1",
    val deviceFingerprint: String = "ANDROID_APP"
)

data class InvestSchemeResponse(
    val success: Boolean,
    val message: String?,
    val transactionId: String?,
    val goldWeightMg: Long = 0L,
    val bonusGoldMg: Long = 0L,
    val totalGoldCreditedMg: Long = 0L,
    val installmentNumber: Int = 0
)

data class RequestRedemptionRequest(
    val userId: String,
    val schemeId: String,
    val redemptionType: String, // CASH, DELIVERY, JEWELLERY
    val address: String?,
    val includeBonusGold: Boolean = false
)

data class RequestRedemptionResponse(
    val success: Boolean,
    val message: String? = null,
    val redemptionId: String? = null,
    val status: String? = null
)

interface ApiService {
    @POST("api/Auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<SendOtpResponse>

    @POST("api/Auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<VerifyOtpResponse>

    @POST("api/Auth/verify-firebase-token")
    suspend fun verifyFirebaseToken(@Body request: VerifyFirebaseTokenRequest): Response<VerifyOtpResponse>

    @POST("api/Auth/set-mpin")
    suspend fun setMpin(@Body request: SetMpinRequest): Response<GenericAuthResponse>

    @POST("api/Auth/verify-mpin")
    suspend fun verifyMpin(@Body request: VerifyMpinRequest): Response<GenericAuthResponse>

    @GET("api/User/profile/{userId}")
    suspend fun getProfile(@Path("userId") userId: String): Response<UserProfileResponse>

    @PUT("api/User/profile/{userId}")
    suspend fun updateProfile(@Path("userId") userId: String, @Body request: UpdateProfileRequest): Response<GenericAuthResponse>

    @DELETE("api/User/{userId}")
    suspend fun deleteAccount(@Path("userId") userId: String): Response<GenericAuthResponse>

    @GET("api/Banking/accounts/{userId}")
    suspend fun getBankAccounts(@Path("userId") userId: String): Response<List<BankAccountDto>>

    @POST("api/Banking/add-account")
    suspend fun addBankAccount(@Body request: AddBankAccountRequest): Response<GenericAuthResponse>

    @POST("api/Kyc/submit")
    suspend fun submitKyc(@Body request: SubmitKycRequest): Response<GenericAuthResponse>

    @POST("api/Auth/change-mpin")
    suspend fun changeMpin(@Body request: ChangeMpinRequest): Response<GenericAuthResponse>

    @GET("api/Gold/price")
    suspend fun getLivePrice(): Response<CurrentGoldPriceResponse>

    @POST("api/Gold/price/lock")
    suspend fun lockGoldPrice(@retrofit2.http.Query("userId") userId: String): Response<PriceLockResponse>

    @POST("api/Gold/buy")
    suspend fun buyGold(@Body request: BuyGoldRequest): Response<GoldTransactionResponse>

    @POST("api/Gold/sell")
    suspend fun sellGold(@Body request: SellGoldRequest): Response<GoldTransactionResponse>

    @GET("api/Scheme/list")
    suspend fun getAvailableSchemes(): Response<List<AvailableScheme>>

    @GET("api/Scheme/dashboard/{userId}")
    suspend fun getSchemeDashboard(@Path("userId") userId: String): Response<SchemeDashboardResponse>

    @POST("api/Scheme/join")
    suspend fun joinScheme(@Body request: JoinSchemeRequest): Response<JoinSchemeResponseDto>

    @POST("api/Scheme/toggle-autopay")
    suspend fun toggleAutoPay(@Body request: ToggleAutoPayRequest): Response<GenericAuthResponse>

    @GET("api/Scheme/maturity-summary/{schemeId}")
    suspend fun getMaturitySummary(@Path("schemeId") schemeId: String): Response<MaturitySummaryResponse>

    @POST("api/Scheme/claim")
    suspend fun claimScheme(@Body request: ClaimSchemeRequest): Response<GenericAuthResponse>

    @GET("api/Scheme/{id}/ledger")
    suspend fun getSchemeLedger(@Path("id") schemeId: String): Response<List<SchemeLedgerItem>>

    @GET("api/Scheme/{id}/progress")
    suspend fun getSchemeProgress(@Path("id") schemeId: String): Response<SchemeProgressResponse>

    @POST("api/Scheme/redeem-request")
    suspend fun requestRedemption(@Body request: RequestRedemptionRequest): Response<RequestRedemptionResponse>

    @POST("api/Scheme/invest")
    suspend fun investInScheme(@Body request: InvestSchemeRequest): Response<InvestSchemeResponse>

    @POST("api/Payment/create-order")
    suspend fun createPaymentOrder(@Body request: PaymentOrderRequest): Response<PaymentOrderResponse>

    @POST("api/Payment/verify")
    suspend fun verifyPayment(@Body request: PaymentVerificationRequest): Response<GoldTransactionResponse>

    @POST("api/Payment/log-failure")
    suspend fun logFailedPayment(@Body request: FailedPaymentRequest): Response<Unit>

    @GET("api/Payment/reconcile/{orderId}")
    suspend fun reconcilePayment(@Path("orderId") orderId: String): Response<ReconcilePaymentResponse>

    @POST("api/Subscription/create")
    suspend fun createSubscription(@Body request: CreateSubscriptionApiRequest): Response<CreateSubscriptionResponse>

    @POST("api/Subscription/activate")
    suspend fun activateSubscription(@Body request: ActivateSubscriptionApiRequest): Response<Unit>

    @GET("api/ReferralNetwork/{userId}")
    suspend fun getReferralNetwork(@Path("userId") userId: String): Response<ReferralNetworkResponse>

    @GET("api/Dashboard/overview/{userId}")
    suspend fun getDashboardOverview(@Path("userId") userId: String): Response<DashboardOverviewResponse>

    @GET("api/Banner/active")
    suspend fun getActiveBanners(): Response<BannerListResponse>

    @GET("api/Banner/active")
    suspend fun getBannersByLocation(@retrofit2.http.Query("location") location: String): Response<BannerListResponse>

    @GET("api/Dashboard/portfolio/{userId}")
    suspend fun getPortfolio(@Path("userId") userId: String): Response<PortfolioResponse>

    @GET("api/Dashboard/transactions/{userId}")
    suspend fun getRecentTransactions(@Path("userId") userId: String): Response<List<TransactionItem>>

    @GET("api/Dashboard/config")
    suspend fun getConfig(): Response<AppConfigResponse>

    @GET("api/Offers/active/{userId}")
    suspend fun getActiveOffers(@Path("userId") userId: String): Response<List<OfferItemDto>>

    @GET("api/Notification")
    suspend fun getUserNotifications(): Response<List<UserNotificationDto>>

    @GET("api/Notification/unread-count")
    suspend fun getUnreadNotificationCount(): Response<UnreadCountResponse>

    @PUT("api/Notification/{id}/read")
    suspend fun markNotificationAsRead(@Path("id") notificationId: String): Response<GenericAuthResponse>

    @DELETE("api/Notification/{id}")
    suspend fun deleteNotification(@Path("id") notificationId: String): Response<GenericAuthResponse>

    @POST("api/Notification/register-token")
    suspend fun registerFcmToken(@Body request: Map<String, String>): Response<GenericAuthResponse>

    @POST("api/Notification/unregister-token")
    suspend fun unregisterFcmToken(@Body request: Map<String, String>): Response<GenericAuthResponse>
    
    @GET("api/Kyc/limits/{userId}")
    suspend fun getKycLimits(@Path("userId") userId: String): Response<KycLimitsDto>

    @POST("api/Auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenApiRequest): Response<GenericAuthResponse>

    @POST("api/Auth/logout")
    suspend fun logout(@Body request: RefreshTokenApiRequest): Response<GenericAuthResponse>

    @POST("api/Auth/revoke-all-sessions")
    suspend fun revokeAllSessions(): Response<GenericAuthResponse>

    @POST("api/Chatbot/query")
    suspend fun queryAssistant(@Body request: ChatbotQueryRequest): Response<ChatbotQueryResponse>
}

data class UnreadCountResponse(
    val count: Int
)

data class KycLimitsDto(
    val currentLevel: String,
    val dailyTransactionLimitPaise: Long,
    val monthlyTransactionLimitPaise: Long,
    val remainingDailyLimitPaise: Long,
    val remainingMonthlyLimitPaise: Long,
    val maxRedemptionMg: Long,
    val isPhysicalDeliveryAllowed: Boolean
)

data class UserNotificationDto(
    val id: String?,
    val title: String?,
    val message: String?,
    val type: String?,
    val isRead: Boolean?,
    val entityId: String?,
    val createdAt: String?
)

data class CreateSubscriptionApiRequest(
    val userId: String,
    val schemeMasterId: String
)

data class CreateSubscriptionResponse(
    val subscriptionId: String,
    val keyId: String,
    val planName: String,
    val amountPaise: Long
)

data class ActivateSubscriptionApiRequest(
    val userId: String,
    val subscriptionId: String
)

data class FailedPaymentRequest(
    val userId: String,
    val orderId: String,
    val paymentId: String,
    val amountPaise: Long,
    val errorCode: String,
    val errorMessage: String
)

data class ReconcilePaymentResponse(
    val success: Boolean,
    val status: String,
    val reconciled: Boolean? = false
)
