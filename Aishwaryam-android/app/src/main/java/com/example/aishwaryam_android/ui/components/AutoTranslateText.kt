package com.example.aishwaryam_android.ui.components

import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.TextUnit
import com.example.aishwaryam_android.utils.DynamicTranslator
import com.example.aishwaryam_android.utils.LocaleHelper

/**
 * A Text component that automatically translates its content if the app language is not English.
 * Useful for data coming from the Admin Panel.
 */
@Composable
fun AutoTranslateText(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontWeight: androidx.compose.ui.text.font.FontWeight? = null,
    style: TextStyle = TextStyle.Default,
    textAlign: androidx.compose.ui.text.style.TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    maxLines: Int = Int.MAX_VALUE,
    overflow: androidx.compose.ui.text.style.TextOverflow = androidx.compose.ui.text.style.TextOverflow.Clip
) {
    val context = LocalContext.current
    val currentLang = remember { LocaleHelper.getSelectedLanguage(context) }
    var displayedText by remember(text, currentLang) { mutableStateOf(text) }

    LaunchedEffect(text, currentLang) {
        if (currentLang != "en") {
            displayedText = DynamicTranslator.translate(text, currentLang)
        }
    }

    Text(
        text = displayedText,
        modifier = modifier,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        style = style,
        textAlign = textAlign,
        lineHeight = lineHeight,
        maxLines = maxLines,
        overflow = overflow
    )
}
