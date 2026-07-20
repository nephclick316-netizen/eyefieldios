package com.nephclick.eyefield.utils

import java.util.prefs.Preferences

actual class LanguageSettings(context: Any?) {
    private val prefs = Preferences.userNodeForPackage(LanguageSettings::class.java)

    actual fun saveLanguage(lang: String) { prefs.put("app_lang", lang) }
    actual fun getLanguage(): String = prefs.get("app_lang", "en")
}