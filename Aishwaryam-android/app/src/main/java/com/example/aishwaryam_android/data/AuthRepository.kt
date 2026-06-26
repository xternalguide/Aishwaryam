package com.example.aishwaryam_android.data

import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.network.SendOtpRequest
import com.example.aishwaryam_android.network.VerifyOtpRequest
import com.example.aishwaryam_android.network.VerifyOtpResponse
import com.example.aishwaryam_android.network.GenericAuthResponse
import com.example.aishwaryam_android.network.SetMpinRequest
import com.example.aishwaryam_android.network.VerifyMpinRequest
import com.example.aishwaryam_android.network.UpdateProfileRequest
import com.example.aishwaryam_android.network.UserProfileResponse

class AuthRepository(private val sessionManager: SessionManager) {
    private val api = ApiClient.apiService

    suspend fun sendOtp(phoneNumber: String): Result<Boolean> {
        return try {
            val response = api.sendOtp(SendOtpRequest(phoneNumber = phoneNumber))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to send OTP"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Firebase Phone Auth flow:
     * Instead of sending OTP to our backend, we send the Firebase ID token.
     * Backend verifies the token with Firebase Admin SDK and creates/fetches the user.
     */
    suspend fun verifyFirebaseToken(
        firebaseIdToken: String,
        phoneNumber: String,
        deviceFingerprint: String
    ): Result<VerifyOtpResponse> {
        return try {
            val response = api.verifyFirebaseToken(
                com.example.aishwaryam_android.network.VerifyFirebaseTokenRequest(
                    firebaseIdToken = firebaseIdToken,
                    phoneNumber = phoneNumber,
                    deviceFingerprint = deviceFingerprint
                )
            )
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!
                if (data.userId != null && data.token != null) {
                    sessionManager.saveSession(data.userId, data.token, data.refreshToken ?: "")
                }
                Result.success(data)
            } else {
                val errorMsg = try {
                    val json = response.errorBody()?.string() ?: "{}"
                    val jsonObj = org.json.JSONObject(json)
                    if (jsonObj.has("message")) jsonObj.getString("message")
                    else if (jsonObj.has("Message")) jsonObj.getString("Message")
                    else "Login failed"
                } catch (e: Exception) {
                    "Login failed"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(phoneNumber: String, otp: String, deviceFingerprint: String): Result<VerifyOtpResponse> {
        return try {
            val response = api.verifyOtp(VerifyOtpRequest(phoneNumber, otp, deviceFingerprint))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!
                // Save session on successful OTP
                if (data.userId != null && data.token != null) {
                    sessionManager.saveSession(data.userId, data.token, data.refreshToken ?: "")
                }
                Result.success(data)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Invalid OTP"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setMpin(mpin: String): Result<Boolean> {
        val userId = sessionManager.getUserId() ?: return Result.failure(Exception("No user session found"))
        return try {
            val response = api.setMpin(SetMpinRequest(userId, mpin))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to set MPIN"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyMpin(mpin: String, deviceFingerprint: String): Result<Boolean> {
        val userId = sessionManager.getUserId() ?: return Result.failure(Exception("No user session found"))
        return try {
            val response = api.verifyMpin(VerifyMpinRequest(userId, mpin, deviceFingerprint))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!
                if (data.token != null && data.userId != null) {
                    sessionManager.saveSession(data.userId, data.token, data.refreshToken ?: "")
                }
                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Invalid MPIN"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(userId: String, fullName: String, email: String, referredByCode: String? = null): Result<Boolean> {
        return try {
            val response = api.updateProfile(userId, UpdateProfileRequest(fullName, email, referredByCode = referredByCode))
            if (response.isSuccessful) {
                Result.success(true)
            } else {
                val errorMsg = try {
                    val json = response.errorBody()?.string() ?: "{}"
                    val jsonObj = org.json.JSONObject(json)
                    if (jsonObj.has("message")) jsonObj.getString("message") else if (jsonObj.has("Message")) jsonObj.getString("Message") else "Failed to update profile"
                } catch (e: Exception) {
                    "Failed to update profile"
                }
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProfile(userId: String): Result<UserProfileResponse> {
        return try {
            val response = api.getProfile(userId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch profile"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun syncFcmToken(userId: String, token: String): Result<Boolean> {
        return try {
            val response = api.registerFcmToken(mapOf(
                "userId" to userId,
                "token" to token,
                "deviceType" to "ANDROID"
            ))
            if (response.isSuccessful) Result.success(true) else Result.failure(Exception("Failed to sync token"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
