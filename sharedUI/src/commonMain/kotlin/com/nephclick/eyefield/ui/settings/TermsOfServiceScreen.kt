package com.nephclick.eyefield.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class TermsOfServiceScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.terms_of_service), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)) },
                    navigationIcon = { TextButton(onClick = { navigator.pop() }) { Text("<") } }
                )
            }
        ) { padding ->
            Column(
                Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(stringResource(Res.string.terms_of_service).uppercase(), style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_last_updated), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(stringResource(Res.string.terms_welcome), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section1_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section1_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section2_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section2_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section3_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section3_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section4_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section4_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section5_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section5_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section6_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section6_body), style = MaterialTheme.typography.bodyMedium)
                Text(stringResource(Res.string.terms_section7_title), style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                Text(stringResource(Res.string.terms_section7_body), style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}