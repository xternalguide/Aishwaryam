package com.example.aishwaryam_android.ui.gold

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.components.AutoTranslateText

// App Core Colors
private val MagentaDark = Color(0xFF4A0E4E)
private val MagentaAccent = Color(0xFFC2185B)
private val SurfaceBg = Color(0xFFF9FAFB)
private val TextPrimary = Color(0xFF1A1A2E)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DigiGoldScreen(
    onBackClick: () -> Unit,
    onEnrollClick: () -> Unit = {}
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.auto_saving), fontWeight = FontWeight.Bold, fontSize = 20.sp) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = MagentaDark,
                    navigationIconContentColor = MagentaDark
                )
            )
        },
        containerColor = SurfaceBg,
        bottomBar = {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = Color.White,
                shadowElevation = 8.dp
            ) {
                Box(modifier = Modifier.padding(16.dp)) {
                    Button(
                        onClick = onEnrollClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MagentaDark, contentColor = Color.White),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text(stringResource(R.string.start_auto_saving), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                BannerSection()
            }
            
            item {
                InvestmentCalculator()
            }
            
            item {
                Text(
                    text = stringResource(R.string.why_auto_save),
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MagentaDark
                )
                Spacer(modifier = Modifier.height(8.dp))
                AutoTranslateText(
                    text = "Gold is not just a precious metal; it's an integral part of Indian culture and a symbol of wealth passed down through generations. Its stability and high returns have made it a preferred investment option for generations — a testament to its trustworthiness and reliability. Financial experts suggest an investment portfolio should include a minimum of 10% of GOLD to strengthen it.",
                    fontSize = 14.sp,
                    color = Color.DarkGray,
                    lineHeight = 22.sp
                )
            }

            item {
                AccordionSection(
                    title = stringResource(R.string.what_is_auto_saving),
                    content = "Auto Saving is a digital gold purchase plan that allows you to automate your investments. Your daily payments are converted into Digital GOLD at the prevailing market rate at the time of deposit. It is a safe and efficient way to invest in gold with a minimum initial investment of just ₹100. You can convert your digital gold into physical gold anytime by visiting our stores."
                )
            }

            item {
                AccordionSection(
                    title = stringResource(R.string.start_with_100),
                    content = "With our Auto Saving plan, you can start purchasing gold for as little as ₹100, making it a highly accessible gold purchase option for everyone. It completely automates the hassle of manually buying gold, giving you peace of mind."
                )
            }

            item {
                SaveMoreAccordion()
            }
            
            item { Spacer(modifier = Modifier.height(32.dp)) }
        }
    }
}

@Composable
private fun BannerSection() {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MagentaDark),
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = stringResource(R.string.auto_saving),
                color = MagentaAccent,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = stringResource(R.string.start_saving_in_gold),
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(R.string.with_as_low_as_100),
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(20.dp))
            ContainerChip()
        }
    }
}

@Composable
private fun ContainerChip() {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(30.dp))
            .background(MagentaAccent.copy(alpha = 0.2f))
            .border(1.dp, MagentaAccent.copy(alpha = 0.5f), RoundedCornerShape(30.dp))
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = stringResource(R.string.secure_bonus_flexible),
            color = MagentaAccent,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun AccordionSection(title: String, content: String) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF3F4F6))
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand",
                    tint = MagentaDark
                )
            }
            
            if (expanded) {
                AutoTranslateText(
                    text = content,
                    modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                    fontSize = 14.sp,
                    color = Color.DarkGray,
                    lineHeight = 22.sp
                )
            }
        }
    }
}

@Composable
private fun SaveMoreAccordion() {
    var expanded by remember { mutableStateOf(false) }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF3F4F6))
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = stringResource(R.string.bonus_benefits),
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
                Icon(
                    imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand",
                    tint = MagentaDark
                )
            }
            
            if (expanded) {
                Column(modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp)) {
                    AutoTranslateText(
                        text = "With our Auto Saving Plan, you earn an instant GOLD weight bonus based on your tenure. Within the first 75 days, you'll receive a 7.5% instant GOLD weight bonus.\n\n" +
                               "• Second 75 Days: 5.5% bonus\n" +
                               "• Third 75 Days: 3.5% bonus\n" +
                               "• Last 75 Days: 1.5% bonus",
                        fontSize = 14.sp,
                        color = Color.DarkGray,
                        lineHeight = 22.sp
                    )
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    BonusTable()
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    AutoTranslateText(
                        text = "The bonus will be calculated on the paid amount multiplied by the bonus percentage applicable to that period. Early investments within the first 75 days get 7.5%, 76 to 150 days get 5.5%, and so on.",
                        fontSize = 13.sp,
                        color = Color.Gray,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun BonusTable() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
            .background(Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MagentaDark.copy(alpha = 0.05f))
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(stringResource(R.string.tenure_period), fontWeight = FontWeight.Bold, color = MagentaDark, fontSize = 14.sp)
            Text(stringResource(R.string.bonus_percent), fontWeight = FontWeight.Bold, color = MagentaDark, fontSize = 14.sp)
        }
        HorizontalDivider(color = Color(0xFFE5E7EB))
        
        TableRow("0 to 75 days", "7.5%")
        TableRow("76 to 150 days", "5.5%")
        TableRow("151 to 225 days", "3.5%")
        TableRow("226 to 330 days", "1.5%", isLast = true)
    }
}

@Composable
private fun TableRow(col1: String, col2: String, isLast: Boolean = false) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(col1, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text(col2, color = MagentaDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
        if (!isLast) {
            HorizontalDivider(color = Color(0xFFF3F4F6))
        }
    }
}

@Composable
private fun InvestmentCalculator() {
    var amountText by remember { mutableStateOf("100") }
    val amount = amountText.toDoubleOrNull() ?: 0.0

    // Flexible investment projection based on a single payment today earning the max 7.5% bonus
    val totalPrincipal = amount
    val totalBonus = amount * 0.075
    val maturityValue = totalPrincipal + totalBonus

    // Date Calculation
    val calendar = java.util.Calendar.getInstance()
    calendar.add(java.util.Calendar.DAY_OF_YEAR, 330)
    val dateFormat = java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.getDefault())
    val maturityDate = dateFormat.format(calendar.time)

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(4.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(stringResource(R.string.calculate_returns), fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MagentaDark)
            Text(stringResource(R.string.see_how_multiply), fontSize = 13.sp, color = Color.Gray, modifier = Modifier.padding(top = 4.dp))
            
            Spacer(modifier = Modifier.height(20.dp))
            
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it },
                label = { Text(stringResource(R.string.daily_saving_amount)) },
                prefix = { Text("₹ ") },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MagentaDark,
                    focusedLabelColor = MagentaDark,
                    cursorColor = MagentaDark,
                    focusedTextColor = Color.Black,
                    unfocusedTextColor = Color.Black,
                    focusedPlaceholderColor = Color.Gray,
                    unfocusedPlaceholderColor = Color.Gray
                )
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            val fmt = java.text.NumberFormat.getCurrencyInstance(java.util.Locale("en", "IN"))
            fmt.maximumFractionDigits = 0

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.total_principal), color = Color.DarkGray, fontSize = 14.sp)
                Text(fmt.format(totalPrincipal), fontWeight = FontWeight.SemiBold, color = TextPrimary)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.projected_bonus), color = Color(0xFF10B981), fontSize = 14.sp) // Emerald green
                Text("+ " + fmt.format(totalBonus), fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
            }
            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = Color(0xFFF3F4F6))
            Spacer(modifier = Modifier.height(16.dp))
            
            // Maturity Value Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MagentaDark.copy(alpha = 0.05f))
                    .padding(16.dp)
            ) {
                Column {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(stringResource(R.string.maturity_value), fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MagentaDark)
                        Text(fmt.format(maturityValue), fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = MagentaDark)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(stringResource(R.string.matures_on, maturityDate), color = MagentaDark.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}
