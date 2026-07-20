package com.nephclick.eyefield.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import kotlin.math.min
import com.nephclick.eyefield.utils.NotificationHelper
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import com.nephclick.eyefield.MainActivity
import com.nephclick.eyefield.ui.IncomingCallActivity

class IncomingCallService : Service() {

    companion object {
        const val ACTION_START_CALL = "com.nephclick.eyefield.ACTION_START_CALL"
        const val ACTION_ACCEPT_CALL = "com.nephclick.eyefield.ACTION_ACCEPT_CALL"
        const val ACTION_DECLINE_CALL = "com.nephclick.eyefield.ACTION_DECLINE_CALL"
        const val EXTRA_CALLER_NAME = "extra_caller_name"
        const val EXTRA_IS_VIDEO_CALL = "extra_is_video_call"
        const val EXTRA_ROOM_NAME = "extra_room_name"
        const val EXTRA_CALLER_ID = "extra_caller_id"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown Caller"

                // Ensure notification channel exists (centralized) before posting
                NotificationHelper.ensureCallChannel(this)
                startForeground(102, createCallNotification(callerName, intent))

                // Try briefly waking the device after posting the full-screen incoming call
                // notification. We acquire a short wake lock only when the device is not
                // interactive. We make the wake duration configurable and use exponential
                // backoff if repeated attempts fail on a specific device.
                try {
                    val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (!pm.isInteractive) {
                        val prefs = getSharedPreferences("eyefield_prefs", Context.MODE_PRIVATE)
                        val base = prefs.getLong("incoming_call_wake_duration_ms", 3000L)
                        val failures = prefs.getInt("incoming_call_wake_failures", 0)
                        val max = 15000L
                        val multiplier = 1L shl failures.coerceAtMost(4)
                        val duration = min(max, base * multiplier)

                        val wakeLock = pm.newWakeLock(
                            PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                            "eyefield:incoming_call_wake_lock"
                        )
                        try {
                            wakeLock.acquire(duration)
                            // success -> reset failure count
                            prefs.edit().putInt("incoming_call_wake_failures", 0).apply()
                        } catch (t: Throwable) {
                            val newFailures = (failures + 1).coerceAtMost(10)
                            prefs.edit().putInt("incoming_call_wake_failures", newFailures).apply()
                            android.util.Log.w("IncomingCallService", "Failed to acquire wake lock: ${t.message}")
                        }
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
                    putExtra("accepted_from_notification", true)
                }
                startActivity(mainIntent)
                stopSelf()
            }
            ACTION_DECLINE_CALL -> {
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createCallNotification(callerName: String, originalIntent: Intent): Notification {
        val channelId = NotificationHelper.CALL_CHANNEL_ID

        val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_CALLER_NAME, callerName)
            putExtra(EXTRA_ROOM_NAME, originalIntent.getStringExtra(EXTRA_ROOM_NAME))
            putExtra(EXTRA_CALLER_ID, originalIntent.getStringExtra(EXTRA_CALLER_ID))
            putExtra(EXTRA_IS_VIDEO_CALL, originalIntent.getBooleanExtra(EXTRA_IS_VIDEO_CALL, false))
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val acceptIntent = Intent(this, IncomingCallService::class.java).apply {
            action = ACTION_ACCEPT_CALL
            putExtras(originalIntent)
        }
        val acceptPendingIntent = PendingIntent.getService(this, 1, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val declineIntent = Intent(this, IncomingCallService::class.java).apply {
            action = ACTION_DECLINE_CALL
            putExtras(originalIntent)
        }
        val declinePendingIntent = PendingIntent.getService(this, 2, declineIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val builder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle(callerName)
            .setContentText("Incoming call...")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setOngoing(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setStyle(NotificationCompat.CallStyle.forIncomingCall(
                Person.Builder().setName(callerName).build(),
                declinePendingIntent,
                acceptPendingIntent
            ))
        } else {
            builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent)
            builder.addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
        }

        return builder.build()
    }
}
