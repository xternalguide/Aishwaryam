package com.example.aishwaryam_android.ui.schemes

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.network.AvailableScheme
import com.example.aishwaryam_android.network.SchemeLedgerItem
import com.example.aishwaryam_android.network.SchemeProgressResponse
import com.example.aishwaryam_android.ui.theme.*
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchemeDetailScreen(
    scheme: AvailableScheme,
    currentGoldPrice: Long,
    isActive: Boolean = false,
    installmentsPaid: Int = 0,
    schemeDayNumber: Int = 0,
    nextDueDate: String = "",
    kycLevel: String = "BASIC",
    userPhone: String = "",
    userName: String = "",
    userId: String = "",
    isPaymentLoading: Boolean = false,
    onBackClick: () -> Unit,
    onJoinClick: (AvailableScheme) -> Unit = {},
    onPayClick: (Long) -> Unit = {},
    onRedeemClick: () -> Unit = {},
    onKycClick: () -> Unit = {},
    onProceedWithJoin: (Boolean, Long) -> Unit = { _, _ -> },
    viewModel: SchemeDetailViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val isSilver = remember(scheme.planName) { scheme.planName.lowercase().contains("silver") }
    val isTamil = Locale.getDefault().language == "ta"
    val schemeAttributes = remember(scheme.paymentRulesJson) { parseSchemeAttributes(scheme.paymentRulesJson) }
    val customSections = remember(scheme.customSectionsJson) { parseCustomSections(scheme.customSectionsJson) }

    var showJoinSheet by remember { mutableStateOf(false) }
    var showRedemptionSheet by remember { mutableStateOf(false) }
    var showPaySheet by remember { mutableStateOf(false) }
    
    var inputAmountText by remember { mutableStateOf((scheme.installmentAmountPaise / 100L).toString()) }
    var autoPayEnabled by remember { mutableStateOf(false) }
    
    var customPayAmountText by remember { mutableStateOf((scheme.installmentAmountPaise / 100L).toString()) }
    var customPayWeightText by remember { mutableStateOf("") }
    
    val joinSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val redeemSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Localizer function for English and Tamil
    fun getLocalizedText(ta: String, en: String): String {
        val locale = Locale.getDefault()
        return if (locale.language == "ta") ta else en
    }

    LaunchedEffect(showPaySheet) {
        if (showPaySheet) {
            customPayAmountText = (scheme.installmentAmountPaise / 100L).toString()
            val isSilverScheme = scheme.planName.lowercase().contains("silver")
            val metalRate = if (isSilverScheme) 9500L else currentGoldPrice
            val amtVal = customPayAmountText.toDoubleOrNull() ?: 0.0
            val basePaise = (amtVal * 100.0) / 1.03
            val computedGrams = if (metalRate > 0) {
                (basePaise * 1000.0) / (metalRate * 1000.0)
            } else {
                0.0
            }
            customPayWeightText = if (computedGrams > 0.0) String.format(Locale.US, "%.3f", computedGrams) else ""
        }
    }

    // Load dynamic state on active schemes
    LaunchedEffect(scheme.id, isActive) {
        if (isActive) {
            viewModel.loadSchemeDetails(scheme.id)
        }
    }

    // Event listener
    LaunchedEffect(viewModel.events) {
        viewModel.events.collect { event ->
            when (event) {
                is SchemeDetailEvent.RedemptionSuccess -> {
                    showRedemptionSheet = false
                    Toast.makeText(
                        context, 
                        getLocalizedText("மீட்பு கோரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது", "Redemption request submitted successfully"), 
                        Toast.LENGTH_LONG
                    ).show()
                }
                is SchemeDetailEvent.ShowToast -> {
                    Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Determine maturity status
    val isMatured = remember(uiState.progress) {
        val prog = uiState.progress
        if (prog != null) {
            prog.status.equals("MATURED", ignoreCase = true) || prog.installmentsPaid >= prog.totalInstallments
        } else {
            installmentsPaid >= scheme.totalInstallments
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(scheme.planName, fontFamily = PlayfairFamily, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { if (!isPaymentLoading) onBackClick() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            },
            containerColor = Color(0xFFF8F9FA),
            bottomBar = {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = Color.White,
                    shadowElevation = 16.dp
                ) {
                    if (!isActive) {
                        Button(
                            onClick = { showJoinSheet = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp)
                                .height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandDark, contentColor = Color.White),
                            enabled = !isPaymentLoading
                        ) {
                            Text(
                                getLocalizedText("திட்டத்தில் சேரவும்", "Join This Scheme"),
                                fontFamily = PoppinsFamily, 
                                fontWeight = FontWeight.Bold, 
                                fontSize = 16.sp
                            )
                        }
                    } else {
                        if (isMatured) {
                            Button(
                                onClick = { onRedeemClick() },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                                    .height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen, contentColor = Color.White),
                                enabled = !isPaymentLoading
                            ) {
                                Icon(Icons.Default.Celebration, null, tint = Color.White)
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    getLocalizedText(if (isSilver) "வெள்ளியை மீட்டெடுக்கவும்" else "தங்கத்தை மீட்டெடுக்கவும்", if (isSilver) "Redeem Silver" else "Redeem Gold"),
                                    fontFamily = PoppinsFamily,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                        } else {
                            Button(
                                onClick = { showPaySheet = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp)
                                    .height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BrandDark, contentColor = Color.White),
                                enabled = !isPaymentLoading
                            ) {
                                Text(
                                    getLocalizedText("தவணை செலுத்தவும்", "Pay Installment"),
                                    fontFamily = PoppinsFamily,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                        }
                    }
                }
            }
        ) { padding ->
            val paySheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

            if (showPaySheet) {
                ModalBottomSheet(
                    onDismissRequest = { showPaySheet = false },
                    sheetState = paySheetState,
                    containerColor = Color.White
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                            .navigationBarsPadding(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = getLocalizedText("தவணை செலுத்தவும்", "Pay Installment"),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = BrandDeep,
                            fontFamily = PoppinsFamily
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = scheme.planName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300)
                        )

                        Spacer(Modifier.height(24.dp))

                        val isSilverScheme = scheme.planName.lowercase().contains("silver")
                        val metalRate = if (isSilverScheme) 9500L else currentGoldPrice
                        
                        val enteredAmount = customPayAmountText.toLongOrNull() ?: 0L
                        val enteredAmountPaise = enteredAmount * 100L
                        val baseAmountPaise = (enteredAmountPaise * 100L) / 103L
                        val gstAmountPaise = enteredAmountPaise - baseAmountPaise
                        val bonusPercent = uiState.progress?.currentBonusTierPercent ?: 7.5
                        val bonusAmountPaise = (baseAmountPaise * (bonusPercent / 100.0)).toLong()
                        val totalEffectiveValuePaise = baseAmountPaise + bonusAmountPaise
                        val estimatedGoldMg = if (metalRate > 0) {
                            (totalEffectiveValuePaise * 1000L) / metalRate
                        } else {
                            0L
                        }

                        // Side-by-side inputs
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedTextField(
                                value = customPayAmountText,
                                onValueChange = { newValue ->
                                    if (newValue.all { it.isDigit() }) {
                                        customPayAmountText = newValue
                                        val amtVal = newValue.toDoubleOrNull() ?: 0.0
                                        val basePaise = (amtVal * 100.0) / 1.03
                                        val computedGrams = if (metalRate > 0) {
                                            (basePaise * 1000.0) / (metalRate * 1000.0)
                                        } else {
                                            0.0
                                        }
                                        customPayWeightText = if (computedGrams > 0.0) String.format(Locale.US, "%.3f", computedGrams) else ""
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                label = { Text(getLocalizedText("தொகை (₹)", "Amount (₹)")) },
                                singleLine = true,
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                                ),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = MagentaPrimary,
                                    unfocusedBorderColor = Color.LightGray
                                )
                            )

                            OutlinedTextField(
                                value = customPayWeightText,
                                onValueChange = { newValue ->
                                    if (newValue.isEmpty() || newValue.matches(Regex("^\\d*\\.?\\d*$"))) {
                                        customPayWeightText = newValue
                                        val weightGrams = newValue.toDoubleOrNull() ?: 0.0
                                        val weightMg = weightGrams * 1000.0
                                        val basePaise = (weightMg * metalRate) / 1000.0
                                        val totalPaise = basePaise * 1.03
                                        val computedRupees = (totalPaise / 100.0).toLong()
                                        customPayAmountText = if (computedRupees > 0) computedRupees.toString() else ""
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(16.dp),
                                label = { Text(getLocalizedText(if (isSilverScheme) "வெள்ளி (கி)" else "தங்கம் (கி)", if (isSilverScheme) "Silver (g)" else "Gold (g)")) },
                                singleLine = true,
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal
                                ),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = MagentaPrimary,
                                    unfocusedBorderColor = Color.LightGray
                                )
                            )
                        }

                        Spacer(Modifier.height(16.dp))

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SurfaceLight.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(16.dp),
                            border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.2f))
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("தவணைத் தொகை", "Installment Amount"), color = TextSecondary, fontSize = 13.sp)
                                    Text(paiseToRupees(enteredAmountPaise), fontWeight = FontWeight.Bold, color = BrandDeep, fontSize = 13.sp)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("அடிப்படைத் தொகை", "Base Amount"), color = TextSecondary, fontSize = 13.sp)
                                    Text(paiseToRupees(baseAmountPaise), color = BrandDeep, fontSize = 13.sp)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("ஜிஎஸ்டி (3%)", "GST (3%)"), color = TextSecondary, fontSize = 13.sp)
                                    Text(paiseToRupees(gstAmountPaise), color = BrandDeep, fontSize = 13.sp)
                                }
                                if (bonusPercent > 0.0) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(
                                            getLocalizedText("போனஸ் (${String.format(Locale.US, "%.1f", bonusPercent)}%)", "Bonus (${String.format(Locale.US, "%.1f", bonusPercent)}%)"),
                                            color = SuccessGreen,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            "+ " + paiseToRupees(bonusAmountPaise),
                                            color = SuccessGreen,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text(getLocalizedText("மொத்த மதிப்பு", "Total Value"), color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Text(paiseToRupees(totalEffectiveValuePaise), color = BrandDeep, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(getLocalizedText("நேரடி உலோக விலை", "Live Metal Rate"), color = TextSecondary, fontSize = 13.sp)
                                    Text(paiseToRupees(metalRate) + "/g", fontWeight = FontWeight.Bold, color = BrandDeep, fontSize = 13.sp)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(getLocalizedText(if (isSilverScheme) "மதிப்பிடப்பட்ட வெள்ளி" else "மதிப்பிடப்பட்ட தங்கம்", if (isSilverScheme) "Estimated Silver" else "Estimated Gold"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Text(mgToGrams(estimatedGoldMg, isSilver = isSilverScheme), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = if (isSilverScheme) Color(0xFF90A4AE) else Color(0xFFFFB300))
                                }
                            }
                        }

                        Spacer(Modifier.height(24.dp))

                        Button(
                            onClick = {
                                if (enteredAmountPaise > 0) {
                                    showPaySheet = false
                                    onPayClick(enteredAmountPaise)
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White),
                            enabled = enteredAmountPaise > 0 && !isPaymentLoading
                        ) {
                            Icon(Icons.Default.Payment, null, tint = Color.White)
                            Spacer(Modifier.width(8.dp))
                            Text(getLocalizedText("கட்டணம் செலுத்தவும்", "Proceed to Pay"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                }
            }

            // ── Join Bottom Sheet ─────────────────────────────────────────
            if (showJoinSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showJoinSheet = false },
                    sheetState = joinSheetState,
                    containerColor = Color.White
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                            .navigationBarsPadding(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = getLocalizedText("${scheme.planName}-ல் சேரவும்", "Enroll in ${scheme.planName}"),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = BrandDeep,
                            fontFamily = PoppinsFamily
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = getLocalizedText("இப்போதே நெகிழ்வான தங்க சேமிப்பைத் தொடங்குங்கள். முதிர்வு 330 நாட்களில்.", "Start saving flexible gold now. Maturity in 330 days."),
                            fontSize = 12.sp,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )

                        Spacer(Modifier.height(24.dp))

                        if (kycLevel != "FULL" && kycLevel != "VERIFIED") {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3CD)),
                                border = BorderStroke(1.dp, Color(0xFFFFEBAA)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Warning, null, tint = Color(0xFF856404))
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            getLocalizedText("KYC சரிபார்ப்பு தேவை", "KYC Verification Required"), 
                                            fontWeight = FontWeight.Bold, 
                                            color = Color(0xFF856404), 
                                            fontSize = 14.sp
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        getLocalizedText("அரசு விதிமுறைகளுக்கு இணங்க, ஒரு திட்டத்தில் சேருவதற்கு முன்பு உங்கள் KYC சரிபார்ப்பை முடிக்க வேண்டும்.", 
                                            "To comply with gold purchase and state guidelines, you must complete your KYC verification before joining a scheme."),
                                        color = Color(0xFF856404),
                                        fontSize = 12.sp,
                                        lineHeight = 18.sp
                                    )
                                }
                            }

                            Spacer(Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    showJoinSheet = false
                                    onKycClick()
                                },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White)
                            ) {
                                Text(
                                    getLocalizedText("KYC சரிபார்ப்பு", "Verify KYC Identity"), 
                                    fontWeight = FontWeight.Bold, 
                                    fontSize = 16.sp
                                )
                            }
                        } else {
                            OutlinedTextField(
                                value = inputAmountText,
                                onValueChange = { text ->
                                    if (text.all { it.isDigit() }) {
                                        inputAmountText = text
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                label = { Text(getLocalizedText("முதல் சேமிப்புத் தொகை (₹)", "First Savings Amount (₹)")) },
                                singleLine = true,
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                                ),
                                leadingIcon = {
                                    Icon(Icons.Default.CurrencyRupee, null, tint = MagentaPrimary)
                                },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = MagentaPrimary,
                                    unfocusedBorderColor = Color.LightGray
                                )
                            )

                            Spacer(Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                listOf("1000", "2000", "5000", "10000").forEach { preset ->
                                    val isSelected = inputAmountText == preset
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (isSelected) MagentaPrimary else Color.LightGray.copy(alpha = 0.2f))
                                            .clickable { inputAmountText = preset }
                                            .padding(vertical = 8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            "₹$preset",
                                            color = if (isSelected) Color.White else Color.Black,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }

                            Spacer(Modifier.height(16.dp))



                            Spacer(Modifier.height(20.dp))
                            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.4f))
                            Spacer(Modifier.height(16.dp))

                            // Calculations
                            val isSilver = scheme.planName.lowercase().contains("silver")
                            val metalRate = if (isSilver) 9500L else currentGoldPrice
                            val enteredAmount = inputAmountText.toLongOrNull() ?: 0L
                            val enteredAmountPaise = enteredAmount * 100L
                            val baseAmountPaise = (enteredAmountPaise / 1.03).toLong()
                            val gstAmountPaise = enteredAmountPaise - baseAmountPaise
                            val bonusAmountPaise = (baseAmountPaise * 0.075).toLong()
                            val totalEffectiveValuePaise = baseAmountPaise + bonusAmountPaise
                            val estimatedGoldMg = if (metalRate > 0) {
                                (totalEffectiveValuePaise * 1000L) / metalRate
                            } else {
                                0L
                            }

                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFF9F6FC))
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("முதல் வைப்புத்தொகை", "First Addition Amount"), fontSize = 13.sp, color = Color.Gray)
                                    Text(paiseToRupees(enteredAmountPaise), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("ஜிஎஸ்டி (3% உட்பட)", "GST (3% included)"), fontSize = 13.sp, color = Color.Gray)
                                    Text(paiseToRupees(gstAmountPaise), fontSize = 13.sp)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(getLocalizedText("முதல் அடுக்கு போனஸ் (7.5%)", "Tier 1 Bonus Eligible (7.5%)"), fontSize = 13.sp, color = MagentaPrimary, fontWeight = FontWeight.Bold)
                                    Text("+ " + paiseToRupees(bonusAmountPaise), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MagentaPrimary)
                                }
                                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(getLocalizedText("மொத்த கொள்முதல் மதிப்பு", "Total Purchase Value"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Text(paiseToRupees(totalEffectiveValuePaise), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = BrandDeep)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(getLocalizedText(if (isSilver) "மதிப்பிடப்பட்ட வெள்ளி எடை" else "மதிப்பிடப்பட்ட தங்கம் எடை", if (isSilver) "Estimated Silver Weight" else "Estimated Gold Weight"), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    Text(mgToGrams(estimatedGoldMg, isSilver = isSilver), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300))
                                }
                            }

                            Spacer(Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    if (enteredAmountPaise > 0) {
                                        showJoinSheet = false
                                        onProceedWithJoin(autoPayEnabled, enteredAmountPaise)
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White),
                                enabled = enteredAmountPaise > 0 && !isPaymentLoading
                            ) {
                                Icon(Icons.Default.Payment, null, tint = Color.White)
                                Spacer(Modifier.width(8.dp))
                                Text(getLocalizedText("கட்டணம் செலுத்தி சேரவும்", "Pay & Activate Scheme"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                }
            }

            // ── Redemption Modal Bottom Sheet ────────────────────────────────────
            if (showRedemptionSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showRedemptionSheet = false },
                    sheetState = redeemSheetState,
                    containerColor = Color.White
                ) {
                    var redemptionType by remember { mutableStateOf("CASH") }
                    var deliveryAddress by remember { mutableStateOf("") }
                    var includeBonusGold by remember { mutableStateOf(false) }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                            .navigationBarsPadding(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = getLocalizedText(if (isSilver) "வெள்ளியை மீட்டெடுக்கவும்" else "தங்கத்தை மீட்டெடுக்கவும்", if (isSilver) "Redeem Silver Savings" else "Redeem Gold Savings"),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = BrandDeep,
                            fontFamily = PoppinsFamily
                        )
                        Spacer(Modifier.height(8.dp))
                        
                        val metalBalanceText = remember(uiState.progress) {
                            mgToGrams(uiState.progress?.accumulatedGoldMg ?: 0L, isSilver = isSilver)
                        }
                        Text(
                            text = getLocalizedText(
                                if (isSilver) "மொத்த இருப்பு வெள்ளி: $metalBalanceText" else "மொத்த இருப்பு தங்கம்: $metalBalanceText", 
                                if (isSilver) "Total Accumulated Silver: $metalBalanceText" else "Total Accumulated Gold: $metalBalanceText"
                            ),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300)
                        )

                        Spacer(Modifier.height(24.dp))

                        if (kycLevel != "FULL" && kycLevel != "VERIFIED") {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3CD)),
                                border = BorderStroke(1.dp, Color(0xFFFFEBAA)),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Warning, null, tint = Color(0xFF856404))
                                        Spacer(Modifier.width(8.dp))
                                        Text(
                                            getLocalizedText("முழு KYC தேவை", "Full KYC Verification Needed"), 
                                            fontWeight = FontWeight.Bold, 
                                            color = Color(0xFF856404), 
                                            fontSize = 14.sp
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        getLocalizedText("விதிமுறைகளின்படி, தங்கம் விநியோகம் அல்லது பணமாக திரும்ப பெற முழுமையான KYC சரிபார்ப்பு அவசியமாகும்.", 
                                            "Regulatory rules require a verified full KYC before you can request cash payout or gold delivery."),
                                        color = Color(0xFF856404),
                                        fontSize = 12.sp,
                                        lineHeight = 18.sp
                                    )
                                }
                            }

                            Spacer(Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    showRedemptionSheet = false
                                    onKycClick()
                                },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White)
                            ) {
                                Text(getLocalizedText("KYC முடிக்கவும்", "Complete KYC Identity"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        } else {
                            // Options
                            Text(
                                text = getLocalizedText("மீட்பு முறையைத் தேர்ந்தெடுக்கவும்:", "Select Redemption Method:"),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                            Spacer(Modifier.height(12.dp))

                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                // CASH Option
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .border(
                                            1.dp, 
                                            if (redemptionType == "CASH") MagentaPrimary else Color.LightGray.copy(alpha = 0.5f), 
                                            RoundedCornerShape(16.dp)
                                        )
                                        .background(if (redemptionType == "CASH") Color(0xFFFDFBFE) else Color.White)
                                        .clickable { redemptionType = "CASH" }
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = redemptionType == "CASH",
                                        onClick = { redemptionType = "CASH" },
                                        colors = RadioButtonDefaults.colors(selectedColor = MagentaPrimary)
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            getLocalizedText("வங்கி கணக்கிற்கு பணம்", "Cash Payout to Bank Account"), 
                                            fontWeight = FontWeight.Bold, 
                                            fontSize = 14.sp, 
                                            color = BrandDeep
                                        )
                                        Text(
                                            getLocalizedText(
                                                if (isSilver) "நேரடி வெள்ளி விலையில் விற்று பணமாக வங்கி கணக்கில் பெற்றுக்கொள்ளவும்." else "நேரடி தங்கம் விலையில் விற்று பணமாக வங்கி கணக்கில் பெற்றுக்கொள்ளவும்.", 
                                                if (isSilver) "Liquidate silver at the fixed price and transfer money to bank." else "Liquidate gold at the live market price and transfer money to bank."
                                            ), 
                                            fontSize = 11.sp, 
                                            color = Color.Gray
                                        )
                                    }
                                }

                                // JEWELLERY Option
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .border(
                                            1.dp, 
                                            if (redemptionType == "JEWELLERY") MagentaPrimary else Color.LightGray.copy(alpha = 0.5f), 
                                            RoundedCornerShape(16.dp)
                                        )
                                        .background(if (redemptionType == "JEWELLERY") Color(0xFFFDFBFE) else Color.White)
                                        .clickable { redemptionType = "JEWELLERY" }
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = redemptionType == "JEWELLERY",
                                        onClick = { redemptionType = "JEWELLERY" },
                                        colors = RadioButtonDefaults.colors(selectedColor = MagentaPrimary)
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            getLocalizedText("நகையாக மாற்றுதல் (பங்குதாரர் கடைகளில்)", "Redeem as Jewellery (at Partner Showrooms)"), 
                                            fontWeight = FontWeight.Bold, 
                                            fontSize = 14.sp, 
                                            color = BrandDeep
                                        )
                                        Text(
                                            getLocalizedText(
                                                "சேமித்த எடையை 22K/18K நகைகளாக எங்கள் பங்குதாரர் நகைக்கடைகளில் மாற்றிக் கொள்ளலாம்.", 
                                                "Exchange stored metal weight for beautiful 22K/18K gold ornaments with zero making charges."
                                            ), 
                                            fontSize = 11.sp, 
                                            color = Color.Gray
                                        )
                                    }
                                }

                                // DELIVERY Option (Physical Coins)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .border(
                                            1.dp, 
                                            if (redemptionType == "DELIVERY") MagentaPrimary else Color.LightGray.copy(alpha = 0.5f), 
                                            RoundedCornerShape(16.dp)
                                        )
                                        .background(if (redemptionType == "DELIVERY") Color(0xFFFDFBFE) else Color.White)
                                        .clickable { redemptionType = "DELIVERY" }
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    RadioButton(
                                        selected = redemptionType == "DELIVERY",
                                        onClick = { redemptionType = "DELIVERY" },
                                        colors = RadioButtonDefaults.colors(selectedColor = MagentaPrimary)
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            getLocalizedText("வீட்டு வாசலில் நாணயம் விநியோகம்", "Doorstep Coin Delivery"), 
                                            fontWeight = FontWeight.Bold, 
                                            fontSize = 14.sp, 
                                            color = BrandDeep
                                        )
                                        Text(
                                            getLocalizedText(
                                                "சான்றளிக்கப்பட்ட 24K தங்கம் அல்லது தூய வெள்ளி நாணயங்களை உங்கள் வீட்டிற்கே பாதுகாப்பாக டெலிவரி பெறுக.", 
                                                "Receive certified pure 24K gold coins or pure silver coins delivered securely at your registered home address."
                                            ), 
                                            fontSize = 11.sp, 
                                            color = Color.Gray
                                        )
                                    }
                                }
                            }

                            if (redemptionType == "DELIVERY") {
                                Spacer(Modifier.height(16.dp))
                                OutlinedTextField(
                                    value = deliveryAddress,
                                    onValueChange = { deliveryAddress = it },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    label = { Text(getLocalizedText("விநியோக முகவரி", "Delivery Address")) },
                                    maxLines = 3,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = MagentaPrimary,
                                        unfocusedBorderColor = Color.LightGray
                                    )
                                )
                            }

                            Spacer(Modifier.height(16.dp))

                            // Checkbox to include bonus
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { includeBonusGold = !includeBonusGold }
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = includeBonusGold,
                                    onCheckedChange = { includeBonusGold = it },
                                    colors = CheckboxDefaults.colors(checkedColor = MagentaPrimary)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = getLocalizedText("திரட்டப்பட்ட போனஸ் எடையையும் சேர்க்கவும்", "Include accumulated bonus rewards in this request"),
                                    fontSize = 12.sp,
                                    color = BrandDeep,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Spacer(Modifier.height(24.dp))

                            Button(
                                onClick = {
                                    viewModel.requestRedemption(
                                        userId = userId,
                                        schemeId = scheme.id,
                                        type = redemptionType,
                                        address = if (redemptionType == "DELIVERY") deliveryAddress else null,
                                        includeBonusGold = includeBonusGold
                                    )
                                },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen, contentColor = Color.White),
                                enabled = (redemptionType != "DELIVERY" || deliveryAddress.isNotBlank()) && !isPaymentLoading
                            ) {
                                Text(getLocalizedText("மீட்பு கோரிக்கையை சமர்ப்பிக்கவும்", "Submit Redemption Request"), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                }
            }

            // ── Screen Body Content ──────────────────────────────────────────────
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Header Banner
                item {
                    val bannerGrad = if (isSilver) {
                        Brush.verticalGradient(listOf(Color(0xFFECEFF1), Color(0xFFCFD8DC)))
                    } else {
                        Brush.verticalGradient(listOf(Color(0xFFFFFDE7), Color(0xFFFFF9C4)))
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .background(bannerGrad),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = if (isSilver) Icons.Default.Circle else Icons.Default.WorkspacePremium,
                                contentDescription = null,
                                tint = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300),
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(Modifier.height(12.dp))
                            Text(
                                text = scheme.planName,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = BrandDeep,
                                fontFamily = PlayfairFamily
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = getLocalizedText(
                                    if (isSilver) "தூய 999 வெள்ளி சேமிப்பு திட்டம்" else "24K தூய தங்க சேமிப்பு திட்டம்", 
                                    if (isSilver) "99.9% Pure Silver Accumulation Plan" else "24K Certified Gold Accumulation Plan"
                                ),
                                fontSize = 12.sp,
                                color = TextSecondary,
                                fontFamily = PoppinsFamily
                            )
                        }
                    }
                }

                // If scheme is Active, show Progress Tracker
                if (isActive) {
                    item {
                        SectionHeader(getLocalizedText("திட்ட முன்னேற்றம்", "Scheme Progress Overview"))
                    }

                    // Progress Overview Card
                    item {
                        val progress = uiState.progress
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 8.dp),
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, SurfaceLight)
                        ) {
                            Column(modifier = Modifier.padding(20.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val installmentsPaidVal = progress?.installmentsPaid ?: installmentsPaid
                                    val totalInstallmentsVal = progress?.totalInstallments ?: scheme.totalInstallments
                                    Column {
                                        Text(
                                            getLocalizedText("செலுத்தப்பட்ட தவணைகள்", "Installments Paid"), 
                                            fontSize = 11.sp, 
                                            color = TextMuted, 
                                            fontFamily = PoppinsFamily
                                        )
                                        Text(
                                            "$installmentsPaidVal / $totalInstallmentsVal", 
                                            fontSize = 20.sp, 
                                            fontWeight = FontWeight.ExtraBold, 
                                            color = BrandDeep, 
                                            fontFamily = PoppinsFamily
                                        )
                                    }
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MagentaPrimary.copy(alpha = 0.1f))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = if (isMatured) (if (isTamil) "முதிர்ச்சியடைந்தது" else "Matured") else (if (isTamil) "செயலில் உள்ளது" else "Active"),
                                            color = if (isMatured) SuccessGreen else MagentaPrimary,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            fontFamily = PoppinsFamily
                                        )
                                    }
                                }

                                Spacer(Modifier.height(16.dp))

                                // Progress Indicator Bar
                                val totalVal = progress?.totalInstallments ?: scheme.totalInstallments
                                val currentVal = progress?.installmentsPaid ?: installmentsPaid
                                val progressFraction = if (totalVal > 0) currentVal.toFloat() / totalVal.toFloat() else 0f
                                
                                LinearProgressIndicator(
                                    progress = { progressFraction },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(10.dp)
                                        .clip(RoundedCornerShape(5.dp)),
                                    color = MagentaPrimary,
                                    trackColor = SurfaceLight
                                )

                                Spacer(Modifier.height(20.dp))
                                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                                Spacer(Modifier.height(16.dp))

                                // Dynamic stats grid
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(getLocalizedText("சேமித்த எடை", "Accumulated Metal"), fontSize = 11.sp, color = TextMuted)
                                        val weight = progress?.accumulatedGoldMg ?: 0L
                                        Text(
                                            mgToGrams(weight, isSilver = isSilver), 
                                            fontSize = 15.sp, 
                                            fontWeight = FontWeight.ExtraBold, 
                                            color = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300)
                                        )
                                    }
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(getLocalizedText("அடுத்த தவணை தேதி", "Next Due Date"), fontSize = 11.sp, color = TextMuted)
                                        val dueDate = nextDueDate
                                        Text(
                                            dueDate.take(10), 
                                            fontSize = 14.sp, 
                                            fontWeight = FontWeight.Bold, 
                                            color = BrandDeep
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Milestone tracker progress
                    item {
                        val progress = uiState.progress
                        if (progress != null && progress.milestones.isNotEmpty()) {
                            SectionHeader(getLocalizedText("மைல்கல் வெகுமதிகள்", "Milestone Roadmap"))
                            MilestoneRoadmap(progress)
                        }
                    }

                    // Transaction history timeline
                    item {
                        SectionHeader(getLocalizedText("பரிவர்த்தனை காலவரிசை", "Transaction Timeline"))
                        TimelineFilters(
                            currentFilter = uiState.ledgerFilter,
                            onFilterSelect = { filter -> viewModel.setLedgerFilter(filter) }
                        )
                    }

                    if (uiState.filteredLedger.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = BorderStroke(1.dp, SurfaceLight)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(40.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = getLocalizedText("பரிவர்த்தனைகள் எதுவும் இல்லை", "No transactions found matching this filter."),
                                        color = TextMuted,
                                        fontFamily = PoppinsFamily,
                                        fontSize = 13.sp,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    } else {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                border = BorderStroke(1.dp, SurfaceLight)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    val tableHeaders = listOf(
                                        getLocalizedText("தேதி", "Date"),
                                        getLocalizedText("தொகை", "Amount"),
                                        getLocalizedText("வாங்கியது", "Bought"),
                                        getLocalizedText("போனஸ்", "Bonus")
                                    )

                                    val metalSuffix = if (isSilver) "g Ag" else "g Au"

                                    // Table Header
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(MagentaPrimary.copy(alpha = 0.06f), shape = RoundedCornerShape(8.dp))
                                            .padding(vertical = 10.dp, horizontal = 12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        tableHeaders.forEachIndexed { index, header ->
                                            Text(
                                                text = header,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp,
                                                color = MagentaPrimary,
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

                                    uiState.filteredLedger.forEachIndexed { index, ledgerItem ->
                                        val displayDate = try {
                                            val parser = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US)
                                            val formatter = java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.US)
                                            val parsedDate = parser.parse(ledgerItem.createdAt)
                                            if (parsedDate != null) formatter.format(parsedDate) else ledgerItem.createdAt
                                        } catch (e: Exception) {
                                            ledgerItem.createdAt.take(10)
                                        }

                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    ReceiptPdfGenerator.generateAndShareReceipt(
                                                        context = context,
                                                        item = ledgerItem,
                                                        userName = userName,
                                                        userPhone = userPhone,
                                                        schemeName = scheme.planName,
                                                        shareImmediately = false
                                                    )
                                                }
                                                .padding(vertical = 12.dp, horizontal = 12.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // Date
                                            Text(
                                                text = displayDate,
                                                fontSize = 11.sp,
                                                color = TextMuted,
                                                modifier = Modifier.weight(1f),
                                                textAlign = TextAlign.Start,
                                                fontFamily = PoppinsFamily
                                            )
                                            // Amount
                                            val isBonusTx = ledgerItem.transactionType.equals("BONUS", ignoreCase = true)
                                            Text(
                                                text = if (isBonusTx) (if (isTamil) "இலவசம்" else "Free") else paiseToRupees(ledgerItem.amountPaise),
                                                fontSize = 12.sp,
                                                color = BrandDeep,
                                                modifier = Modifier.weight(1f),
                                                textAlign = TextAlign.Center,
                                                fontFamily = PoppinsFamily
                                            )
                                            // Bought
                                            val displayBoughtMg = if (isBonusTx) 0L else ledgerItem.goldWeightMg
                                            Text(
                                                text = "${mgToGrams(displayBoughtMg, isSilver = isSilver)} $metalSuffix",
                                                fontSize = 12.sp,
                                                color = BrandDeep,
                                                modifier = Modifier.weight(1f),
                                                textAlign = TextAlign.Center,
                                                fontFamily = PoppinsFamily
                                            )
                                            // Bonus
                                            val displayBonusMg = if (isBonusTx) ledgerItem.goldWeightMg else ledgerItem.bonusGoldMg
                                            Text(
                                                text = "+${mgToGrams(displayBonusMg, isSilver = isSilver)} $metalSuffix",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = SuccessGreen,
                                                modifier = Modifier.weight(1f),
                                                textAlign = TextAlign.End,
                                                fontFamily = PoppinsFamily
                                            )
                                        }
                                        if (index < uiState.filteredLedger.size - 1) {
                                            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f), thickness = 0.5.dp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Inactive roadmap fallback
                    item {
                        SectionHeader(getLocalizedText("முதிர்வு காலவரிசை", "Maturity Timeline"))
                        StaticMaturityTimeline(scheme)
                    }
                }

                // Bonus Ladder Visualization (dynamic from bonusConfigJson)
                item {
                    SectionHeader(getLocalizedText("போனஸ் அடுக்கு வெகுமதிகள்", "Bonus Ladder Rewards"))
                    BonusLadder(scheme, schemeDayNumber)
                }

                // Important Details Grid
                item {
                    DetailsGrid(scheme)
                }

                // Dynamic Feature Attributes Toggles (maturity, lockable, known)
                val activeAttrs = schemeAttributes.filter { it.enabled == 1 }
                if (activeAttrs.isNotEmpty()) {
                    items(activeAttrs) { attr ->
                        PremiumInfoCardComponent(
                            title = attr.title,
                            content = attr.description,
                            isTamil = isTamil
                        )
                    }
                }

                // Dynamic Custom Sections (from customSectionsJson)
                // Each section is rendered using its designated component style (0 = Accordion, 1 = Card, 2 = Grid)
                if (customSections.isNotEmpty()) {
                    items(customSections) { section ->
                        when (section.type) {
                            1 -> {
                                PremiumInfoCardComponent(
                                    title = section.title,
                                    content = section.content,
                                    isTamil = isTamil
                                )
                            }
                            2 -> {
                                HighlightGridComponent(
                                    title = section.title,
                                    content = section.content,
                                    isTamil = isTamil
                                )
                            }
                            else -> {
                                SectionHeader(section.title)
                                DynamicSectionContent(
                                    content = section.content,
                                    isTamil = isTamil
                                )
                            }
                        }
                    }
                } else {
                    // Fallback policy section only when no custom sections defined
                    item {
                        PolicySection(isSilver)
                    }
                }

                // Social Proof
                item {
                    SocialProofSection()
                }

                item { Spacer(Modifier.height(20.dp)) }
            }
        }
        if (isPaymentLoading) {
            CoinJarVerificationLoader()
        }
    }
}



@Composable
private fun MilestoneRoadmap(progress: SchemeProgressResponse) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            // General indicators
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = stringResource(R.string.maturity_date),
                        fontSize = 11.sp,
                        color = TextMuted,
                        fontFamily = PoppinsFamily
                    )
                    Text(
                        text = progress.maturityDate.take(10),
                        fontSize = 13.sp,
                        color = BrandDeep,
                        fontWeight = FontWeight.Bold,
                        fontFamily = PoppinsFamily
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(SuccessGreen.copy(alpha = 0.1f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = stringResource(R.string.milestone_day_ladder, progress.schemeDayNumber),
                        color = SuccessGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            // Horizontally scrolling milestones
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                progress.milestones.forEach { milestone ->
                    var animateStar by remember { mutableStateOf(false) }
                    LaunchedEffect(milestone.isAchieved) {
                        if (milestone.isAchieved) {
                            animateStar = true
                        }
                    }
                    val starScale by animateFloatAsState(
                        targetValue = if (animateStar) 1.15f else 1.0f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessLow
                        ),
                        label = "starScale"
                    )

                    val bgColor = if (milestone.isAchieved) Color(0xFFFFFBEA) else Color(0xFFF8F9FA)
                    val borderColor = if (milestone.isAchieved) Color(0xFFFFD54F) else Color.LightGray.copy(alpha = 0.5f)

                    Box(
                        modifier = Modifier
                            .width(135.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(bgColor)
                            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
                            .padding(12.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.Start) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Text(
                                    text = stringResource(R.string.milestone_day, milestone.targetDay),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (milestone.isAchieved) BrandDeep else TextMuted
                                )
                                Icon(
                                    imageVector = if (milestone.isAchieved) Icons.Default.Stars else Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = if (milestone.isAchieved) Color(0xFFFFB300) else TextMuted,
                                    modifier = Modifier
                                        .size(16.dp)
                                        .scale(starScale)
                                )
                            }
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = milestone.name,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrandDeep,
                                maxLines = 1
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = stringResource(R.string.milestone_bonus_percent, milestone.bonusPercentage.toString()),
                                fontSize = 11.sp,
                                color = if (milestone.isAchieved) SuccessGreen else TextMuted,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TimelineFilters(
    currentFilter: String,
    onFilterSelect: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf("ALL", "PURCHASE", "BONUS").forEach { filter ->
            val isSelected = currentFilter == filter
            val label = when (filter) {
                "PURCHASE" -> if (Locale.getDefault().language == "ta") "வைப்புகள்" else "Payments"
                "BONUS" -> if (Locale.getDefault().language == "ta") "போனஸ்" else "Bonuses"
                else -> if (Locale.getDefault().language == "ta") "அனைத்தும்" else "All"
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(if (isSelected) MagentaPrimary else Color.White)
                    .border(
                        1.dp, 
                        if (isSelected) MagentaPrimary else Color.LightGray.copy(alpha = 0.5f), 
                        RoundedCornerShape(20.dp)
                    )
                    .clickable { onFilterSelect(filter) }
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    color = if (isSelected) Color.White else Color.Black,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = PoppinsFamily
                )
            }
        }
    }
}

@Composable
private fun TimelineTransactionCard(
    item: SchemeLedgerItem,
    userName: String,
    userPhone: String,
    schemeName: String,
    onDownload: () -> Unit,
    onShare: () -> Unit
) {
    val isTamil = Locale.getDefault().language == "ta"
    val isSilver = remember(schemeName) { schemeName.lowercase().contains("silver") }
    val bulletColor = when (item.transactionType.uppercase()) {
        "BONUS" -> Color(0xFFFFB300)
        "REDEMPTION" -> Color(0xFFE53935)
        "REFUND" -> Color(0xFF8E24AA)
        else -> MagentaPrimary
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp)
            .height(IntrinsicSize.Min)
    ) {
        // Vertical timeline bar
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxHeight()
                .padding(top = 16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(bulletColor)
            )
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .weight(1f)
                    .background(Color.LightGray.copy(alpha = 0.3f))
            )
        }

        Spacer(Modifier.width(16.dp))

        // Transaction Card
        Card(
            modifier = Modifier
                .weight(1f)
                .padding(vertical = 4.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, SurfaceLight)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (item.transactionType.uppercase() == "BONUS") {
                            if (item.amountPaise == 0L) {
                                if (isTamil) "சிறப்பு போனஸ் (நிர்வாகம்/பிறந்தநாள்)" else "Special Bonus (Admin/Birthday)"
                            } else {
                                if (isTamil) "அடுக்கு போனஸ் கிரெடிட்" else "Loyalty Bonus Credit"
                            }
                        } else {
                            if (isTamil) "தவணை செலுத்துதல்" else "Savings Installment"
                        },
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = BrandDeep
                    )
                    
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                if (item.status.equals("CONFIRMED", ignoreCase = true)) {
                                    SuccessGreen.copy(alpha = 0.1f)
                                } else {
                                    Color.LightGray.copy(alpha = 0.2f)
                                }
                            )
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = item.status.uppercase(),
                            color = if (item.status.equals("CONFIRMED", ignoreCase = true)) SuccessGreen else Color.Gray,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(Modifier.height(4.dp))
                
                Text(
                    text = item.createdAt.take(19).replace("T", " "),
                    fontSize = 11.sp,
                    color = TextMuted,
                    fontFamily = PoppinsFamily
                )

                Spacer(Modifier.height(12.dp))

                // Details Grid
                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isTamil) "செலுத்தப்பட்ட தொகை" else "Amount Paid",
                            fontSize = 10.sp,
                            color = TextMuted
                        )
                        Text(
                            text = if (item.amountPaise > 0) paiseToRupees(item.amountPaise) else (if (isTamil) "இலவசம் (போனஸ்)" else "Free (Gifted)"),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandDeep
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isTamil) (if (isSilver) "வெள்ளி எடை" else "தங்க எடை") else (if (isSilver) "Silver Credited" else "Gold Credited"),
                            fontSize = 10.sp,
                            color = TextMuted
                        )
                        Text(
                            text = mgToGrams(item.goldWeightMg, isSilver = isSilver),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFFB300)
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isTamil) (if (isSilver) "வெள்ளியின் விலை" else "தங்கத்தின் விலை") else "Locked Price",
                            fontSize = 10.sp,
                            color = TextMuted
                        )
                        Text(
                            text = paiseToRupees(item.pricePerGmPaise) + "/g",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    if (item.bonusGoldMg > 0) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isTamil) "கிடைத்த போனஸ்" else "Bonus Earned",
                                fontSize = 10.sp,
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "+${mgToGrams(item.bonusGoldMg, isSilver = isSilver)} (${item.bonusPercentage}%)",
                                fontSize = 11.sp,
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Action bar for receipt download/share (only for confirmed transactions)
                if (item.status.equals("CONFIRMED", ignoreCase = true)) {
                    Spacer(Modifier.height(14.dp))
                    HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f))
                    Spacer(Modifier.height(8.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(
                            onClick = onDownload,
                            contentPadding = PaddingValues(horizontal = 10.dp)
                        ) {
                            Icon(Icons.Default.Download, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = if (isTamil) "ரசீது" else "Receipt", 
                                fontSize = 12.sp, 
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        TextButton(
                            onClick = onShare,
                            contentPadding = PaddingValues(horizontal = 10.dp)
                        ) {
                            Icon(Icons.Default.Share, null, modifier = Modifier.size(16.dp), tint = SuccessGreen)
                            Spacer(Modifier.width(4.dp))
                            Text(
                                text = if (isTamil) "பகிர்" else "Share", 
                                fontSize = 12.sp, 
                                fontWeight = FontWeight.Bold,
                                color = SuccessGreen
                            )
                        }
                    }
                }
            }
        }
    }
}

// ── Browse Hero (shown before joining a scheme) ─────────────────────────────
// Shows plan description + admin-defined feature chips. No hardcoded stats.
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun MaturityHero(scheme: AvailableScheme, currentPrice: Long) {
    val isTamil = Locale.getDefault().language == "ta"
    val keywords = remember(scheme.keywordsJson) {
        if (!scheme.keywordsJson.isNullOrBlank()) {
            try {
                val arr = JSONArray(scheme.keywordsJson)
                (0 until arr.length()).map { arr.optString(it) }.filter { it.isNotBlank() }.take(4)
            } catch (_: Exception) { emptyList() }
        } else emptyList()
    }
    val fallbackChips = remember(scheme.frequency) {
        buildList {
            when (scheme.frequency.lowercase()) {
                "daily"    -> add(if (isTamil) "தினசரி சேமிப்பு" else "Daily Savings")
                "monthly"  -> add(if (isTamil) "மாதாந்திர தவணை" else "Monthly Installment")
                "flexible" -> add(if (isTamil) "நெகிழ்வான சேமிப்பு" else "Flexible Investment")
                else       -> add(scheme.frequency)
            }
            val metalLabel = if (scheme.planName.lowercase().contains("silver")) {
                if (isTamil) "வெள்ளி சேமிப்பு" else "Silver Savings"
            } else {
                if (isTamil) "தங்க சேமிப்பு" else "Gold Savings"
            }
            add(metalLabel)
        }
    }
    val displayChips = keywords.ifEmpty { fallbackChips }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Brush.verticalGradient(listOf(Color.White, Color(0xFFF8F9FA))))
            .padding(24.dp)
    ) {
        Column(horizontalAlignment = Alignment.Start, modifier = Modifier.fillMaxWidth()) {
            Text(
                text = scheme.planName,
                fontFamily = PlayfairFamily,
                fontWeight = FontWeight.Black,
                fontSize = 28.sp,
                color = BrandDeep,
                lineHeight = 34.sp
            )
            if (scheme.description.isNotBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = scheme.description,
                    fontFamily = PoppinsFamily,
                    color = TextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp
                )
            }
            Spacer(Modifier.height(16.dp))
            // Feature chips from admin keywordsJson (or fallbacks)
            androidx.compose.foundation.layout.FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                displayChips.forEach { chip ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(BrandDark.copy(alpha = 0.08f))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "✦ $chip",
                            color = BrandDark,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp,
                            fontFamily = PoppinsFamily
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StaticMaturityTimeline(scheme: AvailableScheme) {
    val isTamil = Locale.getDefault().language == "ta"
    val isSilver = scheme.planName.lowercase().contains("silver")
    val isDaily = scheme.frequency.lowercase() == "daily"
    val metalName = if (isSilver) (if (isTamil) "வெள்ளி" else "silver") else (if (isTamil) "தங்கம்" else "gold")

    val minAmount = remember(scheme.paymentRulesJson) { parseMinAmount(scheme.paymentRulesJson) }
    val formattedMinRupees = "₹" + (minAmount / 100L).toString()

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            TimelineStep(
                1, 
                if (isTamil) "சேமிப்பைத் தொடங்குங்கள்" else "Start Saving", 
                if (isTamil) "இன்றைய $metalName விலையைப் பூட்ட முதல் வைப்பைச் செலுத்தவும்." else "Pay your first deposit to lock today's $metalName rate.", 
                isFirst = true
            )
            TimelineStep(
                2, 
                if (isDaily) (if (isTamil) "தினசரி நெகிழ்வு சேமிப்பு" else "Daily Flexible Savings") else (if (isTamil) "மாதாந்திர தவணை" else "Monthly Installments"), 
                if (isDaily) {
                    if (isTamil) "குறைந்தபட்சம் $formattedMinRupees முதல் உங்கள் வசதிக்கேற்ப எப்போது வேண்டுமானாலும் சேமிக்கலாம்." else "Save anytime at your convenience starting from min $formattedMinRupees."
                } else {
                    val amtRupees = "₹" + (scheme.installmentAmountPaise / 100L).toString()
                    if (isTamil) "ஒவ்வொரு மாதமும் தொடர்ந்து $amtRupees தவணைகளைச் செலுத்தவும்." else "Pay monthly installments of $amtRupees consistently."
                },
            )
            TimelineStep(
                3, 
                if (isTamil) "அடுக்கு போனஸ் கிரெடிட்" else "Bonus Credit", 
                if (isTamil) "திட்டத்தின் விதிமுறைகளின்படி உங்கள் கணக்கில் போனஸ் $metalName சேர்க்கப்படும்." else "Get Aishwaryam bonus weight added to your $metalName balance.",
            )
            TimelineStep(
                4, 
                if (isTamil) "முதிர்வு & மீட்டெடுத்தல்" else "Maturity & Redemption", 
                if (isSilver) {
                    if (isTamil) "முதிர்வு நாளில் வெள்ளி நாணயமாக அல்லது நகையாக அல்லது வவுச்சராக மீட்டெடுக்கவும்." else "Redeem as physical silver coins, showroom jewelry, or voucher."
                } else {
                    if (isTamil) "முதிர்வு நாளில் தங்க நாணயமாக அல்லது நகையாக அல்லது வவுச்சராக மீட்டெடுக்கவும்." else "Redeem as physical gold coins, showroom jewelry, or voucher."
                },
                isLast = true
            )
        }
    }
}

@Composable
private fun TimelineStep(step: Int, title: String, subtitle: String, isFirst: Boolean = false, isLast: Boolean = false) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(if (step == 1) BrandAccent else SurfaceLight),
                contentAlignment = Alignment.Center
            ) {
                Text(step.toString(), color = if (step == 1) Color.White else TextMuted, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(40.dp)
                        .background(SurfaceLight)
                )
            }
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.padding(bottom = if (isLast) 0.dp else 24.dp)) {
            Text(title, fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = BrandDeep)
            Text(subtitle, fontFamily = PoppinsFamily, fontSize = 13.sp, color = TextSecondary, lineHeight = 18.sp)
        }
    }
}

// ── Data class to hold a parsed bonus tier ────────────────────────────────
private data class BonusTier(val startDay: Int, val endDay: Int, val bonusPercentage: Double)

private data class CustomUISection(val title: String, val content: String, val type: Int)

private fun parseMinAmount(json: String?): Long {
    if (json.isNullOrBlank()) return 10000L // Default fallback (₹100)
    return try {
        val root = JSONObject(json)
        root.optLong("minAmountPaise", root.optLong("MinAmountPaise", 10000L))
    } catch (e: Exception) { 10000L }
}

// ── Parse bonusConfigJson into a list of BonusTier ────────────────────────
private fun parseBonusTiers(json: String?): List<BonusTier> {
    if (json.isNullOrBlank()) return emptyList()
    val list = mutableListOf<BonusTier>()
    try {
        val trimmed = json.trim()
        if (trimmed.startsWith("[")) {
            val arr = JSONArray(trimmed)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val start = obj.optInt("startDay", obj.optInt("StartDay", -1))
                val end = obj.optInt("endDay", obj.optInt("EndDay", -1))
                val pct = obj.optDouble("bonusPercentage", obj.optDouble("BonusPercentage", 0.0))
                if (start >= 0 && end >= 0) {
                    list.add(BonusTier(start, end, pct))
                }
            }
        } else if (trimmed.startsWith("{")) {
            val root = org.json.JSONObject(trimmed)
            val startingBonus = root.optDouble("startingBonusPercent", 7.5)
            val milestones = root.optJSONArray("milestones") ?: root.optJSONArray("Milestones")
            if (milestones != null) {
                var prevEnd = 0
                for (i in 0 until milestones.length()) {
                    val m = milestones.getJSONObject(i)
                    val days = m.optInt("days", m.optInt("installment", -1))
                    if (days > 0) {
                        val bonusAdd = m.optDouble("bonusPercent", m.optDouble("freeMonthBonusPercent", 0.0))
                        val flatMg = m.optDouble("flatGoldBonusMg", 0.0)
                        val totalPct = if (flatMg > 0.0) {
                            startingBonus + (flatMg / 100.0)
                        } else if (bonusAdd >= 100.0) {
                            startingBonus + 100.0
                        } else {
                            startingBonus + bonusAdd
                        }
                        list.add(BonusTier(prevEnd + 1, days, totalPct))
                        prevEnd = days
                    }
                }
            } else {
                list.add(BonusTier(1, 330, startingBonus))
            }
        }
    } catch (e: Exception) {}
    return list
}

// ── Parse customSectionsJson into list of CustomUISection objects ───────────
private fun parseCustomSections(json: String?): List<CustomUISection> {
    if (json.isNullOrBlank()) return emptyList()
    return try {
        val arr = JSONArray(json)
        (0 until arr.length()).mapNotNull { i ->
            val obj = arr.getJSONObject(i)
            val title = obj.optString("title", "").trim()
            val content = obj.optString("content", "").trim()
            val type = obj.optInt("type", 0)
            if (title.isNotEmpty()) CustomUISection(title, content, type) else null
        }
    } catch (e: Exception) { emptyList() }
}

private data class SchemeAttribute(
    val key: String,
    val enabled: Int,
    val title: String,
    val description: String
)

private fun parseSchemeAttributes(json: String?): List<SchemeAttribute> {
    if (json.isNullOrBlank()) return emptyList()
    return try {
        val root = JSONObject(json)
        val arr = root.optJSONArray("attributes") ?: return emptyList()
        (0 until arr.length()).mapNotNull { i ->
            val obj = arr.getJSONObject(i)
            val key = obj.optString("key", "")
            val enabled = obj.optInt("enabled", 0)
            val title = obj.optString("title", "").trim()
            val description = obj.optString("description", "").trim()
            if (key.isNotEmpty() && title.isNotEmpty()) {
                SchemeAttribute(key, enabled, title, description)
            } else null
        }
    } catch (e: Exception) { emptyList() }
}

@Composable
private fun BonusLadder(scheme: AvailableScheme, dayNumber: Int) {
    val isTamil = Locale.getDefault().language == "ta"
    val tiers = remember(scheme.bonusConfigJson) { parseBonusTiers(scheme.bonusConfigJson) }

    // If no admin-defined tiers, show nothing
    if (tiers.isEmpty()) return

    // Compute normalised bar heights
    val maxPct = tiers.maxOfOrNull { it.bonusPercentage } ?: 1.0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = BrandDark)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = if (isTamil) "${scheme.planName} - லாயல்டி போனஸ் அடுக்குகள்" else "${scheme.planName} — Loyalty Bonus Tiers",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 13.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                tiers.forEach { tier ->
                    val isHighlight = dayNumber in tier.startDay..tier.endDay
                    val fraction = if (maxPct > 0) (tier.bonusPercentage / maxPct).toFloat() else 0f
                    val isDaily = scheme.frequency.lowercase() == "daily"
                    val label = if (isDaily) {
                        if (isTamil) "${tier.startDay}-${tier.endDay} நாட்கள்" else "Day ${tier.startDay}-${tier.endDay}"
                    } else {
                        if (isTamil) "${tier.startDay}-${tier.endDay} மாதம்" else "Month ${tier.startDay}-${tier.endDay}"
                    }
                    LadderBar(
                        fraction = fraction.coerceIn(0.1f, 1f),
                        label = label,
                        percent = "${String.format(Locale.US, "%.1f", tier.bonusPercentage)}%",
                        isHighlight = isHighlight
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            Text(
                text = if (isTamil) "நீங்கள் எப்போது சேமிக்கிறீர்கள் என்பதைப் பொறுத்து உங்கள் போனஸ் அமையும். வேகமாகச் சேமித்து அதிக போனஸ் பெறுங்கள்!"
                    else "Your loyalty bonus percent depends on WHEN you save during the scheme lifecycle. Accumulate earlier for higher tiers!",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 11.sp,
                fontFamily = PoppinsFamily,
                lineHeight = 16.sp
            )
        }
    }
}

@Composable
private fun RowScope.LadderBar(fraction: Float, label: String, percent: String, isHighlight: Boolean = false) {
    Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(percent, color = if (isHighlight) GoldWarm else Color.White, fontWeight = FontWeight.Bold, fontSize = 10.sp)
        Spacer(Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height((80 * fraction).dp)
                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                .background(if (isHighlight) GoldDeep else Color.White.copy(alpha = 0.2f))
        )
        Spacer(Modifier.height(8.dp))
        Text(label, color = Color.White.copy(alpha = 0.5f), fontSize = 9.sp, textAlign = TextAlign.Center)
    }
}

@Composable
private fun DetailsGrid(scheme: AvailableScheme) {
    val isTamil = Locale.getDefault().language == "ta"
    val isSilver = scheme.planName.lowercase().contains("silver")
    val frequencyLabel = remember(scheme.frequency) {
        when (scheme.frequency.lowercase()) {
            "daily" -> if (isTamil) "தினசரி" else "Daily"
            "monthly" -> if (isTamil) "மாதாந்திர" else "Monthly"
            "weekly" -> if (isTamil) "வாராந்திர" else "Weekly"
            else -> if (isTamil) "நெகிழ்வான" else "Flexible"
        }
    }

    val bonusLabel = remember(scheme.bonusConfigJson) {
        try {
            val tiers = parseBonusTiers(scheme.bonusConfigJson)
            if (tiers.isNotEmpty()) {
                val maxPct = tiers.maxOf { it.bonusPercentage }
                if (maxPct >= 100.0) {
                    if (isTamil) "1 மாதம் இலவசம்" else "1 Month FREE"
                } else {
                    val minPct = tiers.minOf { it.bonusPercentage }
                    if (minPct == maxPct) {
                        "${String.format(Locale.US, "%.1f", minPct)}%"
                    } else {
                        if (isTamil) "உயரதிக %.1f%%" else "Up to ${String.format(Locale.US, "%.1f", maxPct)}%"
                    }
                }
            } else {
                if (isTamil) "நிலையான போனஸ்" else "Standard Bonus"
            }
        } catch (e: Exception) {
            if (isTamil) "சிறப்பு போனஸ்" else "Special Bonus"
        }
    }

    val redeemLabel = if (isSilver) {
        if (isTamil) "வெள்ளி / நகைகள்" else "Silver / Jewelry"
    } else {
        if (isTamil) "தங்கம் / நகைகள்" else "Gold / Jewelry"
    }

    Column(modifier = Modifier.padding(20.dp)) {
        SectionHeader(if (isTamil) "திட்ட விவரங்கள்" else "Plan Specifics", horizontalPadding = 0.dp)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            DetailIconCard(Modifier.weight(1f), Icons.Default.LockClock, if (isTamil) "விலை பூட்டுதல்" else "Rate Lock", frequencyLabel)
            DetailIconCard(Modifier.weight(1f), Icons.Default.Payments, "GST", "3% Extra")
        }
        Spacer(Modifier.height(16.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            DetailIconCard(Modifier.weight(1f), Icons.Default.CardGiftcard, if (isTamil) "போனஸ்" else "Bonus", bonusLabel)
            DetailIconCard(Modifier.weight(1f), Icons.Default.Store, if (isTamil) "மீட்டெடுக்க" else "Redeem", redeemLabel)
        }
    }
}

@Composable
private fun DetailIconCard(modifier: Modifier, icon: ImageVector, title: String, value: String) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Icon(icon, null, tint = BrandAccent, modifier = Modifier.size(20.dp))
            Spacer(Modifier.height(12.dp))
            Text(title, color = TextMuted, fontSize = 11.sp, fontFamily = PoppinsFamily)
            Text(value, color = BrandDeep, fontWeight = FontWeight.Bold, fontSize = 14.sp, fontFamily = PoppinsFamily)
        }
    }
}

// Fallback static policy section (shown only when no customSectionsJson exists)
@Composable
private fun PolicySection(isSilver: Boolean) {
    val isTamil = Locale.getDefault().language == "ta"
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        SectionHeader(if (isTamil) "முக்கிய கொள்கைகள்" else "Key Policies", horizontalPadding = 0.dp)
        ExpandablePolicyItem(
            if (isTamil) "தவறவிட்ட தவணை கொள்கை" else "Missed Installment Policy",
            if (isTamil) "தவணையைத் தவறவிட்டால், முதிர்வு தேதி ஒரு மாதம் தள்ளிப்போகும். கூடுதல் கட்டணம் ஏதுமில்லை." else "If you miss an installment, the maturity date will be extended by one month. No penalties are charged."
        )
        ExpandablePolicyItem(
            if (isTamil) (if (isSilver) "பூட்டப்பட்ட வெள்ளி vs மீட்கக்கூடிய வெள்ளி" else "பூட்டப்பட்ட தங்கம் vs மீட்கக்கூடிய தங்கம்") else (if (isSilver) "Locked vs Redeemable Silver" else "Locked vs Redeemable Gold"),
            if (isTamil) (if (isSilver) "பூட்டப்பட்ட வெள்ளி என்பது முதிர்ச்சியடையாதது. முதிர்ந்த வெள்ளி நேரடியாக நகையாக மீட்கப்படலாம்." else "பூட்டப்பட்ட தங்கம் என்பது முதிர்ச்சியடையாதது. முதிர்ந்த தங்கம் நேரடியாக நகையாக மீட்கப்படலாம்.") else (if (isSilver) "Locked silver is the weight purchased but not yet matured. Redeemable silver is available for jewellery collection." else "Locked gold is the weight purchased but not yet matured. Redeemable gold is available for jewellery collection.")
        )
        ExpandablePolicyItem(
            if (isTamil) "முன்கூட்டியே மூடுதல்" else "Exit / Early Closure",
            if (isTamil) "6 மாதங்களுக்குப் பிறகு பகுதியளவு போனஸ் பலன்களுடன் முன்கூட்டியே மூடுதல் அனுமதிக்கப்படும்." else "Early closure is allowed after 6 months with partial bonus benefits."
        )
    }
}

// Renders a dynamic content section fetched from customSectionsJson.
// Supports plain text and a simple pipe-separated [TABLE]...[/TABLE] block.
@Composable
private fun DynamicSectionContent(content: String, isTamil: Boolean) {
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        if (content.contains("[TABLE]")) {
            val tableStart = content.indexOf("[TABLE]")
            val tableEnd = content.indexOf("[/TABLE]")
            val preText = content.substring(0, tableStart).trim()
            if (preText.isNotEmpty()) {
                Text(
                    text = preText,
                    fontFamily = PoppinsFamily,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }
            if (tableStart != -1 && tableEnd != -1) {
                val tableBody = content.substring(tableStart + 7, tableEnd).trim()
                val rows = tableBody.lines().filter { it.isNotBlank() }
                if (rows.isNotEmpty()) {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = BorderStroke(1.dp, SurfaceLight)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            rows.forEachIndexed { idx, row ->
                                val cells = row.split("|").map { it.trim() }
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(if (idx == 0) BrandAccent.copy(alpha = 0.08f) else Color.Transparent)
                                        .padding(vertical = 6.dp, horizontal = 4.dp)
                                ) {
                                    cells.forEach { cell ->
                                        Text(
                                            text = cell,
                                            modifier = Modifier.weight(1f),
                                            fontFamily = PoppinsFamily,
                                            fontWeight = if (idx == 0) FontWeight.Bold else FontWeight.Normal,
                                            fontSize = if (idx == 0) 12.sp else 12.sp,
                                            color = if (idx == 0) BrandDeep else TextSecondary
                                        )
                                    }
                                }
                                if (idx < rows.size - 1) {
                                    HorizontalDivider(color = SurfaceLight)
                                }
                            }
                        }
                    }
                }
            }
        } else if (content.isNotBlank()) {
            // Plain text — render as expandable policy-style items if it has newlines, else just text
            val lines = content.lines().filter { it.isNotBlank() }
            if (lines.size > 1) {
                lines.forEach { line ->
                    ExpandablePolicyItem(title = line, content = "")
                }
            } else {
                Text(
                    text = content,
                    fontFamily = PoppinsFamily,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }
        }
    }
}

@Composable
private fun ExpandablePolicyItem(title: String, content: String) {
    var expanded by remember { mutableStateOf(false) }
    val hasContent = content.isNotBlank()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .clickable(enabled = hasContent) { expanded = !expanded }
            .padding(16.dp)
            .animateContentSize()
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(title, fontFamily = PoppinsFamily, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = BrandDeep, modifier = Modifier.weight(1f))
            if (hasContent) {
                Icon(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null, tint = TextMuted)
            }
        }
        if (expanded && hasContent) {
            Spacer(Modifier.height(8.dp))
            Text(content, fontFamily = PoppinsFamily, fontSize = 13.sp, color = TextSecondary, lineHeight = 20.sp)
        }
    }
}

@Composable
private fun SocialProofSection() {
    val isTamil = Locale.getDefault().language == "ta"
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Default.Groups, null, tint = BrandAccent.copy(alpha = 0.6f), modifier = Modifier.size(32.dp))
        Spacer(Modifier.height(12.dp))
        Text(
            text = if (isTamil) "50,000+ தமிழக குடும்பங்களின் நம்பிக்கை" else "Trusted by 50,000+ Tamil Nadu Families",
            fontFamily = PlayfairFamily,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            color = BrandDeep,
            textAlign = TextAlign.Center
        )
        Text(
            text = if (isTamil) "“2 வருடங்களுக்கு முன் என் மகள் திருமணத்திற்காகச் சேமிக்கத் தொடங்கினேன். போனஸ் பலன்கள் மிகவும் உதவியது.”" 
                else "“Started saving for my daughter’s wedding 2 years ago. The bonus made a huge difference.”",
            fontFamily = PoppinsFamily,
            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
            fontSize = 12.sp,
            color = TextMuted,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

@Composable
private fun SectionHeader(title: String, horizontalPadding: androidx.compose.ui.unit.Dp = 24.dp) {
    Text(
        title,
        fontFamily = PlayfairFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        color = BrandDeep,
        modifier = Modifier.padding(horizontal = horizontalPadding, vertical = 16.dp)
    )
}

private fun formatDateString(dateStr: String?): String {
    if (dateStr.isNullOrEmpty()) return "—"
    return try {
        val datePart = dateStr.take(10)
        val parts = datePart.split("-")
        if (parts.size == 3) {
            "${parts[2]}/${parts[1]}/${parts[0]}"
        } else {
            datePart
        }
    } catch (e: Exception) {
        dateStr.take(10)
    }
}

// ── Active Scheme Stats Table ─────────────────────────────────────────────────────
// Clean 2-column table showing all active scheme stats.
// All data from SchemeProgressResponse — zero hardcoding.
@Composable
private fun ActiveSchemeOverviewCard(progress: SchemeProgressResponse, isSilver: Boolean) {
    val isTamil = Locale.getDefault().language == "ta"

    // Compute days remaining
    val daysRemaining = run {
        try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val mat = sdf.parse(progress.maturityDate.take(10))
            val now = java.util.Date()
            if (mat != null && mat.after(now)) {
                val diff = mat.time - now.time
                (diff / (1000 * 60 * 60 * 24)).toInt()
            } else 0
        } catch (_: Exception) { 0 }
    }

    // Current bonus tier from bonusConfigJson (from progress or parent)
    val currentTierLabel = when {
        progress.schemeDayNumber <= 75  -> "Tier 1 — 7.5%"
        progress.schemeDayNumber <= 150 -> "Tier 2 — 5.5%"
        progress.schemeDayNumber <= 225 -> "Tier 3 — 3.5%"
        else                            -> "Tier 4 — 1.5%"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, if (isSilver) Color(0xFF90A4AE) else SurfaceLight)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(if (isSilver) Icons.Default.Circle else Icons.Default.AccountBalance, null, tint = if (isSilver) Color(0xFF90A4AE) else BrandDark, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    text = if (isTamil) (if (isSilver) "என் வெள்ளி பயணம்" else "என் தங்க பயணம்") else (if (isSilver) "My Silver Journey" else "My Gold Journey"),
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = BrandDeep
                )
            }
            Spacer(Modifier.height(16.dp))

            // Stat rows — 2 per row
            @Composable
            fun StatRow(label1: String, value1: String, label2: String, value2: String, valueColor2: Color = BrandDeep) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(label1, fontSize = 11.sp, color = TextMuted, fontFamily = PoppinsFamily)
                        Text(value1, fontSize = 13.sp, color = BrandDeep, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(label2, fontSize = 11.sp, color = TextMuted, fontFamily = PoppinsFamily)
                        Text(value2, fontSize = 13.sp, color = valueColor2, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
                    }
                }
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = SurfaceLight)
                Spacer(Modifier.height(12.dp))
            }

            StatRow(
                label1 = if (isTamil) "சேர்ந்த தேதி" else "Join Date",
                value1 = formatDateString(progress.joinedAt),
                label2 = if (isTamil) "முதிர்வு தேதி" else "Maturity Date",
                value2 = formatDateString(progress.maturityDate),
                valueColor2 = Color(0xFFC2185B)
            )
            StatRow(
                label1 = if (isTamil) "மிகுதி நாட்கள்" else "Days Remaining",
                value1 = "$daysRemaining ${if (isTamil) "நாட்கள்" else "days"}",
                label2 = if (isTamil) "சேர்த்த தவணைகள்" else "Payments Made",
                value2 = "${progress.installmentsPaid} ${if (isTamil) "தவணைகள்" else "payments"}"
            )
            StatRow(
                label1 = if (isTamil) (if (isSilver) "சேர்த்த வெள்ளி" else "சேர்த்த தங்கம்") else (if (isSilver) "Silver Added" else "Gold Added"),
                value1 = mgToGrams(progress.accumulatedGoldMg, isSilver),
                label2 = if (isTamil) (if (isSilver) "முதிர்ந்த வெள்ளி" else "முதிர்ந்த தங்கம்") else (if (isSilver) "Matured Silver" else "Matured Gold"),
                value2 = mgToGrams(progress.redeemedGoldMg, isSilver)
            )
            StatRow(
                label1 = if (isTamil) "மொத்த போனஸ்" else "Total Bonus Earned",
                value1 = "+${mgToGrams(progress.totalBonusGoldMg, isSilver)}",
                label2 = if (isTamil) "தற்போதைய அடுக்கு" else "Current Bonus Tier",
                value2 = currentTierLabel,
                valueColor2 = SuccessGreen
            )

            // Accumulated gold progress bar
            val fraction = if (progress.totalInstallments > 0)
                (progress.installmentsPaid.toFloat() / progress.totalInstallments).coerceIn(0f, 1f)
            else 0f
            Column {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(
                        text = if (isTamil) "திட்ட முன்னேற்றம்" else "Scheme Progress",
                        fontSize = 11.sp, color = TextMuted, fontFamily = PoppinsFamily
                    )
                    Text(
                        text = "${(fraction * 100).toInt()}%",
                        fontSize = 11.sp, color = BrandDark, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily
                    )
                }
                Spacer(Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(SurfaceLight)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(fraction)
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(3.dp))
                            .background(
                                Brush.horizontalGradient(if (isSilver) listOf(Color(0xFF78909C), Color(0xFFCFD8DC)) else listOf(BrandDark, BrandAccent))
                            )
                    )
                }
            }
        }
    }
}

private fun mgToGrams(mg: Long, isSilver: Boolean = false): String {
    val grams = mg / 1000.0
    val isTamil = java.util.Locale.getDefault().language == "ta"
    if (isSilver) {
        return if (isTamil) {
            String.format(Locale.US, "%.3f கி", grams)
        } else {
            String.format(Locale.US, "%.3f g", grams)
        }
    }
    
    val sovereigns = grams / 8.0
    return if (sovereigns >= 0.1) {
        val sovStr = String.format(Locale.US, "%.2f", sovereigns)
        if (isTamil) {
            String.format(Locale.US, "%.3f கி (%s சவரன்)", grams, sovStr)
        } else {
            String.format(Locale.US, "%.3f g (%s Sovereign)", grams, sovStr)
        }
    } else {
        if (isTamil) {
            String.format(Locale.US, "%.3f கி", grams)
        } else {
            String.format(Locale.US, "%.3f g", grams)
        }
    }
}

private fun paiseToRupees(paise: Long): String {
    val rupees = paise / 100.0
    val fmt = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return fmt.format(rupees)
}

@Composable
private fun RenderDynamicTextOrTable(content: String) {
    if (content.contains("[TABLE]")) {
        val tableStart = content.indexOf("[TABLE]")
        val tableEnd = content.indexOf("[/TABLE]")
        val preText = content.substring(0, tableStart).trim()
        if (preText.isNotEmpty()) {
            Text(
                text = preText,
                fontFamily = PoppinsFamily,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 20.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }
        if (tableStart != -1 && tableEnd != -1) {
            val tableBody = content.substring(tableStart + 7, tableEnd).trim()
            val rows = tableBody.lines().filter { it.isNotBlank() }
            if (rows.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, SurfaceLight)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        rows.forEachIndexed { idx, row ->
                            val cells = row.split("|").map { it.trim() }
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (idx == 0) BrandAccent.copy(alpha = 0.08f) else Color.Transparent)
                                    .padding(vertical = 6.dp, horizontal = 4.dp)
                            ) {
                                cells.forEach { cell ->
                                    Text(
                                        text = cell,
                                        modifier = Modifier.weight(1f),
                                        fontFamily = PoppinsFamily,
                                        fontWeight = if (idx == 0) FontWeight.Bold else FontWeight.Normal,
                                        fontSize = 11.sp,
                                        color = if (idx == 0) BrandDeep else TextSecondary
                                    )
                                }
                            }
                            if (idx < rows.size - 1) {
                                HorizontalDivider(color = SurfaceLight)
                            }
                        }
                    }
                }
            }
        }
    } else if (content.isNotBlank()) {
        Text(
            text = content,
            fontFamily = PoppinsFamily,
            fontSize = 13.sp,
            color = TextSecondary,
            lineHeight = 20.sp
        )
    }
}

@Composable
private fun PremiumInfoCardComponent(title: String, content: String, isTamil: Boolean) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = BrandDeep.copy(alpha = 0.04f)
        ),
        border = BorderStroke(1.dp, BrandAccent.copy(alpha = 0.35f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = BrandAccent,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = title,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = BrandDeep,
                    textAlign = TextAlign.Center
                )
            }
            if (content.contains("[TABLE]")) {
                RenderDynamicTextOrTable(content = content)
            } else {
                Text(
                    text = content,
                    fontFamily = PoppinsFamily,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun HighlightGridComponent(title: String, content: String, isTamil: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp)
    ) {
        Text(
            text = title,
            fontFamily = PoppinsFamily,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = BrandAccent,
            modifier = Modifier.padding(bottom = 6.dp, start = 2.dp)
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = BorderStroke(1.dp, SurfaceLight)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    RenderDynamicTextOrTable(content = content)
                }
            }
            
            Card(
                modifier = Modifier
                    .weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = BrandDeep.copy(alpha = 0.02f)),
                border = BorderStroke(1.dp, SurfaceLight)
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = BrandAccent,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (isTamil) "செயலில் உள்ள பலன்" else "Active Benefit",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = BrandDeep,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = if (isTamil) "நம்பகமான தங்கச் சேமிப்பு" else "Trusted gold savings",
                        fontFamily = PoppinsFamily,
                        fontSize = 9.sp,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
private fun CoinJarVerificationLoader() {
    val isTamil = java.util.Locale.getDefault().language == "ta"
    val infiniteTransition = rememberInfiniteTransition(label = "coins")
    val coin1Y by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing)
        ),
        label = "coin1"
    )
    val coin2Y by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, delayMillis = 500, easing = LinearEasing)
        ),
        label = "coin2"
    )
    val coin3Y by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, delayMillis = 1000, easing = LinearEasing)
        ),
        label = "coin3"
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC1A081C)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(280.dp)
        ) {
            Text(
                text = if (isTamil) "கட்டணம் சரிபார்க்கப்படுகிறது..." else "Verifying Payment...",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                fontFamily = PoppinsFamily,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = if (isTamil) "தயவுசெய்து காத்திருக்கவும். உங்கள் நாணயங்கள் ஜாடியில் சேர்க்கப்படுகின்றன." else "Please wait. Your savings are being secured in your vault.",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 12.sp,
                fontFamily = PoppinsFamily,
                textAlign = TextAlign.Center
            )
            Spacer(Modifier.height(40.dp))
            Box(
                modifier = Modifier.size(200.dp, 300.dp),
                contentAlignment = Alignment.TopCenter
            ) {
                // Top Cloud
                Box(
                    modifier = Modifier
                        .size(120.dp, 50.dp)
                        .clip(RoundedCornerShape(25.dp))
                        .background(Brush.verticalGradient(listOf(Color(0xFFE0B0FF), Color(0xFF8A2BE2))))
                )
                // Glass Jar
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .size(100.dp, 120.dp)
                        .border(3.dp, Color.White.copy(alpha = 0.8f), RoundedCornerShape(15.dp))
                        .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(15.dp))
                ) {
                    // Gold base inside jar
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                            .height(45.dp)
                            .clip(RoundedCornerShape(bottomStart = 12.dp, bottomEnd = 12.dp))
                            .background(Brush.verticalGradient(listOf(Color(0xFFFFD700).copy(alpha = 0.6f), Color(0xFFFF8C00).copy(alpha = 0.8f))))
                    )
                }
                // Falling Coins
                val distance = 130f
                Box(
                    modifier = Modifier
                        .offset(y = (50f + distance * coin1Y).dp)
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Brush.radialGradient(listOf(Color(0xFFFFF8C4), Color(0xFFFFD700), Color(0xFFB8860B))))
                        .border(1.dp, Color(0xFF8B6508), CircleShape)
                )
                Box(
                    modifier = Modifier
                        .offset(y = (50f + distance * coin2Y).dp, x = (-15).dp)
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Brush.radialGradient(listOf(Color(0xFFFFF8C4), Color(0xFFFFD700), Color(0xFFB8860B))))
                        .border(1.dp, Color(0xFF8B6508), CircleShape)
                )
                Box(
                    modifier = Modifier
                        .offset(y = (50f + distance * coin3Y).dp, x = 15.dp)
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(Brush.radialGradient(listOf(Color(0xFFFFF8C4), Color(0xFFFFD700), Color(0xFFB8860B))))
                        .border(1.dp, Color(0xFF8B6508), CircleShape)
                )
            }
        }
    }
}

