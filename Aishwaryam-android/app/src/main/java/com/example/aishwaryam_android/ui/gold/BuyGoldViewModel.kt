package com.example.aishwaryam_android.ui.gold

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.network.ApiService
import com.example.aishwaryam_android.network.BuyGoldRequest
import com.example.aishwaryam_android.network.GoldTransactionResponse
import com.google.gson.Gson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BuyGoldUiState(
    val buyPricePaise: Long = 0,
    val amountInput: String = "",
    val weightInput: String = "",
    val gstPaise: Long = 0,
    val totalToPayPaise: Long = 0,
    val isLoading: Boolean = false,
    val error: String? = null,
    val purchaseSuccess: Boolean = false,
    val receiptJson: String? = null,
    val priceLockId: String? = null,
    val priceUpdatedAt: String? = null,
    val priceSource: String = "Live",
    val isFallback: Boolean = false,
    val lockExpiresAt: String? = null
)

class BuyGoldViewModel(private val apiService: ApiService) : ViewModel() {

    private val _uiState = MutableStateFlow(BuyGoldUiState())
    val uiState: StateFlow<BuyGoldUiState> = _uiState.asStateFlow()

    fun loadPriceAndLock(userId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val liveResponse = apiService.getLivePrice()
                if (liveResponse.isSuccessful) {
                    val livePrice = liveResponse.body()
                    if (livePrice != null) {
                        _uiState.update { it.copy(
                            priceUpdatedAt = livePrice.updatedAt,
                            priceSource = livePrice.source,
                            isFallback = livePrice.isFallback
                        )}
                    }
                }

                val lockResponse = apiService.lockGoldPrice(userId)
                if (lockResponse.isSuccessful) {
                    val lock = lockResponse.body()
                    if (lock != null) {
                        _uiState.update { it.copy(
                            buyPricePaise = lock.lockedBuyPricePaise,
                            priceLockId = lock.lockId,
                            lockExpiresAt = lock.expiresAt
                        )}
                    }
                } else {
                    _uiState.update { it.copy(error = "Failed to lock price.") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to load live price") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun onAmountChanged(amountStr: String) {
        val amount = amountStr.toDoubleOrNull() ?: 0.0
        val pricePerGm = _uiState.value.buyPricePaise / 100.0
        
        if (pricePerGm > 0) {
            val weight = amount / (pricePerGm * 1.03) // 1.03 to include 3% GST in the amount
            val gst = amount - (amount / 1.03)
            
            _uiState.update { 
                it.copy(
                    amountInput = amountStr,
                    weightInput = if (amount > 0) String.format("%.4f", weight) else "",
                    gstPaise = (gst * 100).toLong(),
                    totalToPayPaise = (amount * 100).toLong()
                )
            }
        }
    }

    fun onWeightChanged(weightStr: String) {
        val weight = weightStr.toDoubleOrNull() ?: 0.0
        val pricePerGm = _uiState.value.buyPricePaise / 100.0
        
        if (pricePerGm > 0) {
            val baseAmount = weight * pricePerGm
            val gst = baseAmount * 0.03
            val total = baseAmount + gst
            
            _uiState.update { 
                it.copy(
                    weightInput = weightStr,
                    amountInput = if (weight > 0) String.format("%.2f", total) else "",
                    gstPaise = (gst * 100).toLong(),
                    totalToPayPaise = (total * 100).toLong()
                )
            }
        }
    }

    fun buyGold(userId: String, fingerprint: String) {
        val amountPaise = _uiState.value.totalToPayPaise
        if (amountPaise <= 0) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val req = BuyGoldRequest(userId, amountPaise, fingerprint).apply {
                    priceLockId = _uiState.value.priceLockId
                }
                val response = apiService.buyGold(req)
                if (response.isSuccessful && response.body()?.success == true) {
                    val receiptJson = Gson().toJson(response.body())
                    _uiState.update { it.copy(isLoading = false, purchaseSuccess = true, receiptJson = receiptJson) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = response.body()?.message ?: "Purchase failed") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Network error occurred") }
            }
        }
    }
}
