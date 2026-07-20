package com.nephclick.eyefield.utils

import platform.UIKit.UIActivityViewController
import platform.UIKit.UIApplication

actual fun shareText(context: Any?, text: String) {
    val window = UIApplication.sharedApplication.keyWindow
    val rootViewController = window?.rootViewController
    
    if (rootViewController != null) {
        val activityViewController = UIActivityViewController(activityItems = listOf(text), applicationActivities = null)
        rootViewController.presentViewController(activityViewController, animated = true, completion = null)
    }
}
