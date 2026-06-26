package com.example.aishwaryam_android.ui.schemes

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoalPlannerScreen(onBackClick: () -> Unit) {
    var targetAmount by remember { mutableStateOf("100000") }
    var durationMonths by remember { mutableStateOf("11") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        stringResource(R.string.goal_planner_title),
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Pick a Goal
            item {
                Text(
                    "Select Your Goal",
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    color = BrandDeep,
                    modifier = Modifier.padding(start = 8.dp)
                )
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    GoalTypeCard(
                        icon = Icons.Default.Favorite,
                        title = stringResource(R.string.wedding_jewellery_goal),
                        color = BrandAccent,
                        modifier = Modifier.weight(1f)
                    )
                    GoalTypeCard(
                        icon = Icons.Default.Festival,
                        title = stringResource(R.string.festival_savings_goal),
                        color = GoldWarm,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Calculator
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            stringResource(R.string.monthly_contribution_calc),
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            color = BrandDeep
                        )
                        Spacer(Modifier.height(16.dp))

                        OutlinedTextField(
                            value = targetAmount,
                            onValueChange = { targetAmount = it },
                            label = { Text(stringResource(R.string.target_amount)) },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        Spacer(Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = durationMonths,
                            onValueChange = { durationMonths = it },
                            label = { Text(stringResource(R.string.duration_months)) },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        Spacer(Modifier.height(24.dp))
                        
                        // Result Box
                        val amount = targetAmount.toDoubleOrNull() ?: 0.0
                        val months = durationMonths.toIntOrNull() ?: 1
                        val monthlySave = if (months > 0) amount / months else 0.0
                        
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(BrandDeep.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    stringResource(R.string.monthly_save_amount),
                                    fontFamily = PoppinsFamily,
                                    fontSize = 14.sp,
                                    color = TextMuted
                                )
                                Text(
                                    "₹${String.format("%.0f", monthlySave)}",
                                    fontFamily = PoppinsFamily,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 28.sp,
                                    color = BrandDeep
                                )
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        Button(
                            onClick = { /* Navigate to scheme list */ },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = GoldWarm),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                stringResource(R.string.plan_my_goal),
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
                                color = BrandDeep,
                                fontSize = 16.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GoalTypeCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 2.dp,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.height(12.dp))
            Text(
                title,
                fontSize = 13.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Medium,
                color = BrandDeep,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}
