package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

class BookScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        data class BookCategory(val nameRes: org.jetbrains.compose.resources.StringResource, val imageRes: org.jetbrains.compose.resources.DrawableResource)
        val categories = listOf(
            BookCategory(Res.string.book_hotel, Res.drawable.hotel_bg),
            BookCategory(Res.string.book_bar_restaurant, Res.drawable.bar_bg),
            BookCategory(Res.string.book_vehicle, Res.drawable.car_bg),
            BookCategory(Res.string.book_apartment, Res.drawable.apartment_bg),
            BookCategory(Res.string.book_ticket, Res.drawable.tickets_bg)
        )
        
        val snackbarHostState = remember { SnackbarHostState() }
        val coroutineScope = rememberCoroutineScope()

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.book_services_title), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) { Text(stringResource(Res.string.back)) }
                    }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                Text(
                    text = stringResource(Res.string.what_to_book),
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(bottom = 24.dp)
                )

                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(categories.size) { index ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            onClick = { 
                                coroutineScope.launch { snackbarHostState.showSnackbar(org.jetbrains.compose.resources.getString(Res.string.coming_soon)) }
                            },
                            modifier = Modifier.aspectRatio(1f)
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                androidx.compose.foundation.Image(
                                    painter = org.jetbrains.compose.resources.painterResource(categories[index].imageRes),
                                    contentDescription = stringResource(categories[index].nameRes),
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                )
                                // Dark overlay for text readability
                                Box(modifier = Modifier.fillMaxSize().background(androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.4f)))
                                
                                Text(
                                    text = stringResource(categories[index].nameRes),
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = androidx.compose.ui.graphics.Color.White,
                                    modifier = Modifier.align(Alignment.Center)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
