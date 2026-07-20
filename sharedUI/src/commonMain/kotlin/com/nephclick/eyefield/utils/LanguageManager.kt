package com.nephclick.eyefield.utils

/** Platform-specific persistence for the chosen language (en/fr). */
expect class LanguageSettings(context: Any?) {
    fun saveLanguage(lang: String)
    fun getLanguage(): String
}

/**
 * Returns "en" unless [systemLanguage] starts with "en" or "fr".
 * The in-app switch uses [LanguageSettings] to override the system value.
 */
fun getInitialLanguage(systemLanguage: String): String = when {
    systemLangStartsWith(systemLanguage, "fr") -> "fr"
    systemLangStartsWith(systemLanguage, "en") -> "en"
    else -> "en"
}

private fun systemLangStartsWith(s: String, prefix: String) = s.lowercase().take(2) == prefix