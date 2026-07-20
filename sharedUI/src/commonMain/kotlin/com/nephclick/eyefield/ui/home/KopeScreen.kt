package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.marketing
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource
import org.jetbrains.compose.resources.painterResource
import kotlinx.coroutines.launch
import com.nephclick.eyefield.Supabase
import io.github.jan.supabase.auth.auth
import com.nephclick.eyefield.models.KopeCompany
import com.nephclick.eyefield.models.KopeIndividual

class KopeScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val coroutineScope = rememberCoroutineScope()
        
        var selectedTabIndex by remember { mutableStateOf(0) } // 0: Company, 1: Individual
        val tabs = listOf(
            org.jetbrains.compose.resources.stringResource(Res.string.kope_company),
            org.jetbrains.compose.resources.stringResource(Res.string.kope_individual)
        )
        
        var businessName by remember { mutableStateOf("") }
        var email by remember { mutableStateOf("") }
        var phoneNumber by remember { mutableStateOf("") }
        
        // Country / Phone code
        val countries = listOf("Uganda (+256)", "Kenya (+254)", "Tanzania (+255)", "Rwanda (+250)", "USA (+1)", "UK (+44)", "Germany (+49)", "France (+33)")
        var selectedCountry by remember { mutableStateOf("") }
        var showCountryDropdown by remember { mutableStateOf(false) }
        
        // Goal
        val goals = listOf("Getting more clients", "Get more visible on social media", "Company Branding", "Custom Goal")
        var selectedGoal by remember { mutableStateOf("") }
        var showGoalDropdown by remember { mutableStateOf(false) }
        var customGoal by remember { mutableStateOf("") }

        // Local theme override for Orange accent
        val kopeColorScheme = MaterialTheme.colorScheme.copy(
            primary = Color(0xFFFF9800),
            onPrimary = Color.White,
            secondary = Color(0xFFFFB74D)
        )

        MaterialTheme(colorScheme = kopeColorScheme) {
            Scaffold(
                topBar = {
                    CenterAlignedTopAppBar(
                        title = { Text("KOPE", fontWeight = FontWeight.Bold) },
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
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Hero Section
                    Box(modifier = Modifier.fillMaxWidth().height(200.dp)) {
                        Image(
                            painter = painterResource(Res.drawable.marketing),
                            contentDescription = "Marketing Hero",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                        Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.5f)))
                        Column(
                            modifier = Modifier.fillMaxSize().padding(16.dp),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("KOPE", style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Black), color = Color.White)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                stringResource(Res.string.kope_hero_desc),
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color.White,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }

                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        TabRow(selectedTabIndex = selectedTabIndex) {
                            tabs.forEachIndexed { index, title ->
                                Tab(
                                    selected = selectedTabIndex == index,
                                    onClick = { selectedTabIndex = index },
                                    text = { Text(title) }
                                )
                            }
                        }

                        OutlinedTextField(
                            value = businessName,
                            onValueChange = { businessName = it },
                            label = { Text(if (selectedTabIndex == 0) stringResource(Res.string.company_name) else stringResource(Res.string.your_name)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        if (selectedTabIndex == 0) {
                            // Company Form specific fields
                            ExposedDropdownMenuBox(
                                expanded = showCountryDropdown,
                                onExpandedChange = { showCountryDropdown = it }
                            ) {
                                OutlinedTextField(
                                    value = selectedCountry,
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text(stringResource(Res.string.country)) },
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCountryDropdown) },
                                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = showCountryDropdown,
                                    onDismissRequest = { showCountryDropdown = false }
                                ) {
                                    countries.forEach { country ->
                                        DropdownMenuItem(
                                            text = { Text(country) },
                                            onClick = {
                                                selectedCountry = country
                                                // Extract dial code automatically
                                                val code = country.substringAfter("(").substringBefore(")")
                                                phoneNumber = code + " "
                                                showCountryDropdown = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        OutlinedTextField(
                            value = phoneNumber,
                            onValueChange = { phoneNumber = it },
                            label = { Text(stringResource(Res.string.phone_number)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text(stringResource(Res.string.email)) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        if (selectedTabIndex == 0) {
                            ExposedDropdownMenuBox(
                                expanded = showGoalDropdown,
                                onExpandedChange = { showGoalDropdown = it }
                            ) {
                                OutlinedTextField(
                                    value = selectedGoal,
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text(stringResource(Res.string.campaign_goal)) },
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showGoalDropdown) },
                                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = showGoalDropdown,
                                    onDismissRequest = { showGoalDropdown = false }
                                ) {
                                    goals.forEach { goal ->
                                        DropdownMenuItem(
                                            text = { Text(goal) },
                                            onClick = {
                                                selectedGoal = goal
                                                showGoalDropdown = false
                                            }
                                        )
                                    }
                                }
                            }
                            
                            if (selectedGoal == "Custom Goal") {
                                OutlinedTextField(
                                    value = customGoal,
                                    onValueChange = { if (it.length <= 150) customGoal = it },
                                    label = { Text(stringResource(Res.string.describe_custom_goal)) },
                                    modifier = Modifier.fillMaxWidth().height(100.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    maxLines = 4
                                )
                                Text("${customGoal.length}/150", style = MaterialTheme.typography.bodySmall, modifier = Modifier.align(Alignment.End))
                            }
                        } else {
                            // Individual goal
                            OutlinedTextField(
                                value = customGoal,
                                onValueChange = { customGoal = it },
                                label = { Text(stringResource(Res.string.what_is_campaign_goal)) },
                                modifier = Modifier.fillMaxWidth().height(120.dp),
                                maxLines = 5,
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        Button(
                            onClick = { 
                                coroutineScope.launch {
                                    if (selectedTabIndex == 0) {
                                        val company = KopeCompany(
                                            userId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: throw Exception("Not logged in"), // replace with auth
                                            companyName = businessName,
                                            country = selectedCountry,
                                            description = if (selectedGoal == "Custom Goal") customGoal else selectedGoal
                                        )
                                        Supabase.saveKopeCompany(company)
                                    } else {
                                        val individual = KopeIndividual(
                                            userId = Supabase.client.auth.currentSessionOrNull()?.user?.id ?: throw Exception("Not logged in"), // replace with auth
                                            fullName = businessName,
                                            country = selectedCountry,
                                            description = customGoal
                                        )
                                        Supabase.saveKopeIndividual(individual)
                                    }
                                    navigator.pop()
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(48.dp).padding(top = 16.dp),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Text(stringResource(Res.string.submit_request))
                        }
                        
                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
