package com.example.aishwaryam_android.utils

import android.content.Context

/**
 * TranslationManager — Central manager for on-device translation (Simplified Passthrough).
 * Refactored to remove the heavy Google ML Kit dependency.
 */
object TranslationManager {

    private var currentLanguage: String = "en"

    fun init(context: Context) {
        currentLanguage = LocaleHelper.getSelectedLanguage(context)
    }

    /**
     * Get a translated string. Returns englishText as a passthrough.
     * Android's native localization automatically returns the localized
     * string if fetched via stringResource(id) in the UI.
     */
    fun get(key: String, englishText: String): String {
        return englishText
    }

    /**
     * Passthrough translation.
     */
    suspend fun translateAndCache(key: String, englishText: String): String {
        return englishText
    }

    /**
     * Passthrough batch translation.
     */
    suspend fun preBatchTranslate(
        strings: Map<String, String>,
        onProgress: (Int, Int) -> Unit = { _, _ -> }
    ) {}

    /**
     * Switches active language.
     */
    fun setLanguage(context: Context, lang: String) {
        currentLanguage = lang
    }
}
