package com.nephclick.eyefield.ui.calls

import android.Manifest
import android.view.TextureView
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig
import io.agora.rtc2.video.VideoCanvas
import kotlinx.coroutines.launch
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.volume
import eyefield.sharedui.generated.resources.volume_mute

@Composable
actual fun NativeCallUI(
    roomName: String,
    token: String,
    appId: String,
    userAccount: String,
    isVideoCall: Boolean,
    onCallEnded: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    var rtcEngine by remember { mutableStateOf<RtcEngine?>(null) }
    var isMicMuted by remember { mutableStateOf(false) }
    var isCameraOff by remember { mutableStateOf(!isVideoCall) }
    
    var isConnected by remember { mutableStateOf(false) }
    var remoteUid by remember { mutableStateOf<Int?>(null) }

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
                }
            }

            override fun onUserOffline(uid: Int, reason: Int) {
                android.util.Log.d("AgoraCall", "onUserOffline: uid=$uid, reason=$reason")
                coroutineScope.launch {
                    if (remoteUid == uid) {
                        remoteUid = null
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
                    
                    val options = io.agora.rtc2.ChannelMediaOptions().apply {
                        channelProfile = Constants.CHANNEL_PROFILE_COMMUNICATION
                        clientRoleType = Constants.CLIENT_ROLE_BROADCASTER
                        publishMicrophoneTrack = true
                        publishCameraTrack = isVideoCall
                        autoSubscribeAudio = true
                        autoSubscribeVideo = true
                    }
                    
                    // Join channel using the token, roomName, userAccount, and options
                    val result = joinChannelWithUserAccount(token, roomName, userAccount, options)
                    android.util.Log.d("AgoraCall", "joinChannelWithUserAccount result code: $result (0 means success)")
                }
                rtcEngine = engine
            } catch (e: Exception) {
                android.util.Log.e("AgoraCall", "RtcEngine.create exception: ${e.message}", e)
                Toast.makeText(context, "Failed to connect Agora: ${e.message}", Toast.LENGTH_LONG).show()
                onCallEnded()
            }
        } else {
            Toast.makeText(context, "Permissions denied", Toast.LENGTH_SHORT).show()
            onCallEnded()
        }
    }

    var callDuration by remember { mutableStateOf(0) }

    LaunchedEffect(isConnected) {
        if (isConnected) {
            while (callDuration < 30) {
                kotlinx.coroutines.delay(1000)
                callDuration++
            }
            // Limit reached 30 seconds
            rtcEngine?.leaveChannel()
            io.agora.rtc2.RtcEngine.destroy()
            rtcEngine = null
            onCallEnded()
        }
    }

    LaunchedEffect(Unit) {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (isVideoCall) {
            permissions.add(Manifest.permission.CAMERA)
        }
        permissionsLauncher.launch(permissions.toTypedArray())
    }

    // When RtcEngine is created, set speakerphone
    // We already do this inside the permissionsLauncher block, but let's make sure it's routed
    LaunchedEffect(rtcEngine) {
        rtcEngine?.setDefaultAudioRoutetoSpeakerphone(true)
        rtcEngine?.setEnableSpeakerphone(true)
    }

    fun leaveChannel() {
        rtcEngine?.leaveChannel()
        RtcEngine.destroy()
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        if (!isConnected) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Color.White)
                Spacer(modifier = Modifier.height(16.dp))
                Text("Connecting...", color = Color.White)
            }
        } else {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = String.format("%02d:%02d", callDuration / 60, callDuration % 60),
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 48.dp, bottom = 16.dp)
                )
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                    if (isVideoCall && remoteUid != null) {
                        // Render Remote Video
                        AndroidView(
                            factory = { ctx ->
                                android.view.SurfaceView(ctx).apply {
                                    rtcEngine?.setupRemoteVideo(
                                        VideoCanvas(
                                            this,
                                            VideoCanvas.RENDER_MODE_HIDDEN,
                                            remoteUid!!
                                        )
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } else if (isVideoCall) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Waiting for remote video...", color = Color.White)
                        }
                    } else {
                        Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Voice Call Active", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    if (isVideoCall && !isCameraOff) {
                        // Local video PiP
                        AndroidView(
                            factory = { ctx ->
                                android.view.SurfaceView(ctx).apply {
                                    setZOrderMediaOverlay(true)
                                    rtcEngine?.setupLocalVideo(
                                        VideoCanvas(
                                            this,
                                            VideoCanvas.RENDER_MODE_HIDDEN,
                                            0
                                        )
                                    )
                                }
                            },
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(16.dp)
                                .size(width = 100.dp, height = 150.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black)
                        )
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FloatingActionButton(
                        onClick = {
                            isMicMuted = !isMicMuted
                            rtcEngine?.muteLocalAudioStream(isMicMuted)
                        },
                        containerColor = Color.DarkGray
                    ) {
                        androidx.compose.foundation.Image(
                            painter = org.jetbrains.compose.resources.painterResource(
                                if (isMicMuted) Res.drawable.volume_mute 
                                else Res.drawable.volume
                            ),
                            contentDescription = "Mute Toggle",
                            modifier = Modifier.size(24.dp),
                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color.White)
                        )
                    }

                    FloatingActionButton(
                        onClick = {
                            leaveChannel()
                            onCallEnded()
                        },
                        containerColor = Color.Red
                    ) {
                        Text("End", color = Color.White)
                    }

                    if (isVideoCall) {
                        FloatingActionButton(
                            onClick = {
                                isCameraOff = !isCameraOff
                                rtcEngine?.muteLocalVideoStream(isCameraOff)
                            },
                            containerColor = if (isCameraOff) Color.Gray else Color.White
                        ) {
                            Text(if (isCameraOff) "Cam On" else "Cam Off")
                        }
                    }
                }
            }
        }
    }
}
