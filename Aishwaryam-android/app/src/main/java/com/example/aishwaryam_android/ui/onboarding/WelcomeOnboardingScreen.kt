package com.example.aishwaryam_android.ui.onboarding

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.stringResource
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME ONBOARDING SCREEN
// Pre-login trust-building swipe slides
// Audience: Tamil Nadu / Coimbatore families — first-time gold savers
// ═══════════════════════════════════════════════════════════════════════════

data class OnboardingSlide(
    val icon: ImageVector,
    val iconBgGradient: List<Color>,
    val badgeRes: Int,
    val titleRes: Int,
    val subtitleRes: Int,
    val bodyRes: Int,
    val highlightStat: String,
    val highlightLabelRes: Int,
    val accentColor: Color
)

private val slides = listOf(
    OnboardingSlide(
        icon = Icons.Default.Star,
        iconBgGradient = listOf(Color(0xFFFFD700), Color(0xFFB8860B)),
        badgeRes = R.string.onboarding_trust_badge,
        titleRes = R.string.onboarding_save_future_title,
        subtitleRes = R.string.onboarding_save_future_subtitle,
        bodyRes = R.string.onboarding_save_future_body,
        highlightStat = "₹100",
        highlightLabelRes = R.string.onboarding_save_future_stat_label,
        accentColor = GoldWarm
    ),
    OnboardingSlide(
        icon = Icons.Default.Shield,
        iconBgGradient = listOf(Color(0xFF10B981), Color(0xFF047857)),
        badgeRes = R.string.onboarding_secure_badge,
        titleRes = R.string.onboarding_secure_title,
        subtitleRes = R.string.onboarding_secure_subtitle,
        bodyRes = R.string.onboarding_secure_body,
        highlightStat = "99.9%",
        highlightLabelRes = R.string.onboarding_secure_stat_label,
        accentColor = SuccessGreen
    ),
    OnboardingSlide(
        icon = Icons.Default.EmojiEvents,
        iconBgGradient = listOf(Color(0xFFC2185B), Color(0xFF4A0E4E)),
        badgeRes = R.string.onboarding_bonus_badge,
        titleRes = R.string.onboarding_bonus_title,
        subtitleRes = R.string.onboarding_bonus_subtitle,
        bodyRes = R.string.onboarding_bonus_body,
        highlightStat = "7.5%",
        highlightLabelRes = R.string.onboarding_bonus_stat_label,
        accentColor = BrandAccent
    )
)

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun WelcomeOnboardingScreen(
    onGetStarted: () -> Unit,
    onSkip: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val sessionManager = remember { com.example.aishwaryam_android.data.SessionManager(context) }

    // Instant local cache restoration on composition (loads in <10ms!)
    var dynamicBanners by remember {
        mutableStateOf<List<com.example.aishwaryam_android.network.BannerItem>>(
            try {
                val cachedJson = sessionManager.getCachedOnboardingBanners()
                if (!cachedJson.isNullOrEmpty()) {
                    val typeToken = object : com.google.gson.reflect.TypeToken<List<com.example.aishwaryam_android.network.BannerItem>>() {}.type
                    com.google.gson.Gson().fromJson(cachedJson, typeToken)
                } else {
                    emptyList()
                }
            } catch (e: Exception) {
                emptyList()
            }
        )
    }

    // Only display loading spinner on fresh installs when cache is completely empty
    var isLoading by remember { mutableStateOf(dynamicBanners.isEmpty()) }

    LaunchedEffect(Unit) {
        try {
            val response = com.example.aishwaryam_android.network.ApiClient.apiService.getBannersByLocation("ONBOARDING")
            if (response.isSuccessful && response.body()?.success == true) {
                val fetchedBanners = response.body()?.banners ?: emptyList()
                
                // Silently update the cache in the background for all subsequent launches
                val json = com.google.gson.Gson().toJson(fetchedBanners)
                sessionManager.saveCachedOnboardingBanners(json)
                
                // CRITICAL UX FIX: Only update the active UI state if the cache was empty on launch.
                // If we already loaded cached slides, keep them stable for this session to prevent
                // layout shifts or pager scroll corruption under the user's finger!
                if (dynamicBanners.isEmpty()) {
                    dynamicBanners = fetchedBanners
                }
            }
        } catch (e: Exception) {
            // Keep current cache intact in case of offline/network failures
        } finally {
            isLoading = false
        }
    }

    if (isLoading) {
        // Show premium centered loading animation while fetching backend banners to prevent jumpy layout pops
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(listOf(BrandDeep, Color(0xFF1A0030)))
                ),
            contentAlignment = Alignment.Center
        ) {
            com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(
                modifier = Modifier.size(80.dp)
            )
        }
    } else {
        val pageCount = if (dynamicBanners.isNotEmpty()) dynamicBanners.size else slides.size
        
        // CRITICAL SCROLL FIX: Wrap PagerState in key(pageCount) so that if the page count changes,
        // the state is recreated cleanly instead of getting stuck mid-scroll!
        val pagerState = androidx.compose.runtime.key(pageCount) {
            rememberPagerState(pageCount = { pageCount })
        }
        val coroutineScope = rememberCoroutineScope()
        val isLastPage = pagerState.currentPage == (pageCount - 1)

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(listOf(BrandDeep, Color(0xFF1A0030)))
                )
        ) {
            // ── 1. Full-Screen Pager (Edge-to-Edge Background) ───────────────────
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxSize()
            ) { page ->
                if (dynamicBanners.isNotEmpty()) {
                    DynamicSlideContent(banner = dynamicBanners[page])
                } else {
                    // Local slides remain centered, keeping comfortable margins for floating elements
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 80.dp, bottom = 220.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        SlideContent(slide = slides[page])
                    }
                }
            }

            // ── 2. Floating Skip Button (Top Right) ─────────────────────────────
            if (!isLastPage) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp)
                        .statusBarsPadding(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onSkip) {
                        Text(
                            stringResource(R.string.skip),
                            color = Color.White,
                            fontSize = 14.sp,
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                }
            }

            // ── 3. Floating Carousel Dots & CTA Button (Bottom Center) ───────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(horizontal = 28.dp)
                    .padding(bottom = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(28.dp)
            ) {
                // Page indicator dots
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(pageCount) { i ->
                        val isActive = i == pagerState.currentPage
                        val width by animateDpAsState(
                            targetValue = if (isActive) 24.dp else 8.dp,
                            animationSpec = tween(300),
                            label = "dotWidth"
                        )
                        val accentColor = if (dynamicBanners.isNotEmpty()) GoldWarm else slides[pagerState.currentPage].accentColor
                        val color by animateColorAsState(
                            targetValue = if (isActive) accentColor else Color.White.copy(alpha = 0.4f),
                            animationSpec = tween(300),
                            label = "dotColor"
                        )
                        Box(
                            modifier = Modifier
                                .width(width)
                                .height(8.dp)
                                .clip(CircleShape)
                                .background(color)
                        )
                    }
                }

                // CTA Button
                Button(
                    onClick = {
                        if (isLastPage) {
                            onGetStarted()
                        } else {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isLastPage) GoldWarm else BrandAccent
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 8.dp)
                ) {
                    Text(
                        text = if (isLastPage) stringResource(R.string.start_saving_gold_emoji) else stringResource(R.string.next),
                        fontSize = 16.sp,
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isLastPage) Color(0xFF1A1200) else Color.White
                    )
                }

                // Login nudge
                TextButton(onClick = onGetStarted) {
                    Text(
                        stringResource(R.string.already_have_account_login),
                        color = Color.White,
                        fontSize = 13.sp,
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun SlideContent(slide: OnboardingSlide) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        visible = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {

        // ── Hero Icon ────────────────────────────────────────────────────────
        AnimatedVisibility(
            visible = visible,
            enter = fadeIn(tween(500)) + slideInVertically(tween(500)) { it / 2 }
        ) {
            val pulse = rememberInfiniteTransition(label = "pulse")
            val scale by pulse.animateFloat(
                initialValue = 1f, targetValue = 1.06f,
                animationSpec = infiniteRepeatable(tween(2000), RepeatMode.Reverse),
                label = "iconPulse"
            )
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(Brush.radialGradient(slide.iconBgGradient)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = slide.icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(58.dp)
                )
            }
        }

        Spacer(Modifier.height(28.dp))

        // ── Badge ────────────────────────────────────────────────────────────
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 150))) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(slide.accentColor.copy(alpha = 0.18f))
                    .padding(horizontal = 14.dp, vertical = 5.dp)
            ) {
                Text(
                    text = stringResource(slide.badgeRes),
                    color = slide.accentColor,
                    fontSize = 10.sp,
                    fontFamily = PoppinsFamily,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.5.sp
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Title ────────────────────────────────────────────────────────────
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 200))) {
            Text(
                text = stringResource(slide.titleRes),
                fontSize = 30.sp,
                fontFamily = PlayfairFamily,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center,
                lineHeight = 38.sp
            )
        }

        Spacer(Modifier.height(8.dp))

        // ── Subtitle ─────────────────────────────────────────────────────────
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 300))) {
            Text(
                text = stringResource(slide.subtitleRes),
                fontSize = 15.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Medium,
                color = slide.accentColor,
                textAlign = TextAlign.Center
            )
        }

        Spacer(Modifier.height(20.dp))

        // ── Body text ────────────────────────────────────────────────────────
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 400))) {
            Text(
                text = stringResource(slide.bodyRes),
                fontSize = 14.sp,
                fontFamily = PoppinsFamily,
                fontWeight = FontWeight.Normal,
                color = Color.White.copy(alpha = 0.72f),
                textAlign = TextAlign.Center,
                lineHeight = 22.sp
            )
        }

        Spacer(Modifier.height(28.dp))

        // ── Stat highlight chip ──────────────────────────────────────────────
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(600, 500))) {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Color.White.copy(alpha = 0.08f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp, slide.accentColor.copy(alpha = 0.3f)
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = slide.highlightStat,
                        fontSize = 26.sp,
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.ExtraBold,
                        color = slide.accentColor
                    )
                    Text(
                        text = stringResource(slide.highlightLabelRes),
                        fontSize = 14.sp,
                        fontFamily = PoppinsFamily,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

@Composable
private fun DynamicSlideContent(banner: com.example.aishwaryam_android.network.BannerItem) {
    val isUrl = remember(banner.imageBase64) {
        banner.imageBase64.startsWith("http://", ignoreCase = true) ||
        banner.imageBase64.startsWith("https://", ignoreCase = true) ||
        banner.imageBase64.startsWith("/uploads/", ignoreCase = true)
    }

    val bitmap = remember(banner.imageBase64, isUrl) {
        if (isUrl) {
            null
        } else {
            try {
                val cleanBase64 = banner.imageBase64.substringAfter(",")
                val imageBytes = android.util.Base64.decode(cleanBase64, android.util.Base64.DEFAULT)
                android.graphics.BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            } catch (e: Exception) {
                null
            }
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        if (isUrl) {
            val imageUrl = remember(banner.imageBase64) {
                if (banner.imageBase64.startsWith("/uploads/", ignoreCase = true)) {
                    val baseUrl = com.example.aishwaryam_android.BuildConfig.BASE_URL.removeSuffix("/")
                    baseUrl + banner.imageBase64
                } else {
                    banner.imageBase64
                }
            }
            // Lifetime Industry Standard: High-performance Coil image loader with OS-level disk and memory caching
            coil.compose.AsyncImage(
                model = imageUrl,
                contentDescription = banner.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            // Premium visual legibility scrim overlay (Top/Bottom shadows)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.4f), // top shadow for "Skip" button readability
                                Color.Transparent,
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.6f)  // bottom shadow for "Next" button & dots readability
                            )
                        )
                    )
            )
        } else if (bitmap != null) {
            // Retrocompatible fallback: Render legacy base64 images directly
            androidx.compose.foundation.Image(
                bitmap = bitmap.asImageBitmap(),
                contentDescription = banner.title,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            // Premium visual legibility scrim overlay (Top/Bottom shadows)
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.4f),
                                Color.Transparent,
                                Color.Transparent,
                                Color.Black.copy(alpha = 0.6f)
                            )
                        )
                    )
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = banner.title,
                    fontSize = 24.sp,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontFamily = PoppinsFamily,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
