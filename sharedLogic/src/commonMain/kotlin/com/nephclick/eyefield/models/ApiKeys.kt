package com.nephclick.eyefield.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ApiKeys(
    val id: Int = 1,
    @SerialName("openrouter_key")
    val openrouterKey: String? = null,
    @SerialName("google_api_key")
    val googleApiKey: String? = null
)
