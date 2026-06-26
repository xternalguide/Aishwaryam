package com.example.aishwaryam_android.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.TransactionItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class TransactionsUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val allTransactions: List<TransactionItem> = emptyList(),
    val displayedTransactions: List<TransactionItem> = emptyList(),
    val filterType: String = "ALL", // ALL, BUY, SELL
    val sortOrder: String = "NEWEST" // NEWEST, OLDEST
)

class TransactionsViewModel : ViewModel() {
    private val repository = DashboardRepository()
    private val _uiState = MutableStateFlow(TransactionsUiState())
    val uiState: StateFlow<TransactionsUiState> = _uiState

    fun loadTransactions(userId: String) {
        viewModelScope.launch {
            val current = _uiState.value
            // Only show full loading if we have no data
            _uiState.value = current.copy(isLoading = current.allTransactions.isEmpty(), error = null)
            try {
                val result = repository.getRecentTransactions(userId)
                val transactions = result.getOrNull() ?: emptyList<TransactionItem>()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    allTransactions = transactions
                )
                applyFilters()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun setFilterType(type: String) {
        _uiState.value = _uiState.value.copy(filterType = type)
        applyFilters()
    }

    fun setSortOrder(order: String) {
        _uiState.value = _uiState.value.copy(sortOrder = order)
        applyFilters()
    }

    private fun applyFilters() {
        val state = _uiState.value
        var filtered = if (state.filterType == "ALL") {
            state.allTransactions
        } else {
            state.allTransactions.filter { it.type.equals(state.filterType, ignoreCase = true) }
        }

        filtered = if (state.sortOrder == "NEWEST") {
            filtered.sortedByDescending { it.createdAt }
        } else {
            filtered.sortedBy { it.createdAt }
        }

        _uiState.value = state.copy(displayedTransactions = filtered)
    }
}
