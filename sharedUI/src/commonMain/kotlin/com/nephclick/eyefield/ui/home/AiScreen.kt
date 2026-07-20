package com.nephclick.eyefield.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import eyefield.sharedui.generated.resources.Res
import eyefield.sharedui.generated.resources.*
import org.jetbrains.compose.resources.stringResource

class AiScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        data class Message(val text: String, val isUser: Boolean)
        val chatLog = remember { mutableStateListOf<Message>() }
        var currentInput by remember { mutableStateOf("") }
        var isTyping by remember { mutableStateOf(false) }
        val coroutineScope = rememberCoroutineScope()
        var openRouterKey by remember { mutableStateOf<String?>(null) }

        LaunchedEffect(Unit) {
            val keys = com.nephclick.eyefield.Supabase.fetchApiKeys()
            openRouterKey = keys.openrouterKey
        }
        
        val aiUnavailableMsg = org.jetbrains.compose.resources.stringResource(Res.string.ai_unavailable_msg)
        fun sendMessage(text: String) {
            if (text.isBlank()) return
            chatLog.add(Message(text, true))
            currentInput = ""
            isTyping = true
            
            coroutineScope.launch {
                val apiKey = openRouterKey
                if (apiKey.isNullOrBlank()) {
                    chatLog.add(Message(aiUnavailableMsg, false))
                    isTyping = false
                    return@launch
                }
                val response = com.nephclick.eyefield.utils.GoogleImageSearchService.chat(text)
                chatLog.add(Message(response, false))
                isTyping = false
            }
        }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(stringResource(Res.string.ai_title), fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        TextButton(onClick = { navigator.pop() }) {
                            Text(stringResource(Res.string.back))
                        }
                    },
                    actions = {
                        TextButton(onClick = { navigator.push(AllProductsScreen()) }) {
                            Text(stringResource(Res.string.products))
                        }
                    }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Chat Log Area
                if (chatLog.isEmpty()) {
                    Box(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(stringResource(Res.string.how_can_i_help), style = MaterialTheme.typography.titleLarge)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(chatLog) { msg ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = if (msg.isUser) Arrangement.End else Arrangement.Start
                            ) {
                                Surface(
                                    color = if (msg.isUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier.widthIn(max = 250.dp)
                                ) {
                                    Text(
                                        text = msg.text,
                                        color = if (msg.isUser) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(12.dp)
                                    )
                                }
                            }
                        }
                        if (isTyping) {
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Start
                                ) {
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(16.dp),
                                        modifier = Modifier.widthIn(max = 100.dp)
                                    ) {
                                        Text(stringResource(Res.string.typing), color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(12.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                // Sample Questions & Input Box
                Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 16.dp)) {
                    if (chatLog.isEmpty()) {
                        Text(stringResource(Res.string.sample_questions), style = MaterialTheme.typography.labelLarge)
                        listOf(
                            org.jetbrains.compose.resources.stringResource(Res.string.sample_question_1),
                            org.jetbrains.compose.resources.stringResource(Res.string.sample_question_2),
                            org.jetbrains.compose.resources.stringResource(Res.string.sample_question_3)
                        ).forEach { q ->
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.fillMaxWidth().clickable { sendMessage(q) }
                            ) {
                                Text(q, modifier = Modifier.padding(12.dp))
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    OutlinedTextField(
                        value = currentInput,
                        onValueChange = { currentInput = it },
                        placeholder = { Text(stringResource(Res.string.ask_endocard)) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        trailingIcon = {
                            IconButton(onClick = { 
                                sendMessage(currentInput)
                            }) {
                                Text("→", style = MaterialTheme.typography.titleLarge) // Using text instead of icon to avoid missing dependency
                            }
                        }
                    )
                }
            }
        }
    }
}
