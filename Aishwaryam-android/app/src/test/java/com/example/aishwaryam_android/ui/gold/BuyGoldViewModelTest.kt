package com.example.aishwaryam_android.ui.gold

import com.example.aishwaryam_android.network.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class BuyGoldViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeApiService: FakeApiServiceForBuyGold
    private lateinit var viewModel: BuyGoldViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeApiService = FakeApiServiceForBuyGold()
        viewModel = BuyGoldViewModel(fakeApiService)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadPriceAndLock_success_updatesUiStateAndLockId() = runTest(testDispatcher) {
        viewModel.loadPriceAndLock("user123")
        
        advanceUntilIdle()
        
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertEquals(750000L, state.buyPricePaise)
        assertEquals("lock_999", state.priceLockId)
        assertEquals("Live", state.priceSource)
    }

    @Test
    fun onAmountChanged_updatesWeightAndGstCorrectly() = runTest(testDispatcher) {
        // Set locked price first (e.g. 750000 paise = ₹7500/g)
        viewModel.loadPriceAndLock("user123")
        advanceUntilIdle()

        // Amount input of ₹1030.00
        viewModel.onAmountChanged("1030.0")

        val state = viewModel.uiState.value
        assertEquals("1030.0", state.amountInput)
        // 1030 / (7500 * 1.03) = 0.1333g weight
        assertEquals("0.1333", state.weightInput)
        // GST is 1030 - (1030 / 1.03) = ₹30.00 = 3000 paise
        assertEquals(3000L, state.gstPaise)
        assertEquals(103000L, state.totalToPayPaise)
    }

    @Test
    fun onWeightChanged_updatesAmountAndGstCorrectly() = runTest(testDispatcher) {
        viewModel.loadPriceAndLock("user123")
        advanceUntilIdle()

        // Weight input of 1.0 gram
        viewModel.onWeightChanged("1.0")

        val state = viewModel.uiState.value
        assertEquals("1.0", state.weightInput)
        // Base amount: 1.0 * ₹7500 = ₹7500
        // GST: 7500 * 0.03 = ₹225
        // Total: 7500 + 225 = ₹7725.00
        assertEquals("7725.00", state.amountInput)
        assertEquals(22500L, state.gstPaise)
        assertEquals(772500L, state.totalToPayPaise)
    }

    @Test
    fun buyGold_success_updatesPurchaseSuccess() = runTest(testDispatcher) {
        viewModel.loadPriceAndLock("user123")
        advanceUntilIdle()

        // Set valid amount
        viewModel.onAmountChanged("1030.0")
        
        viewModel.buyGold("user123", "android_fingerprint")
        
        advanceUntilIdle()
        
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertTrue(state.purchaseSuccess)
        assertNotNull(state.receiptJson)
        assertNull(state.error)
    }
}

// Subclass ApiService and implement only needed methods for testing
class FakeApiServiceForBuyGold : ApiService {
    override suspend fun getLivePrice(): Response<CurrentGoldPriceResponse> {
        return Response.success(CurrentGoldPriceResponse(750000L, 720000L, 750000L, 680000L, "2026-05-31T00:00:00Z"))
    }

    override suspend fun lockGoldPrice(userId: String): Response<PriceLockResponse> {
        return Response.success(PriceLockResponse("lock_999", 750000L, 720000L, "2026-05-31T12:00:00Z", "2026-05-31T12:05:00Z", 300))
    }

    override suspend fun buyGold(request: BuyGoldRequest): Response<GoldTransactionResponse> {
        return Response.success(GoldTransactionResponse(
            success = true,
            message = "Purchased successfully",
            goldWeightMg = 133333L,
            pricePerGmPaise = 750000L,
            totalAmountPaise = request.totalAmountPaise,
            baseAmountPaise = 100000L,
            gstAmountPaise = 3000L,
            newWalletBalancePaise = 0L,
            newGoldBalanceMg = 133333L
        ))
    }

    // Unused overrides
    override suspend fun sendOtp(request: SendOtpRequest) = TODO()
    override suspend fun verifyOtp(request: VerifyOtpRequest) = TODO()
    override suspend fun verifyFirebaseToken(request: VerifyFirebaseTokenRequest) = TODO()
    override suspend fun setMpin(request: SetMpinRequest) = TODO()
    override suspend fun verifyMpin(request: VerifyMpinRequest) = TODO()
    override suspend fun getProfile(userId: String) = TODO()
    override suspend fun updateProfile(userId: String, request: UpdateProfileRequest) = TODO()
    override suspend fun deleteAccount(userId: String): Response<GenericAuthResponse> = TODO()
    override suspend fun getBankAccounts(userId: String) = TODO()
    override suspend fun addBankAccount(request: AddBankAccountRequest) = TODO()
    override suspend fun submitKyc(request: SubmitKycRequest) = TODO()
    override suspend fun changeMpin(request: ChangeMpinRequest) = TODO()
    override suspend fun sellGold(request: SellGoldRequest) = TODO()
    override suspend fun getAvailableSchemes() = TODO()
    override suspend fun getSchemeDashboard(userId: String) = TODO()
    override suspend fun joinScheme(request: JoinSchemeRequest) = TODO()
    override suspend fun toggleAutoPay(request: ToggleAutoPayRequest) = TODO()
    override suspend fun getMaturitySummary(schemeId: String) = TODO()
    override suspend fun claimScheme(request: ClaimSchemeRequest) = TODO()
    override suspend fun getSchemeLedger(schemeId: String) = TODO()
    override suspend fun getSchemeProgress(schemeId: String) = TODO()
    override suspend fun requestRedemption(request: RequestRedemptionRequest) = TODO()
    override suspend fun investInScheme(request: InvestSchemeRequest) = TODO()
    override suspend fun createPaymentOrder(request: PaymentOrderRequest) = TODO()
    override suspend fun verifyPayment(request: PaymentVerificationRequest) = TODO()
    override suspend fun logFailedPayment(request: FailedPaymentRequest) = TODO()
    override suspend fun reconcilePayment(orderId: String) = TODO()
    override suspend fun createSubscription(request: CreateSubscriptionApiRequest) = TODO()
    override suspend fun activateSubscription(request: ActivateSubscriptionApiRequest) = TODO()
    override suspend fun getReferralNetwork(userId: String) = TODO()
    override suspend fun getDashboardOverview(userId: String) = TODO()
    override suspend fun getActiveBanners() = TODO()
    override suspend fun getBannersByLocation(location: String) = TODO()
    override suspend fun getPortfolio(userId: String) = TODO()
    override suspend fun getRecentTransactions(userId: String) = TODO()
    override suspend fun getConfig() = TODO()
    override suspend fun getActiveOffers(userId: String) = TODO()
    override suspend fun getUserNotifications() = TODO()
    override suspend fun getUnreadNotificationCount() = TODO()
    override suspend fun markNotificationAsRead(notificationId: String) = TODO()
    override suspend fun deleteNotification(notificationId: String) = TODO()
    override suspend fun registerFcmToken(request: Map<String, String>) = TODO()
    override suspend fun unregisterFcmToken(request: Map<String, String>) = TODO()
    override suspend fun getKycLimits(userId: String) = TODO()
    override suspend fun refreshToken(request: RefreshTokenApiRequest) = TODO()
    override suspend fun logout(request: RefreshTokenApiRequest) = TODO()
    override suspend fun revokeAllSessions() = TODO()
    override suspend fun queryAssistant(request: ChatbotQueryRequest) = TODO()
}
