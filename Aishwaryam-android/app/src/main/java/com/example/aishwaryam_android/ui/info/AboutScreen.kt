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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.ui.theme.*
import com.example.aishwaryam_android.ui.components.TText

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT AISHWARYAM SCREEN
// Brand story, mission, values, team, contact
// ═══════════════════════════════════════════════════════════════════════════

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutScreen(onBackClick: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        "About Aishwaryam",
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

            // ── Brand Hero ───────────────────────────────────────────────────
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.verticalGradient(listOf(BrandDeep, Color(0xFF29001D), BrandDark))
                        )
                        .padding(36.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        // Brand logo placeholder
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                                .background(Brush.radialGradient(listOf(GoldWarm, GoldDeep))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "அ",
                                fontSize = 36.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = BrandDeep
                            )
                        }
                        Spacer(Modifier.height(20.dp))
                        TText(
                            "Aishwaryam",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 30.sp,
                            color = GoldWarm
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "ஐஸ்வர்யம் உங்கள் இல்லத்தில்",
                            fontFamily = PoppinsFamily,
                            fontSize = 16.sp,
                            color = Color.White.copy(0.9f),
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(4.dp))
                        TText(
                            "Aishwaryam @ your Home",
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = Color.White.copy(0.6f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            // ── Our Mission ──────────────────────────────────────────────────
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(GoldWarm.copy(0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Favorite, null, tint = GoldDeep, modifier = Modifier.size(22.dp))
                            }
                            TText(
                                "Our Mission",
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = TextPrimary
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                        TText(
                            "Gold has been at the heart of Indian family savings for thousands of years. It represents security, prosperity, and love — passed down through generations as the most trusted form of wealth.\n\nAishwaryam was created with one mission: to bring the trusted tradition of gold savings into the digital age, making it accessible, safe, and rewarding for every family in Tamil Nadu.",
                            fontFamily = PoppinsFamily,
                            fontSize = 14.sp,
                            color = TextSecondary,
                            lineHeight = 24.sp
                        )
                    }
                }
            }

            // ── Why Gold ─────────────────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceGold),
                    border = androidx.compose.foundation.BorderStroke(1.dp, GoldWarm.copy(0.3f))
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        TText(
                            "Why We Chose Gold",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = GoldDeep
                        )
                        Spacer(Modifier.height(14.dp))
                        listOf(
                            "Gold has never gone to zero — ever, in human history",
                            "It protects savings from inflation better than fixed deposits",
                            "It is the most universally accepted store of value in India",
                            "Every Tamil family already understands and trusts gold",
                            "It can be converted to jewellery — wealth you can wear"
                        ).forEach { point ->
                            Row(
                                modifier = Modifier.padding(vertical = 5.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Text("🪙", fontSize = 14.sp)
                                TText(
                                    point,
                                    fontFamily = PoppinsFamily,
                                    fontSize = 13.sp,
                                    color = TextPrimary,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }
                }
            }

            // ── Values ───────────────────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
                    TText(
                        "Our Values",
                        fontFamily = PlayfairFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = TextPrimary,
                        modifier = Modifier.padding(start = 4.dp, bottom = 12.dp)
                    )
                    listOf(
                        Triple(Icons.Default.VerifiedUser, "Trust", "Every decision we make is guided by what is best for your savings — not our profit."),
                        Triple(Icons.Default.Visibility, "Transparency", "Clear pricing, visible gold rates, GST-compliant invoices — no hidden charges, ever."),
                        Triple(Icons.Default.Diversity3, "Family-First", "We design for families — not traders. Simple, warm, and built for long-term goals."),
                        Triple(Icons.Default.Security, "Safety", "Your gold safety is our primary obligation. We invest in security before features.")
                    ).forEach { (icon, title, desc) ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                            elevation = CardDefaults.cardElevation(1.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(BrandDark.copy(0.08f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(icon, null, tint = BrandDark, modifier = Modifier.size(22.dp))
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    TText(
                                        title,
                                        fontFamily = PoppinsFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = TextPrimary
                                    )
                                    TText(
                                        desc,
                                        fontFamily = PoppinsFamily,
                                        fontSize = 12.sp,
                                        color = TextMuted,
                                        lineHeight = 18.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ── Contact ──────────────────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BrandDark)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        TText(
                            "Get in Touch",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = GoldWarm
                        )
                        Spacer(Modifier.height(16.dp))
                        listOf(
                            Triple(Icons.Default.Email, "Email", "support@aishwaryam.com"),
                            Triple(Icons.Default.Phone, "Phone", "+91 94430 00000"),
                            Triple(Icons.Default.Chat, "WhatsApp", "+91 94430 00000"),
                            Triple(Icons.Default.LocationOn, "Registered Office", "Coimbatore, Tamil Nadu — 641001")
                        ).forEach { (icon, label, value) ->
                            Row(
                                modifier = Modifier.padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Icon(icon, null, tint = GoldWarm, modifier = Modifier.size(18.dp))
                                Column {
                                    TText(
                                        label,
                                        fontFamily = PoppinsFamily,
                                        fontSize = 11.sp,
                                        color = Color.White.copy(0.5f)
                                    )
                                    TText(
                                        value,
                                        fontFamily = PoppinsFamily,
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 13.sp,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider(color = Color.White.copy(0.1f))
                        Spacer(Modifier.height(16.dp))
                        TText(
                            "Mon – Sat  ·  9:00 AM – 6:00 PM IST",
                            fontFamily = PoppinsFamily,
                            fontSize = 12.sp,
                            color = Color.White.copy(0.55f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // ── Version ──────────────────────────────────────────────────────
            item {
                TText(
                    "Aishwaryam v1.0.0  •  Made in Tamil Nadu 🇮🇳",
                    fontFamily = PoppinsFamily,
                    fontSize = 11.sp,
                    color = TextLight,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp)
                )
            }
        }
    }
}
