package com.nephclick.eyefield.utils

import android.content.Context
import android.content.Intent
import android.net.Uri

actual fun openCallSettings(context: Any?) {
    val ctx = context as? Context ?: return
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("eyefield://settings"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(intent)
    } catch (_: Throwable) {
        // fallback to app settings
        val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", ctx.packageName, null)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        ctx.startActivity(intent)
    }
}
