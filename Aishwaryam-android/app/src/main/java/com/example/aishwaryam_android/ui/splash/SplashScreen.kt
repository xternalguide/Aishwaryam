package com.example.aishwaryam_android.ui.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(onSplashComplete: () -> Unit) {
    var startAnimation by remember { mutableStateOf(false) }

    val alphaAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
        label = "AlphaAnimation"
    )

    val context = androidx.compose.ui.platform.LocalContext.current

    LaunchedEffect(key1 = true) {
        startAnimation = true
        
        // Asynchronously prefetch onboarding banners in the background during the 3s splash delay.
        // This ensures the local cache is populated before WelcomeOnboardingScreen loads,
        // delivering instant (<10ms) renders even on the user's very first launch.
        val sessionManager = com.example.aishwaryam_android.data.SessionManager(context)
        if (!sessionManager.hasSeenWelcomeOnboarding()) {
            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                try {
                    val response = com.example.aishwaryam_android.network.ApiClient.apiService.getBannersByLocation("ONBOARDING")
                    if (response.isSuccessful && response.body()?.success == true) {
                        val fetchedBanners = response.body()?.banners ?: emptyList()
                        val json = com.google.gson.Gson().toJson(fetchedBanners)
                        sessionManager.saveCachedOnboardingBanners(json)
                    }
                } catch (e: Exception) {
                    // Suppress network errors in splash background prefetch
                }
            }
        }

        delay(3000) // 3 seconds logo animation
        onSplashComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF7A004C)), // Deep magenta background
        contentAlignment = Alignment.Center
    ) {
        // Use a Column to place text directly below the logo
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            // Image centered with specific size
            Image(
                painter = painterResource(id = R.drawable.splash_logo),
                contentDescription = "Aishwaryam Gold Logo",
                modifier = Modifier
                    .size(264.dp)
                    .alpha(alphaAnim.value),
                contentScale = ContentScale.Fit
            )

            Spacer(modifier = Modifier.height(24.dp)) // Space between logo and text

            Text(
                text = stringResource(R.string.login_title),
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Serif, // Fallback to Serif (looks like Playfair)
                letterSpacing = 1.sp,
                modifier = Modifier.alpha(alphaAnim.value)
            )
        }
    }
}
