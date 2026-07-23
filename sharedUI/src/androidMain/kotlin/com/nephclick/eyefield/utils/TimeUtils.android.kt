package com.nephclick.eyefield.utils

actual fun getCurrentTimeMillis(): Long = System.currentTimeMillis()
actual fun formatEpochToIsoDate(millis: Long): String = java.time.Instant.ofEpochMilli(millis).atZone(java.time.ZoneId.systemDefault()).toLocalDate().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE)
