package com.nephclick.eyefield.utils

import android.content.Context
import android.content.Intent

actual fun shareText(context: Any?, text: String) {
    val androidContext = context as? Context ?: return
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    androidContext.startActivity(Intent.createChooser(intent, "Share via"))
}

actual fun openAppSettings(context: Any?) {
    val androidContext = context as? Context ?: return
    val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = android.net.Uri.fromParts("package", androidContext.packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    androidContext.startActivity(intent)
}
