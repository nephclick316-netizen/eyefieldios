package com.nephclick.eyefield.ui.calls

import androidx.compose.runtime.Composable

@Composable
actual fun NativeCallUI(
    roomName: String,
    token: String,
    appId: String, userAccount: String,
    isVideoCall: Boolean,
    onCallEnded: () -> Unit
) {
    // Stub for iOS - Agora integration would go here
    onCallEnded()
}
