package com.example.aishwaryam_android.ui.gold

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.network.ApiClient
import java.text.NumberFormat
import java.util.*

private val MagentaDark = Color(0xFF4A0E4E)
private val MagentaAccent = Color(0xFFC2185B)
private val TextMuted = Color(0xFF6B7280)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BuyGoldScreen(
    userId: String,
    onBackClick: () -> Unit,
    onSuccess: (receiptJson: String) -> Unit
) {
    val viewModel: BuyGoldViewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
            return BuyGoldViewModel(ApiClient.apiService) as T
        }
    })
    
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(userId) {
        viewModel.loadPriceAndLock(userId)
    }

    LaunchedEffect(state.purchaseSuccess) {
        if (state.purchaseSuccess && state.receiptJson != null) {
            onSuccess(state.receiptJson!!)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Pay Installment", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.back))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = MagentaDark
                )
            )
        },
        containerColor = Color(0xFFF9FAFB)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Price Display
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MagentaDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(stringResource(R.string.current_gold_price), color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                            if (state.priceLockId != null) {
                                Box(
                                    modifier = Modifier.background(Color(0xFFFFB300).copy(alpha = 0.2f), RoundedCornerShape(4.dp)).padding(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    Text("LOCKED", fontSize = 9.sp, color = Color(0xFFFFB300), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Text(
                            "${paiseToRupees(state.buyPricePaise)} / g", 
                            color = MagentaAccent, 
                            fontSize = 22.sp, 
                            fontWeight = FontWeight.Bold
                        )
                        if (state.priceUpdatedAt != null) {
                            Text(
                                if (state.isFallback) "Using safe fallback price" else "Last updated: ${formatDate(state.priceUpdatedAt!!)}",
                                color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp
                            )
                        }
                    }
                    if (state.lockExpiresAt != null) {
                        Column(horizontalAlignment = Alignment.End) {
                            Icon(Icons.Default.Info, null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.height(4.dp))
                            CountdownTimer(expiresAt = state.lockExpiresAt!!)
                        }
                    } else {
                        Icon(Icons.Default.Info, null, tint = Color.White.copy(alpha = 0.4f))
                    }
                }
            }

            // Input Section
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Enter your installment amount", fontWeight = FontWeight.Bold, color = MagentaDark)

                OutlinedTextField(
                    value = state.amountInput,
                    onValueChange = { viewModel.onAmountChanged(it) },
                    label = { Text(stringResource(R.string.amount_rupees)) },
                    modifier = Modifier.fillMaxWidth(),
                    prefix = { Text("₹ ") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MagentaDark,
                        focusedLabelColor = MagentaDark,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black,
                        focusedPlaceholderColor = Color.Gray,
                        unfocusedPlaceholderColor = Color.Gray
                    )
                )

                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.or), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                }

                OutlinedTextField(
                    value = state.weightInput,
                    onValueChange = { viewModel.onWeightChanged(it) },
                    label = { Text(stringResource(R.string.weight_grams)) },
                    modifier = Modifier.fillMaxWidth(),
                    suffix = { Text(" g") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MagentaDark,
                        focusedLabelColor = MagentaDark,
                        focusedTextColor = Color.Black,
                        unfocusedTextColor = Color.Black,
                        focusedPlaceholderColor = Color.Gray,
                        unfocusedPlaceholderColor = Color.Gray
                    )
                )
            }

            // Breakdown
            if (state.totalToPayPaise > 0) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Installment Value", color = TextMuted, fontSize = 14.sp)
                            Text(paiseToRupees(state.totalToPayPaise - state.gstPaise), color = MagentaDark, fontWeight = FontWeight.Medium)
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(stringResource(R.string.gst_3), color = TextMuted, fontSize = 14.sp)
                            Text(paiseToRupees(state.gstPaise), color = MagentaDark, fontWeight = FontWeight.Medium)
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = Color(0xFFF3F4F6))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(stringResource(R.string.total_to_pay), color = MagentaDark, fontWeight = FontWeight.Bold)
                            Text(paiseToRupees(state.totalToPayPaise), color = MagentaDark, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Error Message
            state.error?.let {
                Text(it, color = Color.Red, fontSize = 13.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
            }

            // Buy Button
            Button(
                onClick = { viewModel.buyGold(userId, "fingerprint_placeholder") },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MagentaDark,
                    contentColor = Color.White
                ),
                enabled = state.totalToPayPaise > 0 && !state.isLoading
            ) {
                if (state.isLoading) {
                    com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(24.dp))
                } else {
                    Text("Pay Now", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }
    }
}

private fun paiseToRupees(paise: Long): String {
    val rupees = paise / 100.0
    val fmt = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return fmt.format(rupees)
}

private fun formatDate(dateString: String): String {
    return try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        format.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = format.parse(dateString)
        val outFormat = java.text.SimpleDateFormat("hh:mm a", Locale.getDefault())
        outFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}

@Composable
fun CountdownTimer(expiresAt: String) {
    var timeLeft by remember { mutableStateOf("") }
    
    LaunchedEffect(expiresAt) {
        try {
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            format.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val expireDate = format.parse(expiresAt)
            
            while (true) {
                val diff = (expireDate?.time ?: 0) - System.currentTimeMillis()
                if (diff <= 0) {
                    timeLeft = "Expired"
                    break
                }
                val min = (diff / 1000) / 60
                val sec = (diff / 1000) % 60
                timeLeft = String.format("%02d:%02d", min, sec)
                kotlinx.coroutines.delay(1000)
            }
        } catch (e: Exception) {
            timeLeft = ""
        }
    }
    
    if (timeLeft.isNotEmpty()) {
        Text(timeLeft, color = Color(0xFFFFB300), fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}
