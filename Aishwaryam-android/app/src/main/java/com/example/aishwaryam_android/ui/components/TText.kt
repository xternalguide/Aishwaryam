package com.example.aishwaryam_android.ui.components

import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import com.example.aishwaryam_android.utils.LocaleHelper
import com.example.aishwaryam_android.utils.TranslationManager

/**
 * TText — "Translatable Text" — drop-in replacement for Compose's Text()
 * when using string resource IDs.
 *
 * Usage (replaces):
 *   Text(stringResource(R.string.dashboard_title))
 *
 * With:
 *   TText(R.string.dashboard_title)
 *
 * How it works:
 * 1. Reads the English string via stringResource()
 * 2. Checks if TranslationManager has a cached Tamil translation
 * 3. If cached → shows it instantly (no delay, no network)
 * 4. If not cached → shows English, then asynchronously translates
 *    and updates the displayed text when ready
 */
@Composable
fun TText(
    resId: Int,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontWeight: FontWeight? = null,
    fontFamily: androidx.compose.ui.text.font.FontFamily? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    style: TextStyle = TextStyle.Default,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip
) {
    val context = LocalContext.current
    val englishText = stringResource(resId)
    val cacheKey = "res_$resId"
    val lang = remember { LocaleHelper.getSelectedLanguage(context) }

    var displayText by remember(resId, lang) {
        // Show cached instantly, or fallback to English
        mutableStateOf(TranslationManager.get(cacheKey, englishText))
    }

    // If Tamil and not yet cached, translate asynchronously
    LaunchedEffect(resId, lang) {
        if (lang != "en") {
            val translated = TranslationManager.translateAndCache(cacheKey, englishText)
            displayText = translated
        }
    }

    Text(
        text = displayText,
        modifier = modifier,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        fontFamily = fontFamily,
        letterSpacing = letterSpacing,
        style = style,
        textAlign = textAlign,
        lineHeight = lineHeight,
        maxLines = maxLines,
        overflow = overflow
    )
}

/**
 * TText variant for raw English strings (e.g., from database or dynamic content).
 *
 * Usage:
 *   TText(text = scheme.planName)
 */
@Composable
fun TText(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontWeight: FontWeight? = null,
    fontFamily: androidx.compose.ui.text.font.FontFamily? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    style: TextStyle = TextStyle.Default,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip
) {
    val context = LocalContext.current
    val cacheKey = "dyn_${text.hashCode()}"
    val lang = remember { LocaleHelper.getSelectedLanguage(context) }

    var displayText by remember(text, lang) {
        mutableStateOf(TranslationManager.get(cacheKey, text))
    }

    LaunchedEffect(text, lang) {
        if (lang != "en") {
            val translated = TranslationManager.translateAndCache(cacheKey, text)
            displayText = translated
        }
    }

    Text(
        text = displayText,
        modifier = modifier,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        fontFamily = fontFamily,
        letterSpacing = letterSpacing,
        style = style,
        textAlign = textAlign,
        lineHeight = lineHeight,
        maxLines = maxLines,
        overflow = overflow
    )
}
