package com.example.aishwaryam_android.utils

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import com.example.aishwaryam_android.data.SessionManager

object LocaleHelper {
    private const val SELECTED_LANGUAGE = "Locale.Helper.Selected.Language"

    fun onAttach(context: Context): Context {
        val lang = getPersistedData(context, "en") // Default: English
        return setLocale(context, lang ?: "en")
    }

    fun setLocale(context: Context, language: String): Context {
        persist(context, language)
        val appLocale: LocaleListCompat = LocaleListCompat.forLanguageTags(language)
        AppCompatDelegate.setApplicationLocales(appLocale)
        return context
    }

    fun getSelectedLanguage(context: Context): String {
        return getPersistedData(context, "en") ?: "en"
    }

    private fun persist(context: Context, language: String) {
        val sharedPreferences = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE)
        sharedPreferences.edit().putString(SELECTED_LANGUAGE, language).apply()
    }

    private fun getPersistedData(context: Context, defaultLanguage: String): String? {
        val sharedPreferences = context.getSharedPreferences("app_settings", Context.MODE_PRIVATE)
        return sharedPreferences.getString(SELECTED_LANGUAGE, defaultLanguage)
    }
}
