package com.example.aishwaryam_android.utils

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

sealed class PaymentResult {
    data class Success(val paymentId: String, val orderId: String) : PaymentResult()
    data class Error(val code: Int, val message: String) : PaymentResult()
}

object PaymentManager {
    private val _results = MutableSharedFlow<PaymentResult>()
    val results = _results.asSharedFlow()

    suspend fun onPaymentSuccess(paymentId: String, orderId: String) {
        _results.emit(PaymentResult.Success(paymentId, orderId))
    }

    suspend fun onPaymentError(code: Int, message: String) {
        _results.emit(PaymentResult.Error(code, message))
    }
}
