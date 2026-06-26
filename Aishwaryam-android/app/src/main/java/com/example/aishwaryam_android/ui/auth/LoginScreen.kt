package com.example.aishwaryam_android.ui.auth

import android.app.Activity
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import com.example.aishwaryam_android.R

// ── Professional FinTech Colour tokens ─────────────────────────────────────
private val MagentaPrimary = Color(0xFF4A0E4E) // Deep Wine
private val SurfaceLight   = Color(0xFFF8F9FA) // Clean White/Grey

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: (isNewUser: Boolean, isMpinSet: Boolean) -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val activity = context as Activity

    var phoneNumber by rememberSaveable { mutableStateOf("") }
    var otp        by rememberSaveable { mutableStateOf("") }
    val focusManager = LocalFocusManager.current

    var isOtpFlow by rememberSaveable { mutableStateOf(false) }
    var secondsRemaining by remember { mutableStateOf(30) }
    var showSuccessPopup by remember { mutableStateOf(false) }
    var successData by remember { mutableStateOf<AuthUiState.Success?>(null) }
    val otpFocusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        viewModel.resetState()
    }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.OtpSent) {
            isOtpFlow = true
        } else if (uiState is AuthUiState.Idle || uiState is AuthUiState.Error) {
            isOtpFlow = false
        }
    }

    // Countdown Timer logic
    LaunchedEffect(isOtpFlow) {
        if (isOtpFlow) {
            secondsRemaining = 30
            try {
                otpFocusRequester.requestFocus()
            } catch (ignored: Exception) {}
        }
    }

    LaunchedEffect(secondsRemaining, isOtpFlow) {
        if (isOtpFlow && secondsRemaining > 0) {
            kotlinx.coroutines.delay(1000L)
            secondsRemaining -= 1
        }
    }

    // Navigate on success (with animation delay)
    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            successData = uiState as AuthUiState.Success
            showSuccessPopup = true
        }
    }

    Scaffold(containerColor = SurfaceLight) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .imePadding()
                    .verticalScroll(rememberScrollState())
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // ── Logo ────────────────────────────────────────────────────────
                Box(
                    modifier = Modifier.size(80.dp).padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        shape = RoundedCornerShape(24.dp),
                        color = MagentaPrimary,
                        shadowElevation = 8.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("A", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = stringResource(R.string.login_subtitle),
                    fontSize = 24.sp,
                    color = Color.Black,
                    fontWeight = FontWeight.ExtraBold
                )
                Spacer(modifier = Modifier.height(4.dp))

                Spacer(modifier = Modifier.height(48.dp))

                // ── Error Alert Box ─────────────────────────────────────────────
                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = Color(0xFFD32F2F),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }

                // ── State-driven UI (Phone Entry or 6-digit OTP Box Verification) ────
                if (isOtpFlow) {
                    Text(
                        "OTP sent to +91 $phoneNumber",
                        fontWeight = FontWeight.SemiBold,
                        color = Color.Black,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Check your SMS inbox",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(24.dp))

                    // ── 6-Digit Square FinTech OTP Inputs ───────────────────────
                    OtpPinInput(
                        value = otp,
                        onValueChange = {
                            otp = it
                            if (it.length == 6) {
                                focusManager.clearFocus()
                                viewModel.verifyOtp(it)
                            }
                        },
                        focusRequester = otpFocusRequester
                    )
                    Spacer(modifier = Modifier.height(32.dp))

                    Button(
                        onClick = { viewModel.verifyOtp(otp) },
                        enabled = otp.length == 6 && uiState !is AuthUiState.Loading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MagentaPrimary,
                            contentColor = Color.White,
                            disabledContainerColor = MagentaPrimary.copy(alpha = 0.3f),
                            disabledContentColor = Color.White
                        )
                    ) {
                        if (uiState is AuthUiState.Loading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(stringResource(R.string.verify_continue), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Resend OTP (Hits C# Backend to dispatch a fresh 6-digit SMS code)
                    TextButton(
                        onClick = {
                            otp = ""
                            secondsRemaining = 30 // Reset timer
                            viewModel.resendOtp(activity)
                        },
                        enabled = secondsRemaining == 0 && uiState !is AuthUiState.Loading
                    ) {
                        val labelText = if (secondsRemaining > 0) {
                            "Did not receive OTP? Resend in ${secondsRemaining}s"
                        } else {
                            "Did not receive OTP? Resend OTP"
                        }
                        Text(
                            text = labelText,
                            color = if (secondsRemaining > 0) Color.Gray else MagentaPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                } else {
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = {
                            if (it.all { c -> c.isDigit() } && it.length <= 10) {
                                if (it.isEmpty() || it.first() in '6'..'9') {
                                    phoneNumber = it
                                    if (it.length == 10) {
                                        focusManager.clearFocus()
                                    }
                                }
                            }
                        },
                        label = { Text(stringResource(R.string.mobile_number)) },
                        placeholder = { Text(stringResource(R.string.mobile_placeholder), color = Color.Gray) },
                        prefix = { Text("+91 ", color = Color.Black, fontWeight = FontWeight.Bold) },
                        leadingIcon = { Icon(Icons.Default.Phone, null, tint = MagentaPrimary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MagentaPrimary,
                            unfocusedBorderColor = Color.LightGray,
                            focusedLabelColor = MagentaPrimary,
                            unfocusedLabelColor = Color.Gray,
                            focusedTextColor = Color.Black,
                            unfocusedTextColor = Color.Black,
                            cursorColor = MagentaPrimary
                        )
                    )
                    Spacer(modifier = Modifier.height(32.dp))

                    val isValidPhone = phoneNumber.length == 10 && phoneNumber.matches(Regex("^[6-9]\\d{9}$"))
                    Button(
                        onClick = {
                            viewModel.sendOtp(phoneNumber, activity)
                        },
                        enabled = isValidPhone && uiState !is AuthUiState.Loading,
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MagentaPrimary,
                            contentColor = Color.White,
                            disabledContainerColor = MagentaPrimary.copy(alpha = 0.3f),
                            disabledContentColor = Color.White
                        )
                    ) {
                        if (uiState is AuthUiState.Loading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(stringResource(R.string.get_otp), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        "You will receive an SMS with a 6-digit OTP",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Support Option (Google Play Compliance - Easy Contact Option)
                TextButton(
                    onClick = {
                        val intent = android.content.Intent(android.content.Intent.ACTION_DIAL).apply {
                            data = android.net.Uri.parse("tel:+919443000000")
                        }
                        try { context.startActivity(intent) } catch (e: Exception) {
                            android.widget.Toast.makeText(context, "Support Hotline: +91 94430 00000", android.widget.Toast.LENGTH_LONG).show()
                        }
                    }
                ) {
                    Text(
                        text = "Need Help? Contact Customer Support",
                        color = MagentaPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Success Tick Overlay Dialog
            if (showSuccessPopup && successData != null) {
                SuccessTickDialog(
                    onDismiss = {
                        showSuccessPopup = false
                        onLoginSuccess(successData!!.isNewUser, successData!!.isMpinSet)
                    }
                )
            }
        }
    }
}

/**
 * Premium 6-Digit Square Box Input Composable.
 * Leverages an invisible native BasicTextField overlay to support native Gboard auto-fill OTP tap suggestions seamlessly
 * and highlights active inputs with elegant border states.
 */
@Composable
fun OtpPinInput(
    value: String,
    onValueChange: (String) -> Unit,
    focusRequester: FocusRequester,
    modifier: Modifier = Modifier,
    length: Int = 6
) {
    var isFieldFocused by remember { mutableStateOf(false) }

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                try {
                    focusRequester.requestFocus()
                } catch (ignored: Exception) {}
            }
    ) {
        // 6 beautifully decorated square FinTech boxes rendered FIRST
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            repeat(length) { index ->
                val char = value.getOrNull(index)?.toString() ?: ""
                val isFocused = isFieldFocused && value.length == index

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .aspectRatio(1f)
                        .requiredSizeIn(maxWidth = 48.dp, maxHeight = 48.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = SurfaceLight,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isFocused) 2.dp else 1.dp,
                        color = if (isFocused) MagentaPrimary else Color.LightGray
                    ),
                    shadowElevation = if (isFocused) 4.dp else 0.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = char,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = MagentaPrimary,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }

        // Hidden input field rendered SECOND (on top) to naturally capture touch events
        val transparentSelectionColors = TextSelectionColors(
            handleColor = Color.Transparent,
            backgroundColor = Color.Transparent
        )
        CompositionLocalProvider(LocalTextSelectionColors provides transparentSelectionColors) {
            androidx.compose.foundation.text.BasicTextField(
                value = value,
                onValueChange = {
                    if (it.length <= length && it.all { c -> c.isDigit() }) {
                        onValueChange(it)
                    }
                },
                cursorBrush = SolidColor(Color.Transparent),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Number
                ),
                modifier = Modifier
                    .matchParentSize()
                    .focusRequester(focusRequester)
                    .onFocusChanged { isFieldFocused = it.isFocused }
                    .alpha(0f) // Keep it completely hidden but fully focused & interactive
            )
        }
    }
}

@Composable
fun SuccessTickDialog(
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = {}, // Block dismiss by tapping outside
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false
        )
    ) {
        Surface(
            modifier = Modifier.size(200.dp),
            shape = RoundedCornerShape(28.dp),
            color = Color.White,
            shadowElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                SuccessTickAnimation(
                    modifier = Modifier.size(90.dp),
                    onAnimationFinished = onDismiss
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Login Successful",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color.Black,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun SuccessTickAnimation(
    modifier: Modifier = Modifier,
    onAnimationFinished: () -> Unit
) {
    val scale = remember { androidx.compose.animation.core.Animatable(0f) }
    val pathProgress = remember { androidx.compose.animation.core.Animatable(0f) }

    LaunchedEffect(Unit) {
        // Circle scales up
        scale.animateTo(
            targetValue = 1f,
            animationSpec = androidx.compose.animation.core.tween(
                durationMillis = 400,
                easing = androidx.compose.animation.core.LinearOutSlowInEasing
            )
        )
        // Checkmark line draws itself
        pathProgress.animateTo(
            targetValue = 1f,
            animationSpec = androidx.compose.animation.core.tween(
                durationMillis = 450,
                easing = androidx.compose.animation.core.FastOutSlowInEasing
            )
        )
        // Keep the dialog open for 700ms so they see the completed green checkmark
        kotlinx.coroutines.delay(700L)
        onAnimationFinished()
    }

    androidx.compose.foundation.Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val radius = width / 2f
        val center = androidx.compose.ui.geometry.Offset(radius, radius)

        // Draw green circle
        drawCircle(
            color = Color(0xFF4CAF50),
            radius = radius * scale.value,
            center = center
        )

        // Draw drawing checkmark inside circle
        if (pathProgress.value > 0f) {
            val strokeWidth = 5.dp.toPx()
            val progress = pathProgress.value
            val firstSegmentEndProgress = 0.35f

            val startX = width * 0.28f
            val startY = height * 0.5f
            val midX = width * 0.46f
            val midY = height * 0.68f
            val endX = width * 0.72f
            val endY = height * 0.36f

            if (progress <= firstSegmentEndProgress) {
                // Draw first checkmark line segment
                val ratio = progress / firstSegmentEndProgress
                val currentEndX = startX + (midX - startX) * ratio
                val currentEndY = startY + (midY - startY) * ratio
                drawLine(
                    color = Color.White,
                    start = androidx.compose.ui.geometry.Offset(startX, startY),
                    end = androidx.compose.ui.geometry.Offset(currentEndX, currentEndY),
                    strokeWidth = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            } else {
                // Draw full first checkmark line segment
                drawLine(
                    color = Color.White,
                    start = androidx.compose.ui.geometry.Offset(startX, startY),
                    end = androidx.compose.ui.geometry.Offset(midX, midY),
                    strokeWidth = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
                // Draw partial/full second checkmark line segment
                val ratio = (progress - firstSegmentEndProgress) / (1f - firstSegmentEndProgress)
                val currentEndX = midX + (endX - midX) * ratio
                val currentEndY = midY + (endY - midY) * ratio
                drawLine(
                    color = Color.White,
                    start = androidx.compose.ui.geometry.Offset(midX, midY),
                    end = androidx.compose.ui.geometry.Offset(currentEndX, currentEndY),
                    strokeWidth = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round
                )
            }
        }
    }
}
