package com.example.aishwaryam_android.ui.notifications

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.MarkEmailRead
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.aishwaryam_android.network.UserNotificationDto
import com.example.aishwaryam_android.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    navController: NavController,
    viewModel: NotificationsViewModel = viewModel()
) {
    val notifications by viewModel.notifications.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    // Automatically mark all loaded notifications as read when entering the screen
    LaunchedEffect(notifications) {
        if (notifications.isNotEmpty() && notifications.any { it.isRead != true }) {
            viewModel.markAllAsRead()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = BrandDark,
                    navigationIconContentColor = BrandDark
                )
            )
        },
        containerColor = Color(0xFFF9FAFB)
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when {
                isLoading -> {
                    NotificationsSkeleton()
                }
                error != null -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = error ?: "Unknown error", color = Color.Red)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { viewModel.fetchNotifications() },
                            colors = ButtonDefaults.buttonColors(containerColor = BrandDark)
                        ) {
                            Text("Retry", color = Color.White)
                        }
                    }
                }
                notifications.isEmpty() -> {
                    EmptyNotifications()
                }
                else -> {
                    val grouped = groupNotifications(notifications)
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        grouped.forEach { (dateGroup, list) ->
                            item {
                                Text(
                                    text = dateGroup,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Gray,
                                    modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                                )
                            }
                            items(list, key = { it.id ?: "" }) { notification ->
                                NotificationItemSwipeable(
                                    notification = notification,
                                    onRead = { viewModel.markAsRead(notification.id ?: "") },
                                    onDelete = { viewModel.deleteNotification(notification.id ?: "") },
                                    onClick = {
                                        if (!(notification.isRead ?: false)) viewModel.markAsRead(notification.id ?: "")
                                        handleNotificationClick(navController, notification)
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationItemSwipeable(
    notification: UserNotificationDto,
    onRead: () -> Unit,
    onDelete: () -> Unit,
    onClick: () -> Unit
) {
    var isDismissed by remember { mutableStateOf(false) }
    
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { dismissValue ->
            when (dismissValue) {
                SwipeToDismissBoxValue.EndToStart -> {
                    isDismissed = true
                    onDelete()
                    true
                }
                SwipeToDismissBoxValue.StartToEnd -> {
                    if (!(notification.isRead ?: false)) {
                        onRead()
                    }
                    false
                }
                else -> false
            }
        }
    )

    AnimatedVisibility(
        visible = !isDismissed,
        exit = fadeOut(tween(200)) + shrinkVertically(tween(200))
    ) {
        SwipeToDismissBox(
            state = dismissState,
            backgroundContent = {
                val color = when (dismissState.targetValue) {
                    SwipeToDismissBoxValue.EndToStart -> Color.Red
                    SwipeToDismissBoxValue.StartToEnd -> Color(0xFF4CAF50)
                    else -> Color.Transparent
                }
                val alignment = when (dismissState.targetValue) {
                    SwipeToDismissBoxValue.EndToStart -> Alignment.CenterEnd
                    SwipeToDismissBoxValue.StartToEnd -> Alignment.CenterStart
                    else -> Alignment.Center
                }
                val icon = when (dismissState.targetValue) {
                    SwipeToDismissBoxValue.EndToStart -> Icons.Outlined.Delete
                    SwipeToDismissBoxValue.StartToEnd -> Icons.Outlined.MarkEmailRead
                    else -> Icons.Default.Info
                }

                Box(
                    Modifier
                        .fillMaxSize()
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(color)
                        .padding(horizontal = 20.dp),
                    contentAlignment = alignment
                ) {
                    Icon(
                        icon,
                        contentDescription = "Action",
                        tint = Color.White
                    )
                }
            },
            content = {
                NotificationCard(notification = notification, onClick = onClick)
            }
        )
    }
}

@Composable
fun NotificationCard(
    notification: UserNotificationDto,
    onClick: () -> Unit
) {
    val (icon, tint, bgColor) = getNotificationIconData(notification.type ?: "GENERAL")

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead ?: false) Color.White else Color(0xFFFFF0F5)
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (notification.isRead ?: false) 1.dp else 2.dp
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Icon Box
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(bgColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = tint,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))

            // Text Content
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = notification.title ?: "",
                    fontWeight = if (notification.isRead ?: false) FontWeight.Medium else FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Color(0xFF1F2937)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = notification.message ?: "",
                    fontSize = 13.sp,
                    color = Color(0xFF6B7280),
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = formatTime(notification.createdAt ?: ""),
                    fontSize = 11.sp,
                    color = Color(0xFF9CA3AF)
                )
            }
            
            // Unread Indicator
            if (!(notification.isRead ?: false)) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(BrandDark, CircleShape)
                        .align(Alignment.CenterVertically)
                )
            }
        }
    }
}

@Composable
fun EmptyNotifications() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.NotificationsNone,
            contentDescription = "No Notifications",
            modifier = Modifier.size(80.dp),
            tint = Color.LightGray
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "You're all caught up!",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1F2937)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "When you have new transactions, alerts, or offers, they will securely appear here.",
            fontSize = 14.sp,
            color = Color(0xFF6B7280),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun NotificationsSkeleton() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        repeat(5) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color(0xFFE5E7EB), CircleShape)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Box(modifier = Modifier.height(16.dp).fillMaxWidth(0.7f).background(Color(0xFFE5E7EB), RoundedCornerShape(4.dp)))
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(modifier = Modifier.height(12.dp).fillMaxWidth().background(Color(0xFFE5E7EB), RoundedCornerShape(4.dp)))
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.height(12.dp).fillMaxWidth(0.8f).background(Color(0xFFE5E7EB), RoundedCornerShape(4.dp)))
                    }
                }
            }
        }
    }
}

// Helpers

fun getNotificationIconData(type: String): Triple<ImageVector, Color, Color> {
    return when (type) {
        "PAYMENT_SUCCESS" -> Triple(Icons.Default.CheckCircle, Color(0xFF10B981), Color(0xFFD1FAE5))
        "GOLD_BUY" -> Triple(Icons.Default.ShoppingCart, BrandDark, Color(0xFFFDF2F8))
        "GOLD_SELL" -> Triple(Icons.Default.MonetizationOn, Color(0xFFF59E0B), Color(0xFFFEF3C7))
        "SCHEME_JOINED" -> Triple(Icons.Default.Star, Color(0xFF3B82F6), Color(0xFFDBEAFE))
        "SCHEME_MATURED" -> Triple(Icons.Default.EmojiEvents, Color(0xFF8B5CF6), Color(0xFFEDE9FE))
        "INSTALLMENT_SUCCESS" -> Triple(Icons.Default.TaskAlt, Color(0xFF10B981), Color(0xFFD1FAE5))
        "GOLD_REDEEMED" -> Triple(Icons.Default.CardGiftcard, Color(0xFFF59E0B), Color(0xFFFEF3C7))
        "KYC_APPROVED" -> Triple(Icons.Default.VerifiedUser, Color(0xFF10B981), Color(0xFFD1FAE5))
        "REFERRAL_REWARD" -> Triple(Icons.Default.Redeem, Color(0xFFEC4899), Color(0xFFFCE7F3))
        "GENERAL" -> Triple(Icons.Default.Notifications, Color(0xFF6B7280), Color(0xFFF3F4F6))
        else -> Triple(Icons.Default.Notifications, Color(0xFF6B7280), Color(0xFFF3F4F6))
    }
}

fun parseIsoDate(isoDate: String?): Date? {
    if (isoDate.isNullOrBlank()) return null
    return try {
        val cleanDate = if (isoDate.contains("T") && isoDate.length >= 19) {
            isoDate.substring(0, 19)
        } else {
            isoDate
        }
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        parser.timeZone = TimeZone.getTimeZone("UTC")
        parser.parse(cleanDate)
    } catch (e: Exception) {
        try {
            val fallbackParser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            fallbackParser.parse(isoDate)
        } catch (ex: Exception) {
            null
        }
    }
}

fun groupNotifications(notifications: List<UserNotificationDto>): Map<String, List<UserNotificationDto>> {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val today = sdf.format(Date())
    
    val cal = Calendar.getInstance()
    cal.add(Calendar.DAY_OF_YEAR, -1)
    val yesterday = sdf.format(cal.time)

    val map = mutableMapOf<String, MutableList<UserNotificationDto>>()
    
    for (n in notifications) {
        try {
            val dateObj = parseIsoDate(n.createdAt)
            val dateStr = dateObj?.let { sdf.format(it) } ?: ""
            
            val groupName = when (dateStr) {
                today -> "Today"
                yesterday -> "Yesterday"
                else -> {
                    try {
                        val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dateStr)
                        parsed?.let { SimpleDateFormat("dd MMMM yyyy", Locale.getDefault()).format(it) } ?: "Earlier"
                    } catch (e: Exception) {
                        "Earlier"
                    }
                }
            }
            
            if (!map.containsKey(groupName)) {
                map[groupName] = mutableListOf()
            }
            map[groupName]?.add(n)
        } catch (e: Exception) {
            if (!map.containsKey("Earlier")) {
                map["Earlier"] = mutableListOf()
            }
            map["Earlier"]?.add(n)
        }
    }
    
    return map
}

fun formatTime(isoDate: String): String {
    try {
        val date = parseIsoDate(isoDate)
        val formatter = SimpleDateFormat("hh:mm a", Locale.getDefault())
        formatter.timeZone = TimeZone.getDefault()
        return date?.let { formatter.format(it) } ?: isoDate
    } catch (e: Exception) {
        return isoDate
    }
}

fun handleNotificationClick(navController: NavController, notification: UserNotificationDto) {
    val type = notification.type ?: "GENERAL"
    val route = when (type.uppercase()) {
        "PAYMENT_SUCCESS", "GOLD_BUY", "GOLD_SELL", "GOLD_REDEEMED", "PAYMENT" -> "portfolio_analytics"
        "SCHEME_JOINED", "SCHEME_MATURED", "INSTALLMENT_SUCCESS", "SCHEME" -> {
            if (!notification.entityId.isNullOrEmpty()) "scheme_detail/${notification.entityId}" else "scheme_explorer"
        }
        "KYC_APPROVED", "KYC" -> "dashboard"
        "REFERRAL_REWARD", "REWARD" -> "referral"
        else -> null
    }
    
    if (route != null) {
        try {
            navController.navigate(route)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
