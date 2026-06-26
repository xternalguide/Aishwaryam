package com.example.aishwaryam_android.ui.dashboard

import android.graphics.BitmapFactory
import android.util.Base64
import android.widget.Toast
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import com.example.aishwaryam_android.ui.components.shimmerEffect
import com.example.aishwaryam_android.ui.components.AutoSizeText
import com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.MainActivity
import com.example.aishwaryam_android.utils.LocaleHelper
import com.example.aishwaryam_android.utils.PaymentManager
import com.example.aishwaryam_android.utils.PaymentResult
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.network.BannerItem
import com.example.aishwaryam_android.network.PaymentOrderResponse
import com.example.aishwaryam_android.ui.transactions.TransactionsScreen
import com.example.aishwaryam_android.ui.profile.ProfileScreen
import kotlinx.coroutines.delay
import java.text.NumberFormat
import java.util.Locale
import androidx.compose.foundation.Canvas
import com.example.aishwaryam_android.network.*
import com.example.aishwaryam_android.ui.theme.SuccessGreen
import com.example.aishwaryam_android.ui.theme.WarningAmber
import com.example.aishwaryam_android.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue


// ── Professional FinTech Colour tokens ─────────────────────────────────────
private val MagentaPrimary = Color(0xFF4A0E4E) // Deep Wine
private val MagentaSecondary = Color(0xFF880E4F) // Muted Magenta
private val MagentaAccent = Color(0xFFC2185B) // Bright Magenta
private val SurfaceLight = Color(0xFFF8F9FA) // Clean White/Grey
private val CardBg = Color(0xFFFFFFFF)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    userId: String,
    onLogout: () -> Unit,
    onBuyClick: () -> Unit,
    onSellClick: (Long) -> Unit,
    onKycClick: () -> Unit,
    onExploreSchemesClick: () -> Unit,
    onSchemeClick: (String) -> Unit,
    onPaymentSuccess: (receiptJson: String) -> Unit = {},
    onNavigateToInfo: (String) -> Unit = {},
    onPortfolioAnalyticsClick: () -> Unit = {},
    viewModel: DashboardViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var selectedTab by rememberSaveable { mutableIntStateOf(com.example.aishwaryam_android.AishwaryamApp.lastSelectedTab) }
    var isRefreshing by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val activity = context as? MainActivity
    val coroutineScope = rememberCoroutineScope()
    val sharedPrefs = remember { context.getSharedPreferences("aishwaryam_prefs", android.content.Context.MODE_PRIVATE) }
    var hasSwiped by remember { mutableStateOf(sharedPrefs.getBoolean("has_swiped_active_schemes", false)) }
    var expandedCardId by remember { mutableStateOf<String?>(null) }
    val scrollState = rememberLazyListState()

    var selectedSchemeForDetail by remember { mutableStateOf<AvailableScheme?>(null) }
    var schemeToConfirmJoin by remember { mutableStateOf<AvailableScheme?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val confirmSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(userId) {
        viewModel.refresh(userId)
        viewModel.startPolling(userId)
    }



    // Sync selectedTab back to the companion object so locale-change recreation restores it
    LaunchedEffect(selectedTab) {
        com.example.aishwaryam_android.AishwaryamApp.lastSelectedTab = selectedTab
    }

    LaunchedEffect(state.error) {
        state.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                is DashboardEvent.ShowNotification -> {
                    activity?.showPushNotification(event.title, event.message)
                }
                is DashboardEvent.OperationSuccess -> {
                    Toast.makeText(context, event.message, Toast.LENGTH_SHORT).show()
                }
                is DashboardEvent.NavigateToSuccess -> {
                    onPaymentSuccess(event.receiptJson)
                }
            }
        }
    }

    LaunchedEffect(isRefreshing) {
        if (isRefreshing) {
            viewModel.refresh(userId)
            isRefreshing = false
        }
    }

    // ── Safety: clear any stuck processing spinner when this screen resumes ──
    val lifecycle = androidx.lifecycle.compose.LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                viewModel.forceStopProcessing()
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    var showNotifications by remember { mutableStateOf(false) }
    var showAddSavingsSheet by remember { mutableStateOf(false) }
    var activeSchemeForAddSavings by remember { mutableStateOf<ActiveSchemeItem?>(null) }
    var inputSavingsAmountText by remember { mutableStateOf("") }
    val addSavingsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    if (showNotifications) {
        NotificationsSheet(
            notifications = state.recentNotifications,
            onDismiss = { showNotifications = false }
        )
    }

    if (showAddSavingsSheet) {
        ModalBottomSheet(
            onDismissRequest = { 
                showAddSavingsSheet = false
                inputSavingsAmountText = ""
            },
            sheetState = addSavingsSheetState,
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
                    text = stringResource(R.string.add_scheme_savings_title),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = BrandDeep,
                    fontFamily = PoppinsFamily
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.add_scheme_savings_desc),
                    fontSize = 12.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )

                Spacer(Modifier.height(24.dp))

                // Custom amount text field
                OutlinedTextField(
                    value = inputSavingsAmountText,
                    onValueChange = { text ->
                        if (text.all { it.isDigit() }) {
                            inputSavingsAmountText = text
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    placeholder = { Text(stringResource(R.string.enter_custom_amount), color = Color.Gray) },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    ),
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.CurrencyRupee,
                            contentDescription = null,
                            tint = MagentaPrimary
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MagentaPrimary,
                        unfocusedBorderColor = Color.LightGray
                    )
                )

                Spacer(Modifier.height(12.dp))

                // Quick select chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val presets = listOf("1000", "5000", "10000")
                    presets.forEach { preset ->
                        AssistChip(
                            onClick = { inputSavingsAmountText = preset },
                            label = { Text("₹$preset", fontWeight = FontWeight.Bold) },
                            colors = AssistChipDefaults.assistChipColors(
                                labelColor = MagentaPrimary
                            ),
                            border = BorderStroke(
                                width = 1.dp,
                                color = MagentaPrimary.copy(alpha = 0.3f)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }

                Spacer(Modifier.height(20.dp))
                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.4f))
                Spacer(Modifier.height(16.dp))

                // Dynamic calculations preview
                val enteredAmount = inputSavingsAmountText.toLongOrNull() ?: 0L
                val enteredAmountPaise = enteredAmount * 100L

                // 3% GST calculation: base = amount / 1.03
                val baseAmountPaise = (enteredAmountPaise / 1.03).toLong()
                val gstAmountPaise = enteredAmountPaise - baseAmountPaise

                // Bonus percentage & amount calculation
                val bonusPercent = activeSchemeForAddSavings?.currentBonusTierPercent ?: state.currentBonusTierPercent
                val bonusAmountPaise = (baseAmountPaise * (bonusPercent / 100.0)).toLong()
                val totalEffectiveValuePaise = baseAmountPaise + bonusAmountPaise

                // Estimated Gold/Silver added in mg (effective value paise / price22KPaise or fixed silver rate)
                val isSilverScheme = activeSchemeForAddSavings?.planName?.lowercase()?.contains("silver") == true
                val isTamil = java.util.Locale.getDefault().language == "ta"
                val price22K = if (isSilverScheme) 9500L else state.price22KPaise
                val estimatedGoldMg = if (price22K > 0) {
                    (totalEffectiveValuePaise * 1000L) / price22K
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
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(stringResource(R.string.entered_amount), fontSize = 13.sp, color = Color.Gray)
                        Text(paiseToRupees(enteredAmountPaise), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(stringResource(R.string.gst_included), fontSize = 13.sp, color = Color.Gray)
                        Text(paiseToRupees(gstAmountPaise), fontSize = 13.sp, color = Color.Black)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(stringResource(R.string.base_savings_amount), fontSize = 13.sp, color = Color.Gray)
                        Text(paiseToRupees(baseAmountPaise), fontSize = 13.sp, color = Color.Black)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(stringResource(R.string.loyalty_bonus_dynamic, bonusPercent.toInt()), fontSize = 13.sp, color = MagentaPrimary, fontWeight = FontWeight.Bold)
                        Text("+ " + paiseToRupees(bonusAmountPaise), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MagentaPrimary)
                    }
                    HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(stringResource(R.string.total_purchase_value), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        Text(paiseToRupees(totalEffectiveValuePaise), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = BrandDeep)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(if (isSilverScheme) (if (isTamil) "மதிப்பிடப்பட்ட வெள்ளி வரவு" else "Estimated Silver Credited") else stringResource(R.string.estimated_gold_credited), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        Text(mgToGrams(estimatedGoldMg), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = if (isSilverScheme) Color(0xFF90A4AE) else Color(0xFFFFB300))
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Pay & Add Gold/Silver Button
                Button(
                    onClick = {
                        if (enteredAmountPaise > 0) {
                            showAddSavingsSheet = false
                            viewModel.initiatePayment(userId, enteredAmountPaise, activeSchemeForAddSavings?.schemeId) { order ->
                                activity?.startPayment(
                                    orderId = order.orderId,
                                    amount = order.amount,
                                    keyId = order.keyId,
                                    userPhone = state.userPhone ?: "",
                                    userName = state.userName ?: "",
                                    onSuccess = { razorpayOrderId, razorpayPaymentId, razorpaySignature ->
                                        viewModel.verifyInstallmentPayment(
                                            userId = userId,
                                            orderId = razorpayOrderId,
                                            paymentId = razorpayPaymentId,
                                            signature = razorpaySignature
                                        )
                                    },
                                    onFailure = { razorpayOrderId, errorCode, errorMessage ->
                                        viewModel.handlePaymentFailure(
                                            userId = userId,
                                            orderId = razorpayOrderId,
                                            amountPaise = order.amount,
                                            errorCode = errorCode.toString(),
                                            errorMessage = errorMessage
                                        )
                                    }
                                )
                             }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary),
                    enabled = enteredAmountPaise > 0 && !state.isTransactionProcessing
                ) {
                    Icon(Icons.Default.Payment, null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = if (isSilverScheme) {
                            if (isTamil) "செலுத்தி வெள்ளியைச் சேர்க்கவும்" else "Pay & Add Silver"
                        } else {
                            stringResource(R.string.pay_add_gold)
                        },
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
                Spacer(Modifier.height(16.dp))
            }
        }
    }

    Scaffold(
        containerColor = SurfaceLight,
        topBar = {
            DashboardTopBar(
                userName = state.userName,
                unreadCount = state.unreadNotificationCount,
                onNotificationClick = { 
                    viewModel.clearUnreadCount()
                    onNavigateToInfo("notifications") 
                },
                onAlertsClick = { onNavigateToInfo("gold_rate_alerts") },
                onLogoutClick = onLogout
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.shadow(16.dp)
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { 
                        Icon(
                            if (selectedTab == 0) Icons.Filled.Home else Icons.Outlined.Home, 
                            null,
                            modifier = Modifier.animateContentSize()
                        ) 
                    },
                    label = { Text(stringResource(R.string.home), fontFamily = PoppinsFamily, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MagentaPrimary,
                        selectedTextColor = MagentaPrimary,
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted,
                        indicatorColor = MagentaPrimary.copy(alpha = 0.12f)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { 
                        Icon(
                            if (selectedTab == 1) Icons.Filled.History else Icons.Outlined.History, 
                            null,
                            modifier = Modifier.animateContentSize()
                        ) 
                    },
                    label = { Text(stringResource(R.string.history), fontFamily = PoppinsFamily, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MagentaPrimary,
                        selectedTextColor = MagentaPrimary,
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted,
                        indicatorColor = MagentaPrimary.copy(alpha = 0.12f)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { 
                        Icon(
                            if (selectedTab == 2) Icons.Filled.Person else Icons.Outlined.Person, 
                            null,
                            modifier = Modifier.animateContentSize()
                        ) 
                    },
                    label = { Text(stringResource(R.string.profile), fontFamily = PoppinsFamily, fontWeight = FontWeight.Medium) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = MagentaPrimary,
                        selectedTextColor = MagentaPrimary,
                        unselectedIconColor = TextMuted,
                        unselectedTextColor = TextMuted,
                        indicatorColor = MagentaPrimary.copy(alpha = 0.12f)
                    )
                )
            }
        },
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick = { onNavigateToInfo("ai_assistant") },
                    containerColor = BrandDeep,
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(
                        imageVector = Icons.Default.SupportAgent,
                        contentDescription = stringResource(R.string.ai_assistant_title)
                    )
                }
            }
        }
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { isRefreshing = true; viewModel.refresh(userId) },
            modifier = Modifier.padding(padding)
        ) {
            when (selectedTab) {
                0 -> {
                    Box(modifier = Modifier.fillMaxSize()) {
                        if (state.isLoading && state.banners.isEmpty()) {
                            DashboardSkeleton()
                        } else {
                        LazyColumn(
                            state = scrollState,
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                start = 16.dp, end = 16.dp, top = 8.dp, bottom = 40.dp
                            ),
                            verticalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                            // 0. KYC SOFT RESTRICTION BANNER
                            if (state.kycLevel == "BASIC" || state.kycLevel == "PENDING") {
                                item {
                                    KycRestrictionBanner(
                                        isPending = state.kycLevel == "PENDING",
                                        onClick = onKycClick
                                    )
                                }
                            }

                        // 1. LIVE GOLD ASSETS / NEW USER HERO ──────────────────────────────
                        item {
                            UnifiedPortfolioCard(
                                price22KPaise    = state.price22KPaise,
                                priceUpdatedAt   = state.priceUpdatedAt,
                                goldBalanceMg    = state.goldBalanceMg,
                                returnPercentage = state.returnPercentage,
                                lockedGoldMg     = state.lockedGoldMg,
                                maturedRedeemableGoldMg = state.maturedRedeemableGoldMg,
                                redeemableGoldMg = state.redeemableGoldMg,
                                redeemedGoldMg   = state.redeemedGoldMg,
                                onCardClick = onPortfolioAnalyticsClick
                            )
                        }



                        // QUICK ACTIONS ──────────────────────────────
                        item {
                            QuickActionsRow(
                                onReferClick = { onNavigateToInfo("referral") },
                                onBonusClick = { onNavigateToInfo("my_bonuses") },
                                isRestricted = state.kycLevel == "BASIC"
                            )
                        }

                        // 2. ADS BANNERS (INDEX 1) ──────────────────────────────
                        if (state.banners.isNotEmpty()) {
                            item {
                                val pagerState = rememberPagerState(pageCount = { state.banners.size })
                                
                                // Enhanced Auto-scroll logic (Persistent Loop)
                                LaunchedEffect(state.banners) {
                                    while (true) {
                                        delay(5000)
                                        if (state.banners.isNotEmpty()) {
                                            val next = (pagerState.currentPage + 1) % state.banners.size
                                            pagerState.animateScrollToPage(
                                                page = next,
                                                animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing)
                                            )
                                        }
                                    }
                                }

                                Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                    HorizontalPager(
                                        state = pagerState,
                                        modifier = Modifier.fillMaxWidth().height(180.dp),
                                        contentPadding = PaddingValues(horizontal = 0.dp), // Full width for smooth snapping
                                        pageSpacing = 0.dp,
                                        beyondViewportPageCount = 1
                                    ) { page ->
                                        // Visual Polish: Simple parallax/scale effect
                                        val pageOffset = ((pagerState.currentPage - page) + pagerState.currentPageOffsetFraction).absoluteValue
                                        
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .graphicsLayer {
                                                    val scale = lerp(
                                                        start = 0.92f,
                                                        stop = 1f,
                                                        fraction = 1f - pageOffset.coerceIn(0f, 1f)
                                                    )
                                                    scaleX = scale
                                                    scaleY = scale
                                                    alpha = lerp(
                                                        start = 0.5f,
                                                        stop = 1f,
                                                        fraction = 1f - pageOffset.coerceIn(0f, 1f)
                                                    )
                                                }
                                        ) {
                                            BannerCard(state.banners[page])
                                        }
                                    }
                                    
                                    Spacer(Modifier.height(12.dp))
                                    
                                    // Pager Indicator
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        repeat(state.banners.size) { iteration ->
                                            val color = if (pagerState.currentPage == iteration) MagentaPrimary else Color.LightGray.copy(alpha = 0.4f)
                                            val width by animateDpAsState(if (pagerState.currentPage == iteration) 18.dp else 6.dp)
                                            Box(
                                                modifier = Modifier
                                                    .padding(3.dp)
                                                    .clip(CircleShape)
                                                    .background(color)
                                                    .width(width)
                                                    .height(6.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // 3. SCHEME CARDS (POPULAR SAVINGS) ──────────────────────────────
                        if (state.availableSchemes.isNotEmpty()) {
                            item {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = stringResource(R.string.start_saving_gold_title),
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.Black,
                                            modifier = Modifier.weight(1f)
                                        )
                                        TextButton(onClick = onExploreSchemesClick) {
                                            Text(
                                                text = stringResource(R.string.view_all),
                                                color = MagentaAccent,
                                                fontWeight = FontWeight.SemiBold,
                                                maxLines = 1,
                                                softWrap = false
                                            )
                                        }
                                    }
                                    LazyRow(
                                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                        contentPadding = PaddingValues(horizontal = 4.dp)
                                    ) {
                                        items(state.availableSchemes) { scheme ->
                                            val isAlreadyJoined = state.activeSchemes.any { it.planName == scheme.planName && it.status?.equals("Active", ignoreCase = true) == true } ||
                                                                 (state.hasActiveScheme && state.schemePlanName == scheme.planName && state.schemeStatus?.equals("Active", ignoreCase = true) == true)
                                            AvailableSchemeCard(
                                                scheme = scheme,
                                                isAlreadyJoined = isAlreadyJoined,
                                                onClick = { 
                                                    onSchemeClick(scheme.id)
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // 4. FLASH SALE / OFFERS ──────────────────────────────
                        if (!state.activeOfferTitle.isNullOrEmpty()) {
                            item {
                                FlashSaleBanner(
                                    title = state.activeOfferTitle ?: "",
                                    description = state.activeOfferDesc ?: "",
                                    bonusPaise = state.activeOfferBonusPaise,
                                    expiresAt = state.activeOfferExpiresAt ?: "",
                                    onClaimClick = { onBuyClick() }
                                )
                            }
                        }

                        // 5. ACTIVE SCHEME TRACKING (PREMIUM SWIPEABLE DEBIT CARD CAROUSEL) ────────────────────
                        if (state.activeSchemes.isNotEmpty()) {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 16.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 4.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = stringResource(R.string.your_active_schemes, state.activeSchemes.size), modifier = Modifier.weight(1f),
                                            fontSize = 18.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.Black
                                        )
                                        if (state.activeSchemes.size > 1) {
                                            Text(
                                                text = stringResource(R.string.swipe_to_view),
                                                modifier = Modifier.padding(start = 8.dp),
                                                maxLines = 1,
                                                softWrap = false,
                                                fontSize = 12.sp,
                                                color = MagentaPrimary,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }

                                    val activePagerState = rememberPagerState(pageCount = { state.activeSchemes.size })
                                    val view = androidx.compose.ui.platform.LocalView.current
                                    val haptic = androidx.compose.ui.platform.LocalHapticFeedback.current

                                    // Play native navigation tick sound and luxury haptic snappy click on transitions
                                    LaunchedEffect(activePagerState.currentPage) {
                                        if (activePagerState.currentPage > 0 && !hasSwiped) {
                                            sharedPrefs.edit().putBoolean("has_swiped_active_schemes", true).apply()
                                            hasSwiped = true
                                        }
                                        if (activePagerState.currentPage >= 0) {
                                            view.playSoundEffect(android.view.SoundEffectConstants.NAVIGATION_RIGHT)
                                            haptic.performHapticFeedback(androidx.compose.ui.hapticfeedback.HapticFeedbackType.LongPress)
                                        }
                                    }

                                    // Physics-based spring bounce swipe indicator hint animation on load
                                    val swipeHintOffset = remember { androidx.compose.animation.core.Animatable(0f) }
                                    LaunchedEffect(state.activeSchemes) {
                                        if (state.activeSchemes.size > 1) {
                                            delay(1000)
                                            swipeHintOffset.animateTo(
                                                targetValue = -30f,
                                                animationSpec = androidx.compose.animation.core.spring(
                                                    dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
                                                    stiffness = androidx.compose.animation.core.Spring.StiffnessLow
                                                )
                                            )
                                            swipeHintOffset.animateTo(
                                                targetValue = 0f,
                                                animationSpec = androidx.compose.animation.core.spring(
                                                    dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
                                                    stiffness = androidx.compose.animation.core.Spring.StiffnessLow
                                                )
                                            )
                                        }
                                    }

                                    val isAnyCardExpanded = expandedCardId != null
                                    HorizontalPager(
                                        state = activePagerState,
                                        userScrollEnabled = expandedCardId == null,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .graphicsLayer {
                                                translationX = swipeHintOffset.value
                                            },
                                        contentPadding = PaddingValues(horizontal = 24.dp),
                                        pageSpacing = 8.dp,
                                        beyondViewportPageCount = 2
                                    ) { page ->
                                        val scheme = state.activeSchemes[page]
                                        val isThisCardExpanded = expandedCardId == scheme.schemeId
                                        
                                        // Calculate exact fractional page offset from center
                                        val pageOffset = ((activePagerState.currentPage - page) + activePagerState.currentPageOffsetFraction)
                                        val absOffset = kotlin.math.abs(pageOffset)
                                        
                                                                                 // Animate transitions smoothly for a highly premium, tactile feel (Apple/Samsung Wallet style)
                                         // We animate a general card expansion progress: 0f = collapsed stack, 1f = expanded, -1f = other cards hidden
                                         val cardProgressTarget = when {
                                             !isAnyCardExpanded -> 0f
                                             isThisCardExpanded -> 1f
                                             else -> -1f
                                         }
                                         
                                         val cardProgress by animateFloatAsState(
                                             targetValue = cardProgressTarget,
                                             animationSpec = tween(durationMillis = 350, easing = FastOutSlowInEasing),
                                             label = "card_progress"
                                         )
                                         
                                         Box(
                                             modifier = Modifier
                                                 .fillMaxWidth()
                                                 .graphicsLayer {
                                                     val p = cardProgress
                                                     
                                                     // Base layout calculations for normal card stack
                                                     val baseScale  = 1f - (0.08f * absOffset.coerceIn(0f, 1f))
                                                     val baseAlpha  = 1f - (0.35f * absOffset.coerceIn(0f, 1f))
                                                     val baseTransX = pageOffset * size.width * 0.16f
                                                     val baseRotZ   = -5f * pageOffset.coerceIn(-1f, 1f)
                                                     val baseRotY   = -12f * pageOffset.coerceIn(-1f, 1f)
                                                     
                                                     // Local type-safe linear interpolation
                                                     val lerp: (Float, Float, Float) -> Float = { start, stop, fraction ->
                                                         start + (stop - start) * fraction
                                                     }
                                                     
                                                     if (p >= 0f) {
                                                         // Interpolate this card from stack style (0f) to fully expanded style (1f)
                                                         scaleX       = lerp(baseScale, 1.02f, p)
                                                         scaleY       = lerp(baseScale, 1.02f, p)
                                                         translationX = lerp(baseTransX, 0f, p)
                                                         rotationZ    = lerp(baseRotZ, 0f, p)
                                                         rotationY    = lerp(baseRotY, 0f, p)
                                                         alpha        = lerp(baseAlpha, 1f, p)
                                                     } else {
                                                         // Interpolate other cards from stack style (0f) to hidden/faded out style (-1f)
                                                         val fadeProgress = -p // 0f to 1f
                                                         scaleX       = lerp(baseScale, 0.85f, fadeProgress)
                                                         scaleY       = lerp(baseScale, 0.85f, fadeProgress)
                                                         translationX = lerp(baseTransX, 0f, fadeProgress)
                                                         rotationZ    = lerp(baseRotZ, 0f, fadeProgress)
                                                         rotationY    = lerp(baseRotY, 0f, fadeProgress)
                                                         alpha        = lerp(baseAlpha, 0f, fadeProgress)
                                                     }
                                                     
                                                     cameraDistance = 8 * density
                                                 }
                                         ) {
                                            ActiveSchemeCard(
                                                planName = scheme.planName,
                                                status = scheme.status ?: stringResource(R.string.active_status),
                                                totalSavingsAddedPaise = scheme.totalSavingsAddedPaise,
                                                totalBonusEarnedPaise = scheme.totalBonusEarnedPaise,
                                                totalBonusGoldMg = scheme.totalBonusGoldMg,
                                                schemeDayNumber = scheme.schemeDayNumber,
                                                currentBonusTierPercent = scheme.currentBonusTierPercent,
                                                remainingDaysForCurrentTier = scheme.remainingDaysForCurrentTier,
                                                remainingDaysForScheme = scheme.remainingDaysForScheme,
                                                weightSavedMg = scheme.accumulatedGoldMg,
                                                maturityDate = scheme.maturityDate ?: stringResource(R.string.calculating),
                                                joinedAt = scheme.joinedAt ?: "",
                                                installmentsPaid = scheme.installmentsPaid,
                                                totalInstallments = scheme.totalInstallments,
                                                installmentAmountPaise = scheme.installmentAmountPaise,
                                                isExpanded = isThisCardExpanded,
                                                onExpandedChange = { expanded ->
                                                    expandedCardId = if (expanded) scheme.schemeId else null
                                                },
                                                onAddSavingsClick = {
                                                    activeSchemeForAddSavings = scheme
                                                    showAddSavingsSheet = true
                                                },
                                                onClaimClick = {
                                                    viewModel.claimMaturedScheme(userId, scheme.schemeId)
                                                },
                                                schemeId = scheme.schemeId,
                                                ledger = state.schemeLedgers[scheme.schemeId] ?: emptyList(),
                                                onClick = {
                                                    onSchemeClick(scheme.schemeId)
                                                }
                                            )
                                        }
                                    }

                                    // Swipe tutorial finger hint micro-animation
                                    if (state.activeSchemes.size > 1 && !hasSwiped) {
                                        val infiniteTransition = rememberInfiniteTransition(label = "finger_swipe")
                                        val fingerOffsetX by infiniteTransition.animateFloat(
                                            initialValue = 40f,
                                            targetValue = -40f,
                                            animationSpec = infiniteRepeatable(
                                                animation = tween(1200, easing = androidx.compose.animation.core.EaseInOutSine),
                                                repeatMode = RepeatMode.Reverse
                                            ),
                                            label = "finger_x"
                                        )
                                        val fingerAlpha by infiniteTransition.animateFloat(
                                            initialValue = 0.2f,
                                            targetValue = 1f,
                                            animationSpec = infiniteRepeatable(
                                                animation = tween(1200, easing = androidx.compose.animation.core.EaseInOutSine),
                                                repeatMode = RepeatMode.Reverse
                                            ),
                                            label = "finger_alpha"
                                        )

                                        Spacer(Modifier.height(12.dp))
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(vertical = 4.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.ArrowForward,
                                                contentDescription = null,
                                                tint = MagentaPrimary.copy(alpha = fingerAlpha),
                                                modifier = Modifier
                                                    .size(20.dp)
                                                    .graphicsLayer {
                                                        translationX = fingerOffsetX
                                                    }
                                            )
                                            Spacer(Modifier.width(8.dp))
                                            Text(
                                                text = "Swipe to explore your schemes",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MagentaPrimary.copy(alpha = fingerAlpha),
                                                style = androidx.compose.ui.text.TextStyle(
                                                    shadow = androidx.compose.ui.graphics.Shadow(
                                                        color = MagentaPrimary.copy(alpha = 0.15f),
                                                        blurRadius = 8f
                                                    )
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                            item { Spacer(modifier = Modifier.height(80.dp)) }
                        } else if (state.hasActiveScheme) {
                            item {
                                var isSingleExpanded by remember { mutableStateOf(false) }
                                ActiveSchemeCard(
                                    planName = state.schemePlanName ?: stringResource(R.string.digital_gold_plan_default),
                                    status = state.schemeStatus ?: stringResource(R.string.active_status),
                                    totalSavingsAddedPaise = state.totalSavingsAddedPaise,
                                    totalBonusEarnedPaise = state.totalBonusEarnedPaise,
                                    totalBonusGoldMg = state.totalBonusGoldMg,
                                    schemeDayNumber = state.schemeDayNumber,
                                    currentBonusTierPercent = state.currentBonusTierPercent,
                                    remainingDaysForCurrentTier = state.remainingDaysForCurrentTier,
                                    remainingDaysForScheme = state.remainingDaysForScheme,
                                    weightSavedMg = state.schemeWeightSavedMg,
                                    maturityDate = state.schemeMaturityDate ?: stringResource(R.string.calculating),
                                    joinedAt = state.schemeJoinedAt ?: "",
                                    installmentsPaid = state.schemeInstallmentsPaid,
                                    totalInstallments = state.schemeTotalInstallments,
                                    installmentAmountPaise = state.schemeInstallmentAmountPaise,
                                    isExpanded = isSingleExpanded,
                                    onExpandedChange = { isSingleExpanded = it },
                                    onAddSavingsClick = {
                                        activeSchemeForAddSavings = null
                                        showAddSavingsSheet = true
                                    },
                                    onClaimClick = {
                                        state.schemeId?.let { id ->
                                            viewModel.claimMaturedScheme(userId, id)
                                        }
                                    },
                                    schemeId = state.schemeId ?: "",
                                    ledger = state.schemeId?.let { state.schemeLedgers[it] } ?: emptyList(),
                                    onClick = {
                                        onSchemeClick(state.schemeId ?: "")
                                    }
                                )
                            }
                            item { Spacer(modifier = Modifier.height(80.dp)) }
                        }
                    }
                    }

                    if (state.isTransactionProcessing) {
                        // Blurred backdrop — separate from the card so the card stays sharp
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.45f))
                                .clickable(enabled = false, onClick = {})
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable(enabled = false, onClick = {}),
                            contentAlignment = Alignment.Center
                        ) {
                            Card(
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(16.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    GoldCoinLoadingAnimation(modifier = Modifier.size(80.dp))
                                    Spacer(Modifier.height(16.dp))
                                    Text(
                                        text = "Processing Transaction...",
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFF4A0E4E),
                                        fontSize = 16.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
                1 -> TransactionsScreen(userId = userId)
                2 -> ProfileScreen(
                    userId = userId,
                    onLogoutClick = onLogout,
                    onNavigateToInfo = onNavigateToInfo
                )
            }
        }
    }

    // ── Scheme Detail Sheet ──────────────────────────────────────────────────
    if (selectedSchemeForDetail != null) {
        ModalBottomSheet(
            onDismissRequest = { selectedSchemeForDetail = null },
            sheetState = sheetState,
            containerColor = Color.White
        ) {
            SchemeDetailContent(
                scheme = selectedSchemeForDetail!!,
                currentGoldPrice = state.price22KPaise,
                kycLevel = state.kycLevel,
                isAlreadyJoined = state.activeSchemes.any { it.planName == selectedSchemeForDetail!!.planName && it.status?.equals("Active", ignoreCase = true) == true } ||
                                 (state.hasActiveScheme && state.schemePlanName == selectedSchemeForDetail!!.planName && state.schemeStatus?.equals("Active", ignoreCase = true) == true),
                onJoinClick = {
                    val scheme = selectedSchemeForDetail!!
                    if (state.kycLevel == "FULL" || state.kycLevel == "VERIFIED") {
                        // Show confirmation summary BEFORE payment
                        schemeToConfirmJoin = scheme
                        selectedSchemeForDetail = null
                    } else {
                        selectedSchemeForDetail = null
                        onKycClick()
                    }
                }
            )
        }
    }

    // ── Scheme Join Confirmation Sheet ───────────────────────────────────────
    if (schemeToConfirmJoin != null) {
        ModalBottomSheet(
            onDismissRequest = { schemeToConfirmJoin = null },
            sheetState = confirmSheetState,
            containerColor = Color.White,
            dragHandle = null
        ) {
            SchemeJoinConfirmSheet(
                scheme = schemeToConfirmJoin!!,
                onProceed = { enableAutoPay ->
                    val scheme = schemeToConfirmJoin!!
                    schemeToConfirmJoin = null
                    
                    if (enableAutoPay) {
                        // 🔄 AutoPay Path (Razorpay Subscription)
                        viewModel.createSubscription(
                            userId = userId,
                            schemeMasterId = scheme.id,
                            onReady = { subId, keyId ->
                                activity?.startSubscription(
                                    subscriptionId = subId,
                                    keyId = keyId,
                                    userPhone = state.userPhone ?: "",
                                    userName = state.userName ?: "",
                                    onSuccess = { confirmedSubId ->
                                        viewModel.activateSubscription(userId, confirmedSubId, scheme.id)
                                    },
                                    onFailure = { errorMsg ->
                                        Toast.makeText(context, "Subscription payment failed: $errorMsg", Toast.LENGTH_LONG).show()
                                    }
                                )
                            },
                            onFailure = { errorMsg ->
                                Toast.makeText(context, "Failed to initialize AutoPay: $errorMsg", Toast.LENGTH_LONG).show()
                            }
                        )
                    } else {
                        // 💳 One-time Payment Path (Regular Order)
                        viewModel.joinSchemeAndProceedToPayment(userId, scheme.id, scheme.installmentAmountPaise) { order ->
                            activity?.startPayment(
                                orderId = order.orderId,
                                amount = order.amount,
                                keyId = order.keyId,
                                userPhone = state.userPhone ?: "",
                                userName = state.userName ?: "",
                                onSuccess = { razorpayOrderId, razorpayPaymentId, razorpaySignature ->
                                    viewModel.verifyInstallmentPayment(
                                        userId = userId,
                                        orderId = razorpayOrderId,
                                        paymentId = razorpayPaymentId,
                                        signature = razorpaySignature
                                    )
                                },
                                onFailure = { razorpayOrderId, errorCode, errorMessage ->
                                    viewModel.handlePaymentFailure(
                                        userId = userId,
                                        orderId = razorpayOrderId,
                                        amountPaise = order.amount,
                                        errorCode = errorCode.toString(),
                                        errorMessage = errorMessage
                                    )
                                }
                            )
                        }
                    }
                },
                onCancel = { schemeToConfirmJoin = null }
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEME JOIN CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════

@Composable
private fun SchemeJoinConfirmSheet(
    scheme: AvailableScheme,
    onProceed: (enableAutoPay: Boolean) -> Unit,
    onCancel: () -> Unit
) {
    var autoPayEnabled by remember { mutableStateOf(true) }
    val context = LocalContext.current
    val isTamil = LocaleHelper.getSelectedLanguage(context) == "ta"

    fun getLocalizedFrequency(freq: String): String {
        return when (freq.lowercase()) {
            "daily" -> if (isTamil) "தினசரி" else "Daily"
            "weekly" -> if (isTamil) "வாராந்திர" else "Weekly"
            "monthly" -> if (isTamil) "மாதாந்திர" else "Monthly"
            else -> freq
        }
    }
    
    val today = remember {
        val cal = java.util.Calendar.getInstance()
        val day = cal.get(java.util.Calendar.DAY_OF_MONTH)
        val month = cal.getDisplayName(java.util.Calendar.MONTH, java.util.Calendar.LONG, java.util.Locale.getDefault())
        val year = cal.get(java.util.Calendar.YEAR)
        "$day $month $year"
    }
    val maturityDate = remember {
        val cal = java.util.Calendar.getInstance()
        when (scheme.frequency.lowercase()) {
            "daily" -> cal.add(java.util.Calendar.DAY_OF_MONTH, scheme.totalInstallments)
            "weekly" -> cal.add(java.util.Calendar.WEEK_OF_YEAR, scheme.totalInstallments)
            else -> cal.add(java.util.Calendar.MONTH, scheme.totalInstallments)
        }
        val day = cal.get(java.util.Calendar.DAY_OF_MONTH)
        val month = cal.getDisplayName(java.util.Calendar.MONTH, java.util.Calendar.LONG, java.util.Locale.getDefault())
        val year = cal.get(java.util.Calendar.YEAR)
        "$day $month $year"
    }
    val totalInvestment = paiseToRupees(scheme.installmentAmountPaise * scheme.totalInstallments)
    val firstInstallment = paiseToRupees(scheme.installmentAmountPaise)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp)
            .padding(bottom = 32.dp)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Box(
                    modifier = Modifier.size(64.dp).clip(CircleShape).background(
                        androidx.compose.ui.graphics.Brush.radialGradient(
                            listOf(Color(0xFF4A0E4E), Color(0xFFC2185B))
                        )
                    ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Savings, null, tint = Color.White, modifier = Modifier.size(32.dp))
                }
                Spacer(Modifier.height(12.dp))
                Text(stringResource(R.string.review_saving_plan), fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = Color.Black)
                Text(scheme.planName, color = Color(0xFFC2185B), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        // Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF8F9FA)),
            elevation = CardDefaults.cardElevation(0.dp),
            border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.3f))
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                ConfirmRow(icon = Icons.Default.CalendarToday, label = stringResource(R.string.joining_date), value = today, valueColor = Color(0xFF2E7D32))
                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                ConfirmRow(icon = Icons.Default.Event, label = stringResource(R.string.maturity_date), value = maturityDate, valueColor = Color(0xFF4A0E4E))
                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                ConfirmRow(icon = Icons.Default.Repeat, label = stringResource(R.string.investment_frequency), value = getLocalizedFrequency(scheme.frequency))
                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                ConfirmRow(icon = Icons.Default.Numbers, label = stringResource(R.string.total_duration), value = if(isTamil) "${scheme.totalInstallments} தவணைகள்" else "${scheme.totalInstallments} payments")
                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))
                ConfirmRow(icon = Icons.Default.AccountBalanceWallet, label = stringResource(R.string.total_investment_label), value = totalInvestment)
            }
        }

        Spacer(Modifier.height(16.dp))

        // AutoPay Toggle
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF4A0E4E).copy(alpha = 0.05f)),
            border = BorderStroke(1.dp, Color(0xFF4A0E4E).copy(alpha = 0.1f))
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Autorenew, null, tint = Color(0xFF4A0E4E), modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(8.dp))
                        Text(stringResource(R.string.enable_autopay_rec), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black)
                    }
                    Text(stringResource(R.string.autopay_desc), fontSize = 11.sp, color = Color.Gray)
                }
                androidx.compose.material3.Switch(
                    checked = autoPayEnabled,
                    onCheckedChange = { autoPayEnabled = it },
                    colors = androidx.compose.material3.SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = Color(0xFF4A0E4E)
                    )
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // First payment callout
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF4A0E4E).copy(alpha = 0.06f))
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(if(autoPayEnabled) stringResource(R.string.initial_security_deposit) else stringResource(R.string.first_installment_due), fontSize = 12.sp, color = Color.Gray)
                Text(firstInstallment, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF4A0E4E))
            }
            Box(
                modifier = Modifier.clip(CircleShape).background(Color(0xFF4A0E4E).copy(alpha = 0.1f)).padding(10.dp)
            ) {
                Icon(Icons.Default.CurrencyRupee, null, tint = Color(0xFF4A0E4E), modifier = Modifier.size(20.dp))
            }
        }

        Spacer(Modifier.height(24.dp))

        // Proceed button
        Button(
            onClick = { onProceed(autoPayEnabled) },
            modifier = Modifier.fillMaxWidth().height(60.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A0E4E))
        ) {
            Icon(if(autoPayEnabled) Icons.Default.VerifiedUser else Icons.Default.Lock, null, tint = Color.White, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(10.dp))
            Text(if(autoPayEnabled) stringResource(R.string.setup_autopay_join) else stringResource(R.string.proceed_to_pay_val, firstInstallment), fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Color.White)
        }

        Spacer(Modifier.height(12.dp))

        // Cancel
        TextButton(
            onClick = onCancel,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(stringResource(R.string.cancel), color = Color.Gray, fontSize = 14.sp)
        }
    }
}

@Composable
private fun ConfirmRow(icon: ImageVector, label: String, value: String, valueColor: Color = Color.Black) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = Color(0xFFC2185B), modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, fontSize = 12.sp, color = Color.Gray)
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS (RE-STYLED)
// ═══════════════════════════════════════════════════════════════════════════

@Composable
private fun BannerCard(banner: BannerItem) {
    var timeLeft by remember { mutableStateOf("") }
    var isExpired by remember { mutableStateOf(false) }

    LaunchedEffect(banner.expiresAt) {
        if (!banner.expiresAt.isNullOrEmpty()) {
            while (true) {
                val now = System.currentTimeMillis()
                val expiry = try {
                    java.time.OffsetDateTime.parse(banner.expiresAt).toInstant().toEpochMilli()
                } catch (e: Throwable) {
                    try {
                        java.time.Instant.parse(banner.expiresAt).toEpochMilli()
                    } catch (ex: Throwable) {
                        0L
                    }
                }
                val diff = expiry - now
                if (diff <= 0) {
                    timeLeft = "Expired"
                    isExpired = true
                    break
                }
                val h = diff / 3600000
                val m = (diff % 3600000) / 60000
                val s = (diff % 60000) / 1000
                timeLeft = String.format("%02dh %02dm %02ds", h, m, s)
                delay(1000)
            }
        }
    }

    Card(
        modifier = Modifier.fillMaxSize().shadow(4.dp, RoundedCornerShape(20.dp)),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (banner.imageBase64.isNotEmpty()) {
                val isUrl = remember(banner.imageBase64) {
                    banner.imageBase64.startsWith("http://", ignoreCase = true) ||
                    banner.imageBase64.startsWith("https://", ignoreCase = true) ||
                    banner.imageBase64.startsWith("/uploads/", ignoreCase = true)
                }
                if (isUrl) {
                    val imageUrl = remember(banner.imageBase64) {
                        if (banner.imageBase64.startsWith("/uploads/", ignoreCase = true)) {
                            val baseUrl = com.example.aishwaryam_android.BuildConfig.BASE_URL.removeSuffix("/")
                            baseUrl + banner.imageBase64
                        } else {
                            banner.imageBase64
                        }
                    }
                    coil.compose.AsyncImage(
                        model = imageUrl,
                        contentDescription = banner.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    val bitmap = remember(banner.imageBase64) {
                        try {
                            val cleanBase64 = if (banner.imageBase64.contains(",")) {
                                banner.imageBase64.substringAfter(",")
                            } else {
                                banner.imageBase64
                            }
                            val imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                            BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                        } catch (e: Exception) { null }
                    }
                    if (bitmap != null) {
                        androidx.compose.foundation.Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = banner.title,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray))
                    }
                }
            }

            if (!banner.expiresAt.isNullOrEmpty() && !isExpired) {
                // Premium visual gradient overlay at bottom
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                            )
                        )
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Title / Offer tag on Left
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = banner.title,
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFFE53935))
                                        .padding(horizontal = 4.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "HURRY!",
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = "Ends In",
                                    color = Color.White.copy(alpha = 0.7f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        // Ticking timer representation on Right
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black.copy(alpha = 0.4f))
                                .border(1.dp, Color(0xFFFFB300).copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Bolt,
                                contentDescription = null,
                                tint = Color(0xFFFFB300),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = timeLeft,
                                color = Color(0xFFFFB300),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        }
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha=0.6f)))))
                Text(banner.title, color = Color.White, fontWeight = FontWeight.ExtraBold, modifier = Modifier.align(Alignment.BottomStart).padding(20.dp), fontSize = 18.sp)
            }
        }
    }
}

@Composable
private fun AvailableSchemeCard(scheme: AvailableScheme, isAlreadyJoined: Boolean = false, onClick: () -> Unit) {
    val isTamil = Locale.getDefault().language == "ta"
    val is11MonthPlan = scheme.totalInstallments == 11
    val isSilver = scheme.planName.lowercase().contains("silver")
    val isDaily = scheme.frequency.lowercase() == "daily"
    
    val badgeText = remember(scheme.keywordsJson, scheme.planName) {
        var text = if (is11MonthPlan) "Popular" else "High value"
        if (!scheme.keywordsJson.isNullOrBlank()) {
            try {
                val arr = org.json.JSONArray(scheme.keywordsJson)
                if (arr.length() > 0) {
                    text = arr.optString(0, text)
                }
            } catch (_: Exception) {}
        }
        text
    }
    
    val totalAmount = (scheme.installmentAmountPaise * scheme.totalInstallments) / 100
    val installmentAmount = scheme.installmentAmountPaise / 100
    val totalPayAmount = if (is11MonthPlan) installmentAmount * 10 else totalAmount

    val planTargetText = if (isDaily) {
        if (isTamil) "நெகிழ்வானது (₹100+)" else "Flexible (₹100+)"
    } else {
        "₹$totalPayAmount"
    }

    val bonusText = remember(scheme.bonusConfigJson, scheme.planName) {
        var baseBonus = if (is11MonthPlan) (if (isTamil) "1 மாதத் தவணை இலவசம் 🎁" else "1 month FREE 🎁") else ""
        if (!scheme.bonusConfigJson.isNullOrBlank()) {
            try {
                val obj = org.json.JSONObject(scheme.bonusConfigJson)
                val pct = obj.optDouble("startingBonusPercent", 0.0)
                if (pct > 0.0) {
                    baseBonus = "$pct% " + (if (isTamil) "போனஸ்" else "Bonus")
                } else {
                    val arr = obj.optJSONArray("milestones")
                    if (arr != null && arr.length() > 0) {
                        val last = arr.getJSONObject(arr.length() - 1)
                        val flatMg = last.optLong("flatGoldBonusMg", 0L)
                        if (flatMg > 0L) {
                            baseBonus = "+${flatMg/1000.0}g " + (if (isTamil) "தங்கம்" else "gold")
                        }
                    }
                }
            } catch (_: Exception) {}
        }
        if (baseBonus.isEmpty()) {
            if (isSilver) {
                if (isTamil) "7.5% வெள்ளி போனஸ்" else "7.5% Silver Bonus"
            } else {
                if (isTamil) "7.5% தங்க போனஸ்" else "7.5% Gold Bonus"
            }
        } else baseBonus
    }

    val redeemText = remember(scheme.planName) {
        if (isSilver) {
            if (isTamil) "வெள்ளி / வவுச்சர்" else "Silver / Voucher"
        } else if (scheme.planName.lowercase().contains("viruksham")) {
            if (isTamil) "தங்கம் மட்டும்" else "Gold only"
        } else {
            if (isTamil) "தங்கம் / வவுச்சர்" else "Gold / Voucher"
        }
    }

    val subtitleText = if (isDaily) {
        if (isTamil) "குறைந்தது ₹100/நாள் · தினசரி நெகிழ்வு" else "Min ₹100/day · Daily Flexible"
    } else {
        if (isTamil) "₹${installmentAmount}/மாதம் · ${scheme.totalInstallments} மாதங்கள்" else "₹${installmentAmount}/month · ${scheme.totalInstallments} Months"
    }

    Card(
        modifier = Modifier
            .width(260.dp)
            .height(190.dp)
            .clickable { onClick() }
            .shadow(8.dp, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF22201F)),
        border = if (isAlreadyJoined) {
            BorderStroke(1.5.dp, Color(0xFF1E88E5))
        } else {
            BorderStroke(1.dp, Color.Gray.copy(alpha = 0.15f))
        }
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = scheme.planName,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    fontFamily = PoppinsFamily,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f).padding(end = 8.dp)
                )

                if (isAlreadyJoined) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFF1E88E5).copy(alpha = 0.2f))
                            .border(1.dp, Color(0xFF1E88E5), RoundedCornerShape(20.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "Enrolled",
                            color = Color(0xFF1E88E5),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (is11MonthPlan) Color(0xFF1A3A6B) else Color(0xFFFFF1C5))
                            .padding(horizontal = 6.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = badgeText,
                            color = if (is11MonthPlan) Color.White else Color(0xFF6B4B1B),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (isTamil) "திட்ட இலக்கு" else "Plan Target", color = Color.Gray, fontSize = 11.sp, fontFamily = PoppinsFamily)
                    Text(planTargetText, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (isTamil) "போனஸ்" else "Bonus", color = Color.Gray, fontSize = 11.sp, fontFamily = PoppinsFamily)
                    Text(bonusText, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (isTamil) "மீட்பு முறை" else "Redeem as", color = Color.Gray, fontSize = 11.sp, fontFamily = PoppinsFamily)
                    Text(redeemText, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
                }
            }

            Text(
                text = subtitleText,
                color = Color.Gray,
                fontSize = 11.sp,
                fontFamily = PoppinsFamily
            )
        }
    }
}

@Composable
private fun DashboardSkeleton() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Top Card Skeleton
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(28.dp))
                .shimmerEffect()
        )
        
        // Actions Row Skeleton
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            repeat(4) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .shimmerEffect()
                    )
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .width(50.dp)
                            .height(12.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .shimmerEffect()
                    )
                }
            }
        }
        
        // Scheme Card Skeleton
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .clip(RoundedCornerShape(20.dp))
                .shimmerEffect()
        )
        
        // Transactions List Skeleton
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                modifier = Modifier
                    .width(120.dp)
                    .height(20.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .shimmerEffect()
            )
            repeat(3) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(72.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .shimmerEffect()
                )
            }
        }
    }
}

@Composable
private fun UnifiedPortfolioCard(
    price22KPaise: Long,
    priceUpdatedAt: String,
    goldBalanceMg: Long,
    returnPercentage: Double,
    lockedGoldMg: Long = 0,
    maturedRedeemableGoldMg: Long = 0,
    redeemableGoldMg: Long = 0,
    redeemedGoldMg: Long = 0,
    onCardClick: () -> Unit = {}
) {
    val isTamil = Locale.getDefault().language == "ta"
    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.6f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1500, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "shimmerAlpha"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(20.dp, RoundedCornerShape(28.dp))
            .clickable { onCardClick() },
        shape = RoundedCornerShape(28.dp),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Box(
            modifier = Modifier.background(
                Brush.linearGradient(
                    listOf(Color(0xFF2D0B4E), Color(0xFF4A0E4E), Color(0xFF7B1E5E), Color(0xFFC2185B))
                )
            )
        ) {
            // Decorative circles
            Box(modifier = Modifier.size(180.dp).offset(x = 200.dp, y = (-40).dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f)))
            Box(modifier = Modifier.size(120.dp).offset(x = 240.dp, y = 40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.04f)))

            Column(modifier = Modifier.padding(24.dp)) {
                // Top row: label + LIVE badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 'Total Gold Assets' label removed per design requirement
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF4CAF50).copy(alpha = shimmerAlpha)))
                        Text("LIVE", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Live gold price — single row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(if (isTamil) "இன்றைய 22K தங்கம் விலை / 1கி" else "Current 22K Rate / 1g", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                        Text(
                            paiseToRupees(price22KPaise), // Correctly display standard 22K rate per 1g
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        NeonTrendIndicator(isUp = returnPercentage >= 0)
                    }
                }

                Spacer(Modifier.height(20.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.15f))
                Spacer(Modifier.height(16.dp))

                // Privacy Protected CTA
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White.copy(alpha = 0.12f))
                        .border(1.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
                        .clickable { onCardClick() }
                        .padding(vertical = 16.dp, horizontal = 20.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Visibility,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            text = if (isTamil) "போர்ட்ஃபோலியோ விவரங்களைக் காண்க" else "View Portfolio Details",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            fontFamily = PoppinsFamily
                        )
                    }
                }

                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(Modifier.height(12.dp))

                // Trust Chips (Sprint 2 Requirement)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TrustIndicatorChip(if (isTamil) "91.6% சுத்தமான 22K" else "91.6% 22K Pure")
                    TrustIndicatorChip(if (isTamil) "பாதுகாப்பான பெட்டகம்" else "Secure Vault")
                }
            }
        }
    }
}

@Composable
private fun TrustIndicatorChip(label: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            label,
            color = Color.White.copy(alpha = 0.7f),
            fontSize = 9.sp,
            fontFamily = PoppinsFamily,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun NewUserWelcomeHero(
    price22KPaise: Long,
    onStartSavingClick: () -> Unit,
    onLearnMoreClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(12.dp, RoundedCornerShape(28.dp)),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {


            // Premium Live 22K Gold Price Display for New Users
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(BrandDeep.copy(alpha = 0.05f))
                    .border(1.dp, BrandDeep.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    .padding(vertical = 12.dp, horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            if (Locale.getDefault().language == "ta") "இன்றைய 22K தங்கம் விலை / 1கி" else "Today's 22K Gold Rate / 1g",
                            fontFamily = PoppinsFamily,
                            fontSize = 11.sp,
                            color = TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            paiseToRupees(price22KPaise),
                            fontFamily = PoppinsFamily,
                            fontSize = 20.sp,
                            color = BrandDeep,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(SuccessGreen.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.TrendingUp,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                if (Locale.getDefault().language == "ta") "நேரடி" else "Live",
                                fontFamily = PoppinsFamily,
                                fontSize = 10.sp,
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
            
            Spacer(Modifier.height(20.dp))
            
            Button(
                onClick = onStartSavingClick,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandDark, contentColor = Color.White)
            ) {
                Text("Explore scheme", fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold)
            }
            
            Spacer(Modifier.height(12.dp))
            
            TextButton(onClick = onLearnMoreClick) {
                Text(
                    "How it works?",
                    color = BrandAccent,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
            }
            
            Spacer(Modifier.height(16.dp))
            HorizontalDivider(color = SurfaceLight)
            Spacer(Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TrustBadgeMini(Icons.Default.Verified, "91.6% 22K Pure")
                TrustBadgeMini(Icons.Default.Lock, "Insured Vault")
                TrustBadgeMini(Icons.Default.Gavel, "GST Ready")
            }
        }
    }
}

@Composable
private fun TrustBadgeMini(icon: ImageVector, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
        Text(label, fontSize = 10.sp, color = TextMuted, fontFamily = PoppinsFamily, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun PortfolioSegment(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    icon: ImageVector,
    color: Color
) {
    Column(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(icon, null, tint = color, modifier = Modifier.size(12.dp))
            Text(label, color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontWeight = FontWeight.Medium)
        }
        Text(value, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PriceChip(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(label, color = Color.White.copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Medium)
        Text(value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PriceItem(label: String, value: String) {
    Column {
        Text(label, color = Color.White.copy(alpha=0.7f), fontSize = 10.sp)
        Text(value, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun NeonTrendIndicator(isUp: Boolean) {
    Row(
        modifier = Modifier.clip(CircleShape).background(Color.White.copy(alpha=0.2f)).padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(if(isUp) Icons.AutoMirrored.Filled.TrendingUp else Icons.AutoMirrored.Filled.TrendingDown, null, tint = Color.White, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(4.dp))
        if(isUp) Text("HIGH", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun FlashSaleBanner(title: String, description: String, bonusPaise: Long, expiresAt: String, onClaimClick: () -> Unit) {
    var timeLeft by remember { mutableStateOf("") }
    LaunchedEffect(expiresAt) {
        while (true) {
            val now = System.currentTimeMillis()
            val expiry = try { java.time.OffsetDateTime.parse(expiresAt).toInstant().toEpochMilli() } catch (e: Throwable) { 0L }
            val diff = expiry - now
            if (diff <= 0) { timeLeft = "Expired"; break }
            val h = diff / 3600000; val m = (diff % 3600000) / 60000; val s = (diff % 60000) / 1000
            timeLeft = String.format("%02d:%02d:%02d", h, m, s)
            delay(1000)
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth().animateContentSize(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Black),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Bolt, null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                Text(description, color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                Text("Ends in: $timeLeft", color = WarningAmber, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Button(onClick = onClaimClick, colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black), shape = RoundedCornerShape(12.dp)) {
                Text("Join", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun QuickActionsRow(
    onReferClick: () -> Unit,
    onBonusClick: () -> Unit,
    isRestricted: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        QuickActionItem(
            icon = Icons.Default.CardGiftcard,
            label = stringResource(R.string.refer_earn),
            color = BrandDeep,
            onClick = onReferClick,
            modifier = Modifier.weight(1f)
        )
        QuickActionItem(
            icon = Icons.Default.Stars,
            label = stringResource(R.string.my_bonuses),
            color = GoldWarm,
            onClick = onBonusClick,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun QuickActionItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isRestricted: Boolean = false
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 2.dp,
        modifier = modifier
            .heightIn(min = 100.dp)
            .alpha(if (isRestricted) 0.6f else 1f)
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isRestricted) Icons.Default.Lock else icon,
                    contentDescription = label,
                    tint = color,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(Modifier.height(8.dp))
            AutoSizeText(
                text = label,
                fontSize = 11.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Medium,
                color = if (isRestricted) Color.Gray else BrandDeep,
                textAlign = TextAlign.Center,
                maxLines = 2,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ActiveSchemeCard(
    planName: String,
    status: String,
    totalSavingsAddedPaise: Long,
    totalBonusEarnedPaise: Long,
    totalBonusGoldMg: Long,
    schemeDayNumber: Int,
    currentBonusTierPercent: Double,
    remainingDaysForCurrentTier: Int,
    remainingDaysForScheme: Int,
    weightSavedMg: Long,
    maturityDate: String,
    joinedAt: String,
    installmentsPaid: Int = 0,
    totalInstallments: Int = 11,
    installmentAmountPaise: Long = 0L,
    isExpanded: Boolean = false,
    onExpandedChange: (Boolean) -> Unit = {},
    onAddSavingsClick: () -> Unit,
    onClaimClick: () -> Unit,
    schemeId: String,
    ledger: List<com.example.aishwaryam_android.network.SchemeLedgerItem> = emptyList(),
    onClick: () -> Unit
) {
    val isTamil = Locale.getDefault().language == "ta"
    val isSilver = remember(planName) { planName.lowercase().contains("silver") }

    // Custom linear gradient based on plan name for high-end look
    val cardGradient = remember(planName) {
        when {
            planName.contains("silver", ignoreCase = true) -> Brush.linearGradient(
                colors = listOf(Color(0xFF37474F), Color(0xFF263238), Color(0xFF455A64)) // Premium Charcoal Silver
            )
            planName.contains("Wedding", ignoreCase = true) -> Brush.linearGradient(
                colors = listOf(Color(0xFF8E0E00), Color(0xFF1F1C18)) // Crimson Velvet
            )
            planName.contains("Child", ignoreCase = true) -> Brush.linearGradient(
                colors = listOf(Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364)) // Sleek Slate
            )
            else -> Brush.linearGradient(
                colors = listOf(Color(0xFF2D0B4E), Color(0xFF4A0E4E), Color(0xFF7B1E5E)) // Deep Orchid
            )
        }
    }

    val goldBorderBrush = remember(isSilver) {
        if (isSilver) {
            Brush.linearGradient(
                colors = listOf(Color(0xFFB0BEC5), Color(0xFFECEFF1), Color(0xFF90A4AE), Color(0xFFECEFF1)) // Sleek metallic silver
            )
        } else {
            Brush.linearGradient(
                colors = listOf(Color(0xFFF1C40F), Color(0xFFFFD700), Color(0xFFF39C12), Color(0xFFFFD700))
            )
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(16.dp, RoundedCornerShape(24.dp)),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(cardGradient)
                .border(1.5.dp, goldBorderBrush, RoundedCornerShape(24.dp))
                .clickable { 
                    onClick()
                }
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Brand Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = planName.uppercase(),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 14.sp,
                        color = if (isSilver) Color(0xFFCFD8DC) else Color(0xFFE5A93C),
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = if (isSilver) {
                            if (isTamil) "வெள்ளி சேமிப்பு அட்டை" else "SILVER SAVINGS CARD"
                        } else {
                            stringResource(R.string.jewellery_savings_card)
                        },
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.5f),
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    text = "Aishwaryam @ your home",
                    fontWeight = FontWeight.Black,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    fontSize = 11.sp,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )
            }

            // IC Chip & Contactless reader waves
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Metallic/Golden IC Chip
                Box(
                    modifier = Modifier
                        .size(width = 40.dp, height = 28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            Brush.linearGradient(
                                if (isSilver) {
                                    listOf(Color(0xFFB0BEC5), Color(0xFF78909C), Color(0xFFCFD8DC))
                                } else {
                                    listOf(Color(0xFFF1C40F), Color(0xFFF39C12), Color(0xFFE67E22))
                                }
                            )
                        )
                        .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val w = size.width
                        val h = size.height
                        drawLine(Color.Black.copy(alpha = 0.2f), start = androidx.compose.ui.geometry.Offset(w / 3f, 0f), end = androidx.compose.ui.geometry.Offset(w / 3f, h))
                        drawLine(Color.Black.copy(alpha = 0.2f), start = androidx.compose.ui.geometry.Offset(w * 2 / 3f, 0f), end = androidx.compose.ui.geometry.Offset(w * 2 / 3f, h))
                        drawLine(Color.Black.copy(alpha = 0.2f), start = androidx.compose.ui.geometry.Offset(0f, h / 2f), end = androidx.compose.ui.geometry.Offset(w, h / 2f))
                    }
                }

                // Contactless waves drawn manually using concentric arcs
                Canvas(modifier = Modifier.size(20.dp)) {
                    val w = size.width
                    val h = size.height
                    val strokeWidth = 1.5.dp.toPx()
                    val color = Color.White.copy(alpha = 0.5f)
                    
                    drawArc(
                        color = color,
                        startAngle = -45f,
                        sweepAngle = 90f,
                        useCenter = false,
                        topLeft = androidx.compose.ui.geometry.Offset(w * 0.1f, h * 0.1f),
                        size = androidx.compose.ui.geometry.Size(w * 0.8f, h * 0.8f),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                    drawArc(
                        color = color,
                        startAngle = -45f,
                        sweepAngle = 90f,
                        useCenter = false,
                        topLeft = androidx.compose.ui.geometry.Offset(w * 0.35f, h * 0.2f),
                        size = androidx.compose.ui.geometry.Size(w * 0.6f, h * 0.6f),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                    drawArc(
                        color = color,
                        startAngle = -45f,
                        sweepAngle = 90f,
                        useCenter = false,
                        topLeft = androidx.compose.ui.geometry.Offset(w * 0.6f, h * 0.3f),
                        size = androidx.compose.ui.geometry.Size(w * 0.4f, h * 0.4f),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                }
            }

            // Masked Credit Card Numbers showing installment payments status
            val ccNumber = remember(installmentsPaid, totalInstallments) {
                val pPaid = installmentsPaid.toString().padStart(2, '0')
                val pTot = totalInstallments.toString().padStart(2, '0')
                "SAVINGS NO · •••• •••• •• $pPaid / $pTot"
            }

            Text(
                text = ccNumber,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.9f),
                letterSpacing = 1.sp,
                modifier = Modifier.fillMaxWidth()
            )

            // Bottom Metadata Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (isSilver) {
                            if (isTamil) "வெள்ளி இருப்பு" else "SILVER BALANCE"
                        } else {
                            stringResource(R.string.gold_balance).uppercase(Locale.getDefault())
                        },
                        fontSize = 8.sp,
                        color = Color.White.copy(alpha = 0.5f),
                        letterSpacing = 0.5.sp
                    )
                    Text(
                        text = mgToGrams(weightSavedMg),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = Color.White
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = if (Locale.getDefault().language == "ta") "விவரங்கள்" else "View Details",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White.copy(alpha = 0.9f),
                        letterSpacing = 0.5.sp
                    )
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.9f),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        if (isExpanded) {
            Spacer(modifier = Modifier.height(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Savings Progress & Duration Details
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = stringResource(R.string.installments_paid_label),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray
                        )
                        Text(
                            text = if (isTamil) "$installmentsPaid / $totalInstallments நாட்கள் முடிந்தது" else "$installmentsPaid / $totalInstallments Days Completed",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MagentaPrimary
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Sleek linear progress bar
                    val progress = if (totalInstallments > 0) installmentsPaid.toFloat() / totalInstallments else 0f
                    LinearProgressIndicator(
                        progress = progress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = if (isSilver) Color(0xFF78909C) else MagentaAccent,
                        trackColor = Color.LightGray.copy(alpha = 0.3f)
                    )
                }

                // 2. Accumulated weight conversion details
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (isSilver) {
                                    if (isTamil) "மொத்த வெள்ளி சேமிப்பு" else "Total Silver Accumulated"
                                } else {
                                    "Total Gold Accumulated"
                                },
                                fontSize = 11.sp,
                                color = Color.Gray,
                                fontWeight = FontWeight.Bold
                            )
                            Text(mgToGrams(weightSavedMg), fontSize = 18.sp, fontWeight = FontWeight.Black, color = BrandDeep)
                            Text("$weightSavedMg mg", fontSize = 11.sp, color = if (isSilver) Color(0xFF78909C) else MagentaAccent, fontWeight = FontWeight.Bold)
                        }
                        Box(
                            modifier = Modifier.size(42.dp).clip(CircleShape).background(if (isSilver) Color(0xFFECEFF1) else Color(0xFFFFF9C4)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isSilver) Icons.Default.Circle else Icons.Default.MonetizationOn,
                                contentDescription = null,
                                tint = if (isSilver) Color(0xFF90A4AE) else Color(0xFFFBC02D),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }

                // 3. Day 0-75 Bonus Logic Details
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = if (isSilver) Color(0xFFECEFF1) else Color(0xFFFFFDE7)),
                    border = BorderStroke(1.dp, (if (isSilver) Color(0xFF90A4AE) else Color(0xFFFBC02D)).copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Stars,
                                contentDescription = null,
                                tint = if (isSilver) Color(0xFF78909C) else Color(0xFFFBC02D),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = if (isSilver) {
                                    if (isTamil) "வெள்ளி மைல்கல் போனஸ்" else "Milestone Loyalty Bonus (Tier 1)"
                                } else {
                                    "Milestone Loyalty Bonus (Tier 1)"
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSilver) Color(0xFF37474F) else Color(0xFF5D4037)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Text(
                            text = if (isSilver) {
                                if (isTamil) "0 முதல் 75 நாட்கள் வரையிலான வெள்ளி சேமிப்புக்கு முதிர்ச்சியின் போது 7.5% போனஸ் வழங்கப்படும்." else "Days 0 to 75 silver purchases qualify for 7.5% loyalty bonus paid at maturity."
                            } else {
                                if (isTamil) "0 முதல் 75 நாட்கள் வரையிலான தங்க சேமிப்புக்கு முதிர்ச்சியின் போது 7.5% போனஸ் வழங்கப்படும்." else "Days 0 to 75 gold purchases qualify for 7.5% loyalty bonus paid at maturity."
                            },
                            fontSize = 11.sp,
                            color = Color.DarkGray,
                            lineHeight = 15.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (isSilver) {
                                    if (isTamil) "சேர்க்கப்பட்ட வெள்ளி போனஸ்:" else "Accrued Silver Bonus:"
                                } else {
                                    if (isTamil) "சேர்க்கப்பட்ட தங்க போனஸ்:" else "Accrued Gold Bonus:"
                                },
                                fontSize = 11.sp,
                                color = Color.Gray,
                                fontWeight = FontWeight.Bold
                            )
                            Text(mgToGrams(totalBonusGoldMg) + " (${totalBonusGoldMg} mg)", fontSize = 11.sp, color = BrandDeep, fontWeight = FontWeight.Bold)
                        }
                        
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (isTamil) "திட்ட நாள்:" else "Scheme Day:",
                                fontSize = 11.sp,
                                color = Color.Gray,
                                fontWeight = FontWeight.Bold
                            )
                            Text("Day $schemeDayNumber / 330", fontSize = 11.sp, color = if (isSilver) Color(0xFF37474F) else MagentaAccent, fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (schemeDayNumber <= 75) Color(0xFFE8F5E9) else Color(0xFFECEFF1))
                                .padding(8.dp)
                        ) {
                            Text(
                                text = if (schemeDayNumber <= 75) {
                                    if (isSilver) {
                                        if (isTamil) "🟢 சேமிப்பு கட்டம்: 75-ஆம் நாள் வரை சேமிக்கும் வெள்ளிக்கு போனஸ் கிடைக்கும்!" else "🟢 Active Savings Phase: Silver saved until Day 75 qualifies for maturity bonus!"
                                    } else {
                                        if (isTamil) "🟢 சேமிப்பு கட்டம்: 75-ஆம் நாள் வரை சேமிக்கும் தங்கத்திற்கு போனஸ் கிடைக்கும்!" else "🟢 Active Savings Phase: Gold saved until Day 75 qualifies for maturity bonus!"
                                    }
                                } else {
                                    if (isSilver) {
                                        if (isTamil) "🔒 போனஸ் லாக் செய்யப்பட்டது: முதல் 75 நாட்களில் செய்த சேமிப்புக்கு போனஸ் பொருந்தும்." else "🔒 Bonus locked: Bonus is active on savings made in the first 75 days."
                                    } else {
                                        if (isTamil) "🔒 போனஸ் லாக் செய்யப்பட்டது: முதல் 75 நாட்களில் செய்த சேமிப்புக்கு போனஸ் பொருந்தும்." else "🔒 Bonus locked: Bonus is active on savings made in the first 75 days."
                                    }
                                },
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (schemeDayNumber <= 75) Color(0xFF2E7D32) else Color(0xFF455A64)
                            )
                        }
                    }
                }

                // 4. Maturity Date
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CalendarToday, null, tint = MagentaPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isTamil) "முதிர்வு தேதி" else "Maturity Date", fontSize = 13.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        text = maturityDate,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black
                    )
                }

                // 5. Payment Ledger List
                Column {
                    Text(
                        text = if (isTamil) "சேமிப்புப் பதிவு" else "Savings Log",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    if (ledger.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SurfaceLight, RoundedCornerShape(12.dp))
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (isTamil) "சேமிப்பு கொடுப்பனவுகள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை." else "No savings payments recorded yet.",
                                fontSize = 12.sp,
                                color = Color.Gray,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                            )
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .border(1.dp, Color.LightGray.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .background(Color.White)
                        ) {
                            // Table Headers
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(SurfaceLight)
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text("No.", modifier = Modifier.weight(0.6f), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                                Text(if (isTamil) "தேதி" else "Date", modifier = Modifier.weight(1.2f), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                                Text(
                                    text = if (isSilver) {
                                        if (isTamil) "வெள்ளி" else "Silver"
                                    } else {
                                        if (isTamil) "தங்கம்" else "Gold"
                                    },
                                    modifier = Modifier.weight(1.2f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Gray
                                )
                                Text(if (isTamil) "செலுத்தப்பட்டது" else "Paid", modifier = Modifier.weight(1f), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                            }

                            // Table Rows (up to 5 recent payments)
                            ledger.take(5).forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val label = if (item.transactionType == "BONUS") (if (isTamil) "🎁 போனஸ்" else "🎁 Bonus") else "#${item.installmentNumber}"
                                    Text(label, modifier = Modifier.weight(0.6f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (item.transactionType == "BONUS") MagentaAccent else Color.Black)
                                    Text(item.createdAt.take(10), modifier = Modifier.weight(1.2f), fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
                                    Text("${item.goldWeightMg} mg", modifier = Modifier.weight(1.2f), fontSize = 12.sp, color = if (isSilver) Color(0xFF37474F) else MagentaAccent, fontWeight = FontWeight.Bold)
                                    val amountText = if (item.amountPaise > 0) paiseToRupees(item.amountPaise) else (if (isTamil) "இலவசம்" else "FREE")
                                    Text(amountText, modifier = Modifier.weight(1f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                                }
                                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.2f))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // 6. Save Gold / Matured Claim button
                if (status.equals("Matured", ignoreCase = true)) {
                    Button(
                        onClick = onClaimClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = TrustGreen, contentColor = Color.White)
                    ) {
                        Text(if (isTamil) "முதிர்ந்த திட்டத்தை மீட்டெடுக்கவும்" else "Claim Matured Scheme", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                    }
                } else {
                    Button(
                        onClick = onAddSavingsClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White)
                    ) {
                        Icon(Icons.Default.Savings, null, tint = Color.White, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isSilver) {
                                if (isTamil) "வெள்ளி சேமிக்கவும்" else "Save Silver"
                            } else {
                                stringResource(R.string.buy_gold)
                            },
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SchemeDetailContent(
    scheme: AvailableScheme, 
    currentGoldPrice: Long, 
    kycLevel: String,
    isAlreadyJoined: Boolean = false,
    onJoinClick: () -> Unit
) {
    var isBonusExpanded by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp).padding(bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Column {
                Box(modifier = Modifier.size(60.dp).clip(CircleShape).background(MagentaPrimary.copy(alpha=0.1f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Insights, null, tint = MagentaPrimary, modifier = Modifier.size(32.dp))
                }
                Spacer(Modifier.height(16.dp))
                Text(scheme.planName, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = MagentaPrimary, lineHeight = 32.sp)
                Text(scheme.description, color = Color.Gray, fontSize = 15.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }

        item {
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = SurfaceLight)) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    DetailRow(stringResource(R.string.investment_frequency), scheme.frequency)
                    DetailRow(stringResource(R.string.installment_amount), paiseToRupees(scheme.installmentAmountPaise))
                    DetailRow(stringResource(R.string.total_duration), "${scheme.totalInstallments} ${stringResource(R.string.monthly_freq)}")
                    DetailRow(stringResource(R.string.total_investment_label), paiseToRupees(scheme.installmentAmountPaise * scheme.totalInstallments))
                    
                    HorizontalDivider(color = Color.LightGray.copy(alpha=0.4f))
                    
                    val estMg = if (currentGoldPrice > 0) (scheme.installmentAmountPaise * scheme.totalInstallments * 1000) / currentGoldPrice else 0L
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(stringResource(R.string.approx_maturity_gold), color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(mgToGrams(estMg), color = MagentaAccent, fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }
                }
            }
        }

        item {
            Column {
                Text(stringResource(R.string.how_it_works), fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.Black)
                Spacer(Modifier.height(12.dp))
                BulletPoint(stringResource(R.string.bullet_how_it_works_1))
                BulletPoint(stringResource(R.string.bullet_how_it_works_2))
                BulletPoint(stringResource(R.string.bullet_how_it_works_3))
                BulletPoint(stringResource(R.string.bullet_how_it_works_4))
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color.White)
                    .border(1.dp, Color.LightGray.copy(alpha=0.3f), RoundedCornerShape(16.dp))
                    .animateContentSize()
            ) {
                // Accordion Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { isBonusExpanded = !isBonusExpanded }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Percent, null, tint = MagentaPrimary, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Bonus Calculation Methodology", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.Black)
                    }
                    Icon(
                        if (isBonusExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, 
                        null, 
                        tint = Color.Gray
                    )
                }

                if (isBonusExpanded) {
                    Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 16.dp)) {
                        Text("Rewards are calculated based on your saving period consistency.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(bottom = 12.dp))
                        
                        // Bonus Table Grid (Dynamic)
                        Column(modifier = Modifier.clip(RoundedCornerShape(8.dp)).border(1.dp, Color.LightGray.copy(alpha=0.2f), RoundedCornerShape(8.dp))) {
                            BonusTableHeader()
                            
                            val tiers = try {
                                if (!scheme.bonusConfigJson.isNullOrEmpty()) {
                                    // Simple manual parsing since we don't want to add a full JSON library dependency here if not needed
                                    // Expected format: [{"days":"90 Days","bonus":"2.5%"}, ...]
                                    scheme.bonusConfigJson
                                        .removeSurrounding("[", "]")
                                        .split("},{")
                                        .map { it.removeSurrounding("{", "}") }
                                        .map { part ->
                                            val days = part.substringAfter("\"days\":\"").substringBefore("\"")
                                            val bonus = part.substringAfter("\"bonus\":\"").substringBefore("\"")
                                            days to bonus
                                        }
                                } else emptyList()
                            } catch (e: Exception) { emptyList() }

                            if (tiers.isNotEmpty()) {
                                tiers.forEach { (days, bonus) ->
                                    BonusTableRow(days, bonus, "Tier Reward")
                                }
                            } else {
                                // Default tiers if none configured
                                BonusTableRow("1 - 90 Days", "0.0%", "Initial")
                                BonusTableRow("91 - 180 Days", "2.5%", "Early")
                                BonusTableRow("181 - 270 Days", "5.0%", "Silver")
                                BonusTableRow("271 - 330 Days", "10.0%", "Gold")
                                BonusTableRow("Maturity", "100%", "Bonus")
                            }
                        }
                    }
                }
            }
        }

        // Custom Dynamic Sections
        val customSections = try {
            if (!scheme.customSectionsJson.isNullOrEmpty() && scheme.customSectionsJson != "[]") {
                val sections = mutableListOf<Pair<String, String>>()
                
                // Extremely robust parsing logic that handles optional spaces and various formatting
                val titleRegex = """"title"\s*:\s*"(.*?)"""".toRegex(RegexOption.DOT_MATCHES_ALL)
                val contentRegex = """"content"\s*:\s*"(.*?)"""".toRegex(RegexOption.DOT_MATCHES_ALL)
                
                val titles = titleRegex.findAll(scheme.customSectionsJson).map { it.groupValues[1] }.toList()
                val contents = contentRegex.findAll(scheme.customSectionsJson).map { it.groupValues[1] }.toList()
                
                titles.forEachIndexed { i, title ->
                    if (i < contents.size) {
                        // Unescape JSON characters
                        val t = title.replace("\\n", "\n").replace("\\\"", "\"").replace("\\r", "")
                        val c = contents[i].replace("\\n", "\n").replace("\\\"", "\"").replace("\\r", "")
                        if (t.isNotEmpty()) {
                            sections.add(t to c)
                        }
                    }
                }
                sections
            } else emptyList()
        } catch (e: Exception) { emptyList() }

        customSections.forEach { (title, content) ->
            item {
                var isExpanded by remember { mutableStateOf(false) }
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp) // Added padding to separate accordions
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White)
                        .border(1.dp, Color.LightGray.copy(alpha=0.3f), RoundedCornerShape(16.dp))
                        .animateContentSize()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isExpanded = !isExpanded }
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, null, tint = MagentaPrimary, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(12.dp))
                            Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.Black)
                        }
                        Icon(
                            if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore, 
                            null, 
                            tint = Color.Gray
                        )
                    }

                    if (isExpanded) {
                        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 16.dp)) {
                            // Check if content contains a table [TABLE]...[/TABLE]
                            if (content.contains("[TABLE]")) {
                                val parts = content.split("[TABLE]", "[/TABLE]")
                                parts.forEach { part ->
                                    if (part.contains("|")) {
                                        // Render Table
                                        Column(modifier = Modifier.padding(vertical = 8.dp).clip(RoundedCornerShape(8.dp)).border(1.dp, Color.LightGray.copy(alpha=0.2f), RoundedCornerShape(8.dp))) {
                                            val rows = part.trim().split("\n")
                                            rows.forEachIndexed { index, rowText ->
                                                val cols = rowText.split("|").map { it.trim() }
                                                if (index == 0) {
                                                    // Header
                                                    Row(modifier = Modifier.fillMaxWidth().background(SurfaceLight).padding(12.dp)) {
                                                        cols.forEach { col ->
                                                            Text(col, modifier = Modifier.weight(1f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MagentaPrimary)
                                                        }
                                                    }
                                                } else {
                                                    // Row
                                                    Row(modifier = Modifier.fillMaxWidth().padding(12.dp).border(0.dp, Color.Transparent)) {
                                                        cols.forEach { col ->
                                                            Text(col, modifier = Modifier.weight(1f), fontSize = 12.sp, color = Color.Black)
                                                        }
                                                    }
                                                    if (index < rows.size - 1) HorizontalDivider(color = Color.LightGray.copy(alpha=0.1f))
                                                }
                                            }
                                        }
                                    } else {
                                        Text(part.trim(), fontSize = 14.sp, color = Color.DarkGray)
                                    }
                                }
                            } else {
                                Text(content, fontSize = 14.sp, color = Color.DarkGray)
                            }
                        }
                    }
                }
            }
        }

        item {
            val isKycDone = kycLevel == "FULL" || kycLevel == "VERIFIED"
            
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                if (!isKycDone) {
                    Row(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(WarningAmber.copy(alpha=0.1f)).padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Info, null, tint = WarningAmber, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("KYC Verification required to start this scheme.", fontSize = 13.sp, color = Color(0xFF856404), fontWeight = FontWeight.Medium)
                    }
                    Spacer(Modifier.height(16.dp))
                }

                Button(
                    onClick = onJoinClick, 
                    enabled = !isAlreadyJoined,
                    modifier = Modifier.fillMaxWidth().height(60.dp), 
                    shape = RoundedCornerShape(16.dp), 
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isAlreadyJoined) Color.Gray else MagentaPrimary,
                        contentColor = Color.White,
                        disabledContainerColor = Color.Gray,
                        disabledContentColor = Color.White.copy(alpha = 0.6f)
                    )
                ) {
                    val btnText = when {
                        isAlreadyJoined -> "Active Plan"
                        isKycDone -> "Join & Start Saving"
                        else -> "Complete KYC to Join"
                    }
                    Text(btnText, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                }
            }
        }
    }
}

@Composable
private fun BulletPoint(text: String) {
    Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.Top) {
        Text("•", fontWeight = FontWeight.Black, color = MagentaAccent, modifier = Modifier.padding(end = 12.dp))
        Text(text, fontSize = 14.sp, color = Color.DarkGray, lineHeight = 20.sp)
    }
}

@Composable
private fun BonusTableHeader() {
    Row(modifier = Modifier.fillMaxWidth().background(SurfaceLight).padding(12.dp)) {
        Text("Duration", modifier = Modifier.weight(1.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
        Text("Bonus %", modifier = Modifier.weight(1f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
        Text("Benefit", modifier = Modifier.weight(1.5f), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
    }
}

@Composable
private fun BonusTableRow(days: String, bonus: String, benefit: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Text(days, modifier = Modifier.weight(1.5f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        Text(bonus, modifier = Modifier.weight(1f), fontSize = 13.sp, color = SuccessGreen, fontWeight = FontWeight.Bold)
        Text(benefit, modifier = Modifier.weight(1.5f), fontSize = 13.sp, color = Color.Gray)
    }
    HorizontalDivider(modifier = Modifier.padding(horizontal = 12.dp), color = Color.LightGray.copy(alpha=0.3f))
}

@Composable
private fun MetricItem(label: String, value: String, icon: ImageVector) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = MagentaPrimary, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Column {
            Text(label, fontSize = 11.sp, color = Color.Gray)
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black)
        }
    }
}

@Composable
private fun SchemeMetric(modifier: Modifier = Modifier, icon: ImageVector, label: String, value: String, valueColor: Color = Color.Black) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFF8F9FA))
            .padding(12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = MagentaPrimary, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            Text(label, fontSize = 11.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(4.dp))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = valueColor)
    }
}

@Composable
private fun StatusBadge(text: String) {
    Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(SuccessGreen.copy(alpha = 0.15f)).padding(horizontal = 10.dp, vertical = 6.dp)) {
        Text(text, color = SuccessGreen, fontSize = 11.sp, fontWeight = FontWeight.Black)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardTopBar(
    userName: String?,
    unreadCount: Int = 0,
    onNotificationClick: () -> Unit,
    onAlertsClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.horizontalGradient(
                    listOf(Color(0xFF2D0B4E), Color(0xFF4A0E4E), Color(0xFF7B1E5E))
                )
            )
            .statusBarsPadding()
            .padding(horizontal = 20.dp, vertical = 14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Brush.radialGradient(listOf(Color(0xFFC2185B), Color(0xFF4A0E4E)))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        userName?.take(1)?.uppercase() ?: "A",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 18.sp
                    )
                }
                Column {
                    Text(if (Locale.getDefault().language == "ta") "மீண்டும் வருக," else "Welcome back,", color = Color.White.copy(alpha = 0.65f), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    Text(
                        userName?.split(" ")?.firstOrNull() ?: "User",
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
            // Right Side Actions (Notifications)
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                // Notification Icon
                Box {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.12f))
                            .clickable { onNotificationClick() }
                            .padding(8.dp)
                    ) {
                        Icon(Icons.Default.Notifications, null, tint = Color.White, modifier = Modifier.size(22.dp))
                    }
                    if (unreadCount > 0) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = 5.dp, y = (-5).dp)
                                .size(18.dp)
                                .clip(CircleShape)
                                .background(Color.Red)
                                .border(1.dp, Color.White, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (unreadCount > 9) "9+" else unreadCount.toString(),
                                color = Color.White,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.ExtraBold,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.wrapContentSize(Alignment.Center)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color.Gray, fontSize = 14.sp)
        Text(value, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black)
    }
}

private fun paiseToRupees(paise: Long): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return formatter.format(paise / 100.0)
}

private fun mgToGrams(mg: Long): String {
    val grams = mg / 1000.0
    val sovereigns = grams / 8.0
    val isTamil = java.util.Locale.getDefault().language == "ta"
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationsSheet(
    notifications: List<UserNotificationDto>,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(bottom = 24.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MagentaPrimary.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Notifications, null, tint = MagentaPrimary, modifier = Modifier.size(20.dp))
                    }
                    Column {
                        Text(stringResource(R.string.notifications), fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.Black)
                        Text(
                            if (notifications.isEmpty()) stringResource(R.string.all_caught_up) else stringResource(R.string.unread_notifications, notifications.size),
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
                if (notifications.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MagentaPrimary.copy(alpha = 0.08f))
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Text(stringResource(R.string.new_notifications, notifications.size), color = MagentaPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.4f))

            if (notifications.isEmpty()) {
                // Empty state
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(MagentaPrimary.copy(alpha = 0.07f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.NotificationsNone, null, tint = MagentaPrimary, modifier = Modifier.size(36.dp))
                    }
                    Spacer(Modifier.height(16.dp))
                    Text(stringResource(R.string.all_caught_up), fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.Black)
                    Spacer(Modifier.height(6.dp))
                    Text(stringResource(R.string.no_new_notifications_desc), fontSize = 13.sp, color = Color.Gray, textAlign = TextAlign.Center)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(notifications) { notif ->
                        NotificationItem(notif)
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationItem(notif: UserNotificationDto) {
    val (icon, iconBg) = when ((notif.type ?: "").uppercase()) {
        "PAYMENT"  -> Icons.Default.CurrencyRupee to Color(0xFF4CAF50)
        "SCHEME"   -> Icons.Default.Savings to Color(0xFFFFB300)
        "KYC"      -> Icons.Default.VerifiedUser to Color(0xFF2196F3)
        "REWARD"   -> Icons.Default.CardGiftcard to Color(0xFFC2185B)
        else       -> Icons.Default.Info to MagentaPrimary
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFF9F9FF))
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(iconBg.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = iconBg, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(notif.title ?: "", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black)
            Spacer(Modifier.height(3.dp))
            Text(notif.message ?: "", fontSize = 12.sp, color = Color.Gray, lineHeight = 17.sp)
            Spacer(Modifier.height(6.dp))
            Text(
                (notif.createdAt ?: "").take(10),
                fontSize = 10.sp,
                color = Color.LightGray,
                fontWeight = FontWeight.Medium
            )
        }
    }
}



@Composable
private fun LimitProgressRow(label: String, remaining: String, total: String, progress: Float) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 12.sp, color = Color.Gray)
            Text("$remaining / $total", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color.Black)
        }
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = if (progress < 0.2f) Color.Red else SuccessGreen,
            trackColor = Color.LightGray.copy(alpha = 0.2f)
        )
    }
}

@Composable
fun KycRestrictionBanner(isPending: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isPending) WarningAmber.copy(alpha = 0.1f) else Color(0xFFFDE7E7)
        ),
        border = BorderStroke(1.dp, if (isPending) WarningAmber.copy(alpha = 0.3f) else Color.Red.copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (isPending) WarningAmber.copy(alpha = 0.2f) else Color.Red.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isPending) Icons.Default.Timer else Icons.Default.ErrorOutline,
                    contentDescription = null,
                    tint = if (isPending) Color(0xFF856404) else Color.Red,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (isPending) "KYC Verification Pending" else "Complete KYC to Unlock Features",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.Black
                )
                Text(
                    text = if (isPending) "We are reviewing your documents. This usually takes 24 hours." 
                           else "You can view prices, but buying/selling requires identity verification.",
                    fontSize = 12.sp,
                    color = Color.DarkGray
                )
            }
            
            Icon(
                Icons.AutoMirrored.Filled.ArrowForwardIos,
                contentDescription = null,
                tint = Color.Gray,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

