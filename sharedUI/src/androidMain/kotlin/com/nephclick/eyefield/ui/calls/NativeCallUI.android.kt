package com.nephclick.eyefield.ui.calls

import android.Manifest
import android.view.SurfaceView
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil3.compose.AsyncImage
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig
import io.agora.rtc2.video.VideoCanvas
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.telephone
import eyefield.sharedui.generated.resources.microphone
import eyefield.sharedui.generated.resources.volume
import eyefield.sharedui.generated.resources.volume_mute
import eyefield.sharedui.generated.resources.video
import eyefield.sharedui.generated.resources.photo_camera

@Composable
actual fun NativeCallUI(
    roomName: String,
    token: String,
    appId: String,
    userAccount: String,
    isVideoCall: Boolean,
    otherUserName: String,
    otherUserAvatarUrl: String?,
    onCallEnded: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var rtcEngine by remember { mutableStateOf<RtcEngine?>(null) }
    var isMicMuted by remember { mutableStateOf(false) }
    var isCameraOff by remember { mutableStateOf(!isVideoCall) }
    var isSpeakerOn by remember { mutableStateOf(isVideoCall) }
    var isFrontCamera by remember { mutableStateOf(true) }

    var isConnected by remember { mutableStateOf(false) }
    var remoteUid by remember { mutableStateOf<Int?>(null) }
    var isRemoteVideoMuted by remember { mutableStateOf(false) }
    var isRemoteLeft by remember { mutableStateOf(false) }
    var showControls by remember { mutableStateOf(true) }
    var callDuration by remember { mutableStateOf(0) }

    // RtcEngine Event Handler
    val rtcEventHandler = remember {
        object : IRtcEngineEventHandler() {
            override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
                android.util.Log.d("AgoraCall", "onJoinChannelSuccess: channel=$channel, uid=$uid")
                coroutineScope.launch {
                    isConnected = true
                }
            }

            override fun onUserJoined(uid: Int, elapsed: Int) {
                android.util.Log.d("AgoraCall", "onUserJoined: uid=$uid")
                coroutineScope.launch {
                    remoteUid = uid
                    isRemoteLeft = false
                }
            }

            override fun onUserOffline(uid: Int, reason: Int) {
                android.util.Log.d("AgoraCall", "onUserOffline: uid=$uid, reason=$reason")
                coroutineScope.launch {
                    if (remoteUid == uid || remoteUid == null) {
                        remoteUid = null
                        isRemoteLeft = true
                        delay(1500)
                        rtcEngine?.leaveChannel()
                        RtcEngine.destroy()
                        rtcEngine = null
                        onCallEnded()
                    }
                }
            }

            override fun onUserMuteVideo(uid: Int, muted: Boolean) {
                android.util.Log.d("AgoraCall", "onUserMuteVideo: uid=$uid, muted=$muted")
                coroutineScope.launch {
                    if (uid == remoteUid) {
                        isRemoteVideoMuted = muted
                    }
                }
            }

            override fun onError(err: Int) {
                android.util.Log.e("AgoraCall", "onError: code=$err")
            }
        }
    }

    val permissionsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] == true
        val cameraGranted = permissions[Manifest.permission.CAMERA] == true

        if (audioGranted && (!isVideoCall || cameraGranted)) {
            try {
                android.util.Log.d("AgoraCall", "Permissions granted. Initializing RtcEngine with appId=$appId, roomName=$roomName")
                val config = RtcEngineConfig().apply {
                    mContext = context
                    mAppId = appId
                    mEventHandler = rtcEventHandler
                }
                val engine = RtcEngine.create(config).apply {
                    if (isVideoCall) {
                        enableVideo()
                        startPreview()
                    } else {
                        enableAudio()
                    }

                    // Setup default audio routing
                    setDefaultAudioRoutetoSpeakerphone(isVideoCall)
                    setEnableSpeakerphone(isVideoCall)

                    val options = io.agora.rtc2.ChannelMediaOptions().apply {
                        channelProfile = Constants.CHANNEL_PROFILE_COMMUNICATION
                        clientRoleType = Constants.CLIENT_ROLE_BROADCASTER
                        publishMicrophoneTrack = true
                        publishCameraTrack = isVideoCall
                        autoSubscribeAudio = true
                        autoSubscribeVideo = isVideoCall
                    }

                    val result = joinChannelWithUserAccount(token, roomName, userAccount, options)
                    android.util.Log.d("AgoraCall", "joinChannelWithUserAccount result: $result")
                }
                rtcEngine = engine
            } catch (e: Exception) {
                android.util.Log.e("AgoraCall", "RtcEngine.create exception: ${e.message}", e)
                Toast.makeText(context, "Call connection failed: ${e.message}", Toast.LENGTH_LONG).show()
                onCallEnded()
            }
        } else {
            Toast.makeText(context, "Microphone/Camera permission required for calls", Toast.LENGTH_SHORT).show()
            onCallEnded()
        }
    }

    // Call duration timer (unrestricted duration)
    LaunchedEffect(isConnected) {
        if (isConnected) {
            while (true) {
                delay(1000)
                callDuration++
            }
        }
    }

    // Auto-hide controls in video calls after 5 seconds
    LaunchedEffect(showControls, isVideoCall) {
        if (isVideoCall && showControls && isConnected) {
            delay(5000)
            showControls = false
        }
    }

    // Request permissions on entry
    LaunchedEffect(Unit) {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (isVideoCall) {
            permissions.add(Manifest.permission.CAMERA)
        }
        permissionsLauncher.launch(permissions.toTypedArray())
    }

    fun leaveChannel() {
        try {
            rtcEngine?.stopPreview()
            rtcEngine?.leaveChannel()
            RtcEngine.destroy()
        } catch (e: Exception) {
            android.util.Log.e("AgoraCall", "leaveChannel error: ${e.message}", e)
        }
        rtcEngine = null
    }

    BackHandler {
        leaveChannel()
        onCallEnded()
    }

    DisposableEffect(Unit) {
        onDispose {
            leaveChannel()
        }
    }

    fun formatDuration(seconds: Int): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return if (mins >= 60) {
            val hrs = mins / 60
            val remMins = mins % 60
            String.format("%02d:%02d:%02d", hrs, remMins, secs)
        } else {
            String.format("%02d:%02d", mins, secs)
        }
    }

    if (isVideoCall) {
        // ==========================================
        // PROFESSIONAL VIDEO CALL UI
        // ==========================================
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    showControls = !showControls
                }
        ) {
            // Full Screen Remote Video Canvas
            if (remoteUid != null && !isRemoteVideoMuted) {
                AndroidView(
                    factory = { ctx ->
                        SurfaceView(ctx).apply {
                            rtcEngine?.setupRemoteVideo(
                                VideoCanvas(this, VideoCanvas.RENDER_MODE_HIDDEN, remoteUid!!)
                            )
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Remote video placeholder
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF0A0F1D))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(120.dp)
                                .clip(CircleShape)
                                .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape)
                                .background(Color(0xFF334155)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!otherUserAvatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = otherUserAvatarUrl,
                                    contentDescription = otherUserName,
                                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Text(
                                    text = otherUserName.take(1).uppercase(),
                                    color = Color.White,
                                    fontSize = 44.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))
                        Text(
                            text = otherUserName,
                            color = Color.White,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (isRemoteLeft) {
                                "Call Ended"
                            } else if (isRemoteVideoMuted) {
                                "Camera turned off"
                            } else if (!isConnected) {
                                "Connecting video..."
                            } else {
                                "Waiting for video feed..."
                            },
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 15.sp
                        )
                    }
                }
            }

            // Local Video Preview PiP (Picture-in-Picture)
            if (!isCameraOff) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 48.dp, end = 16.dp)
                        .size(width = 110.dp, height = 155.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .border(1.5.dp, Color.White.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                        .background(Color.Black)
                ) {
                    AndroidView(
                        factory = { ctx ->
                            SurfaceView(ctx).apply {
                                setZOrderMediaOverlay(true)
                                rtcEngine?.setupLocalVideo(
                                    VideoCanvas(this, VideoCanvas.RENDER_MODE_HIDDEN, 0)
                                )
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 48.dp, end = 16.dp)
                        .size(width = 110.dp, height = 155.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .border(1.5.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .background(Color(0xFF1E293B)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Image(
                            painter = painterResource(Res.drawable.photo_camera),
                            contentDescription = "Camera Off",
                            modifier = Modifier.size(24.dp),
                            colorFilter = ColorFilter.tint(Color.White.copy(alpha = 0.5f))
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Cam Off", color = Color.White.copy(alpha = 0.6f), fontSize = 11.sp)
                    }
                }
            }

            // Top Header Overlay Bar (fades on tap)
            AnimatedVisibility(
                visible = showControls,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.TopCenter)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Participant pill
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color.Black.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = otherUserName,
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "•  ${if (isConnected) formatDuration(callDuration) else "Connecting"}",
                                color = if (isConnected) Color(0xFF4ADE80) else Color(0xFFFBBF24),
                                fontSize = 13.sp
                            )
                        }
                    }

                    // Switch camera action button
                    IconButton(
                        onClick = {
                            rtcEngine?.switchCamera()
                            isFrontCamera = !isFrontCamera
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.5f))
                    ) {
                        Image(
                            painter = painterResource(Res.drawable.photo_camera),
                            contentDescription = "Switch Camera",
                            modifier = Modifier.size(20.dp),
                            colorFilter = ColorFilter.tint(Color.White)
                        )
                    }
                }
            }

            // Bottom Controls Bar (fades on tap)
            AnimatedVisibility(
                visible = showControls,
                enter = fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.BottomCenter)
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 24.dp),
                    shape = RoundedCornerShape(32.dp),
                    color = Color(0xCC0F172A),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Switch camera
                        IconButton(
                            onClick = {
                                rtcEngine?.switchCamera()
                                isFrontCamera = !isFrontCamera
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.15f))
                        ) {
                            Image(
                                painter = painterResource(Res.drawable.photo_camera),
                                contentDescription = "Flip Cam",
                                modifier = Modifier.size(22.dp),
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                        }

                        // Toggle Camera on/off
                        IconButton(
                            onClick = {
                                isCameraOff = !isCameraOff
                                rtcEngine?.muteLocalVideoStream(isCameraOff)
                                rtcEngine?.enableLocalVideo(!isCameraOff)
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (isCameraOff) Color(0xFFEF4444) else Color.White.copy(alpha = 0.15f))
                        ) {
                            Image(
                                painter = painterResource(Res.drawable.video),
                                contentDescription = "Toggle Video",
                                modifier = Modifier.size(22.dp),
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                        }

                        // Toggle Mic
                        IconButton(
                            onClick = {
                                isMicMuted = !isMicMuted
                                rtcEngine?.muteLocalAudioStream(isMicMuted)
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (isMicMuted) Color(0xFFEF4444) else Color.White.copy(alpha = 0.15f))
                        ) {
                            Image(
                                painter = painterResource(Res.drawable.microphone),
                                contentDescription = "Toggle Mic",
                                modifier = Modifier.size(22.dp),
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                        }

                        // Toggle Speaker
                        IconButton(
                            onClick = {
                                isSpeakerOn = !isSpeakerOn
                                rtcEngine?.setEnableSpeakerphone(isSpeakerOn)
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(if (isSpeakerOn) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.15f))
                        ) {
                            Image(
                                painter = painterResource(if (isSpeakerOn) Res.drawable.volume else Res.drawable.volume_mute),
                                contentDescription = "Toggle Speaker",
                                modifier = Modifier.size(22.dp),
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                        }

                        // End Call
                        IconButton(
                            onClick = {
                                leaveChannel()
                                onCallEnded()
                            },
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFEF4444))
                        ) {
                            Image(
                                painter = painterResource(Res.drawable.telephone),
                                contentDescription = "End Call",
                                modifier = Modifier.size(26.dp).rotate(135f),
                                colorFilter = ColorFilter.tint(Color.White)
                            )
                        }
                    }
                }
            }
        }
    } else {
        // ==========================================
        // PROFESSIONAL VOICE CALL UI
        // ==========================================
        val infiniteTransition = rememberInfiniteTransition()
        val pulseScale by infiniteTransition.animateFloat(
            initialValue = 1f,
            targetValue = 1.18f,
            animationSpec = infiniteRepeatable(
                animation = tween(1500, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            )
        )
        val pulseAlpha by infiniteTransition.animateFloat(
            initialValue = 0.35f,
            targetValue = 0.05f,
            animationSpec = infiniteRepeatable(
                animation = tween(1500, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            )
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF0F172A),
                            Color(0xFF1E293B),
                            Color(0xFF0F172A)
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .navigationBarsPadding()
                    .padding(horizontal = 24.dp, vertical = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Header: Encryption badge & Call Mode
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(top = 16.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = Color.White.copy(alpha = 0.08f)
                    ) {
                        Text(
                            text = "🔒 End-to-End Encrypted Voice Call",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = if (isConnected) formatDuration(callDuration) else "Connecting...",
                        color = if (isConnected) Color(0xFF4ADE80) else Color(0xFFFBBF24),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Center: Animated Pulsing Avatar & Contact Info
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(200.dp)
                    ) {
                        // Outer Pulsing Ring
                        if (isConnected && !isRemoteLeft) {
                            Box(
                                modifier = Modifier
                                    .size(170.dp)
                                    .scale(pulseScale)
                                    .clip(CircleShape)
                                    .background(Color(0xFF3B82F6).copy(alpha = pulseAlpha))
                            )
                        }

                        // Main Avatar Card
                        Box(
                            modifier = Modifier
                                .size(140.dp)
                                .clip(CircleShape)
                                .border(3.dp, Color.White.copy(alpha = 0.35f), CircleShape)
                                .background(Color(0xFF334155)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!otherUserAvatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = otherUserAvatarUrl,
                                    contentDescription = otherUserName,
                                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Text(
                                    text = otherUserName.take(1).uppercase(),
                                    color = Color.White,
                                    fontSize = 54.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Text(
                        text = otherUserName,
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = if (isRemoteLeft) {
                            "Call Ended"
                        } else if (!isConnected) {
                            "Establishing secure connection..."
                        } else if (isMicMuted) {
                            "Microphone Muted"
                        } else {
                            "Voice Call Active"
                        },
                        color = Color.White.copy(alpha = 0.65f),
                        fontSize = 16.sp
                    )
                }

                // Bottom: Action Control Dock
                Surface(
                    shape = RoundedCornerShape(32.dp),
                    color = Color.White.copy(alpha = 0.08f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 20.dp),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Mic Mute Button
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            IconButton(
                                onClick = {
                                    isMicMuted = !isMicMuted
                                    rtcEngine?.muteLocalAudioStream(isMicMuted)
                                },
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (isMicMuted) Color(0xFFEF4444) else Color.White.copy(alpha = 0.15f)
                                    )
                            ) {
                                Image(
                                    painter = painterResource(Res.drawable.microphone),
                                    contentDescription = "Mute",
                                    modifier = Modifier.size(26.dp),
                                    colorFilter = ColorFilter.tint(Color.White)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (isMicMuted) "Unmute" else "Mute",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        }

                        // End Call Button
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            IconButton(
                                onClick = {
                                    leaveChannel()
                                    onCallEnded()
                                },
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444))
                            ) {
                                Image(
                                    painter = painterResource(Res.drawable.telephone),
                                    contentDescription = "End Call",
                                    modifier = Modifier.size(32.dp).rotate(135f),
                                    colorFilter = ColorFilter.tint(Color.White)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "End Call",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        }

                        // Speakerphone Button
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            IconButton(
                                onClick = {
                                    isSpeakerOn = !isSpeakerOn
                                    rtcEngine?.setEnableSpeakerphone(isSpeakerOn)
                                },
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(CircleShape)
                                    .background(
                                        if (isSpeakerOn) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.15f)
                                    )
                            ) {
                                Image(
                                    painter = painterResource(if (isSpeakerOn) Res.drawable.volume else Res.drawable.volume_mute),
                                    contentDescription = "Speaker",
                                    modifier = Modifier.size(26.dp),
                                    colorFilter = ColorFilter.tint(Color.White)
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = if (isSpeakerOn) "Speaker" else "Earpiece",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
