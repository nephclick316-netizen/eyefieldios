package com.nephclick.eyefield.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import com.nephclick.eyefield.Supabase
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.Google
import com.nephclick.eyefield.ui.main.MainScreen

import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

class LoginScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        var isLogin by remember { mutableStateOf(true) }
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var passwordVisible by remember { mutableStateOf(false) }
        var confirmPassword by remember { mutableStateOf("") }
        var confirmPasswordVisible by remember { mutableStateOf(false) }
        var acceptedTerms by remember { mutableStateOf(false) }
        val coroutineScope = rememberCoroutineScope()
        var errorMessage by remember { mutableStateOf<String?>(null) }
        var isLoading by remember { mutableStateOf(false) }

        val sessionStatus by Supabase.client.auth.sessionStatus.collectAsState(io.github.jan.supabase.auth.status.SessionStatus.Initializing)
        LaunchedEffect(sessionStatus, isLogin) {
            if (isLogin && sessionStatus is io.github.jan.supabase.auth.status.SessionStatus.Authenticated) {
                isLoading = true
                errorMessage = null
                try {
                    val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                    if (currentUserId != null) {
                        var profile = Supabase.fetchProfile(currentUserId)
                        if (profile == null) {
                            val session = Supabase.client.auth.currentSessionOrNull()
                            val metadata = session?.user?.userMetadata
                            val fullName = metadata?.get("full_name")?.let { if (it is kotlinx.serialization.json.JsonPrimitive) it.content else null } ?: ""
                            val avatarUrl = metadata?.get("avatar_url")?.let { if (it is kotlinx.serialization.json.JsonPrimitive) it.content else null }
                            val username = fullName.replace(" ", "").lowercase().takeIf { it.isNotBlank() } ?: "user_${currentUserId.take(5)}"
                            
                            profile = com.nephclick.eyefield.models.Profile(
                                id = currentUserId,
                                username = username,
                                fullName = fullName,
                                avatarUrl = avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=$username",
                                bio = "",
                                email = session?.user?.email ?: ""
                            )
                            Supabase.saveProfile(profile)
                        }
                        if (profile.status == "deleted" || profile.status == "blocked") {
                            Supabase.client.auth.signOut()
                            errorMessage = "This account has been blocked or deleted."
                            isLoading = false
                            return@LaunchedEffect
                        }
                    }
                    if (navigator.canPop) {
                        navigator.pop()
                    } else {
                        navigator.replaceAll(MainScreen())
                    }
                } catch (e: Exception) {
                    errorMessage = "Login verification failed: ${e.message}"
                } finally {
                    isLoading = false
                }
            }
        }

        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.TopEnd) {
                    IconButton(onClick = { 
                        if (navigator.canPop) {
                            navigator.pop()
                        } else {
                            navigator.replaceAll(MainScreen())
                        }
                    }) {
                        Text("X", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground)
                    }
                }
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Top Branding Section
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Eye",
                        color = MaterialTheme.colorScheme.onBackground,
                        style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Black)
                    )
                    Text(
                        text = "Field",
                        color = MaterialTheme.colorScheme.secondary,
                        style = MaterialTheme.typography.displaySmall.copy(fontWeight = FontWeight.Black)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = stringResource(Res.string.slogan),
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                    color = MaterialTheme.colorScheme.onBackground,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 32.dp)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Bottom Card Section
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp)
                    ) {
                        // Tabs
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Button(
                                onClick = { isLogin = true },
                                modifier = Modifier.weight(1f).height(48.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isLogin) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.background,
                                    contentColor = if (isLogin) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onBackground
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(stringResource(Res.string.login_tab), fontWeight = FontWeight.Bold)
                            }
                            
                            Button(
                                onClick = { isLogin = false },
                                modifier = Modifier.weight(1f).height(48.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (!isLogin) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.background,
                                    contentColor = if (!isLogin) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onBackground
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(stringResource(Res.string.signup_tab), fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        if (errorMessage != null) {
                            Text(
                                text = errorMessage!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.labelSmall,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                            )
                        }

                        // Email Field
                        Text(
                            text = stringResource(Res.string.email_address),
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextField(
                            value = email,
                            onValueChange = { email = it },
                            placeholder = { Text(stringResource(Res.string.email_placeholder)) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.background,
                                unfocusedContainerColor = MaterialTheme.colorScheme.background,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            leadingIcon = { 
                                Image(
                                    painter = painterResource(Res.drawable.envelope),
                                    contentDescription = stringResource(Res.string.email),
                                    modifier = Modifier.size(20.dp),
                                    colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onSurfaceVariant)
                                ) 
                            }
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Password Field
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = stringResource(Res.string.password),
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            if (isLogin) {
                                Text(
                                    text = stringResource(Res.string.forgot_password),
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.secondary,
                                    modifier = Modifier.clickable { /* Forgot Password */ }
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        TextField(
                            value = password,
                            onValueChange = { password = it },
                            placeholder = { Text(stringResource(Res.string.password_placeholder)) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = MaterialTheme.colorScheme.background,
                                unfocusedContainerColor = MaterialTheme.colorScheme.background,
                                focusedIndicatorColor = Color.Transparent,
                                unfocusedIndicatorColor = Color.Transparent
                            ),
                            leadingIcon = { Text("🔒") },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                val text = if (passwordVisible) stringResource(Res.string.hide) else stringResource(Res.string.show)
                                TextButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Text(text, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        )

                        if (!isLogin) {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            // Confirm Password Field
                            Text(
                                text = stringResource(Res.string.confirm_password),
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Black),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            TextField(
                                value = confirmPassword,
                                onValueChange = { confirmPassword = it },
                                placeholder = { Text(stringResource(Res.string.password_placeholder)) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = MaterialTheme.colorScheme.background,
                                    unfocusedContainerColor = MaterialTheme.colorScheme.background,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                ),
                                leadingIcon = { Text("🔒") },
                                visualTransformation = if (confirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                trailingIcon = {
                                    val text = if (confirmPasswordVisible) stringResource(Res.string.hide) else stringResource(Res.string.show)
                                    TextButton(onClick = { confirmPasswordVisible = !confirmPasswordVisible }) {
                                        Text(text, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            )

                            val isPasswordValid = password.length in 8..20 &&
                                password.any { it.isUpperCase() } &&
                                password.any { it.isDigit() } &&
                                password.any { !it.isLetterOrDigit() }

                            if (confirmPassword.isNotEmpty() && !isPasswordValid) {
                                Text(
                                    text = stringResource(Res.string.password_rules),
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(top = 4.dp, start = 16.dp)
                                )
                            }
                            
                            if (password.isNotEmpty() && confirmPassword.isNotEmpty() && password != confirmPassword) {
                                Text(
                                    text = stringResource(Res.string.passwords_do_not_match),
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(top = 4.dp, start = 16.dp)
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    checked = acceptedTerms,
                                    onCheckedChange = { acceptedTerms = it },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = MaterialTheme.colorScheme.primary,
                                        uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                val termsString = buildAnnotatedString {
                                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface)) {
                                        append(stringResource(Res.string.agree_terms))
                                    }
                                    pushStringAnnotation("TERMS", "TERMS")
                                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.secondary)) {
                                        append(stringResource(Res.string.terms))
                                    }
                                    pop()
                                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface)) {
                                        append(stringResource(Res.string.terms_and))
                                    }
                                    pushStringAnnotation("PRIVACY", "PRIVACY")
                                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.secondary)) {
                                        append(stringResource(Res.string.privacy_policy))
                                    }
                                    pop()
                                }
                                androidx.compose.foundation.text.ClickableText(
                                    text = termsString,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    onClick = { offset ->
                                        termsString.getStringAnnotations("TERMS", offset, offset).firstOrNull()?.let {
                                            navigator.push(com.nephclick.eyefield.ui.profile.TermsOfServiceScreen())
                                        }
                                        termsString.getStringAnnotations("PRIVACY", offset, offset).firstOrNull()?.let {
                                            navigator.push(com.nephclick.eyefield.ui.profile.PrivacyPolicyScreen())
                                        }
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))

                        // Login/Signup Button
                        val errorFillAllFields = stringResource(Res.string.error_fill_all_fields)
                        val errorAccountBlockedDeleted = stringResource(Res.string.error_account_blocked_deleted)
                        val errorPasswordsNotMatch = stringResource(Res.string.error_passwords_not_match)
                        val errorAuthenticationFailed = stringResource(Res.string.error_authentication_failed)
                        
                        Button(
                            onClick = {
                                if (email.isEmpty() || password.isEmpty()) {
                                    errorMessage = errorFillAllFields
                                    return@Button
                                }
                                isLoading = true
                                errorMessage = null
                                coroutineScope.launch {
                                    try {
                                        val reqEmail = email
                                        val reqPassword = password
                                        if (isLogin) {
                                            Supabase.client.auth.signInWith(Email) {
                                                this.email = reqEmail
                                                this.password = reqPassword
                                            }
                                            
                                            val currentUserId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                                            if (currentUserId != null) {
                                                val profile = Supabase.fetchProfile(currentUserId)
                                                if (profile?.status == "deleted" || profile?.status == "blocked") {
                                                    Supabase.client.auth.signOut()
                                                    errorMessage = errorAccountBlockedDeleted
                                                    isLoading = false
                                                    return@launch
                                                }
                                            }
                                            
                                            navigator.replaceAll(MainScreen())
                                        } else {
                                            if (password != confirmPassword) {
                                                errorMessage = errorPasswordsNotMatch
                                                isLoading = false
                                                return@launch
                                            }
                                            Supabase.client.auth.signUpWith(Email) {
                                                this.email = reqEmail
                                                this.password = reqPassword
                                            }
                                            navigator.push(OnboardingScreen(userEmail = reqEmail))
                                        }
                                    } catch (e: Exception) {
                                        errorMessage = e.message ?: errorAuthenticationFailed
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            enabled = !isLoading && (isLogin || acceptedTerms),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary,
                                disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                            } else {
                                Text(
                                    text = if (isLogin) stringResource(Res.string.login_button) else stringResource(Res.string.signup_button),
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text("→", style = MaterialTheme.typography.titleMedium)
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Divider
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f))
                            Text(
                                text = stringResource(Res.string.or_continue_with),
                                modifier = Modifier.padding(horizontal = 16.dp),
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f))
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // Google Button
                        OutlinedButton(
                            onClick = { 
                                coroutineScope.launch {
                                    try {
                                        isLoading = true
                                        errorMessage = null
                                        Supabase.client.auth.signInWith(Google)
                                    } catch (e: Exception) {
                                        errorMessage = "Google sign-in failed: ${e.message}"
                                        isLoading = false
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = MaterialTheme.colorScheme.background,
                                contentColor = MaterialTheme.colorScheme.onBackground
                            ),
                            border = null
                        ) {
                            Image(
                                painter = painterResource(Res.drawable.google),
                                contentDescription = "Google",
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = stringResource(Res.string.continue_with_google),
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        if (isLogin) {
                            val annotatedString = buildAnnotatedString {
                                withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface)) {
                                    append(stringResource(Res.string.terms_prefix))
                                }
                                pushStringAnnotation("TERMS", "TERMS")
                                withStyle(SpanStyle(color = MaterialTheme.colorScheme.secondary)) {
                                    append(stringResource(Res.string.terms))
                                }
                                pop()
                                withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface)) {
                                    append(stringResource(Res.string.terms_and))
                                }
                                pushStringAnnotation("PRIVACY", "PRIVACY")
                                withStyle(SpanStyle(color = MaterialTheme.colorScheme.secondary)) {
                                    append(stringResource(Res.string.privacy_policy))
                                }
                                pop()
                            }
                            androidx.compose.foundation.text.ClickableText(
                                text = annotatedString,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                ),
                                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                                onClick = { offset ->
                                    annotatedString.getStringAnnotations("TERMS", offset, offset).firstOrNull()?.let {
                                        navigator.push(com.nephclick.eyefield.ui.profile.TermsOfServiceScreen())
                                    }
                                    annotatedString.getStringAnnotations("PRIVACY", offset, offset).firstOrNull()?.let {
                                        navigator.push(com.nephclick.eyefield.ui.profile.PrivacyPolicyScreen())
                                    }
                                }
                            )
                        }

                        TextButton(
                            onClick = { 
                                if (navigator.canPop) {
                                    navigator.pop()
                                } else {
                                    navigator.replaceAll(MainScreen())
                                }
                            }, // Pops back to MainScreen/Cascadea
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = stringResource(Res.string.continue_as_guest),
                                color = MaterialTheme.colorScheme.secondary,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                        
                        Text(
                            text = stringResource(Res.string.powered_by),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
