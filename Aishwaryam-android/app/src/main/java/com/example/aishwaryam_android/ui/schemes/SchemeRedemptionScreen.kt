package com.example.aishwaryam_android.ui.schemes

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.network.BankAccountDto
import com.example.aishwaryam_android.network.SchemeProgressResponse
import com.example.aishwaryam_android.ui.theme.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchemeRedemptionScreen(
    userId: String,
    schemeId: String,
    onBackClick: () -> Unit,
    onNavigateToAddBank: () -> Unit,
    onRedeemSuccess: () -> Unit,
    viewModel: SchemeRedemptionViewModel = viewModel()
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()

    var redemptionType by remember { mutableStateOf("CASH") } // CASH | DELIVERY | JEWELLERY
    var deliveryAddress by remember { mutableStateOf("") }
    
    val isTamil = remember { Locale.getDefault().language == "ta" }

    LaunchedEffect(userId, schemeId) {
        viewModel.loadRedemptionData(userId, schemeId)
    }

    LaunchedEffect(state.isSuccess) {
        if (state.isSuccess) {
            Toast.makeText(
                context,
                if (isTamil) "மீட்பு கோரிக்கை வெற்றிகரமாகச் சமர்ப்பிக்கப்பட்டது!" else "Redemption request submitted successfully!",
                Toast.LENGTH_LONG
            ).show()
            onRedeemSuccess()
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isTamil) "திட்டத்தை மீட்டெடுங்கள்" else "Redeem Matured Plan",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF8F9FA)
    ) { padding ->
        if (state.isLoading) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF4A0E4E))
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(top = 16.dp, bottom = 32.dp)
            ) {
                // Gold breakdown card
                item {
                    val progress = state.progress
                    val isSilver = progress?.planName?.lowercase()?.contains("silver") == true
                    val totalGold = progress?.accumulatedGoldMg ?: 0L
                    val schemeBonus = progress?.totalBonusGoldMg ?: 0L
                    
                    // Simple split calculation (75% base, 15% scheme bonus, 10% special promotional/campaign event bonus)
                    val baseSavings = (totalGold * 0.75).toLong()
                    val specialEventBonus = (totalGold * 0.10).toLong()
                    
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF22201F)),
                        border = BorderStroke(1.dp, Color.Gray.copy(alpha = 0.2f))
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Celebration, null, tint = Color(0xFFFFD700), modifier = Modifier.size(24.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    text = if (isTamil) "முதிர்வு தங்க விவரம்" else "Matured Gold Summary",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    fontFamily = PoppinsFamily
                                )
                            }
                            Spacer(Modifier.height(16.dp))

                            RedemptionRow("Base Gold Saved", mgToGrams(baseSavings, isSilver))
                            RedemptionRow("Scheme Loyalty Bonus", "+ " + mgToGrams(schemeBonus, isSilver))
                            RedemptionRow("Special Birthday & Admin Bonus", "+ " + mgToGrams(specialEventBonus, isSilver))
                            
                            Spacer(Modifier.height(12.dp))
                            HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))
                            Spacer(Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isTamil) "மொத்த மீட்டெடுப்பு தங்கம்" else "Total Redeeming Gold",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    fontFamily = PoppinsFamily
                                )
                                Text(
                                    text = mgToGrams(totalGold + schemeBonus + specialEventBonus, isSilver),
                                    color = Color(0xFFFFD700),
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 18.sp,
                                    fontFamily = PoppinsFamily
                                )
                            }
                        }
                    }
                }

                // Choose payout channel title
                item {
                    Text(
                        text = if (isTamil) "மீட்பு முறையைத் தேர்ந்தெடுக்கவும்:" else "Select Redemption Method:",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        fontFamily = PoppinsFamily,
                        color = Color.Black,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                // CASH channel option
                item {
                    RedemptionChannelCard(
                        title = if (isTamil) "வங்கி கணக்கிற்கு பணம்" else "Cash Payout to Bank Account",
                        desc = if (isTamil) "தங்கத்தை விற்று பணமாக வங்கி கணக்கில் பெற்றுக்கொள்ளவும்." else "Liquidate gold at the live market price and transfer money.",
                        selected = redemptionType == "CASH",
                        onClick = { redemptionType = "CASH" }
                    )
                }

                // Dynamic Bank link status for CASH
                if (redemptionType == "CASH") {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.5f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                if (state.bankAccounts.isEmpty()) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = if (isTamil) "வங்கி கணக்கு இணைக்கப்படவில்லை" else "No Bank Account Linked",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                fontFamily = PoppinsFamily,
                                                color = Color.Red
                                            )
                                            Text(
                                                text = if (isTamil) "பணத்தைப் பெற வங்கி கணக்கை இணைக்கவும்." else "Please link a bank account to receive the cash payout.",
                                                fontSize = 11.sp,
                                                fontFamily = PoppinsFamily,
                                                color = Color.Gray
                                            )
                                        }
                                        Button(
                                            onClick = onNavigateToAddBank,
                                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A0E4E)),
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text(if (isTamil) "சேர்க்க" else "Link Account", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                } else {
                                    val activeAccount = state.bankAccounts.first()
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.AccountBalance, null, tint = Color(0xFF4CAF50), modifier = Modifier.size(24.dp))
                                        Spacer(Modifier.width(12.dp))
                                        Column {
                                            Text(
                                                text = activeAccount.bankName,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                fontFamily = PoppinsFamily,
                                                color = Color.Black
                                            )
                                            Text(
                                                text = "A/C: ${activeAccount.accountNumberMasked} · IFSC: ${activeAccount.ifscCode}",
                                                fontSize = 11.sp,
                                                fontFamily = PoppinsFamily,
                                                color = Color.Gray
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // JEWELLERY channel option
                item {
                    RedemptionChannelCard(
                        title = if (isTamil) "நகைக்கடையில் நகை சேகரிப்பு" else "Showroom Jewelry Collection",
                        desc = if (isTamil) "கூட்டாளர் நகைக்கடைகளில் இருந்து உங்கள் தங்கத்தை அழகான நகைகளாகப் பெற்றுக்கொள்ளவும்." else "Collect physical jewelry at partner showrooms with 0% wastage.",
                        selected = redemptionType == "JEWELLERY",
                        onClick = { redemptionType = "JEWELLERY" }
                    )
                }

                // DELIVERY channel option
                item {
                    RedemptionChannelCard(
                        title = if (isTamil) "தங்க நாணயம் வீட்டு விநியோகம்" else "Secure Doorstep Gold Delivery",
                        desc = if (isTamil) "தூய தங்க நாணயங்கள் அல்லது பிஸ்கட்கள் காப்பீடு செய்யப்பட்டு வீட்டிற்கே விநியோகிக்கப்படும்." else "Receive insured physical gold coins delivered securely to your doorstep.",
                        selected = redemptionType == "DELIVERY",
                        onClick = { redemptionType = "DELIVERY" }
                    )
                }

                // Delivery address input if chosen
                if (redemptionType == "DELIVERY") {
                    item {
                        OutlinedTextField(
                            value = deliveryAddress,
                            onValueChange = { deliveryAddress = it },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            label = { Text(if (isTamil) "விநியோக முகவரி" else "Enter Delivery Address") },
                            minLines = 2,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF4A0E4E),
                                unfocusedBorderColor = Color.LightGray
                            )
                        )
                    }
                }

                // Submit Button
                item {
                    Spacer(Modifier.height(8.dp))
                    
                    val canSubmit = (redemptionType != "CASH" || state.bankAccounts.isNotEmpty()) &&
                            (redemptionType != "DELIVERY" || deliveryAddress.isNotBlank())

                    Button(
                        onClick = {
                            viewModel.redeemMaturedScheme(
                                userId = userId,
                                schemeId = schemeId,
                                type = redemptionType,
                                address = if (redemptionType == "DELIVERY") deliveryAddress else null
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF4A0E4E),
                            contentColor = Color.White
                        ),
                        enabled = canSubmit && !state.isSubmitting
                    ) {
                        if (state.isSubmitting) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text(
                                text = if (isTamil) "மீட்பு கோரிக்கையைச் சமர்ப்பி" else "Confirm & Submit Redemption",
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
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
private fun RedemptionRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = Color.Gray, fontSize = 13.sp, fontFamily = PoppinsFamily)
        Text(text = value, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold, fontFamily = PoppinsFamily)
    }
}

@Composable
private fun RedemptionChannelCard(
    title: String,
    desc: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(
                1.dp,
                if (selected) Color(0xFF4A0E4E) else Color.LightGray.copy(alpha = 0.5f),
                RoundedCornerShape(16.dp)
            )
            .background(if (selected) Color(0xFFFDFBFE) else Color.White)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = selected,
            onClick = onClick,
            colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF4A0E4E))
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = Color.Black,
                fontFamily = PoppinsFamily
            )
            Text(
                text = desc,
                fontSize = 11.sp,
                color = Color.Gray,
                fontFamily = PoppinsFamily
            )
        }
    }
}

class SchemeRedemptionViewModel : ViewModel() {
    private val repository = DashboardRepository()
    private val _uiState = MutableStateFlow(SchemeRedemptionState())
    val uiState: StateFlow<SchemeRedemptionState> = _uiState

    fun loadRedemptionData(userId: String, schemeId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val accountsResult = repository.getBankAccounts(userId)
            val progressResult = repository.getSchemeProgress(schemeId)

            if (progressResult.isSuccess) {
                val bankList = accountsResult.getOrDefault(emptyList())
                val progress = progressResult.getOrThrow()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    bankAccounts = bankList,
                    progress = progress
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = progressResult.exceptionOrNull()?.message ?: "Failed to load matured scheme data"
                )
            }
        }
    }

    fun redeemMaturedScheme(userId: String, schemeId: String, type: String, address: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            repository.requestRedemption(userId, schemeId, type, address)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, isSuccess = true)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isSubmitting = false, error = it.message ?: "Redemption failed")
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class SchemeRedemptionState(
    val isLoading: Boolean = false,
    val bankAccounts: List<BankAccountDto> = emptyList(),
    val progress: SchemeProgressResponse? = null,
    val isSubmitting: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

// Helpers mapped locally to prevent formatting differences
private fun paiseToRupees(paise: Long): String {
    val amount = paise / 100.0
    val format = java.text.NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    return format.format(amount)
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
