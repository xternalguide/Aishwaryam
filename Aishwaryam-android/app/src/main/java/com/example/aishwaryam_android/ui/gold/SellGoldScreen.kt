package com.example.aishwaryam_android.ui.gold

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
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
private val RedLoss = Color(0xFFDC2626)
private val GreenGain = Color(0xFF16A34A)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SellGoldScreen(
    userId: String,
    initialBalanceMg: Long,
    onBackClick: () -> Unit,
    onSuccess: () -> Unit
) {
    val viewModel: SellGoldViewModel = viewModel(factory = object : androidx.lifecycle.ViewModelProvider.Factory {
        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
            return SellGoldViewModel(ApiClient.apiService) as T
        }
    })
    
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(userId) {
        viewModel.loadData(userId)
        viewModel.setInitialBalance(initialBalanceMg)
    }

    LaunchedEffect(state.sellSuccess) {
        if (state.sellSuccess) onSuccess()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Claim Physical Gold", fontWeight = FontWeight.Bold, fontSize = 20.sp) },
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
            // Live Gold Rate Debit Card Style
            Card(
                modifier = Modifier.fillMaxWidth().aspectRatio(1.8f),
                shape = RoundedCornerShape(18.dp),
                elevation = CardDefaults.cardElevation(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF4A0E4E), Color(0xFF880E4F), Color(0xFFC2185B))
                            )
                        )
                        .padding(20.dp)
                ) {
                    Column(
                        modifier = Modifier.align(Alignment.TopStart),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("Visit our store to claim your physical gold. Festival and Birthday bonuses will be applied by the admin upon redemption.", fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f))
                        Text(stringResource(R.string.available_balance), fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f), letterSpacing = 1.sp)
                        Text(mgToGrams(state.goldBalanceMg), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        
                        Row(
                            modifier = Modifier.padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("SELLABLE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.6f))
                                Text(mgToGrams(state.redeemableGoldMg), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = GreenGain)
                            }
                            VerticalDivider(modifier = Modifier.height(24.dp), color = Color.White.copy(alpha = 0.2f))
                            Column {
                                Text("LOCKED", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.6f))
                                Text(mgToGrams(state.lockedGoldMg), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.9f))
                            }
                        }
                    }

                    Icon(
                        Icons.Default.Info, 
                        contentDescription = null, 
                        tint = MagentaAccent.copy(alpha = 0.8f), 
                        modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
                    )

                    Row(
                        modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("Matured Gold Value (Live)", fontSize = 10.sp, color = Color.White.copy(alpha = 0.6f), letterSpacing = 1.sp)
                                if (state.priceLockId != null) {
                                    Box(
                                        modifier = Modifier.background(Color(0xFFFFB300).copy(alpha = 0.2f), RoundedCornerShape(4.dp)).padding(horizontal = 4.dp, vertical = 2.dp)
                                    ) {
                                        Text("LOCKED", fontSize = 9.sp, color = Color(0xFFFFB300), fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                            Text("${paiseToRupees(state.sellPricePaise)}/g", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = MagentaAccent)
                            if (state.priceUpdatedAt != null) {
                                Text(
                                    if (state.isFallback) "Using safe fallback price" else "Last updated: ${formatDate(state.priceUpdatedAt!!)}",
                                    color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp
                                )
                            }
                        }
                        
                        if (state.lockExpiresAt != null) {
                            Column(horizontalAlignment = Alignment.End) {
                                CountdownTimer(expiresAt = state.lockExpiresAt!!)
                            }
                        }
                    }
                }
            }

            // Input Section
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("How much gold to sell?", fontWeight = FontWeight.Bold, color = MagentaDark, fontSize = 16.sp)

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
                        focusedLabelColor = MagentaDark
                    ),
                    isError = state.error != null && state.error!!.contains("balance")
                )

                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.or), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                }

                OutlinedTextField(
                    value = state.amountInput,
                    onValueChange = { viewModel.onAmountChanged(it) },
                    label = { Text(stringResource(R.string.amount_receive)) },
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
            }

            // Payout Summary
            if (state.amountToReceivePaise > 0) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE5E7EB)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(stringResource(R.string.selling_amount), color = TextMuted, fontSize = 14.sp)
                            Text(paiseToRupees(state.amountToReceivePaise), color = MagentaDark, fontWeight = FontWeight.Medium)
                        }
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = Color(0xFFF3F4F6))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Gold you will receive (Store/Delivery)", color = MagentaDark, fontWeight = FontWeight.Bold)
                            Text(paiseToRupees(state.amountToReceivePaise), color = GreenGain, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Error Message
            state.error?.let {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Warning, contentDescription = null, tint = RedLoss, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(it, color = RedLoss, fontSize = 13.sp)
                }
            }

            // Sell Button
            Button(
                onClick = { viewModel.sellGold(userId, "fingerprint_placeholder") },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MagentaDark,
                    contentColor = Color.White
                ),
                enabled = state.amountToReceivePaise > 0 && state.error == null && !state.isLoading
            ) {
                if (state.isLoading) {
                    com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(24.dp))
                } else {
                    Text("Sell Gold", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
            
            Text(
                stringResource(R.string.money_credited_bank),
                fontSize = 12.sp,
                color = TextMuted,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 8.dp)
            )
        }
    }
}

private fun paiseToRupees(paise: Long): String {
    val rupees = paise / 100.0
    val fmt = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    fmt.maximumFractionDigits = 2
    fmt.minimumFractionDigits = 2
    return fmt.format(rupees)
}

private fun mgToGrams(mg: Long): String = String.format("%.4f g", mg / 1000.0)

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
