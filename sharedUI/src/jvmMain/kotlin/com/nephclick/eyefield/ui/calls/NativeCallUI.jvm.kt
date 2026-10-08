package com.nephclick.eyefield.ui.calls

import androidx.compose.runtime.Composable

@Composable
actual fun NativeCallUI(
    roomName: String,
    token: String,
    appId: String,
    userAccount: String,
    isVideoCall: Boolean,
    otherUserName: String,
    otherUserAvatarUrl: String?,
    onCallEnded: () -> Unit
) {
    // Stub for JVM/Desktop
    onCallEnded()
}
