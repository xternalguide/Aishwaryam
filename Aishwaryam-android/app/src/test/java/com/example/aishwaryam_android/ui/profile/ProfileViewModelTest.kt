package com.example.aishwaryam_android.ui.profile

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
class ProfileViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeApiService: FakeApiServiceForProfile
    private lateinit var viewModel: ProfileViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeApiService = FakeApiServiceForProfile()
        viewModel = ProfileViewModel(fakeApiService)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadProfile_success_updatesUiState() = runTest(testDispatcher) {
        viewModel.loadProfile("user123")
        
        assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()
        
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.profile)
        assertEquals("Test User", state.profile?.fullName)
        assertNull(state.error)
    }

    @Test
    fun updateProfile_success_reloadsProfileAndTriggersSuccessCallback() = runTest(testDispatcher) {
        var callbackTriggered = false
        
        viewModel.updateProfile(
            userId = "user123",
            fullName = "Updated Name",
            onSuccess = { callbackTriggered = true },
            onError = {}
        )
        
        assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()
        
        assertTrue(callbackTriggered)
        assertFalse(viewModel.uiState.value.isLoading)
        assertEquals("Updated Name", viewModel.uiState.value.profile?.fullName)
    }

    @Test
    fun addBankAccount_success_updatesBankAccounts() = runTest(testDispatcher) {
        var callbackTriggered = false
        
        viewModel.addBankAccount(
            userId = "user123",
            accountNumber = "12345678901",
            ifscCode = "ABCD0123456",
            bankName = "Test Bank",
            onSuccess = { callbackTriggered = true },
            onError = {}
        )
        
        assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()
        
        assertTrue(callbackTriggered)
        assertFalse(viewModel.uiState.value.isLoading)
        assertEquals(1, viewModel.bankAccounts.value.size)
        assertEquals("Test Bank", viewModel.bankAccounts.value[0].bankName)
    }

    @Test
    fun submitKyc_success_reloadsProfileWithUpdatedKycLevel() = runTest(testDispatcher) {
        var callbackTriggered = false
        
        viewModel.submitKyc(
            userId = "user123",
            docType = "AADHAAR",
            docNum = "123412341234",
            docUrl = "http://doc.url",
            onSuccess = { callbackTriggered = true },
            onError = {}
        )
        
        assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()
        
        assertTrue(callbackTriggered)
        assertFalse(viewModel.uiState.value.isLoading)
        assertEquals("VERIFIED", viewModel.uiState.value.profile?.kycLevel)
    }

    @Test
    fun deleteAccount_success_triggersCallback() = runTest(testDispatcher) {
        var callbackTriggered = false
        viewModel.deleteAccount(
            userId = "user123",
            onSuccess = { callbackTriggered = true },
            onError = {}
        )
        assertTrue(viewModel.uiState.value.isLoading)
        advanceUntilIdle()
        assertTrue(callbackTriggered)
        assertFalse(viewModel.uiState.value.isLoading)
    }
}

class FakeApiServiceForProfile : ApiService {
    private var currentProfileName = "Test User"
    private var currentKycLevel = "BASIC"
    private val bankAccountsList = mutableListOf<BankAccountDto>()

    override suspend fun getProfile(userId: String): Response<UserProfileResponse> {
        return Response.success(UserProfileResponse(
            fullName = currentProfileName,
            phoneNumber = "9876543210",
            email = "test@test.com",
            kycLevel = currentKycLevel,
            biometricEnabled = false,
            referralCode = "REF123",
            referredByCode = null,
            dateOfBirth = "1990-01-01",
            nomineeName = "Nominee",
            preferredLanguage = "en"
        ))
    }

    override suspend fun updateProfile(userId: String, request: UpdateProfileRequest): Response<GenericAuthResponse> {
        request.fullName?.let { currentProfileName = it }
        return Response.success(GenericAuthResponse(true, "Updated successfully", null, null, null))
    }

    override suspend fun getBankAccounts(userId: String): Response<List<BankAccountDto>> {
        return Response.success(bankAccountsList)
    }

    override suspend fun addBankAccount(request: AddBankAccountRequest): Response<GenericAuthResponse> {
        bankAccountsList.add(BankAccountDto("b1", request.bankName, "XXXXXX1234", request.ifscCode, true, "2026-05-31"))
        return Response.success(GenericAuthResponse(true, "Bank added successfully", null, null, null))
    }

    override suspend fun submitKyc(request: SubmitKycRequest): Response<GenericAuthResponse> {
        currentKycLevel = "VERIFIED"
        return Response.success(GenericAuthResponse(true, "KYC submitted successfully", null, null, null))
    }

    override suspend fun changeMpin(request: ChangeMpinRequest): Response<GenericAuthResponse> {
        return Response.success(GenericAuthResponse(true, "MPIN changed", null, null, null))
    }

    override suspend fun deleteAccount(userId: String): Response<GenericAuthResponse> {
        return Response.success(GenericAuthResponse(true, "Account deleted successfully", null, null, null))
    }

    // Unused overrides
    override suspend fun sendOtp(request: SendOtpRequest) = TODO()
    override suspend fun verifyOtp(request: VerifyOtpRequest) = TODO()
    override suspend fun verifyFirebaseToken(request: VerifyFirebaseTokenRequest) = TODO()
    override suspend fun setMpin(request: SetMpinRequest) = TODO()
    override suspend fun verifyMpin(request: VerifyMpinRequest) = TODO()
    override suspend fun getLivePrice() = TODO()
    override suspend fun lockGoldPrice(userId: String) = TODO()
    override suspend fun buyGold(request: BuyGoldRequest) = TODO()
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
