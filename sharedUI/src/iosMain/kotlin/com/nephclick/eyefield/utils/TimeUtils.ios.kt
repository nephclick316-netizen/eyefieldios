package com.nephclick.eyefield.utils

import platform.Foundation.NSDate
import platform.Foundation.timeIntervalSince1970

actual fun getCurrentTimeMillis(): Long = (NSDate().timeIntervalSince1970 * 1000.0).toLong()
actual fun formatEpochToIsoDate(millis: Long): String { val date = platform.Foundation.NSDate(timeIntervalSinceReferenceDate = (millis / 1000.0) - 978307200.0); val formatter = platform.Foundation.NSDateFormatter(); formatter.dateFormat = "yyyy-MM-dd"; return formatter.stringFromDate(date) }
