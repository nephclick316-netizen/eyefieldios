package com.nephclick.eyefield

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.nephclick.eyefield.services.IncomingCallService
import com.nephclick.eyefield.utils.NotificationHelper
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            val type = data["type"]
            if (type == "incoming_call") {
                val roomName = data["room_name"] ?: data["roomName"] ?: data["channel_name"] ?: data["channelName"] ?: ""
                val callerId = data["caller_id"] ?: data["callerId"] ?: ""
                val callerName = data["caller_name"] ?: data["callerName"] ?: "Incoming Call"
                val isVideoCall = (data["is_video_call"] ?: data["isVideoCall"])?.toBoolean() ?: false
                val callLogId = data["call_log_id"] ?: data["callLogId"] ?: ""

                if (roomName.isNotEmpty() && callerId.isNotEmpty()) {
                    showIncomingCallNotification(roomName, callerId, callerName, isVideoCall, callLogId)
                }
            } else if (type == "call_cancelled" || type == "cancel_call") {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.cancel(NotificationHelper.CALL_NOTIFICATION_ID)
                stopService(Intent(this, IncomingCallService::class.java))
            }
        }
    }

    private fun showIncomingCallNotification(
        roomName: String,
        callerId: String,
        callerName: String,
        isVideoCall: Boolean,
        callLogId: String
    ) {
        val serviceIntent = Intent(this, IncomingCallService::class.java).apply {
            action = IncomingCallService.ACTION_START_CALL
            putExtra(IncomingCallService.EXTRA_CALLER_NAME, callerName)
            putExtra(IncomingCallService.EXTRA_ROOM_NAME, roomName)
            putExtra(IncomingCallService.EXTRA_CALLER_ID, callerId)
            putExtra(IncomingCallService.EXTRA_IS_VIDEO_CALL, isVideoCall)
            putExtra(IncomingCallService.EXTRA_CALL_LOG_ID, callLogId)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationHelper.ensureCallChannel(this)
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            android.util.Log.e("MyFirebaseMessagingService", "Failed to start IncomingCallService, posting notification directly: ${e.message}", e)
            NotificationHelper.showDirectCallNotification(
                this,
                roomName,
                callerId,
                callerName,
                isVideoCall,
                callLogId
            )
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        android.util.Log.d("MyFirebaseMessagingService", "FCM New Token: $token")
        // Cache locally in prefs so it's guaranteed to be uploaded on next auth
        getSharedPreferences("eyefield_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("pending_fcm_token", token)
            .apply()

        @OptIn(DelicateCoroutinesApi::class)
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                if (userId != null) {
                    Supabase.saveFcmToken(userId, token)
                }
            } catch (e: Exception) {
                android.util.Log.e("MyFirebaseMessagingService", "Failed to save FCM token: ${e.message}")
            }
        }
    }
}
