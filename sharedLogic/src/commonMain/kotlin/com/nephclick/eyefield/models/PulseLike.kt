package com.nephclick.eyefield.models

import kotlinx.serialization.Serializable

@Serializable
data class PulseLike(
    val id: String = "",
    val pulseId: String,
    val userId: String,
    val createdAt: String? = null
)
