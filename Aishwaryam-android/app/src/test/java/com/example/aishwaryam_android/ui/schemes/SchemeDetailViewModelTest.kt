package com.example.aishwaryam_android.ui.schemes

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
class SchemeDetailViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeRepository: FakeDashboardRepositoryForSchemes
    private lateinit var viewModel: SchemeDetailViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeDashboardRepositoryForSchemes()
        viewModel = SchemeDetailViewModel(fakeRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun loadSchemeDetails_success_populatesProgressAndLedgers() = runTest(testDispatcher) {
        viewModel.loadSchemeDetails("scheme123")
        
        advanceUntilIdle()
        
        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.progress)
        assertEquals("Digi Gold", state.progress?.planName)
        assertEquals(2, state.ledger.size)
        assertEquals(2, state.filteredLedger.size)
    }

    @Test
    fun setLedgerFilter_correctlyFiltersLedgers() = runTest(testDispatcher) {
        viewModel.loadSchemeDetails("scheme123")
        advanceUntilIdle()
        
        // Filter by PURCHASE (transaction type = INSTALLMENT)
        viewModel.setLedgerFilter("PURCHASE")
        assertEquals(1, viewModel.uiState.value.filteredLedger.size)
        assertEquals("INSTALLMENT", viewModel.uiState.value.filteredLedger[0].transactionType)

        // Filter by BONUS
        viewModel.setLedgerFilter("BONUS")
        assertEquals(1, viewModel.uiState.value.filteredLedger.size)
        assertEquals("BONUS", viewModel.uiState.value.filteredLedger[0].transactionType)
    }

    @Test
    fun requestRedemption_success_updatesUiStateAndTriggerEvent() = runTest(testDispatcher) {
        viewModel.requestRedemption("user123", "scheme123", "JEWELLERY", "No. 1 Main Street")
        
        advanceUntilIdle()
        
        val state = viewModel.uiState.value
        assertFalse(state.isRedemptionSubmitting)
        assertNull(state.redemptionError)
        assertEquals("Redemption request submitted successfully", state.redemptionSuccessMessage)
    }
}

class FakeDashboardRepositoryForSchemes : DashboardRepository() {

    override suspend fun getSchemeProgress(schemeId: String): Result<SchemeProgressResponse> {
        return Result.success(SchemeProgressResponse(
            schemeId = schemeId,
            planName = "Digi Gold",
            installmentsPaid = 2,
            totalInstallments = 11,
            installmentAmountPaise = 10000L,
            totalSavingsAddedPaise = 20000L,
            totalBonusEarnedPaise = 1500L,
            totalBonusGoldMg = 150L,
            accumulatedGoldMg = 20000L,
            schemeDayNumber = 60,
            currentBonusTierPercent = 7.5,
            remainingDaysForCurrentTier = 15,
            remainingDaysForScheme = 270,
            status = "ACTIVE",
            joinedAt = "2026-04-01T00:00:00Z",
            maturityDate = "2027-03-01T00:00:00Z",
            milestones = emptyList()
        ))
    }

    override suspend fun getSchemeLedger(schemeId: String): Result<List<SchemeLedgerItem>> {
        return Result.success(listOf(
            SchemeLedgerItem("l1", schemeId, "user123", "INSTALLMENT", 1, 10000L, 9709L, 291L, 1000L, 950000L, 0.0, 0L, 0L, "pay_1", "COMPLETED", "2026-04-02T00:00:00Z"),
            SchemeLedgerItem("l2", schemeId, "user123", "BONUS", 2, 0L, 0L, 0L, 75L, 950000L, 7.5, 750L, 75L, null, "COMPLETED", "2026-04-03T00:00:00Z")
        ))
    }

    override suspend fun requestRedemption(userId: String, schemeId: String, type: String, address: String?, includeBonusGold: Boolean): Result<RequestRedemptionResponse> {
        return Result.success(RequestRedemptionResponse(true, "Redemption request submitted successfully", "red_123", "PENDING"))
    }
}
