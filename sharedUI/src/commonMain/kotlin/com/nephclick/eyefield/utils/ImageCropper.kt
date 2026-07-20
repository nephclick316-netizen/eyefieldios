package com.nephclick.eyefield.utils

/**
 * Crops a byte array image based on UI pan and zoom metrics.
 * @param imageBytes The original image in bytes.
 * @param offsetX The X pan offset from the center.
 * @param offsetY The Y pan offset from the center.
 * @param scale The zoom scale applied to the image.
 * @param cropSize The dimension of the square crop area (e.g., 300px for a 300x300 square).
 * @param viewportSize The size of the UI viewport (to calculate relative scale/offset).
 */
expect fun cropImage(
    imageBytes: ByteArray,
    offsetX: Float,
    offsetY: Float,
    scale: Float,
    viewportSize: Int
): ByteArray?

expect fun byteArrayToImageBitmap(bytes: ByteArray): androidx.compose.ui.graphics.ImageBitmap?
