package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.rememberScrollState
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
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.ai_robot
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import org.jetbrains.compose.resources.painterResource
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Product
import kotlinx.coroutines.launch
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale

class AllProductsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        var selectedCurrency by remember { mutableStateOf("UGX") }
        var showCurrencyDropdown by remember { mutableStateOf(false) }
        val currencies = listOf("UGX", "KES", "TZS", "USD", "EUR", "GBP", "JPY", "CDF", "RWF")
        val currencyFlags = mapOf(
            "UGX" to "🇺🇬", "KES" to "🇰🇪", "TZS" to "🇹🇿", "USD" to "🇺🇸",
            "EUR" to "🇪🇺", "GBP" to "🇬🇧", "JPY" to "🇯🇵", "CDF" to "🇨🇩", "RWF" to "🇷🇼"
        )
        
        val categories = listOf("House and equipment", "Electronique & Tech", "Fashion", "Vehicle", "Art & Craft", "Real Estate")

        var allProducts by remember { mutableStateOf<List<Product>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }

        LaunchedEffect(Unit) {
            allProducts = Supabase.fetchProducts()
            isLoading = false
        }

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
                // Top App Bar Area (Same as Cascadea)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back), color = MaterialTheme.colorScheme.onBackground) }
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = "EyeField",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }

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
                    }
                }
                
                Spacer(Modifier.height(16.dp))
                Text(stringResource(Res.string.all_products), style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Bold))
                Spacer(Modifier.height(16.dp))

                // Promo Banner (Sliding Limited Offers)
                val limitedOffers = allProducts.filter { it.isLimitedEdition }
                if (limitedOffers.isNotEmpty()) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(limitedOffers) { product ->
                            Box(
                                modifier = Modifier
                                    .fillParentMaxWidth()
                                    .height(150.dp)
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(MaterialTheme.colorScheme.tertiary)
                                    .clickable { navigator.push(ProductDetailsScreen(product.id)) }
                            ) {
                                // Background Image (R2 Urls)
                                val mediaUrl = product.mediaUrls.firstOrNull()
                                if (mediaUrl != null) {
                                    AsyncImage(
                                        model = mediaUrl,
                                        contentDescription = "Promo Background",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize(),
                                        alpha = 0.5f
                                    )
                                }
                                Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)))
                                
                                Column(
                                    modifier = Modifier.fillMaxHeight().padding(24.dp),
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Surface(
                                        color = Color.White.copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(16.dp)
                                    ) {
                                        Text(
                                            text = stringResource(Res.string.limited_edition_upper),
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = product.name,
                                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                                        color = Color.White,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                } else if (isLoading) {
                    Box(modifier = Modifier.fillMaxWidth().height(150.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Categories
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    categories.forEach { cat ->
                        FilterChip(
                            selected = false,
                            onClick = {},
                            label = { Text(cat) }
                        )
                    }
                }
                
                Spacer(Modifier.height(24.dp))

                Text(stringResource(Res.string.new_cascadea), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                Spacer(Modifier.height(16.dp))
                
                val displayProducts = allProducts.take(8)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.heightIn(max = 1000.dp),
                    userScrollEnabled = false
                ) {
                    items(displayProducts.size) { index ->
                        val p = displayProducts[index]
                        ProductCardMini(
                            title = p.name, 
                            price = p.currentPrice.toString(), 
                            currency = p.currency, 
                            mediaUrl = p.mediaUrls.firstOrNull(),
                            isLimitedEdition = p.isLimitedEdition
                        ) {
                            navigator.push(ProductDetailsScreen(p.id))
                        }
                    }
                }

                Spacer(Modifier.height(32.dp))

                Text(stringResource(Res.string.featured_cascadea), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                Spacer(Modifier.height(16.dp))

                val featuredProducts = allProducts.sortedByDescending { it.likesCount }.take(8)
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.heightIn(max = 1000.dp),
                    userScrollEnabled = false
                ) {
                    items(featuredProducts.size) { index ->
                        val p = featuredProducts[index]
                        ProductCardMini(
                            title = p.name, 
                            price = p.currentPrice.toString(), 
                            currency = p.currency, 
                            mediaUrl = p.mediaUrls.firstOrNull(),
                            isLimitedEdition = p.isLimitedEdition
                        ) {
                            navigator.push(ProductDetailsScreen(p.id))
                        }
                    }
                }
                
                Spacer(Modifier.height(80.dp))
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
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
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
