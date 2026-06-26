package com.example.aishwaryam_android.data

import com.example.aishwaryam_android.network.*

open class DashboardRepository {
    suspend fun getDashboardOverview(userId: String): Result<DashboardOverviewResponse> = runCatching {
        val response = ApiClient.apiService.getDashboardOverview(userId)
        response.body() ?: error("Failed to load dashboard")
    }

    open suspend fun getSchemeDashboard(userId: String): Result<SchemeDashboardResponse> = runCatching {
        val response = ApiClient.apiService.getSchemeDashboard(userId)
        response.body() ?: error("Failed to load scheme dashboard")
    }

    suspend fun toggleAutoPay(userId: String, schemeId: String, enable: Boolean): Result<GenericAuthResponse> = runCatching {
        val response = ApiClient.apiService.toggleAutoPay(ToggleAutoPayRequest(userId, schemeId, enable))
        response.body() ?: error("Failed to toggle autopay")
    }

    suspend fun getReferralNetwork(userId: String): Result<ReferralNetworkResponse> = runCatching {
        val response = ApiClient.apiService.getReferralNetwork(userId)
        response.body() ?: error("Empty referral network response")
    }

    open suspend fun getAvailableSchemes(): Result<List<AvailableScheme>> = runCatching {
        val response = ApiClient.apiService.getAvailableSchemes()
        response.body() ?: error("Empty scheme list response")
    }

    open suspend fun joinScheme(userId: String, masterId: String): Result<JoinSchemeResponseDto> = runCatching {
        val response = ApiClient.apiService.joinScheme(JoinSchemeRequest(userId, masterId))
        if (!response.isSuccessful) {
            val errorBody = response.errorBody()?.string()
            if (errorBody?.contains("KYC_REQUIRED") == true) {
                error("KYC_REQUIRED")
            }
            error("Failed to join scheme: ${response.message()}")
        }
        response.body() ?: error("Empty response body from join scheme")
    }

    open suspend fun createPaymentOrder(userId: String, amountPaise: Long, schemeId: String? = null): Result<PaymentOrderResponse> = runCatching {
        val response = ApiClient.apiService.createPaymentOrder(PaymentOrderRequest(userId, amountPaise, schemeId))
        response.body() ?: error("Failed to create payment order")
    }

    open suspend fun verifyPayment(userId: String, orderId: String, paymentId: String, signature: String): Result<com.example.aishwaryam_android.network.GoldTransactionResponse> = runCatching {
        val response = ApiClient.apiService.verifyPayment(PaymentVerificationRequest(userId, orderId, paymentId, signature))
        if (!response.isSuccessful) throw Exception("Verification failed")
        response.body() ?: throw Exception("Empty response body")
    }

    suspend fun logFailedPayment(userId: String, orderId: String, paymentId: String, amountPaise: Long, errorCode: String, errorMessage: String): Result<Unit> = runCatching {
        val response = ApiClient.apiService.logFailedPayment(FailedPaymentRequest(userId, orderId, paymentId, amountPaise, errorCode, errorMessage))
        if (!response.isSuccessful) error("Failed to log payment error")
    }

    open suspend fun getActiveBanners(): Result<List<BannerItem>> = runCatching {
        val response = ApiClient.apiService.getActiveBanners()
        response.body()?.banners ?: error("Failed to load banners")
    }

    open suspend fun getPortfolio(userId: String): Result<PortfolioResponse> = runCatching {
        val response = ApiClient.apiService.getPortfolio(userId)
        response.body() ?: error("Failed to load portfolio")
    }

    open suspend fun getCurrentGoldPrice(): Result<CurrentGoldPriceResponse> = runCatching {
        val response = ApiClient.apiService.getLivePrice()
        response.body() ?: error("Failed to load gold price")
    }

    suspend fun getRecentTransactions(userId: String): Result<List<TransactionItem>> = runCatching {
        val response = ApiClient.apiService.getRecentTransactions(userId)
        response.body() ?: error("Failed to load transactions")
    }

    suspend fun getConfig(): Result<AppConfigResponse> = runCatching {
        val response = ApiClient.apiService.getConfig()
        response.body() ?: error("Failed to load config")
    }

    open suspend fun getProfile(userId: String): Result<UserProfileResponse> = runCatching {
        val response = ApiClient.apiService.getProfile(userId)
        response.body() ?: error("Failed to load profile")
    }

    suspend fun getActiveOffers(userId: String): Result<List<OfferItemDto>> = runCatching {
        val response = ApiClient.apiService.getActiveOffers(userId)
        response.body() ?: error("Failed to load active offers")
    }

    suspend fun getUnreadNotificationCount(): Result<Int> = runCatching {
        val response = ApiClient.apiService.getUnreadNotificationCount()
        response.body()?.count ?: error("Failed to load notifications count")
    }

    suspend fun markNotificationAsRead(notificationId: String): Result<Unit> = runCatching {
        val response = ApiClient.apiService.markNotificationAsRead(notificationId)
        if (!response.isSuccessful) error("Failed to mark as read")
    }

    open suspend fun createSubscription(userId: String, schemeMasterId: String): Result<CreateSubscriptionResponse> = runCatching {
        val response = ApiClient.apiService.createSubscription(CreateSubscriptionApiRequest(userId, schemeMasterId))
        response.body() ?: error("Failed to create subscription")
    }

    open suspend fun activateSubscription(userId: String, subscriptionId: String): Result<Unit> = runCatching {
        val response = ApiClient.apiService.activateSubscription(ActivateSubscriptionApiRequest(userId, subscriptionId))
        if (!response.isSuccessful) error("Failed to activate subscription")
    }

    open suspend fun claimScheme(userId: String, schemeId: String): Result<GenericAuthResponse> = runCatching {
        val response = ApiClient.apiService.claimScheme(ClaimSchemeRequest(userId, schemeId))
        response.body() ?: error("Failed to claim scheme")
    }

    open suspend fun getKycLimits(userId: String): Result<KycLimitsDto> = runCatching {
        val response = ApiClient.apiService.getKycLimits(userId)
        response.body() ?: error("Failed to load KYC limits")
    }

    open suspend fun getSchemeLedger(schemeId: String): Result<List<SchemeLedgerItem>> = runCatching {
        val response = ApiClient.apiService.getSchemeLedger(schemeId)
        if (!response.isSuccessful) throw Exception("Failed to load scheme ledger: ${response.message()}")
        response.body() ?: emptyList()
    }

    open suspend fun getSchemeProgress(schemeId: String): Result<SchemeProgressResponse> = runCatching {
        val response = ApiClient.apiService.getSchemeProgress(schemeId)
        if (!response.isSuccessful) throw Exception("Failed to load scheme progress: ${response.message()}")
        response.body() ?: throw Exception("Empty progress response body")
    }

    open suspend fun requestRedemption(userId: String, schemeId: String, type: String, address: String?, includeBonusGold: Boolean = false): Result<RequestRedemptionResponse> = runCatching {
        val response = ApiClient.apiService.requestRedemption(RequestRedemptionRequest(userId, schemeId, type, address, includeBonusGold))
        if (!response.isSuccessful) throw Exception("Redemption request failed: ${response.message()}")
        response.body() ?: throw Exception("Empty redemption response body")
    }

    suspend fun investInScheme(userId: String, schemeId: String, amountPaise: Long, razorpayPaymentId: String?): Result<InvestSchemeResponse> = runCatching {
        val response = ApiClient.apiService.investInScheme(InvestSchemeRequest(userId, schemeId, amountPaise, razorpayPaymentId))
        if (!response.isSuccessful) throw Exception("Investment failed: ${response.message()}")
        response.body() ?: throw Exception("Empty investment response body")
    }

    suspend fun getBankAccounts(userId: String): Result<List<BankAccountDto>> = runCatching {
        val response = ApiClient.apiService.getBankAccounts(userId)
        if (!response.isSuccessful) throw Exception("Failed to load bank accounts: ${response.message()}")
        response.body() ?: emptyList()
    }

    suspend fun addBankAccount(userId: String, accountNumber: String, ifscCode: String, bankName: String): Result<GenericAuthResponse> = runCatching {
        val response = ApiClient.apiService.addBankAccount(AddBankAccountRequest(userId, accountNumber, ifscCode, bankName))
        if (!response.isSuccessful) throw Exception("Failed to add bank account: ${response.message()}")
        response.body() ?: throw Exception("Empty response body from bank addition")
    }
}
