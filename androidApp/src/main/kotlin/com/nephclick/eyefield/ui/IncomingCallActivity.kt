package com.nephclick.eyefield.ui

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.nephclick.eyefield.MainActivity
import com.nephclick.eyefield.services.IncomingCallService

class IncomingCallActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val callerName = intent.getStringExtra(IncomingCallService.EXTRA_CALLER_NAME) ?: "Unknown Caller"
        val roomName = intent.getStringExtra(IncomingCallService.EXTRA_ROOM_NAME)
        val callerId = intent.getStringExtra(IncomingCallService.EXTRA_CALLER_ID)
        val isVideoCall = intent.getBooleanExtra(IncomingCallService.EXTRA_IS_VIDEO_CALL, false)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    IncomingCallScreen(
                        callerName = callerName,
                        onAccept = {
                            val acceptIntent = Intent(this@IncomingCallActivity, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                putExtra("is_incoming_call", true)
                                putExtra("room_name", roomName)
                                putExtra("caller_id", callerId)
                                putExtra("is_video_call", isVideoCall)
                                putExtra("accepted_from_notification", true)
                            }
                            startActivity(acceptIntent)
                            stopService(Intent(this@IncomingCallActivity, IncomingCallService::class.java))
                            finish()
                        },
                        onDecline = {
                            stopService(Intent(this@IncomingCallActivity, IncomingCallService::class.java))
                            finish()
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun IncomingCallScreen(callerName: String, onAccept: () -> Unit, onDecline: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Incoming Call", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = callerName, style = MaterialTheme.typography.headlineLarge)
        Spacer(modifier = Modifier.height(64.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = onDecline, colors = ButtonDefaults.buttonColors(containerColor = Color.Red)) {
                Text(text = "Decline", color = Color.White)
            }
            Button(onClick = onAccept, colors = ButtonDefaults.buttonColors(containerColor = Color.Green)) {
                Text(text = "Accept", color = Color.White)
            }
        }
    }
}
