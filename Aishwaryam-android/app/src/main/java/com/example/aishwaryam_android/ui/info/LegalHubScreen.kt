package com.example.aishwaryam_android.ui.info

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aishwaryam_android.R
import com.example.aishwaryam_android.ui.theme.*
import com.example.aishwaryam_android.ui.components.TText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LegalHubScreen(onBackClick: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    TText(
                        stringResource(R.string.legal_hub_title),
                        fontFamily = PoppinsFamily,
                        fontWeight = FontWeight.Bold,
                        color = BrandDeep
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = BrandDeep)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFFAFAFA)
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                TText("Policies", fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = BrandDeep, modifier = Modifier.padding(start = 8.dp))
                Spacer(Modifier.height(8.dp))
                LegalRowItem(icon = Icons.Default.Description, title = stringResource(R.string.terms_conditions))
                LegalRowItem(icon = Icons.Default.PrivacyTip, title = stringResource(R.string.privacy_policy))
                LegalRowItem(icon = Icons.AutoMirrored.Filled.ReceiptLong, title = stringResource(R.string.refund_policy))
            }
            
            item {
                Spacer(Modifier.height(8.dp))
                TText("Trust & Compliance", fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold, color = BrandDeep, modifier = Modifier.padding(start = 8.dp))
                Spacer(Modifier.height(8.dp))
                LegalRowItem(icon = Icons.Default.Verified, title = stringResource(R.string.gold_purity_cert))
                LegalRowItem(icon = Icons.Default.AccountBalance, title = stringResource(R.string.trust_notes))
            }
            
            item {
                Spacer(Modifier.height(24.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = BrandDeep),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Storefront, contentDescription = null, tint = GoldWarm, modifier = Modifier.size(24.dp))
                            Spacer(Modifier.width(12.dp))
                            TText("Aishwaryam Headquarters", color = Color.White, fontFamily = PoppinsFamily, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(12.dp))
                        TText(
                            "124, Cross Cut Road, Gandhipuram\nCoimbatore, Tamil Nadu 641012\nIndia",
                            color = Color.White.copy(alpha = 0.8f),
                            fontFamily = PoppinsFamily,
                            fontSize = 13.sp,
                            lineHeight = 20.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun LegalRowItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { /* Future: Open PDF / WebView */ },
        color = Color.White,
        shape = RoundedCornerShape(12.dp),
        shadowElevation = 1.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = BrandDeep, modifier = Modifier.size(24.dp))
            Spacer(Modifier.width(16.dp))
            TText(title, fontFamily = PoppinsFamily, fontWeight = FontWeight.Medium, color = BrandDeep, modifier = Modifier.weight(1f))
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = TextMuted)
        }
    }
}
