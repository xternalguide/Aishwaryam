package com.example.aishwaryam_android.ui.auth

import android.app.Activity
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.data.SessionManager

enum class MpinFlowState {
    ENTER_PIN,       // Standard 4-digit entry with auto-submit
    SETUP_PIN,       // Create new PIN (New + Confirm + Save)
    FORGOT_ENTER_OTP, // Verify registered number via 6-digit SMS OTP
    FORGOT_NEW_PIN    // OTP verified: reset PIN (New + Confirm + Save)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MpinScreen(
    isSetupMode: Boolean,
    onMpinSuccess: () -> Unit,
    onResetMpinClick: () -> Unit = {},
    viewModel: AuthViewModel = viewModel()
) {
    val context = LocalContext.current
    val activity = context as Activity
    val sessionManager = remember { SessionManager(context) }
    val focusManager = LocalFocusManager.current

    val uiState by viewModel.uiState.collectAsState()

    // Manage screen state machine
    var flowState by rememberSaveable {
        mutableStateOf(if (isSetupMode) MpinFlowState.SETUP_PIN else MpinFlowState.ENTER_PIN)
    }

    // Input string buffers
    var mpin by rememberSaveable { mutableStateOf("") }
    var newMpin by rememberSaveable { mutableStateOf("") }
    var confirmMpin by rememberSaveable { mutableStateOf("") }
    var otp by rememberSaveable { mutableStateOf("") }

    // Countdown Timer for OTP screen
    var secondsRemaining by remember { mutableStateOf(60) }

    // Focus Requesters for independent fields
    val mpinFocusRequester = remember { FocusRequester() }
    val newMpinFocusRequester = remember { FocusRequester() }
    val confirmMpinFocusRequester = remember { FocusRequester() }
    val otpFocusRequester = remember { FocusRequester() }

    // Custom tick animation triggers
    var showSuccessDialog by remember { mutableStateOf(false) }
    var successDialogMessage by remember { mutableStateOf("") }

    // Clean up ViewModel on initial loading
    LaunchedEffect(Unit) {
        viewModel.resetState()
    }

    // Reactively monitor authentication success states
    LaunchedEffect(uiState) {
        when (uiState) {
            is AuthUiState.Success -> {
                // If we were waiting for Forgot OTP verification, successful SMS login means verified owner!
                if (flowState == MpinFlowState.FORGOT_ENTER_OTP) {
                    viewModel.resetState()
                    flowState = MpinFlowState.FORGOT_NEW_PIN
                }
            }
            is AuthUiState.MpinSuccess -> {
                if (flowState == MpinFlowState.ENTER_PIN) {
                    onMpinSuccess()
                } else if (flowState == MpinFlowState.SETUP_PIN) {
                    successDialogMessage = "PIN Set Successfully!"
                    showSuccessDialog = true
                } else if (flowState == MpinFlowState.FORGOT_NEW_PIN) {
                    successDialogMessage = "PIN Reset Successfully!"
                    showSuccessDialog = true
                }
            }
            else -> {}
        }
    }

    // Auto-verify standard login PIN on 4th digit
    LaunchedEffect(mpin) {
        if (flowState == MpinFlowState.ENTER_PIN && mpin.length == 4) {
            focusManager.clearFocus()
            viewModel.verifyExistingMpin(mpin)
        }
    }

    // Auto-verify OTP SMS on 6th digit
    LaunchedEffect(otp) {
        if (flowState == MpinFlowState.FORGOT_ENTER_OTP && otp.length == 6) {
            focusManager.clearFocus()
            viewModel.verifyOtp(otp)
        }
    }

    // Handle background ticking and active keyboard auto-focus transitions
    LaunchedEffect(flowState) {
        if (flowState == MpinFlowState.FORGOT_ENTER_OTP) {
            secondsRemaining = 60
        }
        // Yield briefly to let the Jetpack Compose layout settle before requesting focus
        kotlinx.coroutines.delay(120L)
        try {
            when (flowState) {
                MpinFlowState.ENTER_PIN -> mpinFocusRequester.requestFocus()
                MpinFlowState.SETUP_PIN -> newMpinFocusRequester.requestFocus()
                MpinFlowState.FORGOT_ENTER_OTP -> otpFocusRequester.requestFocus()
                MpinFlowState.FORGOT_NEW_PIN -> newMpinFocusRequester.requestFocus()
            }
        } catch (ignored: Exception) {}
    }

    LaunchedEffect(secondsRemaining, flowState) {
        if (flowState == MpinFlowState.FORGOT_ENTER_OTP && secondsRemaining > 0) {
            kotlinx.coroutines.delay(1000L)
            secondsRemaining -= 1
        }
    }

    LaunchedEffect(newMpin) {
        if ((flowState == MpinFlowState.SETUP_PIN || flowState == MpinFlowState.FORGOT_NEW_PIN) && newMpin.length == 4) {
            try {
                confirmMpinFocusRequester.requestFocus()
            } catch (ignored: Exception) {}
        }
    }

    Scaffold { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF7A004C), // Deep magenta at top
                            Color(0xFF4A002C)  // Darker shade at bottom
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // App Branding logo container
                    Image(
                        painter = painterResource(id = R.drawable.splash_logo),
                        contentDescription = "App Logo",
                        modifier = Modifier
                            .size(80.dp)
                            .background(Color(0xFFFFF0F5), RoundedCornerShape(16.dp))
                            .padding(8.dp)
                    )
                    Spacer(modifier = Modifier.height(20.dp))

                    // Title header based on state machine
                    val titleText = when (flowState) {
                        MpinFlowState.ENTER_PIN -> "Enter your PIN"
                        MpinFlowState.SETUP_PIN -> "Set your 4-Digit PIN"
                        MpinFlowState.FORGOT_ENTER_OTP -> "Verify OTP"
                        MpinFlowState.FORGOT_NEW_PIN -> "Reset your 4-Digit PIN"
                    }
                    Text(
                        text = titleText,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF7A004C)
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))

                    // Security Verification text removed per user's direct feedback!
                    val subTitleText = when (flowState) {
                        MpinFlowState.ENTER_PIN -> "Enter your 4-digit PIN to access your account."
                        MpinFlowState.SETUP_PIN -> "Create a secure PIN for quick login."
                        MpinFlowState.FORGOT_ENTER_OTP -> "OTP sent to your registered phone number."
                        MpinFlowState.FORGOT_NEW_PIN -> "Create and repeat your new 4-digit login PIN."
                    }
                    Text(
                        text = subTitleText,
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(28.dp))

                    // Render dynamic content fields
                    when (flowState) {
                        MpinFlowState.ENTER_PIN -> {
                            SplitPinInput(
                                value = mpin,
                                onValueChange = {
                                    mpin = it
                                    viewModel.clearError()
                                },
                                length = 4,
                                focusRequester = mpinFocusRequester,
                                isPasswordMode = true
                            )
                            
                            Spacer(modifier = Modifier.height(32.dp))

                            if (uiState is AuthUiState.Error) {
                                Text(
                                    text = (uiState as AuthUiState.Error).message,
                                    color = Color.Red,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(horizontal = 8.dp)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            if (uiState is AuthUiState.Loading) {
                                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(50.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            // Clickable Reset Password OTP link button
                            TextButton(
                                onClick = {
                                    viewModel.clearError()
                                    val phoneNumber = sessionManager.getPhoneNumber()
                                    if (!phoneNumber.isNullOrEmpty()) {
                                        viewModel.sendOtp(phoneNumber, activity)
                                        flowState = MpinFlowState.FORGOT_ENTER_OTP
                                    } else {
                                        // Fallback to safety redirect
                                        onResetMpinClick()
                                    }
                                }
                            ) {
                                Text(
                                    "Forgot PIN? Reset via OTP",
                                    color = Color(0xFF7A004C),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }

                        MpinFlowState.SETUP_PIN, MpinFlowState.FORGOT_NEW_PIN -> {
                            Column(
                                horizontalAlignment = Alignment.Start,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "Enter New PIN",
                                    fontSize = 12.sp,
                                    color = Color.Gray,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                SplitPinInput(
                                    value = newMpin,
                                    onValueChange = {
                                        newMpin = it
                                        if (it.length < 4) {
                                            confirmMpin = ""
                                        }
                                        viewModel.clearError()
                                    },
                                    length = 4,
                                    focusRequester = newMpinFocusRequester,
                                    isPasswordMode = true
                                )

                                Spacer(modifier = Modifier.height(24.dp))

                                Text(
                                    text = "Confirm New PIN",
                                    fontSize = 12.sp,
                                    color = Color.Gray,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                SplitPinInput(
                                    value = confirmMpin,
                                    onValueChange = {
                                        confirmMpin = it
                                        viewModel.clearError()
                                    },
                                    length = 4,
                                    focusRequester = confirmMpinFocusRequester,
                                    isPasswordMode = true,
                                    enabled = newMpin.length == 4
                                )
                            }

                            Spacer(modifier = Modifier.height(28.dp))

                            val showMismatch = newMpin.length == 4 && confirmMpin.length == 4 && newMpin != confirmMpin
                            if (showMismatch) {
                                Text(
                                    text = "PINs do not match",
                                    color = Color.Red,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            } else if (uiState is AuthUiState.Error) {
                                Text(
                                    text = (uiState as AuthUiState.Error).message,
                                    color = Color.Red,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            if (uiState is AuthUiState.Loading) {
                                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(50.dp))
                            } else {
                                Button(
                                    onClick = {
                                        if (newMpin == confirmMpin) {
                                            viewModel.setMpin(newMpin)
                                        }
                                    },
                                    enabled = newMpin.length == 4 && confirmMpin.length == 4 && newMpin == confirmMpin,
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF7A004C),
                                        contentColor = Color.White,
                                        disabledContainerColor = Color(0xFFE0E0E0),
                                        disabledContentColor = Color.Gray
                                    ),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Save", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                }
                            }

                            if (flowState == MpinFlowState.FORGOT_NEW_PIN) {
                                Spacer(modifier = Modifier.height(12.dp))
                                TextButton(
                                    onClick = {
                                        viewModel.resetState()
                                        flowState = MpinFlowState.ENTER_PIN
                                    }
                                ) {
                                    Text("Cancel", color = Color.Gray, fontWeight = FontWeight.Medium)
                                }
                            }
                        }

                        MpinFlowState.FORGOT_ENTER_OTP -> {
                            SplitPinInput(
                                value = otp,
                                onValueChange = {
                                    otp = it
                                    viewModel.clearError()
                                },
                                length = 6,
                                focusRequester = otpFocusRequester,
                                isPasswordMode = false
                            )

                            Spacer(modifier = Modifier.height(32.dp))

                            if (uiState is AuthUiState.Error) {
                                Text(
                                    text = (uiState as AuthUiState.Error).message,
                                    color = Color.Red,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                            }

                            if (uiState is AuthUiState.Loading) {
                                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(50.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                            } else {
                                TextButton(
                                    onClick = {
                                        val phoneNumber = sessionManager.getPhoneNumber()
                                        if (!phoneNumber.isNullOrEmpty()) {
                                            otp = ""
                                            secondsRemaining = 60
                                            viewModel.resendOtp(activity)
                                        }
                                    },
                                    enabled = secondsRemaining == 0
                                ) {
                                    val labelText = if (secondsRemaining > 0) {
                                        "Did not receive OTP? Resend in ${secondsRemaining}s"
                                    } else {
                                        "Did not receive OTP? Resend OTP"
                                    }
                                    Text(
                                        text = labelText,
                                        color = if (secondsRemaining > 0) Color.Gray else Color(0xFF7A004C),
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            TextButton(
                                onClick = {
                                    viewModel.resetState()
                                    flowState = MpinFlowState.ENTER_PIN
                                }
                            ) {
                                Text("Back to PIN Login", color = Color.Gray, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }

            // Success custom canvas checkmark animation dialog popup overlay
            if (showSuccessDialog) {
                SuccessTickDialog(
                    message = successDialogMessage,
                    onDismiss = {
                        showSuccessDialog = false
                        viewModel.resetState()
                        if (flowState == MpinFlowState.SETUP_PIN) {
                            onMpinSuccess()
                        } else if (flowState == MpinFlowState.FORGOT_NEW_PIN) {
                            // Clear all states and return to PIN login
                            mpin = ""
                            newMpin = ""
                            confirmMpin = ""
                            otp = ""
                            flowState = MpinFlowState.ENTER_PIN
                        }
                    }
                )
            }
        }
    }
}

/**
 * Reusable split grid keyboard listener box.
 * High fidelity rounded corners, shadows, and focus outlines.
 */
@Composable
fun SplitPinInput(
    value: String,
    onValueChange: (String) -> Unit,
    length: Int,
    focusRequester: FocusRequester,
    modifier: Modifier = Modifier,
    isPasswordMode: Boolean = true,
    enabled: Boolean = true
) {
    var isFieldFocused by remember { mutableStateOf(false) }

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                enabled = enabled,
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                try {
                    focusRequester.requestFocus()
                } catch (ignored: Exception) {}
            }
    ) {
        // Decorative visual boxes rendered FIRST
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            repeat(length) { index ->
                val char = value.getOrNull(index)
                val isFocused = enabled && isFieldFocused && value.length == index

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .aspectRatio(1f)
                        .requiredSizeIn(maxWidth = 48.dp, maxHeight = 48.dp)
                        .alpha(if (enabled) 1f else 0.6f),
                    shape = RoundedCornerShape(12.dp),
                    color = if (enabled) Color(0xFFF5F5F5) else Color(0xFFEFEFEF),
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isFocused) 2.dp else 1.dp,
                        color = if (isFocused) Color(0xFF7A004C) else if (enabled) Color.LightGray else Color(0xFFD3D3D3)
                    ),
                    shadowElevation = if (isFocused) 4.dp else 0.dp
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        if (char != null) {
                            if (isPasswordMode) {
                                Box(
                                    modifier = Modifier
                                        .size(12.dp)
                                        .background(Color(0xFF7A004C), CircleShape)
                                )
                            } else {
                                Text(
                                    text = char.toString(),
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF7A004C)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Invisible touch interceptor TextField rendered SECOND (on top)
        val transparentSelectionColors = TextSelectionColors(
            handleColor = Color.Transparent,
            backgroundColor = Color.Transparent
        )
        CompositionLocalProvider(LocalTextSelectionColors provides transparentSelectionColors) {
            BasicTextField(
                value = value,
                onValueChange = {
                    if (it.length <= length && it.all { c -> c.isDigit() }) {
                        onValueChange(it)
                    }
                },
                enabled = enabled,
                cursorBrush = SolidColor(Color.Transparent),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                modifier = Modifier
                    .matchParentSize()
                    .focusRequester(focusRequester)
                    .onFocusChanged { isFieldFocused = it.isFocused }
                    .alpha(0f)
            )
        }
    }
}

@Composable
fun SuccessTickDialog(
    message: String,
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
            modifier = Modifier.size(220.dp),
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
                    text = message,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Color.Black,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

