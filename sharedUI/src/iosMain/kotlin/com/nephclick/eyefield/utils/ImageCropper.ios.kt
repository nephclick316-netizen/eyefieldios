package com.nephclick.eyefield.utils

actual fun cropImage(
    imageBytes: ByteArray,
    offsetX: Float,
    offsetY: Float,
    scale: Float,
    viewportSize: Int
): ByteArray? {
    // Stub for iOS - currently not implemented.
    // To support iOS, we'd need to use CoreGraphics/UIImage to crop the image bytes.
    return imageBytes
}

actual fun byteArrayToImageBitmap(bytes: ByteArray): androidx.compose.ui.graphics.ImageBitmap? {
    return null
}
