package com.example.aishwaryam_android.ui.info

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
import com.example.aishwaryam_android.ui.components.TText
import java.util.Locale

// ═══════════════════════════════════════════════════════════════════════════
// REDEMPTION GUIDE SCREEN (Fully Localized)
// Explains: What happens at maturity, how to collect gold, options available
// ═══════════════════════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RedemptionGuideScreen(onBackClick: () -> Unit) {
    val isTamil = Locale.getDefault().language == "ta"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        if (isTamil) "தங்கத்தை மீட்டெடுத்தல்" else "Redeeming Your Gold",
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
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 48.dp)
        ) {

            // ── Hero ─────────────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(listOf(Color(0xFF6D4C00), GoldDeep, GoldWarm.copy(0.8f)))
                        )
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(Brush.radialGradient(listOf(GoldPrimary, GoldDeep))),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.EmojiEvents,
                                null,
                                tint = BrandDeep,
                                modifier = Modifier.size(46.dp)
                            )
                        }
                        Spacer(Modifier.height(18.dp))
                        TText(
                            if (isTamil) "தங்கம் சேகரிக்கத் தயாராக உள்ளது" else "Your Gold Is Ready to Collect",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(8.dp))
                        TText(
                            if (isTamil) "உங்கள் திட்டம் முதிர்ச்சியடையும் போது, போனஸ்கள் உட்பட நீங்கள் சேமித்த அனைத்துத் தங்கமும் உங்களுக்கே சொந்தம்." else "When your scheme matures, your gold — including all bonuses — is yours to take home.",
                            fontFamily = PoppinsFamily,
                            fontSize = 14.sp,
                            color = Color.White.copy(0.85f),
                            textAlign = TextAlign.Center,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // ── When does maturity happen ────────────────────────────────────
            item {
                InfoSection(
                    icon = Icons.Default.EventAvailable,
                    iconColor = SuccessGreen,
                    title = if (isTamil) "எனது திட்டம் எப்போது முதிர்வடையும்?" else "When Does My Scheme Mature?",
                    body = if (isTamil) {
                        "நீங்கள் சேர்ந்த நாளிலிருந்து கணக்கிடப்படும் நிலையான முதிர்வுத் தேதியை உங்கள் திட்டம் கொண்டுள்ளது. உதாரணத்திற்கு:\n\n• 330-நாட்கள் கொண்ட திட்டம், நீங்கள் சேர்ந்த நாளிலிருந்து சரியாக 330 நாட்களில் முதிர்வடையும்\n• முதிர்வுக்கு 7 நாட்களுக்கு முன்பாக உங்களுக்கு அறிவிப்பு அனுப்பப்படும்\n• முதிர்வு நாளன்று உங்களுக்கு இறுதி அறிவிப்பு அனுப்பப்படும்\n\nஉங்கள் முதிர்வுத் தேதியை முகப்பில் உள்ள உங்களது திட்ட அட்டையில் எப்போதும் பார்த்துத் தெரிந்துகொள்ளலாம்."
                    } else {
                        "Your scheme has a fixed maturity date calculated from the day you join. For example:\n\n• A 330-day scheme matures exactly 330 days from your join date\n• You will receive a notification 7 days before maturity\n• You will receive another notification on the maturity date\n\nYou can always see your maturity date in your active scheme card on the dashboard."
                    }
                )
            }

            // ── What happens to gold at maturity ────────────────────────────
            item {
                InfoSection(
                    icon = Icons.Default.Lock,
                    iconColor = GoldWarm,
                    title = if (isTamil) "முதிர்வின் போது எனது தங்கத்திற்கு என்ன நடக்கும்?" else "What Happens to My Gold at Maturity?",
                    body = if (isTamil) {
                        "முதிர்வு நாளன்று:\n\n• உங்களது தங்கத்தின் நிலை 🔒 பூட்டப்பட்டது → ✅ மீட்டெடுக்கத் தக்கது என மாறும்\n• உங்களது முழுத் தங்க இருப்பு (முதலீடு + அனைத்து போனஸ்களும்) விடுவிக்கப்படும்\n• உங்களது மீட்பு விருப்பத்தைத் தேர்ந்தெடுக்க உங்களுக்கு 90 நாட்கள் அவகாசம் இருக்கும்\n• இந்த காலக்கட்டத்திலும் உங்களது தங்கம் பெட்டகத்தில் பாதுகாப்பாக வைக்கப்பட்டிருக்கும்"
                    } else {
                        "On your maturity date:\n\n• Your gold status changes from 🔒 Locked → ✅ Redeemable\n• Your full gold balance (principal + all bonuses) is unlocked\n• You have 90 days to choose your redemption option\n• Your gold remains safely stored in the vault during this period"
                    }
                )
            }

            // ── 3 Redemption options ─────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    TText(
                        if (isTamil) "தங்கத்தைப் பெறுவதற்கான வழியைத் தேர்ந்தெடுங்கள்" else "Choose How to Receive Your Gold",
                        fontFamily = PlayfairFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = TextPrimary,
                        modifier = Modifier.padding(bottom = 14.dp)
                    )
                    RedemptionOptionCard(
                        number = "01",
                        icon = Icons.Default.Diamond,
                        title = if (isTamil) "நகையாக மாற்றிக் கொள்ளுங்கள்" else "Convert to Jewellery",
                        description = if (isTamil) "எமது நகைக்கடைக்கு நேரில் வந்து அழகான 22K/18K நகைகளாகத் தேர்வு செய்து கொள்ளுங்கள். எமது சேமிப்புத் தங்கத்தின் எடை செய்கூலி, சேதாரத்திற்கு ஏற்ப சரிசெய்யப்பட்டு நகையாக உங்களிடம் வழங்கப்படும்." else "Visit our showroom and choose from our collection of 22K/18K jewellery. Your gold weight is adjusted for making charges — and you leave with beautiful jewellery for your family.",
                        note = if (isTamil) "நகை வகையைப் பொறுத்து செய்கூலி, சேதாரம் பொருந்தும்" else "Making charges apply as per jewellery type",
                        accentColor = BrandAccent
                    )
                    Spacer(Modifier.height(12.dp))
                    RedemptionOptionCard(
                        number = "02",
                        icon = Icons.Default.Circle,
                        title = if (isTamil) "நேரடித் தங்க நாணயங்கள் / கட்டிகளாகப் பெறுங்கள்" else "Take Physical Gold Coins / Bars",
                        description = if (isTamil) "BIS-சான்றளிக்கப்பட்ட 24K சுத்தத் தங்க நாணயங்களாகவோ (0.5கி, 1கி, 5கி, 10கி) அல்லது கட்டிகளாகவோ பெற்றுக்கொள்ளுங்கள். செய்கூலி, சேதாரம் எதுவும் கிடையாது - முழு எடை அப்படியே வழங்கப்படும்." else "Receive your gold as BIS-certified 24K gold coins (0.5g, 1g, 5g, 10g) or bars. No making charges — pure weight delivered.",
                        note = if (isTamil) "எங்கள் கடைகளிலோ அல்லது வீட்டு விநியோகத்தின் மூலமோ பெறலாம் (விநியோகக் கட்டணம் பொருந்தலாம்)" else "Available at our showroom or home delivery (charges may apply)",
                        accentColor = GoldDeep
                    )
                    Spacer(Modifier.height(12.dp))
                    RedemptionOptionCard(
                        number = "03",
                        icon = Icons.Default.Savings,
                        title = if (isTamil) "புதிய திட்டத்திற்குத் தொடருங்கள் (Roll Over)" else "Roll Over to a New Scheme",
                        description = if (isTamil) "நேரடியாகத் தங்கத்தை இப்போது பெற விரும்பவில்லையா? முதிர்ந்த தங்கத்தை அப்படியே புதிய சேமிப்புத் திட்டத்திற்கு மாற்றி, போனஸ் தங்கங்களைத் தொடர்ந்து பெற்று வாருங்கள். உங்கள் செல்வம் தொடர்ந்து வளரட்டும்." else "Not ready to take physical gold yet? Roll your matured gold into a new scheme and continue earning bonuses. Your wealth keeps growing.",
                        note = if (isTamil) "எந்தத் தடையுமின்றி - தடையற்ற தொடர் தங்கச் சேமிப்பு பலன்கள்" else "No interruption — seamless continuation of savings",
                        accentColor = SuccessGreen
                    )
                }
            }

            // ── Step by step ─────────────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        TText(
                            if (isTamil) "மீட்புச் செயல்முறை — படிப்படியாக" else "Redemption Process — Step by Step",
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = TextPrimary
                        )
                        Spacer(Modifier.height(16.dp))
                        
                        val stepsList = if (isTamil) {
                            listOf(
                                Pair("செயலியில் முதிர்வு அறிவிப்பைப் பெறுங்கள்", Icons.Default.Notifications),
                                Pair("செயலியைத் திறக்க → முகப்பு → முதிர்ந்த திட்டத்தை மீட்டெடுக்கவும்", Icons.Default.TouchApp),
                                Pair("உங்களது மீட்பு விருப்பத்தைத் தேர்ந்தெடுங்கள் (நகைகள் / நாணயங்கள் / புதிய திட்டம்)", Icons.Default.Checklist),
                                Pair("எங்கள் குழுவினர் 24 மணி நேரத்திற்குள் உங்களைத் தொடர்பு கொள்வார்கள்", Icons.Default.Support),
                                Pair("எங்கள் நகைக்கடைக்கு வரவும் அல்லது வீட்டு விநியோகம் பெறவும்", Icons.Default.Store),
                                Pair("உங்களது தங்கத்தை மகிழ்ச்சியோடு பெற்றுக்கொள்ளுங்கள்! வாழ்த்துகள்! 🎉", Icons.Default.EmojiEvents)
                            )
                        } else {
                            listOf(
                                Pair("Receive maturity notification in the app", Icons.Default.Notifications),
                                Pair("Open app → Dashboard → Claim Matured Gold", Icons.Default.TouchApp),
                                Pair("Choose your redemption option (jewellery / coins / rollover)", Icons.Default.Checklist),
                                Pair("Our team contacts you within 24 hours", Icons.Default.Support),
                                Pair("Visit showroom OR receive at home", Icons.Default.Store),
                                Pair("Collect your gold — congratulations! 🎉", Icons.Default.EmojiEvents)
                            )
                        }

                        stepsList.forEachIndexed { i, (step, icon) ->
                            Row(
                                modifier = Modifier.padding(vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(BrandDark.copy(0.08f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "${i + 1}",
                                        fontFamily = PoppinsFamily,
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 13.sp,
                                        color = BrandDark
                                    )
                                }
                                TText(
                                    step,
                                    fontFamily = PoppinsFamily,
                                    fontSize = 13.sp,
                                    color = TextSecondary,
                                    lineHeight = 20.sp,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }

            // ── Missed installments policy ───────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = WarningLight),
                    border = androidx.compose.foundation.BorderStroke(1.dp, WarningAmber.copy(0.3f))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(Icons.Default.Info, null, tint = WarningAmber, modifier = Modifier.size(22.dp))
                            TText(
                                if (isTamil) "தவறவிட்ட தவணைக் கொள்கை" else "Missed Installments Policy",
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = TextPrimary
                            )
                        }
                        Spacer(Modifier.height(12.dp))
                        TText(
                            if (isTamil) {
                                "சில தவணைகளைத் தவறவிடுவது உங்களது திட்டத்தை ஒருபோதும் ரத்து செய்யாது.\n\n" +
                                "• உங்களது திரட்டப்பட்ட தங்கம் பாதுகாப்பாக இருக்கும், எந்த அபராதமும் இல்லை\n" +
                                "• இருப்பினும், தவறவிட்ட நாட்கள் போனஸ் பலன்களுக்கான காலத்தைக் குறைக்கும்\n" +
                                "• தவணை செலுத்துதலை நீங்கள் நிறுத்திய இடத்திலிருந்து மீண்டும் தொடரலாம்\n" +
                                "• மீதமுள்ள தவணைகளின் அடிப்படையில் முதிர்வுத் தேதி நீட்டிக்கப்படலாம்\n\n" +
                                "முறையான சேமிப்புப் பழக்கத்தை ஏற்படுத்தவும், அதிகபட்ச போனஸ் பெறவும் AutoPay-ஐ இயக்குமாறு கேட்டுக்கொள்கிறோம்."
                            } else {
                                "Missing a few installments does NOT cancel your scheme.\n\n" +
                                "• Your accumulated gold remains safe and earns no penalty\n" +
                                "• However, missed days count against your bonus tier window\n" +
                                "• Resuming payments continues from where you left off\n" +
                                "• Maturity date may extend based on remaining installments\n\n" +
                                "We strongly recommend enabling AutoPay to protect your bonus tier and savings habit."
                            },
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = TextPrimary,
                            lineHeight = 21.sp
                        )
                    }
                }
            }

            // ── Support CTA ──────────────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BrandDark)
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Icon(Icons.Default.HeadsetMic, null, tint = GoldWarm, modifier = Modifier.size(32.dp))
                        Column {
                            TText(
                                if (isTamil) "மீட்பதில் ஏதேனும் உதவி தேவையா?" else "Need help with redemption?",
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color.White
                            )
                            TText(
                                if (isTamil) "ஒவ்வொரு படியிலும் உங்களுக்கு வழிகாட்ட எங்கள் குழு தயாராக உள்ளது." else "Our team is here to guide you through every step.",
                                fontFamily = PoppinsFamily,
                                fontSize = 12.sp,
                                color = Color.White.copy(0.7f)
                            )
                            Spacer(Modifier.height(4.dp))
                            TText(
                                "support@aishwaryam.com  ·  +91 94430 00000",
                                fontFamily = PoppinsFamily,
                                fontSize = 11.sp,
                                color = GoldWarm,
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
private fun InfoSection(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    body: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(1.dp)
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
                        .background(iconColor.copy(0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = iconColor, modifier = Modifier.size(22.dp))
                }
                TText(
                    title,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = TextPrimary,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(Modifier.height(14.dp))
            TText(
                body,
                fontFamily = PoppinsFamily,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 22.sp
            )
        }
    }
}

@Composable
private fun RedemptionOptionCard(
    number: String,
    icon: ImageVector,
    title: String,
    description: String,
    note: String,
    accentColor: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        elevation = CardDefaults.cardElevation(2.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(0.2f))
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(icon, null, tint = accentColor, modifier = Modifier.size(24.dp))
                }
                Column {
                    TText(
                        if (Locale.getDefault().language == "ta") "விருப்பம் $number" else "Option $number",
                        fontFamily = PoppinsFamily,
                        fontSize = 10.sp,
                        color = accentColor,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp
                    )
                    TText(
                        title,
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = TextPrimary
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            TText(
                description,
                fontFamily = PoppinsFamily,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 20.sp
            )
            Spacer(Modifier.height(8.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Info, null, tint = accentColor, modifier = Modifier.size(14.dp))
                TText(
                    note,
                    fontFamily = PoppinsFamily,
                    fontSize = 11.sp,
                    color = accentColor,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
