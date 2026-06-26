package com.example.aishwaryam_android.ui.notifications

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.network.UserNotificationDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class NotificationsViewModel : ViewModel() {
    private val _notifications = MutableStateFlow<List<UserNotificationDto>>(emptyList())
    val notifications: StateFlow<List<UserNotificationDto>> = _notifications.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    init {
        fetchNotifications()
    }

    fun fetchNotifications() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = ApiClient.apiService.getUserNotifications()
                if (response.isSuccessful) {
                    val data = response.body() ?: emptyList()
                    _notifications.value = data
                    _unreadCount.value = data.count { it.isRead != true }
                } else {
                    _error.value = "Failed to load notifications"
                }
            } catch (e: Exception) {
                _error.value = e.message ?: "An error occurred"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            try {
                // Optimistic UI update
                _notifications.value = _notifications.value.map {
                    if (it.id == notificationId) it.copy(isRead = true) else it
                }
                _unreadCount.value = _notifications.value.count { it.isRead != true }

                val response = ApiClient.apiService.markNotificationAsRead(notificationId)
                if (!response.isSuccessful) {
                    // Revert if failed
                    fetchNotifications()
                }
            } catch (e: Exception) {
                Log.e("NotificationsVM", "Failed to mark as read", e)
                fetchNotifications()
            }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            val unreadList = _notifications.value.filter { it.isRead != true }
            if (unreadList.isEmpty()) return@launch

            // Optimistic UI update
            _notifications.value = _notifications.value.map { it.copy(isRead = true) }
            _unreadCount.value = 0

            unreadList.forEach { notif ->
                try {
                    ApiClient.apiService.markNotificationAsRead(notif.id ?: "")
                } catch (e: Exception) {
                    Log.e("NotificationsVM", "Failed to mark notification ${notif.id} as read", e)
                }
            }
        }
    }

    fun deleteNotification(notificationId: String) {
        viewModelScope.launch {
            try {
                // Optimistic UI update
                _notifications.value = _notifications.value.filter { it.id != notificationId }
                _unreadCount.value = _notifications.value.count { it.isRead != true }

                val response = ApiClient.apiService.deleteNotification(notificationId)
                if (!response.isSuccessful) {
                    // Revert if failed
                    fetchNotifications()
                }
            } catch (e: Exception) {
                Log.e("NotificationsVM", "Failed to delete notification", e)
                fetchNotifications()
            }
        }
    }
}
