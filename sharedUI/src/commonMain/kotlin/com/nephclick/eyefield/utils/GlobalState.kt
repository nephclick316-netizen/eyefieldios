package com.nephclick.eyefield.utils

import androidx.compose.runtime.mutableStateOf

object GlobalState {
    var currentUser = mutableStateOf<com.nephclick.eyefield.models.Profile?>(null)
    var isDarkMode = mutableStateOf<Boolean?>(null)
    var hiddenProductIds = mutableStateOf<Set<String>>(emptySet())
    var hiddenPostIds = mutableStateOf<Set<String>>(emptySet())
}
