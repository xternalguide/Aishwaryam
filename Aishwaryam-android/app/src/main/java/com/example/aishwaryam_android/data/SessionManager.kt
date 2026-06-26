package com.example.aishwaryam_android.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

enum class OnboardingStage {
    NONE,
    OTP_VERIFIED,
    MPIN_CREATED,
    PROFILE_COMPLETED,
    KYC_PENDING,
    FULLY_VERIFIED
}

class SessionManager(context: Context) {

    private val masterKey = try {
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    } catch (e: Exception) {
        try {
            val keyStore = java.security.KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.deleteEntry(MasterKey.DEFAULT_MASTER_KEY_ALIAS)
        } catch (ignored: Exception) {}
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
    }

    private val sharedPreferences = try {
        createEncryptedSharedPreferences(context, masterKey)
    } catch (e: Exception) {
        try {
            val sharedPrefsFile = java.io.File(
                context.filesDir.parent,
                "shared_prefs/secure_session_prefs.xml"
            )
            if (sharedPrefsFile.exists()) {
                sharedPrefsFile.delete()
            }
            val keyStore = java.security.KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.deleteEntry(MasterKey.DEFAULT_MASTER_KEY_ALIAS)
        } catch (ex: Exception) {
            ex.printStackTrace()
        }
        createEncryptedSharedPreferences(context, masterKey)
    }

    private fun createEncryptedSharedPreferences(context: Context, key: MasterKey): android.content.SharedPreferences {
        return EncryptedSharedPreferences.create(
            context,
            "secure_session_prefs",
            key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun saveSession(userId: String, token: String, refreshToken: String) {
        sharedPreferences.edit()
            .putString("USER_ID", userId)
            .putString("JWT_TOKEN", token)
            .putString("REFRESH_TOKEN", refreshToken)
            .apply()
    }

    fun getUserId(): String? {
        return sharedPreferences.getString("USER_ID", null)
    }

    fun savePhoneNumber(phoneNumber: String) {
        sharedPreferences.edit().putString("PHONE_NUMBER", phoneNumber).apply()
    }

    fun getPhoneNumber(): String? {
        return sharedPreferences.getString("PHONE_NUMBER", null)
    }

    fun getToken(): String? {
        return sharedPreferences.getString("JWT_TOKEN", null)
    }

    fun getRefreshToken(): String? {
        return sharedPreferences.getString("REFRESH_TOKEN", null)
    }

    fun clearSession() {
        sharedPreferences.edit()
            .remove("USER_ID")
            .remove("JWT_TOKEN")
            .remove("REFRESH_TOKEN")
            .apply()
    }

    // ── Onboarding Stage Persistence ──────────────────────────────────────────
    fun saveOnboardingStage(stage: OnboardingStage) {
        sharedPreferences.edit().putString("ONBOARDING_STAGE", stage.name).apply()
    }

    fun getOnboardingStage(): OnboardingStage {
        val stageName = sharedPreferences.getString("ONBOARDING_STAGE", OnboardingStage.NONE.name)
        return try {
            OnboardingStage.valueOf(stageName ?: OnboardingStage.NONE.name)
        } catch (e: Exception) {
            OnboardingStage.NONE
        }
    }

    // ── Partial Form Data (Premium UX) ────────────────────────────────────────
    fun saveStep1Data(
        name: String,
        email: String,
        dob: String,
        isMarried: Boolean,
        weddingDate: String,
        gender: String,
        pincode: String,
        state: String,
        city: String,
        area: String,
        isManualArea: Boolean,
        termsAccepted: Boolean
    ) {
        sharedPreferences.edit()
            .putString("PARTIAL_NAME", name)
            .putString("PARTIAL_EMAIL", email)
            .putString("PARTIAL_DOB", dob)
            .putBoolean("PARTIAL_IS_MARRIED", isMarried)
            .putString("PARTIAL_WEDDING_DATE", weddingDate)
            .putString("PARTIAL_GENDER", gender)
            .putString("PARTIAL_PINCODE", pincode)
            .putString("PARTIAL_STATE", state)
            .putString("PARTIAL_CITY", city)
            .putString("PARTIAL_AREA", area)
            .putBoolean("PARTIAL_IS_MANUAL_AREA", isManualArea)
            .putBoolean("PARTIAL_TERMS_ACCEPTED", termsAccepted)
            .apply()
    }

    fun savePartialProfile(name: String, email: String) {
        sharedPreferences.edit()
            .putString("PARTIAL_NAME", name)
            .putString("PARTIAL_EMAIL", email)
            .apply()
    }

    fun getPartialName(): String = sharedPreferences.getString("PARTIAL_NAME", "") ?: ""
    fun getPartialEmail(): String = sharedPreferences.getString("PARTIAL_EMAIL", "") ?: ""
    fun getPartialDob(): String = sharedPreferences.getString("PARTIAL_DOB", "") ?: ""
    fun getPartialIsMarried(): Boolean = sharedPreferences.getBoolean("PARTIAL_IS_MARRIED", false)
    fun getPartialWeddingDate(): String = sharedPreferences.getString("PARTIAL_WEDDING_DATE", "") ?: ""
    fun getPartialGender(): String = sharedPreferences.getString("PARTIAL_GENDER", "Male") ?: "Male"
    fun getPartialPincode(): String = sharedPreferences.getString("PARTIAL_PINCODE", "") ?: ""
    fun getPartialState(): String = sharedPreferences.getString("PARTIAL_STATE", "") ?: ""
    fun getPartialCity(): String = sharedPreferences.getString("PARTIAL_CITY", "") ?: ""
    fun getPartialArea(): String = sharedPreferences.getString("PARTIAL_AREA", "") ?: ""
    fun getPartialIsManualArea(): Boolean = sharedPreferences.getBoolean("PARTIAL_IS_MANUAL_AREA", false)
    fun getPartialTermsAccepted(): Boolean = sharedPreferences.getBoolean("PARTIAL_TERMS_ACCEPTED", false)

    // ── Order/Token Management ───────────────────────────────────────────────
    fun savePendingOrderId(orderId: String) {
        sharedPreferences.edit().putString("PENDING_ORDER_ID", orderId).apply()
    }

    fun getPendingOrderId(): String? = sharedPreferences.getString("PENDING_ORDER_ID", null)

    fun clearPendingOrderId() {
        sharedPreferences.edit().remove("PENDING_ORDER_ID").apply()
    }

    fun saveFcmToken(token: String) {
        sharedPreferences.edit().putString("FCM_TOKEN", token).apply()
    }

    fun getFcmToken(): String? = sharedPreferences.getString("FCM_TOKEN", null)

    // ── Welcome Onboarding (pre-login slides) ────────────────────────────────
    fun hasSeenWelcomeOnboarding(): Boolean = sharedPreferences.getBoolean("HAS_SEEN_WELCOME", false)

    fun markWelcomeOnboardingSeen() {
        sharedPreferences.edit().putBoolean("HAS_SEEN_WELCOME", true).apply()
    }

    // ── Local Dashboard Caching & Nominee Persistence ──────────────────────────
    fun saveCachedDashboard(json: String) {
        sharedPreferences.edit().putString("CACHED_DASHBOARD", json).apply()
    }

    fun getCachedDashboard(): String? {
        return sharedPreferences.getString("CACHED_DASHBOARD", null)
    }

    fun saveNomineeName(name: String) {
        sharedPreferences.edit().putString("PARTIAL_NOMINEE", name).apply()
    }

    fun getNomineeName(): String = sharedPreferences.getString("PARTIAL_NOMINEE", "") ?: ""

    fun saveNomineeContact(contact: String) {
        sharedPreferences.edit().putString("PARTIAL_NOMINEE_CONTACT", contact).apply()
    }

    fun getNomineeContact(): String = sharedPreferences.getString("PARTIAL_NOMINEE_CONTACT", "") ?: ""

    fun savePanImageBase64(base64: String) {
        sharedPreferences.edit().putString("PARTIAL_PAN_IMAGE", base64).apply()
    }

    fun getPanImageBase64(): String = sharedPreferences.getString("PARTIAL_PAN_IMAGE", "") ?: ""

    fun saveAadhaarImageBase64(base64: String) {
        sharedPreferences.edit().putString("PARTIAL_AADHAAR_IMAGE", base64).apply()
    }

    fun getAadhaarImageBase64(): String = sharedPreferences.getString("PARTIAL_AADHAAR_IMAGE", "") ?: ""

    // ── Onboarding Banners Local Caching (Premium Performance) ───────────────
    fun saveCachedOnboardingBanners(json: String) {
        sharedPreferences.edit().putString("CACHED_ONBOARDING_BANNERS", json).apply()
    }

    fun getCachedOnboardingBanners(): String? {
        return sharedPreferences.getString("CACHED_ONBOARDING_BANNERS", null)
    }
}
