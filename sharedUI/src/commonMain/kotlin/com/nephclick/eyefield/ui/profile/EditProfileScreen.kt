package com.nephclick.eyefield.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Business
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.utils.byteArrayToImageBitmap
import com.nephclick.eyefield.utils.cropImage
import com.nephclick.eyefield.utils.rememberGalleryLauncher
import io.github.jan.supabase.auth.auth
import coil3.compose.AsyncImage
import coil3.compose.SubcomposeAsyncImage
import com.nephclick.eyefield.utils.R2Uploader
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
// Removed java.time imports
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.graphics.ColorFilter
import org.jetbrains.compose.resources.painterResource
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import com.nephclick.eyefield.ui.auth.Country
import com.nephclick.eyefield.ui.auth.allCountries

class EditProfileScreen(private val initialProfile: Profile, private val initialBusiness: Business?) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()

        // State Variables pre-filled
        var fullName by remember { mutableStateOf(initialProfile.fullName ?: "") }
        var username by remember { mutableStateOf(initialProfile.username ?: "") }
        
        LaunchedEffect(fullName) {
            if (username.isBlank() && fullName.isNotBlank()) {
                username = fullName.replace("\\s".toRegex(), "").lowercase() + kotlin.random.Random.nextInt(1000, 9999)
            }
        }

        var bio by remember { mutableStateOf(initialProfile.bio ?: "") }
        var dob by remember { mutableStateOf(initialProfile.dateOfBirth ?: "") }
        var showDatePicker by remember { mutableStateOf(false) }
        val datePickerState = rememberDatePickerState()

        val parsedCountry = allCountries.find { it.name == initialProfile.country } ?: allCountries[0]
        var selectedCountry by remember { mutableStateOf(parsedCountry) }
        var showCountryDropdown by remember { mutableStateOf(false) }
        
        val parsedPhone = initialProfile.phoneNumber?.removePrefix(parsedCountry.dialCode) ?: ""
        var phoneNumber by remember { mutableStateOf(parsedPhone) }
        var cityAddress by remember { mutableStateOf(initialProfile.cityAddress ?: "") }

        var businessName by remember { mutableStateOf(initialBusiness?.businessName ?: "") }
        val businessCategories = listOf("Technology", "Retail", "Health", "Finance", "Food & Beverage", "Education", "Other")
        val parsedCategory = if (businessCategories.contains(initialBusiness?.category)) initialBusiness?.category else "Other"
        var selectedCategory by remember { mutableStateOf(parsedCategory ?: businessCategories[0]) }
        var showCategoryDropdown by remember { mutableStateOf(false) }
        var customCategory by remember { mutableStateOf(if (parsedCategory == "Other") initialBusiness?.category ?: "" else "") }
        var webLink by remember { mutableStateOf(initialBusiness?.websiteUrl ?: "") }
        var businessAddress by remember { mutableStateOf(initialBusiness?.businessAddress ?: "") }

        // Media
        var avatarBytes by remember { mutableStateOf<ByteArray?>(null) }
        var pendingCropAvatarBytes by remember { mutableStateOf<ByteArray?>(null) }
        val avatarPickerLauncher = rememberGalleryLauncher { bytes -> pendingCropAvatarBytes = bytes }

        var bannerBytes by remember { mutableStateOf<ByteArray?>(null) }
        var pendingCropBannerBytes by remember { mutableStateOf<ByteArray?>(null) }
        val bannerPickerLauncher = rememberGalleryLauncher { bytes -> pendingCropBannerBytes = bytes }

        var isLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        var avatarUploadProgress by remember { mutableStateOf(0f) }
        var bannerUploadProgress by remember { mutableStateOf(0f) }

        // Avatar Crop Dialog
        if (pendingCropAvatarBytes != null) {
            var scale by remember { mutableStateOf(1f) }
            var offsetX by remember { mutableStateOf(0f) }
            var offsetY by remember { mutableStateOf(0f) }
            val viewportSize = 300
            val imageBitmap = remember(pendingCropAvatarBytes) { pendingCropAvatarBytes?.let { byteArrayToImageBitmap(it) } }

            Dialog(onDismissRequest = { pendingCropAvatarBytes = null }) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, modifier = Modifier.padding(16.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                        Text(stringResource(Res.string.adjust_avatar), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier.size(viewportSize.dp).clip(CircleShape).background(Color.Black)
                                .pointerInput(Unit) { detectTransformGestures { _, pan, zoom, _ -> scale = (scale * zoom).coerceIn(1f, 5f); offsetX += pan.x; offsetY += pan.y } },
                            contentAlignment = Alignment.Center
                        ) {
                            if (imageBitmap != null) {
                                Image(bitmap = imageBitmap, contentDescription = stringResource(Res.string.crop_preview), modifier = Modifier.fillMaxSize().graphicsLayer(scaleX = scale, scaleY = scale, translationX = offsetX, translationY = offsetY), contentScale = ContentScale.Crop)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            TextButton(onClick = { pendingCropAvatarBytes = null }) { Text(stringResource(Res.string.cancel), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            Button(onClick = { avatarBytes = cropImage(pendingCropAvatarBytes!!, offsetX, offsetY, scale, viewportSize) ?: pendingCropAvatarBytes; pendingCropAvatarBytes = null }) { Text(stringResource(Res.string.crop_and_save)) }
                        }
                    }
                }
            }
        }

        // Banner Crop Dialog (Rectangular 16:9 approx)
        if (pendingCropBannerBytes != null) {
            var scale by remember { mutableStateOf(1f) }
            var offsetX by remember { mutableStateOf(0f) }
            var offsetY by remember { mutableStateOf(0f) }
            val viewportWidth = 300
            val viewportHeight = 150
            val imageBitmap = remember(pendingCropBannerBytes) { pendingCropBannerBytes?.let { byteArrayToImageBitmap(it) } }

            Dialog(onDismissRequest = { pendingCropBannerBytes = null }) {
                Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.surface, modifier = Modifier.padding(16.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(24.dp)) {
                        Text(stringResource(Res.string.adjust_banner), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier.size(viewportWidth.dp, viewportHeight.dp).background(Color.Black)
                                .pointerInput(Unit) { detectTransformGestures { _, pan, zoom, _ -> scale = (scale * zoom).coerceIn(1f, 5f); offsetX += pan.x; offsetY += pan.y } },
                            contentAlignment = Alignment.Center
                        ) {
                            if (imageBitmap != null) {
                                Image(bitmap = imageBitmap, contentDescription = stringResource(Res.string.crop_preview), modifier = Modifier.fillMaxSize().graphicsLayer(scaleX = scale, scaleY = scale, translationX = offsetX, translationY = offsetY), contentScale = ContentScale.Crop)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            TextButton(onClick = { pendingCropBannerBytes = null }) { Text(stringResource(Res.string.cancel), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            Button(onClick = { bannerBytes = cropImage(pendingCropBannerBytes!!, offsetX, offsetY, scale, viewportWidth) ?: pendingCropBannerBytes; pendingCropBannerBytes = null }) { Text(stringResource(Res.string.crop_and_save)) }
                        }
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.edit_profile), fontWeight = FontWeight.Bold) },
                    navigationIcon = { TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.cancel)) } },
                    actions = {
                        TextButton(
                            onClick = {
                                coroutineScope.launch {
                                    isLoading = true
                                    errorMessage = null
                                    try {
                                        val session = Supabase.client.auth.currentSessionOrNull()
                                        val userId = session?.user?.id ?: throw Exception("Not logged in")

                                        // Offload uploads to IO dispatcher to avoid blocking UI
                                        val avatarDeferred = async(kotlinx.coroutines.Dispatchers.Default) {
                                            if (avatarBytes != null) R2Uploader.uploadMedia(avatarBytes!!, "avatar", "image/jpeg", "jpg") { sent, total ->
                                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { avatarUploadProgress = pct } }
                                            } else initialProfile.avatarUrl
                                        }
                                        val bannerDeferred = async(kotlinx.coroutines.Dispatchers.Default) {
                                            if (bannerBytes != null) R2Uploader.uploadMedia(bannerBytes!!, "banner", "image/jpeg", "jpg") { sent, total ->
                                                val pct = if (total > 0) sent.toFloat() / total.toFloat() else 0f
                                                kotlinx.coroutines.runBlocking { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) { bannerUploadProgress = pct } }
                                            } else initialProfile.bannerUrl
                                        }

                                        val finalAvatarUrl = avatarDeferred.await()
                                        val finalBannerUrl = bannerDeferred.await()

                                        val isCompleted = fullName.isNotBlank() && phoneNumber.isNotBlank() && businessName.isNotBlank()

                                        val updatedProfile = Profile(
                                            id = userId,
                                            email = initialProfile.email,
                                            fullName = fullName.takeIf { it.isNotBlank() },
                                            username = username.takeIf { it.isNotBlank() },
                                            bio = bio.takeIf { it.isNotBlank() },
                                            dateOfBirth = dob.takeIf { it.isNotBlank() },
                                            country = selectedCountry.name,
                                            phoneNumber = if (phoneNumber.isNotBlank()) "${selectedCountry.dialCode}$phoneNumber" else null,
                                            cityAddress = cityAddress.takeIf { it.isNotBlank() },
                                            avatarUrl = finalAvatarUrl,
                                            bannerUrl = finalBannerUrl,
                                            onboardingCompleted = isCompleted
                                        )

                                        Supabase.saveProfile(updatedProfile)

                                        if (businessName.isNotBlank()) {
                                            val updatedBusiness = Business(
                                                userId = userId,
                                                businessName = businessName,
                                                category = if (selectedCategory == "Other") customCategory else selectedCategory,
                                                websiteUrl = webLink.takeIf { it.isNotBlank() },
                                                businessAddress = businessAddress.takeIf { it.isNotBlank() }
                                            )
                                            Supabase.saveBusiness(updatedBusiness)
                                        }

                                        navigator.pop() // Go back to profile screen
                                    } catch (e: Exception) {
                                        errorMessage = "Failed to save: ${e.message}"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            enabled = !isLoading
                        ) {
                        if (isLoading) {
                            val pct = ((avatarUploadProgress.coerceAtLeast(bannerUploadProgress)) * 100).toInt()
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("$pct%", style = MaterialTheme.typography.labelSmall)
                            }
                        } else Text(stringResource(Res.string.save), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Banner & Avatar Edit
                item {
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp)) {
                        // Banner Edit
                        Box(
                            modifier = Modifier.fillMaxWidth().height(150.dp).background(MaterialTheme.colorScheme.surfaceVariant).clickable { bannerPickerLauncher() },
                            contentAlignment = Alignment.Center
                        ) {
                            if (bannerBytes != null) {
                                val bannerBitmap = remember(bannerBytes) { byteArrayToImageBitmap(bannerBytes!!) }
                                Image(bitmap = bannerBitmap!!, contentDescription = stringResource(Res.string.banner), modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            } else if (initialProfile.bannerUrl != null) {
                                SubcomposeAsyncImage(
                                    model = initialProfile.bannerUrl!!,
                                    contentDescription = stringResource(Res.string.banner),
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                    loading = { CircularProgressIndicator(modifier = Modifier.align(Alignment.Center).size(24.dp)) },
                                    error = {
                                        Text(stringResource(Res.string.failed_to_load_banner), color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
                                    }
                                )
                            } else {
                                Text(stringResource(Res.string.tap_to_change_banner), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        // Avatar Edit
                        Box(
                            modifier = Modifier.align(Alignment.BottomStart).padding(start = 24.dp).size(100.dp).clip(CircleShape).background(MaterialTheme.colorScheme.secondary).border(4.dp, MaterialTheme.colorScheme.background, CircleShape).clickable { avatarPickerLauncher() },
                            contentAlignment = Alignment.Center
                        ) {
                            if (avatarBytes != null) {
                                val avatarBitmap = remember(avatarBytes) { byteArrayToImageBitmap(avatarBytes!!) }
                                Image(bitmap = avatarBitmap!!, contentDescription = stringResource(Res.string.avatar), modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            } else if (initialProfile.avatarUrl != null) {
                                SubcomposeAsyncImage(
                                    model = initialProfile.avatarUrl!!,
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
                                Text(stringResource(Res.string.tap), color = MaterialTheme.colorScheme.onSecondary)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }

                if (errorMessage != null) {
                    item { Text(text = errorMessage!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 16.dp)) }
                }

                // Personal Details
                item {
                    Column(modifier = Modifier.padding(horizontal = 24.dp)) {
                        OutlinedTextField(value = fullName, onValueChange = { fullName = it }, label = { Text(stringResource(Res.string.full_name)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text(stringResource(Res.string.username)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), prefix = { Text("@") })
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = bio, onValueChange = { bio = it }, label = { Text(stringResource(Res.string.bio)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 3)
                        Spacer(modifier = Modifier.height(16.dp))

                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = dob, onValueChange = {}, label = { Text(stringResource(Res.string.date_of_birth)) }, readOnly = true, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), enabled = false,
                                colors = OutlinedTextFieldDefaults.colors(
                                    disabledTextColor = MaterialTheme.colorScheme.onSurface,
                                    disabledBorderColor = MaterialTheme.colorScheme.outline,
                                    disabledLeadingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    disabledTrailingIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    disabledLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                    disabledPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            )
                            Box(modifier = Modifier.matchParentSize().clickable { showDatePicker = true })
                        }
                        
                        if (showDatePicker) {
                            DatePickerDialog(
                                onDismissRequest = { showDatePicker = false },
                                confirmButton = { TextButton(onClick = { showDatePicker = false; datePickerState.selectedDateMillis?.let { millis -> dob = com.nephclick.eyefield.utils.formatEpochToIsoDate(millis) } }) { Text(stringResource(Res.string.ok)) } },
                                dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text(stringResource(Res.string.cancel)) } }
                            ) { DatePicker(state = datePickerState) }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Country & Phone
                        ExposedDropdownMenuBox(expanded = showCountryDropdown, onExpandedChange = { showCountryDropdown = it }) {
                            OutlinedTextField(value = selectedCountry.name, onValueChange = {}, readOnly = true, label = { Text(stringResource(Res.string.country)) }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCountryDropdown) }, colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(), modifier = Modifier.fillMaxWidth().menuAnchor(), shape = RoundedCornerShape(12.dp))
                            ExposedDropdownMenu(expanded = showCountryDropdown, onDismissRequest = { showCountryDropdown = false }) {
                                allCountries.forEach { country ->
                                    DropdownMenuItem(text = { Text("${country.name} (${country.dialCode})") }, onClick = { selectedCountry = country; showCountryDropdown = false })
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = phoneNumber, onValueChange = { phoneNumber = it }, label = { Text(stringResource(Res.string.phone_number)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), prefix = { Text("${selectedCountry.dialCode} ") })
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = cityAddress, onValueChange = { cityAddress = it }, label = { Text(stringResource(Res.string.city_address)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))

                        Spacer(modifier = Modifier.height(32.dp))
                        Text(stringResource(Res.string.business_details), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(value = businessName, onValueChange = { businessName = it }, label = { Text(stringResource(Res.string.business_name)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        Spacer(modifier = Modifier.height(16.dp))

                        ExposedDropdownMenuBox(expanded = showCategoryDropdown, onExpandedChange = { showCategoryDropdown = it }) {
                            val displaySelectedCategory = when (selectedCategory) {
                                "Technology" -> stringResource(Res.string.category_tech)
                                "Retail" -> stringResource(Res.string.category_retail)
                                "Health" -> stringResource(Res.string.category_health)
                                "Finance" -> stringResource(Res.string.category_finance)
                                "Food & Beverage" -> stringResource(Res.string.category_food)
                                "Education" -> stringResource(Res.string.category_education)
                                "Other" -> stringResource(Res.string.category_other)
                                else -> selectedCategory
                            }
                            OutlinedTextField(value = displaySelectedCategory, onValueChange = {}, readOnly = true, label = { Text(stringResource(Res.string.category)) }, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCategoryDropdown) }, colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(), modifier = Modifier.fillMaxWidth().menuAnchor(), shape = RoundedCornerShape(12.dp))
                            ExposedDropdownMenu(expanded = showCategoryDropdown, onDismissRequest = { showCategoryDropdown = false }) {
                                businessCategories.forEach { category ->
                                    val displayCategory = when (category) {
                                        "Technology" -> stringResource(Res.string.category_tech)
                                        "Retail" -> stringResource(Res.string.category_retail)
                                        "Health" -> stringResource(Res.string.category_health)
                                        "Finance" -> stringResource(Res.string.category_finance)
                                        "Food & Beverage" -> stringResource(Res.string.category_food)
                                        "Education" -> stringResource(Res.string.category_education)
                                        "Other" -> stringResource(Res.string.category_other)
                                        else -> category
                                    }
                                    DropdownMenuItem(text = { Text(displayCategory) }, onClick = { selectedCategory = category; showCategoryDropdown = false })
                                }
                            }
                        }
                        
                        if (selectedCategory == "Other") {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(value = customCategory, onValueChange = { customCategory = it }, label = { Text(stringResource(Res.string.enter_custom_category)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = webLink, onValueChange = { webLink = it }, label = { Text(stringResource(Res.string.website_link)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(value = businessAddress, onValueChange = { businessAddress = it }, label = { Text(stringResource(Res.string.business_address)) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), minLines = 2)
                        
                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
