package com.nephclick.eyefield.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.nephclick.eyefield.utils.LanguageSettings
import com.nephclick.eyefield.ui.home.LocalPlatformContext
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

class SettingsScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val context = LocalPlatformContext()
        val langSettings = remember { LanguageSettings(context) }
        var currentLang by remember { mutableStateOf(langSettings.getLanguage()) }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.settings_title), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)) },
                    navigationIcon = { TextButton(onClick = { navigator.pop() }) { Text("<") } }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Language Section
                Text(stringResource(Res.string.language), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (currentLang == "fr") stringResource(Res.string.lang_french)
                               else stringResource(Res.string.lang_english)
                    )
                    Switch(
                        checked = currentLang == "fr",
                        onCheckedChange = { isFr ->
                            val newLang = if (isFr) "fr" else "en"
                            langSettings.saveLanguage(newLang)
                            currentLang = newLang
                        }
                    )
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                // Support Section
                Text(stringResource(Res.string.support), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { navigator.push(ContactSupportScreen()) },
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        stringResource(Res.string.contact_us),
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }

                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { navigator.push(TermsOfServiceScreen()) },
                    shape = MaterialTheme.shapes.small,
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        stringResource(Res.string.terms_of_service),
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        }
    }
}