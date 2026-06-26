package com.example.aishwaryam_android.ui.schemes

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.core.content.FileProvider
import com.example.aishwaryam_android.network.SchemeLedgerItem
import java.io.File
import java.io.FileOutputStream
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

object ReceiptPdfGenerator {

    private fun paiseToRupees(paise: Long): String {
        val fmt = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        return fmt.format(paise / 100.0)
    }

    private fun mgToGrams(mg: Long): String = String.format(Locale.US, "%.3f", mg / 1000.0)

    fun generateAndShareReceipt(
        context: Context,
        item: SchemeLedgerItem,
        userName: String,
        userPhone: String,
        schemeName: String,
        shareImmediately: Boolean = false
    ): Uri? {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 size: 595 x 842 points
        val page = pdfDocument.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        // Define premium typography paints
        val brandTitlePaint = Paint().apply {
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            textSize = 20f
            color = Color.parseColor("#4A0E4E") // Premium dark magenta
            textAlign = Paint.Align.CENTER
        }

        val logoTextPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 24f
            color = Color.parseColor("#C2185B")
            textAlign = Paint.Align.CENTER
        }

        val companyDetailsPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 8.5f
            color = Color.parseColor("#4B5563") // Slate gray
            textAlign = Paint.Align.RIGHT
        }

        val subheaderPaint = Paint().apply {
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
            textSize = 12f
            color = Color.BLACK
        }

        val fieldLabelPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 10f
            color = Color.parseColor("#374151")
        }

        val fieldValuePaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 10f
            color = Color.parseColor("#4B5563")
        }

        val tableHeaderPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 9.5f
            color = Color.WHITE
        }

        val tableRowPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 9.5f
            color = Color.parseColor("#1F2937")
        }

        val tableRowBoldPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 10f
            color = Color.parseColor("#111827")
        }

        val linePaint = Paint().apply {
            color = Color.parseColor("#E5E7EB")
            strokeWidth = 1f
        }

        val headerLinePaint = Paint().apply {
            color = Color.parseColor("#4A0E4E")
            strokeWidth = 2f
        }

        // Draw Top Bar Accent
        val accentPaint = Paint().apply { color = Color.parseColor("#4A0E4E") }
        canvas.drawRect(0f, 0f, 595f, 12f, accentPaint)

        // 1. Draw Header: Top-Right Address Info
        var rightY = 35f
        canvas.drawText("Aishwaryam @ Home Private Limited", 555f, rightY, companyDetailsPaint)
        rightY += 12f
        canvas.drawText("45, Palace Road, Vasanth Nagar,", 555f, rightY, companyDetailsPaint)
        rightY += 12f
        canvas.drawText("Chennai, Tamil Nadu - 600001", 555f, rightY, companyDetailsPaint)
        rightY += 12f
        canvas.drawText("Mobile: +91 94430 00000", 555f, rightY, companyDetailsPaint)
        rightY += 12f
        canvas.drawText("Email: support@aishwaryam.com", 555f, rightY, companyDetailsPaint)

        // 2. Draw Header: Center-Aligned Branding and Logo Icon
        // Draw elegant circular/star badge icon representation at the center
        val iconPaint = Paint().apply {
            color = Color.parseColor("#FFF8E1") // Gold light
            style = Paint.Style.FILL
        }
        val iconStrokePaint = Paint().apply {
            color = Color.parseColor("#FFB300") // Gold amber
            style = Paint.Style.STROKE
            strokeWidth = 1.5f
        }
        canvas.drawCircle(297.5f, 40f, 16f, iconPaint)
        canvas.drawCircle(297.5f, 40f, 16f, iconStrokePaint)
        canvas.drawText("A", 297.5f, 47f, logoTextPaint)

        canvas.drawText("AISHWARYAM @ YOUR HOME", 297.5f, 75f, brandTitlePaint)
        
        val receiptSubtitlePaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 10f
            color = Color.parseColor("#6D4C00")
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("Official Digital Gold Savings Investment Receipt", 297.5f, 90f, receiptSubtitlePaint)

        // Solid accent divider under header
        canvas.drawLine(40f, 110f, 555f, 110f, headerLinePaint)

        // 3. Purchase Details Section (From and Metadata Info)
        var yPos = 135f
        canvas.drawText("PURCHASE INFORMATION", 40f, yPos, subheaderPaint)
        
        yPos += 18f
        // Left Column (Customer details)
        canvas.drawText("Customer Name:", 40f, yPos, fieldLabelPaint)
        canvas.drawText(userName, 150f, yPos, fieldValuePaint)
        
        // Right Column (Receipt info)
        canvas.drawText("Receipt Date:", 340f, yPos, fieldLabelPaint)
        canvas.drawText(item.createdAt.take(19).replace("T", " "), 440f, yPos, fieldValuePaint)

        yPos += 16f
        canvas.drawText("Mobile Number:", 40f, yPos, fieldLabelPaint)
        canvas.drawText(userPhone.ifBlank { "N/A" }, 150f, yPos, fieldValuePaint)
        
        canvas.drawText("Transaction ID:", 340f, yPos, fieldLabelPaint)
        canvas.drawText(item.id.uppercase(), 440f, yPos, fieldValuePaint)

        yPos += 16f
        canvas.drawText("Plan / Scheme:", 40f, yPos, fieldLabelPaint)
        canvas.drawText(schemeName, 150f, yPos, fieldValuePaint)
        
        canvas.drawText("Razorpay ID:", 340f, yPos, fieldLabelPaint)
        canvas.drawText(item.razorpayPaymentId ?: "Direct Account", 440f, yPos, fieldValuePaint)

        yPos += 20f
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)

        // 4. Structured Payment & Gold Breakdown Table
        yPos += 20f
        canvas.drawText("INVESTMENT BREAKDOWN", 40f, yPos, subheaderPaint)

        yPos += 12f
        // Table Header Background
        val tableHeaderBg = Paint().apply {
            color = Color.parseColor("#4A0E4E")
        }
        canvas.drawRect(40f, yPos, 555f, yPos + 22f, tableHeaderBg)

        // Table Header Columns
        val textY = yPos + 15f
        canvas.drawText("Description", 48f, textY, tableHeaderPaint)
        
        val rightAlignTableHeader = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 9.5f
            color = Color.WHITE
            textAlign = Paint.Align.RIGHT
        }
        canvas.drawText("Rate / Gram", 280f, textY, rightAlignTableHeader)
        canvas.drawText("Gold Weight", 410f, textY, rightAlignTableHeader)
        canvas.drawText("Amount (INR)", 547f, textY, rightAlignTableHeader)

        yPos += 22f

        val rightAlignRow = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 9.5f
            color = Color.parseColor("#1F2937")
            textAlign = Paint.Align.RIGHT
        }
        val rightAlignRowBold = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 10f
            color = Color.parseColor("#111827")
            textAlign = Paint.Align.RIGHT
        }

        // Line 1: Monthly Installment (Base)
        yPos += 22f
        canvas.drawText("Gold Installment Amount (Base)", 48f, yPos, tableRowPaint)
        canvas.drawText(paiseToRupees(item.pricePerGmPaise) + "/g", 280f, yPos, rightAlignRow)
        canvas.drawText(mgToGrams(item.goldWeightMg) + " g", 410f, yPos, rightAlignRow)
        canvas.drawText(paiseToRupees(item.baseAmountPaise), 547f, yPos, rightAlignRow)

        // Line 2: GST (3%)
        yPos += 20f
        canvas.drawText("GST Charges (3%)", 48f, yPos, tableRowPaint)
        canvas.drawText("-", 280f, yPos, rightAlignRow)
        canvas.drawText("-", 410f, yPos, rightAlignRow)
        canvas.drawText(paiseToRupees(item.gstAmountPaise), 547f, yPos, rightAlignRow)

        // Line 3: Loyalty Bonus
        val hasLoyalty = item.bonusGoldMg > 0
        if (hasLoyalty) {
            yPos += 20f
            val bonusRowPaint = Paint().apply {
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
                textSize = 9.5f
                color = Color.parseColor("#10B981") // Premium Green
            }
            val bonusRowRightPaint = Paint().apply {
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
                textSize = 9.5f
                color = Color.parseColor("#10B981")
                textAlign = Paint.Align.RIGHT
            }
            canvas.drawText("Loyalty Bonus (${item.bonusPercentage}%)", 48f, yPos, bonusRowPaint)
            canvas.drawText("-", 280f, yPos, bonusRowRightPaint)
            canvas.drawText("+ " + mgToGrams(item.bonusGoldMg) + " g", 410f, yPos, bonusRowRightPaint)
            canvas.drawText(paiseToRupees(item.bonusAmountPaise), 547f, yPos, bonusRowRightPaint)
        }

        yPos += 15f
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)

        // Summary Rows
        yPos += 22f
        canvas.drawText("Total Amount Paid:", 48f, yPos, tableRowBoldPaint)
        canvas.drawText(paiseToRupees(item.amountPaise), 547f, yPos, rightAlignRowBold)

        yPos += 18f
        val totalGoldCredited = item.goldWeightMg + item.bonusGoldMg
        canvas.drawText("Total Gold Credited to Wallet:", 48f, yPos, tableRowBoldPaint)
        canvas.drawText(mgToGrams(totalGoldCredited) + " g", 410f, yPos, rightAlignRowBold)
        canvas.drawText("-", 547f, yPos, rightAlignRow)

        yPos += 24f
        val termsPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 8f
            color = Color.parseColor("#9CA3AF")
        }
        canvas.drawText("* Gold credited is subject to the terms and rules of the locked scheme plan.", 40f, yPos, termsPaint)

        // 5. Centered Footer & Compliance
        yPos = 790f
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)
        
        yPos += 18f
        val footerPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 8.5f
            color = Color.parseColor("#9CA3AF")
            textAlign = Paint.Align.CENTER
        }
        val footerSubPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
            textSize = 8f
            color = Color.parseColor("#9CA3AF")
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("Aishwaryam @ Home Private Limited • Secured 24K Gold Savings Portal", 297.5f, yPos, footerPaint)
        yPos += 12f
        canvas.drawText("This is an electronically generated receipt. No physical signature is required.", 297.5f, yPos, footerSubPaint)

        pdfDocument.finishPage(page)

        var fileUri: Uri? = null
        val fileName = "Aishwaryam_Receipt_${item.id.take(8)}.pdf"

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = context.contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { out ->
                        pdfDocument.writeTo(out)
                    }
                    fileUri = uri
                }
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = File(downloadsDir, fileName)
                FileOutputStream(file).use { out ->
                    pdfDocument.writeTo(out)
                }
                fileUri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
            }
            Toast.makeText(context, "Receipt PDF saved to Downloads", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "Failed to save PDF receipt: ${e.message}", Toast.LENGTH_LONG).show()
        } finally {
            pdfDocument.close()
        }

        if (shareImmediately && fileUri != null) {
            shareReceipt(context, fileUri, item, totalGoldCredited)
        }

        return fileUri
    }

    private fun shareReceipt(context: Context, fileUri: Uri, item: SchemeLedgerItem, totalGoldCredited: Long) {
        val shareText = """
            🏆 Aishwaryam Gold Savings Receipt 🏆
            
            Transaction Type: ${item.transactionType}
            Amount Paid: ${paiseToRupees(item.amountPaise)}
            Gold Credited: ${mgToGrams(totalGoldCredited)} g
            Gold Price Locked: ${paiseToRupees(item.pricePerGmPaise)} / g
            
            Saved securely in Aishwaryam @ your home.
        """.trimIndent()

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, fileUri)
            putExtra(Intent.EXTRA_TEXT, shareText)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        context.startActivity(Intent.createChooser(intent, "Share Receipt PDF via"))
    }

    fun generateAndShareSuccessReceipt(
        context: Context,
        transactionId: String,
        amountPaise: Long,
        baseAmountPaise: Long,
        gstAmountPaise: Long,
        goldWeightMg: Long,
        pricePerGmPaise: Long,
        bonusPercentage: Double,
        bonusAmountPaise: Long,
        bonusGoldMg: Long,
        totalGoldCreditedMg: Long,
        status: String,
        createdAt: String,
        razorpayPaymentId: String?,
        userName: String,
        userPhone: String,
        schemeName: String,
        shareImmediately: Boolean = false
    ): Uri? {
        val mockItem = SchemeLedgerItem(
            id = transactionId,
            userSchemeId = "",
            userId = "",
            transactionType = "BUY",
            installmentNumber = 0L,
            amountPaise = amountPaise,
            baseAmountPaise = baseAmountPaise,
            gstAmountPaise = gstAmountPaise,
            goldWeightMg = goldWeightMg,
            pricePerGmPaise = pricePerGmPaise,
            bonusPercentage = bonusPercentage,
            bonusAmountPaise = bonusAmountPaise,
            bonusGoldMg = bonusGoldMg,
            razorpayPaymentId = razorpayPaymentId,
            status = status,
            createdAt = createdAt
        )
        return generateAndShareReceipt(context, mockItem, userName, userPhone, schemeName, shareImmediately)
    }
}
