package com.nephclick.eyefield.utils

expect object PersistentCache {
    fun saveString(key: String, value: String)
    fun getString(key: String): String?
}