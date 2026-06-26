package com.example.aishwaryam_android.ui.info

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*
import com.example.aishwaryam_android.ui.components.TText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoldRateAlertScreen(onBackClick: () -> Unit) {
    var priceDropEnabled by remember { mutableStateOf(true) }
    var bestTimeEnabled by remember { mutableStateOf(true) }
    var dailyTrendEnabled by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        stringResource(R.string.gold_rate_alert_title),
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        color = BrandDeep
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = BrandDeep)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFFAFAFA)
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                TText(
                    stringResource(R.string.push_notification_prefs),
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    color = BrandDeep,
                    modifier = Modifier.padding(start = 8.dp)
                )
                Spacer(Modifier.height(8.dp))
                
                // Price Drop Alerts
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(SuccessGreen.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.AutoMirrored.Filled.TrendingDown, contentDescription = null, tint = SuccessGreen)
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            TText(stringResource(R.string.price_drop_alerts), fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = BrandDeep)
                            TText(stringResource(R.string.price_drop_alerts_desc), fontSize = 12.sp, color = TextMuted, fontFamily = PoppinsFamily)
                        }
                        Switch(
                            checked = priceDropEnabled,
                            onCheckedChange = { priceDropEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = SuccessGreen)
                        )
                    }
                }
            }

            item {
                // Best Time to Buy
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(GoldWarm.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Stars, contentDescription = null, tint = GoldWarm)
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            TText(stringResource(R.string.best_time_to_buy), fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = BrandDeep)
                            TText(stringResource(R.string.best_time_to_buy_desc), fontSize = 12.sp, color = TextMuted, fontFamily = PoppinsFamily)
                        }
                        Switch(
                            checked = bestTimeEnabled,
                            onCheckedChange = { bestTimeEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = GoldWarm)
                        )
                    }
                }
            }

            item {
                // Daily Trend
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(BrandAccent.copy(alpha = 0.1f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ShowChart, contentDescription = null, tint = BrandAccent)
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            TText(stringResource(R.string.daily_trend), fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = BrandDeep)
                            TText("Get a daily summary at 10 AM", fontSize = 12.sp, color = TextMuted, fontFamily = PoppinsFamily)
                        }
                        Switch(
                            checked = dailyTrendEnabled,
                            onCheckedChange = { dailyTrendEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = BrandAccent)
                        )
                    }
                }
            }
        }
    }
}
