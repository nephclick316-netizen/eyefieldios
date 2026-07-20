package com.nephclick.eyefield.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap

private fun decodeAndRotateBitmap(bytes: ByteArray): Bitmap? {
    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
    return try {
        val inputStream = ByteArrayInputStream(bytes)
        val exif = ExifInterface(inputStream)
        val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
                matrix.postRotate(180f)
                matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.postRotate(90f)
                matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.postRotate(-90f)
                matrix.postScale(-1f, 1f)
            }
        }
        if (!matrix.isIdentity) {
            val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            if (rotated != bitmap) {
                bitmap.recycle()
            }
            rotated
        } else {
            bitmap
        }
    } catch (e: Exception) {
        bitmap
    }
}

actual fun byteArrayToImageBitmap(bytes: ByteArray): ImageBitmap? {
    return try {
        decodeAndRotateBitmap(bytes)?.asImageBitmap()
    } catch (e: Exception) {
        null
    }
}

actual fun cropImage(
    imageBytes: ByteArray,
    offsetX: Float,
    offsetY: Float,
    scale: Float,
    viewportSize: Int
): ByteArray? {
    try {
        val originalBitmap = decodeAndRotateBitmap(imageBytes) ?: return null

        val w = originalBitmap.width.toFloat()
        val h = originalBitmap.height.toFloat()
        val v = viewportSize.toFloat()

        // Calculate initial scale to fill the viewport (ContentScale.Crop equivalent)
        val s0 = max(v / w, v / h)
        val s = s0 * scale

        val ws = w * s
        val hs = h * s

        val xImg = (v - ws) / 2f + offsetX
        val yImg = (v - hs) / 2f + offsetY

        var cropX = (-xImg) / s
        var cropY = (-yImg) / s
        var cropSizeOriginal = v / s

        // Clamp to prevent out of bounds exceptions
        if (cropX < 0) cropX = 0f
        if (cropY < 0) cropY = 0f
        if (cropX + cropSizeOriginal > w) cropSizeOriginal = w - cropX
        if (cropY + cropSizeOriginal > h) cropSizeOriginal = h - cropY

        val croppedBitmap = Bitmap.createBitmap(
            originalBitmap,
            cropX.toInt(),
            cropY.toInt(),
            cropSizeOriginal.toInt(),
            cropSizeOriginal.toInt()
        )

        // Scale down to a reasonable size for avatars (e.g., 512x512)
        val finalBitmap = Bitmap.createScaledBitmap(croppedBitmap, 512, 512, true)

        val outputStream = ByteArrayOutputStream()
        finalBitmap.compress(Bitmap.CompressFormat.JPEG, 85, outputStream)
        
        // Clean up memory
        if (originalBitmap != finalBitmap) originalBitmap.recycle()
        if (croppedBitmap != finalBitmap) croppedBitmap.recycle()
        
        return outputStream.toByteArray()
    } catch (e: Exception) {
        e.printStackTrace()
        return null
    }
}
