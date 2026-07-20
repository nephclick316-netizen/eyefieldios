package com.nephclick.eyefield.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.launch
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@android.annotation.SuppressLint("InvalidFragmentVersionForActivityResult")
class SettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = getSharedPreferences("eyefield_prefs", Context.MODE_PRIVATE)
        val current = prefs.getLong("incoming_call_wake_duration_ms", 3000L)

        setContent {
            var text by remember { mutableStateOf(current.toString()) }
            val ctx = this
            var permissionGranted by remember { mutableStateOf(
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                    ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
                } else true
            ) }
            val requestPermissionLauncher = remember {
                registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
                    permissionGranted = granted
                    if (!granted) {
                        val prev = prefs.getInt("permission_denied_count", 0)
                        prefs.edit().putInt("permission_denied_count", prev + 1).apply()
                    }
                }
            }
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(modifier = Modifier.padding(16.dp)) {
                        Text("Incoming Call Wake Settings", style = MaterialTheme.typography.headlineSmall)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Wake duration (ms):", style = MaterialTheme.typography.bodyMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(value = text, onValueChange = { text = it }, singleLine = true)
                        Spacer(modifier = Modifier.height(16.dp))
                        Row {
                            Button(onClick = {
                                val v = text.toLongOrNull() ?: 3000L
                                prefs.edit().putLong("incoming_call_wake_duration_ms", v).apply()
                                finish()
                            }) {
                                Text("Save")
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = {
                                // Request notification permission on Android 13+
                                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                }
                            }) {
                                Text("Request Notifications")
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = { finish() }) {
                                Text("Cancel")
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        // Telemetry display
                        val permDenied = prefs.getInt("permission_denied_count", 0)
                        val wakeFailures = prefs.getInt("incoming_call_wake_failures", 0)
                        Text("Telemetry", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Permission denied count: $permDenied")
                        Text("Wake-lock failure count: $wakeFailures")
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = {
                            // Try to send telemetry to Supabase if available; non-fatal
                            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                            try {
                                    val userId = com.nephclick.eyefield.Supabase.client.auth.currentSessionOrNull()?.user?.id
                                    if (userId != null) {
                                        try {
                                            com.nephclick.eyefield.Supabase.sendTelemetryRecord(userId, permDenied, wakeFailures)
                                        } catch (e: Exception) {
                                            android.util.Log.w("SettingsActivity", "Telemetry send failed: ${e.message}")
                                        }
                                    }
                                } catch (t: Throwable) {
                                    android.util.Log.w("SettingsActivity", "Telemetry task failed: ${t.message}")
                                }
                            }
                        }) { Text("Send Telemetry (optional)") }

                        Spacer(modifier = Modifier.height(16.dp))
                        // OEM troubleshooting guidance
                        val manufacturer = Build.MANUFACTURER?.lowercase() ?: "unknown"
                        Text("Device Manufacturer: $manufacturer", style = MaterialTheme.typography.labelSmall)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("If incoming calls are still suppressed, you may need to disable battery optimizations or enable Autostart for Eyefield.")
                        Spacer(modifier = Modifier.height(8.dp))
                        Row {
                            Button(onClick = {
                                // Open battery optimization settings
                                try {
                                    val intent = Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    startActivity(intent)
                                } catch (t: Throwable) {
                                    try {
                                        val intent = Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                                        intent.data = android.net.Uri.parse("package:${packageName}")
                                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        startActivity(intent)
                                    } catch (_: Throwable) { }
                                }
                            }) { Text("Battery Settings") }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = {
                                // Try OEM-specific Autostart intent for Xiaomi/Redmi
                                try {
                                    val comp = android.content.ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")
                                    val intent = Intent()
                                    intent.component = comp
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    startActivity(intent)
                                } catch (t: Throwable) {
                                    // Fallback to app settings
                                    com.nephclick.eyefield.utils.openAppSettings(this@SettingsActivity)
                                }
                            }) { Text("Autostart") }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = {
                                // Samsung power saver intent (best-effort)
                                try {
                                    val intent = Intent()
                                    intent.component = android.content.ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity")
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    startActivity(intent)
                                } catch (t: Throwable) {
                                    com.nephclick.eyefield.utils.openAppSettings(this@SettingsActivity)
                                }
                            }) { Text("Samsung Power") }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = {
                                // Huawei protected apps (best-effort)
                                try {
                                    val intent = Intent()
                                    intent.component = android.content.ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity")
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    startActivity(intent)
                                } catch (t: Throwable) {
                                    com.nephclick.eyefield.utils.openAppSettings(this@SettingsActivity)
                                }
                            }) { Text("Huawei Protected") }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(onClick = { com.nephclick.eyefield.utils.openAppSettings(this@SettingsActivity) }) { Text("App Settings") }
                        }
                    }
                }
            }
        }
    }

    companion object {
        fun open(context: Context) {
            val i = Intent(context, SettingsActivity::class.java)
            context.startActivity(i)
        }
    }
}
