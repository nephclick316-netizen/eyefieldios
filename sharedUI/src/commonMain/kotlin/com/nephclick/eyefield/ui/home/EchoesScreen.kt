package com.nephclick.eyefield.ui.home

import org.jetbrains.compose.resources.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import androidx.compose.ui.window.Dialog
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.displayName
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.MediaItem
import com.nephclick.eyefield.models.Post
import com.nephclick.eyefield.models.Pulse
import com.nephclick.eyefield.models.PostComment
import com.nephclick.eyefield.models.PostReport
import com.nephclick.eyefield.utils.R2Uploader
import com.nephclick.eyefield.utils.compressImage
import com.nephclick.eyefield.utils.rememberCameraLauncher
import com.nephclick.eyefield.utils.rememberGalleryLauncher
import com.nephclick.eyefield.utils.rememberMediaGalleryLauncher
import com.nephclick.eyefield.utils.shareText
import io.github.jan.supabase.auth.auth
import androidx.compose.foundation.Image
import coil3.compose.AsyncImage
import coil3.compose.SubcomposeAsyncImage
import org.jetbrains.compose.resources.painterResource
import com.nephclick.eyefield.ui.auth.LoginScreen
import com.nephclick.eyefield.ui.profile.ProfileScreen
import eyefield.sharedui.generated.resources.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.plus
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.LinearEasing
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.focus.onFocusChanged

class EchoesScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val isDark = androidx.compose.foundation.isSystemInDarkTheme()
        val themeColors = if (isDark) {
            darkColorScheme(
                background = Color(0xFF0F111A),
                surface = Color(0xFF1B1D29),
                onBackground = Color.White,
                onSurface = Color.White,
                primary = Color(0xFF151943),
                onPrimary = Color.White,
                secondary = Color(0xFF1A1FCD)
            )
        } else {
            lightColorScheme(
                background = Color(0xFFF5F7FA),
                surface = Color.White,
                onBackground = Color.Black,
                onSurface = Color.Black,
                primary = Color(0xFFE8EAF6),
                onPrimary = Color.Black,
                secondary = Color(0xFF1A1FCD)
            )
        }

        var currentUserProfile by remember { mutableStateOf<Profile?>(null) }
        val navigator = LocalNavigator.current
        var showNotifications by remember { mutableStateOf(false) }
        var showAddPulseDialog by remember { mutableStateOf(false) }
        var showPulseViewer by remember { mutableStateOf(false) }
        var showFilterDropdown by remember { mutableStateOf(false) }
        var showAddPostDialog by remember { mutableStateOf(false) }

        // Functional state
        var posts by remember { mutableStateOf<List<Post>>(Supabase.cachedPosts ?: emptyList()) }
        var pulses by remember { mutableStateOf<List<Pulse>>(Supabase.cachedPulses ?: emptyList()) }
        var notifications by remember { mutableStateOf<List<com.nephclick.eyefield.models.Notification>>(emptyList()) }
        var showReportToast by remember { mutableStateOf(false) }
        var searchQuery by remember { mutableStateOf("") }
        var selectedFilter by remember { mutableStateOf("All") }
        var isLoading by remember { mutableStateOf(true) }
        val scope = rememberCoroutineScope()
        var currentUserId by remember { mutableStateOf("") }

        // Pulse viewer state
        var selectedPulseIndex by remember { mutableStateOf(0) }
        var selectedPulses by remember { mutableStateOf<List<Pulse>>(emptyList()) }
        var gridColumns by remember { mutableStateOf(2) }

        // Add Post form state
        val postMediaUrls = remember { mutableStateListOf<String>() }
        var postCaption by remember { mutableStateOf("") }
        var postLocation by remember { mutableStateOf("") }
        var postLinkUrl by remember { mutableStateOf("") }
        var postHashtags by remember { mutableStateOf("") }

        // Add Pulse form state
        var pulseMediaUrl by remember { mutableStateOf<String?>(null) }
        var pulseLinkUrl by remember { mutableStateOf("") }
        var showPostImageSourceDialog by remember { mutableStateOf(false) }
        var showPulseImageSourceDialog by remember { mutableStateOf(false) }
        var isUploadingPost by remember { mutableStateOf(false) }
        var isUploadingPulse by remember { mutableStateOf(false) }
        // per-slot upload progress for post media (supports up to 3 concurrent slots)
        val postUploadProgresses = remember { mutableStateListOf<Float>() }
        var pulseUploadProgress by remember { mutableStateOf(0f) }

        var showTrimmerDialog by remember { mutableStateOf(false) }
        var videoToTrim by remember { mutableStateOf<ByteArray?>(null) }

        val handlePostMediaPicked: (ByteArray?, String?) -> Unit = { bytes, ext ->
            if (bytes != null) {
                if (ext == "mp4") {
                    videoToTrim = bytes
                    showTrimmerDialog = true
                } else {
                    // Offload compression and upload to IO so the UI thread is not blocked
                    scope.launch(kotlinx.coroutines.Dispatchers.IO) {
                        // register a new progress slot
                        val slotIndex = kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                            postUploadProgresses.add(0f); postUploadProgresses.lastIndex
                        } }
                        try {
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingPost = true }
                            val compressed = compressImage(bytes)
                            val url = R2Uploader.uploadMedia(compressed, "post", "image/jpeg", "jpg") { sent, total ->
                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { postUploadProgresses[slotIndex] = pct } }
                            }
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                if (postMediaUrls.size < 3) postMediaUrls.add(url)
                                postUploadProgresses[slotIndex] = 1f
                            }
                        } catch (e: Exception) {
                            println("Post upload failed: ${e.message}")
                            kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { postUploadProgresses[slotIndex] = 0f } }
                        } finally {
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingPost = postUploadProgresses.any { it in 0f..0.999f } }
                        }
                    }
                }
            }
        }

        val handlePulseImagePicked: (ByteArray?) -> Unit = { bytes ->
            if (bytes != null) {
                // Offload compression and upload to IO
                scope.launch(kotlinx.coroutines.Dispatchers.IO) {
                    try {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingPulse = true; pulseUploadProgress = 0f }
                        val compressed = compressImage(bytes)
                        val url = R2Uploader.uploadMedia(compressed, "pulse", "image/jpeg", "jpg") { sent, total ->
                            val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                            kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { pulseUploadProgress = pct } }
                        }
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { pulseMediaUrl = url; pulseUploadProgress = 1f }
                    } catch (e: Exception) {
                        println("Pulse upload failed: ${e.message}")
                    } finally {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingPulse = false }
                    }
                }
            }
        }

        val postCameraLauncher = rememberCameraLauncher(onImagePicked = { handlePostMediaPicked(it, "jpg") })
        val postVideoCameraLauncher = com.nephclick.eyefield.utils.rememberVideoCameraLauncher(onVideoPicked = handlePostMediaPicked)
        val postImageGalleryLauncher = rememberGalleryLauncher(onImagePicked = { handlePostMediaPicked(it, "jpg") })
        val postVideoGalleryLauncher = com.nephclick.eyefield.utils.rememberVideoGalleryLauncher(onVideoPicked = handlePostMediaPicked)
        val pulseCameraLauncher = rememberCameraLauncher(onImagePicked = handlePulseImagePicked)
        val pulseGalleryLauncher = rememberGalleryLauncher(onImagePicked = handlePulseImagePicked)

        // Fetch data on load
        LaunchedEffect(Unit) {
            try {
                val cachedPosts = com.nephclick.eyefield.utils.PersistentCache.getString("cached_echoes_posts")
                if (!cachedPosts.isNullOrEmpty()) {
                    try { posts = kotlinx.serialization.json.Json.decodeFromString(cachedPosts) } catch(e: Exception) {}
                }
                val cachedPulses = com.nephclick.eyefield.utils.PersistentCache.getString("cached_echoes_pulses")
                if (!cachedPulses.isNullOrEmpty()) {
                    try { pulses = kotlinx.serialization.json.Json.decodeFromString(cachedPulses) } catch(e: Exception) {}
                }

                val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                if (userId != null) {
                    currentUserId = userId
                    currentUserProfile = Supabase.fetchProfile(userId)
                    notifications = Supabase.fetchNotifications(userId)
                }
                
                try {
                        val freshPosts = Supabase.fetchPosts()
                        posts = freshPosts
                        com.nephclick.eyefield.utils.PersistentCache.saveString("cached_posts", kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.builtins.ListSerializer(com.nephclick.eyefield.models.Post.serializer()), freshPosts.take(3)))
                    } catch (e: Exception) {}

                try {
                    val freshPulses = Supabase.fetchPulses()
                    pulses = freshPulses
                    com.nephclick.eyefield.utils.PersistentCache.saveString("cached_echoes_pulses", kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.builtins.ListSerializer(com.nephclick.eyefield.models.Pulse.serializer()), freshPulses.take(3)))
                } catch(e: Exception) {}

            } catch(e: Exception) {
                // Ignore or handle offline error
            } finally {
                isLoading = false
            }
        }

        // Re-fetch when search or filter changes
        LaunchedEffect(searchQuery, selectedFilter) {
            delay(300) // debounce
            try {
                val allPosts = Supabase.fetchPosts(searchQuery.ifBlank { null })
                posts = when (selectedFilter) {
                    "Most liked" -> allPosts.sortedByDescending { it.emojisCount + it.applauseCount }
                    "Trending" -> allPosts.sortedByDescending { it.commentsCount + it.emojisCount + it.applauseCount }
                    "Places" -> allPosts.filter { !it.location.isNullOrBlank() }
                    "Video" -> allPosts.filter { it.mediaUrls.any { m -> m.type == "video" } }
                    "Image only" -> allPosts.filter { it.mediaUrls.all { m -> m.type == "image" } && it.mediaUrls.isNotEmpty() }
                    else -> allPosts
                }
            } catch(e: Exception) {
                // Offline or error
            }
        }

        MaterialTheme(colorScheme = themeColors) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                topBar = {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "EyeField",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black, fontSize = 24.sp),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surface,
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color.DarkGray)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp).clickable { /* navigator?.push(AiScreen()) */ },
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Image(painterResource(Res.drawable.ai_robot), contentDescription = "Endocard", modifier = Modifier.size(16.dp), colorFilter = ColorFilter.tint(Color(0xFFFF9800)))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("ENDOCARD", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Color(0xFFFF9800))
                                }
                            }
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.surface,
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color.DarkGray),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().clickable { showNotifications = true }) {
                                    Image(painterResource(Res.drawable.bell), contentDescription = "Bell", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurface))
                                    DropdownMenu(
                                        expanded = showNotifications,
                                        onDismissRequest = { showNotifications = false }
                                    ) {
                                        Text(stringResource(Res.string.notifications), modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), fontWeight = FontWeight.Bold)
                                        HorizontalDivider()
                                        if (notifications.isEmpty()) {
                                            Text(stringResource(Res.string.no_new_notifications), modifier = Modifier.padding(16.dp), color = Color.Gray)
                                        } else {
                                            Column(modifier = Modifier.width(300.dp).heightIn(max = 400.dp)) {
                                                notifications.forEach { notification ->
                                                    DropdownMenuItem(
                                                        text = {
                                                            Column {
                                                                Text(notification.title, fontWeight = FontWeight.Bold)
                                                                Text(notification.message, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                                            }
                                                        },
                                                        onClick = { showNotifications = false }
                                                    )
                                                    HorizontalDivider()
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (isUploadingPost || isUploadingPulse) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    val pct = when {
                                        isUploadingPost -> ((postUploadProgresses.maxOrNull() ?: 0f) * 100).toInt()
                                        isUploadingPulse -> (pulseUploadProgress * 100).toInt()
                                        else -> 0
                                    }
                                    CircularProgressIndicator(progress = when {
                                        isUploadingPost -> (postUploadProgresses.maxOrNull() ?: 0f)
                                        isUploadingPulse -> pulseUploadProgress
                                        else -> 0f
                                    }, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Uploading $pct%", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                        }
                    }
                }
            ) { paddingValues ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(0.dp)
                    ) {
                        // Title
                        item {
                            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                                Text(stringResource(Res.string.echoes), style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.ExtraBold, fontSize = 36.sp), color = MaterialTheme.colorScheme.onBackground)
                                Text(stringResource(Res.string.share_your_pulse), style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                            }
                        }

                        // Pulse Row
                        item {
                            LazyRow(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // Add Pulse Button
                                item {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(90.dp)) {
                                        Box(modifier = Modifier.width(90.dp).height(120.dp).clip(RoundedCornerShape(12.dp))) {
                                            if (currentUserProfile?.avatarUrl != null) {
                                                AsyncImage(
                                                    model = currentUserProfile!!.avatarUrl,
                                                    contentDescription = "Your Pulse",
                                                    modifier = Modifier.fillMaxSize(),
                                                    contentScale = ContentScale.Crop
                                                )
                                            } else {
                                                Box(modifier = Modifier.fillMaxSize().background(Color.Gray))
                                            }
                                            Box(
                                                modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.3f)).clickable { 
                                                    if (currentUserId.isNotBlank()) showAddPulseDialog = true else navigator?.push(LoginScreen())
                                                },
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Image(painterResource(Res.drawable.image_gallery), contentDescription = "Add", modifier = Modifier.size(24.dp).alpha(0.9f))
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(stringResource(Res.string.your_pulse), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onBackground)
                                    }
                                }

                                // Real pulses grouped by user
                                val pulsesByUser = pulses.groupBy { it.userId }
                                items(pulsesByUser.entries.toList()) { (userId, userPulses) ->
                                    var profile by remember { mutableStateOf<Profile?>(null) }
                                    LaunchedEffect(userId) {
                                        profile = Supabase.fetchProfile(userId)
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(90.dp).clickable {
                                        selectedPulses = userPulses
                                        selectedPulseIndex = 0
                                        showPulseViewer = true
                                    }) {
                                        Box(
                                            modifier = Modifier.width(90.dp).height(120.dp).clip(RoundedCornerShape(12.dp)).border(2.dp, Color(0xFF1A1FCD), RoundedCornerShape(12.dp))
                                        ) {
                                            val lastPulse = userPulses.firstOrNull()
                                            if (lastPulse?.mediaUrl != null) {
                                                AsyncImage(
                                                    model = lastPulse.mediaUrl,
                                                    contentDescription = "Pulse preview",
                                                    modifier = Modifier.fillMaxSize(),
                                                    contentScale = ContentScale.Crop
                                                )
                                            } else if (profile?.avatarUrl != null) {
                                                AsyncImage(
                                                    model = profile!!.avatarUrl,
                                                    contentDescription = profile?.username,
                                                    modifier = Modifier.fillMaxSize(),
                                                    contentScale = ContentScale.Crop
                                                )
                                            } else {
                                                Box(modifier = Modifier.fillMaxSize().background(Color.Gray))
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("@${profile?.username ?: profile?.fullName?.replace(" ", "")?.lowercase() ?: "user"}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onBackground, maxLines = 1)
                                    }
                                }
                            }
                        }

                        // Search Bar + FAB
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                OutlinedTextField(
                                    value = searchQuery,
                                    onValueChange = { searchQuery = it },
                                    placeholder = { Text(stringResource(Res.string.search_echoes), color = Color.Gray) },
                                    modifier = Modifier.weight(1f).height(52.dp),
                                    shape = RoundedCornerShape(16.dp),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = MaterialTheme.colorScheme.primary,
                                        unfocusedContainerColor = MaterialTheme.colorScheme.primary,
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedBorderColor = Color.Transparent,
                                        focusedTextColor = MaterialTheme.colorScheme.onPrimary,
                                        unfocusedTextColor = MaterialTheme.colorScheme.onPrimary
                                    ),
                                    trailingIcon = {
                                        Box {
                                            IconButton(onClick = { showFilterDropdown = true }) {
                                                Image(painterResource(Res.drawable.setting), contentDescription = "Filter", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimary))
                                            }
                                            DropdownMenu(expanded = showFilterDropdown, onDismissRequest = { showFilterDropdown = false }) {
                                                listOf("All", "Most liked", "Trending", "Places", "Video", "Image only").forEach { filter ->
                                                    DropdownMenuItem(
                                                        text = {
                                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                                Text(filter, fontWeight = if (filter == selectedFilter) FontWeight.Bold else FontWeight.Normal)
                                                                if (filter == selectedFilter) {
                                                                    Spacer(modifier = Modifier.width(8.dp))
                                                                    Text("✓", color = MaterialTheme.colorScheme.secondary)
                                                                }
                                                            }
                                                        },
                                                        onClick = { selectedFilter = filter; showFilterDropdown = false }
                                                    )
                                                }
                                            }
                                        }
                                    }
                                )

                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = MaterialTheme.colorScheme.secondary,
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize().clickable { 
                                        if (currentUserId.isNotBlank()) showAddPostDialog = true else navigator?.push(LoginScreen())
                                    }) {
                                        Text("+", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Light)
                                    }
                                }
                            }
                        }

                        // Loading indicator
                        if (isLoading) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = MaterialTheme.colorScheme.secondary)
                                }
                            }
                        }

                        // Feed List
                        item { Spacer(modifier = Modifier.height(16.dp)) }

                        if (posts.isEmpty() && !isLoading) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                    Text(stringResource(Res.string.no_echoes_yet), color = Color.Gray)
                                }
                            }
                        }

                        val visiblePosts = posts.filter { it.id !in com.nephclick.eyefield.utils.GlobalState.hiddenPostIds.value }
                        items(visiblePosts, key = { it.id }) { post ->
                            EchoPost(
                                post = post,
                                currentUserId = currentUserId,
                                allPosts = posts,
                                onReported = { showReportToast = true },
                                onRefresh = {
                                    scope.launch {
                                        try {
                                            posts = Supabase.fetchPosts(searchQuery.ifBlank { null })
                                        } catch(e: Exception) {}
                                    }
                                }
                            )
                        }
                    }
                }
            }

            // ======= DIALOGS =======

            // Add Pulse Dialog
            if (showAddPulseDialog) {
                Dialog(onDismissRequest = {
                    showAddPulseDialog = false
                    pulseMediaUrl = null
                    pulseLinkUrl = ""
                }) {
                    Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(stringResource(Res.string.add_pulse), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Spacer(modifier = Modifier.height(16.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(140.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                                    .border(1.dp, Color.Gray, RoundedCornerShape(16.dp))
                                    .clickable {
                                        if (!isUploadingPulse) {
                                            showPulseImageSourceDialog = true
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                if (pulseMediaUrl != null) {
                                    AsyncImage(
                                        model = pulseMediaUrl,
                                        contentDescription = "Pulse media",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else if (isUploadingPulse) {
                                    CircularProgressIndicator()
                                } else {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Image(painterResource(Res.drawable.image_custom), contentDescription = "Upload", modifier = Modifier.size(32.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurface))
                                        Text(stringResource(Res.string.upload_pulse_media), style = MaterialTheme.typography.labelSmall, color = Color.Gray, modifier = Modifier.padding(top = 8.dp))
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            OutlinedTextField(
                                value = pulseLinkUrl,
                                onValueChange = { pulseLinkUrl = it },
                                placeholder = { Text(stringResource(Res.string.share_url_link)) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            Button(
                                onClick = {
                                    scope.launch {
                                        try {
                                            val mediaUrl = pulseMediaUrl
                                            if (currentUserId.isBlank() || mediaUrl.isNullOrBlank()) {
                                                println("Pulse requires a signed-in user and one uploaded media file")
                                                return@launch
                                            }

                                            Supabase.createPulse(
                                                Pulse(
                                                    userId = currentUserId,
                                                    mediaUrl = mediaUrl,
                                                    mediaType = "image",
                                                    linkUrl = pulseLinkUrl.ifBlank { null },
                                                    caption = null,
                                                    expiresAt = Clock.System.now().plus(24, DateTimeUnit.HOUR).toString()
                                                )
                                            )

                                            pulseMediaUrl = null
                                            pulseLinkUrl = ""
                                            showAddPulseDialog = false
                                            try {
                                                if (currentUserProfile != null) {
                                                    pulses = Supabase.fetchPulses()
                                                    notifications = Supabase.fetchNotifications(currentUserProfile!!.id)
                                                }
                                            } catch (e: Exception) {
                                                println("Error fetching pulses or notifications: ${e.message}")
                                            }
                                        } catch(e: Exception) {}
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = RoundedCornerShape(24.dp),
                                enabled = !isUploadingPulse && pulseMediaUrl != null,
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Text(stringResource(Res.string.share_pulse), color = Color.White)
                            }
                        }
                    }
                }
            }

            if (showTrimmerDialog && videoToTrim != null) {
                Dialog(onDismissRequest = { showTrimmerDialog = false; videoToTrim = null }) {
                    Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(stringResource(Res.string.trim_video), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            Spacer(modifier = Modifier.height(16.dp))
                            Box(modifier = Modifier.fillMaxWidth().height(200.dp).background(Color.Black), contentAlignment = Alignment.Center) {
                                Text(stringResource(Res.string.video_preview), color = Color.White)
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            var sliderPosition by remember { mutableStateOf(0f..100f) }
                            RangeSlider(
                                value = sliderPosition,
                                onValueChange = { sliderPosition = it },
                                valueRange = 0f..100f,
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                TextButton(onClick = { showTrimmerDialog = false; videoToTrim = null }) { Text(stringResource(Res.string.cancel)) }
                                Button(
                                    onClick = {
                                        showTrimmerDialog = false
                                        // Offload video upload to IO
                                        scope.launch {
                                            try {
                                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploadingPost = true }
                                                val url = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                                                    R2Uploader.uploadMedia(videoToTrim!!, "post", "video/mp4", "mp4")
                                                }
                                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                                    if (postMediaUrls.size < 3) postMediaUrls.add(url)
                                                }
                                            } catch (e: Exception) {
                                                println("Upload failed: ${e.message}")
                                            } finally {
                                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                                    isUploadingPost = false
                                                    videoToTrim = null
                                                }
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                                ) { Text(stringResource(Res.string.trim_and_upload), color = Color.White) }
                            }
                        }
                    }
                }
            }

            if (showPulseImageSourceDialog) {
                AlertDialog(
                    onDismissRequest = { showPulseImageSourceDialog = false },
                    title = { Text(stringResource(Res.string.select_pulse_media_source)) },
                    text = { Text(stringResource(Res.string.where_to_pick_pulse_media)) },
                    confirmButton = {
                        TextButton(onClick = {
                            showPulseImageSourceDialog = false
                            pulseCameraLauncher()
                        }) { Text(stringResource(Res.string.camera)) }
                    },
                    dismissButton = {
                        TextButton(onClick = {
                            showPulseImageSourceDialog = false
                            pulseGalleryLauncher()
                        }) { Text(stringResource(Res.string.gallery)) }
                    }
                )
            }

            // Pulse Viewer
            if (showPulseViewer && selectedPulses.isNotEmpty()) {
                Dialog(
                    onDismissRequest = { showPulseViewer = false },
                    properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
                ) {
                    var pulseMessage by remember { mutableStateOf("") }
                    var isPaused by remember { mutableStateOf(false) }
                    val currentPulse = selectedPulses[selectedPulseIndex]
                    val uriHandler = LocalUriHandler.current
                    val progressAnim = remember(selectedPulseIndex) { Animatable(0f) }

                    LaunchedEffect(selectedPulseIndex, isPaused) {
                        if (!isPaused) {
                            val remainingDuration = (5000 * (1f - progressAnim.value)).toInt()
                            if (remainingDuration > 0) {
                                progressAnim.animateTo(
                                    targetValue = 1f,
                                    animationSpec = tween(remainingDuration, easing = LinearEasing)
                                )
                            }
                        } else {
                            progressAnim.stop()
                        }
                    }

                    LaunchedEffect(progressAnim.value) {
                        if (progressAnim.value >= 1f) {
                            if (selectedPulseIndex < selectedPulses.size - 1) {
                                selectedPulseIndex++
                            } else {
                                showPulseViewer = false
                            }
                        }
                    }

                    Box(modifier = Modifier.fillMaxSize().background(Color.Black).pointerInput(Unit) {
                        detectTapGestures(
                            onPress = {
                                isPaused = true
                                tryAwaitRelease()
                                isPaused = false
                            }
                        )
                    }) {
                        if (currentPulse.mediaUrl != null) {
                            AsyncImage(
                                model = currentPulse.mediaUrl,
                                contentDescription = "Pulse image",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        // Progress bars
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 16.dp, start = 8.dp, end = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            selectedPulses.forEachIndexed { index, _ ->
                                Box(modifier = Modifier.weight(1f).height(2.dp).background(Color.Gray.copy(alpha = 0.5f))) {
                                    if (index < selectedPulseIndex) {
                                        Box(modifier = Modifier.fillMaxSize().background(Color.White))
                                    } else if (index == selectedPulseIndex) {
                                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(progressAnim.value).background(Color.White))
                                    }
                                }
                            }
                        }

                        // Header (User info + close)
                        var pulseProfile by remember(currentPulse.userId) { mutableStateOf<Profile?>(null) }
                        LaunchedEffect(currentPulse.userId) { pulseProfile = Supabase.fetchProfile(currentPulse.userId) }
                        
                        Row(modifier = Modifier.fillMaxWidth().padding(top = 32.dp, start = 16.dp, end = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Row(modifier = Modifier.weight(1f).clickable {
                                showPulseViewer = false
                                navigator?.push(ProfileScreen(currentPulse.userId))
                            }, verticalAlignment = Alignment.CenterVertically) {
                                if (pulseProfile?.avatarUrl != null) {
                                    AsyncImage(model = pulseProfile!!.avatarUrl, contentDescription = null, modifier = Modifier.size(32.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                                } else {
                                    Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.Gray))
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("@${pulseProfile?.username ?: pulseProfile?.fullName?.replace(" ", "")?.lowercase() ?: "user"}", color = Color.White, style = MaterialTheme.typography.labelMedium)
                            }
                            IconButton(onClick = { showPulseViewer = false }) {
                                Text("X", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }

                        // Link URL display
                        if (!currentPulse.linkUrl.isNullOrBlank()) {
                            Surface(
                                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 80.dp, start = 16.dp, end = 16.dp).clickable {
                                    uriHandler.openUri(currentPulse.linkUrl!!)
                                },
                                color = Color.Black.copy(alpha = 0.6f),
                                shape = RoundedCornerShape(16.dp)
                            ) {
                                Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Icon(painterResource(Res.drawable.location), contentDescription = "Link", modifier = Modifier.size(16.dp), tint = Color.White)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(currentPulse.linkUrl!!, color = Color.White, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                                }
                            }
                        }

                        // Bottom Action Bar
                        var isLiked by remember(currentPulse.id) { mutableStateOf(false) }
                        var likeCount by remember(currentPulse.id) { mutableStateOf(0L) }
                        LaunchedEffect(currentPulse.id) {
                            val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                            if (userId != null) isLiked = Supabase.hasLikedPulse(currentPulse.id, userId)
                            likeCount = Supabase.getPulseLikeCount(currentPulse.id)
                        }

                        Row(
                            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            if (currentPulse.userId != (Supabase.client.auth.currentSessionOrNull()?.user?.id ?: "")) {
                                OutlinedTextField(
                                    value = pulseMessage,
                                    onValueChange = { pulseMessage = it },
                                    placeholder = { Text("Send message", color = if (isDark) Color.Gray else Color.White) },
                                    modifier = Modifier.weight(1f).height(50.dp).onFocusChanged { focusState ->
                                        isPaused = focusState.isFocused
                                    },
                                    shape = RoundedCornerShape(24.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = if (isDark) Color.White else Color.Black.copy(alpha = 0.7f),
                                        unfocusedContainerColor = if (isDark) Color.White else Color.Black.copy(alpha = 0.7f),
                                        unfocusedBorderColor = Color.Transparent,
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedTextColor = if (isDark) Color.Black else Color.White,
                                        focusedTextColor = if (isDark) Color.Black else Color.White
                                    ),
                                    trailingIcon = {
                                        IconButton(onClick = {
                                            if (pulseMessage.isNotBlank()) {
                                                scope.launch {
                                                    val session = Supabase.client.auth.currentSessionOrNull()
                                                    val userId = session?.user?.id
                                                    if (userId != null) {
                                                        val room = Supabase.createOrGetChatRoom(userId, currentPulse.userId)
                                                        val message = com.nephclick.eyefield.models.ChatMessage(
                                                            roomId = room?.id ?: "",
                                                            senderId = userId,
                                                            text = pulseMessage.ifBlank { "Pulse image" },
                                                            mediaUrl = currentPulse.mediaUrl
                                                        )
                                                        Supabase.sendMessage(message)
                                                        pulseMessage = ""
                                                    }
                                                }
                                            }
                                        }) {
                                            Image(painterResource(Res.drawable.send), contentDescription = "Send", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(if (isDark) Color.Black else Color.White))
                                        }
                                    }
                                )
                            }
                            
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier.size(36.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                                        val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                                        if (userId != null) {
                                            scope.launch {
                                                Supabase.togglePulseLike(currentPulse.id, userId)
                                                isLiked = !isLiked
                                                likeCount = Supabase.getPulseLikeCount(currentPulse.id)
                                            }
                                        }
                                    },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Image(
                                        painterResource(Res.drawable.heart), 
                                        contentDescription = "Like Pulse", 
                                        modifier = Modifier.size(24.dp), 
                                        colorFilter = ColorFilter.tint(if (isLiked) Color.Red else Color.White)
                                    )
                                }
                                Text("$likeCount", color = Color.White, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }

            // Add Post Dialog
            if (showAddPostDialog) {
                Dialog(
                    onDismissRequest = {
                        showAddPostDialog = false
                        postMediaUrls.clear()
                        postCaption = ""
                        postLocation = ""
                        postLinkUrl = ""
                        postHashtags = ""
                    },
                    properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
                ) {
                    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text(stringResource(Res.string.new_post), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                                IconButton(onClick = {
                                    showAddPostDialog = false
                                    postMediaUrls.clear()
                                    postCaption = ""
                                    postLocation = ""
                                    postLinkUrl = ""
                                    postHashtags = ""
                                }) {
                                    Text("X", color = MaterialTheme.colorScheme.onBackground, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                for (i in 0 until 3) {
                                    Box(
                                        modifier = Modifier
                                            .size(80.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(MaterialTheme.colorScheme.surfaceVariant)
                                            .border(1.dp, Color.Gray, RoundedCornerShape(12.dp))
                                            .clickable {
                                                if (i == postMediaUrls.size && postMediaUrls.size < 3 && !isUploadingPost) {
                                                    showPostImageSourceDialog = true
                                                }
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (i < postMediaUrls.size) {
                                            AsyncImage(
                                                model = postMediaUrls[i],
                                                contentDescription = "Uploaded post media",
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop
                                            )
                                        } else if (i == postMediaUrls.size && isUploadingPost) {
                                            // show slot progress if registered
                                            val pct = postUploadProgresses.getOrNull(i) ?: 0f
                                            if (pct > 0f) {
                                                CircularProgressIndicator(progress = pct, modifier = Modifier.size(24.dp))
                                            } else {
                                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                            }
                                        } else if (i == postMediaUrls.size) {
                                            Text("+", style = MaterialTheme.typography.headlineMedium)
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))

                            OutlinedTextField(
                                value = postCaption,
                                onValueChange = { postCaption = it },
                                placeholder = { Text(stringResource(Res.string.whats_on_your_mind)) },
                                modifier = Modifier.fillMaxWidth().height(100.dp),
                                shape = RoundedCornerShape(16.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            OutlinedTextField(
                                value = postLocation,
                                onValueChange = { postLocation = it },
                                placeholder = { Text(stringResource(Res.string.location_place)) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            OutlinedTextField(
                                value = postLinkUrl,
                                onValueChange = { postLinkUrl = it },
                                placeholder = { Text(stringResource(Res.string.url_link)) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                singleLine = true
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            OutlinedTextField(
                                value = postHashtags,
                                onValueChange = { postHashtags = it },
                                placeholder = { Text(stringResource(Res.string.hashtags_comma_separated)) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(16.dp),
                                singleLine = true
                            )

                            Spacer(modifier = Modifier.weight(1f))

                            Button(
                                onClick = {
                                    scope.launch {
                                        try {
                                            if (currentUserId.isBlank()) {
                                                println("You must be signed in to create a post")
                                                return@launch
                                            }
                                            val newPost = Post(
                                                userId = currentUserId,
                                                content = postCaption.ifBlank { null },
                                                mediaUrls = postMediaUrls.map { url -> MediaItem(url = url, type = "image", aspectRatio = 1f) },
                                                location = postLocation.ifBlank { null },
                                                linkUrl = postLinkUrl.ifBlank { null },
                                                hashtags = postHashtags.split(",").map { it.trim() }.filter { it.isNotBlank() }
                                            )
                                            Supabase.createPost(newPost)
                                            postMediaUrls.clear()
                                            postCaption = ""
                                            postLocation = ""
                                            postLinkUrl = ""
                                            postHashtags = ""
                                            showAddPostDialog = false
                                            posts = Supabase.fetchPosts()
                                        } catch(e: Exception) {}
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Text(stringResource(Res.string.post_to_echo), color = Color.White)
                            }
                        }
                    }
                }
            }

            if (showPostImageSourceDialog) {
                androidx.compose.ui.window.Dialog(onDismissRequest = { showPostImageSourceDialog = false }) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isDark) Color.Black else Color.White
                    ) {
                        Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(stringResource(Res.string.select_media_source), color = if (isDark) Color.White else Color.Black, fontSize = 20.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(stringResource(Res.string.upload_video_or_image), color = if (isDark) Color.White.copy(alpha = 0.7f) else Color.Gray, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(24.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.fillMaxWidth()) {
                                Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
                                    Button(
                                        onClick = { showPostImageSourceDialog = false; postImageGalleryLauncher() },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            androidx.compose.foundation.Image(org.jetbrains.compose.resources.painterResource(Res.drawable.image_icon), contentDescription = "Image Gallery", modifier = Modifier.size(48.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDark) Color.White else Color.Black))
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(stringResource(Res.string.image_gallery), color = if (isDark) Color.White else Color.Black)
                                        }
                                    }
                                    Button(
                                        onClick = { showPostImageSourceDialog = false; postVideoGalleryLauncher() },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            androidx.compose.foundation.Image(org.jetbrains.compose.resources.painterResource(Res.drawable.video_lesson), contentDescription = "Video Gallery", modifier = Modifier.size(48.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDark) Color.White else Color.Black))
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(stringResource(Res.string.video_gallery), color = if (isDark) Color.White else Color.Black)
                                        }
                                    }
                                }
                                Row(horizontalArrangement = Arrangement.SpaceEvenly, modifier = Modifier.fillMaxWidth()) {
                                    Button(
                                        onClick = { showPostImageSourceDialog = false; postCameraLauncher() },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            androidx.compose.foundation.Image(org.jetbrains.compose.resources.painterResource(Res.drawable.photo_camera), contentDescription = "Camera", modifier = Modifier.size(48.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDark) Color.White else Color.Black))
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text("Camera", color = if (isDark) Color.White else Color.Black)
                                        }
                                    }
                                    Button(
                                        onClick = { showPostImageSourceDialog = false; postVideoCameraLauncher() },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            androidx.compose.foundation.Image(org.jetbrains.compose.resources.painterResource(Res.drawable.video_lesson), contentDescription = "Video Camera", modifier = Modifier.size(48.dp), colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(if (isDark) Color.White else Color.Black))
                                            Spacer(modifier = Modifier.height(8.dp))
                                            Text(stringResource(Res.string.video_camera), color = if (isDark) Color.White else Color.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
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
                        modifier = Modifier.padding(bottom = 64.dp)
                    ) {
                        Text(stringResource(Res.string.report_thank_you), color = Color.White, modifier = Modifier.padding(16.dp))
                    }
                }
            }
        }
    }

    @Composable
    private fun EchoPost(post: Post, currentUserId: String, allPosts: List<Post>, onReported: () -> Unit, onRefresh: () -> Unit) {
        val navigator = LocalNavigator.current
        val context = LocalPlatformContext()
        var showMenu by remember { mutableStateOf(false) }
        var showReportDialog by remember { mutableStateOf(false) }
        var showFullscreenViewer by remember { mutableStateOf(false) }
        var showComments by remember { mutableStateOf(false) }
        var showEmojiPicker by remember { mutableStateOf(false) }
        var reportReason by remember { mutableStateOf("") }
        var showReasonDropdown by remember { mutableStateOf(false) }
        var customReportReason by remember { mutableStateOf("") }
        var postProfile by remember { mutableStateOf<Profile?>(null) }
        var commentsList by remember { mutableStateOf<List<PostComment>>(emptyList()) }
        var emojisList by remember { mutableStateOf<List<com.nephclick.eyefield.models.PostEmoji>>(emptyList()) }
        var isSaved by remember { mutableStateOf(false) }
        // Live counts — initialized from post data, updated optimistically after user actions
        var localApplauseCount by remember { mutableStateOf(post.applauseCount) }
        var localCommentsCount by remember { mutableStateOf(post.commentsCount) }
        var localEmojisCount by remember { mutableStateOf(post.emojisCount) }
        val checkOutEchoStr = stringResource(Res.string.check_out_echo)
        val scope = rememberCoroutineScope()

        LaunchedEffect(post.userId) {
            try {
                postProfile = Supabase.fetchProfile(post.userId)
                emojisList = Supabase.fetchEmojis(post.id)
                localEmojisCount = emojisList.size
                val savedPosts = Supabase.fetchSavedPosts(currentUserId)
                isSaved = savedPosts.any { it.postId == post.id }
                // Sync live counts from backend
                localApplauseCount = Supabase.getApplauseCount(post.id).toInt()
                localCommentsCount = Supabase.getCommentsCount(post.id).toInt()
            } catch (e: Exception) {}
        }
        
        LaunchedEffect(showComments) {
            if (showComments) {
                try {
                    commentsList = Supabase.fetchComments(post.id)
                    localCommentsCount = commentsList.size
                } catch(e: Exception) {}
            }
        }

        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).clickable { showFullscreenViewer = true }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Header
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Row(
                        modifier = Modifier.weight(1f).clickable { navigator?.push(ProfileScreen(post.userId)) },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (postProfile?.avatarUrl != null) {
                            AsyncImage(
                                model = postProfile!!.avatarUrl,
                                contentDescription = "Avatar",
                                modifier = Modifier.size(40.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                        } else {
                            Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(postProfile?.displayName() ?: "Loading...", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurface)
                            Text("@${postProfile?.username ?: postProfile?.displayName()?.replace(" ", "")?.lowercase() ?: "..."} · ${post.createdAt?.take(10) ?: ""}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        }
                    }
                    Box {
                        IconButton(onClick = { showMenu = true }) {
                            Text("•••", color = Color.Gray)
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            DropdownMenuItem(text = { Text(if (isSaved) stringResource(Res.string.saved) else stringResource(Res.string.save)) }, onClick = {
                                showMenu = false
                                if (currentUserId.isNotBlank()) {
                                    scope.launch {
                                        Supabase.toggleSave(post.id, currentUserId)
                                        isSaved = !isSaved
                                    }
                                } else navigator?.push(LoginScreen())
                            })
                            DropdownMenuItem(text = { Text(stringResource(Res.string.report)) }, onClick = { 
                                showMenu = false
                                if (currentUserId.isNotBlank()) showReportDialog = true else navigator?.push(LoginScreen())
                            })
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Content
                if (!post.content.isNullOrBlank()) {
                    Text(post.content!!, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(12.dp))
                }

                // Media Box — dynamic height based on aspect ratio
                if (post.mediaUrls.isNotEmpty()) {
                    val firstMedia = post.mediaUrls.first()
                    val aspectRatio = firstMedia.aspectRatio.coerceIn(0.5f, 2.5f)
                    val isVideo = firstMedia.url.endsWith(".mp4", ignoreCase = true) || firstMedia.type == "video"
                    Box(modifier = Modifier.fillMaxWidth().aspectRatio(aspectRatio).clip(RoundedCornerShape(16.dp)).background(Color(0xFF2A2C38))) {
                        if (isVideo) {
                            com.nephclick.eyefield.utils.VideoPlayer(
                                url = firstMedia.url,
                                modifier = Modifier.fillMaxSize(),
                                onClick = { showFullscreenViewer = true },
                                autoPlay = !showFullscreenViewer
                            )
                        } else {
                            AsyncImage(
                                model = firstMedia.url,
                                contentDescription = "Post media",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Location
                if (!post.location.isNullOrBlank()) {
                    Text("📍 ${post.location}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Spacer(modifier = Modifier.height(8.dp))
                }

                // Interactions
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        InteractionIcon(Res.drawable.chat, "$localCommentsCount", onClick = { 
                            if (currentUserId.isNotBlank()) showComments = true else navigator?.push(LoginScreen())
                        })
                        InteractionIcon(Res.drawable.applaud, "$localApplauseCount", onClick = {
                            if (currentUserId.isNotBlank()) {
                                scope.launch {
                                    Supabase.toggleApplause(post.id, currentUserId)
                                    localApplauseCount = Supabase.getApplauseCount(post.id).toInt()
                                    onRefresh()
                                }
                            } else navigator?.push(LoginScreen())
                        })
                        
                        if (emojisList.isNotEmpty()) {
                            val topEmojis = emojisList.groupBy { it.emoji }.toList().sortedByDescending { it.second.size }.take(5).map { it.first }
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                topEmojis.forEach { e -> Text(e, fontSize = 14.sp) }
                            }
                        }
                        
                        Box {
                            InteractionIcon(Res.drawable.happy, "$localEmojisCount", onClick = { 
                                if (currentUserId.isNotBlank()) showEmojiPicker = true else navigator?.push(LoginScreen())
                            })
                            DropdownMenu(expanded = showEmojiPicker, onDismissRequest = { showEmojiPicker = false }) {
                                Row(modifier = Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    listOf("❤️", "😂", "👍", "🔥", "😮").forEach { emoji ->
                                        Text(
                                            text = emoji,
                                            fontSize = 20.sp,
                                            modifier = Modifier.clickable {
                                                showEmojiPicker = false
                                                scope.launch {
                                                    Supabase.toggleEmoji(post.id, currentUserId, emoji)
                                                    emojisList = Supabase.fetchEmojis(post.id)
                                                    localEmojisCount = emojisList.size
                                                    onRefresh()
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                    Image(painterResource(Res.drawable.share), contentDescription = stringResource(Res.string.share), modifier = Modifier.size(20.dp).clickable {
                        val shareUrl = "https://eyefield.com/post/${post.id}"
                        shareText(context, "$checkOutEchoStr $shareUrl")
                    }, colorFilter = ColorFilter.tint(Color.Gray))
                }
            }
        }
        
        if (showComments) {
            Dialog(onDismissRequest = { showComments = false }) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, modifier = Modifier.fillMaxHeight(0.6f)) {
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(stringResource(Res.string.comments), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            IconButton(onClick = { showComments = false }) {
                                Text("X", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider()
                        
                        LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(vertical = 12.dp)) {
                            if (commentsList.isEmpty()) {
                                item {
                                    Text(stringResource(Res.string.no_comments_yet), color = Color.Gray, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                }
                            }
                            items(commentsList, key = { it.id }) { comment ->
                                var userProfile by remember { mutableStateOf<Profile?>(null) }
                                LaunchedEffect(comment.userId) {
                                    try {
                                        userProfile = Supabase.fetchProfile(comment.userId)
                                    } catch(e: Exception) {}
                                }
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    if (userProfile?.avatarUrl != null) {
                                        AsyncImage(model = userProfile!!.avatarUrl, contentDescription = null, modifier = Modifier.size(32.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                                    } else {
                                        Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.Gray))
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("@${userProfile?.username ?: "..."}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                        Text(comment.text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                }
                            }
                        }
                        
                        var newCommentText by remember { mutableStateOf("") }
                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = newCommentText,
                                onValueChange = { newCommentText = it },
                                placeholder = { Text(stringResource(Res.string.write_comment)) },
                                modifier = Modifier.weight(1f).height(50.dp),
                                shape = RoundedCornerShape(24.dp)
                            )
                            Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary).clickable {
                                if (newCommentText.isNotBlank() && currentUserId.isNotBlank()) {
                                    val txt = newCommentText
                                    newCommentText = ""
                                    scope.launch {
                                        try {
                                            Supabase.createComment(PostComment(postId = post.id, userId = currentUserId, text = txt))
                                            commentsList = Supabase.fetchComments(post.id)
                                            localCommentsCount = commentsList.size
                                            onRefresh()
                                        } catch(e: Exception) {}
                                    }
                                }
                            }, contentAlignment = Alignment.Center) {
                                Image(painterResource(Res.drawable.send), contentDescription = "Send", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimary))
                            }
                        }
                    }
                }
            }
        }

        // Report Dialog
        if (showReportDialog) {
            val reasons = listOf(
                "Harassment, Bullying, or Hate Speech",
                "Sexual Content or Nudity",
                "Violence or Gore",
                "Privacy Violation or Doxxing",
                "Scam, Phishing, or Financial Fraud",
                "Spam or Misinformation",
                "Custom"
            )
            Dialog(onDismissRequest = { showReportDialog = false }) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(stringResource(Res.string.report_post), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                        Spacer(modifier = Modifier.height(16.dp))
                        Box {
                            OutlinedTextField(
                                value = reportReason.ifBlank { "Harassment, Bullying, or Hate Speech" },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth().clickable { showReasonDropdown = true },
                                trailingIcon = { Text("▼") },
                                label = { Text(stringResource(Res.string.reason)) }
                            )
                            DropdownMenu(expanded = showReasonDropdown, onDismissRequest = { showReasonDropdown = false }) {
                                reasons.forEach { r ->
                                    DropdownMenuItem(text = { Text(r) }, onClick = { reportReason = r; showReasonDropdown = false })
                                }
                            }
                        }
                        if (reportReason == "Custom") {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = customReportReason,
                                onValueChange = { customReportReason = it },
                                placeholder = { Text(stringResource(Res.string.enter_custom_reason)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(onClick = {
                            scope.launch {
                                Supabase.createReport(PostReport(
                                    postId = post.id,
                                    userId = currentUserId,
                                    reason = reportReason.ifBlank { "Harassment, Bullying, or Hate Speech" },
                                    customReason = if (reportReason == "Custom") customReportReason else null
                                ))
                                showReportDialog = false
                                reportReason = ""
                                customReportReason = ""
                                com.nephclick.eyefield.utils.GlobalState.hiddenPostIds.value = com.nephclick.eyefield.utils.GlobalState.hiddenPostIds.value + post.id
                                onReported()
                            }
                        }, modifier = Modifier.align(Alignment.End)) {
                            Text(stringResource(Res.string.send), color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }

        // Fullscreen Viewer
        if (showFullscreenViewer) {
            Dialog(
                onDismissRequest = { showFullscreenViewer = false },
                properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
            ) {
                val listState = androidx.compose.foundation.lazy.rememberLazyListState(initialFirstVisibleItemIndex = allPosts.indexOfFirst { it.id == post.id }.coerceAtLeast(0))
                androidx.compose.foundation.lazy.LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize().background(Color.Black)
                ) {
                    items(allPosts, key = { it.id }) { p ->
                        Box(modifier = Modifier.fillParentMaxSize()) {
                            FullscreenPostContent(
                                post = p,
                                currentUserId = currentUserId,
                                onRefresh = onRefresh,
                                onClose = { showFullscreenViewer = false }
                            )
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun FullscreenPostContent(post: Post, currentUserId: String, onRefresh: () -> Unit, onClose: () -> Unit) {
        val context = LocalPlatformContext()
        val navigator = LocalNavigator.current
        val scope = rememberCoroutineScope()
        var showComments by remember { mutableStateOf(false) }
        var showEmojiPicker by remember { mutableStateOf(false) }
        var commentsList by remember { mutableStateOf<List<PostComment>>(emptyList()) }
        var postProfile by remember { mutableStateOf<com.nephclick.eyefield.models.Profile?>(null) }
        
        LaunchedEffect(post.userId) {
            try {
                postProfile = Supabase.fetchProfile(post.userId)
            } catch(e: Exception) {}
        }
        
        LaunchedEffect(showComments) {
            if (showComments) {
                try {
                    commentsList = Supabase.fetchComments(post.id)
                } catch(e: Exception) {}
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            // Main content
            Box(modifier = Modifier.fillMaxSize().padding(bottom = 120.dp), contentAlignment = Alignment.Center) {
                if (post.mediaUrls.isNotEmpty()) {
                    LazyRow(modifier = Modifier.fillMaxSize()) {
                        items(post.mediaUrls) { media ->
                            val isVideo = media.url.endsWith(".mp4", ignoreCase = true) || media.type == "video"
                            Box(modifier = Modifier.fillParentMaxSize()) {
                                if (isVideo) {
                                    com.nephclick.eyefield.utils.VideoPlayer(
                                        url = media.url,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    AsyncImage(
                                        model = media.url,
                                        contentDescription = "Fullscreen media",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Fit
                                    )
                                }
                            }
                        }
                    }
                    if (!post.content.isNullOrBlank()) {
                        Text(
                            text = post.content!!,
                            color = Color.White,
                            fontSize = 16.sp,
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(start = 16.dp, end = 16.dp, bottom = 100.dp)
                        )
                    }
                } else {
                    Text(post.content ?: "", color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(24.dp))
                }

                // Overlay user profile and name
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(top = 48.dp, start = 16.dp)
                        .clickable {
                            onClose()
                            navigator?.push(ProfileScreen(post.userId))
                        },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (postProfile?.avatarUrl != null) {
                        AsyncImage(
                            model = postProfile!!.avatarUrl, 
                            contentDescription = "Profile", 
                            modifier = Modifier.size(40.dp).clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(postProfile?.fullName ?: "Loading...", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }

            // Horizontal action buttons
            Row(
                modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 16.dp, vertical = 32.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        if (currentUserId.isNotBlank()) showEmojiPicker = true else navigator?.push(LoginScreen())
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.happy), contentDescription = "Emoji", modifier = Modifier.size(24.dp))
                    }
                    DropdownMenu(expanded = showEmojiPicker, onDismissRequest = { showEmojiPicker = false }) {
                        Row(modifier = Modifier.padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("❤️", "😂", "👍", "🔥", "😮").forEach { emoji ->
                                Text(
                                    text = emoji,
                                    fontSize = 20.sp,
                                    modifier = Modifier.clickable {
                                        showEmojiPicker = false
                                        scope.launch {
                                            Supabase.toggleEmoji(post.id, currentUserId, emoji)
                                            onRefresh()
                                        }
                                    }
                                )
                            }
                        }
                    }
                    Text("${post.emojisCount}", color = Color.White, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        if (currentUserId.isNotBlank()) showComments = true else navigator?.push(LoginScreen())
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.chat), contentDescription = "Comment", modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text("${post.commentsCount}", color = Color.White, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        if (currentUserId.isNotBlank()) {
                            scope.launch { Supabase.toggleApplause(post.id, currentUserId); onRefresh() }
                        } else navigator?.push(LoginScreen())
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.applaud), contentDescription = "Applaud", modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text("${post.applauseCount}", color = Color.White, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        val shareUrl = "https://eyefield.com/post/${post.id}"
                        shareText(context, "Check out this echo: ${post.content ?: shareUrl}")
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.share), contentDescription = "Share", modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text("Share", color = Color.White, fontSize = 12.sp)
                }
            }

            // Close button
            IconButton(onClick = onClose, modifier = Modifier.align(Alignment.TopEnd).padding(top = 16.dp, end = 8.dp)) {
                Text("X", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            }
        }
        
        // Comments Dialog inside Fullscreen
        if (showComments) {
            Dialog(onDismissRequest = { showComments = false }) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, modifier = Modifier.fillMaxHeight(0.6f)) {
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(stringResource(Res.string.comments), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            IconButton(onClick = { showComments = false }) {
                                Text("X", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider()
                        
                        LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(vertical = 12.dp)) {
                            if (commentsList.isEmpty()) {
                                item { Text(stringResource(Res.string.no_comments_yet), color = Color.Gray, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center) }
                            }
                            items(commentsList, key = { it.id }) { comment ->
                                var userProfile by remember { mutableStateOf<Profile?>(null) }
                                LaunchedEffect(comment.userId) { 
                                    try {
                                        userProfile = Supabase.fetchProfile(comment.userId) 
                                    } catch(e: Exception) {}
                                }
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    if (userProfile?.avatarUrl != null) {
                                        AsyncImage(model = userProfile!!.avatarUrl, contentDescription = null, modifier = Modifier.size(32.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                                    } else {
                                        Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.Gray))
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("@${userProfile?.username ?: "..."}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                        Text(comment.text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                }
                            }
                        }
                        
                        var newCommentText by remember { mutableStateOf("") }
                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = newCommentText,
                                onValueChange = { newCommentText = it },
                                placeholder = { Text(stringResource(Res.string.write_comment)) },
                                modifier = Modifier.weight(1f).height(50.dp),
                                shape = RoundedCornerShape(24.dp)
                            )
                            Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary).clickable {
                                if (newCommentText.isNotBlank() && currentUserId.isNotBlank()) {
                                    val txt = newCommentText
                                    newCommentText = ""
                                    scope.launch {
                                        try {
                                            Supabase.createComment(PostComment(postId = post.id, userId = currentUserId, text = txt))
                                            commentsList = Supabase.fetchComments(post.id)
                                            onRefresh()
                                        } catch(e: Exception) {}
                                    }
                                }
                            }, contentAlignment = Alignment.Center) {
                                Image(painterResource(Res.drawable.send), contentDescription = "Send", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimary))
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun InteractionIcon(iconRes: org.jetbrains.compose.resources.DrawableResource, count: String, onClick: () -> Unit = {}) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.clickable { onClick() }) {
            Image(painterResource(iconRes), contentDescription = null, modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(Color.Gray))
            Text(count, style = MaterialTheme.typography.labelMedium, color = Color.Gray)
        }
    }
}

@Composable
expect fun LocalPlatformContext(): Any?

