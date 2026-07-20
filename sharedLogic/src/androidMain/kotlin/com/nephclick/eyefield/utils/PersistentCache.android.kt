package com.nephclick.eyefield.utils

import android.content.Context
import java.io.File

actual object PersistentCache {
    private val prefs by lazy {
        val ctx = try { java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication").invoke(null) as? Context } catch (_: Exception) { null }
        ctx?.getSharedPreferences("eyefield_cache", Context.MODE_PRIVATE)
    }

    actual fun saveString(key: String, value: String) {
        prefs?.edit()?.putString(key, value)?.apply()
    }

    actual fun getString(key: String): String? {
        return prefs?.getString(key, null)
    }
}