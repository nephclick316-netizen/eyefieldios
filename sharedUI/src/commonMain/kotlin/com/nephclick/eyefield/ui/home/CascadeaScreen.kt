package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Product
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale

class CascadeaScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedCurrency by remember { mutableStateOf("UGX") }
        val currencies = listOf("UGX", "KES", "TZS", "USD", "EUR", "GBP", "JPY", "CDF", "RWF")
        val currencyFlags = mapOf(
            "UGX" to "🇺🇬", "KES" to "🇰🇪", "TZS" to "🇹🇿", 
            "USD" to "🇺🇸", "EUR" to "🇪🇺", "GBP" to "🇬🇧", 
            "JPY" to "🇯🇵", "CDF" to "🇨🇩", "RWF" to "🇷🇼"
        )
        var showCurrencyDropdown by remember { mutableStateOf(false) }

        var searchQuery by remember { mutableStateOf("") }
        var showCameraPopup by remember { mutableStateOf(false) }
        var showFilterPopup by remember { mutableStateOf(false) }
        
        var selectedFilterCategory by remember { mutableStateOf("") }
        var showFilterCategoryDropdown by remember { mutableStateOf(false) }
        val filterCategories = listOf("House and equipment", "Electronique & Tech", "Fashion & Women Accessories", "Vehicle", "Art & Craft", "Real Estate", "Hardware", "Accomondation", "Others")

        var googleApiKey by remember { mutableStateOf<String?>(null) }
        LaunchedEffect(Unit) {
            val keys = com.nephclick.eyefield.Supabase.fetchApiKeys()
            googleApiKey = keys.googleApiKey
        }
        
        var selectedFilterPrice by remember { mutableStateOf("") }
        var showFilterPriceDropdown by remember { mutableStateOf(false) }
        val mockPrices = listOf("Under 50,000", "50,000 - 100,000", "100,000 - 500,000", "Above 500,000")
        
        var selectedFilterType by remember { mutableStateOf("") }
        val filterTypes = listOf("Latest", "Featured", "Limited Edition")
        
        var isSimulatingSearch by remember { mutableStateOf(false) }
        val coroutineScope = rememberCoroutineScope()
        
        val noMatchFoundMsg = stringResource(Res.string.no_match_found)
        val visualMatchFailedMsg = stringResource(Res.string.visual_match_failed)
        val handleImagePicked: (ByteArray?) -> Unit = { bytes ->
            if (bytes != null) {
                isSimulatingSearch = true
                coroutineScope.launch {
                    try {
                        val compressed = com.nephclick.eyefield.utils.compressImage(bytes)
                        @OptIn(kotlin.io.encoding.ExperimentalEncodingApi::class)
                        val base64Image = kotlin.io.encoding.Base64.Default.encode(compressed)
                        val results = com.nephclick.eyefield.utils.GoogleImageSearchService.analyzeImage(base64Image)
                        searchQuery = if (results.isNotEmpty()) results.first() else noMatchFoundMsg
                    } catch (e: Exception) {
                        searchQuery = visualMatchFailedMsg
                    }
                    isSimulatingSearch = false
                    showCameraPopup = false
                }
            } else {
                isSimulatingSearch = false
                // showCameraPopup = false // keep it open or close it? usually close
            }
        }
        
        val cameraLauncher = com.nephclick.eyefield.utils.rememberCameraLauncher(onImagePicked = handleImagePicked)
        val galleryLauncher = com.nephclick.eyefield.utils.rememberGalleryLauncher(onImagePicked = handleImagePicked)

        
        var showMoreNew by remember { mutableStateOf(false) }
        var showMoreLimited by remember { mutableStateOf(false) }
        var showMoreFeatured by remember { mutableStateOf(false) }
        var showMoreBestValue by remember { mutableStateOf(false) }
        
        var allProducts by remember { mutableStateOf<List<Product>>(emptyList()) }
        var isLoadingProducts by remember { mutableStateOf(true) }

        LaunchedEffect(Unit) {
            try {
                val cached = com.nephclick.eyefield.utils.PersistentCache.getString("cached_products")
                if (!cached.isNullOrEmpty()) {
                    try { allProducts = kotlinx.serialization.json.Json.decodeFromString(cached) } catch(e: Exception) {}
                }
                val fresh = Supabase.fetchProducts()
                allProducts = fresh
                com.nephclick.eyefield.utils.PersistentCache.saveString("cached_products", kotlinx.serialization.json.Json.encodeToString(kotlinx.serialization.builtins.ListSerializer(com.nephclick.eyefield.models.Product.serializer()), fresh.take(8)))
            } catch (e: Exception) {} finally {
                isLoadingProducts = false
            }
        }

        val baseColorScheme = MaterialTheme.colorScheme
        val orangeColorScheme = baseColorScheme.copy(
            primary = Color(0xFFFF9800),
            onPrimary = Color.White,
            secondary = Color(0xFFFF9800),
            onSecondary = Color.White
        )

        MaterialTheme(colorScheme = orangeColorScheme) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background
            ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                // Top App Bar Area
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "EyeField",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        // Endocard Button
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.clickable { navigator.push(AiScreen()) }
                        ) {
                            Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                                Image(
                                    painter = painterResource(Res.drawable.ai_robot),
                                    contentDescription = "AI Robot",
                                    modifier = Modifier.size(16.dp),
                                    colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.secondary)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text("ENDOCARD", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.secondary)
                            }
                        }

                        // Currency Dropdown
                        Box {
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                modifier = Modifier.clickable { showCurrencyDropdown = true }
                            ) {
                                Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(currencyFlags[selectedCurrency] ?: "🏳️", style = MaterialTheme.typography.labelSmall)
                                    Spacer(Modifier.width(4.dp))
                                    Text("$selectedCurrency", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onBackground)
                                }
                            }
                            DropdownMenu(
                                expanded = showCurrencyDropdown,
                                onDismissRequest = { showCurrencyDropdown = false }
                            ) {
                                currencies.forEach { currency ->
                                    DropdownMenuItem(
                                        text = { Text("${currencyFlags[currency]} $currency") },
                                        onClick = {
                                            selectedCurrency = currency
                                            showCurrencyDropdown = false
                                        }
                                    )
                                }
                            }
                        }

                        // Add Button
                        FloatingActionButton(
                            onClick = { navigator.push(CreateProductScreen()) },
                            containerColor = MaterialTheme.colorScheme.secondary,
                            contentColor = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(36.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("+", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Title Area
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Cascadea",
                        style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Black),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { navigator.push(BookScreen()) },
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.secondary)
                        ) {
                            Text(stringResource(Res.string.book), style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                        }
                        OutlinedButton(
                            onClick = { navigator.push(KopeScreen()) },
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.secondary)
                        ) {
                            Text(stringResource(Res.string.kope), style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = stringResource(Res.string.cascadea_desc),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Search Bar
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text(stringResource(Res.string.search_placeholder)) },
                    modifier = Modifier.fillMaxWidth().border(1.dp, MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(24.dp)),
                    shape = RoundedCornerShape(24.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    trailingIcon = {
                        Row(modifier = Modifier.padding(end = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Image(
                                painter = painterResource(Res.drawable.photo_camera),
                                contentDescription = "Camera",
                                modifier = Modifier.size(24.dp).clickable { showCameraPopup = true },
                                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant)
                            )
                            Image(
                                painter = painterResource(Res.drawable.filter),
                                contentDescription = "Filter",
                                modifier = Modifier.size(24.dp).clickable { showFilterPopup = true },
                                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant)
                            )
                        }
                    }
                )
                
                // Active Search State (Simulated list drop down -> Real list)
                if (searchQuery.isNotBlank()) {
                    var searchResults by remember { mutableStateOf<List<Product>>(emptyList()) }
                    var isSearching by remember { mutableStateOf(false) }

                    LaunchedEffect(searchQuery) {
                        isSearching = true
                        delay(500) // Debounce
                        searchResults = Supabase.searchProducts(searchQuery)
                        isSearching = false
                    }
                    
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        tonalElevation = 4.dp
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(org.jetbrains.compose.resources.stringResource(Res.string.results_for).replace("%s", searchQuery), style = MaterialTheme.typography.titleSmall)
                            Spacer(Modifier.height(8.dp))
                            
                            if (isSearching) {
                                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                            } else if (searchResults.isEmpty()) {
                                Text(stringResource(Res.string.no_products_found), style = MaterialTheme.typography.bodySmall)
                            } else {
                                searchResults.forEach { product ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { navigator.push(ProductDetailsScreen(product.id)) },
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        val mediaUrl = product.mediaUrls.firstOrNull()
                                        if (mediaUrl != null) {
                                            AsyncImage(
                                                model = mediaUrl,
                                                contentDescription = null,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.size(32.dp).clip(RoundedCornerShape(4.dp))
                                            )
                                        } else {
                                            Box(modifier = Modifier.size(32.dp).background(Color.Gray, RoundedCornerShape(4.dp)))
                                        }
                                        Spacer(Modifier.width(8.dp))
                                        Text(product.name, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Spacer(modifier = Modifier.height(24.dp))

                // Helper for generating dynamic product list
                @Composable
                fun LiveProductGrid(items: List<Product>, maxItems: Int) {
                    val displayItems = items.take(maxItems)
                    val columns = 2
                    val rows = (displayItems.size + columns - 1) / columns
                    
                    if (displayItems.isEmpty() && !isLoadingProducts) {
                        Text(stringResource(Res.string.no_products_available), modifier = Modifier.padding(16.dp))
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            for (r in 0 until rows) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                    for (c in 0 until columns) {
                                        val index = r * columns + c
                                        if (index < displayItems.size) {
                                            val product = displayItems[index]
                                            Box(modifier = Modifier.weight(1f)) {
                                                ProductCard(
                                                    title = product.name,
                                                    price = product.currentPrice.toString(),
                                                    productCurrency = product.currency,
                                                    targetCurrency = selectedCurrency,
                                                    rating = "${product.ratingAvg} (${product.likesCount})",
                                                    mediaUrl = product.mediaUrls.firstOrNull(),
                                                    isLimitedEdition = product.isLimitedEdition,
                                                    onClick = { navigator.push(ProductDetailsScreen(product.id)) }
                                                )
                                            }
                                        } else {
                                            Spacer(modifier = Modifier.weight(1f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // New Cascadea Section
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(stringResource(Res.string.new_cascadea), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Text(
                        text = stringResource(Res.string.all_products),
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.clickable { navigator.push(AllProductsScreen()) }
                    )
                }
                val visibleProducts = allProducts.filter { it.id !in com.nephclick.eyefield.utils.GlobalState.hiddenProductIds.value }
                
                Spacer(modifier = Modifier.height(16.dp))
                LiveProductGrid(items = visibleProducts, maxItems = if (showMoreNew) 8 else 4)
                TextButton(onClick = { showMoreNew = !showMoreNew }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text(if (showMoreNew) stringResource(Res.string.show_less) else stringResource(Res.string.more_new_cascadea))
                }

                Spacer(modifier = Modifier.height(24.dp))
                // Limited Offer Section
                Text(stringResource(Res.string.limited_offer), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = Color.Red)
                Spacer(modifier = Modifier.height(16.dp))
                LiveProductGrid(items = visibleProducts.filter { it.isLimitedEdition }, maxItems = if (showMoreLimited) 8 else 4)
                TextButton(onClick = { showMoreLimited = !showMoreLimited }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text(if (showMoreLimited) stringResource(Res.string.show_less) else stringResource(Res.string.more_limited_offers))
                }

                Spacer(modifier = Modifier.height(24.dp))
                // Featured Product Section (Sorted by Likes)
                Text(stringResource(Res.string.featured_product), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(16.dp))
                LiveProductGrid(items = visibleProducts.sortedByDescending { it.likesCount }, maxItems = if (showMoreFeatured) 8 else 4)
                TextButton(onClick = { showMoreFeatured = !showMoreFeatured }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text(if (showMoreFeatured) stringResource(Res.string.show_less) else stringResource(Res.string.more_featured))
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                // Best for Value Products Section (Sorted by Price)
                Text(stringResource(Res.string.best_for_value), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                Spacer(modifier = Modifier.height(16.dp))
                LiveProductGrid(items = visibleProducts.sortedBy { it.currentPrice }, maxItems = if (showMoreBestValue) 8 else 4)
                TextButton(onClick = { showMoreBestValue = !showMoreBestValue }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text(if (showMoreBestValue) stringResource(Res.string.show_less) else stringResource(Res.string.more_value_products))
                }
                
                Spacer(modifier = Modifier.height(80.dp)) // padding for bottom nav
            }
        }

        if (showCameraPopup) {
            ModalBottomSheet(
                onDismissRequest = { showCameraPopup = false },
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                    Text(stringResource(Res.string.search_with_image), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    if (isSimulatingSearch) {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(stringResource(Res.string.analyzing_image), modifier = Modifier.align(Alignment.CenterHorizontally))
                    } else {
                        Button(
                            onClick = { cameraLauncher() },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Text(stringResource(Res.string.take_image_camera))
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = { galleryLauncher() },

                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Text(stringResource(Res.string.choose_from_gallery))
                        }
                    }
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }

        if (showFilterPopup) {
            ModalBottomSheet(
                onDismissRequest = { showFilterPopup = false },
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(stringResource(Res.string.filters), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    
                    // Filter Category
                    ExposedDropdownMenuBox(
                        expanded = showFilterCategoryDropdown,
                        onExpandedChange = { showFilterCategoryDropdown = it }
                    ) {
                        OutlinedTextField(
                            value = selectedFilterCategory,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(stringResource(Res.string.main_category)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showFilterCategoryDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = showFilterCategoryDropdown,
                            onDismissRequest = { showFilterCategoryDropdown = false }
                        ) {
                            filterCategories.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text(cat) },
                                    onClick = {
                                        selectedFilterCategory = cat
                                        showFilterCategoryDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    // Filter Price
                    ExposedDropdownMenuBox(
                        expanded = showFilterPriceDropdown,
                        onExpandedChange = { showFilterPriceDropdown = it }
                    ) {
                        OutlinedTextField(
                            value = selectedFilterPrice,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(stringResource(Res.string.price_range)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showFilterPriceDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = showFilterPriceDropdown,
                            onDismissRequest = { showFilterPriceDropdown = false }
                        ) {
                            mockPrices.forEach { priceRange ->
                                DropdownMenuItem(
                                    text = { Text(priceRange) },
                                    onClick = {
                                        selectedFilterPrice = priceRange
                                        showFilterPriceDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    // Filter Types
                    Text(stringResource(Res.string.type), style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        filterTypes.forEach { fType ->
                            FilterChip(
                                selected = selectedFilterType == fType,
                                onClick = { selectedFilterType = fType },
                                label = { Text(fType) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { showFilterPopup = false },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text(stringResource(Res.string.apply_filters))
                    }
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }
        }
        }
    }

    @Composable
    private fun ProductCard(title: String, price: String, productCurrency: String, targetCurrency: String, rating: String, mediaUrl: String?, isLimitedEdition: Boolean, onClick: () -> Unit) {
        val ugxRates = mapOf(
            "UGX" to 1.0,
            "USD" to 0.00026,
            "EUR" to 0.00024,
            "GBP" to 0.00020,
            "KES" to 0.035,
            "TZS" to 0.67,
            "JPY" to 0.040,
            "CDF" to 0.73,
            "RWF" to 0.35
        )
        val productRate = ugxRates[productCurrency] ?: 1.0
        val targetRate = ugxRates[targetCurrency] ?: 1.0

        val convertedPrice = try {
            val basePrice = price.toDouble()
            // Convert to UGX first, then to target currency
            val priceInUgx = basePrice / productRate
            priceInUgx * targetRate
        } catch (e: Exception) {
            0.0
        }
        // Format price simply for mock
        val priceString = "${targetCurrency} ${formatPrice(convertedPrice)}"

        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
            modifier = Modifier.fillMaxWidth().aspectRatio(0.75f).clickable { onClick() }
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                // Full background image
                if (mediaUrl != null) {
                    AsyncImage(
                        model = mediaUrl,
                        contentDescription = "Product Image",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray.copy(alpha = 0.2f)))
                }

                // Overlay container for text at the bottom
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.6f))
                        .padding(12.dp)
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = priceString,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "★ $rating",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White
                    )
                }

                if (isLimitedEdition) {
                    Surface(
                        color = Color.Red,
                        shape = RoundedCornerShape(topStart = 16.dp, bottomEnd = 8.dp),
                        modifier = Modifier.align(Alignment.TopStart)
                    ) {
                        Text(
                            text = "Limited Edition",
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

