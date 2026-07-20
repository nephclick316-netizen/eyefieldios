package com.nephclick.eyefield.utils

import platform.Foundation.NSUserDefaults

actual object PersistentCache {
    actual fun saveString(key: String, value: String) {
        NSUserDefaults.standardUserDefaults.setObject(value, forKey = key)
    }

    actual fun getString(key: String): String? {
        return NSUserDefaults.standardUserDefaults.stringForKey(key)
    }
}