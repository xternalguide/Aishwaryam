package com.example.aishwaryam_android.ui.auth

import com.example.aishwaryam_android.data.SessionManager
import com.example.aishwaryam_android.data.OnboardingStage

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSetupScreen(
    userId: String,
    onSetupComplete: () -> Unit,
    viewModel: AuthViewModel = viewModel()
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val userIdFromSession = remember { sessionManager.getUserId() ?: userId }
    
    var fullName by remember { mutableStateOf(sessionManager.getPartialName()) }
    var email by remember { mutableStateOf(sessionManager.getPartialEmail()) }
    var referralCode by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.ProfileSuccess) {
            sessionManager.saveOnboardingStage(OnboardingStage.PROFILE_COMPLETED)
            onSetupComplete()
        }
    }

    Scaffold(containerColor = Color(0xFFF5F7F5)) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Top
        ) {
            Spacer(modifier = Modifier.height(40.dp))
            Text(
                text = "Account Registration",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF4A0E4E)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Please provide your contact information",
                fontSize = 16.sp,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(48.dp))

            OutlinedTextField(
                value = fullName,
                onValueChange = { 
                    fullName = it
                    sessionManager.savePartialProfile(it, email)
                    if (uiState is AuthUiState.Error) viewModel.clearError()
                },
                label = { Text("Full Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF4A0E4E),
                    focusedLabelColor = Color(0xFF4A0E4E),
                    focusedTextColor = Color.Black,
                    unfocusedTextColor = Color.Black,
                    focusedPlaceholderColor = Color.Gray,
                    unfocusedPlaceholderColor = Color.Gray
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { 
                    email = it
                    sessionManager.savePartialProfile(fullName, it)
                    if (uiState is AuthUiState.Error) viewModel.clearError()
                },
                label = { Text("Email Address") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF4A0E4E),
                    focusedLabelColor = Color(0xFF4A0E4E),
                    focusedTextColor = Color.Black,
                    unfocusedTextColor = Color.Black,
                    focusedPlaceholderColor = Color.Gray,
                    unfocusedPlaceholderColor = Color.Gray
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = referralCode,
                onValueChange = { 
                    referralCode = it
                    if (uiState is AuthUiState.Error) viewModel.clearError()
                },
                label = { Text("Referral Code (Optional)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Done
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF4A0E4E),
                    focusedLabelColor = Color(0xFF4A0E4E),
                    focusedTextColor = Color.Black,
                    unfocusedTextColor = Color.Black,
                    focusedPlaceholderColor = Color.Gray,
                    unfocusedPlaceholderColor = Color.Gray
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            if (uiState is AuthUiState.Error) {
                Text(
                    text = (uiState as AuthUiState.Error).message,
                    color = Color.Red,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
            }

            if (uiState is AuthUiState.Loading) {
                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(60.dp))
            } else {
                Button(
                    onClick = { viewModel.updateProfile(userIdFromSession, fullName, email, referralCode.ifBlank { null }) },
                    enabled = fullName.isNotBlank() && email.contains("@"),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF4A0E4E),
                        contentColor = Color.White
                    )
                ) {
                    Text("Complete Registration", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }            }
        }
    }
}
