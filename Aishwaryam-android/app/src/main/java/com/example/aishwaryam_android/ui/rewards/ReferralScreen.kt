package com.example.aishwaryam_android.ui.rewards

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReferralScreen(
    userId: String,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var inviteCode by remember { mutableStateOf("") }
    var referredByCode by remember { mutableStateOf<String?>(null) }
    var friendsJoined by remember { mutableStateOf(0) }
    var goldEarnedMg by remember { mutableStateOf(0L) }
    var isLoading by remember { mutableStateOf(true) }

    var codeInput by remember { mutableStateOf("") }
    var isValidating by remember { mutableStateOf(false) }
    var validationError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(userId) {
        if (userId.isNotEmpty()) {
            isLoading = true
            try {
                // Fetch profile to get referral code and referrer status
                val profileRes = com.example.aishwaryam_android.network.ApiClient.apiService.getProfile(userId)
                if (profileRes.isSuccessful) {
                    profileRes.body()?.let {
                        inviteCode = it.referralCode ?: ""
                        referredByCode = it.referredByCode
                    }
                }
                
                // Fetch referral network
                val networkRes = com.example.aishwaryam_android.network.ApiClient.apiService.getReferralNetwork(userId)
                if (networkRes.isSuccessful) {
                    networkRes.body()?.let {
                        friendsJoined = it.totalReferrals
                        goldEarnedMg = it.totalBonusMg
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        stringResource(R.string.referral_title),
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
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = MagentaPrimary)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Hero Section
                item {
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = BrandDeep,
                        shadowElevation = 8.dp,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(CircleShape)
                                    .background(GoldWarm.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.CardGiftcard, contentDescription = null, tint = GoldWarm, modifier = Modifier.size(32.dp))
                            }
                            Spacer(Modifier.height(16.dp))
                            Text(
                                stringResource(R.string.gift_gold_family_title),
                                fontFamily = PlayfairFamily,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(8.dp))
                            Text(
                                stringResource(R.string.gift_gold_family_desc),
                                fontFamily = PoppinsFamily,
                                fontSize = 14.sp,
                                color = Color.White.copy(alpha = 0.8f),
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(24.dp))
                            
                            // Invite Code Box
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White.copy(alpha = 0.1f),
                                border = BorderStroke(1.dp, GoldWarm.copy(alpha = 0.3f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            stringResource(R.string.your_invite_code),
                                            fontSize = 12.sp,
                                            color = Color.White.copy(alpha = 0.6f),
                                            fontFamily = PoppinsFamily
                                        )
                                        Text(
                                            inviteCode.ifEmpty { "..." },
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = GoldWarm,
                                            fontFamily = PoppinsFamily,
                                            letterSpacing = 2.sp
                                        )
                                    }
                                }
                            }
                            
                            Spacer(Modifier.height(16.dp))
                            
                            Button(
                                onClick = {
                                    val shareText = "✨ Join me in saving 24K Pure Gold on Aishwaryam! ✨\n\nStart your gold savings journey today. Enter my invite code *${inviteCode}* when you sign up, and we will BOTH earn free bonus gold once you make your first purchase! 🎁\n\nDownload the app now: https://aishwaryam.com/app"
                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_TEXT, shareText)
                                        setPackage("com.whatsapp")
                                    }
                                    try {
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        // Fallback to normal share
                                        val fallback = Intent.createChooser(intent.apply { setPackage(null) }, "Share via")
                                        context.startActivity(fallback)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = TrustGreen),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(stringResource(R.string.share_whatsapp), fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Disclaimer Notice Card
                item {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = GoldWarm.copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, GoldWarm.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = BrandAccent,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = "Note: You will receive the bonus gold in your wallet only after your referred friend installs the app, registers, and completes their first gold purchase.",
                                fontSize = 12.sp,
                                fontFamily = PoppinsFamily,
                                color = BrandDeep,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }

                // Have a Referral Code Section
                item {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Have a Referral Code?",
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = BrandDeep
                        )
                        Spacer(Modifier.height(12.dp))
                        if (!referredByCode.isNullOrEmpty()) {
                            // Show "Joined" state
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = Color(0xFFE8F5E9),
                                border = BorderStroke(1.dp, Color(0xFF4CAF50)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF4CAF50),
                                        modifier = Modifier.size(24.dp)
                                    )
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Joined",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = Color(0xFF2E7D32),
                                            fontFamily = PoppinsFamily
                                        )
                                        Text(
                                            text = "Referred by: $referredByCode. Bonus will unlock on your first gold purchase.",
                                            fontSize = 12.sp,
                                            color = Color(0xFF2E7D32).copy(alpha = 0.8f),
                                            fontFamily = PoppinsFamily
                                        )
                                    }
                                }
                            }
                        } else {
                            // Show Input & Validate Button
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = Color.White,
                                shadowElevation = 2.dp,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Enter your friend's invite code to link your account.",
                                        fontSize = 12.sp,
                                        color = TextMuted,
                                        fontFamily = PoppinsFamily
                                    )
                                    Spacer(Modifier.height(12.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        OutlinedTextField(
                                            value = codeInput,
                                            onValueChange = { 
                                                codeInput = it.uppercase()
                                                validationError = null
                                            },
                                            placeholder = { Text("e.g. AISH123456", fontSize = 14.sp) },
                                            modifier = Modifier.weight(1f),
                                            singleLine = true,
                                            shape = RoundedCornerShape(8.dp),
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = BrandDeep,
                                                unfocusedBorderColor = Color.LightGray
                                            )
                                        )
                                        Spacer(Modifier.width(12.dp))
                                        Button(
                                            onClick = {
                                                if (codeInput.trim().isNotEmpty()) {
                                                    coroutineScope.launch {
                                                        isValidating = true
                                                        validationError = null
                                                        try {
                                                            val updateRequest = com.example.aishwaryam_android.network.UpdateProfileRequest(
                                                                fullName = null,
                                                                email = null,
                                                                referredByCode = codeInput.trim()
                                                            )
                                                            val response = com.example.aishwaryam_android.network.ApiClient.apiService.updateProfile(userId, updateRequest)
                                                            if (response.isSuccessful && response.body()?.success == true) {
                                                                referredByCode = codeInput.trim()
                                                                android.widget.Toast.makeText(context, "Referral code applied successfully!", android.widget.Toast.LENGTH_LONG).show()
                                                            } else {
                                                                val errorBody = response.errorBody()?.string()
                                                                val message = try {
                                                                    val json = org.json.JSONObject(errorBody ?: "{}")
                                                                    json.getString("message")
                                                                } catch (e: Exception) {
                                                                    "Invalid referral code. Please check and try again."
                                                                }
                                                                validationError = message
                                                            }
                                                        } catch (e: Exception) {
                                                            validationError = e.localizedMessage ?: "Connection error. Please try again."
                                                        } finally {
                                                            isValidating = false
                                                        }
                                                    }
                                                }
                                            },
                                            enabled = codeInput.trim().isNotEmpty() && !isValidating,
                                            colors = ButtonDefaults.buttonColors(containerColor = BrandDeep),
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
                                        ) {
                                            if (isValidating) {
                                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                            } else {
                                                Text("Validate", fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = Color.White)
                                            }
                                        }
                                    }
                                    if (validationError != null) {
                                        Spacer(Modifier.height(8.dp))
                                        Text(
                                            text = validationError!!,
                                            color = Color.Red,
                                            fontSize = 12.sp,
                                            fontFamily = PoppinsFamily
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Progress Section
                item {
                    Text(
                        stringResource(R.string.referral_progress),
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = BrandDeep
                    )
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        ProgressCard(
                            title = stringResource(R.string.friends_joined),
                            value = friendsJoined.toString(),
                            icon = Icons.Default.Group,
                            modifier = Modifier.weight(1f)
                        )
                        ProgressCard(
                            title = stringResource(R.string.gold_earned),
                            value = String.format(Locale.US, "%.2fg", goldEarnedMg.toDouble() / 1000.0),
                            icon = Icons.Default.WorkspacePremium,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                
                // Milestones
                item {
                    Text(
                        stringResource(R.string.milestones),
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = BrandDeep
                    )
                    Spacer(Modifier.height(16.dp))
                    
                    MilestoneItem(
                        title = stringResource(R.string.milestone_1),
                        reward = stringResource(R.string.milestone_1_reward),
                        isCompleted = friendsJoined >= 1
                    )
                    Spacer(Modifier.height(12.dp))
                    MilestoneItem(
                        title = stringResource(R.string.milestone_5),
                        reward = stringResource(R.string.milestone_5_reward),
                        isCompleted = friendsJoined >= 5
                    )
                }
            }
        }
    }
}

@Composable
fun ProgressCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier) {
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
            Icon(icon, contentDescription = null, tint = GoldWarm, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = BrandDeep, fontFamily = PoppinsFamily)
            Text(title, fontSize = 12.sp, color = TextMuted, fontFamily = PoppinsFamily)
        }
    }
}

@Composable
fun MilestoneItem(title: String, reward: String, isCompleted: Boolean) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = if (isCompleted) GoldWarm.copy(alpha = 0.1f) else Color.White,
        border = BorderStroke(1.dp, if (isCompleted) GoldWarm else Color.LightGray),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(if (isCompleted) GoldWarm else Color.LightGray),
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                } else {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Color.White)
                }
            }
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, color = BrandDeep, fontFamily = PoppinsFamily)
                Text(reward, fontSize = 13.sp, color = if (isCompleted) BrandAccent else TextMuted, fontFamily = PoppinsFamily)
            }
            if (!isCompleted) {
                Text(
                    "Locked",
                    fontSize = 12.sp,
                    color = TextMuted,
                    fontFamily = PoppinsFamily,
                    modifier = Modifier
                        .background(Color(0xFFF0F0F0), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}
