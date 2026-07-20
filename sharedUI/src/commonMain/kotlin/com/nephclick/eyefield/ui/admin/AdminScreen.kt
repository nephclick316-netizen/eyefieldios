package com.nephclick.eyefield.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import org.jetbrains.compose.resources.stringResource
import eyefield.sharedui.generated.resources.*

class AdminScreen : Screen {
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedTabIndex by remember { mutableStateOf(2) } // Default to Promo Cards for testing
        val tabs = listOf(stringResource(Res.string.admin_users), stringResource(Res.string.admin_statistics), stringResource(Res.string.admin_promo_cards))

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.admin_dashboard), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.admin_back)) }
                    }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier.fillMaxSize().padding(paddingValues)
            ) {
                PrimaryTabRow(
                    selectedTabIndex = selectedTabIndex,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { Text(title) }
                        )
                    }
                }

                Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    when (selectedTabIndex) {
                        0 -> UsersTab()
                        1 -> StatisticsTab()
                        2 -> PromoCardsTab()
                    }
                }
            }
        }
    }

    @Composable
    private fun UsersTab() {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(stringResource(Res.string.admin_user_mgmt_content), style = MaterialTheme.typography.bodyLarge)
        }
    }

    @Composable
    private fun StatisticsTab() {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(stringResource(Res.string.admin_stats_content), style = MaterialTheme.typography.bodyLarge)
        }
    }

    @Composable
    private fun PromoCardsTab() {
        // We will implement the Image Picker and R2 upload for Promo Cards here
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(stringResource(Res.string.admin_promo_builder_content), style = MaterialTheme.typography.bodyLarge)
        }
    }
}
