package com.example.aishwaryam_android.ui.rewards

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.network.TransactionItem
import com.example.aishwaryam_android.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BonusesScreen(
    userId: String,
    onBackClick: () -> Unit
) {
    var transactions by remember { mutableStateOf<List<TransactionItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedTab by remember { mutableStateOf(0) }

    var schemeLedgers by remember { mutableStateOf<Map<String, List<com.example.aishwaryam_android.network.SchemeLedgerItem>>>(emptyMap()) }

    LaunchedEffect(userId) {
        isLoading = true
        try {
            val response = com.example.aishwaryam_android.network.ApiClient.apiService.getRecentTransactions(userId)
            if (response.isSuccessful) {
                transactions = response.body() ?: emptyList()
            } else {
                errorMessage = "Failed to load bonus history"
            }
            
            // Prefetch active schemes and their ledgers
            val dashboardResponse = com.example.aishwaryam_android.network.ApiClient.apiService.getSchemeDashboard(userId)
            if (dashboardResponse.isSuccessful) {
                val dashboard = dashboardResponse.body()
                val activeSchemes = dashboard?.activeSchemes ?: emptyList()
                val tempMap = mutableMapOf<String, List<com.example.aishwaryam_android.network.SchemeLedgerItem>>()
                activeSchemes.forEach { activeScheme ->
                    val ledgerResponse = com.example.aishwaryam_android.network.ApiClient.apiService.getSchemeLedger(activeScheme.schemeId)
                    if (ledgerResponse.isSuccessful) {
                        val ledgerList = ledgerResponse.body() ?: emptyList()
                        tempMap[activeScheme.planName] = ledgerList
                    }
                }
                schemeLedgers = tempMap
            }
        } catch (e: Exception) {
            // Keep recent transactions, non-blocking for prefetch failure
        } finally {
            isLoading = false
        }
    }

    // Filter transactions
    // Tab 0: Event & Referral Bonuses (TransactionType == "EVENT_BONUS" or EVENT_BONUS/SIGNUP/REFERRAL in type/source)
    val eventBonuses = transactions.filter {
        it.type == "EVENT_BONUS" || 
        it.rateSource?.contains("BIRTHDAY", ignoreCase = true) == true ||
        it.rateSource?.contains("ANNIVERSARY", ignoreCase = true) == true ||
        it.rateSource?.contains("WORK", ignoreCase = true) == true ||
        it.rateSource?.contains("REFERRAL", ignoreCase = true) == true
    }

    // Tab 1: Scheme Loyalty Bonuses (type == "BONUS" and schemeName != null)
    val schemeBonuses = transactions.filter {
        (it.type == "BONUS" || it.type == "SCHEME_REWARD") && !it.schemeName.isNullOrEmpty()
    }

    val totalEventGold = eventBonuses.sumOf { it.goldWeightMg }
    val totalSchemeGold = schemeBonuses.sumOf { it.goldWeightMg }
    val grandTotalGold = totalEventGold + totalSchemeGold

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        stringResource(R.string.my_bonuses),
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        color = BrandDeep
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = BrandDeep
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF9FAFA)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Total Bonus Summary Header Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(BrandDeep, Color(0xFF6B1B70))
                        )
                    )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Stars,
                        contentDescription = null,
                        tint = GoldWarm,
                        modifier = Modifier.size(40.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        stringResource(R.string.total_bonus_gold),
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 14.sp,
                        fontFamily = PoppinsFamily
                    )
                    Text(
                        text = String.format(Locale.US, "%,.2f mg", grandTotalGold.toDouble()),
                        color = GoldWarm,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = PoppinsFamily
                    )
                    if (grandTotalGold > 0) {
                        Text(
                            text = String.format(Locale.US, "≈ %.4f g of 22K Gold", grandTotalGold.toDouble() / 1000.0),
                            color = Color.White.copy(alpha = 0.6f),
                            fontSize = 12.sp,
                            fontFamily = PoppinsFamily
                        )
                    }
                }
            }

            // Tab Row
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.Transparent,
                contentColor = BrandDeep,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = BrandAccent
                    )
                },
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Text(
                            stringResource(R.string.special_event_referral_bonuses),
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp,
                            fontFamily = PoppinsFamily
                        )
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Text(
                            stringResource(R.string.scheme_loyalty_bonuses),
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp,
                            fontFamily = PoppinsFamily
                        )
                    }
                )
            }

            Spacer(Modifier.height(8.dp))

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = MagentaPrimary)
                }
            } else if (errorMessage != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color.Red, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(16.dp))
                        Text(errorMessage!!, color = Color.Gray, textAlign = TextAlign.Center)
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                ) {
                    if (selectedTab == 0) {
                        if (eventBonuses.isEmpty()) {
                            EmptyBonusState()
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(eventBonuses) { item ->
                                    EventBonusItemCard(item)
                                }
                            }
                        }
                    } else {
                        if (schemeBonuses.isEmpty()) {
                            EmptyBonusState()
                        } else {
                            // Group scheme bonuses by schemeName
                            val grouped = schemeBonuses.groupBy { it.schemeName ?: "Loyalty Rewards" }
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                items(grouped.keys.toList()) { schemeName ->
                                    val itemsInGroup = grouped[schemeName] ?: emptyList()
                                    SchemeGroupCard(
                                        schemeName = schemeName,
                                        items = itemsInGroup,
                                        ledgerItems = schemeLedgers[schemeName]
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyBonusState() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                Icons.Default.WorkspacePremium,
                contentDescription = null,
                tint = Color.LightGray,
                modifier = Modifier.size(64.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text(
                stringResource(R.string.no_bonuses_yet),
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Medium,
                fontSize = 16.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun EventBonusItemCard(item: TransactionItem) {
    val rateSource = item.rateSource ?: ""
    val title = when {
        rateSource.contains("BIRTHDAY", ignoreCase = true) -> stringResource(R.string.birthday_bonus)
        rateSource.contains("ANNIVERSARY", ignoreCase = true) -> stringResource(R.string.anniversary_bonus)
        rateSource.contains("WORK", ignoreCase = true) -> stringResource(R.string.work_joining_bonus)
        rateSource.contains("REFERRAL_SIGNUP", ignoreCase = true) -> stringResource(R.string.referral_bonus) + " (Signup)"
        rateSource.startsWith("REFERRAL_BONUS:", ignoreCase = true) -> {
            val friendName = rateSource.substringAfter("REFERRAL_BONUS:")
            stringResource(R.string.referral_bonus) + " (Friend $friendName joined)"
        }
        else -> "Event Special Reward"
    }

    val displayDate = try {
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        val formatter = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US)
        parser.parse(item.createdAt)?.let { formatter.format(it) } ?: item.createdAt
    } catch (e: Exception) {
        item.createdAt
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        shadowElevation = 2.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(GoldWarm.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.CardGiftcard,
                    contentDescription = null,
                    tint = BrandAccent,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = BrandDeep,
                    fontFamily = PoppinsFamily
                )
                Text(
                    text = displayDate,
                    fontSize = 12.sp,
                    color = TextMuted,
                    fontFamily = PoppinsFamily
                )
            }
            Text(
                text = String.format(Locale.US, "+%d mg", item.goldWeightMg),
                color = TrustGreen,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                fontFamily = PoppinsFamily
            )
        }
    }
}

@Composable
fun SchemeGroupCard(
    schemeName: String, 
    items: List<TransactionItem>,
    ledgerItems: List<com.example.aishwaryam_android.network.SchemeLedgerItem>?
) {
    var isExpanded by remember { mutableStateOf(false) }
    val totalMg = items.sumOf { it.goldWeightMg }
    val isTamil = Locale.getDefault().language == "ta"
    val isSilver = schemeName.lowercase().contains("silver")
    val metalSuffix = if (isSilver) "g Ag" else "g Au"

    fun paiseToRupees(paise: Long): String {
        val fmt = java.text.NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        return fmt.format(paise / 100.0)
    }

    fun mgToGrams(mg: Long): String = String.format(Locale.US, "%.3f", mg / 1000.0)

    fun getLocalizedText(ta: String, en: String): String {
        return if (isTamil) ta else en
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { isExpanded = !isExpanded }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(BrandDeep.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.WorkspacePremium,
                        contentDescription = null,
                        tint = BrandDeep,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = schemeName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = BrandDeep,
                        fontFamily = PoppinsFamily
                    )
                    Text(
                        text = "${items.size} bonus additions",
                        fontSize = 12.sp,
                        color = TextMuted,
                        fontFamily = PoppinsFamily
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = String.format(Locale.US, "+%d mg", totalMg),
                        color = TrustGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        fontFamily = PoppinsFamily
                    )
                    Text(
                        text = if (isExpanded) "Hide details" else "Show details",
                        fontSize = 11.sp,
                        color = BrandAccent,
                        fontFamily = PoppinsFamily
                    )
                }
            }

            AnimatedVisibility(visible = isExpanded) {
                Column {
                    Spacer(Modifier.height(16.dp))
                    Divider(color = Color.LightGray.copy(alpha = 0.5f))
                    Spacer(Modifier.height(12.dp))

                    val tableHeaders = listOf(
                        getLocalizedText("தேதி", "Date"),
                        getLocalizedText("தொகை", "Amount"),
                        getLocalizedText("வாங்கியது", "Bought"),
                        getLocalizedText("போனஸ்", "Bonus")
                    )

                    // Table Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BrandDeep.copy(alpha = 0.06f), shape = RoundedCornerShape(8.dp))
                            .padding(vertical = 10.dp, horizontal = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        tableHeaders.forEachIndexed { index, header ->
                            Text(
                                text = header,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = BrandDeep,
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

                    if (ledgerItems != null && ledgerItems.isNotEmpty()) {
                        // Render using rich SchemeLedgerItem list
                        ledgerItems.forEach { ledgerItem ->
                            val displayDate = try {
                                val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
                                val formatter = SimpleDateFormat("dd MMM yyyy", Locale.US)
                                parser.parse(ledgerItem.createdAt)?.let { formatter.format(it) } ?: ledgerItem.createdAt
                            } catch (e: Exception) {
                                ledgerItem.createdAt.take(10)
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 10.dp, horizontal = 12.dp),
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
                                Text(
                                    text = paiseToRupees(ledgerItem.amountPaise),
                                    fontSize = 12.sp,
                                    color = BrandDeep,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Center,
                                    fontFamily = PoppinsFamily
                                )
                                // Bought
                                Text(
                                    text = "${mgToGrams(ledgerItem.goldWeightMg)} $metalSuffix",
                                    fontSize = 12.sp,
                                    color = BrandDeep,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Center,
                                    fontFamily = PoppinsFamily
                                )
                                // Bonus
                                Text(
                                    text = "+${mgToGrams(ledgerItem.bonusGoldMg)} $metalSuffix",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TrustGreen,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.End,
                                    fontFamily = PoppinsFamily
                                )
                            }
                        }
                    } else {
                        // Fallback using TransactionItems
                        items.forEach { item ->
                            val displayDate = try {
                                val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
                                val formatter = SimpleDateFormat("dd MMM yyyy", Locale.US)
                                parser.parse(item.createdAt)?.let { formatter.format(it) } ?: item.createdAt
                            } catch (e: Exception) {
                                item.createdAt
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 10.dp, horizontal = 12.dp),
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
                                Text(
                                    text = paiseToRupees(item.amountPaise),
                                    fontSize = 12.sp,
                                    color = BrandDeep,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Center,
                                    fontFamily = PoppinsFamily
                                )
                                // Bought (derived/placeholder for fallback)
                                Text(
                                    text = if (item.amountPaise > 0) "Installment" else "Gifted",
                                    fontSize = 12.sp,
                                    color = BrandDeep,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Center,
                                    fontFamily = PoppinsFamily
                                )
                                // Bonus
                                Text(
                                    text = "+${mgToGrams(item.goldWeightMg)} $metalSuffix",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TrustGreen,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.End,
                                    fontFamily = PoppinsFamily
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
