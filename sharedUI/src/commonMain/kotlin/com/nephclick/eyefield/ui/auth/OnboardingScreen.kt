package com.nephclick.eyefield.ui.auth

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import com.nephclick.eyefield.ui.main.MainScreen
import com.nephclick.eyefield.ui.home.LocalPlatformContext
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.Business
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import com.nephclick.eyefield.utils.rememberGalleryLauncher
import com.nephclick.eyefield.utils.cropImage
import com.nephclick.eyefield.utils.byteArrayToImageBitmap
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.Image
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import io.ktor.http.content.ByteArrayContent
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

// Native Country Code Model
data class Country(val name: String, val code: String, val dialCode: String)
val allCountries = listOf(
    Country("United States", "US", "+1"),
    Country("United Kingdom", "GB", "+44"),
    Country("Canada", "CA", "+1"),
    Country("Australia", "AU", "+61"),
    Country("DR Congo", "CD", "+243"),
    Country("Rwanda", "RW", "+250"),
    Country("Kenya", "KE", "+254"),
    Country("Uganda", "UG", "+256"),
    Country("Tanzania", "TZ", "+255"),
    Country("South Africa", "ZA", "+27"),
    Country("Nigeria", "NG", "+234"),
    Country("France", "FR", "+33"),
    Country("Germany", "DE", "+49"),
    Country("Japan", "JP", "+81"),
    Country("China", "CN", "+86"),
    Country("India", "IN", "+91")
    // Note: Easily expandable to 195 countries
)

class OnboardingScreen(val userEmail: String = "user@example.com") : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var currentStep by remember { mutableStateOf(1) }

        // Step 1 State
        var fullName by remember { mutableStateOf("") }
        var username by remember { mutableStateOf(userEmail.substringBefore("@")) }
        var bio by remember { mutableStateOf("") }
        var dob by remember { mutableStateOf("") }
        var showDatePicker by remember { mutableStateOf(false) }
        val datePickerState = rememberDatePickerState()

        // Step 2 State
        var phoneNumber by remember { mutableStateOf("") }
        var selectedCountry by remember { mutableStateOf(allCountries.find { it.code == "CD" } ?: allCountries[0]) }
        var showCountryDropdown by remember { mutableStateOf(false) }
        var cityAddress by remember { mutableStateOf("") }

        // Step 3 State (Business)
        var businessName by remember { mutableStateOf("") }
        val businessCategories = listOf("Technology", "Retail", "Health", "Finance", "Food & Beverage", "Education", "Other")
        var selectedCategory by remember { mutableStateOf(businessCategories[0]) }
        var showCategoryDropdown by remember { mutableStateOf(false) }
        var customCategory by remember { mutableStateOf("") }
        var webLink by remember { mutableStateOf("") }
        var businessAddress by remember { mutableStateOf("") }

        var avatarBytes by remember { mutableStateOf<ByteArray?>(null) }
        var pendingCropBytes by remember { mutableStateOf<ByteArray?>(null) }
        val imagePickerLauncher = rememberGalleryLauncher { bytes -> pendingCropBytes = bytes }
        val coroutineScope = rememberCoroutineScope()
        var isLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        
        val httpClient = remember { HttpClient() }
        val platformContext = LocalPlatformContext()
        
        if (pendingCropBytes != null) {
            var scale by remember { mutableStateOf(1f) }
            var offsetX by remember { mutableStateOf(0f) }
            var offsetY by remember { mutableStateOf(0f) }
            val viewportSize = 300
            val imageBitmap = remember(pendingCropBytes) { pendingCropBytes?.let { byteArrayToImageBitmap(it) } }

            Dialog(onDismissRequest = { pendingCropBytes = null }) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.padding(24.dp)
                    ) {
                        Text(stringResource(Res.string.adjust_avatar), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Box(
                            modifier = Modifier
                                .size(viewportSize.dp)
                                .clip(CircleShape)
                                .background(Color.Black)
                                .pointerInput(Unit) {
                                    detectTransformGestures { _, pan, zoom, _ ->
                                        scale = (scale * zoom).coerceIn(1f, 5f)
                                        offsetX += pan.x
                                        offsetY += pan.y
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (imageBitmap != null) {
                                Image(
                                    bitmap = imageBitmap,
                                    contentDescription = "Crop Preview",
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .graphicsLayer(
                                            scaleX = scale,
                                            scaleY = scale,
                                            translationX = offsetX,
                                            translationY = offsetY
                                        ),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            TextButton(onClick = { pendingCropBytes = null }) {
                                Text(stringResource(Res.string.cancel), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Button(onClick = {
                                avatarBytes = cropImage(pendingCropBytes!!, offsetX, offsetY, scale, viewportSize) ?: pendingCropBytes
                                pendingCropBytes = null
                            }) {
                                Text(stringResource(Res.string.crop_and_save))
                            }
                        }
                    }
                }
            }
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.setup_profile), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)) },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background,
                        titleContentColor = MaterialTheme.colorScheme.onBackground
                    )
                )
            },
            bottomBar = {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (currentStep > 1) {
                        TextButton(onClick = { currentStep -= 1 }) {
                            Text(stringResource(Res.string.back), color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    } else {
                        Spacer(modifier = Modifier.width(64.dp))
                    }
                    
                    Button(
                        onClick = {
                            if (currentStep < 3) {
                                currentStep += 1
                            } else {
                                coroutineScope.launch {
                                    isLoading = true
                                    errorMessage = null
                                    try {
                                        val session = Supabase.client.auth.currentSessionOrNull()
                                        val userId = session?.user?.id ?: throw Exception("User not logged in")
                                        
                                        var finalAvatarUrl: String? = null
                                        if (avatarBytes != null) {
                                            // 1. Get Presigned URL
                                            val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.supabase.co/functions/v1/r2-presigned-url") {
                                                setBody(Json.parseToJsonElement("{\"fileName\":\"avatar_${userId}.jpg\", \"fileType\":\"image/jpeg\"}").toString())
                                                header(HttpHeaders.ContentType, ContentType.Application.Json)
                                                header(HttpHeaders.Authorization, "Bearer ${session.accessToken}")
                                            }
                                            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
                                            val uploadUrl = json["url"]?.jsonPrimitive?.content
                                            val publicUrl = json["publicUrl"]?.jsonPrimitive?.content
                                            
                                            if (uploadUrl != null && publicUrl != null) {
                                                // 2. Upload to Cloudflare R2
                                                val putResponse = httpClient.put(uploadUrl) {
                                                    setBody(ByteArrayContent(avatarBytes!!, ContentType.Image.JPEG))
                                                }
                                                if (putResponse.status.isSuccess()) {
                                                    finalAvatarUrl = publicUrl
                                                } else {
                                                    throw Exception("Failed to upload image: ${putResponse.status}")
                                                }
                                            } else {
                                                throw Exception("Failed to get presigned URL. Edge function error? Response: ${response.bodyAsText()}")
                                            }
                                        }

                                        val isCompleted = fullName.isNotBlank() && phoneNumber.isNotBlank() && businessName.isNotBlank()

                                        val profile = Profile(
                                            id = userId,
                                            email = userEmail,
                                            fullName = fullName.takeIf { it.isNotBlank() },
                                            username = username.takeIf { it.isNotBlank() },
                                            bio = bio.takeIf { it.isNotBlank() },
                                            dateOfBirth = dob.takeIf { it.isNotBlank() },
                                            country = selectedCountry.name,
                                            phoneNumber = if (phoneNumber.isNotBlank()) "${selectedCountry.dialCode}$phoneNumber" else null,
                                            cityAddress = cityAddress.takeIf { it.isNotBlank() },
                                            avatarUrl = finalAvatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${username.ifBlank { "user" }}",
                                            onboardingCompleted = isCompleted
                                        )

                                        Supabase.saveProfile(profile)

                                        if (businessName.isNotBlank()) {
                                            val business = Business(
                                                userId = userId,
                                                businessName = businessName,
                                                category = if (selectedCategory == "Other") customCategory else selectedCategory,
                                                websiteUrl = webLink.takeIf { it.isNotBlank() },
                                                businessAddress = businessAddress.takeIf { it.isNotBlank() }
                                            )
                                            Supabase.saveBusiness(business)
                                        }

                                        // After onboarding, open the Call Settings to request
                                        // notification permission (Android) so incoming calls
                                        // will reliably wake the device. Then navigate to main.
                                        try {
                                            com.nephclick.eyefield.utils.openCallSettings(platformContext)
                                        } catch (_: Throwable) { }
                                        navigator.replaceAll(MainScreen())
                                    } catch (e: Exception) {
                                        errorMessage = "Setup failed: ${e.message}"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            }
                        },
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                        } else {
                            Text(if (currentStep == 3) stringResource(Res.string.finish) else stringResource(Res.string.next), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                item {
                    // Progress Indicator
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (i in 1..3) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(4.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(if (i <= currentStep) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                            )
                        }
                    }
                }

                if (currentStep == 1) {
                    item {
                        Text(stringResource(Res.string.personal_details), style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black), color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(24.dp))

                        // Avatar
                        Box(
                            modifier = Modifier
                                .size(100.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .border(2.dp, MaterialTheme.colorScheme.primary, CircleShape)
                                .clickable { imagePickerLauncher() },
                            contentAlignment = Alignment.Center
                        ) {
                            if (avatarBytes != null) {
                                val avatarBitmap = remember(avatarBytes) { avatarBytes?.let { byteArrayToImageBitmap(it) } }
                                if (avatarBitmap != null) {
                                    Image(
                                        bitmap = avatarBitmap,
                                        contentDescription = "Avatar",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Text("✅", style = MaterialTheme.typography.headlineMedium)
                                }
                            } else {
                                Text("📷", style = MaterialTheme.typography.headlineMedium)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        if (errorMessage != null) {
                            Text(text = errorMessage!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(bottom = 16.dp))
                        }

                        OutlinedTextField(
                            value = fullName, onValueChange = { fullName = it },
                            label = { Text(stringResource(Res.string.full_name)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = username, onValueChange = { username = it },
                            label = { Text(stringResource(Res.string.username)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            prefix = { Text("@") }
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedTextField(
                                value = dob, onValueChange = {},
                                label = { Text(stringResource(Res.string.date_of_birth)) },
                                readOnly = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                enabled = false, // Disable typing, rely on clickable box
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
                        Text(stringResource(Res.string.age_warning), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth().padding(top = 4.dp, start = 8.dp))
                        
                        if (showDatePicker) {
                            DatePickerDialog(
                                onDismissRequest = { showDatePicker = false },
                                confirmButton = {
                                    TextButton(onClick = {
                                        showDatePicker = false
                                        datePickerState.selectedDateMillis?.let { millis ->
                                            val date = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate()
                                            dob = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
                                        }
                                    }) { Text(stringResource(Res.string.ok)) }
                                },
                                dismissButton = {
                                    TextButton(onClick = { showDatePicker = false }) { Text(stringResource(Res.string.cancel)) }
                                }
                            ) {
                                DatePicker(state = datePickerState)
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = bio, onValueChange = { bio = it },
                            label = { Text(stringResource(Res.string.bio)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            minLines = 3
                        )
                    }
                } else if (currentStep == 2) {
                    item {
                        Text(stringResource(Res.string.location_and_contact), style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black), color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.fillMaxWidth())
                        Spacer(modifier = Modifier.height(24.dp))

                        // Dedicated Country Dropdown using ExposedDropdownMenuBox
                        ExposedDropdownMenuBox(
                            expanded = showCountryDropdown,
                            onExpandedChange = { showCountryDropdown = it }
                        ) {
                            OutlinedTextField(
                                value = selectedCountry.name,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text(stringResource(Res.string.country)) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCountryDropdown) },
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                shape = RoundedCornerShape(12.dp)
                            )
                            ExposedDropdownMenu(
                                expanded = showCountryDropdown,
                                onDismissRequest = { showCountryDropdown = false }
                            ) {
                                allCountries.forEach { country ->
                                    DropdownMenuItem(
                                        text = { Text("${country.name} (${country.dialCode})") },
                                        onClick = {
                                            selectedCountry = country
                                            showCountryDropdown = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        // Phone Number
                        OutlinedTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            label = { Text(stringResource(Res.string.phone_number)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            prefix = { Text("${selectedCountry.dialCode} ") }
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = cityAddress, onValueChange = { cityAddress = it },
                            label = { Text(stringResource(Res.string.city_address_optional)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                } else if (currentStep == 3) {
                    item {
                        Text(stringResource(Res.string.business_details), style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black), color = MaterialTheme.colorScheme.onBackground, modifier = Modifier.fillMaxWidth())
                        Text(stringResource(Res.string.business_optional_desc), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.fillMaxWidth().padding(top = 4.dp))
                        Spacer(modifier = Modifier.height(24.dp))

                        OutlinedTextField(
                            value = businessName, onValueChange = { businessName = it },
                            label = { Text(stringResource(Res.string.business_name)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        // Business Category Dropdown using ExposedDropdownMenuBox
                        ExposedDropdownMenuBox(
                            expanded = showCategoryDropdown,
                            onExpandedChange = { showCategoryDropdown = it }
                        ) {
                            OutlinedTextField(
                                value = selectedCategory,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text(stringResource(Res.string.category)) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCategoryDropdown) },
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                shape = RoundedCornerShape(12.dp)
                            )
                            ExposedDropdownMenu(
                                expanded = showCategoryDropdown,
                                onDismissRequest = { showCategoryDropdown = false }
                            ) {
                                businessCategories.forEach { category ->
                                    DropdownMenuItem(
                                        text = { Text(category) },
                                        onClick = {
                                            selectedCategory = category
                                            showCategoryDropdown = false
                                        }
                                    )
                                }
                            }
                        }

                        if (selectedCategory == "Other") {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = customCategory, onValueChange = { customCategory = it },
                                label = { Text(stringResource(Res.string.enter_custom_category)) },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = webLink, onValueChange = { webLink = it },
                            label = { Text(stringResource(Res.string.website_link)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = businessAddress, onValueChange = { businessAddress = it },
                            label = { Text(stringResource(Res.string.business_address)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            minLines = 2
                        )
                    }
                }
            }
        }
    }
}
