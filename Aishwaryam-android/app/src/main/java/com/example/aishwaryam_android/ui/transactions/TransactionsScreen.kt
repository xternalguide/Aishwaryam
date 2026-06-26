package com.example.aishwaryam_android.ui.transactions

import com.example.aishwaryam_android.utils.ReceiptGenerator
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.aishwaryam_android.network.TransactionItem
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

// ── Professional FinTech Color tokens ─────────────────────────────────────
private val MagentaPrimary = Color(0xFF4A0E4E) // Deep Wine
private val MagentaAccent = Color(0xFFC2185B) // Bright Magenta
private val SurfaceLight = Color(0xFFF8F9FA) // Clean White/Grey
private val TextPrimary = Color(0xFF1A1A1A)
private val TextMuted = Color(0xFF666666)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(
    userId: String,
    viewModel: TransactionsViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(userId) {
        viewModel.loadTransactions(userId)
    }

    var selectedTransaction by remember { mutableStateOf<TransactionItem?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    Column(modifier = Modifier.fillMaxSize().background(SurfaceLight)) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp, start = 20.dp, end = 20.dp, bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                stringResource(R.string.transactions), 
                fontSize = 24.sp, 
                fontWeight = FontWeight.Black, 
                color = MagentaPrimary,
                letterSpacing = (-0.5).sp
            )
            
            IconButton(
                onClick = { viewModel.setSortOrder(if (state.sortOrder == "NEWEST") "OLDEST" else "NEWEST") },
                modifier = Modifier.clip(CircleShape).background(MagentaPrimary.copy(alpha=0.08f))
            ) {
                Icon(
                    imageVector = Icons.Default.SwapHoriz,
                    contentDescription = stringResource(R.string.sort),
                    tint = MagentaPrimary
                )
            }
        }

        // Professional Filter Chips — horizontally scrollable so long Tamil strings never clip
        androidx.compose.foundation.lazy.LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(end = 8.dp)
        ) {
            item { ModernFilterChip(stringResource(R.string.filter_all_activity), state.filterType == "ALL") { viewModel.setFilterType("ALL") } }
            item { ModernFilterChip(stringResource(R.string.filter_savings), state.filterType == "BUY") { viewModel.setFilterType("BUY") } }
            item { ModernFilterChip(stringResource(R.string.filter_redeemed), state.filterType == "SELL") { viewModel.setFilterType("SELL") } }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (state.isLoading && state.displayedTransactions.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                com.example.aishwaryam_android.ui.components.GoldCoinLoadingAnimation(modifier = Modifier.size(60.dp))
            }
        } else if (state.error != null && state.displayedTransactions.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(state.error!!, color = Color.Red, fontWeight = FontWeight.Bold)
            }
        } else if (state.displayedTransactions.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Default.Receipt, null, modifier = Modifier.size(64.dp), tint = Color.LightGray)
                Spacer(Modifier.height(16.dp))
                Text(stringResource(R.string.no_transactions), color = TextMuted, fontWeight = FontWeight.Medium)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(state.displayedTransactions) { tx ->
                    ModernTransactionRow(tx = tx) {
                        selectedTransaction = tx
                        coroutineScope.launch { sheetState.show() }
                    }
                }
                item { Spacer(Modifier.height(32.dp)) }
            }
        }
    }

    // Transaction Details Bottom Sheet
    if (selectedTransaction != null) {
        ModalBottomSheet(
            onDismissRequest = { 
                coroutineScope.launch { sheetState.hide() }
                selectedTransaction = null 
            },
            sheetState = sheetState,
            containerColor = Color.White
        ) {
            TransactionDetailsSheet(
                tx = selectedTransaction!!,
                onDownloadClick = {
                    coroutineScope.launch {
                        ReceiptGenerator.generateAndSaveReceipt(context, selectedTransaction!!)
                    }
                }
            )
        }
    }
}

@Composable
fun ModernFilterChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = if (selected) MagentaPrimary else Color.White,
        modifier = Modifier.clickable { onClick() }.shadow(if (selected) 4.dp else 0.dp, RoundedCornerShape(14.dp)),
        border = if (selected) null else androidx.compose.foundation.BorderStroke(1.dp, Color.LightGray.copy(alpha=0.4f))
    ) {
        Text(
            text = label,
            color = if (selected) Color.White else TextMuted,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
    }
}

@Composable
fun ModernTransactionRow(tx: TransactionItem, onClick: () -> Unit) {
    val isBuy = tx.type.equals("BUY", ignoreCase = true)
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    val hasAmount = tx.amountPaise > 0L
    val formattedAmount = if (hasAmount) formatter.format(tx.amountPaise / 100.0) else "—"

    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.shadow(2.dp, RoundedCornerShape(18.dp)),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        shape = RoundedCornerShape(18.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (isBuy) Color(0xFFF0FDF4) else Color(0xFFFEF2F2)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isBuy) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                    contentDescription = null,
                    tint = if (isBuy) Color(0xFF16A34A) else Color(0xFFDC2626),
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (isBuy) stringResource(R.string.added_to_savings) else stringResource(R.string.redeemed_gold),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp,
                    color = TextPrimary
                )
                Text(
                    text = tx.createdAt.take(10),
                    fontSize = 12.sp,
                    color = TextMuted,
                    fontWeight = FontWeight.Medium
                )
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = if (!hasAmount) "${tx.goldWeightMg} mg"
                           else (if (isBuy) "+" else "-") + formattedAmount,
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp,
                    color = when {
                        !hasAmount -> Color(0xFFFFB300) // Gold amber for gold-only entries
                        isBuy     -> Color(0xFF16A34A) // Green for BUY (credit to savings)
                        else      -> Color(0xFFDC2626) // Red for SELL (debit/redemption)
                    }
                )
                if (hasAmount) {
                    Text(
                        text = "${tx.goldWeightMg} mg",
                        fontSize = 12.sp,
                        color = MagentaAccent,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun TransactionDetailsSheet(tx: TransactionItem, onDownloadClick: () -> Unit) {
    val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
    val formattedAmount = formatter.format(tx.amountPaise / 100.0)
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .padding(bottom = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(MagentaPrimary.copy(alpha = 0.08f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Receipt, null, tint = MagentaPrimary, modifier = Modifier.size(36.dp))
        }
        
        Spacer(modifier = Modifier.height(20.dp))
        
        Text(
            text = "Payment Successful",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF16A34A)
        )
        Text(
            text = stringResource(R.string.receipt_generated_desc),
            fontSize = 14.sp,
            color = TextMuted,
            fontWeight = FontWeight.Medium
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceLight),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                val shortTxId = tx.transactionId.take(8).uppercase() + "..."
                DetailRowItem("Transaction ID", shortTxId)
                DetailRowItem("Type", tx.type.uppercase())
                DetailRowItem("Date", tx.createdAt.take(10))
                DetailRowItem("Gold Weight", "${tx.goldWeightMg} mg")
                
                HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), color = Color.LightGray.copy(alpha=0.3f))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.total_amount), fontWeight = FontWeight.Black, fontSize = 18.sp, color = TextPrimary)
                    Text(formattedAmount, fontWeight = FontWeight.Black, fontSize = 18.sp, color = MagentaAccent)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onDownloadClick,
            modifier = Modifier.fillMaxWidth().height(60.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MagentaPrimary, contentColor = Color.White),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Download Receipt", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(16.dp))

        val context = androidx.compose.ui.platform.LocalContext.current
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
            Text("Need Help? Contact Customer Support", color = MagentaAccent, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

@Composable
private fun DetailRowItem(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 14.sp, color = TextMuted, fontWeight = FontWeight.Medium)
        Text(text = value, fontSize = 14.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
    }
}
