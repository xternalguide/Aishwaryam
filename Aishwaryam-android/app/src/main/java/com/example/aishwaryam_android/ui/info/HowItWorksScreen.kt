package com.example.aishwaryam_android.ui.info

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.ui.theme.*
import kotlinx.coroutines.delay
import com.example.aishwaryam_android.ui.components.TText
import java.util.Locale

// ═══════════════════════════════════════════════════════════════════════════
// HOW IT WORKS SCREEN (Fully Localized)
// Visual step-by-step: Join → Save → Earn Bonus → Mature → Redeem
// ═══════════════════════════════════════════════════════════════════════════

data class HowStep(
    val step: Int,
    val icon: ImageVector,
    val title: String,
    val description: String,
    val accentColor: Color,
    val tip: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HowItWorksScreen(onBackClick: () -> Unit) {
    val isTamil = Locale.getDefault().language == "ta"

    val localizedSteps = remember(isTamil) {
        listOf(
            HowStep(
                step = 1,
                icon = Icons.Default.AppRegistration,
                title = if (isTamil) "1. பதிவு & KYC சரிபார்ப்பு" else "Register & Complete KYC",
                description = if (isTamil) "உங்கள் மொபைல் எண்ணைப் பயன்படுத்தி பதிவு செய்க. பான் கார்டு மற்றும் ஆதார் மூலம் எளிய டிஜிட்டல் KYC-ஐ 5 நிமிடங்களுக்குள் முடிக்கலாம். எந்தவொரு கிளைக்கும் நேரில் செல்லத் தேவையில்லை." else "Sign up with your mobile number. Complete a simple KYC with your PAN card and Aadhaar — takes less than 5 minutes. No paperwork. No branch visits.",
                accentColor = BrandAccent,
                tip = if (isTamil) "உங்கள் KYC டிஜிட்டல் முறையில் உடனடியாக சரிபார்க்கப்படும். உங்கள் விவரங்கள் 100% பாதுகாப்பானது." else "Your KYC is verified digitally. Your information is 100% secure."
            ),
            HowStep(
                step = 2,
                icon = Icons.Default.Savings,
                title = if (isTamil) "2. தங்கச் சேமிப்புத் திட்டத்தைத் தேர்வு செய்க" else "Choose a Gold Scheme",
                description = if (isTamil) "உங்கள் இலக்கிற்கு ஏற்ற தினசரி, வாராந்திர அல்லது மாதாந்திர திட்டத்தைத் தேர்ந்தெடுக்கவும். ஒவ்வொரு திட்டமும் முதிர்வுத் தேதியுடன் கூடிய 330 நாட்கள் போன்ற நிலையான கால அளவைக் கொண்டது." else "Pick a savings scheme that suits your goal — monthly, daily, or weekly. Each scheme has a fixed tenure (e.g., 330 days) and a clear maturity date.",
                accentColor = GoldWarm,
                tip = if (isTamil) "மிகவும் பிரபலமான திட்டம்: ₹500/மாதம் 11 மாதங்களுக்கு = முதிர்வில் நேரடித் தங்கம்." else "Most popular: ₹500/month for 11 months = real gold at maturity."
            ),
            HowStep(
                step = 3,
                icon = Icons.Default.CurrencyRupee,
                title = if (isTamil) "3. தவணைத் தொகையைச் செலுத்துங்கள்" else "Pay Your Installments",
                description = if (isTamil) "உங்கள் தவணைகளை UPI, கார்டு அல்லது நெட் பேங்கிங் மூலம் எப்போது வேண்டுமானாலும் செலுத்தலாம். ஒவ்வொரு கட்டணமும் அன்றைய நேரடி சந்தை விலையில் 24K சுத்தத் தங்கமாக மாற்றப்படும்." else "Pay your installments anytime — via UPI, card, or net banking. Each payment is instantly converted to 24K digital gold at the live market rate.",
                accentColor = SuccessGreen,
                tip = if (isTamil) "AutoPay-ஐ இயக்குவதன் மூலம் தவணைகளைத் தவறவிடாமல் செலுத்தி, போனஸ் பலன்களை முழுமையாகப் பெறலாம்." else "Enable AutoPay to never miss an installment — and protect your bonus tier."
            ),
            HowStep(
                step = 4,
                icon = Icons.Default.Star,
                title = if (isTamil) "4. போனஸ் தங்கம் பெறுங்கள்" else "Earn Gold Bonus",
                description = if (isTamil) "நீங்கள் எவ்வளவு சீக்கிரம் சேமிக்கிறீர்களோ, அவ்வளவு போனஸ் தங்கம் கிடைக்கும். முதல் 75 நாட்களுக்குள் செலுத்தப்படும் தொகைகளுக்கு 7.5% தங்கம் போனஸாக உங்கள் கணக்கில் இலவசமாகச் சேர்க்கப்படும்." else "The earlier you save, the more bonus gold you earn. Pay in the first 75 days and get a 7.5% gold weight bonus — extra gold credited to your account for free.",
                accentColor = GoldWarm,
                tip = if (isTamil) "போனஸ் தங்கத்தின் எடையின் அடிப்படையில் மட்டுமே கணக்கிடப்படும், ரூபாய் மதிப்பில் அல்ல." else "Bonus is calculated on the gold weight, not rupee amount — you always gain."
            ),
            HowStep(
                step = 5,
                icon = Icons.Default.Lock,
                title = if (isTamil) "5. பாதுகாப்பான பெட்டகச் சேமிப்பு" else "Gold is Locked Safely",
                description = if (isTamil) "உங்கள் திட்டம் முதிர்ச்சியடையும் வரை, நீங்கள் சேமிக்கும் தங்கம் 100% காப்பீடு செய்யப்பட்ட அதிநவீன பாதுகாப்பான பெட்டகங்களில் பத்திரமாக வைக்கப்படும். உங்கள் இருப்பை எப்போது வேண்டுமானாலும் செயலி மூலம் கண்காணிக்கலாம்." else "Your accumulated gold is safely locked during the scheme tenure. It's stored in secured, insured vaults — 99.9% pure 24K gold. You can track your balance anytime.",
                accentColor = BrandAccent,
                tip = if (isTamil) "சேமிப்புப் பழக்கத்தை ஊக்குவிக்க, முதிர்வுத் தேதி வரை உங்கள் தங்கம் பாதுகாப்பாகப் பூட்டப்பட்டிருக்கும்." else "Locked gold cannot be sold until maturity — protecting your savings habit."
            ),
            HowStep(
                step = 6,
                icon = Icons.Default.EmojiEvents,
                title = if (isTamil) "6. திட்டம் முதிர்வு — தங்கத்தை அள்ளிச் செல்லுங்கள்!" else "Scheme Matures — Collect Your Gold!",
                description = if (isTamil) "முதிர்வுத் தேதியில் நீங்கள் சேமித்த தங்கம் (அனைத்து போனஸ்களும் உட்பட) உங்களுக்குக் கிடைக்கும். அதை எங்கள் கடைகளில் அழகான நகைகளாகவோ, நாணயங்களாகவோ அல்லது பிஸ்கட்டுகளாகவோ பெற்றுக்கொள்ளலாம்." else "On your maturity date, your gold (including all bonuses) becomes available. You can choose to receive physical gold coins, bars, or convert to stunning jewellery at our store.",
                accentColor = GoldWarm,
                tip = if (isTamil) "தங்கத்தைப் பெற்றுக்கொள்ள உங்கள் முதிர்வுச் சான்றிதழுடன் எமது அருகிலுள்ள ஐஸ்வர்யம் நகைக்கடைக்கு வரவும்." else "Visit any Aishwaryam showroom with your maturity certificate to collect your gold."
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        if (isTamil) "இது எப்படி செயல்படுகிறது?" else "How It Works",
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

            // ── Hero Banner ──────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(
                                listOf(BrandDark, Color(0xFF2D0B4E))
                            )
                        )
                        .padding(28.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        TText(
                            if (isTamil) "எளிமை. பாதுகாப்பு. புத்திசாலித்தனம்." else "Simple. Safe. Smart.",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 24.sp,
                            color = GoldWarm,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(10.dp))
                        TText(
                            if (isTamil) "6 எளிய படிகளில் தங்கம் சேமிக்கத் தொடங்குங்கள்.\nஉங்கள் தங்கம் — உங்கள் செல்வம் — உங்கள் எதிர்காலம்." else "Start saving gold in 6 easy steps.\nYour gold — your wealth — your future.",
                            fontFamily = PoppinsFamily,
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.8f),
                            textAlign = TextAlign.Center,
                            lineHeight = 22.sp
                        )
                        Spacer(Modifier.height(20.dp))
                        // Trust mini chips
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            TrustMiniChip(if (isTamil) "🔒 பாதுகாப்பானது" else "🔒 Secured")
                            TrustMiniChip(if (isTamil) "✅ 99.9% தூய்மையானது" else "✅ 99.9% Pure")
                            TrustMiniChip(if (isTamil) "🪙 24K தங்கம்" else "🪙 24K Gold")
                        }
                    }
                }
            }

            // ── Step cards ───────────────────────────────────────────────────
            localizedSteps.forEachIndexed { index, step ->
                item {
                    HowStepCard(step = step, isLast = index == localizedSteps.lastIndex, isTamil = isTamil)
                }
            }

            // ── Detailed Loyalty Gold Bonus Explanation Section ──────────────
            item {
                GoldBonusExplanationSection(isTamil)
            }

            // ── Bottom CTA ───────────────────────────────────────────────────
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceGold),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp, GoldWarm.copy(alpha = 0.4f)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            TText(
                                if (isTamil) "தங்கச் சேமிப்பைத் தொடங்க தயாரா?" else "Ready to start saving gold?",
                                fontFamily = PlayfairFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp,
                                color = BrandDark,
                                textAlign = TextAlign.Center
                            )
                            Spacer(Modifier.height(8.dp))
                            TText(
                                if (isTamil) "தங்களின் தங்கச் சேமிப்பிற்கு ஐஸ்வர்யம் நிறுவனத்தை நம்பும் தமிழகத்தின் ஆயிரக்கணக்கான குடும்பங்களுடன் நீங்களும் இணையுங்கள்." else "Join thousands of families in Tamil Nadu who trust Aishwaryam for their gold savings.",
                                fontFamily = PoppinsFamily,
                                fontSize = 13.sp,
                                color = TextMuted,
                                textAlign = TextAlign.Center,
                                lineHeight = 20.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HowStepCard(step: HowStep, isLast: Boolean, isTamil: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Step number + connector line
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(56.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(Brush.radialGradient(listOf(step.accentColor, step.accentColor.copy(0.7f)))),
                contentAlignment = Alignment.Center
            ) {
                Icon(step.icon, null, tint = Color.White, modifier = Modifier.size(26.dp))
            }
            if (!isLast) {
                Box(
                    modifier = Modifier
                        .width(2.dp)
                        .height(24.dp)
                        .clip(RoundedCornerShape(1.dp))
                        .background(
                            Brush.verticalGradient(
                                listOf(step.accentColor.copy(0.4f), Color.Transparent)
                            )
                        )
                )
            }
        }

        Spacer(Modifier.width(16.dp))

        // Content
        Column(modifier = Modifier.weight(1f).padding(bottom = if (isLast) 0.dp else 16.dp)) {
            // Step badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(step.accentColor.copy(0.12f))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                TText(
                    if (isTamil) "படி ${step.step}" else "STEP ${step.step}",
                    fontSize = 9.sp,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.ExtraBold,
                    color = step.accentColor,
                    letterSpacing = 1.sp
                )
            }
            Spacer(Modifier.height(8.dp))
            TText(
                step.title,
                fontSize = 16.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Spacer(Modifier.height(6.dp))
            TText(
                step.description,
                fontSize = 13.sp,
                fontFamily = PoppinsFamily,
                color = TextMuted,
                lineHeight = 21.sp
            )

            // Tip box
            step.tip?.let { tip ->
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(step.accentColor.copy(0.08f))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("💡", fontSize = 13.sp)
                    TText(
                        tip,
                        fontSize = 12.sp,
                        fontFamily = PoppinsFamily,
                        color = step.accentColor,
                        lineHeight = 18.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
private fun TrustMiniChip(label: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.12f))
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        TText(
            label,
            fontSize = 11.sp,
            fontFamily = PoppinsFamily,
            fontWeight = FontWeight.SemiBold,
            color = Color.White
        )
    }
}
