package com.example.aishwaryam_android.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.IntSize
import com.airbnb.lottie.compose.*

/**
 * Premium Shimmer Loading Effect
 * Used for Skeleton loading states to improve perceived performance.
 */
fun Modifier.shimmerEffect(): Modifier = composed {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val transition = rememberInfiniteTransition(label = "shimmer_transition")
    val startOffsetX by transition.animateFloat(
        initialValue = -2 * size.width.toFloat(),
        targetValue = 2 * size.width.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_offsetX"
    )

    background(
        brush = Brush.linearGradient(
            colors = listOf(
                Color(0xFFE0E0E0),
                Color(0xFFF5F5F5),
                Color(0xFFE0E0E0),
            ),
            start = Offset(startOffsetX, 0f),
            end = Offset(startOffsetX + size.width.toFloat(), size.height.toFloat())
        )
    ).onSizeChanged { size = it }
}

/**
 * Premium Animated Text for Gold Balance, Returns, Streaks, etc.
 */
@Composable
fun AnimatedCounter(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = TextStyle.Default,
    prefix: String = "",
    suffix: String = ""
) {
    var oldText by remember { mutableStateOf(text) }
    SideEffect { oldText = text }

    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        if (prefix.isNotEmpty()) {
            Text(prefix, style = style)
        }
        
        for (i in text.indices) {
            val newChar = text[i]
            
            AnimatedContent(
                targetState = newChar,
                transitionSpec = {
                    slideInVertically { it } + fadeIn() togetherWith slideOutVertically { -it } + fadeOut()
                },
                label = "AnimatedCounter"
            ) { charText ->
                Text(charText.toString(), style = style, softWrap = false)
            }
        }
        if (suffix.isNotEmpty()) {
            Text(suffix, style = style)
        }
    }
}

/**
 * Premium Celebration Lottie Animation
 */
@Composable
fun CelebrationAnimation(
    modifier: Modifier = Modifier,
    isPlaying: Boolean = true,
    animationUrl: String = "https://lottie.host/93dc49c5-67de-49dc-b295-d22ffc32f831/S16q7gMh52.json", // Sample confetti URL
    onAnimationEnd: () -> Unit = {}
) {
    val composition by rememberLottieComposition(LottieCompositionSpec.Url(animationUrl))
    val progress by animateLottieCompositionAsState(
        composition = composition,
        isPlaying = isPlaying,
        iterations = 1
    )

    LaunchedEffect(progress) {
        if (progress == 1f) {
            onAnimationEnd()
        }
    }

    if (composition != null) {
        LottieAnimation(
            composition = composition,
            progress = { progress },
            modifier = modifier
        )
    }
}

/**
 * Premium Gold Coin Loading Animation
 */
@Composable
fun GoldCoinLoadingAnimation(modifier: Modifier = Modifier) {
    // A reliable URL for a gold coin loading animation or similar elegant loader
    val composition by rememberLottieComposition(
        LottieCompositionSpec.Url("https://lottie.host/022bf68d-da3e-4d43-9844-3c66f914b4f3/4BfE0uK8mD.json")
    )
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = LottieConstants.IterateForever
    )

    if (composition != null) {
        LottieAnimation(
            composition = composition,
            progress = { progress },
            modifier = modifier
        )
    } else {
        androidx.compose.material3.CircularProgressIndicator(modifier = modifier)
    }
}
