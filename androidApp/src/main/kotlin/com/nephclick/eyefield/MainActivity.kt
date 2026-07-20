package com.nephclick.eyefield

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.WindowManager
import android.app.KeyguardManager
import android.content.Context
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import kotlin.system.exitProcess
import com.nephclick.eyefield.utils.CrashReporter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

import io.github.jan.supabase.auth.handleDeeplinks
import io.github.jan.supabase.auth.auth

@android.annotation.SuppressLint("InvalidFragmentVersionForActivityResult")
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // Request notification permission on Android 13+ so incoming call notifications
        // (and their full-screen intents) can be delivered and wake the device.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                val requestPermissionLauncher = registerForActivityResult(
                    ActivityResultContracts.RequestPermission()
                ) { isGranted: Boolean ->
                    if (!isGranted) {
                        android.util.Log.w("MainActivity", "POST_NOTIFICATIONS permission not granted; incoming call notifications may be suppressed")
                        try {
                            val prefs = getSharedPreferences("eyefield_prefs", Context.MODE_PRIVATE)
                            val prev = prefs.getInt("permission_denied_count", 0)
                            prefs.edit().putInt("permission_denied_count", prev + 1).apply()
                        } catch (_: Throwable) { }
                    }
                }

                // Show a short rationale dialog so the user understands why we need
                // notification permission for incoming calls to reliably wake the device.
                try {
                    android.app.AlertDialog.Builder(this)
                        .setTitle("Allow Notifications")
                        .setMessage("Eyefield needs notification permission to show incoming call alerts and wake your phone when someone calls you. Please allow notifications.")
                        .setPositiveButton("Allow") { _, _ ->
                            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        .setNeutralButton("Settings") { _, _ ->
                            com.nephclick.eyefield.ui.SettingsActivity.open(this)
                        }
                        .setNegativeButton("Not now", null)
                        .show()
                } catch (t: Throwable) {
                    // If UI fails, fall back to directly launching the permission request
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
        
        com.nephclick.eyefield.Supabase.client.handleDeeplinks(intent)
        handleCallIntent(intent)

        // Register FCM token with Supabase so this device can receive call notifications
        registerFcmToken()
        
        // Setup global crash handler
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            exception.printStackTrace()
            android.util.Log.e("MainActivity", "CRASH DETECTED", exception)
            CrashReporter.handleCrash(exception)
            // Exit gracefully without showing the system crash dialog
            exitProcess(0)
        }

        setContent {
            App()
        }
    }

    private fun registerFcmToken() {
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    android.util.Log.w("MainActivity", "Fetching FCM token failed", task.exception)
                    return@addOnCompleteListener
                }
                val token = task.result as? String ?: return@addOnCompleteListener
                android.util.Log.d("MainActivity", "FCM Token: $token")
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                        if (userId != null) {
                            Supabase.saveFcmToken(userId, token)
                        } else {
                            // Save locally; the token will be registered on next successful login
                            getSharedPreferences("eyefield_prefs", Context.MODE_PRIVATE)
                                .edit()
                                .putString("pending_fcm_token", token)
                                .apply()
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("MainActivity", "Failed to save FCM token", e)
                    }
                }
            }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        com.nephclick.eyefield.Supabase.client.handleDeeplinks(intent)
        handleCallIntent(intent)
    }

    private fun handleCallIntent(intent: Intent?) {
        if (intent == null) return
        val isIncomingCall = intent.getBooleanExtra("is_incoming_call", false) || intent.getBooleanExtra("isIncomingCall", false)
        if (isIncomingCall) {
            val roomName = intent.getStringExtra("room_name") ?: intent.getStringExtra("roomName") ?: intent.getStringExtra("channel_name") ?: intent.getStringExtra("channelName") ?: ""
            val callerId = intent.getStringExtra("caller_id") ?: intent.getStringExtra("callerId") ?: ""
            val isVideoCall = intent.getBooleanExtra("is_video_call", false) || intent.getBooleanExtra("isVideoCall", false)
            val callLogId = intent.getStringExtra("call_log_id") ?: intent.getStringExtra("callLogId") ?: ""

            if (roomName.isNotEmpty() && callerId.isNotEmpty()) {
                // Configure window flags to show when locked, turn screen on, keep screen on
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
                    setShowWhenLocked(true)
                    setTurnScreenOn(true)
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                    keyguardManager.requestDismissKeyguard(this, null)
                } else {
                    @Suppress("DEPRECATION")
                    window.addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    )
                }
                com.nephclick.eyefield.utils.CallIntentBridge.triggerIncomingCall(
                    com.nephclick.eyefield.utils.IncomingCallData(
                        callerId = callerId,
                        roomName = roomName,
                        isVideoCall = isVideoCall,
                        callLogId = callLogId
                    )
                )
            }
        }
    }
}

@Preview
@Composable
fun AppAndroidPreview() {
    App()
}
