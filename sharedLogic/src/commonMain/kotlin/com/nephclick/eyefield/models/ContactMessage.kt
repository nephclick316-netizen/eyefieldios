package com.nephclick.eyefield.models

import kotlinx.serialization.Serializable

@Serializable
data class ContactMessage(
    val id: String = "",
    val email: String,
    val message: String,
    val created_at: String = ""
)