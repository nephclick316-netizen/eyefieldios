package com.nephclick.eyefield.utils

import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive

object OpenRouterService {
    private val client = HttpClient()
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun getChatResponse(prompt: String, apiKey: String): String {
        return try {
            val requestBody = buildJsonObject {
                put("model", "google/gemini-pro") // A solid default free model on OpenRouter
                putJsonArray("messages") {
                    add(buildJsonObject {
                        put("role", "system")
                        put("content", "You are Endocard, a helpful AI shopping and product assistant for the EyeField/Cascadea app. Keep your answers brief, friendly, and helpful.")
                    })
                    add(buildJsonObject {
                        put("role", "user")
                        put("content", prompt)
                    })
                }
            }

            val response = client.post("https://openrouter.ai/api/v1/chat/completions") {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer $apiKey")
                header("HTTP-Referer", "https://eyefield.pro") // Required by OpenRouter
                header("X-Title", "EyeField") // Required by OpenRouter
                setBody(requestBody.toString())
            }

            val responseText = response.bodyAsText()
            val jsonObject = json.parseToJsonElement(responseText).jsonObject
            val choices = jsonObject["choices"]?.jsonArray
            val firstChoice = choices?.firstOrNull()?.jsonObject
            val message = firstChoice?.get("message")?.jsonObject
            message?.get("content")?.jsonPrimitive?.content ?: "I'm sorry, I couldn't understand that."
        } catch (e: Exception) {
            "Error: ${e.message}"
        }
    }
}
