package com.nephclick.eyefield.ui.main

import org.jetbrains.compose.resources.stringResource
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.nephclick.eyefield.ui.auth.LoginScreen
import com.nephclick.eyefield.ui.home.CascadeaScreen
import com.nephclick.eyefield.ui.profile.ProfileScreen
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.painterResource
import com.nephclick.eyefield.Supabase
import com.nephclick.eyefield.ui.chat.ChatsScreen
import io.github.jan.supabase.auth.auth
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.offset
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.launch
class MainScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedTab by rememberSaveable { mutableStateOf(2) } // Default to Cascadea (index 2)
        val sessionStatus by Supabase.client.auth.sessionStatus.collectAsState(SessionStatus.Initializing)
        val isLoggedIn = sessionStatus is SessionStatus.Authenticated

        LaunchedEffect(isLoggedIn) {
            if (isLoggedIn) {
                val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                if (currentUserId != null) {
                    launch {
                        while (true) {
                            try {
                                Supabase.updateLastSeen(currentUserId)
                            } catch (e: Exception) {
                                println("Heartbeat error: ${e.message}")
                            }
                            kotlinx.coroutines.delay(60000) // Update every 60 seconds
                        }
                    }
                }
            }
        }

        Scaffold(
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                ) {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Image(painterResource(Res.drawable.smile), contentDescription = stringResource(Res.string.echoes), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(if (selectedTab == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)) },
                        label = { Text(stringResource(Res.string.echoes), style = MaterialTheme.typography.labelSmall) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = MaterialTheme.colorScheme.primary, selectedTextColor = MaterialTheme.colorScheme.primary)
                    )
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { 
                            if (isLoggedIn) {
                                selectedTab = 1
                            } else {
                                navigator.push(LoginScreen())
                            }
                        },
                        icon = { Image(painterResource(Res.drawable.messenger), contentDescription = stringResource(Res.string.chats), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(if (selectedTab == 1) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)) },
                        label = { Text(stringResource(Res.string.chats), style = MaterialTheme.typography.labelSmall) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = MaterialTheme.colorScheme.primary, selectedTextColor = MaterialTheme.colorScheme.primary)
                    )
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        icon = { 
                            val infiniteTransition = rememberInfiniteTransition()
                            val dy by infiniteTransition.animateFloat(
                                initialValue = 0f,
                                targetValue = if (selectedTab == 2) -10f else 0f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(400, easing = LinearEasing),
                                    repeatMode = RepeatMode.Reverse
                                )
                            )
                            Image(painterResource(Res.drawable.running), contentDescription = stringResource(Res.string.cascadea), modifier = Modifier.size(24.dp).offset(y = dy.dp), colorFilter = ColorFilter.tint(if (selectedTab == 2) Color(0xFFFF9800) else MaterialTheme.colorScheme.onSurfaceVariant)) 
                        },
                        label = { Text(stringResource(Res.string.cascadea), style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = Color(0xFFFF9800), selectedTextColor = Color(0xFFFF9800))
                    )
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = { 
                            if (isLoggedIn) {
                                selectedTab = 3
                            } else {
                                navigator.push(LoginScreen())
                            }
                        },
                        icon = { Image(painterResource(Res.drawable.telephone), contentDescription = stringResource(Res.string.calls), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(if (selectedTab == 3) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)) },
                        label = { Text(stringResource(Res.string.calls), style = MaterialTheme.typography.labelSmall) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = MaterialTheme.colorScheme.primary, selectedTextColor = MaterialTheme.colorScheme.primary)
                    )
                    NavigationBarItem(
                        selected = selectedTab == 4,
                        onClick = { 
                            if (isLoggedIn) {
                                selectedTab = 4
                            } else {
                                navigator.push(LoginScreen())
                            }
                        },
                        icon = { Image(painterResource(Res.drawable.person), contentDescription = stringResource(Res.string.profile), modifier = Modifier.size(24.dp), colorFilter = ColorFilter.tint(if (selectedTab == 4) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)) },
                        label = { Text(stringResource(Res.string.profile), style = MaterialTheme.typography.labelSmall) },
                        colors = NavigationBarItemDefaults.colors(selectedIconColor = MaterialTheme.colorScheme.primary, selectedTextColor = MaterialTheme.colorScheme.primary)
                    )
                }
            }
        ) { paddingValues ->
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
                when (selectedTab) {
                    0 -> com.nephclick.eyefield.ui.home.EchoesScreen().Content()
                    1 -> ChatsScreen().Content()
                    2 -> CascadeaScreen().Content()
                    3 -> com.nephclick.eyefield.ui.calls.CallsScreen().Content()
                    4 -> ProfileScreen().Content()
                }
            }
        }
    }
}
