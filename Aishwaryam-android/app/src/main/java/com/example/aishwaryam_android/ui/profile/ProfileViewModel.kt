package com.example.aishwaryam_android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.network.ApiService
import com.example.aishwaryam_android.network.UserProfileResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val profile: UserProfileResponse? = null
)

class ProfileViewModel(
    private val apiService: ApiService = ApiClient.apiService
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState

    fun loadProfile(userId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val response = apiService.getProfile(userId)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        profile = response.body()
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Failed to load profile."
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun updateProfile(
        userId: String,
        fullName: String? = null,
        email: String? = null,
        nomineeName: String? = null,
        dateOfBirth: String? = null,
        biometricEnabled: Boolean? = null,
        preferredLanguage: String? = null,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            try {
                val request = com.example.aishwaryam_android.network.UpdateProfileRequest(
                    fullName = fullName,
                    email = email,
                    nomineeName = nomineeName,
                    dateOfBirth = dateOfBirth,
                    biometricEnabled = biometricEnabled,
                    preferredLanguage = preferredLanguage
                )
                val response = apiService.updateProfile(userId, request)
                if (response.isSuccessful && response.body()?.success == true) {
                    loadProfile(userId)
                    onSuccess()
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onError(response.body()?.message ?: "Failed to update profile")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onError("Network error: ${e.message}")
            }
        }
     }

    fun deleteAccount(
        userId: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val response = apiService.deleteAccount(userId)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess()
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onError(response.body()?.message ?: "Failed to delete account")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onError("Network error: ${e.message}")
            }
        }
    }

    private val _bankAccounts = MutableStateFlow<List<com.example.aishwaryam_android.network.BankAccountDto>>(emptyList())
    val bankAccounts: StateFlow<List<com.example.aishwaryam_android.network.BankAccountDto>> = _bankAccounts

    fun loadBankAccounts(userId: String) {
        viewModelScope.launch {
            try {
                val response = apiService.getBankAccounts(userId)
                if (response.isSuccessful) {
                    _bankAccounts.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                // Handle err
            }
        }
    }

    fun addBankAccount(
        userId: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val request = com.example.aishwaryam_android.network.AddBankAccountRequest(
                    userId = userId,
                    accountNumber = accountNumber,
                    ifscCode = ifscCode,
                    bankName = bankName
                )
                val response = apiService.addBankAccount(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    loadBankAccounts(userId)
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess()
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onError(response.body()?.message ?: "Failed to add bank account")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onError("Network error: ${e.message}")
            }
        }
    }

    fun changeMpin(
        userId: String,
        oldMpin: String,
        newMpin: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val request = com.example.aishwaryam_android.network.ChangeMpinRequest(
                    userId = userId,
                    oldMpin = oldMpin,
                    newMpin = newMpin
                )
                val response = apiService.changeMpin(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess()
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onError(response.body()?.message ?: "Failed to change MPIN")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onError("Network error: ${e.message}")
            }
        }
    }

    fun submitKyc(
        userId: String,
        docType: String,
        docNum: String,
        docUrl: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            try {
                val request = com.example.aishwaryam_android.network.SubmitKycRequest(
                    userId = userId,
                    documentType = docType,
                    documentNumber = docNum,
                    documentUrl = docUrl
                )
                val response = apiService.submitKyc(request)
                if (response.isSuccessful && response.body()?.success == true) {
                    loadProfile(userId)
                    onSuccess()
                } else {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onError(response.body()?.message ?: "Failed to submit KYC")
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isLoading = false)
                onError("Network error: ${e.message}")
            }
        }
    }
}
