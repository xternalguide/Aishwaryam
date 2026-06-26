package com.example.aishwaryam_android.ui.components

import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.isUnspecified
import androidx.compose.ui.unit.sp

/**
 * A Text component that automatically scales its font size down to fit within its constraints.
 * Prevents text overflowing, wrapping to multiple lines when single line is desired, or clipping.
 */
@Composable
fun AutoSizeText(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    fontSize: TextUnit = TextUnit.Unspecified,
    fontStyle: FontStyle? = null,
    fontWeight: FontWeight? = null,
    fontFamily: FontFamily? = null,
    letterSpacing: TextUnit = TextUnit.Unspecified,
    textAlign: TextAlign? = null,
    lineHeight: TextUnit = TextUnit.Unspecified,
    overflow: TextOverflow = TextOverflow.Clip,
    maxLines: Int = 1,
    style: TextStyle = LocalTextStyle.current
) {
    val initialFontSize = if (!fontSize.isUnspecified) fontSize else style.fontSize
    val safeInitialFontSize = if (initialFontSize.isUnspecified) 16.sp else initialFontSize

    var calculatedFontSize by remember(text, safeInitialFontSize) {
        mutableStateOf(safeInitialFontSize)
    }

    var readyToDraw by remember(text, safeInitialFontSize) {
        mutableStateOf(false)
    }

    Text(
        text = text,
        modifier = modifier.drawWithContent {
            if (readyToDraw) {
                drawContent()
            }
        },
        color = color,
        fontSize = calculatedFontSize,
        fontStyle = fontStyle,
        fontWeight = fontWeight,
        fontFamily = fontFamily,
        letterSpacing = letterSpacing,
        textAlign = textAlign,
        lineHeight = lineHeight,
        overflow = overflow,
        maxLines = maxLines,
        style = style,
        onTextLayout = { textLayoutResult ->
            if (textLayoutResult.hasVisualOverflow && calculatedFontSize.value > 8f) {
                calculatedFontSize = (calculatedFontSize.value * 0.9f).sp
            } else {
                readyToDraw = true
            }
        }
    )
}
