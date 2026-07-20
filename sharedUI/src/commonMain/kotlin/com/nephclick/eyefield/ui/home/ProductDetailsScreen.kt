package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.border
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.animation.core.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.zIndex
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Product
import com.nephclick.eyefield.models.ProductReview
import com.nephclick.eyefield.models.Profile
import io.github.jan.supabase.auth.auth
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.ColorFilter
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*

internal fun formatPrice(price: Double): String {
    val integerPart = price.toLong()
    return integerPart.toString().reversed().chunked(3).joinToString(",").reversed()
}

class ProductDetailsScreen(val productId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()

        var product by remember { mutableStateOf<Product?>(Supabase.cachedProducts?.find { it.id == productId }) }
        var reviews by remember { mutableStateOf<List<ProductReview>>(emptyList()) }
        var relatedProducts by remember { mutableStateOf<List<Product>>(emptyList()) }
        var isLiked by remember { mutableStateOf(false) } // Ideally check if current user liked it
        var seller by remember { mutableStateOf<Profile?>(null) }
        
        var isLoading by remember { mutableStateOf(true) }
        
        var expandedMenu by remember { mutableStateOf(false) }
        var showReportDialog by remember { mutableStateOf(false) }
        var showToast by remember { mutableStateOf(false) }
        var reportReason by remember { mutableStateOf("Prohibited or Regulated Goods") }
        val reportReasons = listOf(
            "Prohibited or Regulated Goods",
            "Counterfeit, Fake, or Infringing Item",
            "Scam, Fraud, or Misleading Information",
            "Adult or Sexually Explicit Content",
            "Dangerous or Illegal Materials",
            "Spam or Irrelevant Listing"
        )
        var isReportReasonDropdownExpanded by remember { mutableStateOf(false) }

        LaunchedEffect(productId) {
            product = Supabase.fetchProductDetails(productId)
            product?.let { p ->
                seller = Supabase.fetchProfile(p.sellerId)
                reviews = Supabase.fetchReviews(p.id)
                relatedProducts = Supabase.fetchProducts(category = p.mainCategory).filter { it.id != p.id }
            }
            isLoading = false
        }

        var reviewText by remember { mutableStateOf("") }
        var selectedRating by remember { mutableStateOf(5) }
        
        var showDeleteProductConfirm by remember { mutableStateOf(false) }
        var isDeleting by remember { mutableStateOf(false) }
        val jumpAnimation by animateFloatAsState(
            targetValue = if (isDeleting) -50f else 0f,
            animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy, stiffness = Spring.StiffnessMedium)
        )
        
        var fullScreenImageUrl by remember { mutableStateOf<String?>(null) }
        var currentUserId by remember { mutableStateOf<String?>(null) }

        LaunchedEffect(Unit) {
            currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
        }

        // Local Orange Theme Wrapper - respects dark mode
        val baseColorScheme = MaterialTheme.colorScheme
        val orangeColorScheme = baseColorScheme.copy(
            primary = Color(0xFFFF9800),
            onPrimary = Color.White,
            secondary = Color(0xFFFF9800),
            onSecondary = Color.White
        )

        MaterialTheme(colorScheme = orangeColorScheme) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                topBar = {
                    CenterAlignedTopAppBar(
                        title = { Text(stringResource(Res.string.product_details), fontWeight = FontWeight.Bold) },
                        navigationIcon = {
                            TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back)) }
                        },
                        actions = {
                            IconButton(onClick = { expandedMenu = true }) {
                                Text("⋮", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            }
                            androidx.compose.material3.DropdownMenu(
                                expanded = expandedMenu,
                                onDismissRequest = { expandedMenu = false }
                            ) {
                                val currentUserId = com.nephclick.eyefield.utils.GlobalState.currentUser.value?.id
                                if (currentUserId != null && currentUserId == product?.sellerId) {
                                    androidx.compose.material3.DropdownMenuItem(
                                        text = { Text(stringResource(Res.string.edit_product_menu)) },
                                        onClick = { expandedMenu = false }
                                    )
                                    androidx.compose.material3.DropdownMenuItem(
                                        text = { Text(stringResource(Res.string.delete_product_menu)) },
                                        onClick = {
                                            expandedMenu = false
                                            navigator.pop()
                                        }
                                    )
                                } else {
                                    androidx.compose.material3.DropdownMenuItem(
                                        text = { Text(stringResource(Res.string.report_product_menu)) },
                                        onClick = {
                                            expandedMenu = false
                                            showReportDialog = true
                                        }
                                    )
                                }
                            }
                        }
                    )
                },
                bottomBar = {
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        tonalElevation = 8.dp,
                        shadowElevation = 8.dp
                    ) {
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                            Button(
                                onClick = { /* Handle chat */ },
                                modifier = Modifier.fillMaxWidth().height(56.dp),
                                shape = RoundedCornerShape(28.dp),
                                enabled = product != null
                            ) {
                                Text(stringResource(Res.string.chat_with_seller), style = MaterialTheme.typography.titleMedium, color = Color.White)
                            }
                        }
                    }
                }
            ) { paddingValues ->
                

                val p = product
                if (p == null) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(stringResource(Res.string.product_not_found))
                    }
                    return@Scaffold
                }

                if (fullScreenImageUrl != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black)
                            .clickable { fullScreenImageUrl = null }
                            .zIndex(10f)
                    ) {
                        AsyncImage(
                            model = fullScreenImageUrl,
                            contentDescription = "Full Screen",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                        IconButton(onClick = { fullScreenImageUrl = null }, modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)) {
                            Text("✕", color = Color.White, style = MaterialTheme.typography.headlineMedium)
                        }
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .offset(y = jumpAnimation.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Media Gallery (R2 Urls)
                    if (p.mediaUrls.isNotEmpty()) {
                        var selectedImageIndex by remember { mutableStateOf(0) }
                        val mainImageUrl = p.mediaUrls.getOrNull(selectedImageIndex) ?: p.mediaUrls.first()

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .wrapContentHeight()
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            AsyncImage(
                                model = mainImageUrl,
                                contentDescription = "Product Image",
                                contentScale = ContentScale.FillWidth,
                                modifier = Modifier.fillMaxWidth().wrapContentHeight().clickable { fullScreenImageUrl = mainImageUrl }
                            )

                            if (p.mediaUrls.size > 1) {
                                Row(
                                    modifier = Modifier
                                        .align(Alignment.BottomStart)
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    p.mediaUrls.forEachIndexed { index, url ->
                                        Box(
                                            modifier = Modifier
                                                .size(48.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(Color.DarkGray)
                                                .border(2.dp, if (selectedImageIndex == index) MaterialTheme.colorScheme.primary else Color.Transparent, RoundedCornerShape(8.dp))
                                                .clickable { selectedImageIndex = index }
                                        ) {
                                            AsyncImage(
                                                model = url,
                                                contentDescription = "Thumbnail",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(300.dp)
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Text(stringResource(Res.string.no_media_available), modifier = Modifier.align(Alignment.Center), style = MaterialTheme.typography.titleMedium)
                        }
                    }

                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Deadline
                        if (p.deadline != null) {
                            Surface(
                                color = MaterialTheme.colorScheme.errorContainer,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(
                                    text = org.jetbrains.compose.resources.stringResource(Res.string.deadline_prefix).replace("%s", p.deadline ?: ""),
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        // Product Name & Like Button
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = p.name,
                                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                modifier = Modifier.weight(1f)
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                if (currentUserId != null && currentUserId == p.sellerId) {
                                    IconButton(onClick = { 
                                        navigator.push(CreateProductScreen(productIdToEdit = p.id))
                                    }) {
                                        Image(painterResource(Res.drawable.compose), contentDescription="Edit", modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary))
                                    }
                                    IconButton(onClick = { showDeleteProductConfirm = true }) {
                                        Image(painterResource(Res.drawable.recycle_bin), contentDescription="Delete", modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(Color.Red))
                                    }
                                }
                                IconButton(onClick = { 
                                    isLiked = !isLiked
                                    coroutineScope.launch {
                                        val session = Supabase.client.auth.currentSessionOrNull()
                                        if (session != null) {
                                            Supabase.toggleLike(p.id, session.user?.id ?: "") // requires real user session in future
                                        }
                                    }
                                }) {
                                    Image(
                                        painter = painterResource(Res.drawable.heart),
                                        contentDescription = "Like",
                                        colorFilter = ColorFilter.tint(if (isLiked) Color.Red else MaterialTheme.colorScheme.onSurface),
                                        modifier = Modifier.size(28.dp)
                                    )
                                }
                            }
                        }

                        if (showDeleteProductConfirm) {
                            AlertDialog(
                                onDismissRequest = { showDeleteProductConfirm = false },
                                title = { Text(stringResource(Res.string.delete_product)) },
                                text = { Text(stringResource(Res.string.delete_product_confirm)) },
                                confirmButton = {
                                    TextButton(onClick = { 
                                        coroutineScope.launch {
                                            isDeleting = true
                                            kotlinx.coroutines.delay(300) // jump up and down animation wait
                                            isDeleting = false
                                            Supabase.deleteProduct(p.id)
                                            showDeleteProductConfirm = false
                                            navigator.pop()
                                        }
                                    }) { Text(stringResource(Res.string.delete), color = Color.Red) }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showDeleteProductConfirm = false }) { Text(stringResource(Res.string.cancel)) }
                                }
                            )
                        }

                        // Prices
                        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text(
                                text = "${p.currency} ${formatPrice(p.currentPrice)}",
                                style = MaterialTheme.typography.headlineMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            )
                            
                            val regularPrice = p.regularPrice
                            if (regularPrice != null && regularPrice > 0.0) {
                                Text(
                                    text = "${p.currency} ${formatPrice(regularPrice)}",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        color = Color.Gray,
                                        textDecoration = TextDecoration.LineThrough
                                    ),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                            }
                        }

                        // Limited Edition
                        if (p.isLimitedEdition) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("★", style = MaterialTheme.typography.titleMedium, color = Color(0xFFFFC107), modifier = Modifier.padding(end = 8.dp))
                                Text(stringResource(Res.string.limited_edition), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold), color = Color(0xFFFFC107))
                            }
                        }

                        // Seller Profile
                        if (seller != null) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 8.dp)) {
                                val avatarUrl = seller?.avatarUrl
                                if (!avatarUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = avatarUrl,
                                        contentDescription = "Seller Avatar",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.size(40.dp).clip(CircleShape)
                                    )
                                } else {
                                    Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary)) {
                                        Text((seller?.fullName?.firstOrNull() ?: seller?.username?.firstOrNull() ?: '?').toString(), color = Color.White, modifier = Modifier.align(Alignment.Center), fontWeight = FontWeight.Bold)
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(seller?.fullName ?: seller?.username ?: stringResource(Res.string.unknown_user), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                        // Categories Breadcrumbs
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            val mainCategory = p.mainCategory
                            if (mainCategory != null) {
                                Surface(color = MaterialTheme.colorScheme.secondaryContainer, shape = RoundedCornerShape(8.dp)) {
                                    Text(text = mainCategory, color = MaterialTheme.colorScheme.onSecondaryContainer, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                                }
                            }
                            
                            val subCategory = p.subCategory
                            if (subCategory != null) {
                                Text("→", modifier = Modifier.padding(horizontal = 8.dp), color = Color.Gray)
                                Surface(color = MaterialTheme.colorScheme.tertiaryContainer, shape = RoundedCornerShape(8.dp)) {
                                    Text(text = subCategory, color = MaterialTheme.colorScheme.onTertiaryContainer, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                                }
                            }
                        }

                        // Description
                        val description = p.description
                        if (!description.isNullOrBlank()) {
                            Text(stringResource(Res.string.description), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), modifier = Modifier.padding(top = 8.dp))
                            Text(text = description, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        
                        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))

                        // Reviews & Ratings
                        Text(stringResource(Res.string.reviews_and_ratings), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                            (1..5).forEach { star ->
                                Text(
                                    text = "★",
                                    color = if (star <= selectedRating) Color(0xFFFFC107) else Color.LightGray,
                                    style = MaterialTheme.typography.headlineMedium,
                                    modifier = Modifier.clickable { selectedRating = star }
                                )
                            }
                        }

                        OutlinedTextField(
                            value = reviewText,
                            onValueChange = { reviewText = it },
                            placeholder = { Text(stringResource(Res.string.write_review)) },
                            modifier = Modifier.fillMaxWidth().height(100.dp),
                            maxLines = 4,
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        Button(onClick = { 
                            coroutineScope.launch {
                                val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: return@launch
                                val rev = ProductReview(productId = p.id, userId = userId, rating = selectedRating, reviewText = reviewText)
                                Supabase.submitReview(rev)
                                reviewText = ""
                                reviews = Supabase.fetchReviews(p.id)
                            }
                        }, shape = RoundedCornerShape(16.dp)) {
                            Text(stringResource(Res.string.submit_review), color = Color.White)
                        }

                        var reviewToDelete by remember { mutableStateOf<ProductReview?>(null) }
                        
                        if (reviewToDelete != null) {
                            AlertDialog(
                                onDismissRequest = { reviewToDelete = null },
                                title = { Text(stringResource(Res.string.delete_review)) },
                                text = { Text(stringResource(Res.string.delete_review_confirm)) },
                                confirmButton = {
                                    TextButton(onClick = { 
                                        coroutineScope.launch {
                                            Supabase.deleteReview(reviewToDelete!!.id)
                                            reviews = Supabase.fetchReviews(p.id)
                                            reviewToDelete = null
                                        }
                                    }) { Text(stringResource(Res.string.delete), color = Color.Red) }
                                },
                                dismissButton = {
                                    TextButton(onClick = { reviewToDelete = null }) { Text(stringResource(Res.string.cancel)) }
                                }
                            )
                        }

                        Spacer(Modifier.height(8.dp))
                        if (reviews.isEmpty()) {
                            Text(stringResource(Res.string.no_reviews_yet), style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                        } else {
                            reviews.forEach { review ->
                                key(review.id) {
                                    var reviewerProfile by remember { mutableStateOf<Profile?>(null) }
                                    LaunchedEffect(review.userId) {
                                        reviewerProfile = Supabase.fetchProfile(review.userId)
                                    }
                                    var reviewOwnerId by remember { mutableStateOf<String?>(null) }
                                    LaunchedEffect(Unit) {
                                        reviewOwnerId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                                    }
                                    
                                    Surface(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.5f), shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                                Text(reviewerProfile?.username ?: reviewerProfile?.fullName ?: "User ${review.userId.take(4)}", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                                                
                                                if (reviewOwnerId == review.userId) {
                                                    IconButton(onClick = { reviewToDelete = review }, modifier = Modifier.size(24.dp)) {
                                                        Text("✕", color = Color.Red, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                                    }
                                                }
                                            }
                                            Row {
                                                (1..5).forEach { s ->
                                                    Text("★", color = if (s <= review.rating) Color(0xFFFFC107) else Color.LightGray, style = MaterialTheme.typography.labelSmall)
                                                }
                                            }
                                            val reviewTextVal = review.reviewText
                                            if (!reviewTextVal.isNullOrBlank()) {
                                                Text(reviewTextVal, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 4.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))

                        // Related Products
                        Text(stringResource(Res.string.related_products), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        if (relatedProducts.isEmpty()) {
                            Text(stringResource(Res.string.no_related_products_found), color = Color.Gray)
                        } else {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                items(relatedProducts) { related ->
                                    RelatedProductCard(title = related.name, price = formatPrice(related.currentPrice), currency = related.currency, mediaUrl = related.mediaUrls.firstOrNull(), onClick = { navigator.push(ProductDetailsScreen(related.id)) })
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(80.dp))
                    }
                }
            }

            if (showReportDialog) {
                androidx.compose.material3.AlertDialog(
                    onDismissRequest = { showReportDialog = false },
                    title = { Text(stringResource(Res.string.report_product)) },
                    text = {
                        androidx.compose.foundation.layout.Column {
                            Text(stringResource(Res.string.why_report))
                            androidx.compose.foundation.layout.Spacer(modifier = Modifier.height(8.dp))
                            Box {
                                androidx.compose.material3.OutlinedTextField(
                                    value = reportReason,
                                    onValueChange = {},
                                    readOnly = true,
                                    modifier = Modifier.fillMaxWidth().clickable { isReportReasonDropdownExpanded = true },
                                    trailingIcon = { Text("▼", modifier = Modifier.padding(end = 8.dp)) }
                                )
                                androidx.compose.material3.DropdownMenu(
                                    expanded = isReportReasonDropdownExpanded,
                                    onDismissRequest = { isReportReasonDropdownExpanded = false }
                                ) {
                                    reportReasons.forEach { reason ->
                                        androidx.compose.material3.DropdownMenuItem(
                                            text = { Text(reason) },
                                            onClick = {
                                                reportReason = reason
                                                isReportReasonDropdownExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    },
                    confirmButton = {
                        androidx.compose.material3.TextButton(onClick = {
                            coroutineScope.launch {
                                val currentUserId = com.nephclick.eyefield.utils.GlobalState.currentUser.value?.id
                                if (currentUserId != null) {
                                    Supabase.createProductReport(com.nephclick.eyefield.models.ProductReport(
                                        reporterId = currentUserId,
                                        productId = productId,
                                        reason = reportReason
                                    ))
                                }
                                showReportDialog = false
                                showToast = true
                                com.nephclick.eyefield.utils.GlobalState.hiddenProductIds.value = com.nephclick.eyefield.utils.GlobalState.hiddenProductIds.value + productId
                                navigator.pop() // Instant hide
                            }
                        }) {
                            Text(stringResource(Res.string.submit), color = MaterialTheme.colorScheme.error)
                        }
                    },
                    dismissButton = {
                        androidx.compose.material3.TextButton(onClick = { showReportDialog = false }) {
                            Text(stringResource(Res.string.cancel))
                        }
                    }
                )
            }
            
            if (showToast) {
                LaunchedEffect(showToast) {
                    kotlinx.coroutines.delay(3000)
                    showToast = false
                }
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                    androidx.compose.material3.Surface(
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
    private fun RelatedProductCard(title: String, price: String, currency: String, mediaUrl: String?, onClick: () -> Unit) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
            modifier = Modifier.width(140.dp).height(180.dp).clickable { onClick() }
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                if (mediaUrl != null) {
                    AsyncImage(
                        model = mediaUrl,
                        contentDescription = "Product Image",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.weight(1f).fillMaxWidth()
                    )
                } else {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth().background(Color.DarkGray.copy(alpha = 0.2f)))
                }
                Column(modifier = Modifier.padding(8.dp)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$currency $price",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
        
    }
}


