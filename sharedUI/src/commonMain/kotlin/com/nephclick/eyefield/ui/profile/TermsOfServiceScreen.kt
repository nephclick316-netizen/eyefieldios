package com.nephclick.eyefield.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.clickable
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*

class TermsOfServiceScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var contactEmail by remember { mutableStateOf("") }
        var contactMessage by remember { mutableStateOf("") }

        val termsOfServiceText = stringResource(Res.string.terms_of_service_text)

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.terms_of_service), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back)) }
                    }
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                contentPadding = PaddingValues(24.dp)
            ) {
                item {
                    Text(stringResource(Res.string.terms_of_service), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(termsOfServiceText, style = MaterialTheme.typography.bodyMedium)
                }
                
                item {
                    Divider(modifier = Modifier.padding(vertical = 24.dp))
                    Text(stringResource(Res.string.contact_admin), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(stringResource(Res.string.contact_us_desc), style = MaterialTheme.typography.bodyMedium)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = contactEmail,
                        onValueChange = { contactEmail = it },
                        label = { Text(stringResource(Res.string.your_email)) },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = contactMessage,
                        onValueChange = { contactMessage = it },
                        label = { Text(stringResource(Res.string.message_label)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 4
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { 
                            contactEmail = ""
                            contactMessage = ""
                        }, 
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(stringResource(Res.string.submit))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = stringResource(Res.string.or_email_us_directly),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.clickable { /* Handle email intent if needed */ }
                    )
                }
            }
        }
    }
}
