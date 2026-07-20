package com.nephclick.eyefield.utils

/**
 * Platform-specific PUT implementation that uploads bytes to a presigned URL.
 * Implementations should return true on success and false on failure.
 * progressCallback may be called with (sentBytes, totalBytes) while uploading.
 */
expect suspend fun platformUploadPut(uploadUrl: String, bytes: ByteArray, contentType: String, progressCallback: ((Long, Long) -> Unit)? = null): Boolean
