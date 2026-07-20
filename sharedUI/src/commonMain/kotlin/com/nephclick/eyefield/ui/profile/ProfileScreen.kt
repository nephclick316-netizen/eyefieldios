package com.nephclick.eyefield.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.nephclick.eyefield.ui.auth.LoginScreen
import com.nephclick.eyefield.ui.admin.AdminScreen
import com.nephclick.eyefield.ui.home.LocalPlatformContext
import com.nephclick.eyefield.utils.shareText
import com.nephclick.eyefield.models.PostComment
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.Post
import com.nephclick.eyefield.models.Business
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import coil3.compose.AsyncImage
import coil3.compose.SubcomposeAsyncImage
import androidx.compose.ui.layout.ContentScale

class ProfileScreen(val providedUserId: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedTabIndex by remember { mutableStateOf(0) }
        var showFollowersPopup by remember { mutableStateOf(false) }
        var showFollowingPopup by remember { mutableStateOf(false) }
        var showFindUsersPopup by remember { mutableStateOf(false) }
        var showFullScreenAvatar by remember { mutableStateOf(false) }
        var imageLoadError by remember { mutableStateOf<String?>(null) }

        var profile by remember { mutableStateOf<Profile?>(null) }
        var business by remember { mutableStateOf<Business?>(null) }
        var isLoading by remember { mutableStateOf(true) }
        val session = Supabase.client.auth.currentSessionOrNull()
        val userEmail = session?.user?.email
        
        val coroutineScope = rememberCoroutineScope()
        var searchUsersQuery by remember { mutableStateOf("") }
        var searchUsersResult by remember { mutableStateOf<List<Profile>>(emptyList()) }

        var userProducts by remember { mutableStateOf<List<com.nephclick.eyefield.models.Product>>(emptyList()) }
        var isFollowingMainProfile by remember { mutableStateOf(false) }
        var userEchoes by remember { mutableStateOf<List<Post>>(emptyList()) }
        var userSavedEchoes by remember { mutableStateOf<List<Post>>(emptyList()) }
        var followersList by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var followingList by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var gridColumns by remember { mutableStateOf(2) }
        var showGridDropdown by remember { mutableStateOf(false) }
        var fullscreenEchoPost by remember { mutableStateOf<Post?>(null) }

        LaunchedEffect(Unit) {
            val cachedProfile = com.nephclick.eyefield.utils.PersistentCache.getString("cached_profile_${providedUserId ?: session?.user?.id}")
            if (!cachedProfile.isNullOrEmpty()) {
                try { profile = kotlinx.serialization.json.Json.decodeFromString(cachedProfile) } catch(e: Exception) {}
            }
            if (session != null) {
                try {
                    val userId = providedUserId ?: session.user?.id ?: return@LaunchedEffect
                    val freshProfile = Supabase.fetchProfile(userId)
                    profile = freshProfile
                    if (freshProfile != null) {
                        com.nephclick.eyefield.utils.PersistentCache.saveString("cached_profile_$userId", kotlinx.serialization.json.Json.encodeToString(com.nephclick.eyefield.models.Profile.serializer(), freshProfile))
                    }
                    business = Supabase.fetchBusiness(userId)
                    userProducts = Supabase.fetchProductsByUser(userId)
                } catch (e: Exception) {
                    println("Error fetching profile: ${e.message}")
                } finally {
                    isLoading = false
                }
            } else if (providedUserId != null) {
                try {
                    val freshProfile = Supabase.fetchProfile(providedUserId)
                    profile = freshProfile
                    if (freshProfile != null) {
                        com.nephclick.eyefield.utils.PersistentCache.saveString("cached_profile_$providedUserId", kotlinx.serialization.json.Json.encodeToString(com.nephclick.eyefield.models.Profile.serializer(), freshProfile))
                    }
                    business = Supabase.fetchBusiness(providedUserId)
                    userProducts = Supabase.fetchProductsByUser(providedUserId)
                } catch (e: Exception) {
                    println("Error fetching profile: ${e.message}")
                } finally {
                    isLoading = false
                }
            } else {
                isLoading = false
            }
        }

        val isOwnProfile = session?.user?.id == profile?.id

        LaunchedEffect(profile) {
            if (profile != null) {
                val currentUserId = session?.user?.id
                if (currentUserId != null && currentUserId != profile!!.id) {
                    isFollowingMainProfile = Supabase.checkIsFollowing(currentUserId, profile!!.id)
                }
                userEchoes = Supabase.fetchUserPosts(profile!!.id)
                followersList = Supabase.fetchFollowers(profile!!.id)
                followingList = Supabase.fetchFollowing(profile!!.id)
                if (isOwnProfile == true) {
                    val savedIds = Supabase.fetchSavedPosts(profile!!.id).map { it.postId }
                    userSavedEchoes = savedIds.mapNotNull { Supabase.fetchPostById(it) }
                }
            }
        }

        val tabs = if (isOwnProfile == true || profile == null) listOf(stringResource(Res.string.echoes), stringResource(Res.string.shop), stringResource(Res.string.saved)) else listOf(stringResource(Res.string.echoes), stringResource(Res.string.shop))
        val isAdmin = userEmail == "nephclick@gmail.com" || userEmail == "eyefieldholybusiness@gmail.com"
        val isComplete = profile != null && !profile?.fullName.isNullOrBlank() && !profile?.phoneNumber.isNullOrBlank() && profile?.avatarUrl != null

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }
            return
        }

        if (showFullScreenAvatar && profile?.avatarUrl != null) {
            Dialog(onDismissRequest = { showFullScreenAvatar = false }) {
                Box(modifier = Modifier.fillMaxSize().clickable { showFullScreenAvatar = false }, contentAlignment = Alignment.Center) {
                    SubcomposeAsyncImage(
                        model = profile!!.avatarUrl!!,
                        contentDescription = stringResource(Res.string.full_screen_avatar),
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.profile), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)) },
                    navigationIcon = {
                        if (isOwnProfile == false) {
                            IconButton(onClick = { navigator.pop() }) {
                                Text("←", style = MaterialTheme.typography.titleLarge)
                            }
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = MaterialTheme.colorScheme.onBackground
                    )
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Banner & Profile Picture Section
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                    ) {
                        // Banner
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(150.dp)
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            if (profile?.bannerUrl != null) {
                                SubcomposeAsyncImage(
                                    model = profile!!.bannerUrl!!,
                                    contentDescription = stringResource(Res.string.banner),
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                    loading = { CircularProgressIndicator(modifier = Modifier.align(Alignment.Center).size(24.dp)) },
                                    error = {
                                        Text(stringResource(Res.string.failed_to_load_banner), color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
                                    }
                                )
                            } else {
                                Text(
                                    text = stringResource(Res.string.no_banner),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.align(Alignment.Center)
                                )
                            }
                        }

                        // Profile Picture
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(start = 24.dp)
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.secondary)
                                .border(4.dp, MaterialTheme.colorScheme.background, CircleShape)
                                .clickable { if (profile?.avatarUrl != null) showFullScreenAvatar = true },
                            contentAlignment = Alignment.Center
                        ) {
                            if (profile?.avatarUrl != null) {
                                SubcomposeAsyncImage(
                                    model = profile!!.avatarUrl!!,
                                    contentDescription = stringResource(Res.string.profile),
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                    loading = { CircularProgressIndicator(modifier = Modifier.align(Alignment.Center).size(24.dp)) },
                                    error = {
                                        Image(
                                            painter = painterResource(Res.drawable.user),
                                            contentDescription = stringResource(Res.string.profile),
                                            modifier = Modifier.size(60.dp),
                                            colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground)
                                        )
                                    }
                                )
                            } else {
                                Image(
                                    painter = painterResource(Res.drawable.user),
                                    contentDescription = stringResource(Res.string.profile),
                                    modifier = Modifier.size(60.dp),
                                    colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground)
                                )
                            }
                        }

                        // Action Buttons (Right Side)
                        Row(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(end = 16.dp, bottom = 0.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (isOwnProfile) {
                                OutlinedButton(
                                    onClick = { if (profile != null) navigator.push(EditProfileScreen(profile!!, business)) },
                                    shape = RoundedCornerShape(20.dp),
                                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text(stringResource(Res.string.edit_profile), style = MaterialTheme.typography.labelMedium)
                                }
                            } else {
                                val currentUserId = session?.user?.id
                                OutlinedButton(
                                    onClick = {
                                        if (currentUserId != null && profile != null) {
                                            coroutineScope.launch {
                                                try {
                                                    Supabase.toggleFollow(currentUserId, profile!!.id)
                                                    isFollowingMainProfile = !isFollowingMainProfile
                                                    // Refresh actual followers list from DB (not a stub)
                                                    followersList = Supabase.fetchFollowers(profile!!.id)
                                                } catch (e: Exception) {
                                                    println("Follow toggle error: ${e.message}")
                                                }
                                            }
                                        } else {
                                            navigator.push(LoginScreen())
                                        }
                                    },
                                    shape = RoundedCornerShape(20.dp),
                                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text(if (isFollowingMainProfile) stringResource(Res.string.unfollow) else stringResource(Res.string.follow), style = MaterialTheme.typography.labelMedium)
                                }
                            }
                            if (isAdmin) {
                                OutlinedButton(
                                    onClick = { navigator.push(AdminScreen()) },
                                    shape = RoundedCornerShape(20.dp),
                                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text(stringResource(Res.string.admin), style = MaterialTheme.typography.labelMedium)
                                }
                            }
                            IconButton(onClick = { navigator.push(SettingsScreen(profile, business)) }, modifier = Modifier.size(36.dp)) {
                                Image(painterResource(Res.drawable.settings), contentDescription = stringResource(Res.string.settings), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground))
                            }
                            Box {
                                IconButton(onClick = { showGridDropdown = true }, modifier = Modifier.size(36.dp)) {
                                    Image(painterResource(Res.drawable.grid), contentDescription = stringResource(Res.string.grid), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground))
                                }
                                DropdownMenu(
                                    expanded = showGridDropdown,
                                    onDismissRequest = { showGridDropdown = false }
                                ) {
                                    listOf(1, 2, 3).forEach { cols ->
                                        DropdownMenuItem(
                                            text = {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    val columnString = if (cols > 1) stringResource(Res.string.columns) else stringResource(Res.string.column)
                                                    Text("$cols $columnString", style = MaterialTheme.typography.bodyMedium)
                                                    if (gridColumns == cols) {
                                                        Spacer(modifier = Modifier.width(8.dp))
                                                        Text("✓", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                            },
                                            onClick = {
                                                gridColumns = cols
                                                showGridDropdown = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Profile Info
                item {
                    Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)) {
                        Text(
                            text = profile?.fullName ?: stringResource(Res.string.anonymous),
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = profile?.username?.let { "@$it" } ?: "",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        if (profile?.bio != null) {
                            Text(
                                text = profile!!.bio!!,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            if (profile?.cityAddress != null || profile?.country != null) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Image(painterResource(Res.drawable.location), contentDescription = stringResource(Res.string.location), modifier = Modifier.size(16.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    val location = listOfNotNull(profile?.cityAddress, profile?.country).joinToString(", ")
                                    Text(location, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            if (business?.category != null) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Image(painterResource(Res.drawable.briefcase), contentDescription = stringResource(Res.string.category), modifier = Modifier.size(16.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(business!!.category!!, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("${userEchoes.size}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(stringResource(Res.string.posts), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { showFollowersPopup = true }) {
                                Text("${followersList.size}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(stringResource(Res.string.followers), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { showFollowingPopup = true }) {
                                Text("${followingList.size}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(stringResource(Res.string.following), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            
                            Spacer(modifier = Modifier.weight(1f))
                            
                            IconButton(
                                onClick = { 
                                    showFindUsersPopup = true 
                                    coroutineScope.launch {
                                        val userId = session?.user?.id
                                        if (userId != null) {
                                            searchUsersResult = Supabase.fetchSuggestedUsers(userId)
                                        }
                                    }
                                },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Image(painterResource(Res.drawable.add_user), contentDescription = stringResource(Res.string.find_users), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary))
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                // Complete Setup Banner
                if (!isComplete && isOwnProfile) {
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                                .clickable { if (profile != null) navigator.push(EditProfileScreen(profile!!, business)) },
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = stringResource(Res.string.complete_account_setup),
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    Text(
                                        text = stringResource(Res.string.add_missing_details),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    text = ">",
                                    color = MaterialTheme.colorScheme.primary,
                                    style = MaterialTheme.typography.titleLarge
                                )
                            }
                        }
                    }
                }

                // Tabs
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    TabRow(
                        selectedTabIndex = selectedTabIndex,
                        containerColor = MaterialTheme.colorScheme.background,
                        contentColor = MaterialTheme.colorScheme.onBackground
                    ) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = selectedTabIndex == index,
                                onClick = { selectedTabIndex = index },
                                text = { 
                                    Text(
                                        text = title, 
                                        fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal,
                                        color = if (selectedTabIndex == index) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                                    ) 
                                }
                            )
                        }
                    }
                }

                // Tab Content
                when (selectedTabIndex) {
                    0 -> {
                        if (userEchoes.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(400.dp).padding(24.dp), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Image(painterResource(Res.drawable.smile_plus), contentDescription = stringResource(Res.string.post_echo), modifier = Modifier.size(64.dp).clickable { /* action */ }, colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary))
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text(stringResource(Res.string.post_your_first_echo), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        } else {
                            item { Spacer(modifier = Modifier.height(16.dp)) }
                            if (gridColumns == 1) {
                                items(userEchoes.size) { index ->
                                    val post = userEchoes[index]
                                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                                        PostCardMini(post = post, onClick = { fullscreenEchoPost = post })
                                    }
                                }
                            } else {
                                val chunkedEchoes = userEchoes.chunked(gridColumns)
                                items(chunkedEchoes.size) { index ->
                                    val rowItems = chunkedEchoes[index]
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowItems.forEach { post ->
                                            Box(modifier = Modifier.weight(1f)) {
                                                PostCardGrid(post = post, onClick = { fullscreenEchoPost = post })
                                            }
                                        }
                                        repeat(gridColumns - rowItems.size) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                    1 -> {
                        if (userProducts.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(400.dp).padding(24.dp), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Image(painterResource(Res.drawable.sell), contentDescription = stringResource(Res.string.make_sell), modifier = Modifier.size(64.dp).clickable { navigator.push(com.nephclick.eyefield.ui.home.CreateProductScreen()) }, colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary))
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text(stringResource(Res.string.make_first_sell), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        } else {
                            val chunkedProducts = userProducts.chunked(2)
                            items(chunkedProducts.size) { index ->
                                val rowItems = chunkedProducts[index]
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    rowItems.forEach { p ->
                                        Box(modifier = Modifier.weight(1f)) {
                                            ProductCardMini(
                                                title = p.name,
                                                price = p.currentPrice.toString(),
                                                currency = p.currency,
                                                mediaUrl = p.mediaUrls.firstOrNull(),
                                                isLimitedEdition = p.isLimitedEdition
                                            ) {
                                                navigator.push(com.nephclick.eyefield.ui.home.ProductDetailsScreen(p.id))
                                            }
                                        }
                                    }
                                    if (rowItems.size == 1) {
                                        Spacer(modifier = Modifier.weight(1f))
                                    }
                                }
                            }
                        }
                    }
                    2 -> {
                        if (userSavedEchoes.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().height(400.dp).padding(24.dp), contentAlignment = Alignment.Center) {
                                    Text(stringResource(Res.string.saved_nothing_yet), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        } else {
                            item { Spacer(modifier = Modifier.height(16.dp)) }
                            if (gridColumns == 1) {
                                items(userSavedEchoes.size) { index ->
                                    val post = userSavedEchoes[index]
                                    Box(modifier = Modifier.padding(horizontal = 24.dp)) {
                                        PostCardMini(post = post, onClick = { fullscreenEchoPost = post })
                                    }
                                }
                            } else {
                                val chunkedSaved = userSavedEchoes.chunked(gridColumns)
                                items(chunkedSaved.size) { index ->
                                    val rowItems = chunkedSaved[index]
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        rowItems.forEach { post ->
                                            Box(modifier = Modifier.weight(1f)) {
                                                PostCardGrid(post = post, onClick = { fullscreenEchoPost = post })
                                            }
                                        }
                                        repeat(gridColumns - rowItems.size) {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Fullscreen Echo Viewer
        if (fullscreenEchoPost != null) {
            val echoPost = fullscreenEchoPost!!
            val currentUserId = session?.user?.id ?: ""
            Dialog(onDismissRequest = { fullscreenEchoPost = null }) {
                Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
                    FullscreenEchoContent(
                        post = echoPost,
                        currentUserId = currentUserId,
                        onRefresh = {
                            coroutineScope.launch {
                                if (profile != null) {
                                    userEchoes = Supabase.fetchUserPosts(profile!!.id)
                                }
                            }
                        },
                        onClose = { fullscreenEchoPost = null }
                    )
                }
            }
        }
        
        if (showFollowersPopup) {
            ModalBottomSheet(
                onDismissRequest = { showFollowersPopup = false },
                containerColor = MaterialTheme.colorScheme.background,
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                Column(modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f).padding(16.dp)) {
                    Text(stringResource(Res.string.followers), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = "",
                        onValueChange = {},
                        placeholder = { Text(stringResource(Res.string.search_followers)) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(followersList.size) { index ->
                            val userProfile = followersList[index]
                            UserListItem(
                                userProfile = userProfile,
                                currentUserId = session?.user?.id,
                                navigator = navigator,
                                coroutineScope = coroutineScope,
                                onDismiss = { showFollowersPopup = false }
                            )
                        }
                    }
                }
            }
        }

        if (showFollowingPopup) {
            ModalBottomSheet(
                onDismissRequest = { showFollowingPopup = false },
                containerColor = MaterialTheme.colorScheme.background,
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                Column(modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f).padding(16.dp)) {
                    Text(stringResource(Res.string.following), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = "",
                        onValueChange = {},
                        placeholder = { Text(stringResource(Res.string.search_following)) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(followingList.size) { index ->
                            val userProfile = followingList[index]
                            UserListItem(
                                userProfile = userProfile,
                                currentUserId = session?.user?.id,
                                navigator = navigator,
                                coroutineScope = coroutineScope,
                                onDismiss = { showFollowingPopup = false }
                            )
                        }
                    }
                }
            }
        }

        if (showFindUsersPopup) {
            ModalBottomSheet(
                onDismissRequest = { showFindUsersPopup = false },
                containerColor = MaterialTheme.colorScheme.background,
                dragHandle = { BottomSheetDefaults.DragHandle() }
            ) {
                Column(modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f).padding(16.dp)) {
                    Text(stringResource(Res.string.find_users), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedTextField(
                        value = searchUsersQuery,
                        onValueChange = { query ->
                            searchUsersQuery = query
                            coroutineScope.launch {
                                if (query.isBlank()) {
                                    val userId = session?.user?.id
                                    if (userId != null) {
                                        searchUsersResult = Supabase.fetchSuggestedUsers(userId)
                                    }
                                } else {
                                    searchUsersResult = Supabase.searchUsers(query)
                                }
                            }
                        },
                        placeholder = { Text(stringResource(Res.string.search_users_app)) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(searchUsersResult.size) { index ->
                            val userProfile = searchUsersResult[index]
                            UserListItem(
                                userProfile = userProfile,
                                currentUserId = session?.user?.id,
                                navigator = navigator,
                                coroutineScope = coroutineScope,
                                onDismiss = { showFindUsersPopup = false }
                            )
                        }
                        if (searchUsersResult.isEmpty()) {
                            item {
                                Text(stringResource(Res.string.no_users_found), color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 16.dp))
                            }
                        }
                    }
                }
            }
        }

        if (imageLoadError != null) {
            AlertDialog(
                onDismissRequest = { imageLoadError = null },
                title = { Text(stringResource(Res.string.image_load_error)) },
                text = { Text(stringResource(Res.string.image_load_failed) + imageLoadError) },
                confirmButton = { TextButton(onClick = { imageLoadError = null }) { Text(stringResource(Res.string.ok)) } }
            )
        }
    }

    @Composable
    private fun UserListItem(
        userProfile: Profile,
        currentUserId: String?,
        navigator: cafe.adriel.voyager.navigator.Navigator,
        coroutineScope: kotlinx.coroutines.CoroutineScope,
        onDismiss: () -> Unit
    ) {
        var isFollowing by remember { mutableStateOf(false) }
        
        LaunchedEffect(userProfile.id) {
            if (currentUserId != null) {
                isFollowing = Supabase.checkIsFollowing(currentUserId, userProfile.id)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clickable { 
                onDismiss()
                navigator.push(ProfileScreen(userProfile.id))
            },
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                if (userProfile.avatarUrl != null) {
                    SubcomposeAsyncImage(
                        model = userProfile.avatarUrl,
                        contentDescription = stringResource(Res.string.avatar),
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Image(
                        painterResource(Res.drawable.user),
                        contentDescription = stringResource(Res.string.user),
                        modifier = Modifier.size(24.dp),
                        colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant)
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(userProfile.fullName ?: stringResource(Res.string.anonymous), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                if (userProfile.username != null) {
                    Text("@${userProfile.username}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            if (currentUserId != null && currentUserId != userProfile.id) {
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            Supabase.toggleFollow(currentUserId, userProfile.id)
                            isFollowing = !isFollowing
                        }
                    },
                    shape = RoundedCornerShape(20.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text(if (isFollowing) stringResource(Res.string.unfollow) else stringResource(Res.string.follow), style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }

    @Composable
    private fun PostCardMini(post: Post, onClick: () -> Unit) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 8.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(post.content ?: stringResource(Res.string.no_content), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onBackground)
                if (post.mediaUrls.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(8.dp))) {
                        val firstMedia = post.mediaUrls.first()
                        if (firstMedia.type == "video") {
                            com.nephclick.eyefield.utils.VideoPlayer(
                                url = firstMedia.url,
                                modifier = Modifier.fillMaxSize(),
                                onClick = onClick,
                                autoPlay = false
                            )
                        } else {
                            AsyncImage(
                                model = firstMedia.url,
                                contentDescription = stringResource(Res.string.post_media),
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        if (post.mediaUrls.size > 1) {
                            Box(modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp)).padding(horizontal = 4.dp, vertical = 2.dp)) {
                                Text("+${post.mediaUrls.size - 1}", color = Color.White, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun PostCardGrid(post: Post, onClick: () -> Unit) {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier.fillMaxWidth().aspectRatio(1f).clickable { onClick() }
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                if (post.mediaUrls.isNotEmpty()) {
                    val firstMedia = post.mediaUrls.first()
                    if (firstMedia.type == "video") {
                        com.nephclick.eyefield.utils.VideoPlayer(
                            url = firstMedia.url,
                            modifier = Modifier.fillMaxSize(),
                            onClick = onClick,
                            autoPlay = false
                        )
                    } else {
                        AsyncImage(
                            model = firstMedia.url,
                            contentDescription = stringResource(Res.string.post_media),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    if (post.mediaUrls.size > 1) {
                        Box(modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp)).padding(horizontal = 4.dp, vertical = 2.dp)) {
                            Text("+${post.mediaUrls.size - 1}", color = Color.White, fontSize = 10.sp)
                        }
                    }
                } else {
                    Text(
                        post.content ?: "",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 4,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }
        }
    }

    @Composable
    private fun FullscreenEchoContent(post: Post, currentUserId: String, onRefresh: () -> Unit, onClose: () -> Unit) {
        val context = LocalPlatformContext()
        val navigator = LocalNavigator.current
        val scope = rememberCoroutineScope()
        var showComments by remember { mutableStateOf(false) }
        var showEmojiPicker by remember { mutableStateOf(false) }
        var commentsList by remember { mutableStateOf<List<PostComment>>(emptyList()) }
        var postProfile by remember { mutableStateOf<Profile?>(null) }

        LaunchedEffect(post.userId) {
            postProfile = Supabase.fetchProfile(post.userId)
        }

        LaunchedEffect(showComments) {
            if (showComments) {
                commentsList = Supabase.fetchComments(post.id)
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            // Main content
            Box(modifier = Modifier.fillMaxSize().padding(bottom = 120.dp), contentAlignment = Alignment.Center) {
                if (post.mediaUrls.isNotEmpty()) {
                    LazyRow(modifier = Modifier.fillMaxSize()) {
                        items(post.mediaUrls) { media ->
                            Box(modifier = Modifier.fillParentMaxSize()) {
                                AsyncImage(
                                    model = media.url,
                                    contentDescription = stringResource(Res.string.fullscreen_media),
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Fit
                                )
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

                // User profile overlay
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
                            contentDescription = stringResource(Res.string.profile),
                            modifier = Modifier.size(40.dp).clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(postProfile?.fullName ?: stringResource(Res.string.loading), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
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
                        Image(painterResource(Res.drawable.happy), contentDescription = stringResource(Res.string.emoji), modifier = Modifier.size(24.dp))
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
                        Image(painterResource(Res.drawable.chat), contentDescription = stringResource(Res.string.comment_icon_desc), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text("${post.commentsCount}", color = Color.White, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        if (currentUserId.isNotBlank()) {
                            scope.launch { Supabase.toggleApplause(post.id, currentUserId); onRefresh() }
                        } else navigator?.push(LoginScreen())
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.applaud), contentDescription = stringResource(Res.string.applaud), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text("${post.applauseCount}", color = Color.White, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    val shareTextResolved = stringResource(Res.string.check_out_echo)
                    Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color.DarkGray).clickable {
                        val shareUrl = "https://eyefield.com/post/${post.id}"
                        shareText(context, shareTextResolved + (post.content ?: shareUrl))
                    }, contentAlignment = Alignment.Center) {
                        Image(painterResource(Res.drawable.share), contentDescription = stringResource(Res.string.share), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.White))
                    }
                    Text(stringResource(Res.string.share), color = Color.White, fontSize = 12.sp)
                }
            }

            // Close button
            IconButton(onClick = onClose, modifier = Modifier.align(Alignment.TopEnd).padding(top = 16.dp, end = 8.dp)) {
                Text("X", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            }
        }

        // Comments Dialog
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
                                LaunchedEffect(comment.userId) { userProfile = Supabase.fetchProfile(comment.userId) }
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
                                        Supabase.createComment(PostComment(postId = post.id, userId = currentUserId, text = txt))
                                        commentsList = Supabase.fetchComments(post.id)
                                        onRefresh()
                                    }
                                }
                            }, contentAlignment = Alignment.Center) {
                                Image(painterResource(Res.drawable.send), contentDescription = stringResource(Res.string.send), modifier = Modifier.size(20.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimary))
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ProductCardMini(title: String, price: String, currency: String, mediaUrl: String?, isLimitedEdition: Boolean, onClick: () -> Unit) {
        val conversionRate = when (currency) {
            "USD" -> 0.00026; "EUR" -> 0.00024; "GBP" -> 0.00020
            "KES" -> 0.035; "TZS" -> 0.67; "JPY" -> 0.040
            else -> 1.0 // UGX base
        }
        val convertedPrice = try {
            val basePrice = price.toDouble()
            basePrice * conversionRate
        } catch (e: Exception) { 0.0 }
        
        val priceString = "${currency}${convertedPrice.toInt()}.00"

        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
            modifier = Modifier.fillMaxWidth().aspectRatio(0.75f).clickable { onClick() }
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                if (mediaUrl != null) {
                    AsyncImage(
                        model = mediaUrl,
                        contentDescription = stringResource(Res.string.product_image),
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray.copy(alpha = 0.2f)))
                }

                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.6f))
                        .padding(12.dp)
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        maxLines = 2,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = priceString,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.secondary
                    )
                }

                if (isLimitedEdition) {
                    Surface(
                        color = Color.Red,
                        shape = RoundedCornerShape(topStart = 16.dp, bottomEnd = 8.dp),
                        modifier = Modifier.align(Alignment.TopStart)
                    ) {
                        Text(
                            text = stringResource(Res.string.limited_edition),
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}
