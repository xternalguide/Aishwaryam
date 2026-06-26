package com.example.aishwaryam_android

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.aishwaryam_android.data.SessionManager
import com.example.aishwaryam_android.network.ApiClient
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AishwaryamMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Store token and sync with backend
        val sessionManager = SessionManager(applicationContext)
        sessionManager.saveFcmToken(token)
        
        val userId = sessionManager.getUserId()
        syncTokenWithBackend(userId, token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Aishwaryam"
        val message = remoteMessage.notification?.body ?: remoteMessage.data["message"] ?: ""
        
        val screen = remoteMessage.data["screen"]
        val entityId = remoteMessage.data["entityId"]
        val imageUrl = remoteMessage.notification?.imageUrl?.toString() ?: remoteMessage.data["imageUrl"]

        showNotification(title, message, screen, entityId, imageUrl)
    }

    private fun showNotification(title: String, message: String, screen: String?, entityId: String?, imageUrl: String?) {
        val channelId = "aishwaryam_push_notifs"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Aishwaryam Updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Push notifications for gold maturity, rewards and payments"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            if (screen != null) {
                putExtra("target_screen", screen)
            }
            if (entityId != null) {
                putExtra("entity_id", entityId)
            }
        }
        val pendingIntent = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // 1. Establish premium branding app logo on status bar and notification tray
        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(android.graphics.BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher))
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        // 2. Fetch and render rich push banner image if present (Thangamayil style)
        if (!imageUrl.isNullOrBlank()) {
            try {
                val resolvedUrl = if (imageUrl.startsWith("/uploads/", ignoreCase = true)) {
                    com.example.aishwaryam_android.BuildConfig.BASE_URL.removeSuffix("/") + imageUrl
                } else {
                    imageUrl
                }
                val url = java.net.URL(resolvedUrl)
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.doInput = true
                connection.connect()
                val input = connection.inputStream
                val bitmap = android.graphics.BitmapFactory.decodeStream(input)
                if (bitmap != null) {
                    builder.setStyle(
                        NotificationCompat.BigPictureStyle()
                            .bigPicture(bitmap)
                            .bigLargeIcon(null as android.graphics.Bitmap?)
                    )
                }
            } catch (e: Exception) {
                // Fail-safe: fall back to normal text layout if image loading fails
            }
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    private fun syncTokenWithBackend(userId: String?, token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val params = mutableMapOf(
                    "token" to token,
                    "deviceType" to "ANDROID"
                )
                if (!userId.isNullOrEmpty()) {
                    params["userId"] = userId
                }
                ApiClient.apiService.registerFcmToken(params)
            } catch (e: Exception) {
                // Silently fail, will retry on next app launch
            }
        }
    }
}
