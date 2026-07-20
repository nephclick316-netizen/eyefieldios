package com.nephclick.eyefield.ui.admin

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.*
import com.nephclick.eyefield.ui.profile.ProfileScreen
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*
import kotlinx.coroutines.launch
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString

class AdminDashboardScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()
        var selectedTab by remember { mutableStateOf(0) }
        val tabs = listOf(
            stringResource(Res.string.admin_reports),
            stringResource(Res.string.admin_users),
            stringResource(Res.string.admin_statistics),
            stringResource(Res.string.admin_promo_card),
            stringResource(Res.string.admin_api_keys)
        )

        Scaffold(
            topBar = {
                Column {
                    TopAppBar(
                        title = { Text(stringResource(Res.string.admin_dashboard), fontWeight = FontWeight.Bold) },
                        navigationIcon = {
                            IconButton(onClick = { navigator.pop() }) {
                                Text("<")
                            }
                        }
                    )
                    ScrollableTabRow(
                        selectedTabIndex = selectedTab,
                        edgePadding = 16.dp,
                        containerColor = MaterialTheme.colorScheme.surface
                    ) {
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
        ) { paddingValues ->
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
                when (selectedTab) {
                    0 -> ReportsTab()
                    1 -> UsersTab()
                    2 -> StatisticsTab()
                    3 -> PromoCardTab()
                    4 -> ApiKeysTab()
                }
            }
        }
    }

    @Composable
    private fun ReportsTab() {
        var postReports by remember { mutableStateOf<List<PostReport>>(emptyList()) }
        var userReports by remember { mutableStateOf<List<UserReport>>(emptyList()) }
        var productReports by remember { mutableStateOf<List<ProductReport>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        var adminUploadProgress by remember { mutableStateOf(0f) }

        LaunchedEffect(Unit) {
            postReports = Supabase.fetchPostReports()
            userReports = Supabase.fetchUserReports()
            productReports = Supabase.fetchProductReports()
            isLoading = false
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
            item {
                Text(stringResource(Res.string.admin_post_reports), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
            }
            if (postReports.isEmpty()) {
                item { Text(stringResource(Res.string.admin_no_post_reports), color = Color.Gray); Spacer(modifier = Modifier.height(16.dp)) }
            } else {
                items(postReports) { report ->
                    PostReportItem(report)
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(Res.string.admin_product_reports), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
            }
            if (productReports.isEmpty()) {
                item { Text(stringResource(Res.string.admin_no_product_reports), color = Color.Gray); Spacer(modifier = Modifier.height(16.dp)) }
            } else {
                items(productReports) { report ->
                    ProductReportItem(report)
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(Res.string.admin_user_reports), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
            }
            if (userReports.isEmpty()) {
                item { Text(stringResource(Res.string.admin_no_user_reports), color = Color.Gray); Spacer(modifier = Modifier.height(16.dp)) }
            } else {
                items(userReports) { report ->
                    UserReportItem(report)
                }
            }
        }
    }

    @Composable
    private fun PostReportItem(report: PostReport) {
        val navigator = LocalNavigator.currentOrThrow
        var post by remember { mutableStateOf<Post?>(null) }
        var reporter by remember { mutableStateOf<Profile?>(null) }

        LaunchedEffect(report) {
            // Assume we have a way to fetch a single post or we filter from all posts
            val allPosts = Supabase.fetchPosts()
            post = allPosts.find { it.id == report.postId }
            reporter = Supabase.fetchProfile(report.userId)
        }

        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Reason: ${report.reason}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                if (!report.customReason.isNullOrBlank()) {
                    Text("Custom: ${report.customReason}", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("Reported by: ${reporter?.fullName ?: "Loading..."}", modifier = Modifier.clickable {
                    if (reporter != null) navigator.push(ProfileScreen(reporter!!.id))
                }, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.height(8.dp))
                if (post != null) {
                    Text("${stringResource(Res.string.admin_post_caption)}${post?.content ?: stringResource(Res.string.admin_no_caption)}", style = MaterialTheme.typography.bodyMedium)
                } else {
                    Text(stringResource(Res.string.admin_loading_post_details), color = Color.Gray)
                }
            }
        }
    }

    @Composable
    private fun ProductReportItem(report: ProductReport) {
        val navigator = LocalNavigator.currentOrThrow
        var product by remember { mutableStateOf<Product?>(null) }
        var reporter by remember { mutableStateOf<Profile?>(null) }

        LaunchedEffect(report) {
            product = Supabase.fetchProductDetails(report.productId)
            reporter = Supabase.fetchProfile(report.reporterId)
        }

        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("${stringResource(Res.string.admin_reason)}${report.reason}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                if (!report.customReason.isNullOrBlank()) {
                    Text("${stringResource(Res.string.admin_custom)}${report.customReason}", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("${stringResource(Res.string.admin_reported_by)}${reporter?.fullName ?: stringResource(Res.string.admin_loading)}", modifier = Modifier.clickable {
                    if (reporter != null) navigator.push(ProfileScreen(reporter!!.id))
                }, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.height(8.dp))
                if (product != null) {
                    Text("${stringResource(Res.string.admin_product_name)}${product?.name}", fontWeight = FontWeight.Bold)
                    Text("${stringResource(Res.string.admin_product_caption)}${product?.description ?: stringResource(Res.string.admin_no_description)}", style = MaterialTheme.typography.bodyMedium)
                } else {
                    Text(stringResource(Res.string.admin_loading_product_details), color = Color.Gray)
                }
            }
        }
    }

    @Composable
    private fun UserReportItem(report: UserReport) {
        val navigator = LocalNavigator.currentOrThrow
        var reportedUser by remember { mutableStateOf<Profile?>(null) }
        var reporter by remember { mutableStateOf<Profile?>(null) }

        LaunchedEffect(report) {
            reportedUser = Supabase.fetchProfile(report.reportedUserId)
            reporter = Supabase.fetchProfile(report.reporterId)
        }

        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("${stringResource(Res.string.admin_reason)}${report.reason}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                if (!report.customReason.isNullOrBlank()) {
                    Text("${stringResource(Res.string.admin_custom)}${report.customReason}", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("${stringResource(Res.string.admin_reported_by)}${reporter?.fullName ?: stringResource(Res.string.admin_loading)}", modifier = Modifier.clickable {
                    if (reporter != null) navigator.push(ProfileScreen(reporter!!.id))
                }, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.height(8.dp))
                Text("${stringResource(Res.string.admin_reported_user)}${reportedUser?.fullName ?: stringResource(Res.string.admin_loading)}", modifier = Modifier.clickable {
                    if (reportedUser != null) navigator.push(ProfileScreen(reportedUser!!.id))
                }, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
        }
    }

    @Composable
    private fun UsersTab() {
        var users by remember { mutableStateOf<List<Profile>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        val coroutineScope = rememberCoroutineScope()
        val navigator = LocalNavigator.currentOrThrow

        LaunchedEffect(Unit) {
            users = Supabase.fetchAllProfiles()
            isLoading = false
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(16.dp)) {
            items(users) { user ->
                Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f).clickable { navigator.push(ProfileScreen(user.id)) }) {
                            Text(user.fullName ?: stringResource(Res.string.admin_unknown_user), fontWeight = FontWeight.Bold)
                            Text(user.email, style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                            Text("${stringResource(Res.string.admin_status)}${user.status.replaceFirstChar { it.uppercase() }}", color = if (user.status == "suspended") MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
                        }
                        Column {
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        val newStatus = if (user.status == "suspended") "active" else "suspended"
                                        Supabase.updateUserStatus(user.id, newStatus)
                                        users = Supabase.fetchAllProfiles() // refresh
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                            ) {
                                Text(if (user.status == "suspended") stringResource(Res.string.admin_unsuspend) else stringResource(Res.string.admin_suspend))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        Supabase.deleteProfile(user.id)
                                        users = Supabase.fetchAllProfiles() // refresh
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text(stringResource(Res.string.admin_delete))
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun StatisticsTab() {
        var usersCount by remember { mutableStateOf(0) }
        var postsCount by remember { mutableStateOf(0) }
        var productsCount by remember { mutableStateOf(0) }
        var isLoading by remember { mutableStateOf(true) }

        LaunchedEffect(Unit) {
            usersCount = Supabase.fetchAllProfiles().size
            postsCount = Supabase.fetchPosts().size
            productsCount = Supabase.fetchProducts().size
            isLoading = false
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        val maxCount = maxOf(usersCount, postsCount, productsCount, 1)

        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            item {
                Text(stringResource(Res.string.admin_app_statistics), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(24.dp))

                // Simple Bar Chart
                Column(modifier = Modifier.fillMaxWidth()) {
                    StatBar("Users", usersCount, maxCount, MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(16.dp))
                    StatBar("Posts", postsCount, maxCount, MaterialTheme.colorScheme.secondary)
                    Spacer(modifier = Modifier.height(16.dp))
                    StatBar("Products", productsCount, maxCount, MaterialTheme.colorScheme.tertiary)
                }

                Spacer(modifier = Modifier.height(32.dp))
                Text(stringResource(Res.string.admin_detailed_metrics), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("${stringResource(Res.string.admin_total_users)}$usersCount", fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${stringResource(Res.string.admin_total_echoes)}$postsCount", fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("${stringResource(Res.string.admin_total_products)}$productsCount", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    @Composable
    private fun StatBar(label: String, count: Int, maxCount: Int, color: Color) {
        val fraction = count.toFloat() / maxCount.toFloat()
        Column(modifier = Modifier.fillMaxWidth()) {
            Text("$label: $count", fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Box(modifier = Modifier.fillMaxWidth().height(24.dp).background(Color.LightGray, RoundedCornerShape(12.dp))) {
                Box(modifier = Modifier.fillMaxWidth(fraction).height(24.dp).background(color, RoundedCornerShape(12.dp)))
            }
        }
    }

    @Composable
    private fun PromoCardTab() {
        var imageUrl by remember { mutableStateOf("") }
        var linkType by remember { mutableStateOf("Product ID") } // Product ID or External URL
        var linkValue by remember { mutableStateOf("") }
        var country by remember { mutableStateOf("Global") }
        var showToast by remember { mutableStateOf(false) }
        val coroutineScope = rememberCoroutineScope()
        var selectedImageBytes by remember { mutableStateOf<ByteArray?>(null) }
        var isLoading by remember { mutableStateOf(false) }
        var adminUploadProgress by remember { mutableStateOf(0f) }
        val imagePickerLauncher = com.nephclick.eyefield.utils.rememberGalleryLauncher { bytes ->
            selectedImageBytes = bytes
        }

        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            item {
                Text(stringResource(Res.string.admin_create_promo_card), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                
                if (selectedImageBytes != null) {
                    Text("${stringResource(Res.string.admin_image_selected)}${selectedImageBytes!!.size / 1024}${stringResource(Res.string.admin_kb)}", color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = { selectedImageBytes = null }) { Text(stringResource(Res.string.admin_remove_image)) }
                } else {
                    OutlinedButton(
                        onClick = { imagePickerLauncher() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(stringResource(Res.string.admin_upload_promo_image))
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(stringResource(Res.string.admin_or_enter_url))
                    OutlinedTextField(
                        value = imageUrl,
                        onValueChange = { imageUrl = it },
                        label = { Text(stringResource(Res.string.admin_image_url)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (imageUrl.isNotBlank()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("${stringResource(Res.string.admin_preview_url)}$imageUrl", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(stringResource(Res.string.admin_link_type))
                    Spacer(modifier = Modifier.width(8.dp))
                    RadioButton(selected = linkType == "Product ID", onClick = { linkType = "Product ID" })
                    Text(stringResource(Res.string.admin_product_id))
                    Spacer(modifier = Modifier.width(8.dp))
                    RadioButton(selected = linkType == "External URL", onClick = { linkType = "External URL" })
                    Text(stringResource(Res.string.admin_external_url))
                }

                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = linkValue,
                    onValueChange = { linkValue = it },
                    label = { Text("${stringResource(Res.string.admin_enter)}$linkType") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = country,
                    onValueChange = { country = it },
                    label = { Text(stringResource(Res.string.admin_country_placeholder)) },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))
                if (isLoading) {
                    val pct = (adminUploadProgress * 100).toInt()
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(progress = adminUploadProgress, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Uploading promo $pct%", style = MaterialTheme.typography.labelSmall)
                    }
                }
                Button(
                    onClick = {
                        coroutineScope.launch {
                                try {
                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isLoading = true; adminUploadProgress = 0f }
                                val finalImageUrl = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                                    if (selectedImageBytes != null) {
                                        com.nephclick.eyefield.utils.R2Uploader.uploadMedia(selectedImageBytes!!, "promo", "image/jpeg", "jpg") { sent, total ->
                                            val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                            kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { adminUploadProgress = pct } }
                                        }
                                    } else {
                                        imageUrl.ifBlank { "https://via.placeholder.com/400x200" }
                                    }
                                }
                                val productId = if (linkType == "Product ID") linkValue else null
                                val externalUrl = if (linkType == "External URL") linkValue else null
                                Supabase.createPromoCard(PromoCard(
                                    imageUrl = finalImageUrl,
                                    productId = productId,
                                    externalUrl = externalUrl,
                                    country = country
                                ))
                                showToast = true
                                imageUrl = ""
                                selectedImageBytes = null
                                linkValue = ""
                            } catch (e: Exception) {
                                android.util.Log.w("AdminDashboard", "Promo upload failed: ${e.message}")
                            } finally {
                                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isLoading = false }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = linkValue.isNotBlank() && country.isNotBlank()
                ) {
                    Text(stringResource(Res.string.admin_submit_promo_card))
                }

                Spacer(modifier = Modifier.height(16.dp))
                var showSqlDialog by remember { mutableStateOf(false) }
                val clipboard = LocalClipboardManager.current
                TextButton(onClick = { showSqlDialog = true }) {
                    Text("Telemetry SQL / Setup")
                }
                if (showSqlDialog) {
                    AlertDialog(onDismissRequest = { showSqlDialog = false }, title = { Text("Create telemetry table") }, text = {
                        Column {
                            Text("Run the following SQL in your Supabase SQL editor to create the client_telemetry table:")
                            Spacer(modifier = Modifier.height(8.dp))
                            val sql = """
                                CREATE TABLE IF NOT EXISTS public.client_telemetry (
                                  id bigserial PRIMARY KEY,
                                  user_id text,
                                  permission_denied_count integer,
                                  wake_failures integer,
                                  ts bigint
                                );
                            """.trimIndent()
                            Text(sql, style = MaterialTheme.typography.bodySmall)
                        }
                    }, confirmButton = {
                        TextButton(onClick = {
                            // Copy SQL to clipboard
                            try {
                                clipboard.setText(AnnotatedString("CREATE TABLE IF NOT EXISTS public.client_telemetry (id bigserial PRIMARY KEY, user_id text, permission_denied_count integer, wake_failures integer, ts bigint);"))
                            } catch (_: Throwable) {}
                            showSqlDialog = false
                        }) { Text("Copy SQL") }
                    }, dismissButton = {
                        TextButton(onClick = { showSqlDialog = false }) { Text("Close") }
                    })
                }

                if (showToast) {
                    LaunchedEffect(showToast) {
                        kotlinx.coroutines.delay(3000)
                        showToast = false
                    }
                    Text(stringResource(Res.string.admin_promo_card_success), color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 16.dp))
                }
            }
        }
    }

    @Composable
    private fun ApiKeysTab() {
        var openRouterKey by remember { mutableStateOf("") }
        var googleApiKey by remember { mutableStateOf("") }
        var showToast by remember { mutableStateOf(false) }
        var isLoading by remember { mutableStateOf(true) }
        val coroutineScope = rememberCoroutineScope()

        LaunchedEffect(Unit) {
            val keys = Supabase.fetchApiKeys()
            openRouterKey = keys.openrouterKey ?: ""
            googleApiKey = keys.googleApiKey ?: ""
            isLoading = false
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            item {
                Text(stringResource(Res.string.admin_api_keys_config), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(stringResource(Res.string.admin_openrouter_key), fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = openRouterKey,
                    onValueChange = { openRouterKey = it },
                    placeholder = { Text("sk-or-v1-...") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(stringResource(Res.string.admin_google_api_key), fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = googleApiKey,
                    onValueChange = { googleApiKey = it },
                    placeholder = { Text("AIzaSy...") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(32.dp))
                
                Button(
                    onClick = {
                        coroutineScope.launch {
                            Supabase.updateApiKeys(ApiKeys(
                                id = 1,
                                openrouterKey = openRouterKey.ifBlank { null },
                                googleApiKey = googleApiKey.ifBlank { null }
                            ))
                            showToast = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(stringResource(Res.string.admin_save_api_keys))
                }

                if (showToast) {
                    LaunchedEffect(showToast) {
                        kotlinx.coroutines.delay(3000)
                        showToast = false
                    }
                    Text(stringResource(Res.string.admin_api_keys_success), color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 16.dp))
                }
            }
        }
    }
}
