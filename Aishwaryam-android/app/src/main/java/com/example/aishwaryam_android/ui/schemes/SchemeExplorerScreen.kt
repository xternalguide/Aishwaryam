package com.example.aishwaryam_android.ui.schemes

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.AvailableScheme
import com.example.aishwaryam_android.ui.theme.PoppinsFamily
import com.example.aishwaryam_android.utils.LocaleHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray

// ── Colors ───────────────────────────────────────────────────────────────────
private val MagentaDark   = Color(0xFF4A0E4E)
private val MagentaAccent = Color(0xFFC2185B)
private val SurfaceBg     = Color(0xFFF4F6F4)
private val TextPrimary   = Color(0xFF1A1A2E)
private val TextMuted     = Color(0xFF6B7280)
private val GoldWarm      = Color(0xFFE8A83A)
private val GoldDark      = Color(0xFFB59424)

// ── Scheme gradient palettes (used as fallback when no poster image) ──────────
private val PALETTE_EMERALD = listOf(Color(0xFF0D3B2E), Color(0xFF1B6B4F), Color(0xFF2D9E72))
private val PALETTE_MAGENTA = listOf(Color(0xFF2C0E37), Color(0xFF50164D), Color(0xFF862464))
private val PALETTE_SLATE   = listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF334155))
private val PALETTE_AMBER   = listOf(Color(0xFF451A03), Color(0xFF92400E), Color(0xFFB45309))
private val PALETTE_NAVY    = listOf(Color(0xFF0C1B33), Color(0xFF1A3A6B), Color(0xFF2563EB))

private fun schemeGradient(name: String): Brush {
    val n = name.lowercase()
    val colors = when {
        n.contains("flex") || n.contains("daily") -> PALETTE_EMERALD
        n.contains("vip") || n.contains("premium") -> PALETTE_AMBER
        n.contains("monthly") || n.contains("maha") -> PALETTE_MAGENTA
        n.contains("test") -> PALETTE_SLATE
        else -> PALETTE_NAVY
    }
    return Brush.linearGradient(colors)
}

// ── Base64 → ImageBitmap converter (runs once, cached with remember) ─────────
private fun decodeBase64Image(b64: String?): ImageBitmap? {
    if (b64.isNullOrBlank()) return null
    return try {
        val cleaned = if (b64.contains(",")) b64.substringAfter(",") else b64
        val bytes = Base64.decode(cleaned, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.asImageBitmap()
    } catch (_: Exception) { null }
}

// ── Parse keywordsJson → List<String> ────────────────────────────────────────
private fun parseKeywords(json: String?): List<String> {
    if (json.isNullOrBlank()) return emptyList()
    return try {
        val arr = JSONArray(json)
        (0 until arr.length()).map { arr.optString(it) }.filter { it.isNotBlank() }.take(4)
    } catch (_: Exception) { emptyList() }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchemeExplorerScreen(
    userId: String,
    onBackClick: () -> Unit,
    onNavigateToKyc: () -> Unit,
    onJoinSuccess: () -> Unit,
    onExploreDetails: (String) -> Unit = { },
    viewModel: SchemeExplorerViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var showKycDialog by remember { mutableStateOf(false) }

    LaunchedEffect(userId) {
        viewModel.loadSchemesAndActivePlans(userId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    val isTamil = LocaleHelper.getSelectedLanguage(LocalContext.current) == "ta"
                    Column {
                        Text(if (isTamil) "சேமிப்பு திட்டங்கள்" else "Savings Schemes", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(if (isTamil) "சேமிக்க ஒரு திட்டத்தைத் தேர்வுசெய்க" else "Choose a plan to start saving", fontSize = 12.sp, color = TextMuted)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = SurfaceBg
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            if (state.isLoading) {
                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(
                    modifier = Modifier.align(Alignment.Center).size(100.dp)
                )
            } else if (state.schemes.isEmpty()) {
                // Empty state
                Column(
                    modifier = Modifier.align(Alignment.Center).padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("✨", fontSize = 48.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("No schemes available yet", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
                    Text("Check back soon for exciting gold saving plans!", fontSize = 13.sp, color = TextMuted, modifier = Modifier.padding(top = 8.dp))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    items(state.schemes) { scheme ->
                        val planNameClean = scheme.planName.trim().lowercase()
                        val isAlreadyJoined = state.activePlanNames.contains(planNameClean)
                        val installmentsPaid = state.activePlanPayments[planNameClean] ?: 0
                        SchemeCard(
                            scheme = scheme,
                            isAlreadyJoined = isAlreadyJoined,
                            installmentsPaid = installmentsPaid,
                            onClick = { onExploreDetails(scheme.id) }
                        )
                    }
                    item { Spacer(Modifier.height(8.dp)) }
                }
            }

            if (state.isJoining) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.3f))
                        .clickable(enabled = false) {},
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(60.dp))
                            Spacer(Modifier.height(16.dp))
                            Text("Joining Scheme...", fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }

    if (showKycDialog) {
        AlertDialog(
            onDismissRequest = { showKycDialog = false },
            icon = { Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = MagentaAccent, modifier = Modifier.size(48.dp)) },
            title = { Text("KYC Required", fontWeight = FontWeight.Bold) },
            text = { Text("To comply with government regulations, you must complete your KYC verification before joining a savings scheme.") },
            confirmButton = {
                Button(
                    onClick = { showKycDialog = false; onNavigateToKyc() },
                    colors = ButtonDefaults.buttonColors(containerColor = MagentaDark, contentColor = Color.White)
                ) { Text("Complete KYC Now", color = Color.White) }
            },
            dismissButton = {
                TextButton(onClick = { showKycDialog = false }) {
                    Text("Maybe Later", color = TextMuted)
                }
            },
            containerColor = Color.White,
            shape = RoundedCornerShape(24.dp)
        )
    }
}

@Composable
private fun SchemeCard(
    scheme: AvailableScheme,
    isAlreadyJoined: Boolean = false,
    installmentsPaid: Int = 0,
    onClick: () -> Unit
) {
    val isTamil = LocaleHelper.getSelectedLanguage(LocalContext.current) == "ta"
    val is11MonthPlan = scheme.totalInstallments == 11
    val isSilver = scheme.planName.lowercase().contains("silver")
    val isDaily = scheme.frequency.lowercase() == "daily"
    
    val badgeText = remember(scheme.keywordsJson, scheme.planName) {
        var text = if (is11MonthPlan) "Popular" else "High value"
        if (!scheme.keywordsJson.isNullOrBlank()) {
            try {
                val arr = JSONArray(scheme.keywordsJson)
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
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF22201F)),
        border = if (isAlreadyJoined) {
            BorderStroke(1.5.dp, if (isSilver) Color(0xFF90A4AE) else Color(0xFF1E88E5)) // Glowing Silver vs Blue border
        } else {
            BorderStroke(1.dp, Color.Gray.copy(alpha = 0.15f))
        }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header Row: Title & Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = scheme.planName,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    fontFamily = PoppinsFamily
                )
 
                // Badge decoration
                if (isAlreadyJoined) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background((if (isSilver) Color(0xFF90A4AE) else Color(0xFF1E88E5)).copy(alpha = 0.2f))
                            .border(1.dp, if (isSilver) Color(0xFF90A4AE) else Color(0xFF1E88E5), RoundedCornerShape(20.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Enrolled",
                            color = if (isSilver) Color(0xFFECEFF1) else Color(0xFF1E88E5),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (is11MonthPlan) Color(0xFF1A3A6B) else Color(0xFFFFF1C5))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = badgeText,
                            color = if (is11MonthPlan) Color.White else Color(0xFF6B4B1B),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
 
            // Subtitle
            Text(
                text = subtitleText,
                color = Color.Gray,
                fontSize = 13.sp,
                fontFamily = PoppinsFamily,
                modifier = Modifier.padding(top = 4.dp, bottom = 16.dp)
            )
 
            // Summary Table
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                TableRow(if (isTamil) "திட்ட இலக்கு" else "Plan Target", planTargetText)
                TableRow(if (isTamil) "போனஸ்" else "Bonus", bonusText)
                if (is11MonthPlan) {
                    TableRow(if (isTamil) "செயல்திறன் மதிப்பு" else "Effective value", "₹$totalAmount")
                }
                TableRow(if (isTamil) "மீட்பு முறை" else "Redeem as", redeemText)
            }
 
            // Progress Bar (After Join only)
            if (isAlreadyJoined) {
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))
                Spacer(Modifier.height(12.dp))
 
                Text(
                    text = if (isTamil) "முன்னேற்றம் ($installmentsPaid-ல் ${scheme.totalInstallments} செலுத்தப்பட்டது)" else "Progress ($installmentsPaid of ${scheme.totalInstallments} paid)",
                    color = Color.Gray,
                    fontSize = 12.sp,
                    fontFamily = PoppinsFamily
                )
 
                Spacer(Modifier.height(6.dp))
 
                val progressFraction = if (scheme.totalInstallments > 0) {
                    installmentsPaid.toFloat() / scheme.totalInstallments.toFloat()
                } else 0f
 
                LinearProgressIndicator(
                    progress = { progressFraction },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape),
                    color = if (isSilver) Color(0xFFB0BEC5) else Color(0xFF1E88E5), // Silver vs Active Blue Track
                    trackColor = Color(0xFF333333) // Muted Charcoal Background Track
                )
            }
        }
    }
}

@Composable
private fun TableRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = Color.Gray, fontSize = 13.sp, fontFamily = PoppinsFamily)
        Text(text = value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
    }
}


// ── ViewModel ─────────────────────────────────────────────────────────────────
class SchemeExplorerViewModel : ViewModel() {
    private val repository = DashboardRepository()
    private val _uiState = MutableStateFlow(SchemeExplorerState())
    val uiState: StateFlow<SchemeExplorerState> = _uiState

    init { loadSchemes() }

    fun loadSchemesAndActivePlans(userId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val activePlansSet = mutableSetOf<String>()
            val activePlanPaymentsMap = mutableMapOf<String, Int>()
            repository.getSchemeDashboard(userId).onSuccess { dashboard ->
                dashboard.activeSchemes.forEach { activeScheme ->
                    val name = activeScheme.planName.trim().lowercase()
                    activePlansSet.add(name)
                    activePlanPaymentsMap[name] = activeScheme.installmentsPaid
                }
                if (dashboard.hasActiveScheme) {
                    dashboard.planName?.let {
                        val name = it.trim().lowercase()
                        activePlansSet.add(name)
                        activePlanPaymentsMap[name] = dashboard.installmentsPaid ?: 0
                    }
                }
            }
            repository.getAvailableSchemes().onSuccess { list ->
                _uiState.value = _uiState.value.copy(
                    schemes = list,
                    activePlanNames = activePlansSet,
                    activePlanPayments = activePlanPaymentsMap,
                    isLoading = false
                )
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }

    private fun loadSchemes() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            repository.getAvailableSchemes().onSuccess { list ->
                _uiState.value = _uiState.value.copy(schemes = list, isLoading = false)
            }.onFailure {
                _uiState.value = _uiState.value.copy(isLoading = false, error = it.message)
            }
        }
    }

    fun joinScheme(userId: String, masterId: String, onKycRequired: () -> Unit, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isJoining = true, error = null)
            repository.joinScheme(userId, masterId).onSuccess {
                _uiState.value = _uiState.value.copy(isJoining = false)
                onSuccess()
            }.onFailure {
                _uiState.value = _uiState.value.copy(isJoining = false)
                if (it.message == "KYC_REQUIRED") onKycRequired()
                else _uiState.value = _uiState.value.copy(error = it.message)
            }
        }
    }
}

data class SchemeExplorerState(
    val schemes: List<AvailableScheme> = emptyList(),
    val activePlanNames: Set<String> = emptySet(),
    val activePlanPayments: Map<String, Int> = emptyMap(),
    val isLoading: Boolean = false,
    val isJoining: Boolean = false,
    val error: String? = null
)
