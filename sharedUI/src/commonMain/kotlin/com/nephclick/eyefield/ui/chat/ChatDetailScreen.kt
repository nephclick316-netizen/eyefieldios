package com.nephclick.eyefield.ui.chat

import org.jetbrains.compose.resources.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import coil3.compose.AsyncImage
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.ChatMessage
import com.nephclick.eyefield.models.Profile
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*

class ChatDetailScreen(val roomId: String, val otherUser: Profile) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.current
        val scope = rememberCoroutineScope()
        var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
        var messageText by remember { mutableStateOf("") }
        var searchQuery by remember { mutableStateOf("") }
        var selectedDateFilter by remember { mutableStateOf<String?>(null) }
        var isOtherUserOnline by remember {
            mutableStateOf(
                if (otherUser.lastSeen != null) {
                    try {
                        val lastSeen = otherUser.lastSeen
                        if (lastSeen != null) {
                            val lastSeenTime = lastSeen.toLongOrNull() ?: 0L
                            val now = com.nephclick.eyefield.utils.getCurrentTimeMillis()
                            val diff = now - lastSeenTime
                            (diff / 60000) <= 5
                        } else false
                    } catch (e: Exception) { false }
                } else false
            )
        }
        var showSearchPopup by remember { mutableStateOf(false) }
        var showAttachmentPopup by remember { mutableStateOf(false) }
        var showMessageOptions by remember { mutableStateOf<ChatMessage?>(null) }
        var showClearConfirmation by remember { mutableStateOf(false) }
        var showImageSourceDialog by remember { mutableStateOf(false) }
        var showVideoSourceDialog by remember { mutableStateOf(false) }
        var isUploadingMedia by remember { mutableStateOf(false) }
        var chatUploadProgress by remember { mutableStateOf(0f) }
        var isRecording by remember { mutableStateOf(false) }
        var showDatePicker by remember { mutableStateOf(false) }
        var clearConfirmationText by remember { mutableStateOf("") }
        var expandedMenu by remember { mutableStateOf(false) }
        var showReportDialog by remember { mutableStateOf(false) }
        var reportReason by remember { mutableStateOf("") }
        var customReportReason by remember { mutableStateOf("") }
        var showReasonDropdown by remember { mutableStateOf(false) }
        var showReportToast by remember { mutableStateOf(false) }
        var selectedSearchTab by remember { mutableStateOf(0) }
        val searchTabs = listOf(
            stringResource(Res.string.tab_text), 
            stringResource(Res.string.tab_images), 
            stringResource(Res.string.tab_video), 
            stringResource(Res.string.tab_documents), 
            stringResource(Res.string.tab_voice_notes), 
            stringResource(Res.string.tab_others)
        )
        var replyReference by remember { mutableStateOf<ChatMessage?>(null) }
        var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
        val listState = androidx.compose.foundation.lazy.rememberLazyListState()
        val uriHandler = androidx.compose.ui.platform.LocalUriHandler.current
        val audioRecorder = remember { com.nephclick.eyefield.utils.AudioRecorder() }
        var recordingSeconds by remember { mutableStateOf(0) }
        var hasAudioPermission by remember { mutableStateOf(false) }
        val audioPermissionLauncher = com.nephclick.eyefield.utils.rememberAudioPermissionLauncher(
            onGranted = { hasAudioPermission = true },
            onDenied = { hasAudioPermission = false }
        )
        val openDocumentWithChooser = com.nephclick.eyefield.utils.rememberOpenDocumentWithChooser()

        LaunchedEffect(isRecording) {
            if (isRecording) {
                recordingSeconds = 0
                while (true) {
                    kotlinx.coroutines.delay(1000)
                    recordingSeconds++
                }
            }
        }
        val session = Supabase.client.auth.currentSessionOrNull()
        val currentUserId = session?.user?.id ?: ""
        val isDarkMode = androidx.compose.foundation.isSystemInDarkTheme()

        LaunchedEffect(roomId) {
            messages = Supabase.fetchChatMessages(roomId)
        }

        val handleImagePicked: (ByteArray?) -> Unit = { bytes ->
            if (bytes != null) {
                scope.launch {
                    try {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = true }
                        val url = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                            val compressed = com.nephclick.eyefield.utils.compressImage(bytes)
                            com.nephclick.eyefield.utils.R2Uploader.uploadMedia(compressed, "chat", "image/jpeg", "jpg") { sent, total ->
                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { chatUploadProgress = pct } }
                            }
                        }
                        val newImageMsg = ChatMessage(
                            roomId = roomId,
                            senderId = currentUserId,
                            text = "Image Attachment",
                            mediaUrl = url,
                            createdAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString()
                        )
                        messages = messages + newImageMsg
                        com.nephclick.eyefield.Supabase.sendMessage(newImageMsg)
                    } catch (e: Exception) {
                        println("Upload failed: ${e.message}")
                    } finally {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = false }
                    }
                }
            }
        }
        val cameraLauncher = com.nephclick.eyefield.utils.rememberCameraLauncher(onImagePicked = handleImagePicked)
        val galleryLauncher = com.nephclick.eyefield.utils.rememberGalleryLauncher(onImagePicked = handleImagePicked)

        val handleVideoPicked: (ByteArray?, String?) -> Unit = { bytes, ext ->
            if (bytes != null && ext != null) {
                scope.launch {
                    try {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = true }
                        val url = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                            com.nephclick.eyefield.utils.R2Uploader.uploadMedia(bytes, "chat", "video/mp4", ext) { sent, total ->
                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { chatUploadProgress = pct } }
                            }
                        }
                        val newVideoMsg = ChatMessage(roomId = roomId, senderId = currentUserId, text = "Video Attachment", mediaUrl = url, createdAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString())
                        messages = messages + newVideoMsg
                        com.nephclick.eyefield.Supabase.sendMessage(newVideoMsg)
                    } catch(e: Exception) { println("Upload failed: ${e.message}") } finally { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = false } }
                }
            }
        }
        val videoCameraLauncher = com.nephclick.eyefield.utils.rememberVideoCameraLauncher(onVideoPicked = handleVideoPicked)
        val videoGalleryLauncher = com.nephclick.eyefield.utils.rememberVideoGalleryLauncher(onVideoPicked = handleVideoPicked)

        val handleDocumentPicked: (ByteArray?, String?, String?) -> Unit = { bytes, type, ext ->
            if (bytes != null && type != null && ext != null) {
                scope.launch {
                    try {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = true }
                        val url = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                            com.nephclick.eyefield.utils.R2Uploader.uploadMedia(bytes, "chat", type, ext) { sent, total ->
                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { chatUploadProgress = pct } }
                            }
                        }
                        val newDocMsg = ChatMessage(roomId = roomId, senderId = currentUserId, text = "Document Attachment", mediaUrl = url, createdAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString())
                        messages = messages + newDocMsg
                        com.nephclick.eyefield.Supabase.sendMessage(newDocMsg)
                    } catch(e: Exception) { println("Upload failed: ${e.message}") } finally { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingMedia = false } }
                }
            }
        }
        val documentLauncher = com.nephclick.eyefield.utils.rememberDocumentPickerLauncher(onDocumentPicked = handleDocumentPicked)

        val filteredMessages = messages.filter { message ->
            val matchesSearch = searchQuery.isBlank() || message.text.contains(searchQuery, ignoreCase = true)
            val matchesDate = selectedDateFilter == null || message.createdAt?.startsWith(selectedDateFilter!!) == true
            val matchesTab = when (selectedSearchTab) {
                0 -> true // Text
                1 -> message.mediaUrl?.endsWith(".jpg") == true || message.mediaUrl?.endsWith(".png") == true // Images
                2 -> message.mediaUrl?.endsWith(".mp4") == true // Video
                3 -> message.mediaUrl?.endsWith(".pdf") == true || message.mediaUrl?.endsWith(".doc") == true // Documents
                4 -> message.text == "Field Voice Note" || message.mediaUrl?.endsWith(".mp3") == true // Voice Notes
                else -> false // Others
            }
            matchesSearch && matchesDate && (if (showSearchPopup) matchesTab else true)
        }

        Scaffold(
            modifier = Modifier.fillMaxSize().imePadding(),
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Column(modifier = Modifier.statusBarsPadding()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "←",
                            fontSize = 24.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.clickable { navigator?.pop() }.padding(end = 16.dp)
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { navigator?.push(com.nephclick.eyefield.ui.profile.ProfileScreen(otherUser.id)) }
                        ) {
                            if (otherUser.avatarUrl != null) {
                                AsyncImage(
                                    model = otherUser.avatarUrl,
                                    contentDescription = stringResource(Res.string.avatar),
                                    modifier = Modifier.size(40.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text((otherUser.username ?: "U").take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(otherUser.fullName ?: (otherUser.username ?: stringResource(Res.string.user)), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface, maxLines = 1)
                                Text(if (isOtherUserOnline) stringResource(Res.string.online) else stringResource(Res.string.offline), style = MaterialTheme.typography.bodySmall, color = if (isOtherUserOnline) MaterialTheme.colorScheme.primary else Color.Gray)
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        IconButton(onClick = { navigator?.push(com.nephclick.eyefield.ui.calls.CallScreen(otherUser, isVideoCall = false, isIncoming = false)) }) {
                            androidx.compose.foundation.Image(
                                org.jetbrains.compose.resources.painterResource(Res.drawable.phone_call),
                                contentDescription = stringResource(Res.string.voice_call),
                                modifier = Modifier.size(24.dp),
                                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(MaterialTheme.colorScheme.primary)
                            )
                        }
                        IconButton(onClick = { navigator?.push(com.nephclick.eyefield.ui.calls.CallScreen(otherUser, isVideoCall = true, isIncoming = false)) }) {
                            androidx.compose.foundation.Image(
                                org.jetbrains.compose.resources.painterResource(Res.drawable.zoom_video),
                                contentDescription = stringResource(Res.string.video_call),
                                modifier = Modifier.size(24.dp),
                                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(MaterialTheme.colorScheme.primary)
                            )
                        }
                        IconButton(onClick = { showSearchPopup = true }) {
                            androidx.compose.foundation.Image(
                                org.jetbrains.compose.resources.painterResource(Res.drawable.binder),
                                contentDescription = stringResource(Res.string.binder),
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Box {
                            IconButton(onClick = { expandedMenu = true }) {
                                Text("⋮", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            }
                            DropdownMenu(
                                expanded = expandedMenu,
                                onDismissRequest = { expandedMenu = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text(stringResource(Res.string.clear_messages)) },
                                    onClick = {
                                        expandedMenu = false
                                        showClearConfirmation = true
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text(stringResource(Res.string.report_user)) },
                                    onClick = {
                                        expandedMenu = false
                                        showReportDialog = true
                                    }
                                )
                            }
                        }
                        if (isUploadingMedia) {
                            val pct = (chatUploadProgress * 100).toInt()
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(progress = chatUploadProgress, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Uploading $pct%", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                    HorizontalDivider()
                }
            },
            bottomBar = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surface)
                        .navigationBarsPadding()
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        if (replyReference != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Replying to ${if (replyReference!!.senderId == currentUserId) stringResource(Res.string.replying_to_yourself) else otherUser.username}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                    Text(replyReference!!.text.take(30) + if (replyReference!!.text.length > 30) "..." else "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                IconButton(onClick = { replyReference = null }, modifier = Modifier.size(24.dp)) {
                                    Text("✕", fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                        OutlinedTextField(
                            value = messageText,
                            onValueChange = { messageText = it },
                            placeholder = { Text(if (isRecording) "${stringResource(Res.string.recording_dots)}${recordingSeconds / 60}:${(recordingSeconds % 60).toString().padStart(2, '0')}" else stringResource(Res.string.message_dots), color = if (isRecording) Color.Red else MaterialTheme.colorScheme.onSurfaceVariant) },
                            leadingIcon = {
                                if (!isRecording) {
                                    IconButton(onClick = { showAttachmentPopup = true }) {
                                        androidx.compose.foundation.Image(
                                            painter = org.jetbrains.compose.resources.painterResource(Res.drawable.plus),
                                            contentDescription = stringResource(Res.string.add_media),
                                            modifier = Modifier.size(24.dp),
                                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDarkMode) Color.White else MaterialTheme.colorScheme.onSurface)
                                        )
                                    }
                                } else {
                                    androidx.compose.foundation.Image(
                                        painter = org.jetbrains.compose.resources.painterResource(Res.drawable.microphone),
                                        contentDescription = stringResource(Res.string.recording_cd),
                                        modifier = Modifier.size(24.dp).padding(start = 12.dp),
                                        colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color.Red)
                                    )
                                }
                            },
                            trailingIcon = {
                                IconButton(onClick = { cameraLauncher() }) {
                                    androidx.compose.foundation.Image(
                                        painter = org.jetbrains.compose.resources.painterResource(Res.drawable.photo_camera_new),
                                        contentDescription = stringResource(Res.string.camera),
                                        modifier = Modifier.size(24.dp),
                                        colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDarkMode) Color.White else MaterialTheme.colorScheme.onSurface)
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(24.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent
                            )
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF000080)) // Navy blue
                            .pointerInput(messageText) {
                                detectTapGestures(
                                    onTap = {
                                        if (messageText.isNotBlank()) {
                                            val text = messageText
                                            messageText = ""
                                            val finalMessageText = if (replyReference != null) "> Replying to: ${replyReference!!.text.take(20)}...\n\n$text" else text
                                            replyReference = null
                                            scope.launch {
                                                val newMessage = ChatMessage(
                                                    roomId = roomId,
                                                    senderId = currentUserId,
                                                    text = finalMessageText,
                                                    createdAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString()
                                                )
                                                messages = messages + newMessage
                                                com.nephclick.eyefield.Supabase.sendMessage(newMessage)
                                            }
                                        } else {
                                            // Fallback for short tap on microphone
                                        }
                                    },
                                    onPress = {
                                        if (messageText.isBlank()) {
                                            if (!hasAudioPermission) {
                                                audioPermissionLauncher()
                                            } else {
                                                isRecording = true
                                                audioRecorder.startRecording()
                                                tryAwaitRelease()
                                                isRecording = false
                                                audioRecorder.stopRecording { bytes ->
                                                    if (bytes != null) {
                                                        scope.launch {
                                                        isUploadingMedia = true
                                                        try {
                                                            val url = com.nephclick.eyefield.utils.R2Uploader.uploadMedia(bytes, "chat", "audio/mpeg", "mp3")
                                                            val newVoiceNote = ChatMessage(
                                                                roomId = roomId,
                                                                senderId = currentUserId,
                                                                text = "Field Voice Note",
                                                                mediaUrl = url,
                                                                createdAt = com.nephclick.eyefield.utils.getCurrentTimeMillis().toString()
                                                            )
                                                            messages = messages + newVoiceNote
                                                            com.nephclick.eyefield.Supabase.sendMessage(newVoiceNote)
                                                        } catch (e: Exception) {
                                                            println("Voice note upload failed: ${e.message}")
                                                        } finally {
                                                            isUploadingMedia = false
                                                        }
                                                    }
                                                }
                                            }
                                            }
                                        }
                                    }
                                )
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        androidx.compose.foundation.Image(
                            painter = org.jetbrains.compose.resources.painterResource(
                                if (messageText.isNotBlank()) Res.drawable.send_3 else Res.drawable.microphone
                            ),
                            contentDescription = if (messageText.isNotBlank()) stringResource(Res.string.send) else stringResource(Res.string.voice_note),
                            modifier = Modifier.size(24.dp).padding(start = if(messageText.isNotBlank()) 4.dp else 0.dp),
                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color.White)
                        )
                    }
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.Bottom,
                state = listState
            ) {
                items(filteredMessages) { message ->
                    val isMine = message.senderId == currentUserId
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(
                                    topStart = 16.dp,
                                    topEnd = 16.dp,
                                    bottomStart = if (isMine) 16.dp else 0.dp,
                                    bottomEnd = if (isMine) 0.dp else 16.dp
                                ))
                                .background(if (isMine) Color(0xFF000080) else MaterialTheme.colorScheme.surfaceVariant)
                                .padding(12.dp)
                                .pointerInput(Unit) {
                                    detectTapGestures(
                                        onLongPress = { showMessageOptions = message }
                                    )
                                }
                        ) {
                            Column(horizontalAlignment = if (isMine) Alignment.End else Alignment.Start) {
                                if (message.text == "Field Voice Note" || message.mediaUrl?.endsWith(".mp3") == true) {
                                    val audioPlayer = remember { com.nephclick.eyefield.utils.AudioPlayer() }
                                    var isPlaying by remember { mutableStateOf(false) }
                                    var progress by remember { mutableStateOf(0f) }
                                    var speedMultiplier by remember { mutableStateOf(1f) }

                                    DisposableEffect(message.id) {
                                        onDispose { audioPlayer.stop() }
                                    }

                                    LaunchedEffect(isPlaying) {
                                        if (isPlaying) {
                                            if (progress == 0f) {
                                                message.mediaUrl?.let { audioPlayer.play(it) }
                                            } else {
                                                audioPlayer.resume()
                                            }
                                            audioPlayer.setSpeed(speedMultiplier)
                                            while (progress < 1f) {
                                                kotlinx.coroutines.delay((100 / speedMultiplier).toLong())
                                                progress += 0.01f
                                            }
                                            isPlaying = false
                                            progress = 0f
                                            audioPlayer.stop()
                                        } else {
                                            audioPlayer.pause()
                                        }
                                    }
                                    LaunchedEffect(speedMultiplier) {
                                        if (isPlaying) audioPlayer.setSpeed(speedMultiplier)
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        androidx.compose.foundation.Image(
                                            painter = org.jetbrains.compose.resources.painterResource(Res.drawable.microphone),
                                            contentDescription = stringResource(Res.string.voice_note),
                                            modifier = Modifier.size(24.dp),
                                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isMine) Color.White else MaterialTheme.colorScheme.onSurface)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        IconButton(onClick = { isPlaying = !isPlaying }) {
                                            Text(if (isPlaying) "⏸" else "▶", color = if (isMine) Color.White else MaterialTheme.colorScheme.onSurface)
                                        }
                                        Slider(
                                            value = progress,
                                            onValueChange = { progress = it },
                                            modifier = Modifier.width(100.dp),
                                            colors = SliderDefaults.colors(
                                                thumbColor = if (isMine) Color.White else MaterialTheme.colorScheme.primary,
                                                activeTrackColor = if (isMine) Color.LightGray else MaterialTheme.colorScheme.primary
                                            )
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        TextButton(onClick = { speedMultiplier = if (speedMultiplier == 1f) 2f else 1f }) {
                                            Text("x${speedMultiplier.toInt()}", color = if (isMine) Color.White else MaterialTheme.colorScheme.primary)
                                        }
                                    }
                                } else if (message.mediaUrl?.endsWith(".jpg") == true || message.mediaUrl?.endsWith(".png") == true) {
                                    AsyncImage(
                                        model = message.mediaUrl,
                                        contentDescription = stringResource(Res.string.image_attachment),
                                        modifier = Modifier.height(200.dp).clip(RoundedCornerShape(8.dp)).clickable { fullScreenImageUrl = message.mediaUrl },
                                        contentScale = ContentScale.Crop
                                    )
                                } else if (message.mediaUrl?.endsWith(".mp4") == true) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { openDocumentWithChooser(message.mediaUrl!!, "mp4") }) {
                                        androidx.compose.foundation.Image(
                                            painter = org.jetbrains.compose.resources.painterResource(Res.drawable.video_lesson),
                                            contentDescription = stringResource(Res.string.play_video),
                                            modifier = Modifier.size(48.dp),
                                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isMine) Color.White else MaterialTheme.colorScheme.primary)
                                        )
                                        Text(stringResource(Res.string.play_video), color = if (isMine) Color.White else MaterialTheme.colorScheme.onSurface)
                                    }
                                } else if (message.mediaUrl?.endsWith(".pdf") == true || message.mediaUrl?.endsWith(".doc") == true || message.mediaUrl?.endsWith(".docx") == true) {
                                    val ext = message.mediaUrl!!.substringAfterLast(".", "pdf")
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { openDocumentWithChooser(message.mediaUrl!!, ext) }) {
                                        Text("📄", fontSize = 48.sp)
                                        Text(stringResource(Res.string.open_document), color = if (isMine) Color.White else MaterialTheme.colorScheme.onSurface)
                                    }
                                } else if (message.text.startsWith("> Replying to: ")) {
                                    val lines = message.text.split("\n\n", limit = 2)
                                    val replyPart = lines.getOrNull(0) ?: ""
                                    val actualText = lines.getOrNull(1) ?: ""
                                    
                                    Column {
                                        Row(
                                            modifier = Modifier.clickable {
                                                val snippet = replyPart.removePrefix("> Replying to: ").removeSuffix("...")
                                                val origIndex = filteredMessages.indexOfFirst { it.text.contains(snippet) }
                                                if (origIndex != -1) {
                                                    scope.launch { listState.animateScrollToItem(origIndex) }
                                                }
                                            }.padding(bottom = 4.dp, end = 16.dp, top = 2.dp)
                                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                            .padding(4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            androidx.compose.foundation.Image(painter = org.jetbrains.compose.resources.painterResource(Res.drawable.reply), contentDescription = "Reply", modifier = Modifier.size(16.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(MaterialTheme.colorScheme.primary))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(replyPart.removePrefix("> "), color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                                        }
                                        
                                        val isLink = actualText.contains("http://") || actualText.contains("https://")
                                        val textMod = if (isLink) Modifier.clickable { 
                                            val url = actualText.split(" ").firstOrNull { it.startsWith("http") }
                                            if (url != null) uriHandler.openUri(url)
                                        } else Modifier
                                        Text(
                                            text = actualText,
                                            color = if (isLink) MaterialTheme.colorScheme.primary else if (isMine) Color.White else MaterialTheme.colorScheme.onSurface,
                                            fontSize = 16.sp,
                                            modifier = textMod
                                        )
                                    }
                                } else {
                                    val isLink = message.text.contains("http://") || message.text.contains("https://")
                                    val textMod = if (isLink) Modifier.clickable { 
                                        val url = message.text.split(" ").firstOrNull { it.startsWith("http") }
                                        if (url != null) uriHandler.openUri(url)
                                    } else Modifier
                                    Text(
                                        text = message.text,
                                        color = if (isLink) MaterialTheme.colorScheme.primary else if (isMine) Color.White else MaterialTheme.colorScheme.onSurface,
                                        fontSize = 16.sp,
                                        modifier = textMod
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = try {
                                            val instant = kotlinx.datetime.Instant.parse(message.createdAt ?: "")
                                            val localDateTime = instant.toLocalDateTime(kotlinx.datetime.TimeZone.currentSystemDefault())
                                            val month = localDateTime.month.name.take(3).lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
                                            "$month ${localDateTime.dayOfMonth}, ${localDateTime.hour.toString().padStart(2, '0')}:${localDateTime.minute.toString().padStart(2, '0')}"
                                        } catch (e: Exception) {
                                            ""
                                        },
                                        color = if (isMine) Color.White.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                        fontSize = 10.sp
                                    )
                                    if (isMine) {
                                        Spacer(modifier = Modifier.width(4.dp))
                                        val receiptIcon = if (message.isRead) Res.drawable.eye else if (isOtherUserOnline) Res.drawable.eye_2 else Res.drawable.close_eye
                                        androidx.compose.foundation.Image(
                                            painter = org.jetbrains.compose.resources.painterResource(receiptIcon),
                                            contentDescription = stringResource(Res.string.read_receipt),
                                            modifier = Modifier.size(12.dp),
                                            colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color.White.copy(alpha = 0.7f))
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showSearchPopup) {
            AlertDialog(
                onDismissRequest = { showSearchPopup = false },
                containerColor = if (isDarkMode) Color.Black else Color.White,
                title = { Text(stringResource(Res.string.search_messages_title), color = if (isDarkMode) Color.White else Color.Black) },
                text = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = { Text(stringResource(Res.string.search_messages)) },
                                modifier = Modifier.weight(1f),
                                trailingIcon = {
                                    IconButton(onClick = { showDatePicker = true }) {
                                        androidx.compose.foundation.Image(
                                            painter = org.jetbrains.compose.resources.painterResource(Res.drawable.calendar),
                                            contentDescription = stringResource(Res.string.select_date),
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        ScrollableTabRow(
                            selectedTabIndex = selectedSearchTab,
                            edgePadding = 0.dp
                        ) {
                            searchTabs.forEachIndexed { index, title ->
                                Tab(
                                    selected = selectedSearchTab == index,
                                    onClick = { selectedSearchTab = index },
                                    text = { Text(title) }
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        if (filteredMessages.isEmpty()) {
                            Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                                Text("${stringResource(Res.string.no_results_found_for)}${searchTabs[selectedSearchTab]}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        } else {
                            LazyColumn(modifier = Modifier.fillMaxWidth().height(300.dp)) {
                                items(filteredMessages) { message ->
                                    val index = filteredMessages.indexOf(message)
                                    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clickable {
                                        replyReference = message
                                        showSearchPopup = false
                                        scope.launch { listState.animateScrollToItem(index) }
                                    }) {
                                        if (message.mediaUrl?.endsWith(".jpg") == true || message.mediaUrl?.endsWith(".png") == true) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                AsyncImage(model = message.mediaUrl, contentDescription = null, modifier = Modifier.size(40.dp).clip(RoundedCornerShape(4.dp)), contentScale = ContentScale.Crop)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(stringResource(Res.string.image_attachment), style = MaterialTheme.typography.bodyMedium, color = if (isDarkMode) Color.White else Color.Black)
                                            }
                                        } else if (message.mediaUrl?.endsWith(".mp4") == true) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text("🎥", fontSize = 24.sp)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(stringResource(Res.string.video_attachment), style = MaterialTheme.typography.bodyMedium, color = if (isDarkMode) Color.White else Color.Black)
                                            }
                                        } else if (message.mediaUrl?.endsWith(".pdf") == true || message.mediaUrl?.endsWith(".doc") == true || message.mediaUrl?.endsWith(".docx") == true) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text("📄", fontSize = 24.sp)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(stringResource(Res.string.document_attachment), style = MaterialTheme.typography.bodyMedium, color = if (isDarkMode) Color.White else Color.Black)
                                            }
                                        } else if (message.mediaUrl?.endsWith(".mp3") == true) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text("🎤", fontSize = 24.sp)
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text("Voice Note", style = MaterialTheme.typography.bodyMedium, color = if (isDarkMode) Color.White else Color.Black)
                                            }
                                        } else {
                                            Text(message.text, style = MaterialTheme.typography.bodyMedium, color = if (isDarkMode) Color.White else Color.Black)
                                        }
                                        Text(message.createdAt ?: "", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                                        HorizontalDivider(modifier = Modifier.padding(top = 4.dp))
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showSearchPopup = false }) { Text(stringResource(Res.string.close)) }
                }
            )
        }

        if (showDatePicker) {
            val datePickerState = androidx.compose.material3.rememberDatePickerState()
            androidx.compose.material3.DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        val selectedMillis = datePickerState.selectedDateMillis
                        if (selectedMillis != null) {
                            val instant = kotlinx.datetime.Instant.fromEpochMilliseconds(selectedMillis)
                            val localDate = instant.toLocalDateTime(kotlinx.datetime.TimeZone.currentSystemDefault()).date
                            selectedDateFilter = localDate.toString()
                        } else {
                            selectedDateFilter = null
                        }
                        showDatePicker = false
                    }) { Text(stringResource(Res.string.ok)) }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false; selectedDateFilter = null }) { Text(stringResource(Res.string.clear)) }
                }
            ) {
                androidx.compose.material3.DatePicker(state = datePickerState)
            }
        }

        if (showAttachmentPopup) {
            AlertDialog(
                onDismissRequest = { showAttachmentPopup = false },
                containerColor = if (isDarkMode) Color.Black else Color.White,
                title = { Text(stringResource(Res.string.share_media), color = if (isDarkMode) Color.White else Color.Black) },
                text = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable {
                            showAttachmentPopup = false
                            galleryLauncher()
                        }) {
                            androidx.compose.foundation.Image(
                                painter = org.jetbrains.compose.resources.painterResource(Res.drawable.image_new),
                                contentDescription = "Image",
                                modifier = Modifier.size(40.dp),
                                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(Color(0xFFFFA500)) // Orange
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(stringResource(Res.string.image), color = if (isDarkMode) Color.White else Color.Black)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable {
                            showAttachmentPopup = false
                            showVideoSourceDialog = true
                        }) {
                            androidx.compose.foundation.Image(
                                painter = org.jetbrains.compose.resources.painterResource(Res.drawable.clapperboard),
                                contentDescription = "Video",
                                modifier = Modifier.size(40.dp),
                                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDarkMode) Color.White else Color.Black)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(stringResource(Res.string.tab_video), color = if (isDarkMode) Color.White else Color.Black)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable {
                            showAttachmentPopup = false
                            documentLauncher()
                        }) {
                            Text("📄", fontSize = 40.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(stringResource(Res.string.document), color = if (isDarkMode) Color.White else Color.Black)
                        }
                    }
                },
                confirmButton = { TextButton(onClick = { showAttachmentPopup = false }) { Text(stringResource(Res.string.cancel), color = if (isDarkMode) Color.White else Color.Black) } }
            )
        }

        if (showMessageOptions != null) {
            AlertDialog(
                onDismissRequest = { showMessageOptions = null },
                modifier = Modifier.width(200.dp), // Reduce size
                containerColor = if (isDarkMode) Color.Black else Color.White,
                title = { Text(stringResource(Res.string.options), fontSize = 16.sp, color = if (isDarkMode) Color.White else Color.Black) },
                text = {
                    Column {
                        TextButton(onClick = { replyReference = showMessageOptions; showMessageOptions = null }) { 
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                androidx.compose.foundation.Image(org.jetbrains.compose.resources.painterResource(Res.drawable.reply), contentDescription = "Reply", modifier = Modifier.size(16.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(MaterialTheme.colorScheme.primary))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(stringResource(Res.string.reply), color = MaterialTheme.colorScheme.primary) 
                            }
                        }
                        TextButton(onClick = { showMessageOptions = null }) { Text(stringResource(Res.string.forward_message), color = if (isDarkMode) Color.White else Color.Black) }
                        TextButton(onClick = { 
                            val msg = showMessageOptions
                            if (msg != null) {
                                messages = messages.filter { it.id != msg.id }
                                scope.launch {
                                    try {
                                        com.nephclick.eyefield.Supabase.deleteChatMessage(msg.id)
                                    } catch(e: Exception) {}
                                }
                            }
                            showMessageOptions = null 
                        }) { Text(stringResource(Res.string.delete_message), color = MaterialTheme.colorScheme.error) }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showMessageOptions = null }) { Text(stringResource(Res.string.cancel)) }
                }
            )
        }

        if (showClearConfirmation) {
            AlertDialog(
                onDismissRequest = { showClearConfirmation = false; clearConfirmationText = "" },
                title = { Text(stringResource(Res.string.clear_messages)) },
                text = {
                    Column {
                        Text(stringResource(Res.string.type_clear_message_confirm))
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = clearConfirmationText,
                            onValueChange = { clearConfirmationText = it },
                            placeholder = { Text(stringResource(Res.string.clear_message_prompt)) }
                        )
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            if (clearConfirmationText == "Clear Message") {
                                // Execute clear messages logic here
                                messages = emptyList()
                                showClearConfirmation = false
                                clearConfirmationText = ""
                            }
                        },
                        enabled = clearConfirmationText == "Clear Message"
                    ) {
                        Text(stringResource(Res.string.confirm), color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showClearConfirmation = false; clearConfirmationText = "" }) {
                        Text(stringResource(Res.string.cancel))
                    }
                }
            )
        }

        if (showImageSourceDialog) {
            AlertDialog(
                onDismissRequest = { showImageSourceDialog = false },
                title = { Text(stringResource(Res.string.select_image_source)) },
                text = {
                    Column {
                        TextButton(onClick = { showImageSourceDialog = false; cameraLauncher() }) { Text(stringResource(Res.string.camera)) }
                        TextButton(onClick = { showImageSourceDialog = false; galleryLauncher() }) { Text(stringResource(Res.string.gallery)) }
                    }
                },
                confirmButton = { TextButton(onClick = { showImageSourceDialog = false }) { Text(stringResource(Res.string.cancel)) } }
            )
        }

        if (showVideoSourceDialog) {
            AlertDialog(
                onDismissRequest = { showVideoSourceDialog = false },
                title = { Text(stringResource(Res.string.select_video_source)) },
                text = {
                    Column {
                        TextButton(onClick = { showVideoSourceDialog = false; videoCameraLauncher() }) { Text(stringResource(Res.string.camera)) }
                        TextButton(onClick = { showVideoSourceDialog = false; videoGalleryLauncher() }) { Text(stringResource(Res.string.gallery)) }
                    }
                },
                confirmButton = { TextButton(onClick = { showVideoSourceDialog = false }) { Text(stringResource(Res.string.cancel)) } }
            )
        }

        if (fullScreenImageUrl != null) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { fullScreenImageUrl = null }) {
                Box(modifier = Modifier.fillMaxSize().background(Color.Black).clickable { fullScreenImageUrl = null }, contentAlignment = Alignment.Center) {
                    AsyncImage(
                        model = fullScreenImageUrl,
                        contentDescription = stringResource(Res.string.full_screen_image),
                        modifier = Modifier.fillMaxWidth().wrapContentHeight()
                    )
                }
            }
        }

        if (showReportDialog) {
            val reasons = listOf(
                stringResource(Res.string.reason_fraud),
                stringResource(Res.string.reason_offensive),
                stringResource(Res.string.reason_scammer),
                stringResource(Res.string.reason_illegal),
                stringResource(Res.string.custom)
            )
            AlertDialog(
                onDismissRequest = { showReportDialog = false },
                title = { Text(stringResource(Res.string.report_user_title)) },
                text = {
                    Column {
                        Text(stringResource(Res.string.why_report_user))
                        Spacer(modifier = Modifier.height(8.dp))
                        Box {
                            OutlinedTextField(
                                value = reportReason.ifBlank { stringResource(Res.string.reason_fraud) },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth().clickable { showReasonDropdown = true },
                                trailingIcon = { Text("▼") }
                            )
                            DropdownMenu(expanded = showReasonDropdown, onDismissRequest = { showReasonDropdown = false }) {
                                reasons.forEach { r ->
                                    DropdownMenuItem(text = { Text(r) }, onClick = { reportReason = r; showReasonDropdown = false })
                                }
                            }
                        }
                        if (reportReason == stringResource(Res.string.custom)) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = customReportReason,
                                onValueChange = { customReportReason = it },
                                placeholder = { Text(stringResource(Res.string.enter_custom_reason)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                        if (currentUserId != null) {
                            scope.launch {
                                Supabase.createUserReport(com.nephclick.eyefield.models.UserReport(
                                    reporterId = currentUserId,
                                    reportedUserId = otherUser.id,
                                    reason = reportReason.ifBlank { "Fraud, Impersonation, or Fake Account" },
                                    customReason = if (reportReason == "Custom") customReportReason else null
                                ))
                                showReportDialog = false
                                reportReason = ""
                                customReportReason = ""
                                showReportToast = true
                            }
                        }
                    }) {
                        Text(stringResource(Res.string.submit), color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showReportDialog = false }) {
                        Text(stringResource(Res.string.cancel))
                    }
                }
            )
        }
        
        if (showReportToast) {
            LaunchedEffect(showReportToast) {
                kotlinx.coroutines.delay(3000)
                showReportToast = false
            }
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                Surface(
                    color = Color.Black.copy(alpha = 0.8f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.padding(bottom = 80.dp)
                ) {
                    Text(stringResource(Res.string.report_thanks), color = Color.White, modifier = Modifier.padding(16.dp))
                }
            }
        }
    }
}
