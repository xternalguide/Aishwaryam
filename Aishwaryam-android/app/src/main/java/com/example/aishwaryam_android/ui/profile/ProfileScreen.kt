package com.example.aishwaryam_android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.HeadsetMic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.material.icons.filled.Article
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext
import com.example.aishwaryam_android.utils.LocaleHelper
import com.example.aishwaryam_android.utils.TranslationManager
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.CompletableDeferred
import com.example.aishwaryam_android.ui.components.AutoSizeText


fun formatDobInput(input: String): String {
    val clean = input.replace("/", "").take(8)
    val sb = java.lang.StringBuilder()
    for (i in clean.indices) {
        sb.append(clean[i])
        if ((i == 1 || i == 3) && i != clean.lastIndex) sb.append("/")
    }
    return sb.toString()
}

fun isValidIndianDate(dateStr: String): Boolean {
    if (dateStr.length != 10) return false
    val parts = dateStr.split("/")
    if (parts.size != 3) return false
    val d = parts[0].toIntOrNull() ?: return false
    val m = parts[1].toIntOrNull() ?: return false
    val y = parts[2].toIntOrNull() ?: return false
    if (y < 1900 || y > java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)) return false
    if (m < 1 || m > 12) return false
    val days = when (m) {
        2 -> if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)) 29 else 28
        4, 6, 9, 11 -> 30
        else -> 31
    }
    return d in 1..days
}

// ── Professional FinTech Color tokens ─────────────────────────────────────
private val MagentaPrimary = Color(0xFF4A0E4E) // Deep Wine
private val MagentaSecondary = Color(0xFF880E4F) // Muted Magenta
private val MagentaAccent = Color(0xFFC2185B) // Bright Magenta
private val SurfaceLight = Color(0xFFF8F9FA) // Clean White/Grey
private val TextPrimary = Color(0xFF1A1A1A)
private val TextMuted = Color(0xFF666666)

val sheetTextFieldColors = @Composable {
    OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.Black,
        unfocusedTextColor = Color.Black,
        disabledTextColor = Color.Black,
        focusedBorderColor = MagentaPrimary,
        unfocusedBorderColor = Color.LightGray,
        disabledBorderColor = Color.LightGray,
        focusedLabelColor = MagentaPrimary,
        unfocusedLabelColor = Color.Gray,
        disabledLabelColor = Color.Gray,
        cursorColor = MagentaPrimary
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    userId: String,
    onLogoutClick: () -> Unit,
    onNavigateToInfo: (String) -> Unit = {},
    viewModel: ProfileViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    
    var showEditProfileSheet by remember { mutableStateOf(false) }
    var showSecuritySheet by remember { mutableStateOf(false) }
    var showBankAccountsSheet by remember { mutableStateOf(false) }
    var showChangeMpinSheet by remember { mutableStateOf(false) }
    var showKycSheet by remember { mutableStateOf(false) }
    var showDeleteConfirmation by remember { mutableStateOf(false) }
    
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val coroutineScope = rememberCoroutineScope()

    var isTamil by remember {
        mutableStateOf(LocaleHelper.getSelectedLanguage(context) == "ta")
    }
    var isTranslating by remember { mutableStateOf(false) }

    LaunchedEffect(state.profile?.preferredLanguage) {
        val backendLang = state.profile?.preferredLanguage
        if (!backendLang.isNullOrEmpty()) {
            val currentLang = LocaleHelper.getSelectedLanguage(context)
            if (currentLang != backendLang) {
                TranslationManager.setLanguage(context, backendLang)
                LocaleHelper.setLocale(context, backendLang)
                isTamil = (backendLang == "ta")
            }
        }
    }

    LaunchedEffect(userId) {
        viewModel.loadProfile(userId)
        viewModel.loadBankAccounts(userId)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceLight)
    ) {
        // Premium Header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Brush.linearGradient(listOf(MagentaPrimary, MagentaSecondary)))
                    .padding(top = 48.dp, bottom = 48.dp, start = 24.dp, end = 24.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Profile Avatar
                    Surface(
                        modifier = Modifier
                            .size(100.dp)
                            .shadow(16.dp, CircleShape),
                        shape = CircleShape,
                        color = Color.White
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = state.profile?.fullName?.take(1)?.uppercase() ?: "U",
                                fontSize = 40.sp,
                                fontWeight = FontWeight.Black,
                                color = MagentaPrimary
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    if (state.isLoading) {
                        com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(24.dp))
                    } else {
                        Text(
                            text = state.profile?.fullName ?: "Guest User",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            text = state.profile?.phoneNumber ?: "+91 00000 00000",
                            fontSize = 15.sp,
                            color = Color.White.copy(alpha = 0.8f),
                            fontWeight = FontWeight.Medium
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // KYC Badge
                        Surface(
                            color = Color.White.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.clickable { showKycSheet = true },
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.VerifiedUser, 
                                    null, 
                                    tint = Color.White, 
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(Modifier.width(8.dp))
                                AutoSizeText(
                                    text = "${stringResource(R.string.kyc_verification)}: ${state.profile?.kycLevel ?: stringResource(R.string.pending)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }

        // Settings Content
        item {
            Column(modifier = Modifier.padding(20.dp)) {
                SectionTitle(stringResource(R.string.account_settings))
                
                Card(
                    modifier = Modifier.fillMaxWidth().shadow(4.dp, RoundedCornerShape(24.dp)),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column {
                        ProfileMenuRow(icon = Icons.Default.AccountCircle, title = stringResource(R.string.personal_info)) {
                            showEditProfileSheet = true
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Payment, title = stringResource(R.string.bank_accounts)) {
                            showBankAccountsSheet = true
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Shield, title = stringResource(R.string.security_mpin)) {
                            showSecuritySheet = true
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(32.dp))

                // ── Learn & Trust Hub ─────────────────────────────────────
                SectionTitle(stringResource(R.string.learn_trust_hub))

                Card(
                    modifier = Modifier.fillMaxWidth().shadow(4.dp, RoundedCornerShape(24.dp)),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column {
                        ProfileMenuRow(icon = Icons.Default.Star, title = stringResource(R.string.why_save_gold)) {
                            onNavigateToInfo("why_gold")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.TrendingUp, title = stringResource(R.string.digigold_savings)) {
                            onNavigateToInfo("digi_gold_info")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Info, title = stringResource(R.string.how_it_works_menu)) {
                            onNavigateToInfo("how_it_works")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.QuestionAnswer, title = stringResource(R.string.faq_common_questions)) {
                            onNavigateToInfo("ai_assistant")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Shield, title = stringResource(R.string.safety_gold_security)) {
                            onNavigateToInfo("safety_trust")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.EmojiEvents, title = stringResource(R.string.redeeming_your_gold)) {
                            onNavigateToInfo("redemption_guide")
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Apartment, title = stringResource(R.string.about_aishwaryam)) {
                            onNavigateToInfo("about")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                SectionTitle(stringResource(R.string.more))

                Card(
                    modifier = Modifier.fillMaxWidth().shadow(4.dp, RoundedCornerShape(24.dp)),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column {
                        // ── Language Toggle Switch ────────────────────────────
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 20.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Icon
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(MagentaPrimary.copy(alpha = 0.08f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Translate,
                                    contentDescription = null,
                                    tint = MagentaPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))

                            // Label + sub-label
                            Column(modifier = Modifier.weight(1f)) {
                                AutoSizeText(
                                    text = stringResource(R.string.language),
                                    fontSize = 16.sp,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1
                                )
                                AutoSizeText(
                                    text = if (isTamil) "தமிழ் (Tamil)" else "English",
                                    fontSize = 12.sp,
                                    color = TextMuted,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                            }

                            // EN label
                            AutoSizeText(
                                text = "EN",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (!isTamil) MagentaPrimary else TextMuted,
                                maxLines = 1
                            )
                            Spacer(modifier = Modifier.width(6.dp))

                            // The toggle switch
                            Switch(
                                checked = isTamil,
                                onCheckedChange = { enabled ->
                                    val nextLang = if (enabled) "ta" else "en"
                                    if (nextLang == "ta") {
                                        // English → Tamil: show loading, save to backend first, THEN switch locale
                                        isTranslating = true
                                        coroutineScope.launch {
                                            val startTime = System.currentTimeMillis()
                                            // Use CompletableDeferred to truly await the backend call
                                            val done = CompletableDeferred<Unit>()
                                            viewModel.updateProfile(
                                                userId = userId,
                                                preferredLanguage = nextLang,
                                                onSuccess = { done.complete(Unit) },
                                                onError = { done.complete(Unit) } // proceed even on error
                                            )
                                            done.await()
                                            // Ensure minimum 1.5s display
                                            val elapsed = System.currentTimeMillis() - startTime
                                            if (elapsed < 1500L) delay(1500L - elapsed)
                                            // Now apply locale — activity recreates here
                                            isTamil = true
                                            TranslationManager.setLanguage(context, nextLang)
                                            LocaleHelper.setLocale(context, nextLang)
                                            isTranslating = false
                                        }
                                    } else {
                                        // Tamil → English: no loading spinner, save then switch
                                        isTamil = false
                                        coroutineScope.launch {
                                            val done = CompletableDeferred<Unit>()
                                            viewModel.updateProfile(
                                                userId = userId,
                                                preferredLanguage = nextLang,
                                                onSuccess = { done.complete(Unit) },
                                                onError = { done.complete(Unit) }
                                            )
                                            done.await()
                                            TranslationManager.setLanguage(context, nextLang)
                                            LocaleHelper.setLocale(context, nextLang)
                                        }
                                    }
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = MagentaPrimary,
                                    uncheckedThumbColor = Color.White,
                                    uncheckedTrackColor = Color.LightGray.copy(alpha = 0.5f)
                                )
                            )

                            Spacer(modifier = Modifier.width(6.dp))
                            // தமிழ் label
                            AutoSizeText(
                                text = "தமிழ்",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isTamil) MagentaPrimary else TextMuted,
                                maxLines = 1
                            )
                        }
                        // ─────────────────────────────────────────────────────

                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.HeadsetMic, title = stringResource(R.string.help_support)) {
                            val intent = android.content.Intent(android.content.Intent.ACTION_DIAL).apply {
                                data = android.net.Uri.parse("tel:+919443000000")
                            }
                            try { context.startActivity(intent) } catch (e: Exception) {
                                Toast.makeText(context, "Support: +91 94430 00000", Toast.LENGTH_LONG).show()
                            }
                        }
                        HorizontalDivider(color = SurfaceLight, thickness = 1.dp)
                        ProfileMenuRow(icon = Icons.Default.Description, title = stringResource(R.string.legal_hub_title)) {
                            onNavigateToInfo("legal_hub")
                        }
                    }
                }

                
                Spacer(modifier = Modifier.height(48.dp))
                
                // Logout Button
                Button(
                    onClick = onLogoutClick,
                    modifier = Modifier.fillMaxWidth().height(60.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFEBEE)),
                    shape = RoundedCornerShape(18.dp),
                    border = BorderStroke(1.dp, Color(0xFFFFCDD2))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, null, tint = Color(0xFFC62828), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(12.dp))
                        Text(stringResource(R.string.logout), color = Color(0xFFC62828), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))

                // Delete Account Compliance Button (Google Play User Data Requirement)
                OutlinedButton(
                    onClick = { showDeleteConfirmation = true },
                    modifier = Modifier.fillMaxWidth().height(60.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFC62828)),
                    shape = RoundedCornerShape(18.dp),
                    border = BorderStroke(1.dp, Color(0xFFFFCDD2).copy(alpha = 0.5f))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Lock, 
                            contentDescription = null, 
                            tint = Color(0xFFC62828), 
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Text(
                            text = if (isTamil) "கணக்கை நீக்கு" else "Delete Account", 
                            color = Color(0xFFC62828), 
                            fontSize = 15.sp, 
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(40.dp))
            }
        }
    }

    // Google Play Compliance - Account Deletion Dialog
    if (showDeleteConfirmation) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmation = false },
            title = {
                Text(
                    text = if (isTamil) "கணக்கை நிரந்தரமாக நீக்க வேண்டுமா?" else "Delete Account Permanently?",
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
            },
            text = {
                Text(
                    text = if (isTamil) 
                        "உங்கள் கணக்கு மற்றும் அனைத்து தரவுகளும் (சேமிப்பு விவரங்கள், கோல்டு ஹோல்டிங்ஸ், KYC ஆவணங்கள்) நிரந்தரமாக நீக்கப்படும். இந்த செயலை மாற்ற முடியாது." 
                        else "All your data (savings schemes, gold balances, wallet ledger, bank accounts, and KYC documents) will be permanently erased. This action cannot be undone.",
                    color = Color.Gray
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteConfirmation = false
                        viewModel.deleteAccount(
                            userId = userId,
                            onSuccess = {
                                Toast.makeText(context, if (isTamil) "கணக்கு நீக்கப்பட்டது" else "Account successfully deleted.", Toast.LENGTH_LONG).show()
                                onLogoutClick() // Triggers logout callback to boot the user back to splash screen
                            },
                            onError = { error ->
                                Toast.makeText(context, "Error: $error", Toast.LENGTH_LONG).show()
                            }
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC62828))
                ) {
                    Text(if (isTamil) "நீக்கு" else "Delete", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmation = false }) {
                    Text(if (isTamil) "ரத்து" else "Cancel", color = Color.Gray)
                }
            },
            containerColor = Color.White
        )
    }

    // ── Sheets Management ────────────────────────────────────────────────────
    
    if (showEditProfileSheet) {
        ModalBottomSheet(onDismissRequest = { showEditProfileSheet = false }, sheetState = sheetState, containerColor = Color.White) {
            EditProfileSheet(
                currentProfile = state.profile,
                onSave = { name, email, nominee, dob ->
                    viewModel.updateProfile(userId = userId, fullName = name, email = email, nomineeName = nominee, dateOfBirth = dob,
                        onSuccess = { coroutineScope.launch { sheetState.hide() }; showEditProfileSheet = false; Toast.makeText(context, "Profile Updated!", Toast.LENGTH_SHORT).show() },
                        onError = { Toast.makeText(context, it, Toast.LENGTH_LONG).show() }
                    )
                },
                onCancel = { coroutineScope.launch { sheetState.hide() }; showEditProfileSheet = false }
            )
        }
    }

    if (showSecuritySheet) {
        ModalBottomSheet(onDismissRequest = { showSecuritySheet = false }, sheetState = sheetState, containerColor = Color.White) {
            SecuritySheet(
                currentProfile = state.profile,
                onToggleBiometric = { isEnabled ->
                    viewModel.updateProfile(userId = userId, biometricEnabled = isEnabled,
                        onSuccess = { Toast.makeText(context, "Biometric updated", Toast.LENGTH_SHORT).show() },
                        onError = { Toast.makeText(context, it, Toast.LENGTH_LONG).show() }
                    )
                },
                onChangeMpinClick = { coroutineScope.launch { sheetState.hide() }; showSecuritySheet = false; showChangeMpinSheet = true }
            )
        }
    }

    if (showChangeMpinSheet) {
        ModalBottomSheet(onDismissRequest = { showChangeMpinSheet = false }, sheetState = sheetState, containerColor = Color.White) {
            ChangeMpinSheet(userId = userId, viewModel = viewModel, onClose = { showChangeMpinSheet = false })
        }
    }

    if (showKycSheet) {
        ModalBottomSheet(onDismissRequest = { showKycSheet = false }, sheetState = sheetState, containerColor = Color.White) {
            KycSheet(userId = userId, currentKycLevel = state.profile?.kycLevel ?: "PENDING", viewModel = viewModel, onClose = { showKycSheet = false })
        }
    }

    if (showBankAccountsSheet) {
        ModalBottomSheet(onDismissRequest = { showBankAccountsSheet = false }, sheetState = sheetState, containerColor = SurfaceLight) {
            BankAccountsSheet(userId = userId, viewModel = viewModel, onClose = { showBankAccountsSheet = false })
        }
    }

    if (isTranslating) {
        androidx.compose.ui.window.Dialog(
            onDismissRequest = {}
        ) {
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .background(Color.White, shape = RoundedCornerShape(16.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(
                    modifier = Modifier.size(48.dp)
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        fontSize = 13.sp,
        fontWeight = FontWeight.Black,
        color = MagentaPrimary,
        modifier = Modifier.padding(bottom = 12.dp, start = 8.dp),
        letterSpacing = 1.sp
    )
}

@Composable
private fun ProfileMenuRow(icon: ImageVector, title: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(20.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(MagentaPrimary.copy(alpha=0.08f)), contentAlignment = Alignment.Center) {
            Icon(imageVector = icon, contentDescription = null, tint = MagentaPrimary, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        AutoSizeText(text = title, fontSize = 16.sp, color = TextPrimary, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f), maxLines = 1)
        Icon(imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color.LightGray)
    }
}

// ── Components reused from original but with better styling ──────────────────

@Composable
fun BankAccountsSheet(userId: String, viewModel: ProfileViewModel, onClose: () -> Unit) {
    val accounts by viewModel.bankAccounts.collectAsState()
    val context = LocalContext.current
    var showAddForm by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
            .padding(bottom = 32.dp)
    ) {
        Text(stringResource(R.string.saved_bank_accounts), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = TextPrimary)
        Spacer(modifier = Modifier.height(20.dp))

        if (showAddForm) {
            var accNum by remember { mutableStateOf("") }; var ifsc by remember { mutableStateOf("") }; var bankName by remember { mutableStateOf("") }
            Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp)) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(stringResource(R.string.add_new_bank), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(16.dp))
                    OutlinedTextField(value = bankName, onValueChange = { bankName = it }, label = { Text(stringResource(R.string.bank_name)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(value = accNum, onValueChange = { accNum = it }, label = { Text(stringResource(R.string.account_number)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(value = ifsc, onValueChange = { ifsc = it.uppercase() }, label = { Text(stringResource(R.string.ifsc_code)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
                    Spacer(Modifier.height(24.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = { showAddForm = false }, modifier = Modifier.weight(1f)) { Text(stringResource(R.string.cancel)) }
                        Button(onClick = {
                            if (accNum.isNotBlank() && ifsc.isNotBlank() && bankName.isNotBlank()) {
                                viewModel.addBankAccount(userId, accNum, ifsc, bankName, { showAddForm = false }, { Toast.makeText(context, it, Toast.LENGTH_LONG).show() })
                            }
                        }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White)) {
                            Text(stringResource(R.string.save), color = Color.White)
                        }
                    }
                }
            }
        } else {
            if (accounts.isEmpty()) {
                Text("No bank accounts added yet.", color = TextMuted, modifier = Modifier.padding(vertical = 16.dp))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.heightIn(max = 300.dp)) {
                    items(accounts) { acc ->
                        Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, Color.LightGray.copy(alpha=0.2f))) {
                            Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(MagentaPrimary.copy(alpha=0.1f)), contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.Payment, null, tint = MagentaPrimary)
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(acc.bankName, fontWeight = FontWeight.Bold, color = TextPrimary)
                                    Text("A/c: ${acc.accountNumberMasked}", fontSize = 13.sp, color = TextMuted)
                                }
                                if (acc.isVerified) Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF16A34A))
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            Button(onClick = { showAddForm = true }, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White), shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Default.Add, null, tint = Color.White); Spacer(modifier = Modifier.width(8.dp)); Text(stringResource(R.string.add_bank_account), fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun EditProfileSheet(currentProfile: com.example.aishwaryam_android.network.UserProfileResponse?, onSave: (String, String, String, String) -> Unit, onCancel: () -> Unit) {
    val context = LocalContext.current
    var name by remember(currentProfile) { mutableStateOf(currentProfile?.fullName ?: "") }
    var email by remember(currentProfile) { mutableStateOf(currentProfile?.email ?: "") }
    var nominee by remember(currentProfile) { mutableStateOf(currentProfile?.nomineeName ?: "") }
    var dob by remember(currentProfile) {
        val rawDob = currentProfile?.dateOfBirth ?: ""
        val converted = try {
            val parts = rawDob.split("-")
            if (parts.size == 3) {
                "${parts[2]}/${parts[1]}/${parts[0]}" // yyyy-MM-dd -> DD/MM/YYYY
            } else rawDob
        } catch (e: Exception) {
            rawDob
        }
        mutableStateOf(converted)
    }
    var dobError by remember { mutableStateOf<String?>(null) }
    val phone = currentProfile?.phoneNumber ?: ""
    
    var showDatePicker by remember { mutableStateOf(false) }
    
    if (showDatePicker) {
        val calendar = java.util.Calendar.getInstance()
        if (dob.isNotEmpty()) {
            try {
                val parts = dob.split("/")
                if (parts.size == 3) {
                    calendar.set(java.util.Calendar.DAY_OF_MONTH, parts[0].toInt())
                    calendar.set(java.util.Calendar.MONTH, parts[1].toInt() - 1)
                    calendar.set(java.util.Calendar.YEAR, parts[2].toInt())
                }
            } catch (e: Exception) {}
        }
        android.app.DatePickerDialog(
            context,
            { _, y, m, d ->
                val formatted = String.format("%02d/%02d/%04d", d, m + 1, y)
                dob = formatted
                dobError = null
                showDatePicker = false
            },
            calendar.get(java.util.Calendar.YEAR),
            calendar.get(java.util.Calendar.MONTH),
            calendar.get(java.util.Calendar.DAY_OF_MONTH)
        ).apply {
            setOnDismissListener { showDatePicker = false }
            show()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
            .padding(bottom = 32.dp)
    ) {
        Text(stringResource(R.string.personal_info), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { input ->
                if (input.all { it.isLetter() || it.isWhitespace() }) {
                    name = input
                }
            },
            label = { Text(stringResource(R.string.full_name)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            shape = RoundedCornerShape(12.dp),
            colors = sheetTextFieldColors()
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { },
            label = { Text("Phone Number") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            enabled = false,
            colors = sheetTextFieldColors()
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(stringResource(R.string.email_address)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            ),
            shape = RoundedCornerShape(12.dp),
            colors = sheetTextFieldColors()
        )
        Spacer(modifier = Modifier.height(16.dp))
        fun validateDate(input: String) {
            if (input.isEmpty()) {
                dobError = null
                return
            }
            if (input.any { !it.isDigit() && it != '/' }) {
                dobError = "Only numbers and '/' are allowed"
                return
            }
            if (input.length == 10) {
                val parts = input.split("/")
                if (parts.size != 3) {
                    dobError = "Format must be DD/MM/YYYY"
                    return
                }
                val d = parts[0].toIntOrNull()
                val m = parts[1].toIntOrNull()
                val y = parts[2].toIntOrNull()
                if (d == null || m == null || y == null) {
                    dobError = "Invalid numbers in date"
                    return
                }
                val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
                if (y < 1900 || y > currentYear) {
                    dobError = "Year must be between 1900 and $currentYear"
                    return
                }
                if (m < 1 || m > 12) {
                    dobError = "Month must be between 01 and 12"
                    return
                }
                val days = when (m) {
                    2 -> if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)) 29 else 28
                    4, 6, 9, 11 -> 30
                    else -> 31
                }
                if (d < 1 || d > days) {
                    dobError = "Invalid day for the selected month"
                    return
                }
            } else if (input.length > 10) {
                dobError = "Date cannot exceed 10 characters"
                return
            }
            dobError = null
        }

        OutlinedTextField(
            value = dob,
            onValueChange = { input ->
                val filtered = input.filter { it.isDigit() || it == '/' }
                val formatted = formatDobInput(filtered)
                dob = formatted
                if (input.any { !it.isDigit() && it != '/' }) {
                    dobError = "Only numbers and '/' are allowed"
                } else {
                    validateDate(formatted)
                }
            },
            isError = dobError != null,
            label = { Text("Date of Birth (DD/MM/YYYY)") },
            modifier = Modifier.fillMaxWidth(),
            trailingIcon = {
                IconButton(onClick = { showDatePicker = true }) {
                    Icon(
                        imageVector = androidx.compose.material.icons.Icons.Default.DateRange,
                        contentDescription = "Select Date",
                        tint = MagentaPrimary
                    )
                }
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Next
            ),
            shape = RoundedCornerShape(12.dp),
            colors = sheetTextFieldColors()
        )
        if (dobError != null) {
            Text(
                text = dobError ?: "",
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 8.dp, top = 4.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = nominee,
            onValueChange = { input ->
                if (input.all { it.isLetter() || it.isWhitespace() }) {
                    nominee = input
                }
            },
            label = { Text(stringResource(R.string.nominee_name)) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done
            ),
            shape = RoundedCornerShape(12.dp),
            colors = sheetTextFieldColors()
        )
        Spacer(modifier = Modifier.height(32.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OutlinedButton(onClick = onCancel, modifier = Modifier.weight(1f).height(56.dp), shape = RoundedCornerShape(16.dp)) { Text(stringResource(R.string.cancel)) }
            Button(
                onClick = {
                    if (!isValidIndianDate(dob)) {
                        Toast.makeText(context, "Please enter a valid Date of Birth (DD/MM/YYYY)", Toast.LENGTH_LONG).show()
                    } else {
                        val convertedDob = try {
                            val parts = dob.split("/")
                            "${parts[2]}-${parts[1]}-${parts[0]}" // DD/MM/YYYY -> yyyy-MM-dd
                        } catch (e: Exception) {
                            dob
                        }
                        onSave(name, email, nominee, convertedDob)
                    }
                },
                enabled = dobError == null,
                modifier = Modifier.weight(1f).height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White)
            ) {
                Text(stringResource(R.string.save_changes))
            }
        }
    }
}

@Composable
fun SecuritySheet(currentProfile: com.example.aishwaryam_android.network.UserProfileResponse?, onToggleBiometric: (Boolean) -> Unit, onChangeMpinClick: () -> Unit) {
    var bio by remember { mutableStateOf(currentProfile?.biometricEnabled ?: false) }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(24.dp)
            .padding(bottom = 32.dp)
    ) {
        Text(stringResource(R.string.account_settings), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(24.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text(stringResource(R.string.biometric_unlock), fontWeight = FontWeight.Bold); Text(stringResource(R.string.biometric_desc), fontSize = 13.sp, color = TextMuted) }
            Switch(checked = bio, onCheckedChange = { bio = it; onToggleBiometric(it) }, colors = SwitchDefaults.colors(checkedThumbColor = MagentaPrimary, checkedTrackColor = MagentaPrimary.copy(alpha=0.5f)))
        }
        Spacer(modifier = Modifier.height(32.dp))
        Button(onClick = onChangeMpinClick, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White), shape = RoundedCornerShape(16.dp)) { Text(stringResource(R.string.change_mpin)) }
    }
}

@Composable
fun ChangeMpinSheet(userId: String, viewModel: ProfileViewModel, onClose: () -> Unit) {
    var old by remember { mutableStateOf("") }; var new1 by remember { mutableStateOf("") }; var new2 by remember { mutableStateOf("") }
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(24.dp)
            .padding(bottom = 32.dp)
    ) {
        Text(stringResource(R.string.change_mpin), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(value = old, onValueChange = { if(it.length<=4) old=it }, label = { Text(stringResource(R.string.current_mpin)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = new1, onValueChange = { if(it.length<=4) new1=it }, label = { Text(stringResource(R.string.new_mpin)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = new2, onValueChange = { if(it.length<=4) new2=it }, label = { Text(stringResource(R.string.confirm_new_mpin)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = sheetTextFieldColors())
        Spacer(Modifier.height(32.dp))
        Button(onClick = { if(new1==new2) viewModel.changeMpin(userId, old, new1, { onClose() }, { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }) }, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White), shape = RoundedCornerShape(16.dp)) { Text(stringResource(R.string.update_mpin)) }
    }
}

@Composable
fun KycSheet(userId: String, currentKycLevel: String, viewModel: ProfileViewModel, onClose: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(24.dp)
            .padding(bottom = 32.dp)
    ) {
        Text(stringResource(R.string.kyc_verification), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(16.dp))
        Surface(color = if(currentKycLevel=="VERIFIED") Color(0xFFF0FDF4) else Color(0xFFFEFCE8), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
            Text("${stringResource(R.string.current_status)}: $currentKycLevel", color = if(currentKycLevel=="VERIFIED") Color(0xFF16A34A) else Color(0xFFCA8A04), fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp))
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(stringResource(R.string.kyc_instruction), color = TextMuted, fontSize = 14.sp)
    }
}
