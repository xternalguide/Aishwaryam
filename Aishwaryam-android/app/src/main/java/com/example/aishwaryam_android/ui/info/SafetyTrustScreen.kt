package com.example.aishwaryam_android.ui.info

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.ui.theme.*
import com.example.aishwaryam_android.ui.components.TText
import java.util.Locale

// ═══════════════════════════════════════════════════════════════════════════
// SAFETY & TRUST SCREEN (Fully Localized & Layout Aligned)
// Answers: "Is my gold safe? Where is it stored? Is this real gold?"
// Target: Non-technical Tamil Nadu families — first-time gold savers
// ═══════════════════════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SafetyTrustScreen(onBackClick: () -> Unit) {
    val isTamil = Locale.getDefault().language == "ta"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        if (isTamil) "பாதுகாப்பு & தரம்" else "Safety & Trust",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandDark,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        },
        containerColor = SurfaceLight
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(bottom = 48.dp)
        ) {

            // ── Hero — Animated shield ───────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(BrandDark, Color(0xFF0D2B12))))
                        .padding(36.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        val pulse = rememberInfiniteTransition(label = "shieldPulse")
                        val scale by pulse.animateFloat(
                            1f, 1.08f,
                            infiniteRepeatable(tween(1800), RepeatMode.Reverse),
                            label = "scale"
                        )
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .scale(scale)
                                .clip(CircleShape)
                                .background(Brush.radialGradient(listOf(SuccessGreen, Color(0xFF047857)))),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Shield,
                                null,
                                tint = Color.White,
                                modifier = Modifier.size(48.dp)
                            )
                        }
                        Spacer(Modifier.height(20.dp))
                        TText(
                            if (isTamil) "உங்கள் சேமிப்பு பாதுகாப்பானது" else "Your Gold is Protected",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(8.dp))
                        TText(
                            if (isTamil) "உங்கள் முதலீட்டின் பாதுகாப்பை நீங்கள் கருதுவதைப் போலவே நாங்களும் மிக முக்கியமாகக் கருதுகிறோம்." else "We take the safety of your investment as seriously as you do.",
                            fontFamily = PoppinsFamily,
                            fontSize = 14.sp,
                            color = Color.White.copy(0.75f),
                            textAlign = TextAlign.Center,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // ── 4 Trust pillars ──────────────────────────────────────────────
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TText(
                        if (isTamil) "தங்கப் பாதுகாப்பின் 4 தூண்கள்" else "The 4 Pillars of Gold Safety",
                        fontFamily = PlayfairFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = TextPrimary,
                        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
                    )
                    // IntrinsicSize.Max forces the cards in the row to have identical height
                    Row(
                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Max),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        TrustPillarCard(
                            icon = Icons.Default.Lock,
                            title = if (isTamil) "பாதுகாப்பான\nபெட்டகம்" else "Secured\nVault",
                            subtitle = if (isTamil) "BIS-சான்றளிக்கப்பட்ட சேமிப்பு" else "BIS-certified storage",
                            color = SuccessGreen,
                            modifier = Modifier.weight(1f)
                        )
                        TrustPillarCard(
                            icon = Icons.Default.Verified,
                            title = if (isTamil) "99.9%\nசுத்தத் தங்கம்" else "99.9%\nPure",
                            subtitle = if (isTamil) "24K தூய்மை தரம்" else "24K gold standard",
                            color = GoldWarm,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Max),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        TrustPillarCard(
                            icon = Icons.Default.Security,
                            title = if (isTamil) "முழுமையாக\nகாப்பீடு செய்யப்பட்டது" else "Fully\nInsured",
                            subtitle = if (isTamil) "ஒவ்வொரு கிராமும் பாதுகாப்பு" else "Every gram protected",
                            color = BrandAccent,
                            modifier = Modifier.weight(1f)
                        )
                        TrustPillarCard(
                            icon = Icons.Default.Receipt,
                            title = if (isTamil) "காலாண்டு\nதணிக்கை" else "Quarterly\nAudit",
                            subtitle = if (isTamil) "உறுதிப்படுத்தப்பட்ட இருப்பு" else "Verified holdings",
                            color = TrustBlue,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // ── Gold Purity Section ──────────────────────────────────────────
            item {
                SafetySection(
                    icon = Icons.Default.Stars,
                    iconColor = GoldWarm,
                    bgColor = SurfaceGold,
                    title = if (isTamil) "99.9% 24K சுத்தத் தங்கம் என்றால் என்ன?" else "What is 99.9% 24K Gold?",
                    body = if (isTamil) {
                        "24K தங்கம் என்பது தங்கத்தின் மிகத் தூய்மையான வடிவமாகும் - இது 99.9% தூய்மை கொண்டது. இந்திய ரிசர்வ் வங்கி (RBI) தங்க நாணயங்களுக்குப் பயன்படுத்தும் அதே தரமாகும்.\n\nஐஸ்வர்யமில் நீங்கள் சேமிக்கும் ஒவ்வொரு கிராம் தங்கமும் இந்தத் தூய்மைத் தரத்திற்கு உட்பட்டது. உங்கள் கணக்கில் தங்கம் சேர்க்கப்படுவதற்கு முன்பு BIS-சான்றளிக்கப்பட்ட அதிகாரிகளால் சரிபார்க்கப்படுகிறது."
                    } else {
                        "24K gold is the purest form of gold — with 99.9% purity. This is the same gold standard used by the Reserve Bank of India (RBI) for gold coins.\n\nEvery gram of gold in your Aishwaryam account meets this standard. The purity is verified by BIS-certified assayers before being credited to your account."
                    },
                    highlights = if (isTamil) {
                        listOf(
                            "ரிசர்வ் வங்கி தங்க நாணயங்களின் அதே தூய்மை",
                            "BIS-சான்றளிக்கப்பட்டது (இந்தியத் தர நிர்ணய அமைப்பு)",
                            "ஒவ்வொரு சேமிப்பிலும் சரிபார்க்கப்படும் தூய்மை",
                            "செய்கூலி, சேதாரம் கிடையாது - சுத்தத் தங்க எடை"
                        )
                    } else {
                        listOf(
                            "Same purity as RBI Gold Coins",
                            "BIS-certified (Bureau of Indian Standards)",
                            "Verified on every transaction",
                            "No making charges — pure gold weight"
                        )
                    },
                    highlightColor = GoldDeep
                )
            }

            // ── Vault Storage ────────────────────────────────────────────────
            item {
                SafetySection(
                    icon = Icons.Default.Warehouse,
                    iconColor = SuccessGreen,
                    bgColor = SuccessLight,
                    title = if (isTamil) "எனது தங்கம் எங்கே சேமிக்கப்படுகிறது?" else "Where is My Gold Stored?",
                    body = if (isTamil) {
                        "நீங்கள் சேமிக்கும் தங்கம் தொழில்முறை பாதுகாவலர்களால் நிர்வகிக்கப்படும் அதிநவீன பாதுகாப்பான பெட்டகங்களில் சேமிக்கப்படுகிறது. இந்த பெட்டகங்கள்:\n\n• 24/7 கேமரா மற்றும் பாதுகாப்பு கண்காணிப்பில் உள்ள கட்டிடம்\n• திருட்டு, தீ மற்றும் இயற்கை பேரிடர்களுக்கு எதிராக முழுமையாக காப்பீடு செய்யப்பட்டது\n• தன்னிச்சையான தணிக்கையாளர்களால் காலாண்டு தோறும் தணிக்கை செய்யப்படுகிறது\n\nபெட்டகத்தில் உள்ள நேரடித் தங்கத்தின் எடை எப்போதுமே அனைத்து பயனர்களின் மொத்த டிஜிட்டல் இருப்புடன் சரியாக ஒத்துப்போகும் - இதற்கு உத்தரவாதம் அளிக்கப்படுகிறது."
                    } else {
                        "Your gold is stored in secured, dedicated vaults managed by professional custodians. These vaults are:\n\n• Located in monitored, access-controlled facilities\n• Protected by 24/7 security surveillance\n• Fully insured against theft, fire, and natural disasters\n• Audited quarterly by independent auditors\n\nThe physical gold in the vault always matches the total digital gold balances of all users — guaranteed."
                    },
                    highlights = if (isTamil) {
                        listOf(
                            "சுயாதீன காலாண்டு தணிக்கை",
                            "அனைத்து இருப்புகளுக்கும் முழு காப்பீடு",
                            "24/7 கண்காணிக்கப்படும் வசதி",
                            "தனித்தனி பயனர் தங்கம் - கலக்கப்படாது"
                        )
                    } else {
                        listOf(
                            "Independent quarterly audits",
                            "Full insurance cover on all holdings",
                            "24/7 monitored facility",
                            "Separate user gold — never pooled"
                        )
                    },
                    highlightColor = TrustGreen
                )
            }

            // ── Payment Security ─────────────────────────────────────────────
            item {
                SafetySection(
                    icon = Icons.Default.Payment,
                    iconColor = BrandAccent,
                    bgColor = Color(0xFFFFF0F8),
                    title = if (isTamil) "பாதுகாப்பான கட்டண முறை" else "Payment Security",
                    body = if (isTamil) {
                        "ஒவ்வொரு பரிவர்த்தனையும் இந்திய ரிசர்வ் வங்கியால் (RBI) ஒழுங்குபடுத்தப்பட்ட பாதுகாப்பான கட்டண வாயில்கள் (Payment Gateways) மூலம் செயல்படுத்தப்படுகிறது. உங்கள் வங்கி அல்லது கார்டு விவரங்கள் ஒருபோதும் எமது சர்வர்களில் சேமிக்கப்படுவதில்லை.\n\nஅனைத்து பரிவர்த்தனைகளும்:\n• 256-bit SSL குறியாக்கத்துடன் (Encryption) பாதுகாக்கப்படுகிறது\n• HMAC அங்கீகாரத்துடன் தடையற்ற பாதுகாப்பு\n• தவறுதலான இரட்டைக் கட்டணம் செலுத்தல் பாதுகாப்பு\n• ஜிஎஸ்டி இணக்கத்துடன் உடனடி ரசீது"
                    } else {
                        "Every payment is processed through RBI-regulated payment gateways. Your card details and bank information are never stored on our servers.\n\nAll transactions are:\n• Encrypted with 256-bit SSL\n• HMAC-verified for tamper protection\n• Idempotency-protected (no double charges)\n• GST-compliant with instant invoice"
                    },
                    highlights = if (isTamil) {
                        listOf(
                            "256-bit SSL கட்டண பாதுகாப்பு",
                            "ரிசர்வ் வங்கியால் ஒழுங்குபடுத்தப்பட்ட கட்டண வாயில்",
                            "3% ஜிஎஸ்டி உட்பட - முழு இணக்கம்",
                            "ஒவ்வொரு பரிவர்த்தனைக்கும் உடனடி ரசீது"
                        )
                    } else {
                        listOf(
                            "256-bit SSL encryption",
                            "RBI-regulated payment gateway",
                            "3% GST included — fully compliant",
                            "Instant invoice on every transaction"
                        )
                    },
                    highlightColor = BrandAccent
                )
            }

            // ── Your data ────────────────────────────────────────────────────
            item {
                SafetySection(
                    icon = Icons.Default.PrivacyTip,
                    iconColor = TrustBlue,
                    bgColor = Color(0xFFF0F4FF),
                    title = if (isTamil) "உங்கள் தரவு தனிப்பட்டதாகப் பாதுகாக்கப்படுகிறது" else "Your Data is Private",
                    body = if (isTamil) {
                        "உங்களது தனிப்பட்ட மற்றும் நிதி விவரங்கள் குறியாக்கப்பட்டு பாதுகாப்பாக சேமிக்கப்படுகின்றன. நாங்கள் தகவல் தொழில்நுட்பச் சட்டம் 2000 மற்றும் DPDP சட்டம் 2023 ஆகியவற்றுக்கு முழுமையாக இணங்குகிறோம்.\n\nஉங்கள் தகவல்களை நாங்கள் ஒருபோதும் விற்கவோ அல்லது தவறாகப் பயன்படுத்தவோ மாட்டோம். KYC ஆவணங்கள் அரசாங்க விதிமுறைகளுக்கு மட்டுமே பயன்படுத்தப்பட்டு, பாதுகாப்பாக வைக்கப்படும்."
                    } else {
                        "Your personal and financial data is encrypted and stored securely. We comply with the Information Technology Act 2000 and DPDP Act 2023.\n\nWe never sell, share, or misuse your information. KYC documents are stored only for regulatory compliance and are encrypted at rest."
                    },
                    highlights = if (isTamil) {
                        listOf(
                            "IT சட்டம் 2000-க்கு இணங்குகிறது",
                            "DPDP சட்டம் 2023-க்குத் தயார்",
                            "பாதுகாக்கப்பட்டு குறியாக்கப்பட்ட KYC தரவு",
                            "விவரங்கள் யாருக்கும் விற்கப்பட மாட்டாது"
                        )
                    } else {
                        listOf(
                            "IT Act 2000 compliant",
                            "DPDP Act 2023 ready",
                            "KYC data encrypted at rest",
                            "No data sold or shared"
                        )
                    },
                    highlightColor = TrustBlue
                )
            }

            // ── Trust summary card ───────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BrandDark)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.VerifiedUser,
                            null,
                            tint = GoldWarm,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        TText(
                            if (isTamil) "தமிழக குடும்பங்களின் நம்பிக்கைக்குரிய சேமிப்பு" else "Trusted by Families in Tamil Nadu",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(8.dp))
                        TText(
                            if (isTamil) "தங்கச் சேமிப்பிற்கு தமிழ்க் குடும்பங்கள் வழங்கும் அதே விழுமியங்களுடன் - நம்பிக்கை, பொறுமை மற்றும் நீண்ட கால நோக்குடன் ஐஸ்வர்யம் உருவாக்கப்பட்டுள்ளது. உங்கள் தங்கம் எங்கள் பொறுப்பு." else "Aishwaryam is built with the same values that Tamil families bring to gold — trust, patience, and long-term thinking. Your gold is our responsibility.",
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = Color.White.copy(0.8f),
                            textAlign = TextAlign.Center,
                            lineHeight = 21.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TrustPillarCard(
    icon: ImageVector,
    title: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxHeight(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(0.2f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(color.copy(0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.height(10.dp))
            TText(
                title,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 14.sp,
                color = TextPrimary,
                textAlign = TextAlign.Center,
                lineHeight = 18.sp
            )
            Spacer(Modifier.height(4.dp))
            TText(
                subtitle,
                fontFamily = PoppinsFamily,
                fontSize = 11.sp,
                color = color,
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun SafetySection(
    icon: ImageVector,
    iconColor: Color,
    bgColor: Color,
    title: String,
    body: String,
    highlights: List<String>,
    highlightColor: Color
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        elevation = CardDefaults.cardElevation(0.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, highlightColor.copy(0.15f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(iconColor.copy(0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = iconColor, modifier = Modifier.size(22.dp))
                }
                TText(
                    title,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = TextPrimary
                )
            }
            Spacer(Modifier.height(14.dp))
            TText(
                body,
                fontFamily = PoppinsFamily,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 21.sp
            )
            Spacer(Modifier.height(14.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                highlights.forEach { point ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(highlightColor)
                        )
                        TText(
                            point,
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = highlightColor,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
