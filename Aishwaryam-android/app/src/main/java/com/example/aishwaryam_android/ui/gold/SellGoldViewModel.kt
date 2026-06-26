package com.example.aishwaryam_android.ui.gold

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.network.ApiService
import com.example.aishwaryam_android.network.SellGoldRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SellGoldUiState(
    val sellPricePaise: Long = 0,
    val goldBalanceMg: Long = 0,
    val lockedGoldMg: Long = 0,
    val redeemableGoldMg: Long = 0,
    val weightInput: String = "",
    val amountInput: String = "",
    val amountToReceivePaise: Long = 0,
    val isLoading: Boolean = false,
    val error: String? = null,
    val sellSuccess: Boolean = false,
    val priceLockId: String? = null,
    val priceUpdatedAt: String? = null,
    val priceSource: String = "Live",
    val isFallback: Boolean = false,
    val lockExpiresAt: String? = null
)

class SellGoldViewModel(private val apiService: ApiService) : ViewModel() {

    private val _uiState = MutableStateFlow(SellGoldUiState())
    val uiState: StateFlow<SellGoldUiState> = _uiState.asStateFlow()

    fun loadData(userId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val priceResponse = apiService.getLivePrice()
                val portfolioResponse = apiService.getPortfolio(userId)
                
                if (priceResponse.isSuccessful && portfolioResponse.isSuccessful) {
                    val portfolio = portfolioResponse.body()
                    val livePrice = priceResponse.body()
                    
                    var currentSellPrice = livePrice?.sellPricePaise ?: 0L
                    var lockId: String? = null
                    var expiresAt: String? = null
                    
                    val lockResponse = apiService.lockGoldPrice(userId)
                    if (lockResponse.isSuccessful) {
                        val lock = lockResponse.body()
                        if (lock != null) {
                            currentSellPrice = lock.lockedSellPricePaise
                            lockId = lock.lockId
                            expiresAt = lock.expiresAt
                        }
                    }

                    _uiState.update { it.copy(
                        sellPricePaise = currentSellPrice,
                        goldBalanceMg = portfolio?.goldBalanceMg ?: 0,
                        lockedGoldMg = portfolio?.lockedGoldMg ?: 0,
                        redeemableGoldMg = portfolio?.redeemableGoldMg ?: 0,
                        isLoading = false,
                        priceLockId = lockId,
                        lockExpiresAt = expiresAt,
                        priceUpdatedAt = livePrice?.updatedAt,
                        priceSource = livePrice?.source ?: "Live",
                        isFallback = livePrice?.isFallback ?: false
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Failed to load data") }
            }
        }
    }

    fun setInitialBalance(balanceMg: Long) {
        _uiState.update { it.copy(goldBalanceMg = balanceMg) }
    }

    fun onWeightChanged(weightStr: String) {
        val weightGrams = weightStr.toDoubleOrNull() ?: 0.0
        val weightMg = (weightGrams * 1000).toLong()
        
        val pricePerGm = _uiState.value.sellPricePaise / 100.0
        val amountToReceive = weightGrams * pricePerGm

        _uiState.update { 
            it.copy(
                weightInput = weightStr,
                amountInput = if (weightGrams > 0) String.format("%.2f", amountToReceive) else "",
                amountToReceivePaise = (amountToReceive * 100).toLong(),
                error = if (weightMg > it.redeemableGoldMg) "Insufficient redeemable gold. Some gold is locked in active schemes." else null
            )
        }
    }

    fun onAmountChanged(amountStr: String) {
        val amount = amountStr.toDoubleOrNull() ?: 0.0
        val pricePerGm = _uiState.value.sellPricePaise / 100.0
        
        if (pricePerGm > 0) {
            val weightGrams = amount / pricePerGm
            val weightMg = (weightGrams * 1000).toLong()
            
            _uiState.update { 
                it.copy(
                    amountInput = amountStr,
                    weightInput = if (amount > 0) String.format("%.4f", weightGrams) else "",
                    amountToReceivePaise = (amount * 100).toLong(),
                    error = if (weightMg > it.redeemableGoldMg) "Insufficient redeemable gold. Some gold is locked in active schemes." else null
                )
            }
        }
    }

    fun sellGold(userId: String, fingerprint: String) {
        val weightGrams = _uiState.value.weightInput.toDoubleOrNull() ?: 0.0
        val weightMg = (weightGrams * 1000).toLong()

        if (weightMg <= 0 || weightMg > _uiState.value.redeemableGoldMg) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val req = SellGoldRequest(userId, weightMg, fingerprint).apply {
                    priceLockId = _uiState.value.priceLockId
                }
                val response = apiService.sellGold(req)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.update { it.copy(isLoading = false, sellSuccess = true) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = response.body()?.message ?: "Sale failed") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = "Network error occurred") }
            }
        }
    }
}
