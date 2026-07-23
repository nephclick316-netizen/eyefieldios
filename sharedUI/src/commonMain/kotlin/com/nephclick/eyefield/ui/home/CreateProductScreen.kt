package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Product
import io.github.jan.supabase.auth.auth
import com.nephclick.eyefield.utils.rememberCameraLauncher
import com.nephclick.eyefield.utils.rememberGalleryLauncher
import com.nephclick.eyefield.utils.compressImage
import com.nephclick.eyefield.utils.R2Uploader
import coil3.compose.AsyncImage
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
class CreateProductScreen(val productIdToEdit: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()

        var productName by remember { mutableStateOf("") }
        var productDescription by remember { mutableStateOf("") }
        val uploadedImages = remember { mutableStateListOf<String>() }
        var showDatePicker by remember { mutableStateOf(false) }
        var price by remember { mutableStateOf("") }
        var regularPrice by remember { mutableStateOf("") }
        var currency by remember { mutableStateOf("UGX") }
        val currencies = listOf("UGX", "KES", "TZS", "USD", "EUR", "GBP", "JPY", "CDF", "RWF")
        var showCurrencyDropdown by remember { mutableStateOf(false) }
        
        var isLoadingEdit by remember { mutableStateOf(productIdToEdit != null) }

        LaunchedEffect(productIdToEdit) {
            if (productIdToEdit != null) {
                try {
                    val p = Supabase.fetchProductDetails(productIdToEdit)
                    if (p != null) {
                        productName = p.name
                        productDescription = p.description ?: ""
                        uploadedImages.clear()
                        uploadedImages.addAll(p.mediaUrls)
                        price = p.currentPrice.toString()
                        regularPrice = p.regularPrice?.toString() ?: ""
                        currency = p.currency
                        // Can't safely set selectedMainCategory without triggering dependent logic, but we try:
                    }
                } catch (e: Exception) {
                    println("Error fetching product to edit: ${e.message}")
                } finally {
                    isLoadingEdit = false
                }
            }
        }
        
        var showImageSourceDialog by remember { mutableStateOf(false) }
        var isUploading by remember { mutableStateOf(false) }
        // per-slot progress for uploadedImages
        val productUploadProgresses = remember { mutableStateListOf<Float>() }
        
        val handleImagePicked: (ByteArray?) -> Unit = { bytes ->
            if (bytes != null) {
                // Run compression and upload on IO dispatcher to avoid blocking UI
                coroutineScope.launch {
                    // register slot
                    val slotIndex = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                        productUploadProgresses.add(0f)
                        productUploadProgresses.lastIndex
                    }
                    try {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploading = true }
                        val url = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
                            val compressed = compressImage(bytes)
                            R2Uploader.uploadMedia(compressed, "product", "image/jpeg", "jpg") { sent, total ->
                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { productUploadProgresses[slotIndex] = pct } }
                            }
                        }
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                            if (uploadedImages.size < 3) uploadedImages.add(url)
                            productUploadProgresses[slotIndex] = 1f
                        }
                    } catch (e: Exception) {
                        println("Upload failed: ${e.message}")
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { productUploadProgresses[slotIndex] = 0f }
                    } finally {
                        kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { isUploading = productUploadProgresses.any { it in 0f..0.999f } }
                    }
                }
            }
        }
        
        val cameraLauncher = rememberCameraLauncher(onImagePicked = handleImagePicked)
        val galleryLauncher = rememberGalleryLauncher(onImagePicked = handleImagePicked)
        
        var selectedMainCategory by remember { mutableStateOf("") }
        var showMainCategoryDropdown by remember { mutableStateOf(false) }
        
        var selectedSubCategory by remember { mutableStateOf("") }
        var showSubCategoryDropdown by remember { mutableStateOf(false) }
        
        var selectedCondition by remember { mutableStateOf("") }
        val conditions = listOf("New", "Used", "Refurbished")
        
        val availableCountries = listOf(
            "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
            "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
            "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde",
            "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)",
            "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
            "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia", "Fiji", "Finland",
            "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
            "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran",
            "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
            "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
            "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
            "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia",
            "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
            "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
            "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
            "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
            "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
            "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
            "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu",
            "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
        )
        val selectedCountries = remember { mutableStateListOf<String>() }
        var showCountryDropdown by remember { mutableStateOf(false) }
        
        var isLimitedEdition by remember { mutableStateOf(false) }
        var deadline by remember { mutableStateOf("") }
        
        val selectedColors = remember { mutableStateListOf<Color>() }
        
        val availableColors = listOf(
            Color.Black, Color.White, Color.Red, Color.Blue, 
            Color.Green, Color.Yellow, Color.Gray, Color(0xFFFF9800)
        )

        val categories = mapOf(
            "House and equipment" to listOf("Furniture", "Kitchenware", "Decor"),
            "Electronique & Tech" to listOf("Phones", "Laptops", "Accessories"),
            "Fashion & Women Accessories" to listOf("Clothing", "Shoes", "Jewelry"),
            "Vehicle" to listOf("Cars", "Motorcycles", "Parts"),
            "Art & Craft" to listOf("Paintings", "Sculptures", "Handmade"),
            "Real Estate" to listOf("Houses", "Land", "Rentals"),
            "Hardware" to listOf("Tools", "Materials", "Plumbing"),
            "Accomondation" to listOf("Hotels", "Apartments", "Hostels"),
            "Others" to listOf("Miscellaneous")
        )

        val needsCondition = selectedMainCategory in listOf("Electronique & Tech", "Vehicle", "Hardware")
        val needsColor = selectedMainCategory in listOf("Electronique & Tech", "Fashion & Women Accessories", "Vehicle")

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(if (productIdToEdit != null) stringResource(Res.string.edit_product) else stringResource(Res.string.create_product), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back)) }
                    }
                    ,
                    actions = {
                        if (isUploading) {
                            val pctF = if (productUploadProgresses.isNotEmpty()) productUploadProgresses.maxOrNull() ?: 0f else 0f
                            val pct = (pctF * 100).toInt()
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(progress = pctF, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("$pct%", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (isLoadingEdit) {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                
                // Image Upload Section
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(Res.string.product_media_max), style = MaterialTheme.typography.titleSmall)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        for (i in 0 until 3) {
                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable {
                                        if (i == uploadedImages.size && uploadedImages.size < 3 && !isUploading) {
                                            showImageSourceDialog = true
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                if (i < uploadedImages.size) {
                                    AsyncImage(
                                        model = uploadedImages[i],
                                        contentDescription = "Uploaded Image",
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else if (i == uploadedImages.size && isUploading) {
                                    val pct = productUploadProgresses.getOrNull(i) ?: 0f
                                    if (pct > 0f) CircularProgressIndicator(progress = pct, modifier = Modifier.size(24.dp)) else CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                } else if (i == uploadedImages.size) {
                                    Text("+", style = MaterialTheme.typography.headlineMedium)
                                }
                            }
                        }
                    }
                }

                if (showImageSourceDialog) {
                    AlertDialog(
                        onDismissRequest = { showImageSourceDialog = false },
                        title = { Text(stringResource(Res.string.select_image_source)) },
                        text = { Text(stringResource(Res.string.where_to_pick_image)) },
                        confirmButton = {
                            TextButton(onClick = {
                                showImageSourceDialog = false
                                cameraLauncher()
                            }) { Text(stringResource(Res.string.camera)) }
                        },
                        dismissButton = {
                            TextButton(onClick = {
                                showImageSourceDialog = false
                                galleryLauncher()
                            }) { Text(stringResource(Res.string.gallery)) }
                        }
                    )
                }

                OutlinedTextField(
                    value = productName,
                    onValueChange = { productName = it },
                    label = { Text(stringResource(Res.string.product_name_req)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = productDescription,
                    onValueChange = { productDescription = it },
                    label = { Text(stringResource(Res.string.product_desc_req)) },
                    modifier = Modifier.fillMaxWidth().height(120.dp),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 5
                )

                // Main Category
                ExposedDropdownMenuBox(
                    expanded = showMainCategoryDropdown,
                    onExpandedChange = { showMainCategoryDropdown = it }
                ) {
                    OutlinedTextField(
                        value = selectedMainCategory,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(stringResource(Res.string.main_category_req)) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showMainCategoryDropdown) },
                        modifier = Modifier.menuAnchor().fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = showMainCategoryDropdown,
                        onDismissRequest = { showMainCategoryDropdown = false }
                    ) {
                        categories.keys.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = {
                                    selectedMainCategory = cat
                                    selectedSubCategory = ""
                                    showMainCategoryDropdown = false
                                }
                            )
                        }
                    }
                }

                // Sub Category
                if (selectedMainCategory.isNotEmpty()) {
                    ExposedDropdownMenuBox(
                        expanded = showSubCategoryDropdown,
                        onExpandedChange = { showSubCategoryDropdown = it }
                    ) {
                        OutlinedTextField(
                            value = selectedSubCategory,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(stringResource(Res.string.subcategory)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showSubCategoryDropdown) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = showSubCategoryDropdown,
                            onDismissRequest = { showSubCategoryDropdown = false }
                        ) {
                            categories[selectedMainCategory]?.forEach { subCat ->
                                DropdownMenuItem(
                                    text = { Text(subCat) },
                                    onClick = {
                                        selectedSubCategory = subCat
                                        showSubCategoryDropdown = false
                                    }
                                )
                            }
                        }
                    }
                }

                if (needsCondition) {
                    Text(stringResource(Res.string.item_condition), style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        conditions.forEach { condition ->
                            FilterChip(
                                selected = selectedCondition == condition,
                                onClick = { selectedCondition = condition },
                                label = { Text(condition) }
                            )
                        }
                    }
                }

                if (needsColor) {
                    Text(stringResource(Res.string.select_colors), style = MaterialTheme.typography.titleSmall)
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        availableColors.forEach { color ->
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .clickable {
                                        if (selectedColors.contains(color)) selectedColors.remove(color)
                                        else selectedColors.add(color)
                                    }
                                    .padding(4.dp)
                            ) {
                                if (selectedColors.contains(color)) {
                                    Box(
                                        modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color.White.copy(alpha = 0.5f))
                                    )
                                }
                            }
                        }
                    }
                }

                // Country Selector
                Box {
                    OutlinedTextField(
                        value = if (selectedCountries.isEmpty()) stringResource(Res.string.select_countries) else selectedCountries.joinToString(", "),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(stringResource(Res.string.sell_to_countries_req)) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCountryDropdown) },
                        modifier = Modifier.fillMaxWidth().clickable { showCountryDropdown = true },
                        enabled = false, // disable text input to capture click on Box
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Box(modifier = Modifier.matchParentSize().clickable { showCountryDropdown = true })
                    
                    DropdownMenu(
                        expanded = showCountryDropdown,
                        onDismissRequest = { showCountryDropdown = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text(stringResource(Res.string.select_all_countries)) },
                            onClick = {
                                selectedCountries.clear()
                                selectedCountries.addAll(availableCountries)
                                showCountryDropdown = false
                            }
                        )
                        availableCountries.forEach { country ->
                            DropdownMenuItem(
                                text = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Checkbox(
                                            checked = selectedCountries.contains(country),
                                            onCheckedChange = null
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(country)
                                    }
                                },
                                onClick = {
                                    if (selectedCountries.contains(country)) selectedCountries.remove(country)
                                    else selectedCountries.add(country)
                                }
                            )
                        }
                    }
                }

                Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = price,
                        onValueChange = { price = it },
                        label = { Text(stringResource(Res.string.price_req)) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Box(modifier = Modifier.fillMaxHeight().aspectRatio(1f)) {
                        OutlinedButton(
                            onClick = { showCurrencyDropdown = true },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(currency)
                        }
                        DropdownMenu(
                            expanded = showCurrencyDropdown,
                            onDismissRequest = { showCurrencyDropdown = false }
                        ) {
                            currencies.forEach { curr ->
                                DropdownMenuItem(
                                    text = { Text(curr) },
                                    onClick = { currency = curr; showCurrencyDropdown = false }
                                )
                            }
                        }
                    }
                }
                
                OutlinedTextField(
                    value = regularPrice,
                    onValueChange = { regularPrice = it },
                    label = { Text(stringResource(Res.string.regular_price_opt)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = isLimitedEdition, onCheckedChange = { isLimitedEdition = it })
                    Text(stringResource(Res.string.limited_edition_opt))
                }

                if (isLimitedEdition) {
                    Box {
                        OutlinedTextField(
                            value = deadline,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(stringResource(Res.string.deadline_opt)) },
                            modifier = Modifier.fillMaxWidth().clickable { showDatePicker = true },
                            enabled = false, // disable to handle clicks
                            colors = OutlinedTextFieldDefaults.colors(
                                disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                disabledBorderColor = MaterialTheme.colorScheme.outline,
                                disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Box(modifier = Modifier.matchParentSize().clickable { showDatePicker = true })
                    }
                }

                if (showDatePicker) {
                    DatePickerDialog(
                        onDismissRequest = { showDatePicker = false },
                        confirmButton = {
                            TextButton(onClick = {
                                deadline = "2026-12-31" // Mock selected date
                                showDatePicker = false
                            }) { Text(stringResource(Res.string.ok)) }
                        },
                        dismissButton = {
                            TextButton(onClick = { showDatePicker = false }) { Text(stringResource(Res.string.cancel)) }
                        }
                    ) {
                        // Mock Date picker content, in reality you would use rememberDatePickerState()
                        Column(modifier = Modifier.padding(24.dp)) {
                            Text(stringResource(Res.string.select_date), style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(16.dp))
                            Text("Mock Date: 2026-12-31", style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        coroutineScope.launch {
                            val productToSave = Product(
                                id = productIdToEdit ?: "", // if it's new it should be ""
                                sellerId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: throw Exception("Not logged in"),
                                name = productName,
                                description = productDescription.takeIf { it.isNotBlank() },
                                regularPrice = regularPrice.toDoubleOrNull(),
                                currentPrice = price.toDoubleOrNull() ?: 0.0,
                                currency = currency,
                                isLimitedEdition = isLimitedEdition,
                                deadline = deadline.takeIf { it.isNotBlank() },
                                mainCategory = selectedMainCategory.takeIf { it.isNotBlank() },
                                subCategory = selectedSubCategory.takeIf { it.isNotBlank() },
                                availableColors = selectedColors.map { "#" + it.value.toString(16).substring(0, 8) },
                                mediaUrls = uploadedImages
                            )
                            if (productIdToEdit != null) {
                                Supabase.updateProduct(productToSave)
                            } else {
                                Supabase.createProduct(productToSave)
                            }
                            navigator.pop()
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    if (productIdToEdit != null) {
                        Text(stringResource(Res.string.save_changes), style = MaterialTheme.typography.titleMedium)
                    } else if (isLimitedEdition) {
                        Text(stringResource(Res.string.last_sell), style = MaterialTheme.typography.titleMedium)
                    } else {
                        Text(stringResource(Res.string.publish), style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}
