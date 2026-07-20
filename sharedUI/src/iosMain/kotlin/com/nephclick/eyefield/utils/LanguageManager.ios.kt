package com.nephclick.eyefield.utils

import platform.Foundation.NSUserDefaults

actual class LanguageSettings(context: Any?) {
    private val defaults = NSUserDefaults.standardUserDefaults

    actual fun saveLanguage(lang: String) {
        defaults.setObject(lang, forKey = "app_lang")
        defaults.synchronize()
        // Force system-level override — AppleLanguages must be array of strings
        defaults.setObject(listOf(if (lang == "fr") "fr" else "en"), forKey = "AppleLanguages")
        defaults.synchronize()
    }

    actual fun getLanguage(): String =
        defaults.stringForKey("app_lang") ?: "en"
}