package com.nephclick.eyefield.utils

expect suspend fun trimVideo(inputBytes: ByteArray, startTimeSeconds: Float, endTimeSeconds: Float): ByteArray?
