package com.nephclick.eyefield.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import com.nephclick.eyefield.ui.home.LocalPlatformContext
import com.nephclick.eyefield.utils.openAppSettings
import cafe.adriel.voyager.navigator.currentOrThrow
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.Business
import com.nephclick.eyefield.models.Profile
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import com.nephclick.eyefield.ui.main.MainScreen
import com.nephclick.eyefield.ui.auth.LoginScreen
import com.nephclick.eyefield.utils.GlobalState
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

class SettingsScreen(
    val profile: Profile? = null,
    val business: Business? = null
) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val context = LocalPlatformContext()
        val coroutineScope = rememberCoroutineScope()
        var showLogoutDialog by remember { mutableStateOf(false) }
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

        // Dummy States for Toggles
        var isPublicNumber by remember { mutableStateOf(false) }
        
        // Link Dark Mode toggle to GlobalState
        val isSystemDark = androidx.compose.foundation.isSystemInDarkTheme()
        var isDarkMode by remember { mutableStateOf(GlobalState.isDarkMode.value ?: isSystemDark) }
        
        var pushNotifications by remember { mutableStateOf(true) }
        var emailNotifications by remember { mutableStateOf(false) }
        
        var showLanguageDropdown by remember { mutableStateOf(false) }
        val languageSettings = remember { com.nephclick.eyefield.utils.LanguageSettings(context) }
        var selectedLanguage by remember { mutableStateOf(if (languageSettings.getLanguage() == "fr") "French" else "English (US)") }
        val languages = listOf("English (US)", "French")

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.settings), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back)) }
                    }
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                contentPadding = PaddingValues(16.dp)
            ) {
                // Section: Account
                item { SectionHeader(stringResource(Res.string.account)) }
                item {
                    SettingsItem(
                        title = stringResource(Res.string.edit_profile), 
                        subtitle = stringResource(Res.string.change_personal_business_details), 
                        onClick = { 
                            if (profile != null) {
                                navigator.push(EditProfileScreen(profile, business))
                            }
                        }
                    )
                    SettingsItem(
                        title = stringResource(Res.string.phone_number),
                        subtitle = profile?.phoneNumber ?: stringResource(Res.string.no_phone_number_set),
                        onClick = { /* TODO: Open edit phone screen */ }
                    )
                    SettingsSwitchItem(title = stringResource(Res.string.public_phone_number), subtitle = stringResource(Res.string.show_phone_number_on_profile), checked = isPublicNumber, onCheckedChange = { isPublicNumber = it })
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: System & Permissions
                item { SectionHeader(stringResource(Res.string.system_and_permissions)) }
                item {
                    SettingsItem(
                        title = stringResource(Res.string.app_permissions),
                        subtitle = stringResource(Res.string.manage_app_permissions),
                        onClick = { 
                            // Open system app settings as fallback
                            try {
                                openAppSettings(context)
                            } catch (_: Throwable) { }
                        }
                    )
                    SettingsItem(
                        title = "Call Settings",
                        subtitle = "Manage incoming call behavior and permissions",
                        onClick = { com.nephclick.eyefield.utils.openCallSettings(context) }
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: Preferences
                item { SectionHeader(stringResource(Res.string.preferences)) }
                item {
                    SettingsSwitchItem(
                        title = stringResource(Res.string.dark_mode), 
                        subtitle = stringResource(Res.string.toggle_app_theme), 
                        checked = isDarkMode, 
                        onCheckedChange = { 
                            isDarkMode = it
                            GlobalState.isDarkMode.value = it 
                        }
                    )
                    Box {
                        val displaySelectedLanguage = if (selectedLanguage == "French") stringResource(Res.string.lang_fr) else stringResource(Res.string.lang_en)
                        SettingsItem(title = stringResource(Res.string.language), subtitle = displaySelectedLanguage, onClick = { showLanguageDropdown = true })
                        DropdownMenu(
                            expanded = showLanguageDropdown,
                            onDismissRequest = { showLanguageDropdown = false }
                        ) {
                            languages.forEach { lang ->
                                val displayLanguage = if (lang == "French") stringResource(Res.string.lang_fr) else stringResource(Res.string.lang_en)
                                DropdownMenuItem(
                                    text = { Text(displayLanguage) },
                                    onClick = {
                                        selectedLanguage = lang
                                        val langCode = if (lang == "French") "fr" else "en"
                                        languageSettings.saveLanguage(langCode)
                                        showLanguageDropdown = false
                                        // Restart Activity to apply locale change immediately
                                        (context as? android.app.Activity)?.recreate()
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: Notifications
                item { SectionHeader(stringResource(Res.string.notifications)) }
                item {
                    SettingsSwitchItem(title = stringResource(Res.string.push_notifications), subtitle = stringResource(Res.string.receive_alerts_on_device), checked = pushNotifications, onCheckedChange = { pushNotifications = it })
                    SettingsSwitchItem(title = stringResource(Res.string.email_notifications), subtitle = stringResource(Res.string.receive_updates_via_email), checked = emailNotifications, onCheckedChange = { emailNotifications = it })
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: Legal & Privacy
                item { SectionHeader(stringResource(Res.string.legal_and_privacy)) }
                item {
                    SettingsItem(title = stringResource(Res.string.privacy_policy), onClick = { 
                        navigator.push(PrivacyPolicyScreen()) 
                    })
                    SettingsItem(title = stringResource(Res.string.terms_of_service), onClick = { 
                        navigator.push(TermsOfServiceScreen()) 
                    })
                    SettingsItem(title = stringResource(Res.string.questions_and_answers), onClick = { 
                        navigator.push(FAQScreen()) 
                    })
                    SettingsItem(title = stringResource(Res.string.confidentiality_agreement), onClick = { /* TODO */ })
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: Admin
                item { SectionHeader(stringResource(Res.string.admin)) }
                item {
                    SettingsItem(title = stringResource(Res.string.admin_dashboard), onClick = { navigator.push(com.nephclick.eyefield.ui.admin.AdminDashboardScreen()) })
                    Spacer(modifier = Modifier.height(24.dp))
                }

                // Section: Security & Account Management
                item { SectionHeader(stringResource(Res.string.security_and_account_management), color = MaterialTheme.colorScheme.error) }
                item {
                    SettingsItem(title = stringResource(Res.string.manage_privacy_reports), subtitle = stringResource(Res.string.block_users_manage_reports), onClick = { navigator.push(AccountManagementScreen()) })
                }
                item {
                    Button(
                        onClick = { showLogoutDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant, contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(Res.string.log_out))
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = stringResource(Res.string.powered_by),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                }
            }

            // Dialogs
            if (showLogoutDialog) {
                AlertDialog(
                    onDismissRequest = { showLogoutDialog = false },
                    title = { Text(stringResource(Res.string.log_out)) },
                    text = { Text(stringResource(Res.string.log_out_confirmation)) },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                showLogoutDialog = false
                                coroutineScope.launch {
                                    Supabase.client.auth.signOut()
                                    navigator.replaceAll(com.nephclick.eyefield.ui.auth.LoginScreen())
                                }
                            }
                        ) { Text(stringResource(Res.string.log_out), color = MaterialTheme.colorScheme.primary) }
                    },
                    dismissButton = {
                        TextButton(onClick = { showLogoutDialog = false }) { Text(stringResource(Res.string.cancel), color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    }
                )
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

    @Composable
    private fun SectionHeader(title: String, color: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.primary) {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = color,
            modifier = Modifier.padding(bottom = 8.dp, start = 8.dp)
        )
    }

    @Composable
    private fun SettingsItem(title: String, subtitle: String? = null, onClick: () -> Unit) {
        Surface(
            modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 4.dp),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                if (subtitle != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }

    @Composable
    private fun SettingsSwitchItem(title: String, subtitle: String? = null, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                    if (subtitle != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Switch(checked = checked, onCheckedChange = onCheckedChange)
            }
        }
    }
}

