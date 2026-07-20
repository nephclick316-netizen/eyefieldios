package com.nephclick.eyefield.utils

import android.content.Context
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import java.util.Locale

actual class LanguageSettings actual constructor(context: Any?) {
    private val prefs = (context as? Context)?.getSharedPreferences("lang_prefs", Context.MODE_PRIVATE)

    actual fun saveLanguage(lang: String) {
        prefs?.edit()?.putString("app_lang", lang)?.apply()
        applyLocale(lang)
    }

    actual fun getLanguage(): String = prefs?.getString("app_lang", null) ?: "en"

    private fun applyLocale(lang: String) {
        val locale = Locale.forLanguageTag(if (lang == "fr") "fr" else "en")
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(locale.toLanguageTag()))
        } else {
            @Suppress("DEPRECATION")
            val config = Configuration().apply { setLocale(locale) }
            @Suppress("DEPRECATION")
            val ctx = try {
                java.lang.Class.forName("android.app.ActivityThread")
                    .getMethod("currentApplication")
                    .invoke(null) as? Context
            } catch (_: Exception) { null }
            ctx?.resources?.updateConfiguration(config, ctx.resources.displayMetrics)
        }
    }
}
