package com.nephclick.eyefield.theme

import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import org.jetbrains.compose.resources.Font
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.figtree_regular
import eyefield.sharedui.generated.resources.figtree_light
import eyefield.sharedui.generated.resources.figtree_bold
import eyefield.sharedui.generated.resources.figtree_black

@Composable
fun getFigtreeFontFamily() = FontFamily(
    Font(Res.font.figtree_light, FontWeight.Light),
    Font(Res.font.figtree_regular, FontWeight.Normal),
    Font(Res.font.figtree_bold, FontWeight.Bold),
    Font(Res.font.figtree_black, FontWeight.Black)
)

@Composable
fun getEyeFieldTypography(): Typography {
    val figtree = getFigtreeFontFamily()
    
    return Typography(
        displayLarge = androidx.compose.material3.Typography().displayLarge.copy(fontFamily = figtree),
        displayMedium = androidx.compose.material3.Typography().displayMedium.copy(fontFamily = figtree),
        displaySmall = androidx.compose.material3.Typography().displaySmall.copy(fontFamily = figtree),
        headlineLarge = androidx.compose.material3.Typography().headlineLarge.copy(fontFamily = figtree),
        headlineMedium = androidx.compose.material3.Typography().headlineMedium.copy(fontFamily = figtree),
        headlineSmall = androidx.compose.material3.Typography().headlineSmall.copy(fontFamily = figtree),
        titleLarge = androidx.compose.material3.Typography().titleLarge.copy(fontFamily = figtree),
        titleMedium = androidx.compose.material3.Typography().titleMedium.copy(fontFamily = figtree),
        titleSmall = androidx.compose.material3.Typography().titleSmall.copy(fontFamily = figtree),
        bodyLarge = androidx.compose.material3.Typography().bodyLarge.copy(fontFamily = figtree),
        bodyMedium = androidx.compose.material3.Typography().bodyMedium.copy(fontFamily = figtree),
        bodySmall = androidx.compose.material3.Typography().bodySmall.copy(fontFamily = figtree),
        labelLarge = androidx.compose.material3.Typography().labelLarge.copy(fontFamily = figtree),
        labelMedium = androidx.compose.material3.Typography().labelMedium.copy(fontFamily = figtree),
        labelSmall = androidx.compose.material3.Typography().labelSmall.copy(fontFamily = figtree)
    )
}
