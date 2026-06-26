package com.example.aishwaryam_android

import android.os.Bundle
import android.widget.Toast
import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import com.example.aishwaryam_android.ui.navigation.AppNavigation
import com.example.aishwaryam_android.ui.theme.AishwaryamandroidTheme
import com.example.aishwaryam_android.utils.LocaleHelper
import com.example.aishwaryam_android.utils.PaymentManager
import com.razorpay.Checkout
import com.razorpay.PaymentResultWithDataListener
import com.razorpay.PaymentData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import com.example.aishwaryam_android.data.SessionManager
import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.utils.TranslationManager

class MainActivity : AppCompatActivity(), PaymentResultWithDataListener {
    
    override fun attachBaseContext(newBase: android.content.Context) {
        super.attachBaseContext(LocaleHelper.onAttach(newBase))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
        }
        
        // Removed Checkout.preload(applicationContext) to prevent WebView preloading context issues on first launch
        
        // Fix header overlap: set solid status bar color and remove translucency
        window.statusBarColor = android.graphics.Color.parseColor("#4A0E4E")
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)

        // Initialize the TranslationManager cache so Tamil strings are
        // available instantly from SharedPreferences before any screen renders
        TranslationManager.init(applicationContext)

        checkPendingPayments()

        // Fetch and register FCM token immediately for anonymous/pre-login pushes!
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                try {
                    if (task.isSuccessful) {
                        val token = task.result
                        if (!token.isNullOrBlank()) {
                            val sessionManager = SessionManager(applicationContext)
                            sessionManager.saveFcmToken(token)
                            val userId = sessionManager.getUserId()
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
                                    // ignore
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

        setContent {
            AishwaryamandroidTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(intent = intent)
                }
            }
        }
    }

    private var currentOrderId: String = ""
    private var onSchemePaymentSuccess: ((String, String, String) -> Unit)? = null
    private var onSchemePaymentFailure: ((String, Int, String) -> Unit)? = null

    fun startPayment(
        orderId: String,
        amount: Long,
        keyId: String,
        userPhone: String = "",
        userName: String = "",
        onSuccess: (String, String, String) -> Unit,
        onFailure: (String, Int, String) -> Unit
    ) {
        onSchemePaymentSuccess = onSuccess
        onSchemePaymentFailure = onFailure
        currentOrderId = orderId
        launchRazorpay(orderId, amount, keyId, "Scheme Installment", userPhone, userName)
    }

    fun startPaymentForScheme(
        orderId: String,
        amount: Long,
        keyId: String,
        schemeMasterId: String,
        userId: String,
        userPhone: String = "",
        userName: String = "",
        onSuccess: (String, String, String) -> Unit,
        onFailure: (String, Int, String) -> Unit
    ) {
        onSchemePaymentSuccess = onSuccess
        onSchemePaymentFailure = onFailure
        currentOrderId = orderId
        launchRazorpay(orderId, amount, keyId, "Join Scheme - First Installment", userPhone, userName)
    }

    private fun launchRazorpay(orderId: String, amount: Long, keyId: String, description: String, userPhone: String = "", userName: String = "") {
        SessionManager(this).savePendingOrderId(orderId)
        val checkout = Checkout()
        checkout.setKeyID(keyId)
        try {
            val options = JSONObject()
            options.put("name", "Aishwaryam @ your home")
            options.put("description", description)
            options.put("order_id", orderId)
            options.put("theme.color", "#4A0E4E")
            options.put("currency", "INR")
            options.put("amount", amount)

            // Real user data pre-fill
            val prefill = JSONObject()
            prefill.put("contact", userPhone.ifBlank { "" })
            prefill.put("name", userName.ifBlank { "Aishwaryam User" })
            options.put("prefill", prefill)

            // Lock pre-filled contact so user can't change it accidentally
            if (userPhone.isNotBlank()) {
                val readonly = JSONObject()
                readonly.put("contact", true)
                options.put("readonly", readonly)
            }

            // Letting Razorpay manage payment options natively to prevent WebView conflicts

            checkout.open(this, options)
        } catch (e: Exception) {
            Toast.makeText(this, "Error starting payment: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        SessionManager(this).clearPendingOrderId()
        val paymentId = razorpayPaymentId ?: paymentData?.paymentId ?: ""
        val orderId = paymentData?.orderId ?: currentOrderId
        val signature = paymentData?.signature ?: ""
        CoroutineScope(Dispatchers.Main).launch {
            val schemeCallback = onSchemePaymentSuccess
            if (schemeCallback != null) {
                // Invoke scheme-specific handler with verified payment signature!
                schemeCallback(orderId, paymentId, signature)
                onSchemePaymentSuccess = null
                onSchemePaymentFailure = null
            } else {
                // Generic payment (e.g. buy gold installment)
                PaymentManager.onPaymentSuccess(paymentId, orderId)
            }
        }
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        SessionManager(this).clearPendingOrderId()
        val orderId = paymentData?.orderId ?: currentOrderId
        CoroutineScope(Dispatchers.Main).launch {
            val failureCallback = onSchemePaymentFailure
            val errMessage = response ?: "Unknown Error"
            if (failureCallback != null) {
                failureCallback(orderId, code, errMessage)
                onSchemePaymentSuccess = null
                onSchemePaymentFailure = null
            } else {
                onSchemePaymentSuccess = null
                PaymentManager.onPaymentError(code, errMessage)
            }
        }
    }

    fun startSubscription(
        subscriptionId: String, 
        keyId: String, 
        userPhone: String = "", 
        userName: String = "", 
        onSuccess: (String) -> Unit,
        onFailure: (String) -> Unit = {}
    ) {
        SessionManager(this).savePendingOrderId(subscriptionId)
        val checkout = Checkout()
        checkout.setKeyID(keyId)
        
        // Custom callback for subscription
        onSchemePaymentSuccess = { _, paymentId, _ ->
            SessionManager(this).clearPendingOrderId()
            onSuccess(subscriptionId)
        }

        onSchemePaymentFailure = { _, code, errMessage ->
            SessionManager(this).clearPendingOrderId()
            onFailure("Error $code: $errMessage")
        }

        try {
            val options = JSONObject()
            options.put("name", "Aishwaryam @ your home")
            options.put("description", "AutoPay Mandate Setup")
            options.put("subscription_id", subscriptionId)
            options.put("theme.color", "#4A0E4E")
            options.put("currency", "INR")
            
            // Letting Razorpay manage UPI visibility based on Subscription Mandate support

            // Removed invalid method block, letting Razorpay show default options
            
            val prefill = JSONObject()
            prefill.put("contact", userPhone)
            prefill.put("name", userName)
            // Removed prefill.method to let Razorpay show all primary options first
            options.put("prefill", prefill)

            checkout.open(this, options)
        } catch (e: Exception) {
            Toast.makeText(this, "Error starting AutoPay: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun showPushNotification(title: String, message: String) {
        val channelId = "aishwaryam_notifs"
        val notificationManager = getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(channelId, "Aishwaryam Alerts", android.app.NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }

        val builder = androidx.core.app.NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }

    private fun checkPendingPayments() {
        val sessionManager = SessionManager(this)
        val pendingOrderId = sessionManager.getPendingOrderId()
        if (!pendingOrderId.isNullOrEmpty()) {
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val response = ApiClient.apiService.reconcilePayment(pendingOrderId)
                    if (response.isSuccessful) {
                        val body = response.body()
                        if (body?.reconciled == true) {
                            CoroutineScope(Dispatchers.Main).launch {
                                showPushNotification("Payment Recovered", "Your last pending payment was successfully recovered!")
                            }
                        }
                    }
                    // Always clear it to avoid infinite retries on dead orders
                    sessionManager.clearPendingOrderId()
                } catch (e: Exception) {
                    // Ignore on network error, will try again next launch
                }
            }
        }
    }
}