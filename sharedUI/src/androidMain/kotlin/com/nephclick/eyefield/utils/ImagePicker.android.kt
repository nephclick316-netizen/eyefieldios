package com.nephclick.eyefield.utils

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import java.io.ByteArrayOutputStream
import java.io.File

@Composable
actual fun rememberGalleryLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            onImagePicked(bytes)
        } else {
            onImagePicked(null)
        }
    }
    return remember { { launcher.launch("image/*") } }
}

@Composable
actual fun rememberMediaGalleryLauncher(onMediaPicked: (ByteArray?, String?) -> Unit): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            val type = context.contentResolver.getType(uri) ?: ""
            val ext = if (type.startsWith("video/")) "mp4" else "jpg"
            onMediaPicked(bytes, ext)
        } else {
            onMediaPicked(null, null)
        }
    }
    return remember { { launcher.launch("*/*") } }
}

@Composable
actual fun rememberCameraLauncher(onImagePicked: (ByteArray?) -> Unit): () -> Unit {
    val context = LocalContext.current
    var currentPhotoUri by remember { mutableStateOf<Uri?>(null) }
    
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success && currentPhotoUri != null) {
            val bytes = context.contentResolver.openInputStream(currentPhotoUri!!)?.use { it.readBytes() }
            onImagePicked(bytes)
        } else {
            onImagePicked(null)
        }
    }

    return remember {
        {
            val imagesDir = File(context.cacheDir, "camera_images")
            imagesDir.mkdirs()
            val tempFile = File.createTempFile("camera_", ".jpg", imagesDir)
            val uri = FileProvider.getUriForFile(context, "com.nephclick.eyefield.fileprovider", tempFile)
            currentPhotoUri = uri
            launcher.launch(uri)
        }
    }
}

actual fun compressImage(bytes: ByteArray, maxWidth: Int, maxHeight: Int, quality: Int): ByteArray {
    val options = BitmapFactory.Options()
    options.inJustDecodeBounds = true
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)

    var inSampleSize = 1
    if (options.outHeight > maxHeight || options.outWidth > maxWidth) {
        val halfHeight: Int = options.outHeight / 2
        val halfWidth: Int = options.outWidth / 2
        while (halfHeight / inSampleSize >= maxHeight && halfWidth / inSampleSize >= maxWidth) {
            inSampleSize *= 2
        }
    }

    options.inJustDecodeBounds = false
    options.inSampleSize = inSampleSize

    val decodedBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
        ?: return bytes // If decoding fails, return original bytes

    val outputStream = ByteArrayOutputStream()
    decodedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
    val compressedBytes = outputStream.toByteArray()
    decodedBitmap.recycle()
    return compressedBytes
}

@Composable
actual fun rememberVideoGalleryLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            onVideoPicked(bytes, "mp4")
        } else {
            onVideoPicked(null, null)
        }
    }
    return remember { { launcher.launch("video/*") } }
}

@Composable
actual fun rememberVideoCameraLauncher(onVideoPicked: (ByteArray?, String?) -> Unit): () -> Unit {
    val context = LocalContext.current
    var currentVideoUri by remember { mutableStateOf<Uri?>(null) }
    
    val contract = object : androidx.activity.result.contract.ActivityResultContract<Uri, Boolean>() {
        override fun createIntent(context: android.content.Context, input: Uri): android.content.Intent {
            return android.content.Intent(android.provider.MediaStore.ACTION_VIDEO_CAPTURE)
                .putExtra(android.provider.MediaStore.EXTRA_OUTPUT, input)
                .putExtra(android.provider.MediaStore.EXTRA_DURATION_LIMIT, 30)
                .putExtra(android.provider.MediaStore.EXTRA_VIDEO_QUALITY, 0)
        }
        override fun parseResult(resultCode: Int, intent: android.content.Intent?): Boolean {
            return resultCode == android.app.Activity.RESULT_OK
        }
    }

    val launcher = rememberLauncherForActivityResult(contract) { success ->
        if (success && currentVideoUri != null) {
            val bytes = context.contentResolver.openInputStream(currentVideoUri!!)?.use { it.readBytes() }
            onVideoPicked(bytes, "mp4")
        } else {
            onVideoPicked(null, null)
        }
    }

    return remember {
        {
            val videosDir = File(context.cacheDir, "camera_videos")
            videosDir.mkdirs()
            val tempFile = File.createTempFile("camera_", ".mp4", videosDir)
            val uri = FileProvider.getUriForFile(context, "com.nephclick.eyefield.fileprovider", tempFile)
            currentVideoUri = uri
            launcher.launch(uri)
        }
    }
}

@Composable
actual fun rememberDocumentPickerLauncher(onDocumentPicked: (ByteArray?, String?, String?) -> Unit): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            // Basic extension resolution, ideally you'd use ContentResolver to get mime type and extension
            val type = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val ext = if (type.contains("pdf")) "pdf" else if (type.contains("doc")) "docx" else "bin"
            onDocumentPicked(bytes, type, ext)
        } else {
            onDocumentPicked(null, null, null)
        }
    }
    return remember { { launcher.launch("*/*") } }
}

actual class AudioRecorder actual constructor() {
    private var recorder: android.media.MediaRecorder? = null
    private var outputFile: File? = null

    actual fun startRecording() {
        try {
            val cacheDir = File(System.getProperty("java.io.tmpdir"))
            outputFile = File.createTempFile("audio_record_", ".mp3", cacheDir)
            recorder = android.media.MediaRecorder().apply {
                setAudioSource(android.media.MediaRecorder.AudioSource.MIC)
                setOutputFormat(android.media.MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(android.media.MediaRecorder.AudioEncoder.AAC)
                setOutputFile(outputFile?.absolutePath)
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    actual fun stopRecording(onResult: (ByteArray?) -> Unit) {
        try {
            recorder?.apply {
                stop()
                release()
            }
            recorder = null
            if (outputFile != null && outputFile!!.exists()) {
                onResult(outputFile!!.readBytes())
                outputFile!!.delete()
            } else {
                onResult(null)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            onResult(null)
        }
    }
}

@Composable
actual fun rememberAudioPermissionLauncher(onGranted: () -> Unit, onDenied: () -> Unit): () -> Unit {
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
        if (isGranted) {
            onGranted()
        } else {
            onDenied()
        }
    }
    return remember { { launcher.launch(android.Manifest.permission.RECORD_AUDIO) } }
}

@Composable
actual fun rememberOpenDocumentWithChooser(): (String, String) -> Unit {
    val context = LocalContext.current
    return remember {
        { url, ext ->
            try {
                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW)
                val uri = android.net.Uri.parse(url)
                val mimeType = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.lowercase()) ?: "*/*"
                intent.setDataAndType(uri, mimeType)
                intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                
                val chooser = android.content.Intent.createChooser(intent, "Open with")
                context.startActivity(chooser)
            } catch (e: Exception) {
                e.printStackTrace()
                // Fallback to browser if no app can handle it
                val browserIntent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                context.startActivity(browserIntent)
            }
        }
    }
}

actual class AudioPlayer actual constructor() {
    private var mediaPlayer: android.media.MediaPlayer? = null

    actual fun play(url: String, isRingtone: Boolean) {
        try {
            stop()
            mediaPlayer = android.media.MediaPlayer().apply {
                val usage = if (isRingtone) {
                    android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE
                } else {
                    android.media.AudioAttributes.USAGE_MEDIA
                }
                val contentType = if (isRingtone) {
                    android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION
                } else {
                    android.media.AudioAttributes.CONTENT_TYPE_MUSIC
                }
                setAudioAttributes(
                    android.media.AudioAttributes.Builder()
                        .setContentType(contentType)
                        .setUsage(usage)
                        .build()
                )
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    setDataSource(url)
                } else {
                    val context = try {
                        java.lang.Class.forName("android.app.ActivityThread")
                            .getMethod("currentApplication")
                            .invoke(null) as? android.content.Context
                    } catch (e: Exception) {
                        null
                    }
                    if (context != null) {
                        val assetPath = "composeResources/eyefield.sharedui.generated.resources/files/$url"
                        try {
                            val afd = context.assets.openFd(assetPath)
                            setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                            afd.close()
                        } catch (e: Exception) {
                            // Fallback to copying to temp file
                            val tempFile = java.io.File(context.cacheDir, url)
                            context.assets.open(assetPath).use { input ->
                                java.io.FileOutputStream(tempFile).use { output ->
                                    input.copyTo(output)
                                }
                            }
                            setDataSource(tempFile.absolutePath)
                        }
                    } else {
                        setDataSource(url)
                    }
                }
                prepareAsync()
                setOnPreparedListener { 
                    it.isLooping = true
                    start() 
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    actual fun pause() {
        mediaPlayer?.takeIf { it.isPlaying }?.pause()
    }

    actual fun resume() {
        mediaPlayer?.start()
    }

    actual fun stop() {
        try {
            mediaPlayer?.apply {
                if (isPlaying) stop()
                release()
            }
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    actual fun setSpeed(speed: Float) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            try {
                mediaPlayer?.let {
                    if (it.isPlaying) {
                        val params = it.playbackParams
                        params.speed = speed
                        it.playbackParams = params
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
