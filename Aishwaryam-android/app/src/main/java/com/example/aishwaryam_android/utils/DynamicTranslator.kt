package com.example.aishwaryam_android.utils

/**
 * Utility for dynamic translation (simplified passthrough fallback).
 * This has been refactored to remove the heavy Google ML Kit dependency.
 */
object DynamicTranslator {

    /**
     * Passthrough dynamic translator that simply returns the original text.
     */
    suspend fun translate(text: String, targetLangCode: String): String {
        return text
    }
}
