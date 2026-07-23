package com.nephclick.eyefield.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.models.ContactMessage
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

class ContactSupportScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val scope = rememberCoroutineScope()
        var email by remember { mutableStateOf("") }
        var msg by remember { mutableStateOf("") }
        var sent by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.contact_us), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)) },
                    navigationIcon = { TextButton(onClick = { navigator.pop() }) { Text("<") } }
                )
            }
        ) { padding ->
            Column(
                Modifier.fillMaxSize().padding(padding).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("support@eyefield.pro", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)

                if (sent) {
                    Text(stringResource(Res.string.message_sent), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                } else {
                    OutlinedTextField(
                        value = email, onValueChange = { email = it },
                        label = { Text(stringResource(Res.string.your_email)) },
                        placeholder = { Text(stringResource(Res.string.email_placeholder)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = msg, onValueChange = { msg = it },
                        label = { Text(stringResource(Res.string.message)) },
                        placeholder = { Text(stringResource(Res.string.message_placeholder)) },
                        modifier = Modifier.fillMaxWidth().height(160.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Button(
                        onClick = {
                            scope.launch {
                                Supabase.sendContactMessage(ContactMessage(email = email, message = msg))
                                sent = true
                            }
                        },
                        modifier = Modifier.align(Alignment.End),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(stringResource(Res.string.send))
                    }
                }
            }
        }
    }
}
