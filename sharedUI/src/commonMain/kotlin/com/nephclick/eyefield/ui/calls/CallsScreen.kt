package com.nephclick.eyefield.ui.calls

import androidx.compose.foundation.Image
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import coil3.compose.AsyncImage
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.CallLog
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.displayName
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*

class CallsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.current
        val scope = rememberCoroutineScope()
        var callLogs by remember { mutableStateOf<List<CallLog>>(emptyList()) }
        var contacts by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        val session = Supabase.client.auth.currentSessionOrNull()
        val currentUserId = session?.user?.id ?: ""

        var searchQuery by remember { mutableStateOf("") }
        var selectedTabIndex by remember { mutableStateOf(0) }
        var showContactsSheet by remember { mutableStateOf(false) }
        var contactSearchQuery by remember { mutableStateOf("") }

        LaunchedEffect(currentUserId) {
            if (currentUserId.isNotBlank()) {
                val cachedCalls = com.nephclick.eyefield.utils.PersistentCache.getString("cached_calls_$currentUserId")
                if (!cachedCalls.isNullOrEmpty()) {
                    try { callLogs = kotlinx.serialization.json.Json.decodeFromString(cachedCalls) } catch(e: Exception) {}
                }
                try {
                    val freshLogs = Supabase.fetchCallLogs(currentUserId)
                    callLogs = freshLogs
                    com.nephclick.eyefield.utils.PersistentCache.saveString("cached_calls_$currentUserId", kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.builtins.ListSerializer(com.nephclick.eyefield.models.CallLog.serializer()), freshLogs))
                    contacts = Supabase.fetchFollowers(currentUserId)
                } catch (e: Exception) {}
            }
            isLoading = false
        }

        val filteredLogs = callLogs.filter { log ->
            if (selectedTabIndex == 1 && log.callStatus != "missed") return@filter false
            // Simple search filtering - in a real app, you'd fetch profiles first or join, 
            // but we'll let the lazy column render the profile and we won't strictly filter by name here easily unless we load all profiles.
            // For now, we just pass the list.
            true
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(Res.string.calls),
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Black, 
                            fontSize = 24.sp
                        ),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        // BOOK (text-only, no icon)
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF1B1D29))
                                    .clickable { navigator?.push(com.nephclick.eyefield.ui.home.BookScreen()) },
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
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showContactsSheet = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    shape = CircleShape
                ) {
                    Image(
                        painter = painterResource(Res.drawable.add_user_call),
                        contentDescription = stringResource(Res.string.new_call),
                        modifier = Modifier.size(24.dp),
                        colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimary)
                    )
                }
            }
        ) { paddingValues ->
            Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
                // Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text(stringResource(Res.string.search_calls)) },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = CircleShape,
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline
                    )
                )

                // Tabs
                TabRow(
                    selectedTabIndex = selectedTabIndex,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = MaterialTheme.colorScheme.primary
                ) {
                    Tab(
                        selected = selectedTabIndex == 0,
                        onClick = { selectedTabIndex = 0 },
                        text = { Text(stringResource(Res.string.recent_calls)) }
                    )
                    Tab(
                        selected = selectedTabIndex == 1,
                        onClick = { selectedTabIndex = 1 },
                        text = { Text(stringResource(Res.string.missed_calls)) }
                    )
                }

                if (isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                } else if (filteredLogs.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Image(
                                painterResource(Res.drawable.telephone),
                                contentDescription = stringResource(Res.string.no_calls),
                                modifier = Modifier.size(64.dp),
                                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                if (selectedTabIndex == 1) stringResource(Res.string.no_missed_calls) else stringResource(Res.string.no_recent_calls),
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        items(filteredLogs) { log ->
                            val isOutgoing = log.callerId == currentUserId
                            val otherUserId = if (isOutgoing) log.receiverId else log.callerId
                            var otherUser by remember { mutableStateOf<Profile?>(null) }

                            LaunchedEffect(otherUserId) {
                                try {
                                    otherUser = Supabase.fetchProfile(otherUserId)
                                } catch(e: Exception) {}
                            }

                            if (otherUser != null) {
                                // Filter locally by name if search is active
                                if (searchQuery.isBlank() || 
                                    (otherUser?.fullName?.contains(searchQuery, ignoreCase = true) == true) ||
                                    (otherUser?.username?.contains(searchQuery, ignoreCase = true) == true)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                navigator?.push(CallScreen(otherUser!!, log.callType == "video", isIncoming = false))
                                            }
                                            .padding(horizontal = 16.dp, vertical = 12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (otherUser!!.avatarUrl != null) {
                                            AsyncImage(
                                                model = otherUser!!.avatarUrl,
                                                contentDescription = stringResource(Res.string.avatar),
                                                modifier = Modifier.size(48.dp).clip(CircleShape),
                                                contentScale = ContentScale.Crop
                                            )
                                        } else {
                                            Box(
                                                modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.Gray),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    (otherUser!!.username ?: "U").take(1).uppercase(),
                                                    color = Color.White,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 20.sp
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.width(16.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = otherUser!!.displayName(),
                                                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                                                color = if (log.callStatus == "missed" && !isOutgoing) Color.Red else MaterialTheme.colorScheme.onBackground,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = if (isOutgoing) "↗" else "↙",
                                                    color = if (log.callStatus == "missed" && !isOutgoing) Color.Red else Color.Gray,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = log.createdAt?.take(16)?.replace("T", " ") ?: stringResource(Res.string.unknown_time),
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        IconButton(onClick = {
                                            navigator?.push(CallScreen(otherUser!!, log.callType == "video", isIncoming = false))
                                        }) {
                                            Image(
                                                painterResource(if (log.callType == "video") Res.drawable.zoom_video else Res.drawable.phone_call_icon),
                                                contentDescription = stringResource(Res.string.call),
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

        // Contacts Bottom Sheet
        if (showContactsSheet) {
            ModalBottomSheet(
                onDismissRequest = { showContactsSheet = false },
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp)) {
                    Text(
                        text = stringResource(Res.string.select_contact),
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(16.dp),
                        fontWeight = FontWeight.Bold
                    )
                    
                    OutlinedTextField(
                        value = contactSearchQuery,
                        onValueChange = { contactSearchQuery = it },
                        placeholder = { Text(stringResource(Res.string.search_followers)) },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        singleLine = true,
                        leadingIcon = { Text("ðŸ”Ž") }
                    )
                    
                    if (contacts.isEmpty()) {
                        Text(
                            text = stringResource(Res.string.no_followers_found_calls),
                            modifier = Modifier.padding(16.dp),
                            color = Color.Gray
                        )
                    } else {
                        val filteredContacts = contacts.filter { 
                            contactSearchQuery.isBlank() || 
                            (it.fullName?.contains(contactSearchQuery, ignoreCase = true) == true) ||
                            (it.username?.contains(contactSearchQuery, ignoreCase = true) == true)
                        }
                        
                        LazyColumn(modifier = Modifier.fillMaxWidth()) {
                            items(filteredContacts) { contact ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (contact.avatarUrl != null) {
                                        AsyncImage(
                                            model = contact.avatarUrl,
                                            contentDescription = stringResource(Res.string.avatar),
                                            modifier = Modifier.size(40.dp).clip(CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                (contact.username ?: "U").take(1).uppercase(),
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(16.dp))
                                    Text(
                                        text = contact.displayName(),
                                        style = MaterialTheme.typography.bodyLarge,
                                        modifier = Modifier.weight(1f)
                                    )

                                    IconButton(onClick = {
                                        showContactsSheet = false
                                        navigator?.push(CallScreen(contact, isVideoCall = false, isIncoming = false))
                                    }) {
                                        Image(
                                            painterResource(Res.drawable.phone_call_icon),
                                            contentDescription = stringResource(Res.string.voice_call),
                                            modifier = Modifier.size(24.dp),
                                            colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)
                                        )
                                    }
                                    IconButton(onClick = {
                                        showContactsSheet = false
                                        navigator?.push(CallScreen(contact, isVideoCall = true, isIncoming = false))
                                    }) {
                                        Image(
                                            painterResource(Res.drawable.zoom_video),
                                            contentDescription = stringResource(Res.string.video_call),
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
