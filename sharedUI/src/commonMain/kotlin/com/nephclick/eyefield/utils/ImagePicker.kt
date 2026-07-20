package com.nephclick.eyefield.utils

import androidx.compose.runtime.Composable

@Composable
expect fun rememberCameraLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit

@Composable
expect fun rememberGalleryLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit

@Composable
expect fun rememberMediaGalleryLauncher(onMediaPicked: (ByteArray?, String?) -> Unit): () -> Unit

expect fun compressImage(bytes: ByteArray, maxWidth: Int = 1024, maxHeight: Int = 1024, quality: Int = 60): ByteArray

@Composable
expect fun rememberVideoCameraLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit

@Composable
expect fun rememberVideoGalleryLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit

@Composable
expect fun rememberDocumentPickerLauncher(onDocumentPicked: (ByteArray?, String?, String?) -> Unit): () -> Unit

@Composable
expect fun rememberAudioPermissionLauncher(onGranted: () -> Unit, onDenied: () -> Unit): () -> Unit

@Composable
expect fun rememberOpenDocumentWithChooser(): (String, String) -> Unit

expect class AudioRecorder() {
    fun startRecording()
    fun stopRecording(onResult: (ByteArray?) -> Unit)
}

expect class AudioPlayer() {
    fun play(url: String, isRingtone: Boolean = false)
    fun pause()
    fun resume()
    fun stop()
    fun setSpeed(speed: Float)
}
