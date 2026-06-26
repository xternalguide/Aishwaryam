package com.example.aishwaryam_android.ui.schemes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.SchemeLedgerItem
import com.example.aishwaryam_android.network.SchemeProgressResponse
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SchemeDetailUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val progress: SchemeProgressResponse? = null,
    val ledger: List<SchemeLedgerItem> = emptyList(),
    val filteredLedger: List<SchemeLedgerItem> = emptyList(),
    val ledgerFilter: String = "ALL", // ALL, PURCHASE, BONUS
    val isRedemptionSubmitting: Boolean = false,
    val redemptionError: String? = null,
    val redemptionSuccessMessage: String? = null
)

sealed interface SchemeDetailEvent {
    object RedemptionSuccess : SchemeDetailEvent
    data class ShowToast(val message: String) : SchemeDetailEvent
}

class SchemeDetailViewModel(
    private val repository: DashboardRepository = DashboardRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(SchemeDetailUiState())
    val uiState: StateFlow<SchemeDetailUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<SchemeDetailEvent>()
    val events: SharedFlow<SchemeDetailEvent> = _events.asSharedFlow()

    fun loadSchemeDetails(schemeId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                // Fetch progress
                val progressResult = repository.getSchemeProgress(schemeId)
                val progress = progressResult.getOrNull()

                // Fetch ledger
                val ledgerResult = repository.getSchemeLedger(schemeId)
                val ledger = ledgerResult.getOrNull() ?: emptyList()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    progress = progress,
                    ledger = ledger,
                    error = if (progress == null) "Failed to load scheme progress" else null
                )
                applyLedgerFilter()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "An unexpected error occurred"
                )
            }
        }
    }

    fun setLedgerFilter(filter: String) {
        _uiState.value = _uiState.value.copy(ledgerFilter = filter)
        applyLedgerFilter()
    }

    private fun applyLedgerFilter() {
        val state = _uiState.value
        val filtered = when (state.ledgerFilter) {
            "PURCHASE" -> state.ledger.filter { it.transactionType.equals("INSTALLMENT", ignoreCase = true) }
            "BONUS" -> state.ledger.filter { it.transactionType.equals("BONUS", ignoreCase = true) }
            else -> state.ledger
        }
        _uiState.value = state.copy(filteredLedger = filtered)
    }

    fun requestRedemption(userId: String, schemeId: String, type: String, address: String?, includeBonusGold: Boolean = false) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRedemptionSubmitting = true, redemptionError = null, redemptionSuccessMessage = null)
            try {
                val result = repository.requestRedemption(userId, schemeId, type, address, includeBonusGold)
                if (result.isSuccess) {
                    val response = result.getOrThrow()
                    if (response.success) {
                        _uiState.value = _uiState.value.copy(
                            isRedemptionSubmitting = false,
                            redemptionSuccessMessage = response.message ?: "Redemption request submitted successfully"
                        )
                        _events.emit(SchemeDetailEvent.RedemptionSuccess)
                        // Refresh details
                        loadSchemeDetails(schemeId)
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isRedemptionSubmitting = false,
                            redemptionError = response.message ?: "Failed to submit redemption request"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isRedemptionSubmitting = false,
                        redemptionError = result.exceptionOrNull()?.message ?: "Redemption submission failed"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isRedemptionSubmitting = false,
                    redemptionError = e.message ?: "An unexpected error occurred"
                )
            }
        }
    }
}
