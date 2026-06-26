package com.example.aishwaryam_android.ui.onboarding

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.text.ClickableText
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.style.TextDecoration
import com.example.aishwaryam_android.data.SessionManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import kotlinx.coroutines.launch

fun formatDobInput(input: String): String {
    val clean = input.replace("/", "").take(8)
    val sb = java.lang.StringBuilder()
    for (i in clean.indices) {
        sb.append(clean[i])
        if ((i == 1 || i == 3) && i != clean.lastIndex) sb.append("/")
    }
    return sb.toString()
}

fun isValidIndianDate(dateStr: String): Boolean {
    if (dateStr.length != 10) return false
    val parts = dateStr.split("/")
    if (parts.size != 3) return false
    val d = parts[0].toIntOrNull() ?: return false
    val m = parts[1].toIntOrNull() ?: return false
    val y = parts[2].toIntOrNull() ?: return false
    if (y < 1900 || y > java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)) return false
    if (m < 1 || m > 12) return false
    val days = when (m) {
        2 -> if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)) 29 else 28
        4, 6, 9, 11 -> 30
        else -> 31
    }
    return d in 1..days
}

fun isValidEmail(email: String): Boolean {
    return android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
}

fun isValidPan(pan: String): Boolean {
    val pattern = Regex("[A-Z]{5}[0-9]{4}[A-Z]{1}")
    return pattern.matches(pan.uppercase())
}

fun formatAadhaarInput(input: String): String {
    val clean = input.replace(" ", "").take(12)
    val sb = java.lang.StringBuilder()
    for (i in clean.indices) {
        sb.append(clean[i])
        if ((i == 3 || i == 7) && i != clean.lastIndex) {
            sb.append(" ")
        }
    }
    return sb.toString()
}

fun isValidAadhaar(aadhaar: String): Boolean {
    val clean = aadhaar.replace(" ", "")
    return clean.length == 12 && clean.all { it.isDigit() }
}

fun uriToBase64(context: android.content.Context, uri: android.net.Uri): String? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri)
        val bytes = inputStream?.readBytes()
        inputStream?.close()
        if (bytes != null) {
            android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
        } else null
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}

val textFieldColors = @Composable {
    OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.Black,
        unfocusedTextColor = Color.Black,
        disabledTextColor = Color.Black,
        focusedBorderColor = Color(0xFF4A0E4E),
        unfocusedBorderColor = Color.LightGray,
        disabledBorderColor = Color.LightGray,
        focusedLabelColor = Color(0xFF4A0E4E),
        unfocusedLabelColor = Color.DarkGray,
        disabledLabelColor = Color.DarkGray,
        cursorColor = Color(0xFF4A0E4E)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    onBack: () -> Unit
) {
    var currentStep by rememberSaveable { mutableStateOf(1) }
    val totalSteps = 3
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val coroutineScope = rememberCoroutineScope()

    var isSaving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }

    // Step 1 State - Load from secure session storage
    var name by rememberSaveable { mutableStateOf(sessionManager.getPartialName()) }
    var dob by rememberSaveable { mutableStateOf(sessionManager.getPartialDob()) }
    var dobError by rememberSaveable { mutableStateOf<String?>(null) }
    var isMarried by rememberSaveable { mutableStateOf(sessionManager.getPartialIsMarried()) }
    var weddingDate by rememberSaveable { mutableStateOf(sessionManager.getPartialWeddingDate()) }
    var weddingDateError by rememberSaveable { mutableStateOf<String?>(null) }
    var phone by rememberSaveable { mutableStateOf(sessionManager.getPhoneNumber() ?: "") }
    var email by rememberSaveable { mutableStateOf(sessionManager.getPartialEmail()) }
    var emailError by rememberSaveable { mutableStateOf<String?>(null) }
    var gender by rememberSaveable { mutableStateOf(sessionManager.getPartialGender()) }
    var pincode by rememberSaveable { mutableStateOf(sessionManager.getPartialPincode()) }
    var state by rememberSaveable { mutableStateOf(sessionManager.getPartialState()) }
    var city by rememberSaveable { mutableStateOf(sessionManager.getPartialCity()) }
    var area by rememberSaveable { mutableStateOf(sessionManager.getPartialArea()) }
    var isManualArea by rememberSaveable { mutableStateOf(sessionManager.getPartialIsManualArea()) }
    var termsAccepted by rememberSaveable { mutableStateOf(sessionManager.getPartialTermsAccepted()) }
    var nomineeName by rememberSaveable { mutableStateOf(sessionManager.getNomineeName()) }
    var nomineeContact by rememberSaveable { mutableStateOf(sessionManager.getNomineeContact()) }

    var showTermsDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }

    // Auto-save reactive LaunchedEffect: persists any inputs instantly to secure local storage
    LaunchedEffect(name, email, dob, isMarried, weddingDate, gender, pincode, state, city, area, isManualArea, termsAccepted, nomineeName, nomineeContact) {
        sessionManager.saveStep1Data(
            name = name,
            email = email,
            dob = dob,
            isMarried = isMarried,
            weddingDate = weddingDate,
            gender = gender,
            pincode = pincode,
            state = state,
            city = city,
            area = area,
            isManualArea = isManualArea,
            termsAccepted = termsAccepted
        )
        sessionManager.saveNomineeName(nomineeName)
        sessionManager.saveNomineeContact(nomineeContact)
    }

    // Step 2 State
    var panNumber by rememberSaveable { mutableStateOf("") }
    var panError by rememberSaveable { mutableStateOf<String?>(null) }
    var panImageBase64 by rememberSaveable { mutableStateOf(sessionManager.getPanImageBase64()) }
    var isPanImageUploaded by rememberSaveable { mutableStateOf(sessionManager.getPanImageBase64().isNotEmpty()) }

    var isPanOtpSent by rememberSaveable { mutableStateOf(false) }
    var panOtp by rememberSaveable { mutableStateOf("") }
    var isPanVerified by rememberSaveable { mutableStateOf(false) }
    var fetchedPanName by rememberSaveable { mutableStateOf("") }

    var identityNumber by rememberSaveable { mutableStateOf("") }
    var identityError by rememberSaveable { mutableStateOf<String?>(null) }
    var aadhaarImageBase64 by rememberSaveable { mutableStateOf(sessionManager.getAadhaarImageBase64()) }
    var isAadhaarImageUploaded by rememberSaveable { mutableStateOf(sessionManager.getAadhaarImageBase64().isNotEmpty()) }

    var isIdOtpSent by rememberSaveable { mutableStateOf(false) }
    var idOtp by rememberSaveable { mutableStateOf("") }
    var isIdVerified by rememberSaveable { mutableStateOf(false) }

    // Step 3 State
    var accountName by rememberSaveable { mutableStateOf("") }
    var bankName by rememberSaveable { mutableStateOf("") }
    var branchName by rememberSaveable { mutableStateOf("") }
    var ifscCode by rememberSaveable { mutableStateOf("") }
    var accountNumber by rememberSaveable { mutableStateOf("") }
    var confirmAccountNumber by rememberSaveable { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Complete Your Profile", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = {
                        if (currentStep > 1) currentStep-- else onBack()
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF4A0E4E),
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Surface(
            color = Color(0xFFF5F5F5), // Force light background
            modifier = Modifier.fillMaxSize()
        ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .imePadding()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ProgressStepper(currentStep = currentStep, totalSteps = totalSteps)

            Spacer(modifier = Modifier.height(24.dp))

            Box(modifier = Modifier.weight(1f)) {
                when (currentStep) {
                    1 -> Step1BasicProfile(
                        name = name,
                        onNameChange = { input ->
                            if (input.all { it.isLetter() || it.isWhitespace() }) {
                                name = input
                            }
                        },
                        dob = dob,
                        onDobChange = { dob = it },
                        dobError = dobError,
                        onDobErrorChange = { dobError = it },
                        nomineeName = nomineeName,
                        onNomineeNameChange = { input ->
                            if (input.all { it.isLetter() || it.isWhitespace() }) {
                                nomineeName = input
                            }
                        },
                        nomineeContact = nomineeContact,
                        onNomineeContactChange = { nomineeContact = it },
                        isMarried = isMarried, onMaritalStatusChange = { isMarried = it },
                        weddingDate = weddingDate, onWeddingDateChange = { weddingDate = it },
                        weddingDateError = weddingDateError,
                        onWeddingDateErrorChange = { weddingDateError = it },
                        phone = phone, onPhoneChange = { phone = it },
                        email = email,
                        onEmailChange = {
                            email = it
                            if (it.isEmpty() || isValidEmail(it)) {
                                emailError = null
                            } else {
                                emailError = "Please enter a valid email address"
                            }
                        },
                        emailError = emailError,
                        gender = gender, onGenderChange = { gender = it },
                        pincode = pincode, onPincodeChange = { pincode = it },
                        state = state, onStateChange = { state = it },
                        city = city, onCityChange = { city = it },
                        area = area, onAreaChange = { area = it },
                        isManualArea = isManualArea, onManualAreaToggle = { isManualArea = it },
                        termsAccepted = termsAccepted, onTermsAcceptedChange = { termsAccepted = it },
                        onShowTermsClick = { showTermsDialog = true },
                        onShowPrivacyClick = { showPrivacyDialog = true }
                    )
                    2 -> Step2KYCVerification(
                        panNumber = panNumber,
                        onPanChange = { input ->
                            val uppercased = input.uppercase().take(10)
                            panNumber = uppercased
                            if (uppercased.length == 10 && !isValidPan(uppercased)) {
                                panError = "Invalid PAN card format (e.g., ABCDE1234F)"
                            } else {
                                panError = null
                            }
                        },
                        panError = panError,
                        panImageBase64 = panImageBase64,
                        isPanImageUploaded = isPanImageUploaded,
                        onPanImageSelected = { base64 ->
                            panImageBase64 = base64
                            isPanImageUploaded = base64.isNotEmpty()
                            sessionManager.savePanImageBase64(base64)
                        },
                        isPanOtpSent = isPanOtpSent,
                        onSendPanOtp = { isPanOtpSent = true },
                        panOtp = panOtp,
                        onPanOtpChange = { panOtp = it },
                        isPanVerified = isPanVerified,
                        onVerifyPan = { 
                            isPanVerified = true
                            fetchedPanName = "John Doe" // Simulated fetch
                        },
                        fetchedName = fetchedPanName,
                        identityNumber = identityNumber,
                        onIdChange = { input ->
                            val clean = input.filter { it.isDigit() }
                            val formatted = formatAadhaarInput(clean)
                            identityNumber = formatted
                            val stripped = clean.take(12)
                            if (stripped.length == 12) {
                                identityError = null
                            } else if (stripped.length > 0) {
                                identityError = "Aadhaar must be exactly 12 digits"
                            } else {
                                identityError = null
                            }
                        },
                        identityError = identityError,
                        aadhaarImageBase64 = aadhaarImageBase64,
                        isAadhaarImageUploaded = isAadhaarImageUploaded,
                        onAadhaarImageSelected = { base64 ->
                            aadhaarImageBase64 = base64
                            isAadhaarImageUploaded = base64.isNotEmpty()
                            sessionManager.saveAadhaarImageBase64(base64)
                        },
                        isIdOtpSent = isIdOtpSent,
                        onSendIdOtp = { isIdOtpSent = true },
                        idOtp = idOtp,
                        onIdOtpChange = { idOtp = it },
                        isIdVerified = isIdVerified,
                        onVerifyId = { isIdVerified = true }
                    )
                    3 -> Step3FinancialSetup(
                        accountName = accountName, onAccountNameChange = { accountName = it },
                        bankName = bankName, onBankNameChange = { bankName = it },
                        branchName = branchName, onBranchNameChange = { branchName = it },
                        ifscCode = ifscCode, onIfscChange = { ifscCode = it },
                        accountNumber = accountNumber, onAccountNumberChange = { accountNumber = it },
                        confirmAccountNumber = confirmAccountNumber, onConfirmAccountNumberChange = { confirmAccountNumber = it },
                        kycName = fetchedPanName
                    )
                }

                // Compliance Dialogs - Terms and Conditions Popup
                if (showTermsDialog) {
                    AlertDialog(
                        onDismissRequest = { showTermsDialog = false },
                        title = { Text("Terms of Service", fontWeight = FontWeight.Bold) },
                        text = {
                            Text(
                                text = "Welcome to Aishwaryam Digital Gold. By registering, you agree to convert your payments into pure 24K digital gold stored in secure bank-grade vaults. Early withdrawal of gold is restricted during active scheme plans to protect savings. All transactions include a statutory 3% GST. You are solely responsible for ensuring bank credentials are correct.",
                                color = Color.Gray
                            )
                        },
                        confirmButton = {
                            Button(onClick = { showTermsDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A0E4E))) {
                                Text("Close", color = Color.White)
                            }
                        },
                        containerColor = Color.White
                    )
                }

                // Compliance Dialogs - Privacy Policy Popup
                if (showPrivacyDialog) {
                    AlertDialog(
                        onDismissRequest = { showPrivacyDialog = false },
                        title = { Text("Privacy Policy", fontWeight = FontWeight.Bold) },
                        text = {
                            Text(
                                text = "Aishwaryam respects your data privacy. Your KYC documentation (PAN, Aadhaar numbers, and scanned document images) is stored securely with end-to-end encryption. Your linked bank details and personal contact information are accessed solely to authorize Razorpay payments and process maturity gold payouts. We do not sell or share your identity parameters with third parties.",
                                color = Color.Gray
                            )
                        },
                        confirmButton = {
                            Button(onClick = { showPrivacyDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A0E4E))) {
                                Text("Close", color = Color.White)
                            }
                        },
                        containerColor = Color.White
                    )
                }
            }

            saveError?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (currentStep > 1) {
                    OutlinedButton(
                        onClick = { currentStep-- },
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        enabled = !isSaving
                    ) {
                        Text("Previous")
                    }
                }

                Button(
                    onClick = {
                        if (currentStep == 1) {
                            val userId = sessionManager.getUserId()
                            if (userId != null) {
                                isSaving = true
                                saveError = null
                                coroutineScope.launch {
                                    try {
                                        val dateOfBirth = try {
                                            val parts = dob.split("/")
                                            if (parts.size == 3) {
                                                // Convert DD/MM/YYYY to yyyy-MM-dd
                                                "${parts[2]}-${parts[1]}-${parts[0]}"
                                            } else null
                                        } catch (e: Exception) {
                                            null
                                        }

                                        val req = com.example.aishwaryam_android.network.UpdateProfileRequest(
                                            fullName = name,
                                            email = email,
                                            dateOfBirth = dateOfBirth,
                                            nomineeName = nomineeName
                                        )
                                        val response = com.example.aishwaryam_android.network.ApiClient.apiService.updateProfile(userId, req)
                                        if (response.isSuccessful) {
                                            currentStep++
                                        } else {
                                            val errorMsg = try {
                                                val json = response.errorBody()?.string() ?: "{}"
                                                val jsonObj = org.json.JSONObject(json)
                                                if (jsonObj.has("message")) jsonObj.getString("message")
                                                else if (jsonObj.has("Message")) jsonObj.getString("Message")
                                                else "Failed to save profile. Please try again."
                                            } catch (e: Exception) {
                                                "Failed to save profile. Please try again."
                                            }
                                            saveError = errorMsg
                                        }
                                    } catch (e: Exception) {
                                        saveError = "Network error: ${e.message}"
                                    } finally {
                                        isSaving = false
                                    }
                                }
                            } else {
                                currentStep++
                            }
                        } else if (currentStep == 2) {
                            val userId = sessionManager.getUserId()
                            if (userId != null) {
                                isSaving = true
                                saveError = null
                                coroutineScope.launch {
                                    try {
                                        // Submit PAN card KYC
                                        val panReq = com.example.aishwaryam_android.network.SubmitKycRequest(
                                            userId = userId,
                                            documentType = "PAN",
                                            documentNumber = panNumber,
                                            documentUrl = panImageBase64
                                        )
                                        val panResponse = com.example.aishwaryam_android.network.ApiClient.apiService.submitKyc(panReq)
                                        
                                        // Submit Aadhaar card KYC
                                        val aadhaarReq = com.example.aishwaryam_android.network.SubmitKycRequest(
                                            userId = userId,
                                            documentType = "AADHAAR",
                                            documentNumber = identityNumber.replace(" ", ""),
                                            documentUrl = aadhaarImageBase64
                                        )
                                        val aadhaarResponse = com.example.aishwaryam_android.network.ApiClient.apiService.submitKyc(aadhaarReq)
                                        
                                        if (panResponse.isSuccessful && aadhaarResponse.isSuccessful) {
                                            currentStep++
                                        } else {
                                            saveError = "Failed to submit KYC documents to server."
                                        }
                                    } catch (e: Exception) {
                                        saveError = "Network error: ${e.message}"
                                    } finally {
                                        isSaving = false
                                    }
                                }
                            } else {
                                currentStep++
                            }
                        } else if (currentStep < totalSteps) {
                            currentStep++
                        } else {
                            val userId = sessionManager.getUserId()
                            if (userId != null) {
                                isSaving = true
                                saveError = null
                                coroutineScope.launch {
                                    try {
                                        val req = com.example.aishwaryam_android.network.AddBankAccountRequest(
                                            userId = userId,
                                            accountNumber = accountNumber,
                                            ifscCode = ifscCode,
                                            bankName = bankName
                                        )
                                        val response = com.example.aishwaryam_android.network.ApiClient.apiService.addBankAccount(req)
                                        if (response.isSuccessful) {
                                            onComplete()
                                        } else {
                                            saveError = "Failed to link bank account."
                                        }
                                    } catch (e: Exception) {
                                        saveError = "Network error: ${e.message}"
                                    } finally {
                                        isSaving = false
                                    }
                                }
                            } else {
                                onComplete()
                            }
                        }
                    },
                    modifier = Modifier.weight(1f).padding(start = 8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A0E4E), contentColor = Color.White),
                    enabled = !isSaving && dobError == null && weddingDateError == null && emailError == null && when (currentStep) {
                        1 -> name.isNotEmpty() && phone.isNotEmpty() && termsAccepted && email.isNotEmpty() && isValidEmail(email) && nomineeName.isNotEmpty() && nomineeContact.isNotEmpty() && isValidIndianDate(dob) && (!isMarried || isValidIndianDate(weddingDate))
                        2 -> isPanVerified && isIdVerified && isPanImageUploaded && isAadhaarImageUploaded && panError == null && identityError == null
                        3 -> accountName.isNotEmpty() && bankName.isNotEmpty() && 
                             accountNumber.isNotEmpty() && accountNumber == confirmAccountNumber &&
                             accountName.trim().equals(fetchedPanName.trim(), ignoreCase = true)
                        else -> true
                    }
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(if (currentStep == totalSteps) "Finish" else "Next")
                    }
                }
            }
        }
    }
}
}

@Composable
fun ProgressStepper(currentStep: Int, totalSteps: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        for (i in 1..totalSteps) {
            val isActive = i <= currentStep
            Box(
                modifier = Modifier
                    .size(30.dp)
                    .background(
                        color = if (isActive) Color(0xFF7A004C) else Color.LightGray,
                        shape = RoundedCornerShape(15.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = i.toString(),
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            if (i < totalSteps) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(2.dp)
                        .background(if (i < currentStep) Color(0xFF7A004C) else Color.LightGray)
                )
            }
        }
    }
}

@Composable
fun Step1BasicProfile(
    name: String, onNameChange: (String) -> Unit,
    dob: String, onDobChange: (String) -> Unit,
    dobError: String?, onDobErrorChange: (String?) -> Unit,
    nomineeName: String, onNomineeNameChange: (String) -> Unit,
    nomineeContact: String, onNomineeContactChange: (String) -> Unit,
    isMarried: Boolean, onMaritalStatusChange: (Boolean) -> Unit,
    weddingDate: String, onWeddingDateChange: (String) -> Unit,
    weddingDateError: String?, onWeddingDateErrorChange: (String?) -> Unit,
    phone: String, onPhoneChange: (String) -> Unit,
    email: String, onEmailChange: (String) -> Unit,
    emailError: String?,
    gender: String, onGenderChange: (String) -> Unit,
    pincode: String, onPincodeChange: (String) -> Unit,
    state: String, onStateChange: (String) -> Unit,
    city: String, onCityChange: (String) -> Unit,
    area: String, onAreaChange: (String) -> Unit,
    isManualArea: Boolean, onManualAreaToggle: (Boolean) -> Unit,
    termsAccepted: Boolean, onTermsAcceptedChange: (Boolean) -> Unit,
    onShowTermsClick: () -> Unit,
    onShowPrivacyClick: () -> Unit
) {
    val context = LocalContext.current
    var showDobPicker by remember { mutableStateOf(false) }
    var showWeddingDatePicker by remember { mutableStateOf(false) }

    if (showDobPicker) {
        val calendar = java.util.Calendar.getInstance()
        if (dob.isNotEmpty()) {
            try {
                val parts = dob.split("/")
                if (parts.size == 3) {
                    calendar.set(java.util.Calendar.DAY_OF_MONTH, parts[0].toInt())
                    calendar.set(java.util.Calendar.MONTH, parts[1].toInt() - 1)
                    calendar.set(java.util.Calendar.YEAR, parts[2].toInt())
                }
            } catch (e: Exception) {}
        }
        android.app.DatePickerDialog(
            context,
            { _, y, m, d ->
                val formatted = String.format("%02d/%02d/%04d", d, m + 1, y)
                onDobChange(formatted)
                onDobErrorChange(null)
                showDobPicker = false
            },
            calendar.get(java.util.Calendar.YEAR),
            calendar.get(java.util.Calendar.MONTH),
            calendar.get(java.util.Calendar.DAY_OF_MONTH)
        ).apply {
            setOnDismissListener { showDobPicker = false }
            show()
        }
    }

    if (showWeddingDatePicker) {
        val calendar = java.util.Calendar.getInstance()
        if (weddingDate.isNotEmpty()) {
            try {
                val parts = weddingDate.split("/")
                if (parts.size == 3) {
                    calendar.set(java.util.Calendar.DAY_OF_MONTH, parts[0].toInt())
                    calendar.set(java.util.Calendar.MONTH, parts[1].toInt() - 1)
                    calendar.set(java.util.Calendar.YEAR, parts[2].toInt())
                }
            } catch (e: Exception) {}
        }
        android.app.DatePickerDialog(
            context,
            { _, y, m, d ->
                val formatted = String.format("%02d/%02d/%04d", d, m + 1, y)
                onWeddingDateChange(formatted)
                onWeddingDateErrorChange(null)
                showWeddingDatePicker = false
            },
            calendar.get(java.util.Calendar.YEAR),
            calendar.get(java.util.Calendar.MONTH),
            calendar.get(java.util.Calendar.DAY_OF_MONTH)
        ).apply {
            setOnDismissListener { showWeddingDatePicker = false }
            show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Text("Step 1: Basic Profile", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7A004C))
        Spacer(modifier = Modifier.height(16.dp))

        // Glassmorphism-style Input Container
        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = onNameChange,
                    label = { Text("Full Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                fun validateDate(input: String, isWedding: Boolean) {
                    val errorCallback = if (isWedding) onWeddingDateErrorChange else onDobErrorChange
                    if (input.isEmpty()) {
                        errorCallback(null)
                        return
                    }
                    if (input.any { !it.isDigit() && it != '/' }) {
                        errorCallback("Only numbers and '/' are allowed")
                        return
                    }
                    if (input.length == 10) {
                        val parts = input.split("/")
                        if (parts.size != 3) {
                            errorCallback("Format must be DD/MM/YYYY")
                            return
                        }
                        val d = parts[0].toIntOrNull()
                        val m = parts[1].toIntOrNull()
                        val y = parts[2].toIntOrNull()
                        if (d == null || m == null || y == null) {
                            errorCallback("Invalid numbers in date")
                            return
                        }
                        val currentYear = java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)
                        if (y < 1900 || y > currentYear) {
                            errorCallback("Year must be between 1900 and $currentYear")
                            return
                        }
                        if (!isWedding && y > currentYear - 18) {
                            errorCallback("You must be at least 18 years old")
                            return
                        }
                        if (m < 1 || m > 12) {
                            errorCallback("Month must be between 01 and 12")
                            return
                        }
                        val days = when (m) {
                            2 -> if ((y % 4 == 0 && y % 100 != 0) || (y % 400 == 0)) 29 else 28
                            4, 6, 9, 11 -> 30
                            else -> 31
                        }
                        if (d < 1 || d > days) {
                            errorCallback("Invalid day for the selected month")
                            return
                        }
                    } else if (input.length > 10) {
                        errorCallback("Date cannot exceed 10 characters")
                        return
                    }
                    errorCallback(null)
                }

                OutlinedTextField(
                    value = dob,
                    onValueChange = { input ->
                        val filtered = input.filter { it.isDigit() || it == '/' }
                        val formatted = formatDobInput(filtered)
                        onDobChange(formatted)
                        if (input.any { !it.isDigit() && it != '/' }) {
                            onDobErrorChange("Only numbers and '/' are allowed")
                        } else {
                            validateDate(formatted, isWedding = false)
                        }
                    },
                    isError = dobError != null,
                    label = { Text("Date of Birth (DD/MM/YYYY)") },
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = {
                        IconButton(onClick = { showDobPicker = true }) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.DateRange,
                                contentDescription = "Select Date",
                                tint = Color(0xFF4A0E4E)
                            )
                        }
                    },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                if (dobError != null) {
                    Text(
                        text = dobError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = nomineeName,
                    onValueChange = onNomineeNameChange,
                    label = { Text("Nominee Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = nomineeContact,
                    onValueChange = { input ->
                        val clean = input.filter { it.isDigit() }
                        onNomineeContactChange(clean)
                    },
                    label = { Text("Nominee Contact Number") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Marital Status: ", color = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Switch(checked = isMarried, onCheckedChange = onMaritalStatusChange)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isMarried) "Married" else "Single", color = Color.Black)
                }

                if (isMarried) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = weddingDate,
                        onValueChange = { input ->
                            val filtered = input.filter { it.isDigit() || it == '/' }
                            val formatted = formatDobInput(filtered)
                            onWeddingDateChange(formatted)
                            if (input.any { !it.isDigit() && it != '/' }) {
                                onWeddingDateErrorChange("Only numbers and '/' are allowed")
                            } else {
                                validateDate(formatted, isWedding = true)
                            }
                        },
                        isError = weddingDateError != null,
                        label = { Text("Wedding Date (DD/MM/YYYY)") },
                        modifier = Modifier.fillMaxWidth(),
                        trailingIcon = {
                            IconButton(onClick = { showWeddingDatePicker = true }) {
                                Icon(
                                    imageVector = androidx.compose.material.icons.Icons.Default.DateRange,
                                    contentDescription = "Select Date",
                                    tint = Color(0xFF4A0E4E)
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Next
                        ),
                        colors = textFieldColors()
                    )
                    if (weddingDateError != null) {
                        Text(
                            text = weddingDateError ?: "",
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Contact details block
        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = phone,
                    onValueChange = onPhoneChange,
                    label = { Text("Phone Number") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Phone,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = onEmailChange,
                    isError = emailError != null,
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                if (emailError != null) {
                    Text(
                        text = emailError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Gender: ", color = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    RadioButton(selected = gender == "Male", onClick = { onGenderChange("Male") })
                    Text("Male", color = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    RadioButton(selected = gender == "Female", onClick = { onGenderChange("Female") })
                    Text("Female", color = Color.Black)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = pincode,
                    onValueChange = {
                        val clean = it.filter { digit -> digit.isDigit() }.take(6)
                        onPincodeChange(clean)
                        if (clean.length == 6) {
                            if (clean.startsWith("641")) {
                                onStateChange("Tamil Nadu")
                                onCityChange("Coimbatore")
                                onAreaChange("Gandhipuram")
                            } else {
                                // Simulate API call for other pincodes
                                onStateChange("Tamil Nadu")
                                onCityChange("Chennai")
                                onAreaChange("T. Nagar")
                            }
                        }
                    },
                    label = { Text("Pincode") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state,
                    onValueChange = onStateChange,
                    label = { Text("State") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true,
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = city,
                    onValueChange = onCityChange,
                    label = { Text("City") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true,
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                if (isManualArea) {
                    OutlinedTextField(
                        value = area,
                        onValueChange = onAreaChange,
                        label = { Text("Area (Manual)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Text,
                            imeAction = ImeAction.Done
                        ),
                        colors = textFieldColors()
                    )
                } else {
                    // Placeholder for Dropdown
                    OutlinedTextField(
                        value = area,
                        onValueChange = onAreaChange,
                        label = { Text("Area (Dropdown)") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = false,
                        singleLine = true,
                        colors = textFieldColors()
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isManualArea, onCheckedChange = onManualAreaToggle)
                    Text("Area not listed? Enter manually", color = Color.Black)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(checked = termsAccepted, onCheckedChange = onTermsAcceptedChange)
            val annotatedString = buildAnnotatedString {
                append("I accept the ")
                pushStringAnnotation(tag = "terms", annotation = "terms")
                withStyle(style = SpanStyle(color = Color(0xFF7A004C), textDecoration = TextDecoration.Underline, fontWeight = FontWeight.Bold)) {
                    append("Terms of Service")
                }
                pop()
                append(" and ")
                pushStringAnnotation(tag = "privacy", annotation = "privacy")
                withStyle(style = SpanStyle(color = Color(0xFF7A004C), textDecoration = TextDecoration.Underline, fontWeight = FontWeight.Bold)) {
                    append("Privacy Policy")
                }
                pop()
            }
            ClickableText(
                text = annotatedString,
                onClick = { offset ->
                    annotatedString.getStringAnnotations(tag = "terms", start = offset, end = offset).firstOrNull()?.let {
                        onShowTermsClick()
                    }
                    annotatedString.getStringAnnotations(tag = "privacy", start = offset, end = offset).firstOrNull()?.let {
                        onShowPrivacyClick()
                    }
                }
            )
        }
    }
}

@Composable
fun GlassInputContainer(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.8f), shape = RoundedCornerShape(12.dp))
            .border(1.dp, Color.White.copy(alpha = 0.5f), shape = RoundedCornerShape(12.dp))
    ) {
        content()
    }
}

@Composable
fun Step2KYCVerification(
    panNumber: String, onPanChange: (String) -> Unit,
    panError: String?,
    panImageBase64: String,
    isPanImageUploaded: Boolean,
    onPanImageSelected: (String) -> Unit,
    isPanOtpSent: Boolean, onSendPanOtp: () -> Unit,
    panOtp: String, onPanOtpChange: (String) -> Unit,
    isPanVerified: Boolean, onVerifyPan: () -> Unit,
    fetchedName: String,
    identityNumber: String, onIdChange: (String) -> Unit,
    identityError: String?,
    aadhaarImageBase64: String,
    isAadhaarImageUploaded: Boolean,
    onAadhaarImageSelected: (String) -> Unit,
    isIdOtpSent: Boolean, onSendIdOtp: () -> Unit,
    idOtp: String, onIdOtpChange: (String) -> Unit,
    isIdVerified: Boolean, onVerifyId: () -> Unit
) {
    val context = LocalContext.current

    val panImagePickerLauncher = rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val base64 = uriToBase64(context, it)
            if (base64 != null) {
                onPanImageSelected(base64)
            }
        }
    }

    val aadhaarImagePickerLauncher = rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val base64 = uriToBase64(context, it)
            if (base64 != null) {
                onAadhaarImageSelected(base64)
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Text("Step 2: KYC Verification", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7A004C))
        Spacer(modifier = Modifier.height(16.dp))

        // PAN Card Verification
        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("PAN Verification", fontWeight = FontWeight.Bold, color = Color(0xFF7A004C))
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = panNumber,
                    onValueChange = onPanChange,
                    isError = panError != null,
                    label = { Text("Enter PAN Number") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isPanVerified,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                if (panError != null) {
                    Text(
                        text = panError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                // Scan / Upload Button for PAN
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Button(
                        onClick = { panImagePickerLauncher.launch("image/*") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.CameraAlt, null, tint = Color.White)
                        Spacer(Modifier.width(8.dp))
                        Text(if (isPanImageUploaded) "Rescan / Reupload PAN" else "Scan / Upload PAN")
                    }
                }
                if (isPanImageUploaded) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("✓ PAN Document Scanned & Attached (Base64)", color = Color(0xFF2E7D32), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(modifier = Modifier.height(16.dp))

                if (!isPanOtpSent && !isPanVerified) {
                    Button(
                        onClick = onSendPanOtp,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        enabled = panNumber.length == 10 && panError == null
                    ) {
                        Text("Authorize / Get OTP")
                    }
                }

                if (isPanOtpSent && !isPanVerified) {
                    OutlinedTextField(
                        value = panOtp,
                        onValueChange = { if (it.all { char -> char.isDigit() }) onPanOtpChange(it) },
                        label = { Text("Enter OTP") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        colors = textFieldColors()
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onVerifyPan,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        enabled = panOtp.length == 4 // Assume 4 digit OTP
                    ) {
                        Text("Verify OTP")
                    }
                }

                if (isPanVerified) {
                    Text("✓ PAN Verified Successfully", color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Name on Card: $fetchedName", fontSize = 14.sp, color = Color.Black)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Identity Verification (Aadhaar/VoterID etc.)
        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Identity Verification", fontWeight = FontWeight.Bold, color = Color(0xFF7A004C))
                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = identityNumber,
                    onValueChange = onIdChange,
                    isError = identityError != null,
                    label = { Text("Enter Identity Number (Aadhaar)") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isIdVerified,
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                if (identityError != null) {
                    Text(
                        text = identityError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                // Scan / Upload Button for Aadhaar
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Button(
                        onClick = { aadhaarImagePickerLauncher.launch("image/*") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.CameraAlt, null, tint = Color.White)
                        Spacer(Modifier.width(8.dp))
                        Text(if (isAadhaarImageUploaded) "Rescan / Reupload Aadhaar" else "Scan / Upload Aadhaar")
                    }
                }
                if (isAadhaarImageUploaded) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("✓ Aadhaar Document Scanned & Attached (Base64)", color = Color(0xFF2E7D32), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(modifier = Modifier.height(16.dp))

                if (!isIdOtpSent && !isIdVerified) {
                    Button(
                        onClick = onSendIdOtp,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        enabled = identityNumber.isNotEmpty() && identityError == null
                    ) {
                        Text("Get OTP")
                    }
                }

                if (isIdOtpSent && !isIdVerified) {
                    OutlinedTextField(
                        value = idOtp,
                        onValueChange = { if (it.all { char -> char.isDigit() }) onIdOtpChange(it) },
                        label = { Text("Enter OTP") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        colors = textFieldColors()
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = onVerifyId,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7A004C), contentColor = Color.White),
                        enabled = idOtp.length == 4
                    ) {
                        Text("Verify OTP")
                    }
                }

                if (isIdVerified) {
                    Text("✓ Identity Verified Successfully", color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun Step3FinancialSetup(
    accountName: String, onAccountNameChange: (String) -> Unit,
    bankName: String, onBankNameChange: (String) -> Unit,
    branchName: String, onBranchNameChange: (String) -> Unit,
    ifscCode: String, onIfscChange: (String) -> Unit,
    accountNumber: String, onAccountNumberChange: (String) -> Unit,
    confirmAccountNumber: String, onConfirmAccountNumberChange: (String) -> Unit,
    kycName: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        Text("Step 3: Financial Setup", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF7A004C))
        Spacer(modifier = Modifier.height(16.dp))

        GlassInputContainer {
            Column(modifier = Modifier.padding(16.dp)) {
                OutlinedTextField(
                    value = accountName,
                    onValueChange = onAccountNameChange,
                    label = { Text("Account Holder Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    isError = accountName.isNotEmpty() && !accountName.equals(kycName, ignoreCase = true),
                    colors = textFieldColors()
                )
                if (accountName.isNotEmpty() && !accountName.equals(kycName, ignoreCase = true)) {
                    Text(
                        "Name must match KYC name: $kycName",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = ifscCode,
                    onValueChange = {
                        onIfscChange(it)
                        if (it.length == 11) {
                            // Simulate IFSC lookup
                            onBankNameChange("State Bank of India")
                            onBranchNameChange("T. Nagar Branch")
                        }
                    },
                    label = { Text("IFSC Code") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = bankName,
                    onValueChange = onBankNameChange,
                    label = { Text("Bank Name") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true,
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = branchName,
                    onValueChange = onBranchNameChange,
                    label = { Text("Branch") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true,
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = accountNumber,
                    onValueChange = onAccountNumberChange,
                    label = { Text("Account Number") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Next
                    ),
                    colors = textFieldColors()
                )
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = confirmAccountNumber,
                    onValueChange = onConfirmAccountNumberChange,
                    label = { Text("Confirm Account Number") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Number,
                        imeAction = ImeAction.Done
                    ),
                    isError = confirmAccountNumber.isNotEmpty() && confirmAccountNumber != accountNumber,
                    colors = textFieldColors()
                )
                if (confirmAccountNumber.isNotEmpty() && confirmAccountNumber != accountNumber) {
                    Text(
                        "Account numbers do not match",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}
