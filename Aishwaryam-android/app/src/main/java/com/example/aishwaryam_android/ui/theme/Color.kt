package com.example.aishwaryam_android.ui.theme

import androidx.compose.ui.graphics.Color

// ═══════════════════════════════════════════════════════════════════════════
// AISHWARYAM DESIGN TOKEN SYSTEM
// "Trusted Jewellery Brand + Premium Fintech"
// ═══════════════════════════════════════════════════════════════════════════

// ── Brand Primary — Deep Magenta / Wine (the brand) ─────────────────────────
val BrandDeep     = Color(0xFF29001D)   // Deepest — splash bg, gradient start
val BrandDark     = Color(0xFF4A0E4E)   // Primary dark — top bars, buttons
val BrandMid      = Color(0xFF7B1FA2)   // Mid magenta — gradients
val BrandAccent   = Color(0xFFC2185B)   // Bright accent — CTAs, badges, highlights
val BrandGlow     = Color(0x334A0E4E)   // Transparent glow

// ── Gold Accents — Trust, Premium, Wealth ───────────────────────────────────
val GoldPrimary   = Color(0xFFFFD700)   // Pure gold — bonus, wealth
val GoldWarm      = Color(0xFFFFB300)   // Warm gold — highlights
val GoldDeep      = Color(0xFFB8860B)   // Dark gold — icons, borders
val GoldSoft      = Color(0xFFFFF8E1)   // Light gold tint — card backgrounds
val GoldGlow      = Color(0x33FFD700)   // Gold glow overlay

// ── Surface & Background ────────────────────────────────────────────────────
val SurfaceWhite  = Color(0xFFFFFFFF)
val SurfaceLight  = Color(0xFFF8F9FA)   // Main screen background
val SurfaceCard   = Color(0xFFF1F3F4)   // Card backgrounds
val SurfaceGold   = Color(0xFFFFF9F0)   // Warm gold-tinted surface

// ── Semantic ────────────────────────────────────────────────────────────────
val SuccessGreen  = Color(0xFF10B981)   // Payments, verified
val SuccessLight  = Color(0xFFECFDF5)
val WarningAmber  = Color(0xFFF59E0B)
val WarningLight  = Color(0xFFFEF3C7)
val ErrorRed      = Color(0xFFEF4444)
val ErrorLight    = Color(0xFFFEE2E2)

// ── Text ────────────────────────────────────────────────────────────────────
val TextPrimary   = Color(0xFF1A1A2E)   // Rich near-black
val TextSecondary = Color(0xFF4A4A68)
val TextMuted     = Color(0xFF6B7280)
val TextLight     = Color(0xFFA0A0AB)
val TextOnDark    = Color(0xFFFFFFFF)

// ── Trust / Compliance indicators ───────────────────────────────────────────
val TrustGreen    = Color(0xFF16A34A)
val TrustBlue     = Color(0xFF1D4ED8)
val TrustGold     = Color(0xFFB8860B)

// ── Legacy aliases (keeps existing code working) ─────────────────────────────
val BackgroundDark       = BrandDeep
val SurfaceDark          = Color(0xFF3E002B)
val SurfaceVariantDark   = Color(0xFF56003D)
val SurfaceHighlight     = Color(0xFF6E004F)
val MagentaPrimary       = BrandDark
val MagentaDark          = BrandDark
val MagentaGlow          = BrandGlow
val GoldDark             = GoldDeep