package com.nephclick.eyefield.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

@Composable
actual fun LocalPlatformContext(): Any? = LocalContext.current
