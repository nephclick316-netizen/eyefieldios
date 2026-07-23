package com.nephclick.eyefield.ui.chat

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
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import androidx.compose.foundation.Image
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import org.jetbrains.compose.resources.painterResource
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.displayName
import com.nephclick.eyefield.ui.home.AiScreen
import com.nephclick.eyefield.ui.home.BookScreen
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.rememberScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.nephclick.eyefield.utils.PersistentCache
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString

class ChatsScreenModel : ScreenModel {
    private val _chatRooms = MutableStateFlow<List<com.nephclick.eyefield.models.ChatRoom>>(emptyList())
    val chatRooms: StateFlow<List<com.nephclick.eyefield.models.ChatRoom>> = _chatRooms.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private var hasLoaded = false

    fun loadChats(currentUserId: String, forceRefresh: Boolean = false) {
        if (currentUserId.isBlank()) {
            _isLoading.value = false
            return
        }
        if (hasLoaded && !forceRefresh) {
            return
        }
        
        screenModelScope.launch {
            if (!hasLoaded) {
                _isLoading.value = true
                val cachedJson = PersistentCache.getString("cached_chat_rooms_$currentUserId")
                if (!cachedJson.isNullOrEmpty()) {
                    try {
                        val cachedList = Json.decodeFromString<List<com.nephclick.eyefield.models.ChatRoom>>(cachedJson)
                        _chatRooms.value = cachedList
                        _isLoading.value = false
                    } catch (e: Exception) {}
                }
            }

            try {
                val freshRooms = com.nephclick.eyefield.Supabase.fetchChatRooms(currentUserId)
                _chatRooms.value = freshRooms
                PersistentCache.saveString("cached_chat_rooms_$currentUserId", Json.encodeToString(freshRooms))
            } catch (e: Exception) {
                // Ignore network errors when offline
            } finally {
                hasLoaded = true
                _isLoading.value = false
            }
        }
    }
}

class ChatsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        var searchQuery by remember { mutableStateOf("") }
        val navigator = LocalNavigator.current
        val scope = rememberCoroutineScope()
        
        val screenModel = rememberScreenModel { ChatsScreenModel() }
        val chatRooms by screenModel.chatRooms.collectAsState()
        val isLoading by screenModel.isLoading.collectAsState()
        
        var showNewChatPopup by remember { mutableStateOf(false) }

        val session = Supabase.client.auth.currentSessionOrNull()
        val currentUserId = session?.user?.id ?: ""

        LaunchedEffect(currentUserId) {
            if (currentUserId.isNotBlank()) {
                while (true) {
                    try {
                        screenModel.loadChats(currentUserId, forceRefresh = true)
                    } catch (e: kotlinx.coroutines.CancellationException) {
                        throw e // Must rethrow to allow coroutine cancellation
                    } catch (e: Exception) {
                        println("Chat poll error: ${e.message}")
                    }
                    kotlinx.coroutines.delay(4000)
                }
            }
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(Res.string.app_name),
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Black, 
                            fontSize = 24.sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        // ENDOCARD
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF3B1D5F))
                                    .clickable { navigator?.push(AiScreen()) },
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painterResource(Res.drawable.ai_robot), 
                                    contentDescription = "Endocard",
                                    modifier = Modifier.size(24.dp),
                                    colorFilter = ColorFilter.tint(Color(0xFFD34DF6))
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("ENDOCARD", color = Color(0xFFFF9800), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }

                        // BOOK (text-only, no icon)
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF1B1D29))
                                    .clickable { navigator?.push(BookScreen()) },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "📖",
                                    fontSize = 22.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("BOOK", color = Color(0xFFFF9800), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp)
            ) {
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text(stringResource(Res.string.search_messages), color = MaterialTheme.colorScheme.onSurfaceVariant) },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    leadingIcon = {
                        Image(painterResource(Res.drawable.find_followers), contentDescription = "Search", modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant))
                    },
                    trailingIcon = {
                        Image(
                            painterResource(Res.drawable.add_user), 
                            contentDescription = stringResource(Res.string.add_contact), 
                            modifier = Modifier.size(24.dp).clickable { showNewChatPopup = true }, 
                            colorFilter = ColorFilter.tint(Color(0xFFFF9800))
                        )
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent,
                        focusedTextColor = MaterialTheme.colorScheme.onBackground,
                        unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                    ),
                    singleLine = true
                )

                if (isLoading && chatRooms.isEmpty()) {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                } else {
                    if (chatRooms.isEmpty()) {
                        Spacer(modifier = Modifier.weight(1f))
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                painter = painterResource(Res.drawable.chat),
                                contentDescription = stringResource(Res.string.no_messages_yet),
                                modifier = Modifier.size(80.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = stringResource(Res.string.no_messages_yet),
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.height(24.dp))
                            Button(
                                onClick = { showNewChatPopup = true },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                modifier = Modifier.height(50.dp)
                            ) {
                                Text(
                                    text = stringResource(Res.string.start_a_chat),
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        Spacer(modifier = Modifier.weight(1f))
                    } else {
                        val filteredRooms = if (searchQuery.isBlank()) chatRooms
                        else chatRooms.filter { room ->
                            val otherUserId = if (room.user1Id == currentUserId) room.user2Id else room.user1Id
                            val cachedProfile = PersistentCache.getString("profile_$otherUserId")
                            if (cachedProfile != null) {
                                try {
                                    val p = Json.decodeFromString<Profile>(cachedProfile)
                                    (p.fullName?.contains(searchQuery, ignoreCase = true) == true) ||
                                    (p.username?.contains(searchQuery, ignoreCase = true) == true)
                                } catch (e: Exception) { false }
                            } else false
                        }
                        LazyColumn(modifier = Modifier.weight(1f).fillMaxWidth()) {
                            items(filteredRooms) { room ->
                                val otherUserId = if (room.user1Id == currentUserId) room.user2Id else room.user1Id
                                var otherUser by remember { mutableStateOf<Profile?>(null) }
                                
                                LaunchedEffect(otherUserId) {
                                    val cachedProfile = PersistentCache.getString("profile_$otherUserId")
                                    if (cachedProfile != null) {
                                        try {
                                            otherUser = Json.decodeFromString<Profile>(cachedProfile)
                                        } catch (e: Exception) {}
                                    }
                                    try {
                                        val fetched = Supabase.fetchProfile(otherUserId)
                                        if (fetched != null) {
                                            otherUser = fetched
                                            PersistentCache.saveString("profile_$otherUserId", Json.encodeToString(fetched))
                                        }
                                    } catch (e: Exception) {}
                                }
                                if (otherUser != null) {
                                    androidx.compose.material3.Card(
                                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clickable {
                                            navigator?.push(ChatDetailScreen(room.id, otherUser!!))
                                        },
                                        colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            if (otherUser!!.avatarUrl != null) {
                                                AsyncImage(
                                                    model = otherUser!!.avatarUrl,
                                                    contentDescription = stringResource(Res.string.avatar),
                                                    modifier = Modifier.size(56.dp).clip(CircleShape),
                                                    contentScale = ContentScale.Crop
                                                )
                                            } else {
                                                Box(
                                                    modifier = Modifier.size(56.dp).clip(CircleShape).background(Color.Gray),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text((otherUser!!.username ?: "U").take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 24.sp)
                                                }
                                            }
                                            Spacer(modifier = Modifier.width(16.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                                    Text(otherUser!!.displayName(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                                                    Column(horizontalAlignment = Alignment.End) {
                                                        val t = room.lastMessageTime ?: ""
                                                        val dateStr = if (t.contains("T")) t.substringBefore("T") else t.take(10)
                                                        val timeStr = if (t.contains("T")) t.substringAfter("T").take(5) else ""
                                                        
                                                        Text(dateStr, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                                            Text(timeStr, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                            Spacer(modifier = Modifier.width(4.dp))
                                                            Text("👀", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                                                        }
                                                    }
                                                }
                                                Text(room.lastMessage ?: stringResource(Res.string.start_a_conversation), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // New Chat Popup
        if (showNewChatPopup) {
            Dialog(onDismissRequest = { showNewChatPopup = false }) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f)
                ) {
                    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Text(
                            stringResource(Res.string.new_message),
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        var popupSearchQuery by remember { mutableStateOf("") }
                        var usersList by remember { mutableStateOf<List<Profile>>(emptyList()) }

                        LaunchedEffect(popupSearchQuery) {
                            if (popupSearchQuery.isBlank()) {
                                if (currentUserId.isNotBlank()) {
                                    // Load following list as default contacts (most relevant), fallback to all profiles
                                    val following = Supabase.fetchFollowing(currentUserId)
                                    usersList = if (following.isNotEmpty()) following
                                    else Supabase.fetchAllProfiles(currentUserId).take(50)
                                }
                            } else {
                                usersList = Supabase.searchUsers(popupSearchQuery).filter { it.id != currentUserId }
                            }
                        }

                        OutlinedTextField(
                            value = popupSearchQuery,
                            onValueChange = { popupSearchQuery = it },
                            placeholder = { Text(stringResource(Res.string.search_users_app), color = MaterialTheme.colorScheme.onSurfaceVariant) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                                focusedBorderColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                            )
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        if (usersList.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    if (popupSearchQuery.isBlank()) stringResource(Res.string.search_for_users_to_start_conversation) else stringResource(Res.string.no_users_found),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        } else {
                            LazyColumn(modifier = Modifier.fillMaxSize()) {
                                items(usersList) { user ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (user.avatarUrl != null) {
                                            AsyncImage(
                                                model = user.avatarUrl,
                                                contentDescription = stringResource(Res.string.avatar),
                                                modifier = Modifier.size(48.dp).clip(CircleShape),
                                                contentScale = ContentScale.Crop
                                            )
                                        } else {
                                            Box(
                                                modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.Gray),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text((user.username ?: "U").take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(user.displayName(), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
                                            Text("@${user.username ?: user.displayName()}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                        IconButton(onClick = {
                                            scope.launch {
                                                 val room = Supabase.createOrGetChatRoom(currentUserId, user.id)
                                                 if (room != null) {
                                                     screenModel.loadChats(currentUserId, forceRefresh = true)
                                                     showNewChatPopup = false
                                                     navigator?.push(ChatDetailScreen(room.id, user))
                                                 }
                                            }
                                        }) {
                                            Image(
                                                painterResource(Res.drawable.chat),
                                                contentDescription = stringResource(Res.string.message),
                                                modifier = Modifier.size(24.dp),
                                                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
