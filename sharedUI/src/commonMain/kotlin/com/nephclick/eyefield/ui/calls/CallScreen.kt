package com.nephclick.eyefield.ui.calls

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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import coil3.compose.AsyncImage
import com.nephclick.eyefield.models.Profile
import kotlinx.coroutines.delay
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch

class CallScreen(
    val otherUser: Profile,
    val isVideoCall: Boolean,
    val isIncoming: Boolean,
    val existingChannelName: String? = null,
    val existingCallLogId: String? = null
) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.current
        val coroutineScope = rememberCoroutineScope()

        var callState by remember { mutableStateOf(if (isIncoming) "ringing" else "calling") }
        var token by remember { mutableStateOf<String?>(null) }
        var appId by remember { mutableStateOf<String?>(null) }
        var roomName by remember { mutableStateOf(existingChannelName ?: "") }
        var currentCallLogId by remember { mutableStateOf(existingCallLogId) }

        val audioPlayer = remember { com.nephclick.eyefield.utils.AudioPlayer() }
        val currentUserId = remember {
            com.nephclick.eyefield.Supabase.client.auth.currentSessionOrNull()?.user?.id ?: ""
        }

        DisposableEffect(Unit) {
            onDispose {
                audioPlayer.stop()
                // If we exit and it was just calling/ringing, mark it missed/ended
                if (callState == "calling" || callState == "ringing") {
                    currentCallLogId?.let { logId ->
                        @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
                        kotlinx.coroutines.GlobalScope.launch {
                            try {
                                com.nephclick.eyefield.Supabase.updateCallLog(
                                    logId,
                                    com.nephclick.eyefield.models.CallLogUpdate(
                                        callStatus = if (isIncoming) "declined" else "missed"
                                    )
                                )
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                }
            }
        }

        // Setup call session
        LaunchedEffect(currentUserId) {
            if (currentUserId.isEmpty()) return@LaunchedEffect
            if (!isIncoming) {
                // Play ringing sound for caller
                audioPlayer.play("dragon_studio_phone_ringing.mp3", isRingtone = true)

                // Caller: create channel and DB call log
                if (roomName.isBlank()) {
                    roomName = com.nephclick.eyefield.Supabase.generateChannelName(currentUserId, otherUser.id)
                }
                val newLog = com.nephclick.eyefield.models.CallLogInsert(
                    callerId = currentUserId,
                    receiverId = otherUser.id,
                    callType = if (isVideoCall) "video" else "voice",
                    callStatus = "ringing",
                    channelName = roomName
                )

                val created = com.nephclick.eyefield.Supabase.createCallLog(newLog)
                if (created != null) {
                    currentCallLogId = created.id
                    // Send FCM push to wake receiver's device
                    val callerProfile = com.nephclick.eyefield.Supabase.fetchProfile(currentUserId)
                    val callerDisplayName = callerProfile?.fullName ?: callerProfile?.username ?: "Someone"
                    com.nephclick.eyefield.Supabase.sendCallNotification(
                        receiverId = otherUser.id,
                        callerId = currentUserId,
                        callerName = callerDisplayName,
                        roomName = roomName,
                        isVideoCall = isVideoCall,
                        callLogId = created.id
                    )

                    // Poll until accepted, declined, or 60-second timeout
                    var elapsedMs = 0L
                    val timeoutMs = 60_000L
                    while (callState == "calling" || callState == "ringing") {
                        delay(2000)
                        elapsedMs += 2000
                        if (elapsedMs >= timeoutMs) {
                            callState = "ended"
                            audioPlayer.stop()
                            try {
                                com.nephclick.eyefield.Supabase.updateCallLog(
                                    created.id,
                                    com.nephclick.eyefield.models.CallLogUpdate(callStatus = "missed")
                                )
                            } catch (e: Exception) { e.printStackTrace() }
                            navigator?.pop()
                            break
                        }

                        try {
                            val updated = com.nephclick.eyefield.Supabase.fetchCallLogById(created.id)
                            if (updated != null) {
                                when (updated.callStatus) {
                                    "accepted" -> {
                                        callState = "connected"
                                        audioPlayer.stop()
                                        if (roomName.isBlank()) roomName = updated.channelName
                                        // Retry token fetch up to 3 times
                                        for (attempt in 1..3) {
                                            val tk = com.nephclick.eyefield.Supabase.getAgoraToken(roomName, currentUserId)
                                            if (tk != null && tk.token.isNotBlank() && tk.appId.isNotBlank()) {
                                                token = tk.token
                                                appId = tk.appId
                                                break
                                            }
                                            delay(600)
                                        }
                                        if (token == null) {
                                            println("ERROR CallScreen: Failed to get Agora token for caller. roomName=$roomName")
                                            callState = "failed"
                                        }
                                        break
                                    }
                                    "declined", "missed", "ended" -> {
                                        callState = "ended"
                                        audioPlayer.stop()
                                        navigator?.pop()
                                        break
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            println("ERROR CallScreen: Poll error: ${e.message}")
                        }
                    }
                } else {
                    callState = "failed"
                    audioPlayer.stop()
                    navigator?.pop()
                }
            } else {
                // Incoming call — resolve channel name
                if (roomName.isBlank() && !currentCallLogId.isNullOrBlank()) {
                    try {
                        val log = com.nephclick.eyefield.Supabase.fetchCallLogById(currentCallLogId!!)
                        if (log != null && log.channelName.isNotBlank()) {
                            roomName = log.channelName
                        }
                    } catch (e: Exception) {
                        println("ERROR CallScreen: Failed to load channel name: ${e.message}")
                    }
                }
                // Play ringing sound
                audioPlayer.play("soynoviembre_classic_phone_ringtone.mp3", isRingtone = true)

                // Poll while ringing to see if caller cancelled
                while (callState == "ringing") {
                    delay(2000)
                    currentCallLogId?.let { id ->
                        try {
                            val updated = com.nephclick.eyefield.Supabase.fetchCallLogById(id)
                            if (updated != null && (updated.callStatus == "missed" || updated.callStatus == "ended" || updated.callStatus == "declined")) {
                                callState = "ended"
                                audioPlayer.stop()
                                navigator?.pop()
                            }
                        } catch (e: Exception) {
                            println("ERROR CallScreen: Receiver poll error: ${e.message}")
                        }
                    }
                }
            }
        }

        if (token != null && appId != null) {
            // Hand off to the Native Agora UI
            val otherDisplayName = otherUser.fullName ?: otherUser.username ?: "User"
            NativeCallUI(
                roomName = roomName,
                token = token!!,
                appId = appId!!,
                userAccount = currentUserId,
                isVideoCall = isVideoCall,
                otherUserName = otherDisplayName,
                otherUserAvatarUrl = otherUser.avatarUrl,
                onCallEnded = {
                    currentCallLogId?.let { logId ->
                        @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
                        kotlinx.coroutines.GlobalScope.launch {
                            try {
                                com.nephclick.eyefield.Supabase.updateCallLog(
                                    logId,
                                    com.nephclick.eyefield.models.CallLogUpdate(
                                        callStatus = "ended",
                                        endedAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString()
                                    )
                                )
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                    navigator?.pop()
                }
            )
        } else {
            // ==========================================
            // PROFESSIONAL PRE-CALL / RINGING UI
            // ==========================================
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
                        .padding(horizontal = 24.dp, vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Header info
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(top = 24.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White.copy(alpha = 0.12f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Image(
                                    painter = painterResource(if (isVideoCall) Res.drawable.video else Res.drawable.telephone),
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                    colorFilter = ColorFilter.tint(Color.White)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isVideoCall) "EyeField Video Call" else "EyeField Voice Call",
                                    color = Color.White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Text(
                            text = otherUser.fullName ?: otherUser.username ?: stringResource(Res.string.unknown),
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = when (callState) {
                                "ringing" -> if (isIncoming) {
                                    if (isVideoCall) "Incoming Video Call..." else "Incoming Voice Call..."
                                } else {
                                    "Ringing..."
                                }
                                "calling" -> if (isVideoCall) "Calling Video..." else "Calling..."
                                "failed" -> stringResource(Res.string.failed_to_connect)
                                else -> stringResource(Res.string.connecting_dots)
                            },
                            fontSize = 16.sp,
                            color = if (callState == "failed") Color(0xFFEF4444) else Color.White.copy(alpha = 0.7f)
                        )
                    }

                    // Avatar with breathing ringing wave
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.size(220.dp)
                    ) {
                        // Pulsing Wave Ring
                        Box(
                            modifier = Modifier
                                .size(175.dp)
                                .scale(pulseScale)
                                .clip(CircleShape)
                                .background(
                                    if (isVideoCall) Color(0xFF8B5CF6).copy(alpha = pulseAlpha)
                                    else Color(0xFF3B82F6).copy(alpha = pulseAlpha)
                                )
                        )

                        // Avatar
                        Box(
                            modifier = Modifier
                                .size(145.dp)
                                .clip(CircleShape)
                                .border(3.5.dp, Color.White.copy(alpha = 0.4f), CircleShape)
                                .background(Color(0xFF334155)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!otherUser.avatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = otherUser.avatarUrl,
                                    contentDescription = stringResource(Res.string.avatar),
                                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Text(
                                    text = (otherUser.username ?: "U").take(1).uppercase(),
                                    color = Color.White,
                                    fontSize = 52.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Action buttons
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 32.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (isIncoming && callState == "ringing") {
                            // Decline Button
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                IconButton(
                                    onClick = {
                                        val logId = currentCallLogId
                                        callState = "ended"
                                        audioPlayer.stop()
                                        if (logId != null) {
                                            @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
                                            kotlinx.coroutines.GlobalScope.launch {
                                                try {
                                                    com.nephclick.eyefield.Supabase.updateCallLog(
                                                        logId,
                                                        com.nephclick.eyefield.models.CallLogUpdate(callStatus = "declined")
                                                    )
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                }
                                            }
                                        }
                                        navigator?.pop()
                                    },
                                    modifier = Modifier
                                        .size(68.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEF4444))
                                ) {
                                    Image(
                                        painter = painterResource(Res.drawable.telephone),
                                        contentDescription = "Decline",
                                        modifier = Modifier.size(30.dp).rotate(135f),
                                        colorFilter = ColorFilter.tint(Color.White)
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Decline", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                            }

                            // Accept Button
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                IconButton(
                                    onClick = {
                                        callState = "accepted"
                                        audioPlayer.stop()
                                        coroutineScope.launch {
                                            val id = currentCallLogId
                                            if (id != null) {
                                                com.nephclick.eyefield.Supabase.updateCallLog(
                                                    id,
                                                    com.nephclick.eyefield.models.CallLogUpdate(
                                                        callStatus = "accepted",
                                                        startedAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString()
                                                    )
                                                )
                                            }
                                            val uid = if (currentUserId.isNotEmpty()) currentUserId else {
                                                com.nephclick.eyefield.Supabase.client.auth.currentSessionOrNull()?.user?.id ?: ""
                                            }
                                            if (uid.isEmpty()) {
                                                callState = "failed"
                                                return@launch
                                            }
                                            var effectiveRoomName = roomName
                                            if (effectiveRoomName.isBlank() && id != null) {
                                                try {
                                                    val log = com.nephclick.eyefield.Supabase.fetchCallLogById(id)
                                                    if (log != null && log.channelName.isNotBlank()) {
                                                        effectiveRoomName = log.channelName
                                                        roomName = effectiveRoomName
                                                    }
                                                } catch (e: Exception) {
                                                    println("ERROR CallScreen: Failed to resolve roomName: ${e.message}")
                                                }
                                            }
                                            if (effectiveRoomName.isBlank()) {
                                                effectiveRoomName = com.nephclick.eyefield.Supabase.generateChannelName(otherUser.id, uid)
                                                roomName = effectiveRoomName
                                            }

                                            for (attempt in 1..3) {
                                                val tk = com.nephclick.eyefield.Supabase.getAgoraToken(effectiveRoomName, uid)
                                                if (tk != null && tk.token.isNotBlank() && tk.appId.isNotBlank()) {
                                                    token = tk.token
                                                    appId = tk.appId
                                                    break
                                                }
                                                delay(600)
                                            }
                                            if (token == null) {
                                                println("ERROR CallScreen: Agora token null or blank for receiver")
                                                callState = "failed"
                                            }
                                        }
                                    },
                                    modifier = Modifier
                                        .size(68.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF22C55E))
                                ) {
                                    Image(
                                        painter = painterResource(if (isVideoCall) Res.drawable.video else Res.drawable.telephone),
                                        contentDescription = "Accept",
                                        modifier = Modifier.size(30.dp),
                                        colorFilter = ColorFilter.tint(Color.White)
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Accept", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
                            }
                        } else {
                            // Outgoing Call End / Cancel Button
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                IconButton(
                                    onClick = {
                                        val logId = currentCallLogId
                                        val status = if (isIncoming) "declined" else "missed"
                                        callState = "ended"
                                        audioPlayer.stop()
                                        if (logId != null) {
                                            @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
                                            kotlinx.coroutines.GlobalScope.launch {
                                                try {
                                                    com.nephclick.eyefield.Supabase.updateCallLog(
                                                        logId,
                                                        com.nephclick.eyefield.models.CallLogUpdate(callStatus = status)
                                                    )
                                                } catch (e: Exception) {
                                                    e.printStackTrace()
                                                }
                                            }
                                        }
                                        navigator?.pop()
                                    },
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEF4444))
                                ) {
                                    Image(
                                        painter = painterResource(Res.drawable.telephone),
                                        contentDescription = stringResource(Res.string.end_call),
                                        modifier = Modifier.size(32.dp).rotate(135f),
                                        colorFilter = ColorFilter.tint(Color.White)
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = if (callState == "failed") "Close" else "End Call",
                                    color = Color.White.copy(alpha = 0.8f),
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
