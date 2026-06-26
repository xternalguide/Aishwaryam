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
// WHY GOLD SCREEN (Fully Localized)
// Focus: Weddings, Festivals, Future, Safety, Discipline
// ═══════════════════════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WhyGoldScreen(onBackClick: () -> Unit) {
    val isTamil = Locale.getDefault().language == "ta"

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        if (isTamil) "ஏன் தங்கம் சேமிக்க வேண்டும்?" else "Why Save Gold?",
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
            // ── Hero ─────────────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(BrandDeep, Color(0xFF29001D))))
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        TText(
                            if (isTamil) "தங்கம்: என்றென்றும் அழியாத நம்பிக்கை" else "Gold: The Eternal Trust",
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp,
                            color = GoldWarm,
                            textAlign = TextAlign.Center
                        )
                        TText(
                            if (isTamil) "இந்தியாவின் மிகவும் நம்பகமான செல்வ சொத்து" else "India's Most Trusted Wealth Asset",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(12.dp))
                        TText(
                            if (isTamil) "ஆயிரக்கணக்கான ஆண்டுகளாக, குடும்பங்கள் தங்கத்தை தங்களின் மிகவும் நம்பகமான சேமிப்பாக நம்பி வருகின்றன. இது வெறும் உலோகம் மட்டுமல்ல - இது பணவீக்க பாதுகாப்பு, நிதி பாதுகாப்பு மற்றும் உங்கள் குழந்தைகளுக்கு ஒரு அழகான பாரம்பரியம்." else "For thousands of years, families have trusted gold as their most reliable savings. It is more than metal — it is inflation protection, financial security, and a beautiful legacy for your children.",
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = Color.White.copy(0.85f),
                            textAlign = TextAlign.Center,
                            lineHeight = 22.sp
                        )
                    }
                }
            }

            // ── The 5 Emotional Reasons ──────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(16.dp)) {
                    WhyGoldReasonCard(
                        icon = Icons.Default.Favorite,
                        title = if (isTamil) "மகளின் எதிர்காலம் & திருமணம்" else "A Daughter's Future & Marriage",
                        description = if (isTamil) "உங்கள் மகளின் கல்வி மற்றும் எதிர்கால திருமணத்திற்காக இன்று சிறிய அளவில் சேமிக்கத் தொடங்குங்கள். நீங்கள் சேமிக்கும் ஒவ்வொரு கிராமும் அவளது வளமான எதிர்காலத்திற்கான உறுதியான படியாகும்." else "Start saving small amounts today to build a secure fund for your daughter's education and grand wedding tomorrow. Every gram you save is a solid step toward her prosperous future.",
                        color = Color(0xFFC2185B)
                    )
                    WhyGoldReasonCard(
                        icon = Icons.Default.Celebration,
                        title = if (isTamil) "பண்டிகை & குடும்ப மைல்கற்கள்" else "Festival & Family Milestones",
                        description = if (isTamil) "தீபாவளி, பொங்கல், திருமணங்கள் அல்லது அக்ஷய திருதியை ஆகியவற்றிற்கு சிரமமின்றி சேமிக்கவும். கடைசி நேர நிதி அழுத்தத்திற்காக காத்திருக்க வேண்டாம் - ஆண்டு முழுவதும் தங்கம் சேமிக்கவும்." else "Seamlessly save for Diwali, Pongal, weddings, or Akshaya Tritiya. Don't wait for last-minute financial stress — accumulate gold throughout the year effortlessly.",
                        color = GoldDeep
                    )
                    WhyGoldReasonCard(
                        icon = Icons.Default.Shield,
                        title = if (isTamil) "பணவீக்கத்தை வெல்லும் குடும்ப பாதுகாப்பு" else "Inflation-Proof Family Security",
                        description = if (isTamil) "பணவீக்கம் மற்றும் நாணய வீழ்ச்சிக்கு தங்கம் சிறந்த பாதுகாப்பு ஆகும். பணத்தைப் போலல்லாமல், கடினமான பொருளாதாரக் காலங்களிலும் தங்கம் தனது உயர்ந்த வாங்கும் திறனைத் தக்க வைத்துக் கொள்கிறது." else "Gold is the best protection against inflation and currency depreciation. Unlike cash, gold maintains its high purchasing power even during tough economic times.",
                        color = SuccessGreen
                    )
                    WhyGoldReasonCard(
                        icon = Icons.Default.AutoGraph,
                        title = if (isTamil) "முறையான சேமிப்பு பழக்கம்" else "Disciplined Wealth Habit",
                        description = if (isTamil) "உங்கள் சிறு சேமிப்பை உண்மையான தங்கம் சொத்துகளாக மாற்றுங்கள். தொடர்ச்சியான தினசரி, வாராந்திர அல்லது மாதாந்திர சேமிப்பு, எப்போதாவது செய்யும் முதலீட்டை விட வேகமாக உங்கள் செல்வத்தை வளர்க்கும்." else "Turn your loose change into real 24K gold assets. Consistent daily, weekly, or monthly savings build generational wealth faster than occasional big investments.",
                        color = TrustBlue
                    )
                    WhyGoldReasonCard(
                        icon = Icons.Default.Storefront,
                        title = if (isTamil) "100% நேரடி தங்க இருப்பு" else "Pure Physical Gold Backing",
                        description = if (isTamil) "உங்கள் டிஜிட்டல் தங்கம் 100% சான்றளிக்கப்பட்ட நேரடி தங்கத்தால் ஆதரிக்கப்பட்டு காப்பீடு செய்யப்பட்ட பாதுகாப்பான பெட்டகங்களில் சேமிக்கப்படுகிறது. இதை எப்போது வேண்டுமானாலும் நகையாகவோ அல்லது நாணயமாகவோ பெற்றுக்கொள்ளலாம்." else "Your digital gold is backed 100% by certified physical gold kept in secure, fully insured vaults. You can redeem it instantly as coins, bars, or jewellery.",
                        color = BrandAccent
                    )
                }
            }

            // ── Detailed Loyalty Gold Bonus Explanation Section ──────────────
            item {
                GoldBonusExplanationSection(isTamil)
            }

            // ── Comparison Section ───────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceGold),
                    border = androidx.compose.foundation.BorderStroke(1.dp, GoldWarm.copy(0.4f))
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        TText(
                            if (isTamil) "தங்கம் vs வங்கி சேமிப்பு" else "Gold vs Bank Savings",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = BrandDeep
                        )
                        Spacer(Modifier.height(16.dp))
                        ComparisonRow(if (isTamil) "பணவீக்க பாதுகாப்பு" else "Inflation Protection", true, isTamil)
                        ComparisonRow(if (isTamil) "உடனடி மீட்புத் தன்மை" else "Liquidity/Redemption", true, isTamil)
                        ComparisonRow(if (isTamil) "தூய்மை உத்தரவாதம்" else "Purity Guarantee", true, isTamil)
                        ComparisonRow(if (isTamil) "பண்பாட்டு பாரம்பரிய மதிப்பு" else "Cultural Value & Legacy", true, isTamil)
                        Spacer(Modifier.height(12.dp))
                        TText(
                            if (isTamil) "பாரம்பரிய வங்கி வைப்புத்தொகைகள் பணவீக்கத்தின் காரணமாக காலப்போக்கில் தங்களின் வாங்கும் திறனை இழக்கின்றன. ஆனால் தங்கம் தசாப்தங்களாக மதிப்பில் தொடர்ந்து உயர்ந்து, உங்கள் கஷ்டப்பட்டு சம்பாதித்த சேமிப்பின் உண்மையான மதிப்பை பாதுகாக்கிறது." else "Traditional bank deposits often lose purchasing power over time due to inflation. Gold consistently rises in value over decades, protecting the real value of your hard-earned savings.",
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = TextMuted,
                            lineHeight = 20.sp
                        )
                    }
                }
            }
            
            // ── CTA ──────────────────────────────────────────────────────────
            item {
                Button(
                    onClick = { onBackClick() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                        .height(60.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandDark, contentColor = Color.White)
                ) {
                    TText(
                        if (isTamil) "இப்போதே சேமிக்கத் தொடங்குங்கள்" else "Start Saving Now",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun WhyGoldReasonCard(
    icon: ImageVector,
    title: String,
    description: String,
    color: Color
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(color.copy(0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column {
                TText(
                    title,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = TextPrimary
                )
                Spacer(Modifier.height(6.dp))
                TText(
                    description,
                    fontFamily = PoppinsFamily,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 21.sp
                )
            }
        }
    }
}

@Composable
private fun ComparisonRow(feature: String, goldAdvantage: Boolean, isTamil: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            if (goldAdvantage) Icons.Default.CheckCircle else Icons.Default.Cancel,
            null,
            tint = if (goldAdvantage) SuccessGreen else Color.Gray,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(12.dp))
        TText(
            feature,
            fontFamily = PoppinsFamily,
            fontSize = 14.sp,
            color = TextPrimary,
            modifier = Modifier.weight(1f)
        )
        TText(
            if (goldAdvantage) (if (isTamil) "தங்கம் வெற்றி" else "GOLD WIN") else "BANK",
            fontFamily = PoppinsFamily,
            fontSize = 10.sp,
            fontWeight = FontWeight.ExtraBold,
            color = if (goldAdvantage) GoldDeep else Color.Gray
        )
    }
}

@Composable
fun GoldBonusExplanationSection(isTamil: Boolean) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(3.dp),
        border = androidx.compose.foundation.BorderStroke(1.5.dp, MagentaPrimary.copy(alpha = 0.15f))
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(SuccessGreen.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MilitaryTech, null, tint = SuccessGreen, modifier = Modifier.size(24.dp))
                }
                Spacer(Modifier.width(12.dp))
                TText(
                    text = if (isTamil) "விசுவாச தங்க போனஸ் கட்டமைப்பு" else "Loyalty Gold Bonus Structure",
                    fontFamily = PlayfairFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = BrandDark
                )
            }
            
            Spacer(Modifier.height(16.dp))
            
            TText(
                text = if (isTamil) "ஐஸ்வர்யம் உங்களது ஆரம்ப மற்றும் தொடர்ச்சியான சேமிப்பிற்கு வெகுமதி அளிக்கிறது. எங்கள் போனஸ் திட்டத்தின் கீழ், தவணைகளை நீங்கள் எவ்வளவு சீக்கிரம் செலுத்துகிறீர்களோ, அவ்வளவு அதிக போனஸ் தங்கம் பெறுவீர்கள்!" else "Aishwaryam rewards early and consistent savings. Under our loyalty bonus program, the earlier you pay your installments within the scheme tenure, the more bonus gold weight you earn!",
                fontSize = 13.sp,
                fontFamily = PoppinsFamily,
                color = TextMuted,
                lineHeight = 20.sp
            )
            
            Spacer(Modifier.height(20.dp))
            
            // Tiers List
            TText(if (isTamil) "போனஸ் அடுக்கு விவரங்கள்:" else "Loyalty Bonus Tier Breakdown:", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, fontFamily = PoppinsFamily)
            Spacer(Modifier.height(10.dp))
            
            BonusTierItem(
                tierName = if (isTamil) "அடுக்கு 1: சூப்பர் ஆரம்பகால பறவை" else "Tier 1: Super Early Bird", 
                days = if (isTamil) "1 முதல் 75 நாட்கள்" else "Days 1 to 75", 
                percent = if (isTamil) "7.5% கூடுதல் தங்கம்" else "7.5% Gold Weight", 
                accentColor = SuccessGreen
            )
            BonusTierItem(
                tierName = if (isTamil) "அடுக்கு 2: ஆரம்பகால பறவை" else "Tier 2: Early Bird", 
                days = if (isTamil) "76 முதல் 150 நாட்கள்" else "Days 76 to 150", 
                percent = if (isTamil) "5.5% கூடுதல் தங்கம்" else "5.5% Gold Weight", 
                accentColor = GoldWarm
            )
            BonusTierItem(
                tierName = if (isTamil) "அடுக்கு 3: நிலையான சேமிப்பாளர்" else "Tier 3: Standard Saver", 
                days = if (isTamil) "151 முதல் 225 நாட்கள்" else "Days 151 to 225", 
                percent = if (isTamil) "3.5% கூடுதல் தங்கம்" else "3.5% Gold Weight", 
                accentColor = TrustBlue
            )
            BonusTierItem(
                tierName = if (isTamil) "அடுக்கு 4: லைட் சேமிப்பாளர்" else "Tier 4: Lite Saver", 
                days = if (isTamil) "226 முதல் 330 நாட்கள்" else "Days 226 to 330", 
                percent = if (isTamil) "1.5% கூடுதல் தங்கம்" else "1.5% Gold Weight", 
                accentColor = Color.Gray
            )
            
            Spacer(Modifier.height(24.dp))
            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.4f))
            Spacer(Modifier.height(20.dp))
            
            // Example Calculation Box
            TText(if (isTamil) "உங்கள் போனஸ் எவ்வாறு கணக்கிடப்படுகிறது?" else "How is your bonus calculated?", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = TextPrimary, fontFamily = PoppinsFamily)
            Spacer(Modifier.height(8.dp))
            
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceGold)
                    .padding(16.dp)
            ) {
                Column {
                    TText(
                        text = if (isTamil) "💡 போனஸ் உதாரண கணக்கீடு:" else "💡 Real-World Weight Bonus Example:",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = GoldDeep,
                        fontFamily = PoppinsFamily
                    )
                    Spacer(Modifier.height(8.dp))
                    TText(
                        text = if (isTamil) {
                            "நீங்கள் 330 நாட்களில் 10.000 கிராம் தங்கம் சேமித்தால்:\n" +
                            "• அடுக்கு 1-ன் கீழ் (7.5%): நீங்கள் கூடுதலாக +0.750 கிராம் தங்கம் இலவசமாகப் பெறுவீர்கள்!\n" +
                            "• அடுக்கு 3-ன் கீழ் (3.5%): நீங்கள் கூடுதலாக +0.350 கிராம் தங்கம் இலவசமாகப் பெறுவீர்கள்!\n\n" +
                            "போனஸ் முற்றிலும் நீங்கள் சேமித்த தங்கத்தின் எடையின் அடிப்படையில் மட்டுமே கணக்கிடப்படும். தங்கம் விலை தொடர்ந்து உயர்வதால், முன்கூட்டியே சேமிப்பது உங்களுக்கு அதிக நகைகளை அல்லது நாணயங்களை இலவசமாகப் பெற்றுத்தரும்!"
                        } else {
                            "If you accumulate 10.000 grams of pure gold in a 330-day scheme:\n" +
                            "• Under Tier 1 (7.5%): You receive +0.750g Gold FREE!\n" +
                            "• Under Tier 3 (3.5%): You receive +0.350g Gold FREE!\n\n" +
                            "The bonus is calculated strictly on the weight of gold saved (in milligrams/grams), not on cash. Since gold prices rise over time, saving early protects your wealth and grants you more physical gold weight!"
                        },
                        fontSize = 12.sp,
                        fontFamily = PoppinsFamily,
                        color = TextPrimary,
                        lineHeight = 18.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun BonusTierItem(tierName: String, days: String, percent: String, accentColor: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(accentColor))
            Spacer(Modifier.width(10.dp))
            Column {
                TText(tierName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary, fontFamily = PoppinsFamily)
                TText(days, fontSize = 11.sp, color = Color.Gray, fontFamily = PoppinsFamily)
            }
        }
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(accentColor.copy(alpha = 0.1f))
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            TText(percent, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = accentColor, fontFamily = PoppinsFamily)
        }
    }
}
