package com.example.aishwaryam_android.ui.info

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
// FAQ SCREEN
// 20 curated questions — no internet required, fully offline
// Categories: Scheme, Safety, Bonus, Redemption, KYC, Technical
// ═══════════════════════════════════════════════════════════════════════════

data class FaqItem(val question: String, val answer: String, val category: String)

private val faqs = listOf(
    // ── GETTING STARTED ──────────────────────────────────────────────────────
    FaqItem(
        category = "Getting Started",
        question = "What is Aishwaryam Digital Gold?",
        answer = "Aishwaryam is a scheme-based digital gold savings platform. You save money regularly (daily, weekly, or monthly), and it is automatically converted into 24K pure digital gold at live market rates. At maturity, you can collect real physical gold — coins, bars, or jewellery."
    ),
    FaqItem(
        category = "Getting Started",
        question = "How do I start? What is the minimum amount?",
        answer = "You can start saving with as little as ₹100 per day or ₹500 per month. Simply register, complete KYC, choose a scheme, and make your first payment. Your gold journey begins immediately."
    ),
    FaqItem(
        category = "Getting Started",
        question = "Is this a chit fund or NBFC scheme?",
        answer = "No. Aishwaryam is a gold savings platform — not a chit fund, not an NBFC. Every rupee you invest is converted to real 24K gold and stored in secured vaults. There is no lending, no pooling, and no financial risk of the kind associated with chit funds."
    ),

    // ── SCHEME & SAVINGS ──────────────────────────────────────────────────────
    FaqItem(
        category = "Scheme & Savings",
        question = "How does the gold scheme work?",
        answer = "Choose a scheme (e.g., 330-day daily saving plan). Pay your installment each period — your payment is converted to gold at the live 24K rate. Bonuses are added on top. On the maturity date, your full gold balance (including bonus) becomes available for redemption."
    ),
    FaqItem(
        category = "Scheme & Savings",
        question = "What happens if I miss an installment?",
        answer = "Missing an installment does NOT cancel your scheme. Your accumulated gold remains safe. However, missing payments may affect your bonus tier eligibility. We strongly recommend enabling AutoPay to protect your bonus earnings. You can always resume payments."
    ),
    FaqItem(
        category = "Scheme & Savings",
        question = "Can I pay more than the scheduled installment?",
        answer = "Yes. You can make additional payments at any time. Each payment is converted to gold at the live rate and earns the applicable bonus for that day's tenure period."
    ),
    FaqItem(
        category = "Scheme & Savings",
        question = "Can I join multiple schemes at once?",
        answer = "Yes. You can save toward multiple goals simultaneously — for example, one scheme for a wedding, another for your child's education. Each scheme tracks its gold balance independently."
    ),

    // ── BONUS SYSTEM ────────────────────────────────────────────────────────
    FaqItem(
        category = "Bonus System",
        question = "How is the gold bonus calculated?",
        answer = "Bonus is calculated as a percentage of the gold weight you earn each day. Payments made in Days 1–75 earn 7.5% extra gold. Days 76–150 earn 5.5%, Days 151–225 earn 3.5%, and Days 226–330 earn 1.5%. The bonus is credited in gold — not rupees."
    ),
    FaqItem(
        category = "Bonus System",
        question = "When is the bonus credited to my account?",
        answer = "Bonus gold is credited immediately when you make each installment payment — you see it in your balance right away. There is no waiting until maturity for bonus credits."
    ),
    FaqItem(
        category = "Bonus System",
        question = "Is the bonus gold real? Can I redeem it too?",
        answer = "Yes! Bonus gold is real 24K gold stored in your account. It is fully redeemable along with your principal gold when your scheme matures."
    ),

    // ── SAFETY & GOLD QUALITY ────────────────────────────────────────────────
    FaqItem(
        category = "Safety & Gold Quality",
        question = "Is my gold really safe? Where is it stored?",
        answer = "Your gold is stored in BIS-certified, fully insured secured vaults. It is 99.9% pure 24K gold — the highest purity standard. The vault is audited quarterly, and certificates are available on request. Your gold cannot be used for any other purpose."
    ),
    FaqItem(
        category = "Safety & Gold Quality",
        question = "What is the purity of the gold I am buying?",
        answer = "All gold on the Aishwaryam platform is 99.9% pure 24K gold — the highest standard of gold purity. This is the same purity as gold coins sold by the government of India."
    ),
    FaqItem(
        category = "Safety & Gold Quality",
        question = "Is GST included in my payment?",
        answer = "Yes. A 3% GST as mandated by the Government of India is included in every gold purchase. Your invoice clearly shows the base amount and GST component separately. You will receive a GST-compliant invoice for every transaction."
    ),

    // ── REDEMPTION ─────────────────────────────────────────────────────────
    FaqItem(
        category = "Redemption",
        question = "How do I redeem my gold when the scheme matures?",
        answer = "On your maturity date, you will receive a notification. You can then:\n• Visit our nearest showroom with your maturity certificate\n• Choose physical gold coins, bars, or convert to jewellery\n• Or request home delivery (charges may apply)\n\nOur team will contact you to guide you through the process."
    ),
    FaqItem(
        category = "Redemption",
        question = "Can I exit the scheme before maturity?",
        answer = "Scheme gold is locked until the maturity date to protect your savings discipline and maintain your bonus entitlement. If you face a genuine emergency, please contact our support team — we will review on a case-by-case basis."
    ),
    FaqItem(
        category = "Redemption",
        question = "What is the difference between Locked and Redeemable gold?",
        answer = "Locked Gold is in an active scheme — it cannot be sold or redeemed until the scheme matures. Redeemable Gold is fully available — either from matured schemes or from direct gold purchases. Both are stored safely in your account at all times."
    ),

    // ── KYC & ACCOUNT ──────────────────────────────────────────────────────
    FaqItem(
        category = "KYC & Account",
        question = "Why is KYC required? Is it safe?",
        answer = "KYC is required by Indian regulations for all financial platforms. It verifies your identity and protects your gold from fraud. Your PAN and Aadhaar data is encrypted and never shared with third parties. KYC also allows you to save up to ₹2 Lakhs per year."
    ),
    FaqItem(
        category = "KYC & Account",
        question = "How do I change my bank account for gold redemption payouts?",
        answer = "Go to Profile → Bank Accounts → Add New Bank Account. Your bank account must be in your name (as per KYC). Once added and verified, it becomes your default payout account."
    ),

    // ── PAYMENTS ───────────────────────────────────────────────────────────
    FaqItem(
        category = "Payments",
        question = "What payment methods are accepted?",
        answer = "We accept UPI, Debit Cards, Credit Cards, and Net Banking via our secure payment gateway. All transactions are encrypted and processed through RBI-regulated payment systems."
    ),
    FaqItem(
        category = "Payments",
        question = "My payment was deducted but gold was not credited. What do I do?",
        answer = "Payment failures are automatically detected and reconciled within 24 hours. If your gold is not credited within 24 hours of a successful payment, please contact our support team at support@aishwaryam.com with your transaction reference number. We guarantee resolution."
    )
)

private val categories = faqs.map { it.category }.distinct()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FaqScreen(onBackClick: () -> Unit) {
    var selectedCategory by remember { mutableStateOf("All") }
    val displayFaqs = if (selectedCategory == "All") faqs
    else faqs.filter { it.category == selectedCategory }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        "Frequently Asked Questions",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
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
                        .background(Brush.verticalGradient(listOf(BrandDark, Color(0xFF2D0B4E))))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        TText(
                            "We're here to help",
                            fontFamily = PlayfairFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 22.sp,
                            color = GoldWarm
                        )
                        Spacer(Modifier.height(6.dp))
                        TText(
                            "Everything you need to know about saving gold with Aishwaryam",
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.75f),
                            textAlign = TextAlign.Center
                        )
                        Spacer(Modifier.height(16.dp))
                        TText(
                            "${faqs.size} questions answered",
                            fontFamily = PoppinsFamily,
                            fontSize = 12.sp,
                            color = BrandAccent,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // ── Category Filter ──────────────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
                    TText(
                        "Browse by topic",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = TextMuted,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )
                    // First row
                    val allCats = listOf("All") + categories
                    val rows = allCats.chunked(3)
                    rows.forEach { rowItems ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            rowItems.forEach { cat ->
                                val isSelected = cat == selectedCategory
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { selectedCategory = cat },
                                    label = {
                                        TText(
                                            cat,
                                            fontSize = 11.sp,
                                            fontFamily = PoppinsFamily,
                                            fontWeight = FontWeight.Medium
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = BrandDark,
                                        selectedLabelColor = Color.White
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            // Fill empty slots
                            repeat(3 - rowItems.size) {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                }
            }

            // ── FAQ Items ────────────────────────────────────────────────────
            items(displayFaqs) { faq ->
                FaqItemCard(faq = faq)
            }

            // ── Still have questions ─────────────────────────────────────────
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceGold),
                    border = androidx.compose.foundation.BorderStroke(1.dp, GoldWarm.copy(0.3f))
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(GoldWarm.copy(0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.HeadsetMic, null, tint = GoldDeep, modifier = Modifier.size(24.dp))
                        }
                        Column {
                            TText(
                                    "Still have questions?",
                                    fontFamily = PoppinsFamily,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = TextPrimary
                                )
                                TText(
                                    "Contact our support team — we're here to help.",
                                    fontFamily = PoppinsFamily,
                                    fontSize = 12.sp,
                                    color = TextMuted
                                )
                                Spacer(Modifier.height(4.dp))
                                TText(
                                    "support@aishwaryam.com",
                                    fontFamily = PoppinsFamily,
                                    fontSize = 12.sp,
                                    color = BrandAccent,
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
private fun FaqItemCard(faq: FaqItem) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .animateContentSize(animationSpec = tween(260))
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (expanded) BrandDark.copy(0.04f) else SurfaceWhite
        ),
        elevation = CardDefaults.cardElevation(if (expanded) 0.dp else 1.dp),
        border = if (expanded)
            androidx.compose.foundation.BorderStroke(1.dp, BrandDark.copy(0.15f))
        else null
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TText(
                    faq.question,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    color = if (expanded) BrandDark else TextPrimary,
                    modifier = Modifier.weight(1f),
                    lineHeight = 20.sp
                )
                Spacer(Modifier.width(8.dp))
                Icon(
                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    null,
                    tint = if (expanded) BrandAccent else TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            }
            if (expanded) {
                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = BrandDark.copy(0.08f))
                Spacer(Modifier.height(12.dp))
                TText(
                    faq.answer,
                    fontFamily = PoppinsFamily,
                    fontSize = 13.sp,
                    color = TextSecondary,
                    lineHeight = 21.sp
                )
            }
        }
    }
}
