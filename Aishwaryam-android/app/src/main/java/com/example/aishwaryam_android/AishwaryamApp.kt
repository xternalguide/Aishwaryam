package com.example.aishwaryam_android

import android.app.Application
import com.example.aishwaryam_android.network.ApiClient

class AishwaryamApp : Application() {
    companion object {
        var isMpinVerified: Boolean = false
        var lastSelectedTab: Int = 0
    }

    override fun onCreate() {
        super.onCreate()
        
        // Capture uncaught crashes to show stack trace in UI on next launch
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                val sw = java.io.StringWriter()
                val pw = java.io.PrintWriter(sw)
                throwable.printStackTrace(pw)
                val stackTrace = sw.toString()
                
                getSharedPreferences("crash_reports", MODE_PRIVATE)
                    .edit()
                    .putString("last_crash", stackTrace)
                    .commit() // Commit synchronously before process terminates
            } catch (e: Exception) {
                e.printStackTrace()
            }
            defaultHandler?.uncaughtException(thread, throwable)
        }

        // Initialize ApiClient with application context to allow AuthInterceptor access to SharedPreferences
        ApiClient.init(this)
    }
}
