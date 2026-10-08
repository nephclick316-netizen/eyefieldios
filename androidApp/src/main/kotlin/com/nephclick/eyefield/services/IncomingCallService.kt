package com.nephclick.eyefield.services

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import kotlin.math.min
import com.nephclick.eyefield.MainActivity
import com.nephclick.eyefield.ui.IncomingCallActivity
import com.nephclick.eyefield.utils.NotificationHelper
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class IncomingCallService : Service() {

    companion object {
        const val ACTION_START_CALL = "com.nephclick.eyefield.ACTION_START_CALL"
        const val ACTION_ACCEPT_CALL = "com.nephclick.eyefield.ACTION_ACCEPT_CALL"
        const val ACTION_DECLINE_CALL = "com.nephclick.eyefield.ACTION_DECLINE_CALL"
        const val EXTRA_CALLER_NAME = "extra_caller_name"
        const val EXTRA_IS_VIDEO_CALL = "extra_is_video_call"
        const val EXTRA_ROOM_NAME = "extra_room_name"
        const val EXTRA_CALLER_ID = "extra_caller_id"
        const val EXTRA_CALL_LOG_ID = "extra_call_log_id"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown Caller"

                // Ensure notification channel exists before posting
                NotificationHelper.ensureCallChannel(this)
                val notification = createCallNotification(callerName, intent)

                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        startForeground(102, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL)
                    } else {
                        startForeground(102, notification)
                    }
                } catch (e: Exception) {
                    android.util.Log.e("IncomingCallService", "startForeground failed: ${e.message}", e)
                    // Fallback: post directly via NotificationManager
                    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    nm.notify(102, notification)
                }

                // Acquire brief wake lock to turn screen on if locked/off
                try {
                    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (!pm.isInteractive) {
                        val wakeLock = pm.newWakeLock(
                            PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                            "eyefield:incoming_call_wake_lock"
                        )
                        wakeLock.acquire(4000L)
                    }
                } catch (t: Throwable) {
                    android.util.Log.w("IncomingCallService", "Failed to acquire wake lock: ${t.message}")
                }
            }
            ACTION_ACCEPT_CALL -> {
                val mainIntent = Intent(this, MainActivity::class.java).apply {
                    this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("is_incoming_call", true)
                    putExtra("room_name", intent.getStringExtra(EXTRA_ROOM_NAME))
                    putExtra("caller_id", intent.getStringExtra(EXTRA_CALLER_ID))
                    putExtra("is_video_call", intent.getBooleanExtra(EXTRA_IS_VIDEO_CALL, false))
                    putExtra("call_log_id", intent.getStringExtra(EXTRA_CALL_LOG_ID))
                    putExtra("accepted_from_notification", true)
                }
                startActivity(mainIntent)
                stopSelf()
            }
            ACTION_DECLINE_CALL -> {
                val callLogId = intent.getStringExtra(EXTRA_CALL_LOG_ID)
                if (!callLogId.isNullOrBlank()) {
                    @OptIn(DelicateCoroutinesApi::class)
                    GlobalScope.launch(Dispatchers.IO) {
                        try {
                            com.nephclick.eyefield.Supabase.updateCallLog(
                                callLogId,
                                com.nephclick.eyefield.models.CallLogUpdate(callStatus = "declined")
                            )
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.cancel(102)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createCallNotification(callerName: String, originalIntent: Intent): Notification {
        val channelId = NotificationHelper.CALL_CHANNEL_ID
        val isVideoCall = originalIntent.getBooleanExtra(EXTRA_IS_VIDEO_CALL, false)
        val roomName = originalIntent.getStringExtra(EXTRA_ROOM_NAME)
        val callerId = originalIntent.getStringExtra(EXTRA_CALLER_ID)
        val callLogId = originalIntent.getStringExtra(EXTRA_CALL_LOG_ID)

        val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_CALLER_NAME, callerName)
            putExtra(EXTRA_ROOM_NAME, roomName)
            putExtra(EXTRA_CALLER_ID, callerId)
            putExtra(EXTRA_IS_VIDEO_CALL, isVideoCall)
            putExtra(EXTRA_CALL_LOG_ID, callLogId)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val acceptIntent = Intent(this, IncomingCallService::class.java).apply {
            action = ACTION_ACCEPT_CALL
            putExtras(originalIntent)
        }
        val acceptPendingIntent = PendingIntent.getService(
            this, 1, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val declineIntent = Intent(this, IncomingCallService::class.java).apply {
            action = ACTION_DECLINE_CALL
            putExtras(originalIntent)
        }
        val declinePendingIntent = PendingIntent.getService(
            this, 2, declineIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callTypeLabel = if (isVideoCall) "Incoming Video Call" else "Incoming Voice Call"

        val builder = NotificationCompat.Builder(this, channelId)
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

        return builder.build()
    }
}
