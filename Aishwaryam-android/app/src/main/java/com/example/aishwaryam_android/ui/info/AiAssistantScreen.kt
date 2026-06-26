package com.example.aishwaryam_android.ui.info

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*
import com.example.aishwaryam_android.ui.components.TText
import com.example.aishwaryam_android.data.SessionManager
import com.example.aishwaryam_android.network.ApiClient
import com.example.aishwaryam_android.network.ChatbotQueryRequest
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val text: String,
    val isFromUser: Boolean,
    val timestamp: Long = System.currentTimeMillis()
)

data class QuickReplyConfig(
    val titleRes: Int,
    val responseRes: Int
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AiAssistantScreen(
    onBackClick: () -> Unit,
    onContactSupportClick: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    
    val greetingText = stringResource(R.string.ai_greeting)
    
    var messages by remember {
        mutableStateOf(listOf(ChatMessage(text = greetingText, isFromUser = false)))
    }
    
    var inputText by remember { mutableStateOf("") }
    var isTyping by remember { mutableStateOf(false) }

    val quickReplies = listOf(
        QuickReplyConfig(R.string.qr_scheme_title, R.string.qr_scheme_response),
        QuickReplyConfig(R.string.qr_bonus_title, R.string.qr_bonus_response),
        QuickReplyConfig(R.string.qr_safety_title, R.string.qr_safety_response),
        QuickReplyConfig(R.string.qr_redemption_title, R.string.qr_redemption_response),
        QuickReplyConfig(R.string.qr_missed_title, R.string.qr_missed_response),
        QuickReplyConfig(R.string.qr_kyc_title, R.string.qr_kyc_response),
        QuickReplyConfig(R.string.qr_gst_title, R.string.qr_gst_response)
    )

    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val userId = sessionManager.getUserId() ?: ""

    // Helper to add user message then call backend AI assistant API
    fun handleUserMessage(text: String, botResponse: String? = null) {
        if (text.isBlank()) return
        val userMsg = ChatMessage(text = text, isFromUser = true)
        messages = messages + userMsg
        coroutineScope.launch {
            delay(100)
            listState.animateScrollToItem(messages.size - 1)
            
            isTyping = true
            
            if (botResponse != null) {
                // Static quick-reply response (FAQ fallback)
                delay(500)
                isTyping = false
                messages = messages + ChatMessage(text = botResponse, isFromUser = false)
                listState.animateScrollToItem(messages.size - 1)
            } else {
                // Dynamic LLM backend query
                try {
                    val response = ApiClient.apiService.queryAssistant(
                        ChatbotQueryRequest(userId = userId, message = text)
                    )
                    isTyping = false
                    
                    if (response.isSuccessful && response.body() != null) {
                        val reply = response.body()!!.message
                        messages = messages + ChatMessage(text = reply, isFromUser = false)
                    } else {
                        messages = messages + ChatMessage(
                            text = "மன்னிக்கவும்! தற்காலிக சேவை கோளாறு. (Apologies, temporary network error.)",
                            isFromUser = false
                        )
                    }
                } catch (e: Exception) {
                    isTyping = false
                    messages = messages + ChatMessage(
                        text = "இணைய இணைப்பு சிக்கல். தயவுசெய்து மீண்டும் முயற்சிக்கவும். (Connection error. Please try again.)",
                        isFromUser = false
                    )
                }
                delay(100)
                listState.animateScrollToItem(messages.size - 1)
            }
        }
    }

    Scaffold(
        topBar = {
            Surface(
                color = Color.White,
                modifier = Modifier.shadow(4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 4.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = BrandDeep
                        )
                    }
                    Spacer(Modifier.width(4.dp))
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(GoldWarm.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("✨", fontSize = 20.sp)
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = stringResource(R.string.ai_assistant_title),
                                fontFamily = PoppinsFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = BrandDeep,
                                lineHeight = 18.sp
                            )
                            Text(
                                text = stringResource(R.string.ai_assistant_subtitle),
                                fontFamily = PoppinsFamily,
                                fontSize = 11.sp,
                                color = BrandMid,
                                lineHeight = 14.sp
                            )
                        }
                    }
                    Spacer(Modifier.width(4.dp))
                    TextButton(
                        onClick = onContactSupportClick,
                        contentPadding = PaddingValues(horizontal = 8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SupportAgent,
                            contentDescription = null,
                            tint = BrandAccent,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            text = stringResource(R.string.escalate_support),
                            color = BrandAccent,
                            fontFamily = PoppinsFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        },
        containerColor = Color(0xFFFAFAFA)
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .imePadding()
        ) {
            // Chat Area
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(messages) { msg ->
                    ChatBubble(message = msg)
                }
                
                if (isTyping) {
                    item {
                        TypingIndicator()
                    }
                }
            }

            // Quick Replies (Horizontal Scroll)
            AnimatedVisibility(
                visible = !isTyping,
                enter = fadeIn() + slideInVertically { it / 2 }
            ) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(quickReplies) { qrConfig ->
                        val title = stringResource(qrConfig.titleRes)
                        val response = stringResource(qrConfig.responseRes)
                        QuickReplyChip(
                            text = title,
                            onClick = { handleUserMessage(title, response) }
                        )
                    }
                }
            }

            // Input Area
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        modifier = Modifier
                            .weight(1f)
                            .padding(horizontal = 8.dp),
                        placeholder = { 
                            Text(
                                stringResource(R.string.type_message),
                                fontFamily = PoppinsFamily,
                                fontSize = 14.sp
                            ) 
                        },
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandDeep,
                            unfocusedBorderColor = Color.LightGray,
                            focusedContainerColor = Color(0xFFF5F5F5),
                            unfocusedContainerColor = Color(0xFFF5F5F5)
                        ),
                        maxLines = 3
                    )
                    
                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                handleUserMessage(inputText)
                                inputText = ""
                            }
                        },
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (inputText.isNotBlank()) BrandAccent else Color.LightGray)
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

fun parseMarkdown(text: String): AnnotatedString {
    val cleanedText = text.lines().map { line ->
        val trimmed = line.trim()
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) "  • " + trimmed.substring(2) else line
    }.joinToString("\n")
    return buildAnnotatedString {
        val parts = cleanedText.split("**")
        var isBold = false
        for (part in parts) {
            if (isBold) {
                withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
                    append(part)
                }
            } else {
                append(part)
            }
            isBold = !isBold
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val timeFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())
    val timeString = timeFormat.format(Date(message.timestamp))

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (message.isFromUser) Alignment.End else Alignment.Start
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 20.dp,
                        topEnd = 20.dp,
                        bottomStart = if (message.isFromUser) 20.dp else 4.dp,
                        bottomEnd = if (message.isFromUser) 4.dp else 20.dp
                    )
                )
                .background(if (message.isFromUser) BrandDeep else Color.White)
                .padding(16.dp)
        ) {
            Text(
                text = parseMarkdown(message.text),
                color = if (message.isFromUser) Color.White else BrandDeep,
                fontFamily = PoppinsFamily,
                fontSize = 14.sp,
                lineHeight = 20.sp
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = timeString,
            fontSize = 10.sp,
            color = Color.Gray,
            fontFamily = PoppinsFamily,
            modifier = Modifier.padding(horizontal = 4.dp)
        )
    }
}

@Composable
fun QuickReplyChip(text: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, GoldWarm.copy(alpha = 0.5f)),
        shadowElevation = 2.dp
    ) {
        TText(
            text = text,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            fontFamily = PoppinsFamily,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = BrandDeep
        )
    }
}

@Composable
fun TypingIndicator() {
    val infiniteTransition = rememberInfiniteTransition()
    
    Row(
        modifier = Modifier
            .width(64.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(3) { index ->
            val scale by infiniteTransition.animateFloat(
                initialValue = 0.5f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(600, delayMillis = index * 200),
                    repeatMode = RepeatMode.Reverse
                ), label = "typing_dot"
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                    }
                    .clip(CircleShape)
                    .background(BrandMid)
            )
        }
    }
}
