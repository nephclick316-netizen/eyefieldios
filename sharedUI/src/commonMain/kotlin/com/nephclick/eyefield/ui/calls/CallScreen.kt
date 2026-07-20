package com.nephclick.eyefield.ui.calls

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
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
                                com.nephclick.eyefield.Supabase.updateCallLog(logId, com.nephclick.eyefield.models.CallLogUpdate(
                                    callStatus = if (isIncoming) "declined" else "missed"
                                ))
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
                
                // We are the caller. Create the room name and call log.
                roomName = com.nephclick.eyefield.Supabase.generateChannelName(currentUserId, otherUser.id)
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
                    val callerDisplayName = callerProfile?.fullName ?: callerProfile?.username ?: "Unknown"
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
                            // Nobody picked up — mark missed and hang up
                            callState = "ended"
                            audioPlayer.stop()
                            try {
                                com.nephclick.eyefield.Supabase.updateCallLog(created.id, com.nephclick.eyefield.models.CallLogUpdate(callStatus = "missed"))
                            } catch (e: Exception) { e.printStackTrace() }
                            navigator?.pop()
                            break
                        }
                        try {
                            val logs = com.nephclick.eyefield.Supabase.fetchCallLogs(currentUserId)
                            val updated = logs.find { it.id == created.id }
                            if (updated != null) {
                                when (updated.callStatus) {
                                    "accepted" -> {
                                        callState = "connected"
                                        audioPlayer.stop()
                                        if (roomName.isBlank()) roomName = updated.channelName
                                        val tk = com.nephclick.eyefield.Supabase.getAgoraToken(roomName, currentUserId)
                                        if (tk != null && tk.token.isNotBlank() && tk.appId.isNotBlank()) {
                                            token = tk.token
                                            appId = tk.appId
                                        } else {
                                            android.util.Log.e("CallScreen", "Failed to get Agora token for caller. roomName=$roomName")
                                            callState = "failed"
                                        }
                                    }
                                    "declined", "missed", "ended" -> {
                                        callState = "ended"
                                        audioPlayer.stop()
                                        navigator?.pop()
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("CallScreen", "Poll error: ${e.message}")
                        }
                    }
                } else {
                    callState = "failed"
                    audioPlayer.stop()
                    navigator?.pop()
                }
            } else {
                // Incoming call — ensure we have the channel name from the DB if it was missing
                if (roomName.isBlank() && !currentCallLogId.isNullOrBlank()) {
                    try {
                        val logs = com.nephclick.eyefield.Supabase.fetchCallLogs(currentUserId)
                        val log = logs.find { it.id == currentCallLogId }
                        if (log != null && log.channelName.isNotBlank()) {
                            roomName = log.channelName
                        }
                    } catch (e: Exception) { android.util.Log.e("CallScreen", "Failed to load channel name: ${e.message}") }
                }
                // Play ringing sound
                audioPlayer.play("soynoviembre_classic_phone_ringtone.mp3", isRingtone = true)
                // Wait for user to accept or decline (status changed by buttons)
                while (callState == "ringing") {
                    delay(2000)
                    // Also check if the caller cancelled the call
                    currentCallLogId?.let { id ->
                        try {
                            val logs = com.nephclick.eyefield.Supabase.fetchCallLogs(currentUserId)
                            val updated = logs.find { it.id == id }
                            if (updated == null || updated.callStatus == "missed" || updated.callStatus == "ended") {
                                callState = "ended"
                                audioPlayer.stop()
                                navigator?.pop()
                            }
                        } catch (e: Exception) { android.util.Log.e("CallScreen", "Receiver poll error: ${e.message}") }
                    }
                }
            }
        }

        if (token != null && appId != null) {
            // Hand off to the Native Agora UI
            NativeCallUI(
                roomName = roomName,
                token = token!!,
                appId = appId!!,
                userAccount = currentUserId,
                isVideoCall = isVideoCall,
                onCallEnded = {
                    currentCallLogId?.let { logId ->
                        @OptIn(kotlinx.coroutines.DelicateCoroutinesApi::class)
                        kotlinx.coroutines.GlobalScope.launch {
                            try {
                                com.nephclick.eyefield.Supabase.updateCallLog(logId, com.nephclick.eyefield.models.CallLogUpdate(
                                    callStatus = "ended",
                                    endedAt = kotlinx.datetime.Clock.System.now().toString()
                                ))
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                    }
                    navigator?.pop()
                }
            )
        } else {
            // Show connecting / calling screen
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                Column(
                    modifier = Modifier.fillMaxSize().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(top = 48.dp)
                    ) {
                        Text(
                            text = otherUser.fullName ?: otherUser.username ?: stringResource(Res.string.unknown),
                            style = MaterialTheme.typography.headlineLarge
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = when (callState) {
                                "ringing" -> if (isIncoming) stringResource(Res.string.incoming_call_dots) else stringResource(Res.string.ringing_dots)
                                "calling" -> stringResource(Res.string.calling_dots)
                                "failed" -> stringResource(Res.string.failed_to_connect)
                                else -> stringResource(Res.string.connecting_dots)
                            },
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(32.dp))
                        
                        if (otherUser.avatarUrl != null) {
                            AsyncImage(
                                model = otherUser.avatarUrl,
                                contentDescription = stringResource(Res.string.avatar),
                                modifier = Modifier.size(150.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(
                                modifier = Modifier.size(150.dp).clip(CircleShape).background(Color.Gray),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    (otherUser.username ?: "U").take(1).uppercase(),
                                    color = Color.White,
                                    style = MaterialTheme.typography.displayLarge
                                )
                            }
                        }
                    }
                    
                    // Cancel / Accept Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        if (isIncoming && callState == "ringing") {
                            IconButton(
                                onClick = { 
                                    callState = "accepted"
                                    audioPlayer.stop()
                                    coroutineScope.launch {
                                        currentCallLogId?.let { id ->
                                            val update = com.nephclick.eyefield.models.CallLogUpdate(
                                                callStatus = "accepted",
                                                startedAt = kotlinx.datetime.Clock.System.now().toString()
                                            )
                                            com.nephclick.eyefield.Supabase.updateCallLog(id, update)
                                            // Wait for currentUserId to be populated before fetching token
                                            val uid = if (currentUserId.isNotEmpty()) currentUserId else {
                                                com.nephclick.eyefield.Supabase.client.auth.currentSessionOrNull()?.user?.id ?: ""
                                            }
                                             if (uid.isEmpty()) {
                                                 callState = "failed"
                                                 return@launch
                                             }
                                             // Ensure roomName is resolved before fetching token
                                             var effectiveRoomName = roomName
                                             if (effectiveRoomName.isBlank()) {
                                                 try {
                                                     val logs = com.nephclick.eyefield.Supabase.fetchCallLogs(uid)
                                                     val log = logs.find { it.id == id }
                                                     if (log != null && log.channelName.isNotBlank()) {
                                                         effectiveRoomName = log.channelName
                                                         roomName = effectiveRoomName
                                                     }
                                                 } catch (e: Exception) {
                                                     android.util.Log.e("CallScreen", "Failed to resolve roomName: ${e.message}")
                                                 }
                                             }
                                             if (effectiveRoomName.isBlank()) {
                                                 android.util.Log.e("CallScreen", "Cannot accept: roomName is blank after DB lookup")
                                                 callState = "failed"
                                                 return@launch
                                             }
                                             val tk = com.nephclick.eyefield.Supabase.getAgoraToken(effectiveRoomName, uid)
                                             if (tk != null && tk.token.isNotBlank() && tk.appId.isNotBlank()) {
                                                 token = tk.token
                                                 appId = tk.appId
                                             } else {
                                                 android.util.Log.e("CallScreen", "Agora token null or blank for receiver. room=$effectiveRoomName")
                                                 callState = "failed"
                                             }
                                         }
                                     }
                                },
                                modifier = Modifier.size(64.dp).clip(CircleShape).background(Color(0xFF4CAF50))
                            ) {
                                Icon(
                                    painter = painterResource(Res.drawable.telephone),
                                    contentDescription = stringResource(Res.string.accept_call),
                                    tint = Color.White,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }

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
                                            com.nephclick.eyefield.Supabase.updateCallLog(logId, com.nephclick.eyefield.models.CallLogUpdate(
                                                callStatus = status
                                            ))
                                        } catch (e: Exception) {
                                            e.printStackTrace()
                                        }
                                    }
                                }
                                navigator?.pop() 
                            },
                            modifier = Modifier.size(64.dp).clip(CircleShape).background(Color.Red)
                        ) {
                            Icon(
                                painter = painterResource(Res.drawable.telephone), // Or call_end
                                contentDescription = stringResource(Res.string.end_call),
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
