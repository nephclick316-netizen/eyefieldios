package com.nephclick.eyefield.ui.calls

import androidx.compose.runtime.Composable

@Composable
expect fun NativeCallUI(
    roomName: String,
    token: String,
    appId: String,
    userAccount: String,
    isVideoCall: Boolean,
    otherUserName: String = "User",
    otherUserAvatarUrl: String? = null,
    onCallEnded: () -> Unit
)
