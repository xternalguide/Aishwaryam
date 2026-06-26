package com.example.aishwaryam_android.ui.auth

import android.app.Activity
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.data.AuthRepository
import com.example.aishwaryam_android.data.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    object OtpSent : AuthUiState()
    data class Success(val isNewUser: Boolean, val isMpinSet: Boolean) : AuthUiState()
    object MpinSuccess : AuthUiState()
    object ProfileSuccess : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val sessionManager = SessionManager(application)
    private val repository = AuthRepository(sessionManager)

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var currentPhoneNumber: String = ""

    /**
     * Step 1: Send OTP directly via backend SMS gateway (Brevo API).
     * @param phoneNumber 10-digit Indian number (without +91)
     * @param activity    Not required for Brevo but kept for signature compatibility
     */
    fun sendOtp(phoneNumber: String, activity: Activity) {
        if (phoneNumber.length != 10) {
            _uiState.value = AuthUiState.Error("Please enter a valid 10-digit mobile number")
            return
        }
        _uiState.value = AuthUiState.Loading
        currentPhoneNumber = phoneNumber

        viewModelScope.launch {
            val result = repository.sendOtp(phoneNumber)
            if (result.isSuccess) {
                _uiState.value = AuthUiState.OtpSent
            } else {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Failed to send OTP")
            }
        }
    }

    /**
     * Step 2: Verify the 6-digit OTP directly against our backend.
     */
    fun verifyOtp(otp: String) {
        if (currentPhoneNumber.isEmpty()) {
            _uiState.value = AuthUiState.Error("Session expired. Please request OTP again.")
            return
        }
        if (otp.length != 6) {
            _uiState.value = AuthUiState.Error("Please enter the 6-digit OTP")
            return
        }
        _uiState.value = AuthUiState.Loading

        viewModelScope.launch {
            val deviceFingerprint = com.example.aishwaryam_android.network.ApiClient.deviceFingerprint
            val result = repository.verifyOtp(currentPhoneNumber, otp, deviceFingerprint)
            if (result.isSuccess) {
                val data = result.getOrNull()
                sessionManager.savePhoneNumber(currentPhoneNumber)
                val userId = data?.userId
                if (!userId.isNullOrEmpty()) {
                    triggerFcmTokenSync(userId)
                }
                _uiState.value = AuthUiState.Success(
                    isNewUser = data?.isNewUser ?: false,
                    isMpinSet = data?.isMpinSet ?: false
                )
            } else {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Incorrect OTP. Please try again.")
            }
        }
    }

    // ── Resend OTP ───────────────────────────────────────────────────────────

    fun resendOtp(activity: Activity) {
        sendOtp(currentPhoneNumber, activity)
    }

    // ── MPIN ─────────────────────────────────────────────────────────────────

    fun setMpin(mpin: String) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val result = repository.setMpin(mpin)
            if (result.isSuccess) {
                val userId = sessionManager.getUserId()
                if (!userId.isNullOrEmpty()) {
                    triggerFcmTokenSync(userId)
                }
                _uiState.value = AuthUiState.MpinSuccess
            } else {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Failed to set MPIN")
            }
        }
    }

    fun verifyExistingMpin(mpin: String) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val deviceFingerprint = com.example.aishwaryam_android.network.ApiClient.deviceFingerprint
            val result = repository.verifyMpin(mpin, deviceFingerprint)
            if (result.isSuccess) {
                val userId = sessionManager.getUserId()
                if (userId != null) {
                    val profileResult = repository.getProfile(userId)
                    if (profileResult.isSuccess) {
                        triggerFcmTokenSync(userId)
                        _uiState.value = AuthUiState.MpinSuccess
                    } else {
                        _uiState.value = AuthUiState.Error(profileResult.exceptionOrNull()?.message ?: "Failed to fetch user data")
                    }
                } else {
                    _uiState.value = AuthUiState.MpinSuccess
                }
            } else {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Invalid MPIN")
            }
        }
    }

    fun updateProfile(userId: String, fullName: String, email: String, referredByCode: String? = null) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val result = repository.updateProfile(userId, fullName, email, referredByCode)
            if (result.isSuccess) {
                _uiState.value = AuthUiState.ProfileSuccess
            } else {
                _uiState.value = AuthUiState.Error(result.exceptionOrNull()?.message ?: "Failed to update profile")
            }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }

    fun clearError() {
        if (_uiState.value is AuthUiState.Error) {
            _uiState.value = AuthUiState.Idle
        }
    }

    private fun triggerFcmTokenSync(userId: String) {
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                try {
                    if (task.isSuccessful) {
                        val token = task.result
                        if (!token.isNullOrBlank()) {
                            sessionManager.saveFcmToken(token)
                            viewModelScope.launch {
                                try {
                                    repository.syncFcmToken(userId, token)
                                } catch (t: Throwable) {
                                    t.printStackTrace()
                                }
                            }
                        }
                    }
                } catch (t: Throwable) {
                    t.printStackTrace()
                }
            }
        } catch (t: Throwable) {
            t.printStackTrace()
        }
    }
}
