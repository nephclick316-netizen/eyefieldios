package com.nephclick.eyefield.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import com.nephclick.eyefield.services.IncomingCallService
import com.nephclick.eyefield.ui.IncomingCallActivity

object NotificationHelper {
    const val CALL_CHANNEL_ID = "incoming_calls_channel_v4"
    const val CALL_NOTIFICATION_ID = 102

    fun ensureCallChannel(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val existing = nm.getNotificationChannel(CALL_CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CALL_CHANNEL_ID,
                    "Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Incoming Call Notifications"
                    setSound(
                        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .build()
                    )
                    enableVibration(true)
                }
                nm.createNotificationChannel(channel)
            }
        }
    }

    fun showDirectCallNotification(
        context: Context,
        roomName: String,
        callerId: String,
        callerName: String,
        isVideoCall: Boolean,
        callLogId: String
    ) {
        ensureCallChannel(context)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(IncomingCallService.EXTRA_CALLER_NAME, callerName)
            putExtra(IncomingCallService.EXTRA_ROOM_NAME, roomName)
            putExtra(IncomingCallService.EXTRA_CALLER_ID, callerId)
            putExtra(IncomingCallService.EXTRA_IS_VIDEO_CALL, isVideoCall)
            putExtra(IncomingCallService.EXTRA_CALL_LOG_ID, callLogId)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context, 0, fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val acceptIntent = Intent(context, IncomingCallService::class.java).apply {
            action = IncomingCallService.ACTION_ACCEPT_CALL
            putExtra(IncomingCallService.EXTRA_CALLER_NAME, callerName)
            putExtra(IncomingCallService.EXTRA_ROOM_NAME, roomName)
            putExtra(IncomingCallService.EXTRA_CALLER_ID, callerId)
            putExtra(IncomingCallService.EXTRA_IS_VIDEO_CALL, isVideoCall)
            putExtra(IncomingCallService.EXTRA_CALL_LOG_ID, callLogId)
        }
        val acceptPendingIntent = PendingIntent.getService(
            context, 1, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val declineIntent = Intent(context, IncomingCallService::class.java).apply {
            action = IncomingCallService.ACTION_DECLINE_CALL
            putExtra(IncomingCallService.EXTRA_CALL_LOG_ID, callLogId)
        }
        val declinePendingIntent = PendingIntent.getService(
            context, 2, declineIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callTypeLabel = if (isVideoCall) "Incoming Video Call" else "Incoming Voice Call"

        val builder = NotificationCompat.Builder(context, CALL_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle(callerName)
            .setContentText(callTypeLabel)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setOngoing(true)
            .setAutoCancel(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setStyle(
                NotificationCompat.CallStyle.forIncomingCall(
                    Person.Builder().setName(callerName).build(),
                    declinePendingIntent,
                    acceptPendingIntent
                ).setIsVideo(isVideoCall)
            )
        } else {
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent)
            builder.addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
        }

        nm.notify(CALL_NOTIFICATION_ID, builder.build())
    }
}
