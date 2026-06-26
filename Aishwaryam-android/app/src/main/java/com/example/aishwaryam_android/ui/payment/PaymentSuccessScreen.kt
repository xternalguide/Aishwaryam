package com.example.aishwaryam_android.ui.payment

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.gson.Gson
import kotlinx.coroutines.delay
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*
import com.example.aishwaryam_android.ui.components.CelebrationAnimation
import com.example.aishwaryam_android.ui.components.AnimatedCounter
import com.example.aishwaryam_android.ui.schemes.ReceiptPdfGenerator
import androidx.compose.ui.text.TextStyle

// ── Colour Tokens ──────────────────────────────────────────────────────────────
private val MagentaDark   = Color(0xFF4A0E4E)
private val MagentaMid    = Color(0xFF7B1FA2)
private val MagentaAccent = Color(0xFFC2185B)
private val GoldAmber     = Color(0xFFFFB300)
private val GoldLight     = Color(0xFFFFF8E1)
private val EmeraldGreen  = Color(0xFF10B981)
private val EmeraldLight  = Color(0xFFECFDF5)
private val SlateGray     = Color(0xFF6B7280)
private val SurfaceWhite  = Color(0xFFFFFFFF)

/** Lightweight local model - mirrors backend GoldTransactionResponse */
private data class ReceiptData(
    val success: Boolean = false,
    val message: String = "",
    val goldWeightMg: Long = 0,
    val pricePerGmPaise: Long = 0,
    val totalAmountPaise: Long = 0,
    val baseAmountPaise: Long = 0,
    val gstAmountPaise: Long = 0,
    val bonusPercentage: Double = 0.0,
    val bonusAmountPaise: Long = 0,
    val bonusGoldMg: Long = 0,
    val totalGoldCreditedMg: Long = 0,
    val newWalletBalancePaise: Long = 0,
    val newGoldBalanceMg: Long = 0,
    val lockedGoldMg: Long = 0,
    val redeemableGoldMg: Long = 0
)

@Composable
fun PaymentSuccessScreen(
    receiptJson: String,
    userName: String = "Aishwaryam User",
    userPhone: String = "",
    schemeName: String = "Digital Metal Savings Plan",
    livePricePaise: Long = 0L,
    onViewPortfolioClick: () -> Unit,
    onBackClick: () -> Unit
) {
    fun getLocalizedText(ta: String, en: String): String {
        val locale = Locale.getDefault()
        return if (locale.language == "ta") ta else en
    }
    val receipt = remember {
        try { Gson().fromJson(receiptJson, ReceiptData::class.java) }
        catch (_: Exception) { ReceiptData() }
    }

    // Determine dynamic price to use: prioritize receipt.pricePerGmPaise if valid, otherwise livePricePaise, with a hardcoded fallback only if both are 0.
    val lockedPricePaise = remember(receipt, livePricePaise) {
        when {
            receipt.pricePerGmPaise > 0 -> receipt.pricePerGmPaise
            livePricePaise > 0 -> livePricePaise
            else -> 600000L // safe fallback price in paise (6000 INR per gram)
        }
    }

    val effectiveTotalPaise = remember(receipt) {
        if (receipt.totalAmountPaise > 0) receipt.totalAmountPaise else 0L
    }

    val displayBaseAmount = remember(effectiveTotalPaise) {
        (effectiveTotalPaise * 100L) / 103L
    }

    val displayGstAmount = remember(effectiveTotalPaise, displayBaseAmount) {
        effectiveTotalPaise - displayBaseAmount
    }

    // Dynamic calculations:
    // Grams = base amount / lockedPrice (both in paise, multiplied by 1000 to get mg)
    val calculatedGoldWeightMg = remember(displayBaseAmount, lockedPricePaise) {
        if (lockedPricePaise > 0) (displayBaseAmount * 1000L) / (lockedPricePaise / 100) else 0L
    }

    // Calculate dynamic bonus: 7.5% as requested by the user
    val calculatedBonusGoldMg = remember(calculatedGoldWeightMg) {
        (calculatedGoldWeightMg * 75) / 1000L // 7.5% of gold weight
    }

    val calculatedBonusAmountPaise = remember(displayBaseAmount) {
        (displayBaseAmount * 75) / 1000L // 7.5% of base investment amount
    }

    val displayGoldWeightMg = remember(receipt, calculatedGoldWeightMg) {
        if (receipt.goldWeightMg > 0) receipt.goldWeightMg else calculatedGoldWeightMg
    }

    val displayBonusGoldMg = remember(receipt, calculatedBonusGoldMg) {
        if (receipt.bonusGoldMg > 0) receipt.bonusGoldMg else calculatedBonusGoldMg
    }

    val displayBonusPercentage = remember(receipt) {
        if (receipt.bonusPercentage > 0.0) receipt.bonusPercentage else 7.5
    }

    val displayBonusAmountPaise = remember(receipt, calculatedBonusAmountPaise) {
        if (receipt.bonusAmountPaise > 0) receipt.bonusAmountPaise else calculatedBonusAmountPaise
    }

    val displayGold = remember(displayGoldWeightMg, displayBonusGoldMg) {
        displayGoldWeightMg + displayBonusGoldMg
    }

    val hasBonus = true // Bonus of 7.5% is always shown dynamically in calculation as requested by user!

    // Bounce-in animation for the checkmark
    var animateIn by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { delay(80); animateIn = true }
    val checkScale by animateFloatAsState(
        targetValue = if (animateIn) 1f else 0.4f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "checkScale"
    )

    // Pulsing animation for the bonus star badge
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val starScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "starPulse"
    )

    Scaffold(containerColor = Color(0xFFF5F3FF)) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ── Top gradient strip ─────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(
                        Brush.verticalGradient(listOf(MagentaDark, MagentaMid))
                    ),
                contentAlignment = Alignment.Center
            ) {
                // ── Confetti Lottie Animation Overlay ─────────────────────────
                CelebrationAnimation(
                    modifier = Modifier.matchParentSize(),
                    isPlaying = animateIn
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    // Success checkmark
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .scale(checkScale)
                            .clip(CircleShape)
                            .background(EmeraldGreen),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(40.dp))
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Payment Successful!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                    if (hasBonus) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "🏆 +${receipt.bonusPercentage.toInt()}% Bonus Gold Earned",
                            color = GoldAmber,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // ── Bonus reward hero card (only when bonus applies) ───────────
            if (hasBonus) {
                Spacer(Modifier.height(20.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                        .scale(starScale),
                    colors = CardDefaults.cardColors(containerColor = GoldLight),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Star, null, tint = GoldAmber, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                "Bonus Gold Credited!",
                                fontWeight = FontWeight.ExtraBold,
                                color = Color(0xFF6D4C00),
                                fontSize = 16.sp
                            )
                            Text(
                                "+${mgToGrams(receipt.bonusGoldMg)} g • ${receipt.bonusPercentage.toInt()}% reward applied",
                                color = Color(0xFF8D6E00),
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // ── Main Gold Credited section ─────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Total Gold Credited", color = SlateGray, fontSize = 13.sp)
                    Spacer(Modifier.height(6.dp))
                    // Convert to integer for the animated counter (in milligrams or 1/1000th units)
                    Row(verticalAlignment = Alignment.Bottom) {
                        AnimatedCounter(
                            text = displayGold.toString(),
                            style = TextStyle(fontSize = 40.sp, fontWeight = FontWeight.ExtraBold, color = MagentaDark)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("mg", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = SlateGray, modifier = Modifier.padding(bottom = 6.dp))
                    }
                    Text("(= ${mgToGrams(displayGold)} g)", fontSize = 14.sp, color = SlateGray)
                    if (hasBonus) {
                        Spacer(Modifier.height(4.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Tag("Base: ${mgToGrams(displayGoldWeightMg)} g", MagentaAccent)
                            Tag("Bonus: +${mgToGrams(displayBonusGoldMg)} g", EmeraldGreen)
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Premium Transaction Breakdown Table ───────────────────────
            val tableHeaders = listOf(
                getLocalizedText("தேதி", "Date"),
                getLocalizedText("தொகை", "Amount"),
                getLocalizedText("வாங்கியது", "Bought"),
                getLocalizedText("போனஸ்", "Bonus")
            )
            val isSilver = schemeName.lowercase().contains("silver")
            val metalSuffix = if (isSilver) "g Ag" else "g Au"
            val baseGrams = mgToGrams(displayGoldWeightMg) + " " + metalSuffix
            val bonusGrams = if (displayBonusGoldMg > 0) "+${mgToGrams(displayBonusGoldMg)} $metalSuffix" else "0.000 $metalSuffix"
            val displayDateStr = SimpleDateFormat("dd MMM yyyy", Locale.US).format(Date())
            
            val tableRows = listOf(
                listOf(
                    displayDateStr,
                    paiseToRupees(effectiveTotalPaise),
                    baseGrams,
                    bonusGrams
                )
            )

            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = getLocalizedText("பரிவர்த்தனை விவரங்கள்", "TRANSACTION DETAILS"),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateGray,
                        letterSpacing = 1.2.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    // Table header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MagentaDark.copy(alpha = 0.06f), shape = RoundedCornerShape(8.dp))
                            .padding(vertical = 10.dp, horizontal = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        tableHeaders.forEachIndexed { index, header ->
                            Text(
                                text = header,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = MagentaDark,
                                modifier = Modifier.weight(1f),
                                textAlign = when (index) {
                                    0 -> TextAlign.Start
                                    tableHeaders.size - 1 -> TextAlign.End
                                    else -> TextAlign.Center
                                }
                            )
                        }
                    }
                    
                    Spacer(Modifier.height(8.dp))
                    
                    // Table row
                    tableRows.forEach { rowData ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp, horizontal = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            rowData.forEachIndexed { colIndex, cellText ->
                                Text(
                                    text = cellText,
                                    fontWeight = if (colIndex == rowData.size - 1) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 12.sp,
                                    color = when {
                                        colIndex == rowData.size - 1 && displayBonusGoldMg > 0 -> EmeraldGreen
                                        colIndex == 0 -> SlateGray
                                        else -> MagentaDark
                                    },
                                    modifier = Modifier.weight(1f),
                                    textAlign = when (colIndex) {
                                        0 -> TextAlign.Start
                                        rowData.size - 1 -> TextAlign.End
                                        else -> TextAlign.Center
                                    }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Investment Breakdown ───────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(0.dp)) {
                    SectionLabel("Investment")
                    ReceiptRow("Total Paid",       paiseToRupees(effectiveTotalPaise), bold = true)
                    ReceiptRow("Base Amount",      paiseToRupees(displayBaseAmount))
                    ReceiptRow("GST (3%)",         paiseToRupees(displayGstAmount))

                    DividerLine()

                    SectionLabel("Gold Snapshot")
                    ReceiptRow("Gold Rate",       "${paiseToRupees(lockedPricePaise)} / g")
                    ReceiptRow("Gold Purchased",  "${mgToGrams(displayGoldWeightMg)} g")

                    if (hasBonus) {
                        DividerLine()
                        SectionLabel("Bonus Details")
                        ReceiptRow("Bonus Tier",      "${displayBonusPercentage.toInt()}%", valueColor = GoldAmber)
                        ReceiptRow("Bonus Gold",      "+${mgToGrams(displayBonusGoldMg)} g", valueColor = EmeraldGreen, bold = true)
                    }

                    DividerLine()

                    SectionLabel("Portfolio")
                    ReceiptRow("Total Balance",   "${mgToGrams(receipt.newGoldBalanceMg)} g", bold = true)
                    if (receipt.lockedGoldMg > 0) {
                        ReceiptRow("In Active Schemes", "${mgToGrams(receipt.lockedGoldMg)} g 🔒", valueColor = MagentaAccent)
                        ReceiptRow("Redeemable",  "${mgToGrams(receipt.redeemableGoldMg)} g", valueColor = EmeraldGreen)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Action buttons: Share / Download ──────────────────────────
            val context = androidx.compose.ui.platform.LocalContext.current
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                shape = RoundedCornerShape(20.dp),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    TextButton(onClick = { 
                        ReceiptPdfGenerator.generateAndShareSuccessReceipt(
                            context = context,
                            transactionId = "TXN" + System.currentTimeMillis().toString().takeLast(8),
                            amountPaise = effectiveTotalPaise,
                            baseAmountPaise = displayBaseAmount,
                            gstAmountPaise = displayGstAmount,
                            goldWeightMg = displayGoldWeightMg,
                            pricePerGmPaise = lockedPricePaise,
                            bonusPercentage = displayBonusPercentage,
                            bonusAmountPaise = displayBonusAmountPaise,
                            bonusGoldMg = displayBonusGoldMg,
                            totalGoldCreditedMg = displayGold,
                            status = "COMPLETED",
                            createdAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date()),
                            razorpayPaymentId = null,
                            userName = userName,
                            userPhone = userPhone,
                            schemeName = schemeName,
                            shareImmediately = true
                        )
                    }) {
                        Icon(Icons.Default.Share, null, modifier = Modifier.size(18.dp), tint = MagentaAccent)
                        Spacer(Modifier.width(6.dp))
                        Text("Share Receipt", color = MagentaAccent, fontWeight = FontWeight.SemiBold)
                    }
                    TextButton(onClick = { 
                        ReceiptPdfGenerator.generateAndShareSuccessReceipt(
                            context = context,
                            transactionId = "TXN" + System.currentTimeMillis().toString().takeLast(8),
                            amountPaise = effectiveTotalPaise,
                            baseAmountPaise = displayBaseAmount,
                            gstAmountPaise = displayGstAmount,
                            goldWeightMg = displayGoldWeightMg,
                            pricePerGmPaise = lockedPricePaise,
                            bonusPercentage = displayBonusPercentage,
                            bonusAmountPaise = displayBonusAmountPaise,
                            bonusGoldMg = displayBonusGoldMg,
                            totalGoldCreditedMg = displayGold,
                            status = "COMPLETED",
                            createdAt = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date()),
                            razorpayPaymentId = null,
                            userName = userName,
                            userPhone = userPhone,
                            schemeName = schemeName,
                            shareImmediately = false
                        )
                    }) {
                        Icon(Icons.Default.Download, null, modifier = Modifier.size(18.dp), tint = MagentaDark)
                        Spacer(Modifier.width(6.dp))
                        Text("Download PDF", color = MagentaDark, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // ── Trust Indicators ──────────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldLight),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(0.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape).background(EmeraldGreen.copy(alpha=0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Shield, null, tint = EmeraldGreen, modifier = Modifier.size(24.dp))
                    }
                    Column {
                        Text(
                            "Your gold is safely stored",
                            color = EmeraldGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            "Secured Transaction • 24K Gold • Audit Safe",
                            color = SlateGray,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Support Hotline Link (Compliance Support Option)
            TextButton(
                onClick = {
                    val intent = android.content.Intent(android.content.Intent.ACTION_DIAL).apply {
                        data = android.net.Uri.parse("tel:+919443000000")
                    }
                    try { context.startActivity(intent) } catch (e: Exception) {
                        android.widget.Toast.makeText(context, "Support Hotline: +91 94430 00000", android.widget.Toast.LENGTH_LONG).show()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = getLocalizedText("உதவி தேவையா? ஆதரவை அணுகவும்", "Need Help? Contact Customer Support"),
                    color = MagentaAccent,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(Modifier.height(16.dp))

            // ── CTAs ──────────────────────────────────────────────────────
            Column(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onViewPortfolioClick,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MagentaDark, contentColor = Color.White),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("View Portfolio", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = onBackClick,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MagentaDark),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, MagentaDark),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text(getLocalizedText("திரும்பவும்", "Back"), fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(48.dp))
        }
    }
}

// ── Reusable sub-components ────────────────────────────────────────────────────

@Composable
private fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        color = SlateGray,
        letterSpacing = 1.2.sp,
        modifier = Modifier.padding(top = 16.dp, bottom = 4.dp)
    )
}

@Composable
private fun ReceiptRow(
    label: String,
    value: String,
    valueColor: Color = MagentaDark,
    bold: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = SlateGray, fontSize = 13.sp)
        Text(
            value,
            color = valueColor,
            fontSize = if (bold) 15.sp else 13.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Medium
        )
    }
}

@Composable
private fun DividerLine() {
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color(0xFFF0EDF5), thickness = 1.dp)
}

@Composable
private fun Tag(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text, color = color, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

// ── Formatters ────────────────────────────────────────────────────────────────

private fun paiseToRupees(paise: Long): String {
    val fmt = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return fmt.format(paise / 100.0)
}

private fun mgToGrams(mg: Long): String = String.format(Locale.US, "%.3f", mg / 1000.0)
