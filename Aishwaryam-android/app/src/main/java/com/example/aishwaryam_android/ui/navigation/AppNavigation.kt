package com.example.aishwaryam_android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.example.aishwaryam_android.data.SessionManager
import com.example.aishwaryam_android.data.OnboardingStage
import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.ui.auth.LoginScreen
import com.example.aishwaryam_android.ui.auth.MpinScreen
import com.example.aishwaryam_android.ui.auth.ProfileSetupScreen
import com.example.aishwaryam_android.ui.dashboard.DashboardScreen
import com.example.aishwaryam_android.ui.gold.BuyGoldScreen
import com.example.aishwaryam_android.ui.gold.SellGoldScreen
import com.example.aishwaryam_android.ui.gold.DigiGoldScreen
import com.example.aishwaryam_android.ui.payment.PaymentSuccessScreen
import com.example.aishwaryam_android.ui.splash.SplashScreen
import com.example.aishwaryam_android.ui.onboarding.OnboardingScreen
import com.example.aishwaryam_android.ui.onboarding.WelcomeOnboardingScreen
import com.example.aishwaryam_android.ui.info.HowItWorksScreen
import com.example.aishwaryam_android.ui.info.FaqScreen
import com.example.aishwaryam_android.ui.info.SafetyTrustScreen
import com.example.aishwaryam_android.ui.info.AboutScreen
import com.example.aishwaryam_android.ui.info.RedemptionGuideScreen
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator

// ── Transition helpers ───────────────────────────────────────────────────────
import androidx.compose.ui.unit.IntOffset
private val fadeSpec    = tween<Float>(600, easing = FastOutSlowInEasing)
private val slideSpec   = tween<IntOffset>(380, easing = FastOutSlowInEasing)
private val slideFade   = tween<Float>(380, easing = FastOutSlowInEasing)

@Composable
fun AppNavigation(intent: android.content.Intent? = null) {
    val context = LocalContext.current
    val sessionManager = SessionManager(context)
    val navController = rememberNavController()

    // ── Start Destination Logic ──────────────────────────────────────────────
    // First-time users: Splash → WelcomeOnboarding → Login
    // Returning users:  Splash → MPIN → Dashboard
    val hasSeenWelcome = sessionManager.hasSeenWelcomeOnboarding()
    val hasToken = sessionManager.getToken() != null
    val startDest = if (com.example.aishwaryam_android.AishwaryamApp.isMpinVerified) "dashboard" else "splash"

    LaunchedEffect(navController) {
        ApiClient.onSessionExpiredListener = {
            navController.navigate("login") {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    LaunchedEffect(intent) {
        if (intent != null && hasToken && sessionManager.getOnboardingStage() == OnboardingStage.FULLY_VERIFIED) {
            val targetScreen = intent.getStringExtra("target_screen")
            val entityId = intent.getStringExtra("entity_id")
            
            if (targetScreen != null) {
                // Determine route based on target screen
                val route = when (targetScreen) {
                    "scheme_details" -> if (!entityId.isNullOrEmpty()) "scheme_detail/$entityId" else "scheme_explorer"
                    "portfolio" -> "dashboard"
                    "transactions" -> "dashboard" // Currently no separate transactions tab route in top level
                    "notifications" -> "notifications"
                    else -> null
                }
                
                if (route != null) {
                    // Small delay to ensure graph is ready if app was dead
                    kotlinx.coroutines.delay(500)
                    try {
                        navController.navigate(route)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    NavHost(navController = navController, startDestination = startDest) {

        // ── SPLASH ───────────────────────────────────────────────────────────
        composable(
            "splash",
            exitTransition = { fadeOut(fadeSpec) }
        ) {
            SplashScreen(
                onSplashComplete = {
                    val stage = sessionManager.getOnboardingStage()
                    val nextDest = when {
                        !hasSeenWelcome -> "welcome"
                        !hasToken -> "login"
                        stage == OnboardingStage.OTP_VERIFIED -> "mpin/true"
                        stage == OnboardingStage.MPIN_CREATED -> "profile_setup"
                        else -> "mpin/false" // Security first: ask PIN for returning users
                    }
                    navController.navigate(nextDest) {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }

        // ── WELCOME ONBOARDING (Pre-login slides) ────────────────────────────
        composable(
            "welcome",
            enterTransition = { fadeIn(fadeSpec) },
            exitTransition  = { fadeOut(fadeSpec) }
        ) {
            WelcomeOnboardingScreen(
                onGetStarted = {
                    sessionManager.markWelcomeOnboardingSeen()
                    navController.navigate("login") {
                        popUpTo("welcome") { inclusive = true }
                    }
                },
                onSkip = {
                    sessionManager.markWelcomeOnboardingSeen()
                    navController.navigate("login") {
                        popUpTo("welcome") { inclusive = true }
                    }
                }
            )
        }

        // ── LOGIN ────────────────────────────────────────────────────────────
        composable(
            "login",
            enterTransition = { fadeIn(fadeSpec) },
            exitTransition  = { fadeOut(fadeSpec) }
        ) {
            LoginScreen(
                onLoginSuccess = { isNewUser, isMpinSet ->
                    val nextDest = when {
                        !isMpinSet -> {
                            sessionManager.saveOnboardingStage(OnboardingStage.OTP_VERIFIED)
                            "mpin/true"
                        }
                        else -> {
                            sessionManager.saveOnboardingStage(OnboardingStage.PROFILE_COMPLETED)
                            "mpin/false"
                        }
                    }
                    navController.navigate(nextDest) {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        // ── KYC ONBOARDING (3-step form) ─────────────────────────────────────
        composable("onboarding") {
            OnboardingScreen(
                onComplete = {
                    sessionManager.saveOnboardingStage(OnboardingStage.FULLY_VERIFIED)
                    navController.navigate("dashboard") {
                        popUpTo("onboarding") { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        // ── MPIN ─────────────────────────────────────────────────────────────
        composable(
            route = "mpin/{isNewUser}",
            arguments = listOf(navArgument("isNewUser") { type = NavType.BoolType }),
            enterTransition = { fadeIn(fadeSpec) }
        ) { backStackEntry ->
            val isNewUser = backStackEntry.arguments?.getBoolean("isNewUser") ?: false
            MpinScreen(
                isSetupMode = isNewUser,
                onMpinSuccess = {
                    val nextDest = if (isNewUser) {
                        sessionManager.saveOnboardingStage(OnboardingStage.MPIN_CREATED)
                        "profile_setup"
                    } else {
                        com.example.aishwaryam_android.AishwaryamApp.isMpinVerified = true
                        com.example.aishwaryam_android.AishwaryamApp.lastSelectedTab = 0
                        "dashboard"
                    }
                    navController.navigate(nextDest) {
                        popUpTo("mpin/{isNewUser}") { inclusive = true }
                    }
                },
                onResetMpinClick = {
                    sessionManager.clearSession()
                    navController.navigate("login") {
                        popUpTo("mpin/{isNewUser}") { inclusive = true }
                    }
                }
            )
        }

        // ── PROFILE SETUP ────────────────────────────────────────────────────
        composable("profile_setup") {
            val userId = sessionManager.getUserId() ?: ""
            ProfileSetupScreen(
                userId = userId,
                onSetupComplete = {
                    com.example.aishwaryam_android.AishwaryamApp.isMpinVerified = true
                    com.example.aishwaryam_android.AishwaryamApp.lastSelectedTab = 0
                    navController.navigate("dashboard") {
                        popUpTo("profile_setup") { inclusive = true }
                    }
                }
            )
        }

        // ── DASHBOARD ────────────────────────────────────────────────────────
        composable("dashboard") {
            val userId = sessionManager.getUserId() ?: ""
            DashboardScreen(
                userId = userId,
                onLogout = {
                    com.example.aishwaryam_android.AishwaryamApp.isMpinVerified = false
                    com.example.aishwaryam_android.AishwaryamApp.lastSelectedTab = 0
                    sessionManager.clearSession()
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                },
                onBuyClick      = { navController.navigate("buy_gold") },
                onSellClick     = { navController.navigate("sell_gold/0") },
                onKycClick      = { navController.navigate("onboarding") },
                onExploreSchemesClick = { navController.navigate("scheme_explorer") },
                onSchemeClick = { id -> navController.navigate("scheme_detail/$id") },
                onPaymentSuccess = { receiptJson ->
                    val encoded = java.net.URLEncoder.encode(receiptJson, "UTF-8")
                    navController.navigate("payment_success/$encoded")
                },
                onNavigateToInfo = { route -> navController.navigate(route) },
                onPortfolioAnalyticsClick = { navController.navigate("portfolio_analytics") }
            )
        }


        // ── SCHEME EXPLORER ──────────────────────────────────────────────────
        composable("scheme_explorer") {
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.schemes.SchemeExplorerScreen(
                userId = userId,
                onBackClick        = { navController.popBackStack() },
                onNavigateToKyc   = { navController.navigate("onboarding") },
                onJoinSuccess     = { navController.popBackStack() },
                onExploreDetails  = { schemeId -> navController.navigate("scheme_detail/$schemeId") }
            )
        }

        // ── BUY GOLD ─────────────────────────────────────────────────────────
        composable("buy_gold") {
            val userId = sessionManager.getUserId() ?: ""
            BuyGoldScreen(
                userId = userId,
                onBackClick = { navController.popBackStack() },
                onSuccess = { receiptJson ->
                    val encoded = java.net.URLEncoder.encode(receiptJson, "UTF-8")
                    navController.navigate("payment_success/$encoded") {
                        popUpTo("buy_gold") { inclusive = true }
                    }
                }
            )
        }

        // ── SELL GOLD ────────────────────────────────────────────────────────
        composable(
            route = "sell_gold/{initialBalanceMg}",
            arguments = listOf(navArgument("initialBalanceMg") { type = NavType.LongType })
        ) { backStackEntry ->
            val userId  = sessionManager.getUserId() ?: ""
            val balance = backStackEntry.arguments?.getLong("initialBalanceMg") ?: 0L
            SellGoldScreen(
                userId = userId,
                initialBalanceMg = balance,
                onBackClick = { navController.popBackStack() },
                onSuccess   = { navController.popBackStack() }
            )
        }

        // ── DIGI GOLD (Auto Saving Info) ─────────────────────────────────────
        composable("digi_gold") {
            DigiGoldScreen(onBackClick = { navController.popBackStack() })
        }

        // ── PAYMENT SUCCESS ──────────────────────────────────────────────────
        composable(
            route = "payment_success/{receiptJson}",
            arguments = listOf(navArgument("receiptJson") { type = NavType.StringType })
        ) { backStackEntry ->
            val encoded     = backStackEntry.arguments?.getString("receiptJson") ?: ""
            val receiptJson = java.net.URLDecoder.decode(encoded, "UTF-8")
            val dashboardViewModel: com.example.aishwaryam_android.ui.dashboard.DashboardViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            val dashboardState = dashboardViewModel.uiState.collectAsState().value
            val userName = dashboardState.userName ?: "Aishwaryam User"
            val userPhone = dashboardState.userPhone ?: ""
            val schemePlanName = dashboardState.schemePlanName ?: "Digital Metal Savings Plan"
            val activeSchemeId = dashboardState.schemeId

            PaymentSuccessScreen(
                receiptJson = receiptJson,
                userName = userName,
                userPhone = userPhone,
                schemeName = schemePlanName,
                livePricePaise = dashboardState.buyPricePaise,
                onViewPortfolioClick = {
                    navController.navigate("dashboard") {
                        popUpTo("payment_success/{receiptJson}") { inclusive = true }
                    }
                },
                onBackClick = {
                    val dest = if (!activeSchemeId.isNullOrEmpty()) "scheme_detail/$activeSchemeId" else "dashboard"
                    navController.navigate(dest) {
                        popUpTo("payment_success/{receiptJson}") { inclusive = true }
                    }
                }
            )
        }

        // ── PORTFOLIO ANALYTICS ─────────────────────────────────────────────
        composable("portfolio_analytics") {
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.portfolio.PortfolioAnalyticsScreen(
                userId = userId,
                onBackClick = { navController.popBackStack() }
            )
        }

        // ── SCHEME DETAIL ───────────────────────────────────────────────────
        composable(
            "scheme_detail/{schemeId}",
            arguments = listOf(navArgument("schemeId") { type = NavType.StringType })
        ) { backStackEntry ->
            val schemeId = backStackEntry.arguments?.getString("schemeId") ?: ""
            val userId = sessionManager.getUserId() ?: ""
            val activity = context as? com.example.aishwaryam_android.MainActivity
            val dashboardViewModel: com.example.aishwaryam_android.ui.dashboard.DashboardViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
            
            var scheme by remember { mutableStateOf<com.example.aishwaryam_android.network.AvailableScheme?>(null) }
            var isActive by remember { mutableStateOf(false) }
            var installmentsPaid by remember { mutableStateOf(0) }
            var schemeDayNumber by remember { mutableStateOf(0) }
            var nextDueDate by remember { mutableStateOf("") }
            var currentGoldPrice by remember { mutableStateOf(720000L) } // Fallback to 7200.00 paise
            var isLoading by remember { mutableStateOf(true) }
            
            var kycLevel by remember { mutableStateOf("BASIC") }
            var userPhone by remember { mutableStateOf("") }
            var userName by remember { mutableStateOf("") }

            LaunchedEffect(schemeId) {
                isLoading = true
                try {
                    // 1. Fetch live gold price
                    val priceRes = com.example.aishwaryam_android.network.ApiClient.apiService.getLivePrice()
                    if (priceRes.isSuccessful) {
                        priceRes.body()?.let {
                            currentGoldPrice = it.price22KPaise
                        }
                    }
                    
                    // 2. Fetch scheme dashboard to see if this scheme is the active one!
                    var userActiveScheme: com.example.aishwaryam_android.network.ActiveSchemeItem? = null
                    val dashboardRes = com.example.aishwaryam_android.network.ApiClient.apiService.getSchemeDashboard(userId)
                    if (dashboardRes.isSuccessful) {
                        dashboardRes.body()?.let { dash ->
                            userActiveScheme = dash.activeSchemes.find { 
                                it.schemeId == schemeId || schemeId == "active"
                            }
                        }
                    }
                    
                    // 3. Fetch available schemes to get details
                    val listRes = com.example.aishwaryam_android.network.ApiClient.apiService.getAvailableSchemes()
                    if (listRes.isSuccessful) {
                        val availableList = listRes.body() ?: emptyList()
                        var matchingScheme = availableList.find { it.id == schemeId }
                        
                        if (matchingScheme == null && userActiveScheme != null) {
                            matchingScheme = availableList.find { it.planName == userActiveScheme?.planName }
                        }
                        
                        // What if schemeId is master ID but user has already joined it?
                        // We check if any active scheme's planName matches the matchingScheme's planName
                        if (matchingScheme != null && userActiveScheme == null && dashboardRes.isSuccessful) {
                            dashboardRes.body()?.let { dash ->
                                userActiveScheme = dash.activeSchemes.find { it.planName == matchingScheme.planName }
                            }
                        }
                        
                        if (userActiveScheme != null) {
                            isActive = true
                            installmentsPaid = userActiveScheme!!.installmentsPaid
                            schemeDayNumber = userActiveScheme!!.schemeDayNumber
                            nextDueDate = userActiveScheme!!.nextDueDate ?: ""
                            
                            if (matchingScheme != null) {
                                scheme = matchingScheme.copy(id = userActiveScheme!!.schemeId)
                            } else {
                                // Fallback using active scheme details if not in available master list
                                scheme = com.example.aishwaryam_android.network.AvailableScheme(
                                    id = userActiveScheme!!.schemeId,
                                    planName = userActiveScheme!!.planName,
                                    description = "Your active gold savings scheme.",
                                    installmentAmountPaise = userActiveScheme!!.installmentAmountPaise,
                                    totalInstallments = userActiveScheme!!.totalInstallments,
                                    frequency = userActiveScheme!!.frequency,
                                    bonusConfigJson = null,
                                    customSectionsJson = null
                                )
                            }
                        } else {
                            isActive = false
                            if (matchingScheme != null) {
                                scheme = matchingScheme
                            }
                        }
                    }

                    // 4. Fetch profile for KYC and checkout fields
                    val profileRes = com.example.aishwaryam_android.network.ApiClient.apiService.getProfile(userId)
                    if (profileRes.isSuccessful) {
                        profileRes.body()?.let { prof ->
                            kycLevel = prof.kycLevel ?: "BASIC"
                            userPhone = prof.phoneNumber ?: ""
                            userName = prof.fullName ?: ""
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    isLoading = false
                }
            }
            
            LaunchedEffect(Unit) {
                dashboardViewModel.events.collect { event ->
                    when (event) {
                        is com.example.aishwaryam_android.ui.dashboard.DashboardEvent.NavigateToSuccess -> {
                            val encoded = java.net.URLEncoder.encode(event.receiptJson, "UTF-8")
                            navController.navigate("payment_success/$encoded") {
                                popUpTo("dashboard") { inclusive = false }
                            }
                        }
                        is com.example.aishwaryam_android.ui.dashboard.DashboardEvent.OperationSuccess -> {
                            navController.navigate("dashboard") {
                                popUpTo("dashboard") { inclusive = true }
                            }
                        }
                        else -> {}
                    }
                }
            }

            val currentScheme = scheme
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = androidx.compose.ui.Alignment.Center
                ) {
                    CircularProgressIndicator(color = com.example.aishwaryam_android.ui.theme.MagentaPrimary)
                }
            } else if (currentScheme != null) {
                com.example.aishwaryam_android.ui.schemes.SchemeDetailScreen(
                    scheme = currentScheme,
                    currentGoldPrice = currentGoldPrice,
                    isActive = isActive,
                    installmentsPaid = installmentsPaid,
                    schemeDayNumber = schemeDayNumber,
                    nextDueDate = nextDueDate,
                    kycLevel = kycLevel,
                    userPhone = userPhone,
                    userName = userName,
                    userId = userId,
                    isPaymentLoading = dashboardViewModel.uiState.collectAsState().value.isTransactionProcessing,
                    onBackClick = { navController.popBackStack() },
                    onJoinClick = { 
                        navController.navigate("scheme_explorer")
                    },
                    onRedeemClick = {
                        navController.navigate("scheme_redemption/${currentScheme.id}")
                    },
                    onKycClick = {
                        navController.navigate("onboarding")
                    },
                    onProceedWithJoin = { enableAutoPay, amountPaise ->
                        if (enableAutoPay) {
                            dashboardViewModel.createSubscription(
                                userId = userId,
                                schemeMasterId = currentScheme.id,
                                onReady = { subId, keyId ->
                                    activity?.startSubscription(
                                        subscriptionId = subId,
                                        keyId = keyId,
                                        userPhone = userPhone,
                                        userName = userName,
                                        onSuccess = { confirmedSubId ->
                                            dashboardViewModel.activateSubscription(userId, confirmedSubId, currentScheme.id)
                                        },
                                        onFailure = { errorMsg ->
                                            android.widget.Toast.makeText(context, "Subscription payment failed: $errorMsg", android.widget.Toast.LENGTH_LONG).show()
                                        }
                                    )
                                },
                                onFailure = { errorMsg ->
                                    android.widget.Toast.makeText(context, "Failed to initialize AutoPay: $errorMsg", android.widget.Toast.LENGTH_LONG).show()
                                }
                            )
                        } else {
                            dashboardViewModel.joinSchemeAndProceedToPayment(
                                userId = userId,
                                schemeMasterId = currentScheme.id,
                                installmentAmountPaise = amountPaise,
                                onFailure = { errorMsg ->
                                    android.widget.Toast.makeText(context, errorMsg, android.widget.Toast.LENGTH_LONG).show()
                                },
                                onSuccess = { order ->
                                    activity?.startPayment(
                                        orderId = order.orderId,
                                        amount = order.amount,
                                        keyId = order.keyId,
                                        userPhone = userPhone,
                                        userName = userName,
                                        onSuccess = { razorpayOrderId, razorpayPaymentId, razorpaySignature ->
                                            dashboardViewModel.verifyInstallmentPayment(
                                                userId = userId,
                                                orderId = razorpayOrderId,
                                                paymentId = razorpayPaymentId,
                                                signature = razorpaySignature
                                            )
                                        },
                                        onFailure = { _, _, _ -> }
                                    )
                                }
                            )
                        }
                    },
                    onPayClick = { amountPaise ->
                        dashboardViewModel.payInstallment(
                            userId = userId,
                            schemeId = currentScheme.id, // Use user scheme ID, not master scheme ID from route
                            amountPaise = amountPaise,
                            onFailure = { errorMsg ->
                                android.widget.Toast.makeText(context, errorMsg, android.widget.Toast.LENGTH_LONG).show()
                            },
                            onSuccess = { order ->
                                activity?.startPayment(
                                    orderId = order.orderId,
                                    amount = order.amount,
                                    keyId = order.keyId,
                                    userPhone = userPhone,
                                    userName = userName,
                                    onSuccess = { razorpayOrderId, razorpayPaymentId, razorpaySignature ->
                                        dashboardViewModel.verifyInstallmentPayment(
                                            userId = userId,
                                            orderId = razorpayOrderId,
                                            paymentId = razorpayPaymentId,
                                            signature = razorpaySignature
                                        )
                                    },
                                    onFailure = { _, _, _ -> }
                                )
                            }
                        )
                    }
                )
            } else {
                LaunchedEffect(Unit) {
                    navController.popBackStack()
                }
            }
        }

        // ── ADD BANK ACCOUNT ────────────────────────────────────────────────
        composable("add_bank_account") {
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.profile.AddBankAccountScreen(
                userId = userId,
                onBackClick = { navController.popBackStack() },
                onSuccess = { navController.popBackStack() }
            )
        }

        // ── SCHEME REDEMPTION ──────────────────────────────────────────────
        composable(
            route = "scheme_redemption/{schemeId}",
            arguments = listOf(navArgument("schemeId") { type = NavType.StringType })
        ) { backStackEntry ->
            val schemeId = backStackEntry.arguments?.getString("schemeId") ?: ""
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.schemes.SchemeRedemptionScreen(
                userId = userId,
                schemeId = schemeId,
                onBackClick = { navController.popBackStack() },
                onNavigateToAddBank = { navController.navigate("add_bank_account") },
                onRedeemSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }

        // ════════════════════════════════════════════════════════════════════
        // INFORMATIONAL / TRUST SCREENS (all with slide-in from right)
        // ════════════════════════════════════════════════════════════════════

        composable(
            "how_it_works",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            HowItWorksScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "faq",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            FaqScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "safety_trust",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            SafetyTrustScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "about",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            AboutScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "redemption_guide",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            RedemptionGuideScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "why_gold",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.info.WhyGoldScreen(onBackClick = { navController.popBackStack() })
        }

        composable(
            "digi_gold_info",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.gold.DigiGoldScreen(
                onBackClick = { navController.popBackStack() },
                onEnrollClick = { navController.navigate("scheme_explorer") }
            )
        }
        composable(
            "ai_assistant",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.info.AiAssistantScreen(
                onBackClick = { navController.popBackStack() },
                onContactSupportClick = {
                    val intent = android.content.Intent(android.content.Intent.ACTION_DIAL).apply {
                        data = android.net.Uri.parse("tel:+916369344158")
                    }
                    try { context.startActivity(intent) } catch (e: Exception) {
                        android.widget.Toast.makeText(context, "Support: +91 63693 44158", android.widget.Toast.LENGTH_LONG).show()
                    }
                }
            )
        }
        composable(
            "referral",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.rewards.ReferralScreen(
                userId = userId,
                onBackClick = { navController.popBackStack() }
            )
        }
        
        composable(
            "legal_hub",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.info.LegalHubScreen(
                onBackClick = { navController.popBackStack() }
            )
        }
        composable(
            "gold_rate_alerts",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.info.GoldRateAlertScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            "my_bonuses",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            val userId = sessionManager.getUserId() ?: ""
            com.example.aishwaryam_android.ui.rewards.BonusesScreen(
                userId = userId,
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            "notifications",
            enterTransition = {
                slideInHorizontally(slideSpec) { it } + fadeIn(slideFade)
            },
            exitTransition = {
                slideOutHorizontally(slideSpec) { it } + fadeOut(slideFade)
            }
        ) {
            com.example.aishwaryam_android.ui.notifications.NotificationsScreen(
                navController = navController
            )
        }
    }
}
