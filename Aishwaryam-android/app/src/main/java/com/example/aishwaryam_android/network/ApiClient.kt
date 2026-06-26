package com.example.aishwaryam_android.network

import android.content.Context
import com.example.aishwaryam_android.BuildConfig
import com.example.aishwaryam_android.data.SessionManager
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private var sessionManager: SessionManager? = null
    var deviceFingerprint: String = "android_native_device_123"
    var onSessionExpiredListener: (() -> Unit)? = null

    val sessionManagerInstance: SessionManager?
        get() = sessionManager

    fun init(context: Context) {
        sessionManager = SessionManager(context)
        val androidId = android.provider.Settings.Secure.getString(
            context.contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        ) ?: "android_native_device_123"
        deviceFingerprint = "android_${android.os.Build.MODEL}_$androidId"
    }

    private val authInterceptor = Interceptor { chain ->
        val requestBuilder = chain.request().newBuilder()
        
        // Add token if available in session
        sessionManager?.getToken()?.let { token ->
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        
        chain.proceed(requestBuilder.build())
    }

    private fun logoutUser() {
        sessionManager?.clearSession()
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            onSessionExpiredListener?.invoke()
        }
    }

    private val authenticator = Authenticator { _, response ->
        synchronized(this) {
            val path = response.request.url.encodedPath
            if (path.contains("/api/Auth/", ignoreCase = true)) {
                return@synchronized null
            }
            val currentToken = sessionManager?.getToken()
            val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")

            if (requestToken == currentToken) {
                val refreshToken = sessionManager?.getRefreshToken()
                if (refreshToken.isNullOrEmpty()) {
                    logoutUser()
                    return@synchronized null
                }

                // Synchronously call refresh API using a separate client
                val refreshClient = OkHttpClient.Builder().build()
                val json = "{\"refreshToken\":\"$refreshToken\",\"deviceFingerprint\":\"$deviceFingerprint\"}"
                val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                val requestBody = RequestBody.create(mediaType, json)
                
                val refreshRequest = Request.Builder()
                    .url(BuildConfig.BASE_URL + "api/Auth/refresh")
                    .post(requestBody)
                    .build()

                try {
                    val refreshResponse = refreshClient.newCall(refreshRequest).execute()
                    if (refreshResponse.isSuccessful) {
                        val bodyString = refreshResponse.body?.string()
                        val jsonObject = org.json.JSONObject(bodyString ?: "{}")
                        if (jsonObject.optBoolean("success", false)) {
                            val newJwt = jsonObject.optString("token", "")
                            val newRefresh = jsonObject.optString("refreshToken", "")
                            val userId = jsonObject.optString("userId", "")

                            if (newJwt.isNotEmpty() && newRefresh.isNotEmpty() && userId.isNotEmpty()) {
                                sessionManager?.saveSession(userId, newJwt, newRefresh)
                                return@synchronized response.request.newBuilder()
                                    .header("Authorization", "Bearer $newJwt")
                                    .build()
                            }
                        }
                    }

                    // Refresh token rotation failed (likely expired/revoked/compromised)
                    logoutUser()
                } catch (e: Exception) {
                    // Network or connection error, do not force logout
                    return@synchronized null
                }
            } else {
                // Token has already been updated by another concurrent request
                currentToken?.let { newToken ->
                    return@synchronized response.request.newBuilder()
                        .header("Authorization", "Bearer $newToken")
                        .build()
                }
            }

            return@synchronized null
        }
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(90, java.util.concurrent.TimeUnit.SECONDS)
        .addInterceptor(authInterceptor)
        .authenticator(authenticator)
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
