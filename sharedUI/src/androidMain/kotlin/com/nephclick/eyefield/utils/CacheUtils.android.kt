package com.nephclick.eyefield.utils

import android.content.Context

actual fun getAppCacheDir(): String {
    val ctx = try { java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication").invoke(null) as? Context } catch (_: Exception) { null }
    return ctx?.cacheDir?.absolutePath ?: ""
}