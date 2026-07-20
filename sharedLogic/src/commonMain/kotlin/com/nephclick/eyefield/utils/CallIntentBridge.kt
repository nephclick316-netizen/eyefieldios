package com.nephclick.eyefield.utils

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

data class IncomingCallData(
    val callerId: String,
    val roomName: String,
    val isVideoCall: Boolean,
    val callLogId: String
)

object CallIntentBridge {
    private val _incomingCallFlow = MutableSharedFlow<IncomingCallData>(replay = 1)
    val incomingCallFlow = _incomingCallFlow.asSharedFlow()

    fun triggerIncomingCall(data: IncomingCallData) {
        _incomingCallFlow.tryEmit(data)
    }

    fun clear() {
        _incomingCallFlow.resetReplayCache()
    }
}
