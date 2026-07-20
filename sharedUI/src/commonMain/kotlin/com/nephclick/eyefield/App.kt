package com.nephclick.eyefield

import androidx.compose.runtime.*
import androidx.compose.ui.tooling.preview.Preview
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import com.nephclick.eyefield.theme.EyeFieldTheme
import com.nephclick.eyefield.ui.main.MainScreen
import coil3.ImageLoader
import coil3.compose.setSingletonImageLoaderFactory
import coil3.network.ktor3.KtorNetworkFetcherFactory
import coil3.request.crossfade

import coil3.disk.DiskCache
import okio.Path.Companion.toPath
import com.nephclick.eyefield.utils.getAppCacheDir
import com.nephclick.eyefield.utils.CrashReporter
import com.nephclick.eyefield.utils.PersistentCache
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*
import io.github.jan.supabase.auth.auth

@Composable
@Preview
fun App() {
    var showCrashReport by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val pendingCrash = PersistentCache.getString("pending_crash_report")
        if (!pendingCrash.isNullOrEmpty()) {
            showCrashReport = true
        }
    }
    setSingletonImageLoaderFactory { context ->
        ImageLoader.Builder(context)
            .components {
                add(KtorNetworkFetcherFactory())
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(getAppCacheDir().toPath().resolve("image_cache"))
                    .maxSizeBytes(100L * 1024 * 1024)
                    .build()
            }
            .crossfade(true)
            .build()
    }
    EyeFieldTheme {
        if (showCrashReport) {
            AlertDialog(
                onDismissRequest = { 
                    showCrashReport = false 
                    CrashReporter.clearPendingReport()
                },
                title = { Text("App Recovered from Crash") },
                text = { Text("EyeField encountered an unexpected technical error during your last session. Would you like to send a report to our admins so we can fix it?") },
                confirmButton = {
                    Button(onClick = {
                        showCrashReport = false
                        CrashReporter.submitPendingReport {
                            // Optionally show toast
                        }
                    }) {
                        Text("Send Report")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { 
                        showCrashReport = false 
                        CrashReporter.clearPendingReport()
                    }) {
                        Text("Ignore")
                    }
                }
            )
        }

        Navigator(MainScreen()) { navigator ->
            val sessionStatus by Supabase.client.auth.sessionStatus.collectAsState(io.github.jan.supabase.auth.status.SessionStatus.Initializing)
            val isLoggedIn = sessionStatus is io.github.jan.supabase.auth.status.SessionStatus.Authenticated

            // Track call IDs already shown so we never open a duplicate CallScreen
            val shownCallIds = remember { mutableSetOf<String>() }

            LaunchedEffect(Unit) {
                com.nephclick.eyefield.utils.CallIntentBridge.incomingCallFlow.collect { callData ->
                    if (callData.callLogId.isNotEmpty() && shownCallIds.contains(callData.callLogId)) return@collect
                    if (navigator.lastItem !is com.nephclick.eyefield.ui.calls.CallScreen) {
                        val profile = Supabase.fetchProfile(callData.callerId)
                        if (profile != null) {
                            if (callData.callLogId.isNotEmpty()) shownCallIds.add(callData.callLogId)
                            navigator.push(
                                com.nephclick.eyefield.ui.calls.CallScreen(
                                    otherUser = profile,
                                    isVideoCall = callData.isVideoCall,
                                    isIncoming = true,
                                    existingChannelName = callData.roomName,
                                    existingCallLogId = callData.callLogId
                                )
                            )
                        }
                    }
                }
            }

            LaunchedEffect(isLoggedIn) {
                if (isLoggedIn) {
                    val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                    if (currentUserId != null) {
                        while (true) {
                            try {
                                val pendingCalls = Supabase.fetchPendingCallsForUser(currentUserId)
                                if (pendingCalls.isNotEmpty()) {
                                    val call = pendingCalls.first()
                                    // Skip if we already opened a screen for this call (e.g. via FCM)
                                    val alreadyShown = shownCallIds.contains(call.id)
                                    if (!alreadyShown && navigator.lastItem !is com.nephclick.eyefield.ui.calls.CallScreen) {
                                        val profile = Supabase.fetchProfile(call.callerId)
                                        if (profile != null) {
                                            shownCallIds.add(call.id)
                                            navigator.push(
                                                com.nephclick.eyefield.ui.calls.CallScreen(
                                                    otherUser = profile,
                                                    isVideoCall = call.callType == "video",
                                                    isIncoming = true,
                                                    existingChannelName = call.channelName,
                                                    existingCallLogId = call.id
                                                )
                                            )
                                        }
                                    }
                                }
                            } catch (e: Exception) {
                                println("Call polling error: ${e.message}")
                            }
                            kotlinx.coroutines.delay(3000)
                        }
                    }
                }
            }

            SlideTransition(navigator)
        }
    }
}