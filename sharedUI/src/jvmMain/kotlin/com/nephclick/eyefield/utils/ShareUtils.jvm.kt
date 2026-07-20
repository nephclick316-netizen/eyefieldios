package com.nephclick.eyefield.utils

import java.awt.Toolkit
import java.awt.datatransfer.StringSelection

actual fun shareText(context: Any?, text: String) {
    // Basic JVM implementation: copy to clipboard
    try {
        val stringSelection = StringSelection(text)
        val clipboard = Toolkit.getDefaultToolkit().systemClipboard
        clipboard.setContents(stringSelection, null)
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
