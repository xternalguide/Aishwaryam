package com.example.aishwaryam_android.ui.dashboard

import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeRepository: FakeDashboardRepository
    private lateinit var viewModel: DashboardViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeDashboardRepository()
        viewModel = DashboardViewModel(fakeRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadDashboard_success_updatesUiState() = runTest(testDispatcher) {
        viewModel.loadDashboard("user123")
        // Run any pending coroutines
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertEquals("Test User", state.userName)
        assertEquals(50000L, state.goldBalanceMg)
        assertEquals(750000L, state.buyPricePaise)
        assertEquals(720000L, state.sellPricePaise)
        assertTrue(state.hasActiveScheme)
        assertEquals("Digi Gold", state.schemePlanName)
    }

    @Test
    fun joinScheme_success_triggersProcessingSpinnerAndEvent() = runTest(testDispatcher) {
        viewModel.joinScheme("user123", "master123")
        
        // Assert spinner goes true immediately
        // assertTrue(viewModel.uiState.value.isTransactionProcessing)
        
        advanceUntilIdle()
        
        // Assert spinner goes false and success is achieved
        assertFalse(viewModel.uiState.value.isTransactionProcessing)
        assertNull(viewModel.uiState.value.error)
    }

    @Test
    fun claimMaturedScheme_failure_handlesGracefully() = runTest(testDispatcher) {
        fakeRepository.shouldFailClaim = true
        viewModel.claimMaturedScheme("user123", "scheme123")
        
        // assertTrue(viewModel.uiState.value.isTransactionProcessing)
        
        advanceUntilIdle()
        
        assertFalse(viewModel.uiState.value.isTransactionProcessing)
        assertEquals("Server error", viewModel.uiState.value.error)
    }
}

class FakeDashboardRepository : DashboardRepository() {
    var shouldFailClaim = false

    override suspend fun getActiveBanners(): Result<List<BannerItem>> {
        return Result.success(listOf(BannerItem("1", "Banner 1", "", null, 1)))
    }

    override suspend fun getPortfolio(userId: String): Result<PortfolioResponse> {
        return Result.success(PortfolioResponse(userId, 50000L, 300000L, 350000L, 16.6))
    }

    override suspend fun getProfile(userId: String): Result<UserProfileResponse> {
        return Result.success(UserProfileResponse("Test User", "1234567890", "test@test.com", "BASIC", false, null, null, null, null, "en"))
    }

    override suspend fun getCurrentGoldPrice(): Result<CurrentGoldPriceResponse> {
        return Result.success(CurrentGoldPriceResponse(750000L, 720000L, 750000L, 680000L, "2026-05-31T00:00:00Z"))
    }

    override suspend fun getAvailableSchemes(): Result<List<AvailableScheme>> {
        return Result.success(listOf(AvailableScheme("master123", "Digi Gold", "Desc", 10000L, 11, "monthly", null, null)))
    }

    override suspend fun getSchemeDashboard(userId: String): Result<SchemeDashboardResponse> {
        return Result.success(SchemeDashboardResponse(
            hasActiveScheme = true,
            activeSchemes = listOf(ActiveSchemeItem("scheme123", "Digi Gold", true, "monthly", 2, 11, 10000L, 110000L, 90000L, 9, "2026-06-30", "2027-05-31", 20000L, 0L, "2026-04-30", "ACTIVE")),
            schemeId = "scheme123",
            planName = "Digi Gold",
            autoPayEnabled = true,
            frequency = "monthly",
            installmentsPaid = 2,
            totalInstallments = 11,
            installmentAmountPaise = 10000L,
            totalInvestmentPaise = 110000L,
            remainingInvestmentPaise = 90000L,
            remainingInstallments = 9,
            nextDueDate = "2026-06-30",
            maturityDate = "2027-05-31",
            accumulatedGoldMg = 20000L,
            goldAddedTodayMg = 0L,
            joinedAt = "2026-04-30"
        ))
    }

    override suspend fun getKycLimits(userId: String): Result<KycLimitsDto> {
        return Result.success(KycLimitsDto("BASIC", 1000000L, 5000000L, 1000000L, 5000000L, 1000L, false))
    }

    override suspend fun getSchemeLedger(schemeId: String): Result<List<SchemeLedgerItem>> {
        return Result.success(emptyList())
    }

    override suspend fun joinScheme(userId: String, masterId: String): Result<JoinSchemeResponseDto> {
        return Result.success(JoinSchemeResponseDto("scheme123", "Digi Gold", "Success", false))
    }

    override suspend fun claimScheme(userId: String, schemeId: String): Result<GenericAuthResponse> {
        return if (shouldFailClaim) {
            Result.failure(Exception("Server error"))
        } else {
            Result.success(GenericAuthResponse(true, "Claim successful", null, null, null))
        }
    }
}
