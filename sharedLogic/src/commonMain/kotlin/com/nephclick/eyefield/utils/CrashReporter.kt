package com.nephclick.eyefield.utils

import com.nephclick.eyefield.Supabase
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

@Serializable
data class CrashReport(
    val stack_trace: String,
    val created_at: String = Clock.System.now().toString(),
    val user_id: String? = null
)

object CrashReporter {
    fun handleCrash(exception: Throwable) {
        val stackTrace = exception.stackTraceToString()
        PersistentCache.saveString("pending_crash_report", stackTrace)
    }

    fun submitPendingReport(onComplete: () -> Unit) {
        val pendingReport = PersistentCache.getString("pending_crash_report")
        if (pendingReport != null) {
            CoroutineScope(Dispatchers.Default).launch {
                try {
                    val userId = Supabase.client.auth.currentSessionOrNull()?.user?.id
                    val report = CrashReport(stack_trace = pendingReport, user_id = userId)
                    Supabase.client.postgrest["crash_reports"].insert(report)
                    PersistentCache.saveString("pending_crash_report", "")
                } catch (e: Exception) {
                    // Ignore for now
                } finally {
                    onComplete()
                }
            }
        } else {
            onComplete()
        }
    }

    fun clearPendingReport() {
        PersistentCache.saveString("pending_crash_report", "")
    }
}
