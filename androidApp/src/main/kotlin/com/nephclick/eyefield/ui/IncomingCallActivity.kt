package com.nephclick.eyefield.ui

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nephclick.eyefield.MainActivity
import com.nephclick.eyefield.services.IncomingCallService
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

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
        val callLogId = intent.getStringExtra(IncomingCallService.EXTRA_CALL_LOG_ID)

        setContent {
            MaterialTheme {
                IncomingCallScreen(
                    callerName = callerName,
                    isVideoCall = isVideoCall,
                    onAccept = {
                        val acceptIntent = Intent(this@IncomingCallActivity, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            putExtra("is_incoming_call", true)
                            putExtra("room_name", roomName)
                            putExtra("caller_id", callerId)
                            putExtra("is_video_call", isVideoCall)
                            putExtra("call_log_id", callLogId)
                            putExtra("accepted_from_notification", true)
                        }
                        startActivity(acceptIntent)
                        stopService(Intent(this@IncomingCallActivity, IncomingCallService::class.java))
                        finish()
                    },
                    onDecline = {
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
                        stopService(Intent(this@IncomingCallActivity, IncomingCallService::class.java))
                        finish()
                    }
                )
            }
        }
    }
}

@Composable
fun IncomingCallScreen(
    callerName: String,
    isVideoCall: Boolean,
    onAccept: () -> Unit,
    onDecline: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition()
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF0F172A),
                        Color(0xFF1E293B),
                        Color(0xFF0B1120)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header: Call type and caller
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(top = 24.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = if (isVideoCall) "📹 EyeField Video Call" else "📞 EyeField Voice Call",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = callerName,
                    color = Color.White,
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (isVideoCall) "Incoming Video Call..." else "Incoming Call...",
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 16.sp
                )
            }

            // Pulsing Avatar
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(200.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(170.dp)
                        .scale(pulseScale)
                        .clip(CircleShape)
                        .background(
                            if (isVideoCall) Color(0xFF8B5CF6).copy(alpha = pulseAlpha)
                            else Color(0xFF3B82F6).copy(alpha = pulseAlpha)
                        )
                )

                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .border(3.5.dp, Color.White.copy(alpha = 0.4f), CircleShape)
                        .background(Color(0xFF334155)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = callerName.take(1).uppercase(),
                        color = Color.White,
                        fontSize = 54.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Bottom Buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Decline
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(
                        onClick = onDecline,
                        modifier = Modifier
                            .size(70.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFEF4444))
                    ) {
                        Image(
                            painter = painterResource(android.R.drawable.ic_menu_close_clear_cancel),
                            contentDescription = "Decline",
                            modifier = Modifier.size(32.dp),
                            colorFilter = ColorFilter.tint(Color.White)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Decline", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                }

                // Accept
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    IconButton(
                        onClick = onAccept,
                        modifier = Modifier
                            .size(70.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF22C55E))
                    ) {
                        Image(
                            painter = painterResource(android.R.drawable.ic_menu_call),
                            contentDescription = "Accept",
                            modifier = Modifier.size(32.dp),
                            colorFilter = ColorFilter.tint(Color.White)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = "Accept", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                }
            }
        }
    }
}
