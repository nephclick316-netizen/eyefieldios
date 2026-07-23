package com.nephclick.eyefield.utils

import com.nephclick.eyefield.Supabase
import io.github.jan.supabase.auth.auth
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.http.content.ByteArrayContent
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

object R2Uploader {
    private val httpClient = HttpClient()

    /**
     * Uploads a byte array to Cloudflare R2 using the Supabase Edge Function.
     * @param bytes The image byte array to upload.
     * @param fileNamePrefix The prefix for the file (e.g., "avatar", "banner", "product").
     * @return The public URL of the uploaded image.
     */
    suspend fun uploadImage(bytes: ByteArray, fileNamePrefix: String): String {
        return uploadMedia(bytes, fileNamePrefix, "image/jpeg", "jpg")
    }

    suspend fun uploadMedia(bytes: ByteArray, fileNamePrefix: String, mimeType: String, extension: String, progressCallback: ((sent: Long, total: Long) -> Unit)? = null): String {
        val session = Supabase.client.auth.currentSessionOrNull()
        val userId = session?.user?.id ?: throw Exception("Not logged in")

        // 1. Get Presigned URL
        val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.supabase.co/functions/v1/r2-presigned-url") {
            setBody(Json.parseToJsonElement("{\"fileName\":\"${fileNamePrefix}/${userId}_${com.nephclick.eyefield.utils.getCurrentTimeMillis()}.${extension}\", \"fileType\":\"${mimeType}\"}").toString())
            header(HttpHeaders.ContentType, ContentType.Application.Json)
            header(HttpHeaders.Authorization, "Bearer ${session.accessToken}")
        }

        val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
        val uploadUrl = json["url"]?.jsonPrimitive?.content
        val publicUrl = json["publicUrl"]?.jsonPrimitive?.content

        if (uploadUrl != null && publicUrl != null) {
            // 2. Upload to Cloudflare R2 using platform-specific PUT (may report progress)
            val ok = platformUploadPut(uploadUrl, bytes, mimeType, progressCallback)
            if (ok) return publicUrl
            else throw Exception("Upload failed: platform PUT returned false")
        } else {
            throw Exception("Failed to get presigned URL: ${response.bodyAsText()}")
        }
    }
}
