package com.nephclick.eyefield.utils

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

actual fun openCallSettings(context: Any?) {}

actual fun openAppSettings(context: Any?) {}

@Composable
actual fun rememberCameraLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberGalleryLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberMediaGalleryLauncher(onMediaPicked: (ByteArray?, String?) -> Unit): () -> Unit = { {} }

actual fun compressImage(bytes: ByteArray, maxWidth: Int, maxHeight: Int, quality: Int): ByteArray = bytes

@Composable
actual fun rememberVideoCameraLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberVideoGalleryLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberDocumentPickerLauncher(onDocumentPicked: (ByteArray?, String?, String?) -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberAudioPermissionLauncher(onGranted: () -> Unit, onDenied: () -> Unit): () -> Unit = { {} }

@Composable
actual fun rememberOpenDocumentWithChooser(): (String, String) -> Unit = { _, _ -> }

actual class AudioRecorder actual constructor() {
    actual fun startRecording() {}
    actual fun stopRecording(onResult: (ByteArray?) -> Unit) { onResult(null) }
}

actual class AudioPlayer actual constructor() {
    actual fun play(url: String, isRingtone: Boolean) {}
    actual fun pause() {}
    actual fun resume() {}
    actual fun setSpeed(speed: Float) {}
    actual fun stop() {}
}

actual suspend fun platformUploadPut(uploadUrl: String, bytes: ByteArray, contentType: String, progressCallback: ((Long, Long) -> Unit)?): Boolean = false

@Composable
actual fun VideoPlayer(
    url: String,
    modifier: Modifier,
    autoPlay: Boolean,
    onClick: (() -> Unit)?
) {}

actual suspend fun trimVideo(inputBytes: ByteArray, startTimeSeconds: Float, endTimeSeconds: Float): ByteArray? = null
