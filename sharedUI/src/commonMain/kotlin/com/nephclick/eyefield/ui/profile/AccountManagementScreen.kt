package com.nephclick.eyefield.ui.profile

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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.*
import com.nephclick.eyefield.ui.auth.LoginScreen
import kotlinx.coroutines.launch
import io.github.jan.supabase.auth.auth

import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

class AccountManagementScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()
        var selectedTab by remember { mutableStateOf(0) }
        val tabs = listOf(
            stringResource(Res.string.block_users),
            stringResource(Res.string.my_reports),
            stringResource(Res.string.danger_zone)
        )

        Scaffold(
            topBar = {
                Column {
                    CenterAlignedTopAppBar(
                        title = { Text(stringResource(Res.string.account_management), fontWeight = FontWeight.Bold) },
                        navigationIcon = {
                            TextButton(onClick = { navigator.pop() }) {
                                Text(stringResource(Res.string.back))
                            }
                        },
                        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                            containerColor = MaterialTheme.colorScheme.background
                        )
                    )
                    TabRow(selectedTabIndex = selectedTab) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = selectedTab == index,
                                onClick = { selectedTab = index },
                                text = { Text(title) }
                            )
                        }
                    }
                }
            }
        ) { padding ->
            Box(modifier = Modifier.padding(padding).fillMaxSize()) {
                if (selectedTab == 0) {
                    BlockUsersTab()
                } else if (selectedTab == 1) {
                    MyReportsTab()
                } else {
                    DangerZoneTab()
                }
            }
        }
    }

    @Composable
    fun BlockUsersTab() {
        val coroutineScope = rememberCoroutineScope()
        var searchQuery by remember { mutableStateOf("") }
        var searchResults by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var blockedUsers by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var isSearching by remember { mutableStateOf(false) }
        val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: ""

        LaunchedEffect(currentUserId) {
            if (currentUserId.isNotEmpty()) {
                blockedUsers = Supabase.fetchBlockedUsers(currentUserId)
            }
        }

        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { 
                    searchQuery = it
                    if (searchQuery.isNotBlank() && currentUserId.isNotEmpty()) {
                        isSearching = true
                        coroutineScope.launch {
                            searchResults = Supabase.searchUsers(searchQuery).filter { it.id != currentUserId }
                            isSearching = false
                        }
                    } else {
                        searchResults = emptyList()
                    }
                },
                placeholder = { Text(stringResource(Res.string.search_users_to_block)) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (searchQuery.isNotBlank()) {
                Text(stringResource(Res.string.search_results), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                if (isSearching) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                } else {
                    LazyColumn {
                        items(searchResults) { user ->
                            val isBlocked = blockedUsers.any { it.id == user.id }
                            UserListItem(user = user, actionText = if (isBlocked) stringResource(Res.string.unblock) else stringResource(Res.string.block)) {
                                coroutineScope.launch {
                                    if (isBlocked) {
                                        Supabase.unblockUser(currentUserId, user.id)
                                    } else {
                                        Supabase.blockUser(currentUserId, user.id)
                                    }
                                    blockedUsers = Supabase.fetchBlockedUsers(currentUserId)
                                }
                            }
                        }
                    }
                }
            } else {
                Text(stringResource(Res.string.blocked_users_title), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                if (blockedUsers.isEmpty()) {
                    Text(stringResource(Res.string.you_havent_blocked_anyone), color = Color.Gray)
                } else {
                    LazyColumn {
                        items(blockedUsers) { user ->
                            UserListItem(user = user, actionText = stringResource(Res.string.unblock)) {
                                coroutineScope.launch {
                                    Supabase.unblockUser(currentUserId, user.id)
                                    blockedUsers = Supabase.fetchBlockedUsers(currentUserId)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    fun MyReportsTab() {
        val coroutineScope = rememberCoroutineScope()
        var postReports by remember { mutableStateOf<List<PostReport>>(emptyList()) }
        var userReports by remember { mutableStateOf<List<UserReport>>(emptyList()) }
        var productReports by remember { mutableStateOf<List<ProductReport>>(emptyList()) }
        val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: ""

        LaunchedEffect(currentUserId) {
            if (currentUserId.isNotEmpty()) {
                postReports = Supabase.fetchMyPostReports(currentUserId)
                userReports = Supabase.fetchMyUserReports(currentUserId)
                productReports = Supabase.fetchMyProductReports(currentUserId)
            }
        }

        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            item {
                Text(stringResource(Res.string.reported_posts), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                if (postReports.isEmpty()) Text(stringResource(Res.string.no_reported_posts), color = Color.Gray)
            }
            items(postReports) { report ->
                ReportListItem(reason = report.reason, date = report.createdAt) {
                    coroutineScope.launch {
                        Supabase.deletePostReport(report.id)
                        postReports = Supabase.fetchMyPostReports(currentUserId)
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(16.dp)) }

            item {
                Text(stringResource(Res.string.reported_users), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                if (userReports.isEmpty()) Text(stringResource(Res.string.no_reported_users), color = Color.Gray)
            }
            items(userReports) { report ->
                ReportListItem(reason = report.reason, date = report.createdAt) {
                    coroutineScope.launch {
                        Supabase.deleteUserReport(report.id)
                        userReports = Supabase.fetchMyUserReports(currentUserId)
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(16.dp)) }

            item {
                Text(stringResource(Res.string.reported_products), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                if (productReports.isEmpty()) Text(stringResource(Res.string.no_reported_products), color = Color.Gray)
            }
            items(productReports) { report ->
                ReportListItem(reason = report.reason, date = report.createdAt) {
                    coroutineScope.launch {
                        Supabase.deleteProductReport(report.id)
                        productReports = Supabase.fetchMyProductReports(currentUserId)
                    }
                }
            }
        }
    }

    @Composable
    fun UserListItem(user: Profile, actionText: String, onAction: () -> Unit) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (user.avatarUrl != null) {
                AsyncImage(
                    model = user.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray),
                    contentAlignment = Alignment.Center
                ) {
                    Text((user.username ?: "U").take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(user.fullName ?: user.username ?: stringResource(Res.string.user), fontWeight = FontWeight.Bold)
                Text("@${user.username ?: stringResource(Res.string.user_lower)}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            }
            TextButton(onClick = onAction) {
                Text(actionText, color = if (actionText == stringResource(Res.string.block)) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
            }
        }
    }

    @Composable
    fun ReportListItem(reason: String, date: String?, onWithdraw: () -> Unit) {
        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Row(
                modifier = Modifier.padding(12.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(stringResource(Res.string.reason_format).replace("%s", reason), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                    if (date != null) {
                        Text(stringResource(Res.string.date_format).replace("%s", date.take(10)), style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    }
                }
                TextButton(onClick = onWithdraw) {
                    Text(stringResource(Res.string.withdraw))
                }
            }
        }
    }
    @Composable
    fun DangerZoneTab() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()
        var showDeleteDialog by remember { mutableStateOf(false) }
        var deleteReason by remember { mutableStateOf("") }
        var customDeleteReason by remember { mutableStateOf("") }
        var showDeleteReasonDropdown by remember { mutableStateOf(false) }
        val deleteReasonsList = listOf(
            stringResource(Res.string.not_useful),
            stringResource(Res.string.privacy_concerns),
            stringResource(Res.string.too_many_bugs),
            stringResource(Res.string.other)
        )

        Column(modifier = Modifier.fillMaxSize().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Button(
                onClick = { showDeleteDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.errorContainer, contentColor = MaterialTheme.colorScheme.onErrorContainer),
                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(stringResource(Res.string.delete_account), fontWeight = FontWeight.Bold)
            }
        }

        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text(stringResource(Res.string.delete_account)) },
                text = {
                    Column {
                        Text(stringResource(Res.string.delete_account_confirmation), modifier = Modifier.padding(bottom = 16.dp))
                        Text(stringResource(Res.string.why_leaving), fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 8.dp))
                        Box {
                            OutlinedTextField(
                                value = deleteReason.ifBlank { stringResource(Res.string.select_a_reason) },
                                onValueChange = {},
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth().clickable { showDeleteReasonDropdown = true },
                                trailingIcon = { Text("▼") }
                            )
                            DropdownMenu(expanded = showDeleteReasonDropdown, onDismissRequest = { showDeleteReasonDropdown = false }) {
                                deleteReasonsList.forEach { reason ->
                                    DropdownMenuItem(text = { Text(reason) }, onClick = { deleteReason = reason; showDeleteReasonDropdown = false })
                                }
                            }
                        }
                        if (deleteReason == stringResource(Res.string.other)) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = customDeleteReason,
                                onValueChange = { customDeleteReason = it },
                                placeholder = { Text(stringResource(Res.string.enter_your_reason)) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            coroutineScope.launch {
                                val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                                if (currentUserId != null) {
                                    Supabase.updateUserStatus(currentUserId, "deleted")
                                    Supabase.client.auth.signOut()
                                    navigator.replaceAll(LoginScreen())
                                }
                            }
                            showDeleteDialog = false
                        }
                    ) { Text(stringResource(Res.string.request_deletion), color = MaterialTheme.colorScheme.error) }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) { Text(stringResource(Res.string.cancel), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            )
        }
    }
}

