package com.example.aishwaryam_android.utils

import android.content.ContentValues
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import com.example.aishwaryam_android.network.TransactionItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.text.NumberFormat
import java.util.Locale

object ReceiptGenerator {

    suspend fun generateAndSaveReceipt(context: Context, tx: TransactionItem) {
        withContext(Dispatchers.IO) {
            val pdfDocument = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(400, 600, 1).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas: Canvas = page.canvas

            val paint = Paint()
            paint.color = Color.BLACK
            paint.isAntiAlias = true

            // Company Title
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 24f
            paint.textAlign = Paint.Align.CENTER
            canvas.drawText("\"Aishwayam @ Your Home\" | Aishwaryam", 200f, 80f, paint)
            
            // Subtitle
            paint.textSize = 16f
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            paint.color = Color.DKGRAY
            canvas.drawText("Official Transaction Receipt", 200f, 110f, paint)

            paint.color = Color.BLACK
            paint.textAlign = Paint.Align.LEFT
            paint.textSize = 14f

            var yPos = 180f
            val xPosLeft = 40f
            val xPosRight = 360f
            val lineSpacing = 40f

            fun drawRow(label: String, value: String) {
                paint.textAlign = Paint.Align.LEFT
                paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
                paint.color = Color.GRAY
                canvas.drawText(label, xPosLeft, yPos, paint)
                
                paint.textAlign = Paint.Align.RIGHT
                paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                paint.color = Color.BLACK
                canvas.drawText(value, xPosRight, yPos, paint)
                yPos += lineSpacing
            }

            val formatter = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
            val formattedAmount = formatter.format(tx.amountPaise / 100.0)
            val typeStr = if (tx.type.equals("BUY", true)) "Digital Gold Purchase" else "Digital Gold Sale"

            drawRow("Transaction ID", tx.transactionId.take(12).uppercase())
            drawRow("Date & Time", tx.createdAt.replace("T", " ").take(19))
            drawRow("Transaction Type", typeStr)
            drawRow("Gold Weight", "${tx.goldWeightMg} mg")
            
            yPos += 10f
            paint.strokeWidth = 1f
            paint.color = Color.LTGRAY
            canvas.drawLine(xPosLeft, yPos, xPosRight, yPos, paint)
            yPos += 40f
            
            paint.textAlign = Paint.Align.LEFT
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.color = Color.BLACK
            paint.textSize = 16f
            canvas.drawText("Total Amount", xPosLeft, yPos, paint)
            
            paint.textAlign = Paint.Align.RIGHT
            paint.color = if (tx.type.equals("BUY", true)) 0xFFC62828.toInt() else 0xFF2E7D32.toInt()
            canvas.drawText(formattedAmount, xPosRight, yPos, paint)

            pdfDocument.finishPage(page)

            val fileName = "Aishwaryam_Receipt_${tx.transactionId.take(8).uppercase()}.pdf"

            try {
                var outputStream: OutputStream? = null

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val resolver = context.contentResolver
                    val contentValues = ContentValues().apply {
                        put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                        put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                        put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                    if (uri != null) {
                        outputStream = resolver.openOutputStream(uri)
                    }
                } else {
                    val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                    val file = File(downloadDir, fileName)
                    outputStream = FileOutputStream(file)
                }

                outputStream?.use {
                    pdfDocument.writeTo(it)
                }

                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Receipt saved to Downloads", Toast.LENGTH_LONG).show()
                }

            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(context, "Failed to save receipt: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } finally {
                pdfDocument.close()
            }
        }
    }
}
