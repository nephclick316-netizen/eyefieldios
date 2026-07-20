package com.nephclick.eyefield.utils

import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import okio.source

actual suspend fun platformUploadPut(uploadUrl: String, bytes: ByteArray, contentType: String, progressCallback: ((Long, Long) -> Unit)?): Boolean {
    return try {
        val client = OkHttpClient.Builder().build()
        val total = bytes.size.toLong()
        val body = object : RequestBody() {
            override fun contentType() = contentType.toMediaTypeOrNull()
            override fun contentLength() = total
            override fun writeTo(sink: BufferedSink) {
                val buffer = bytes.inputStream().source()
                var read: Long
                var sent = 0L
                val buf = okio.Buffer()
                while (true) {
                    read = buffer.read(buf, 8 * 1024)
                    if (read <= 0) break
                    sink.write(buf, read)
                    sent += read
                    progressCallback?.invoke(sent, total)
                }
            }
        }

        val req = Request.Builder().url(uploadUrl).put(body).build()
        val resp = client.newCall(req).execute()
        resp.use { it.isSuccessful }
    } catch (t: Throwable) {
        android.util.Log.w("PlatformUploader", "upload failed: ${t.message}")
        false
    }
}
