package com.example.aishwaryam_android.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.*
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

// ── UI State ────────────────────────────────────────────────────────────────
data class DashboardUiState(
    val isLoading: Boolean = true,
    val isTransactionProcessing: Boolean = false,
    val error: String? = null,

    // Card 1 – Ad Banners Carousel (from Admin)
    val banners: List<BannerItem> = emptyList(),

    // Card 2 – Live Gold Rate
    val buyPricePaise: Long = 0L,
    val sellPricePaise: Long = 0L,
    val price24KPaise: Long = 0L,
    val price22KPaise: Long = 0L,
    val priceUpdatedAt: String = "",

    // Card 3 – Gold Holdings
    val goldBalanceMg: Long = 0L,
    val investedAmountPaise: Long = 0L,
    val currentValuePaise: Long = 0L,
    val returnPercentage: Double = 0.0,

    // Card 4 – Recent Transactions
    val recentTransactions: List<TransactionItem> = emptyList(),

    // Extra Data
    val referralCode: String? = null,
    val referralBonusMsg: String? = null,
    val faqJson: String? = null,

    // Promotional Offers
    val activeOfferTitle: String? = null,
    val activeOfferDesc: String? = null,
    val activeOfferBonusPaise: Long = 0L,
    val activeOfferExpiresAt: String? = null,

    // Scheme Data
    val hasActiveScheme: Boolean = false,
    val schemePlanName: String? = null,
    val schemeFrequency: String? = null,
    val schemeInstallmentsPaid: Int = 0,
    val schemeTotalInstallments: Int = 0,
    val schemeInstallmentAmountPaise: Long = 0L,
    val schemeTotalInvestmentPaise: Long = 0L,
    val schemeRemainingInvestmentPaise: Long = 0L,
    val schemeRemainingInstallments: Int = 0,
    val schemeNextDueDate: String? = null,
    val schemeMaturityDate: String? = null,
    val schemeJoinedAt: String? = null,
    val schemeWeightSavedMg: Long = 0L,
    val schemeRewardEarnedMg: Long = 0L,
    val schemeTotalGoldSavedMg: Long = 0L,
    val goldAddedTodayMg: Long = 0L,
    val autoPayEnabled: Boolean = false,
    val schemeStatus: String? = null,
    val schemeId: String? = null,
    val schemeDayNumber: Int = 0,
    val currentBonusTierPercent: Double = 0.0,
    val remainingDaysForCurrentTier: Int = 0,
    val remainingDaysForScheme: Int = 0,
    val totalBonusEarnedPaise: Long = 0L,
    val totalBonusGoldMg: Long = 0L,
    val totalSavingsAddedPaise: Long = 0L,
    
    // Detailed Gold Breakdown
    val lockedGoldMg: Long = 0L,
    val maturedRedeemableGoldMg: Long = 0L,
    val redeemableGoldMg: Long = 0L,
    val redeemedGoldMg: Long = 0L,
    
    // Active Schemes List
    val activeSchemes: List<ActiveSchemeItem> = emptyList(),
    
    // Cached scheme ledgers for instant dropdown render
    val schemeLedgers: Map<String, List<SchemeLedgerItem>> = emptyMap(),

    // Available Schemes for joining
    val availableSchemes: List<AvailableScheme> = emptyList(),
    
    // User Identity & Verification
    val userName: String? = null,
    val userPhone: String? = null,
    val kycLevel: String = "BASIC",

    // Notifications
    val recentNotifications: List<UserNotificationDto> = emptyList(),
    val unreadNotificationCount: Int = 0,

    // KYC Limits
    val kycLimits: KycLimitsDto? = null
)

sealed class DashboardEvent {
    data class ShowNotification(val title: String, val message: String) : DashboardEvent()
    data class OperationSuccess(val message: String) : DashboardEvent()
    data class NavigateToSuccess(val receiptJson: String) : DashboardEvent()
}

class DashboardViewModel(
    private val repository: DashboardRepository = DashboardRepository()
) : ViewModel() {

    private var lastClearedUnreadCountAt: Long = 0L

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState

    val events = kotlinx.coroutines.flow.MutableSharedFlow<DashboardEvent>()

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    /** Call from the UI (e.g. OnResume / LaunchedEffect) to guarantee the spinner never stays stuck. */
    fun forceStopProcessing() {
        _uiState.update { it.copy(isTransactionProcessing = false) }
    }

    fun loadDashboard(userId: String) {
        viewModelScope.launch {
            // Instant cached state loading
            val cachedJson = ApiClient.sessionManagerInstance?.getCachedDashboard()
            if (!cachedJson.isNullOrEmpty()) {
                try {
                    val cachedState = Gson().fromJson(cachedJson, DashboardUiState::class.java)
                    _uiState.update { cachedState.copy(isLoading = false, error = null, isTransactionProcessing = false) }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            _uiState.update { current ->
                // Show shimmering only if we have never loaded the user's name or live gold rates yet
                val shouldShowLoading = current.userName == null && current.price22KPaise == 0L
                current.copy(isLoading = shouldShowLoading, error = null)
            }

            try {
                val jobs = listOf(
                    launch {
                        repository.getActiveBanners().onSuccess { result ->
                            _uiState.update { it.copy(banners = result) }
                        }
                    },
                    launch {
                        repository.getPortfolio(userId).onSuccess { portfolio ->
                            _uiState.update {
                                it.copy(
                                    goldBalanceMg = portfolio.goldBalanceMg,
                                    investedAmountPaise = portfolio.investedAmountPaise,
                                    currentValuePaise = portfolio.currentValuePaise,
                                    returnPercentage = portfolio.returnPercentage,
                                    lockedGoldMg = portfolio.lockedGoldMg,
                                    maturedRedeemableGoldMg = portfolio.maturedRedeemableGoldMg,
                                    redeemableGoldMg = portfolio.redeemableGoldMg,
                                    redeemedGoldMg = portfolio.redeemedGoldMg
                                )
                            }
                        }
                    },
                    launch {
                        repository.getProfile(userId).onSuccess { profile ->
                            _uiState.update {
                                it.copy(
                                    userName = profile.fullName,
                                    userPhone = profile.phoneNumber,
                                    kycLevel = profile.kycLevel ?: "BASIC"
                                )
                            }
                        }
                    },
                    launch {
                        repository.getCurrentGoldPrice().onSuccess { price ->
                            _uiState.update {
                                it.copy(
                                    buyPricePaise = price.buyPricePaise,
                                    sellPricePaise = price.sellPricePaise,
                                    price24KPaise = price.price24KPaise,
                                    price22KPaise = price.price22KPaise,
                                    priceUpdatedAt = price.updatedAt
                                )
                            }
                        }
                    },
                    launch {
                        repository.getAvailableSchemes().onSuccess { schemes ->
                            _uiState.update { it.copy(availableSchemes = schemes) }
                        }
                    },
                    launch {
                        repository.getSchemeDashboard(userId).onSuccess { scheme ->
                            _uiState.update {
                                it.copy(
                                    hasActiveScheme = scheme.hasActiveScheme,
                                    activeSchemes = scheme.activeSchemes,
                                    schemeId = scheme.schemeId,
                                    schemePlanName = scheme.planName,
                                    schemeFrequency = scheme.frequency,
                                    schemeInstallmentsPaid = scheme.installmentsPaid ?: 0,
                                    schemeTotalInstallments = scheme.totalInstallments ?: 0,
                                    schemeInstallmentAmountPaise = scheme.installmentAmountPaise ?: 0L,
                                    schemeTotalInvestmentPaise = scheme.totalInvestmentPaise ?: 0L,
                                    schemeRemainingInvestmentPaise = scheme.remainingInvestmentPaise ?: 0L,
                                    schemeRemainingInstallments = scheme.remainingInstallments ?: 0,
                                    schemeNextDueDate = scheme.nextDueDate,
                                    schemeMaturityDate = scheme.maturityDate,
                                    schemeJoinedAt = scheme.joinedAt,
                                    goldAddedTodayMg = scheme.goldAddedTodayMg,
                                    autoPayEnabled = scheme.autoPayEnabled ?: false,
                                    schemeWeightSavedMg = scheme.accumulatedGoldMg ?: 0L,
                                    schemeRewardEarnedMg = scheme.totalBonusGoldMg ?: 0L,
                                    schemeTotalGoldSavedMg = scheme.accumulatedGoldMg ?: 0L,
                                    lockedGoldMg = scheme.lockedGoldMg,
                                    maturedRedeemableGoldMg = scheme.maturedRedeemableGoldMg,
                                    redeemableGoldMg = scheme.redeemableGoldMg,
                                    redeemedGoldMg = scheme.redeemedGoldMg,
                                    schemeStatus = scheme.status,
                                    schemeDayNumber = scheme.schemeDayNumber ?: 0,
                                    currentBonusTierPercent = scheme.currentBonusTierPercent ?: 0.0,
                                    remainingDaysForCurrentTier = scheme.remainingDaysForCurrentTier ?: 0,
                                    remainingDaysForScheme = scheme.remainingDaysForScheme ?: 0,
                                    totalBonusEarnedPaise = scheme.totalBonusEarnedPaise ?: 0L,
                                    totalBonusGoldMg = scheme.totalBonusGoldMg ?: 0L,
                                    totalSavingsAddedPaise = scheme.totalSavingsAddedPaise ?: 0L
                                )
                            }

                            // Asynchronously prefetch ledgers for all active schemes
                            val ledgersMap = mutableMapOf<String, List<SchemeLedgerItem>>()
                            scheme.activeSchemes.forEach { activeScheme ->
                                repository.getSchemeLedger(activeScheme.schemeId).onSuccess { ledger ->
                                    ledgersMap[activeScheme.schemeId] = ledger
                                }
                            }
                            scheme.schemeId?.let { singleId ->
                                if (!ledgersMap.containsKey(singleId)) {
                                    repository.getSchemeLedger(singleId).onSuccess { ledger ->
                                        ledgersMap[singleId] = ledger
                                    }
                                }
                            }
                            _uiState.update { it.copy(schemeLedgers = ledgersMap) }
                        }
                    },
                    launch {
                        repository.getKycLimits(userId).onSuccess { limits ->
                            _uiState.update { it.copy(kycLimits = limits) }
                        }
                    }
                )

                // Asynchronously wait for all jobs to complete and serialize unified state to persistent cache
                viewModelScope.launch {
                    try {
                        jobs.forEach { it.join() }
                        val stateToCache = _uiState.value.copy(isLoading = false, error = null, isTransactionProcessing = false)
                        ApiClient.sessionManagerInstance?.saveCachedDashboard(Gson().toJson(stateToCache))
                        _uiState.update { it.copy(isLoading = false) }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to load dashboard: ${e.message}") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private var pollingJob: kotlinx.coroutines.Job? = null

    fun startPolling(userId: String) {
        if (pollingJob?.isActive == true) return
        pollingJob = viewModelScope.launch {
            while (isActive) {
                try {
                    repository.getActiveOffers(userId).onSuccess { offers ->
                        if (offers.isNotEmpty()) {
                            val active = offers.first()
                            _uiState.update {
                                it.copy(
                                    activeOfferTitle = active.title,
                                    activeOfferDesc = active.description,
                                    activeOfferBonusPaise = active.bonusWorthPaise,
                                    activeOfferExpiresAt = active.expiresAt
                                )
                            }
                        } else {
                            _uiState.update { it.copy(activeOfferTitle = null) }
                        }
                    }
                } catch (e: Exception) {}

                try {
                    repository.getUnreadNotificationCount().onSuccess { count ->
                        val timeDiff = System.currentTimeMillis() - lastClearedUnreadCountAt
                        if (count == 0 || timeDiff > 8000) {
                            _uiState.update {
                                it.copy(
                                    unreadNotificationCount = count
                                )
                            }
                        }
                    }
                } catch (e: Exception) {}

                delay(5000)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }

    fun clearUnreadCount() {
        lastClearedUnreadCountAt = System.currentTimeMillis()
        _uiState.update { it.copy(unreadNotificationCount = 0) }
    }

    fun refresh(userId: String) = loadDashboard(userId)

    fun joinScheme(userId: String, schemeMasterId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.joinScheme(userId, schemeMasterId).onSuccess {
                _uiState.update { it.copy(isTransactionProcessing = false) }
                events.emit(DashboardEvent.OperationSuccess("Successfully joined the scheme!"))
                loadDashboard(userId)
            }.onFailure { err ->
                _uiState.update { it.copy(isTransactionProcessing = false, error = err.message) }
            }
        }
    }

    fun initiatePayment(userId: String, amount: Long, schemeId: String? = null, onOrderCreated: (PaymentOrderResponse) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.createPaymentOrder(userId, amount, schemeId).onSuccess { order ->
                _uiState.update { it.copy(isTransactionProcessing = false) }
                onOrderCreated(order)
            }.onFailure { err ->
                _uiState.update { it.copy(isTransactionProcessing = false, error = err.message) }
            }
        }
    }

    fun handlePaymentFailure(userId: String, orderId: String, amountPaise: Long, errorCode: String, errorMessage: String) {
        viewModelScope.launch {
            repository.logFailedPayment(userId, orderId, "", amountPaise, errorCode, errorMessage)
        }
    }

    fun verifyAndJoinScheme(userId: String, schemeMasterId: String, orderId: String, paymentId: String, signature: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            // Step 1: Verify the payment — now returns full GoldTransactionResponse
            repository.verifyPayment(userId, orderId, paymentId, signature)
                .onSuccess { receipt ->
                    // Step 2: Payment verified — now officially join the scheme
                    repository.joinScheme(userId, schemeMasterId)
                        .onSuccess {
                            _uiState.update { it.copy(isTransactionProcessing = false) }
                            loadDashboard(userId)
                            val receiptJson = Gson().toJson(receipt)
                            events.emit(DashboardEvent.NavigateToSuccess(receiptJson))
                        }
                        .onFailure {
                            _uiState.update { it.copy(isTransactionProcessing = false, error = "Payment done but scheme join failed. Contact support.") }
                        }
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isTransactionProcessing = false, error = "Payment verification failed: ${err.message}") }
                }
        }
    }

    fun createSubscription(
        userId: String, 
        schemeMasterId: String, 
        onReady: (subscriptionId: String, keyId: String) -> Unit,
        onFailure: (String) -> Unit = {}
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.createSubscription(userId, schemeMasterId)
                .onSuccess { sub ->
                    _uiState.update { it.copy(isTransactionProcessing = false) }
                    onReady(sub.subscriptionId, sub.keyId)
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isTransactionProcessing = false, error = "AutoPay setup failed: ${err.message}") }
                    onFailure(err.message ?: "Unknown error")
                }
        }
    }

    fun activateSubscription(userId: String, subscriptionId: String, schemeMasterId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            // Link the subscription ID to the scheme record
            repository.activateSubscription(userId, subscriptionId)
                .onSuccess {
                    _uiState.update { it.copy(isTransactionProcessing = false) }
                    events.emit(DashboardEvent.OperationSuccess("✅ AutoPay activated! Gold will be credited automatically each cycle."))
                    loadDashboard(userId)
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isTransactionProcessing = false, error = "AutoPay activation failed: ${err.message}") }
                }
        }
    }

    fun payInstallment(
        userId: String,
        schemeId: String,
        amountPaise: Long,
        onFailure: (String) -> Unit = {},
        onSuccess: (PaymentOrderResponse) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.createPaymentOrder(userId, amountPaise, schemeId)
                .onSuccess { order ->
                    _uiState.update { it.copy(isTransactionProcessing = false) }
                    onSuccess(order)
                }
                .onFailure { err ->
                    val msg = "Payment initiation failed: ${err.message}"
                    _uiState.update { it.copy(isTransactionProcessing = false, error = msg) }
                    onFailure(msg)
                }
        }
    }

    fun joinSchemeAndProceedToPayment(
        userId: String,
        schemeMasterId: String,
        installmentAmountPaise: Long,
        onFailure: (String) -> Unit = {},
        onSuccess: (PaymentOrderResponse) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.joinScheme(userId, schemeMasterId)
                .onSuccess { res ->
                    repository.createPaymentOrder(userId, installmentAmountPaise, res.schemeId)
                        .onSuccess { order ->
                            _uiState.update { it.copy(isTransactionProcessing = false) }
                            onSuccess(order)
                        }
                        .onFailure { err ->
                            val msg = "Scheme joined but payment initiation failed: ${err.message}"
                            _uiState.update { it.copy(isTransactionProcessing = false, error = msg) }
                            onFailure(msg)
                        }
                }
                .onFailure { err ->
                    val msg = "Failed to join scheme: ${err.message}"
                    _uiState.update { it.copy(isTransactionProcessing = false, error = msg) }
                    onFailure(msg)
                }
        }
    }

    fun verifyInstallmentPayment(userId: String, orderId: String, paymentId: String, signature: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            try {
                repository.verifyPayment(userId, orderId, paymentId, signature)
                    .onSuccess { receipt ->
                        _uiState.update { it.copy(isTransactionProcessing = false) }
                        loadDashboard(userId)
                        val receiptJson = Gson().toJson(receipt)
                        events.emit(DashboardEvent.NavigateToSuccess(receiptJson))
                    }
                    .onFailure { err ->
                        _uiState.update { it.copy(isTransactionProcessing = false, error = "Payment verification failed: ${err.message}") }
                    }
            } catch (e: Exception) {
                // Safety net: always clear spinner even for unexpected coroutine exceptions
                _uiState.update { it.copy(isTransactionProcessing = false, error = "Unexpected error: ${e.message}") }
            }
        }
    }

    fun claimMaturedScheme(userId: String, schemeId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isTransactionProcessing = true, error = null) }
            repository.claimScheme(userId, schemeId)
                .onSuccess {
                    _uiState.update { it.copy(isTransactionProcessing = false) }
                    events.emit(DashboardEvent.OperationSuccess("Scheme claimed successfully! Check your redeemable balance."))
                    loadDashboard(userId)
                }
                .onFailure { err ->
                    _uiState.update { it.copy(isTransactionProcessing = false, error = err.message) }
                }
        }
    }
}
