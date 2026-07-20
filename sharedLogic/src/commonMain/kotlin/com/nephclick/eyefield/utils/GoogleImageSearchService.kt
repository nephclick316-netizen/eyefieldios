package com.nephclick.eyefield.utils

import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.json.*

object GoogleImageSearchService {
    private val client = HttpClient()
    private val json = Json { ignoreUnknownKeys = true }

    val OPENROUTER_API_KEY = "REDACTED_API_KEY"
    val GEMINI_API_KEY = "REDACTED_API_KEY"

    suspend fun analyzeImage(base64Image: String, ignoredKey: String = ""): List<String> {
        // Try OpenRouter First
        try {
            val requestBody = buildJsonObject {
                put("model", "openrouter/free")
                putJsonArray("messages") {
                    add(buildJsonObject {
                        put("role", "user")
                        putJsonArray("content") {
                            add(buildJsonObject {
                                put("type", "text")
                                put("text", "Describe what object is mainly in this image in one or two words. Return only the object name.")
                            })
                            add(buildJsonObject {
                                put("type", "image_url")
                                put("image_url", buildJsonObject {
                                    put("url", "data:image/jpeg;base64,$base64Image")
                                })
                            })
                        }
                    })
                }
            }
            
            val response = client.post("https://openrouter.ai/api/v1/chat/completions") {
                header("Authorization", "Bearer $OPENROUTER_API_KEY")
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }
            val text = response.bodyAsText()
            val parsed = json.parseToJsonElement(text).jsonObject
            val reply = parsed["choices"]?.jsonArray?.firstOrNull()?.jsonObject?.get("message")?.jsonObject?.get("content")?.jsonPrimitive?.content
            if (!reply.isNullOrBlank() && !reply.contains("error", ignoreCase=true) && !reply.contains("sorry", ignoreCase=true) && !reply.contains("cannot", ignoreCase=true)) {
                return listOf(reply.trim())
            }
        } catch (e: Exception) {
            println("OpenRouter vision failed: ${e.message}")
        }

        // Fallback to Gemini 1.5 Flash Vision
        try {
            val requestBody = buildJsonObject {
                putJsonArray("contents") {
                    add(buildJsonObject {
                        putJsonArray("parts") {
                            add(buildJsonObject {
                                put("text", "Describe what object is mainly in this image in one or two words. Return only the object name.")
                            })
                            add(buildJsonObject {
                                put("inlineData", buildJsonObject {
                                    put("mimeType", "image/jpeg")
                                    put("data", base64Image)
                                })
                            })
                        }
                    })
                }
            }
            val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY") {
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }
            val text = response.bodyAsText()
            val parsed = json.parseToJsonElement(text).jsonObject
            val candidates = parsed["candidates"]?.jsonArray
            val reply = candidates?.firstOrNull()?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.firstOrNull()?.jsonObject?.get("text")?.jsonPrimitive?.content
            if (!reply.isNullOrBlank()) {
                return listOf(reply.trim())
            }
        } catch (e: Exception) {
            println("Gemini vision failed: ${e.message}")
        }

        return emptyList()
    }
    
    suspend fun chat(message: String): String {
        // Try OpenRouter First
        try {
            val requestBody = buildJsonObject {
                put("model", "openrouter/free")
                putJsonArray("messages") {
                    add(buildJsonObject {
                        put("role", "user")
                        put("content", message)
                    })
                }
            }
            val response = client.post("https://openrouter.ai/api/v1/chat/completions") {
                header("Authorization", "Bearer $OPENROUTER_API_KEY")
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }
            val text = response.bodyAsText()
            val parsed = json.parseToJsonElement(text).jsonObject
            val reply = parsed["choices"]?.jsonArray?.firstOrNull()?.jsonObject?.get("message")?.jsonObject?.get("content")?.jsonPrimitive?.content
            if (!reply.isNullOrBlank() && !reply.contains("error", ignoreCase=true)) {
                return reply.trim()
            }
        } catch (e: Exception) {
            println("OpenRouter chat failed: ${e.message}")
        }

        // Fallback to Gemini 1.5 Flash
        try {
            val requestBody = buildJsonObject {
                putJsonArray("contents") {
                    add(buildJsonObject {
                        putJsonArray("parts") {
                            add(buildJsonObject {
                                put("text", message)
                            })
                        }
                    })
                }
            }
            val response = client.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY") {
                contentType(ContentType.Application.Json)
                setBody(requestBody.toString())
            }
            val text = response.bodyAsText()
            val parsed = json.parseToJsonElement(text).jsonObject
            val candidates = parsed["candidates"]?.jsonArray
            val reply = candidates?.firstOrNull()?.jsonObject?.get("content")?.jsonObject?.get("parts")?.jsonArray?.firstOrNull()?.jsonObject?.get("text")?.jsonPrimitive?.content
            if (!reply.isNullOrBlank()) {
                return reply.trim()
            }
        } catch (e: Exception) {
            println("Gemini chat failed: ${e.message}")
        }

        return "I am unable to respond at this time."
    }
}
