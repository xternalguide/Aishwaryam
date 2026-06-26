package com.example.aishwaryam_android.ui.profile

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.data.DashboardRepository
import com.example.aishwaryam_android.ui.theme.PoppinsFamily
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddBankAccountScreen(
    userId: String,
    onBackClick: () -> Unit,
    onSuccess: () -> Unit,
    viewModel: AddBankAccountViewModel = viewModel()
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()

    var bankName by remember { mutableStateOf("") }
    var accountNumber by remember { mutableStateOf("") }
    var confirmAccountNumber by remember { mutableStateOf("") }
    var ifscCode by remember { mutableStateOf("") }

    val isTamil = remember { Locale.getDefault().language == "ta" }

    LaunchedEffect(state.isSuccess) {
        if (state.isSuccess) {
            Toast.makeText(
                context,
                if (isTamil) "வங்கி கணக்கு வெற்றிகரமாக இணைக்கப்பட்டது!" else "Bank Account linked successfully!",
                Toast.LENGTH_LONG
            ).show()
            onSuccess()
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isTamil) "வங்கி கணக்கு சேர்க்கவும்" else "Link Bank Account",
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF8F9FA)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Info card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE3F2FD)),
                    border = BorderStroke(1.dp, Color(0xFFBBDEFB))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.VerifiedUser,
                            null,
                            tint = Color(0xFF1E88E5),
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text(
                                text = if (isTamil) "பாதுகாப்பான பரிமாற்றம்" else "Secure Verification",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                fontFamily = PoppinsFamily,
                                color = Color(0xFF0D47A1)
                            )
                            Text(
                                text = if (isTamil) 
                                    "தங்கத்தை பணமாக மாற்ற இந்த வங்கி கணக்கு பயன்படுத்தப்படும்." 
                                    else "This account will be verified and used for cash-out redemption.",
                                fontSize = 11.sp,
                                fontFamily = PoppinsFamily,
                                color = Color(0xFF1565C0)
                            )
                        }
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Bank Name Input
                OutlinedTextField(
                    value = bankName,
                    onValueChange = { bankName = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    label = { Text(if (isTamil) "வங்கியின் பெயர்" else "Bank Name") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.AccountBalance, null, tint = Color(0xFF4A0E4E)) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF4A0E4E),
                        unfocusedBorderColor = Color.LightGray
                    )
                )

                // IFSC Code Input
                OutlinedTextField(
                    value = ifscCode,
                    onValueChange = { text ->
                        if (text.length <= 11) {
                            ifscCode = text.uppercase()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    label = { Text(if (isTamil) "IFSC குறியீடு" else "IFSC Code") },
                    singleLine = true,
                    placeholder = { Text("e.g. SBIN0001234") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF4A0E4E),
                        unfocusedBorderColor = Color.LightGray
                    )
                )

                // Account Number Input
                OutlinedTextField(
                    value = accountNumber,
                    onValueChange = { text ->
                        if (text.all { it.isDigit() }) {
                            accountNumber = text
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    label = { Text(if (isTamil) "வங்கி கணக்கு எண்" else "Bank Account Number") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF4A0E4E),
                        unfocusedBorderColor = Color.LightGray
                    )
                )

                // Confirm Account Number Input
                OutlinedTextField(
                    value = confirmAccountNumber,
                    onValueChange = { text ->
                        if (text.all { it.isDigit() }) {
                            confirmAccountNumber = text
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    label = { Text(if (isTamil) "கணக்கு எண்ணை உறுதிப்படுத்தவும்" else "Confirm Account Number") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF4A0E4E),
                        unfocusedBorderColor = Color.LightGray
                    )
                )
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Lock,
                        null,
                        tint = Color.Gray,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (isTamil) "உறுதிப்படுத்தப்பட்ட 256-பிட் பாதுகாப்பு" else "Insured 256-bit Bank Grade Security",
                        color = Color.Gray,
                        fontSize = 11.sp,
                        fontFamily = PoppinsFamily
                    )
                }

                val isValid = bankName.isNotBlank() && 
                        accountNumber.isNotBlank() && 
                        confirmAccountNumber.isNotBlank() && 
                        ifscCode.length == 11 && 
                        accountNumber == confirmAccountNumber

                Button(
                    onClick = {
                        viewModel.linkBankAccount(
                            userId = userId,
                            bankName = bankName,
                            accountNumber = accountNumber,
                            ifscCode = ifscCode
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF4A0E4E),
                        contentColor = Color.White
                    ),
                    enabled = isValid && !state.isLoading
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    } else {
                        Text(
                            text = if (isTamil) "இணைப்பை உறுதிப்படுத்துக" else "Confirm & Link Account",
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }
    }
}

class AddBankAccountViewModel : ViewModel() {
    private val repository = DashboardRepository()
    private val _uiState = MutableStateFlow(AddBankAccountState())
    val uiState: StateFlow<AddBankAccountState> = _uiState

    fun linkBankAccount(userId: String, bankName: String, accountNumber: String, ifscCode: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.addBankAccount(userId, accountNumber, ifscCode, bankName)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoading = false, error = it.message ?: "Failed to link bank account")
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

data class AddBankAccountState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
