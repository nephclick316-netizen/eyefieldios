package com.nephclick.eyefield

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import io.github.jan.supabase.auth.auth
import com.nephclick.eyefield.utils.NotificationHelper

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Only process data messages for calls
        val data = remoteMessage.data
        if (data.isNotEmpty() && data["type"] == "incoming_call") {
            val roomName = data["room_name"] ?: data["roomName"] ?: data["channel_name"] ?: data["channelName"] ?: ""
            val callerId = data["caller_id"] ?: data["callerId"] ?: ""
            val callerName = data["caller_name"] ?: data["callerName"] ?: "Incoming Call"
            val isVideoCall = (data["is_video_call"] ?: data["isVideoCall"])?.toBoolean() ?: false
            val callLogId = data["call_log_id"] ?: data["callLogId"] ?: ""

            if (roomName.isNotEmpty() && callerId.isNotEmpty()) {
                showIncomingCallNotification(roomName, callerId, callerName, isVideoCall, callLogId)
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
        // Removed manual WakeLock because acquiring ACQUIRE_CAUSES_WAKEUP turns the screen on *before*
        // the notification is posted. If the screen is already on, Android drops the FullScreenIntent 
        // and only shows a heads-up banner, defeating the lock-screen Activity.

        val serviceIntent = Intent(this, com.nephclick.eyefield.services.IncomingCallService::class.java).apply {
            action = com.nephclick.eyefield.services.IncomingCallService.ACTION_START_CALL
            putExtra(com.nephclick.eyefield.services.IncomingCallService.EXTRA_CALLER_NAME, callerName)
            putExtra(com.nephclick.eyefield.services.IncomingCallService.EXTRA_ROOM_NAME, roomName)
            putExtra(com.nephclick.eyefield.services.IncomingCallService.EXTRA_CALLER_ID, callerId)
            putExtra(com.nephclick.eyefield.services.IncomingCallService.EXTRA_IS_VIDEO_CALL, isVideoCall)
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Ensure call channel exists before starting the foreground service
            NotificationHelper.ensureCallChannel(this)
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        println("FCM New Token: $token")
        // Save the token to Supabase so the backend knows where to send call notifications
        kotlinx.coroutines.GlobalScope.launch {
            try {
                val userId = com.nephclick.eyefield.Supabase.client.auth.currentSessionOrNull()?.user?.id
                if (userId != null) {
                    com.nephclick.eyefield.Supabase.saveFcmToken(userId, token)
                } else {
                    // Store locally, will be saved on next login
                    getSharedPreferences("eyefield_prefs", android.content.Context.MODE_PRIVATE)
                        .edit()
                        .putString("pending_fcm_token", token)
                        .apply()
                }
            } catch (e: Exception) {
                println("Failed to save FCM token: ${e.message}")
            }
        }
    }
}
