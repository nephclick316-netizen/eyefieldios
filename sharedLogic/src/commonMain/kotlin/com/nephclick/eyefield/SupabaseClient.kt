package com.nephclick.eyefield

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.postgrest.Postgrest
import kotlinx.datetime.Clock

import com.nephclick.eyefield.models.Profile
import com.nephclick.eyefield.models.Business
import com.nephclick.eyefield.models.PromotionalCard
import com.nephclick.eyefield.models.Product
import com.nephclick.eyefield.models.ProductLike
import com.nephclick.eyefield.models.ProductReview
import com.nephclick.eyefield.models.KopeCompany
import com.nephclick.eyefield.models.KopeIndividual
import com.nephclick.eyefield.models.Pulse
import com.nephclick.eyefield.models.Post
import com.nephclick.eyefield.models.PostComment
import com.nephclick.eyefield.models.PostEmoji
import com.nephclick.eyefield.models.PostApplause
import com.nephclick.eyefield.models.PostReport
import com.nephclick.eyefield.models.PostSave
import com.nephclick.eyefield.models.PulseLike
import com.nephclick.eyefield.models.AgoraTokenResponse
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.encodeToString
import com.nephclick.eyefield.utils.PersistentCache

import io.ktor.client.request.post
import io.ktor.client.request.header
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType

object Supabase {
    val json = Json { ignoreUnknownKeys = true }

    var cachedPosts: List<Post>? = null
        get() {
            if (field == null) {
                val str = PersistentCache.getString("cachedPosts")
                if (str != null) {
                    try { field = json.decodeFromString<List<Post>>(str) } catch (e: Exception) { }
                }
            }
            return field
        }
        set(value) {
            field = value
            if (value != null) {
                try { PersistentCache.saveString("cachedPosts", json.encodeToString(value)) } catch (e: Exception) { }
            }
        }

    var cachedPulses: List<Pulse>? = null
        get() {
            if (field == null) {
                val str = PersistentCache.getString("cachedPulses")
                if (str != null) {
                    try { field = json.decodeFromString<List<Pulse>>(str) } catch (e: Exception) { }
                }
            }
            return field
        }
        set(value) {
            field = value
            if (value != null) {
                try { PersistentCache.saveString("cachedPulses", json.encodeToString(value)) } catch (e: Exception) { }
            }
        }

    var cachedProducts: List<Product>? = null
        get() {
            if (field == null) {
                val str = PersistentCache.getString("cachedProducts")
                if (str != null) {
                    try { field = json.decodeFromString<List<Product>>(str) } catch (e: Exception) { }
                }
            }
            return field
        }
        set(value) {
            field = value
            if (value != null) {
                try { PersistentCache.saveString("cachedProducts", json.encodeToString(value)) } catch (e: Exception) { }
            }
        }
    val client: SupabaseClient = createSupabaseClient(
        supabaseUrl = "https://fzcoljqdtmkgrswwxkyi.supabase.co",
        supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y29sanFkdG1rZ3Jzd3d4a3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzU4NzIsImV4cCI6MjA5NzExMTg3Mn0.bMO4poe2Zs_c_zTor5gFf2BFvRIWSKF6j9OtCdFnOdo"
    ) {
        install(Auth) {
            host = "login-callback"
            scheme = "eyefield"
        }
        install(Storage)
        install(Postgrest)
    }

    suspend fun fetchProfile(userId: String): Profile? {
        return client.postgrest["profiles"].select(columns = Columns.ALL) {
            filter { eq("id", userId) }
        }.decodeSingleOrNull<Profile>()
    }

    suspend fun fetchBusiness(userId: String): Business? {
        return client.postgrest["businesses"].select(columns = Columns.ALL) {
            filter { eq("user_id", userId) }
        }.decodeSingleOrNull<Business>()
    }

    suspend fun saveProfile(profile: Profile) {
        try { client.postgrest["profiles"].upsert(profile) } catch (e: Exception) { println("Error saving profile: ${e.message}") }
    }

    suspend fun sendTelemetryRecord(userId: String, permissionDeniedCount: Int, wakeFailures: Int) {
        // Best-effort insert with simple retry/backoff
        val payload = mapOf(
            "user_id" to userId,
            "permission_denied_count" to permissionDeniedCount,
            "wake_failures" to wakeFailures
        )
        var attempt = 0
        val maxAttempts = 4
        var backoff = 1000L
        while (attempt < maxAttempts) {
            try {
                client.postgrest["client_telemetry"].insert(payload)
                return
            } catch (e: Exception) {
                attempt++
                try { kotlinx.coroutines.delay(backoff) } catch (_: Throwable) {}
                backoff *= 2
            }
        }
    }

    suspend fun saveBusiness(business: Business) {
        try { client.postgrest["businesses"].upsert(business) } catch (e: Exception) { println("Error saving business: ${e.message}") }
    }

    suspend fun insertPromotionalCard(card: PromotionalCard) {
        try { client.postgrest["promotional_cards"].insert(card) } catch (e: Exception) { println("Error inserting promo card: ${e.message}") }
    }

    suspend fun fetchPromotionalCards(): List<PromotionalCard> {
        return client.postgrest["promotional_cards"].select(columns = Columns.ALL) {
            filter { eq("active", true) }
        }.decodeList<PromotionalCard>()
    }

    suspend fun fetchAllProfiles(excludeUserId: String): List<Profile> {
        return try {
            client.postgrest["profiles"].select(columns = Columns.ALL) {
                filter {
                    neq("id", excludeUserId)
                }
            }.decodeList<Profile>()
        } catch (e: Exception) {
            println("Error fetching profiles: ${e.message}")
            emptyList()
        }
    }

    suspend fun searchUsers(query: String): List<Profile> {
        if (query.isBlank()) return emptyList()
        return try {
            client.postgrest["profiles"].select(columns = Columns.ALL) {
                filter {
                    or {
                        ilike("username", "%$query%")
                        ilike("full_name", "%$query%")
                    }
                }
            }.decodeList<Profile>()
        } catch (e: Exception) {
            println("Error searching users: ${e.message}")
            emptyList()
        }
    }

    suspend fun createProduct(product: Product) {
        try {
            val toInsert = if (product.id.isBlank()) {
                product.copy(id = "product_${kotlin.random.Random.nextInt()}")
            } else product
            client.postgrest["products"].insert(toInsert) 
        } catch (e: Exception) { println("Error creating product: ${e.message}") }
    }

    suspend fun updateProduct(product: Product) {
        try {
            client.postgrest["products"].update(product) {
                filter { eq("id", product.id) }
            }
        } catch (e: Exception) { println("Error updating product: ${e.message}") }
    }

    suspend fun searchProducts(query: String): List<Product> {
        if (query.isBlank()) return emptyList()
        return try {
            client.postgrest["products"].select(columns = Columns.ALL) {
                filter {
                    or {
                        ilike("name", "%$query%")
                        ilike("description", "%$query%")
                    }
                }
            }.decodeList<Product>().also { cachedProducts = it }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchProducts(category: String? = null, isLimited: Boolean? = null): List<Product> {
        return try {
            client.postgrest["products"].select(columns = Columns.ALL) {
                filter {
                    if (category != null) {
                        eq("main_category", category)
                    }
                    if (isLimited != null) {
                        eq("is_limited_edition", isLimited)
                    }
                }
            }.decodeList<Product>().also { cachedProducts = it }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchProductsByUser(userId: String): List<Product> {
        return try {
            client.postgrest["products"].select(columns = Columns.ALL) {
                filter { eq("seller_id", userId) }
            }.decodeList<Product>().also { cachedProducts = it }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun deleteProduct(productId: String) {
        try {
            client.postgrest["products"].delete {
                filter { eq("id", productId) }
            }
        } catch (e: Exception) {
            println("Error deleting product: ${e.message}")
        }
    }

    suspend fun fetchProductDetails(productId: String): Product? {
        return try {
            client.postgrest["products"].select(columns = Columns.ALL) {
                filter { eq("id", productId) }
            }.decodeSingleOrNull<Product>()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun toggleLike(productId: String, userId: String) {
        try {
            val existing = client.postgrest["product_likes"].select {
                filter {
                    eq("product_id", productId)
                    eq("user_id", userId)
                }
            }.decodeSingleOrNull<ProductLike>()

            if (existing != null) {
                client.postgrest["product_likes"].delete {
                    filter {
                        eq("product_id", productId)
                        eq("user_id", userId)
                    }
                }
            } else {
                client.postgrest["product_likes"].insert(ProductLike(productId = productId, userId = userId))
            }
        } catch (e: Exception) {
            println("Error toggling like: ${e.message}")
        }
    }

    suspend fun submitReview(review: ProductReview) {
        try { client.postgrest["product_reviews"].insert(review) } catch (e: Exception) { println("Error submitting review: ${e.message}") }
    }

    suspend fun deleteReview(reviewId: String) {
        try {
            client.postgrest["product_reviews"].delete {
                filter { eq("id", reviewId) }
            }
        } catch (e: Exception) {
            println("Error deleting review: ${e.message}")
        }
    }

    suspend fun fetchReviews(productId: String): List<ProductReview> {
        return try {
            client.postgrest["product_reviews"].select(columns = Columns.ALL) {
                filter { eq("product_id", productId) }
            }.decodeList<ProductReview>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun saveKopeCompany(company: KopeCompany) {
        try { client.postgrest["kope_companies"].upsert(company) } catch (e: Exception) { println("Error saving kope company: ${e.message}") }
    }

    suspend fun saveKopeIndividual(individual: KopeIndividual) {
        try { client.postgrest["kope_individuals"].upsert(individual) } catch (e: Exception) { println("Error saving kope individual: ${e.message}") }
    }

    // ===== PULSES =====
    suspend fun createPulse(pulse: Pulse) {
        try { client.postgrest["pulses"].insert(pulse) } catch (e: Exception) { println("Error creating pulse: ${e.message}") }
    }

    suspend fun togglePulseLike(pulseId: String, userId: String) {
        try {
            val existing = client.postgrest["pulse_likes"].select {
                filter {
                    eq("pulse_id", pulseId)
                    eq("user_id", userId)
                }
            }.decodeSingleOrNull<com.nephclick.eyefield.models.PulseLike>()
            
            if (existing != null) {
                client.postgrest["pulse_likes"].delete {
                    filter {
                        eq("pulse_id", pulseId)
                        eq("user_id", userId)
                    }
                }
            } else {
                client.postgrest["pulse_likes"].insert(com.nephclick.eyefield.models.PulseLike(pulseId = pulseId, userId = userId))
            }
        } catch (e: Exception) { println("Error toggling pulse like: ${e.message}") }
    }

    suspend fun getUserPostCount(userId: String): Long {
        return try {
            val response = client.postgrest["posts"].select {
                filter { eq("user_id", userId) }
                count(io.github.jan.supabase.postgrest.query.Count.EXACT)
            }
            response.countOrNull() ?: 0L
        } catch (e: Exception) {
            0L
        }
    }

    suspend fun getPulseLikeCount(pulseId: String): Long {
        return try {
            val response = client.postgrest["pulse_likes"].select {
                filter { eq("pulse_id", pulseId) }
                count(io.github.jan.supabase.postgrest.query.Count.EXACT)
            }
            response.countOrNull() ?: 0
        } catch (e: Exception) { 0L }
    }

    suspend fun hasLikedPulse(pulseId: String, userId: String): Boolean {
        return try {
            val existing = client.postgrest["pulse_likes"].select {
                filter {
                    eq("pulse_id", pulseId)
                    eq("user_id", userId)
                }
            }.decodeSingleOrNull<com.nephclick.eyefield.models.PulseLike>()
            existing != null
        } catch (e: Exception) { false }
    }

    suspend fun fetchPulses(): List<Pulse> {
        return try {
            client.postgrest["pulses"].select(columns = Columns.ALL) {
                filter { gt("expires_at", "now()") }
            }.decodeList<Pulse>().also { cachedPulses = it }
        } catch (e: Exception) {
            println("Error fetching pulses: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchUserPulses(userId: String): List<Pulse> {
        return try {
            client.postgrest["pulses"].select(columns = Columns.ALL) {
                filter {
                    eq("user_id", userId)
                    gt("expires_at", "now()")
                }
            }.decodeList<Pulse>().also { cachedPulses = it }
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun deletePulse(pulseId: String) {
        try {
            client.postgrest["pulses"].delete { filter { eq("id", pulseId) } }
        } catch (e: Exception) { println("Error deleting pulse: ${e.message}") }
    }

    // ===== POSTS =====
    suspend fun createPost(post: Post) {
        try { client.postgrest["posts"].insert(post) } catch (e: Exception) { println("Error creating post: ${e.message}") }
    }

    suspend fun fetchPosts(searchQuery: String? = null): List<Post> {
        return try {
            if (!searchQuery.isNullOrBlank()) {
                client.postgrest["posts"].select(columns = Columns.ALL) {
                    filter {
                        or {
                            ilike("content", "%$searchQuery%")
                            ilike("location", "%$searchQuery%")
                        }
                    }
                    order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }.decodeList<Post>().also { cachedPosts = it }
            } else {
                client.postgrest["posts"].select(columns = Columns.ALL) {
                    order("created_at", io.github.jan.supabase.postgrest.query.Order.DESCENDING)
                }.decodeList<Post>().also { cachedPosts = it }
            }
        } catch (e: Exception) {
            println("Error fetching posts: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchPostById(postId: String): Post? {
        return try {
            client.postgrest["posts"].select(columns = Columns.ALL) {
                filter { eq("id", postId) }
            }.decodeSingleOrNull<Post>()
        } catch (e: Exception) { null }
    }

    suspend fun deletePost(postId: String) {
        try {
            client.postgrest["posts"].delete { filter { eq("id", postId) } }
        } catch (e: Exception) { println("Error deleting post: ${e.message}") }
    }

    // ===== COMMENTS =====
    suspend fun createComment(comment: PostComment) {
        try { client.postgrest["post_comments"].insert(comment) } catch (e: Exception) { println("Error creating comment: ${e.message}") }
    }

    suspend fun fetchComments(postId: String): List<PostComment> {
        return try {
            client.postgrest["post_comments"].select(columns = Columns.ALL) {
                filter { eq("post_id", postId) }
            }.decodeList<PostComment>()
        } catch (e: Exception) { emptyList() }
    }

    suspend fun deleteComment(commentId: String) {
        try {
            client.postgrest["post_comments"].delete { filter { eq("id", commentId) } }
        } catch (e: Exception) { println("Error deleting comment: ${e.message}") }
    }

    // ===== EMOJIS =====
    suspend fun toggleEmoji(postId: String, userId: String, emoji: String) {
        try {
            val existing = client.postgrest["post_emojis"].select {
                filter {
                    eq("post_id", postId)
                    eq("user_id", userId)
                    eq("emoji", emoji)
                }
            }.decodeSingleOrNull<PostEmoji>()
            if (existing != null) {
                client.postgrest["post_emojis"].delete {
                    filter {
                        eq("post_id", postId)
                        eq("user_id", userId)
                        eq("emoji", emoji)
                    }
                }
            } else {
                client.postgrest["post_emojis"].insert(PostEmoji(postId = postId, userId = userId, emoji = emoji))
            }
        } catch (e: Exception) { println("Error toggling emoji: ${e.message}") }
    }

    suspend fun fetchEmojis(postId: String): List<PostEmoji> {
        return try {
            client.postgrest["post_emojis"].select(columns = Columns.ALL) {
                filter { eq("post_id", postId) }
            }.decodeList<PostEmoji>()
        } catch (e: Exception) { emptyList() }
    }

    // ===== APPLAUSE =====
    suspend fun toggleApplause(postId: String, userId: String) {
        try {
            val existing = client.postgrest["post_applause"].select {
                filter {
                    eq("post_id", postId)
                    eq("user_id", userId)
                }
            }.decodeSingleOrNull<PostApplause>()
            if (existing != null) {
                client.postgrest["post_applause"].delete {
                    filter {
                        eq("post_id", postId)
                        eq("user_id", userId)
                    }
                }
            } else {
                client.postgrest["post_applause"].insert(PostApplause(postId = postId, userId = userId))
            }
        } catch (e: Exception) { println("Error toggling applause: ${e.message}") }
    }

    suspend fun getApplauseCount(postId: String): Long {
        return try {
            val response = client.postgrest["post_applause"].select {
                filter { eq("post_id", postId) }
                count(io.github.jan.supabase.postgrest.query.Count.EXACT)
            }
            response.countOrNull() ?: 0L
        } catch (e: Exception) { 0L }
    }

    suspend fun getCommentsCount(postId: String): Long {
        return try {
            val response = client.postgrest["post_comments"].select {
                filter { eq("post_id", postId) }
                count(io.github.jan.supabase.postgrest.query.Count.EXACT)
            }
            response.countOrNull() ?: 0L
        } catch (e: Exception) { 0L }
    }

    // ===== REPORTS =====
    suspend fun createReport(report: PostReport) {
        try { client.postgrest["post_reports"].insert(report) } catch (e: Exception) { println("Error creating report: ${e.message}") }
    }

    // ===== SAVES =====
    suspend fun toggleSave(postId: String, userId: String) {
        try {
            val existing = client.postgrest["post_saves"].select {
                filter {
                    eq("post_id", postId)
                    eq("user_id", userId)
                }
            }.decodeSingleOrNull<PostSave>()
            if (existing != null) {
                client.postgrest["post_saves"].delete {
                    filter {
                        eq("post_id", postId)
                        eq("user_id", userId)
                    }
                }
            } else {
                client.postgrest["post_saves"].insert(PostSave(postId = postId, userId = userId))
            }
        } catch (e: Exception) { println("Error toggling save: ${e.message}") }
    }

    suspend fun fetchSavedPosts(userId: String): List<PostSave> {
        return try {
            client.postgrest["post_saves"].select(columns = Columns.ALL) {
                filter { eq("user_id", userId) }
            }.decodeList<PostSave>()
        } catch (e: Exception) { emptyList() }
    }

    // ===== CHAT =====
    suspend fun createOrGetChatRoom(user1: String, user2: String): com.nephclick.eyefield.models.ChatRoom? {
        return try {
            val existing = client.postgrest["chat_rooms"].select(columns = Columns.ALL) {
                filter {
                    or {
                        and { eq("user1_id", user1); eq("user2_id", user2) }
                        and { eq("user1_id", user2); eq("user2_id", user1) }
                    }
                }
            }.decodeList<com.nephclick.eyefield.models.ChatRoom>().firstOrNull()

            if (existing != null) return existing

            fun generateUUID(): String {
                val chars = "0123456789abcdef"
                var uuid = ""
                for (i in 0..35) {
                    if (i == 8 || i == 13 || i == 18 || i == 23) {
                        uuid += "-"
                    } else if (i == 14) {
                        uuid += "4"
                    } else if (i == 19) {
                        uuid += chars[kotlin.random.Random.nextInt(8, 12)]
                    } else {
                        uuid += chars[kotlin.random.Random.nextInt(16)]
                    }
                }
                return uuid
            }
            
            val newRoom = com.nephclick.eyefield.models.ChatRoom(
                id = generateUUID(),
                user1Id = user1,
                user2Id = user2
            )
            client.postgrest["chat_rooms"].insert(newRoom).decodeSingle<com.nephclick.eyefield.models.ChatRoom>()
        } catch (e: Exception) {
            println("Error creating chat room: ${e.message}")
            null
        }
    }

    suspend fun fetchChatRooms(userId: String): List<com.nephclick.eyefield.models.ChatRoom> {
        return try {
            client.postgrest["chat_rooms"].select(columns = Columns.ALL) {
                filter {
                    or {
                        eq("user1_id", userId)
                        eq("user2_id", userId)
                    }
                }
            }.decodeList<com.nephclick.eyefield.models.ChatRoom>().sortedByDescending { it.lastMessageTime ?: it.createdAt }
        } catch (e: Exception) {
            println("Error fetching chat rooms: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchChatMessages(roomId: String): List<com.nephclick.eyefield.models.ChatMessage> {
        return try {
            client.postgrest["chat_messages"].select(columns = Columns.ALL) {
                filter { eq("room_id", roomId) }
            }.decodeList<com.nephclick.eyefield.models.ChatMessage>().sortedBy { it.createdAt }
        } catch (e: Exception) {
            println("Error fetching messages: ${e.message}")
            emptyList()
        }
    }

    suspend fun sendMessage(message: com.nephclick.eyefield.models.ChatMessage) {
        try {
            client.postgrest["chat_messages"].insert(message)
            val update = com.nephclick.eyefield.models.ChatRoomUpdate(
                lastMessage = message.text,
                lastMessageTime = message.createdAt ?: "now()"
            )
            client.postgrest["chat_rooms"].update(update) {
                filter { eq("id", message.roomId) }
            }
        } catch (e: Exception) {
            println("Error sending message: ${e.message}")
        }
    }

    suspend fun deleteChatMessage(messageId: String) {
        try {
            client.postgrest["chat_messages"].delete { filter { eq("id", messageId) } }
        } catch (e: Exception) { println("Error deleting message: ${e.message}") }
    }

    // ===== USER POSTS =====
    suspend fun fetchUserPosts(userId: String): List<Post> {
        return try {
            client.postgrest["posts"].select(columns = Columns.ALL) {
                filter { eq("user_id", userId) }
            }.decodeList<Post>().also { cachedPosts = it }
        } catch (e: Exception) {
            println("Error fetching user posts: ${e.message}")
            emptyList()
        }
    }

    // ===== FOLLOWS =====
    suspend fun toggleFollow(followerId: String, followingId: String) {
        try {
            val existing = client.postgrest["user_follows"].select {
                filter {
                    eq("follower_id", followerId)
                    eq("following_id", followingId)
                }
            }.decodeSingleOrNull<com.nephclick.eyefield.models.UserFollow>()
            
            if (existing != null) {
                client.postgrest["user_follows"].delete {
                    filter {
                        eq("follower_id", followerId)
                        eq("following_id", followingId)
                    }
                }
                // Decrement follower count
            } else {
                client.postgrest["user_follows"].insert(com.nephclick.eyefield.models.UserFollow(followerId = followerId, followingId = followingId))
                // Increment follower count
            }
        } catch (e: Exception) {
            println("Error toggling follow: ${e.message}")
        }
    }

    suspend fun checkIsFollowing(followerId: String, followingId: String): Boolean {
        return try {
            val existing = client.postgrest["user_follows"].select {
                filter {
                    eq("follower_id", followerId)
                    eq("following_id", followingId)
                }
            }.decodeSingleOrNull<com.nephclick.eyefield.models.UserFollow>()
            existing != null
        } catch (e: Exception) {
            false
        }
    }

    suspend fun fetchFollowers(userId: String): List<Profile> {
        return try {
            val follows = client.postgrest["user_follows"].select(columns = Columns.ALL) {
                filter { eq("following_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.UserFollow>()
            
            if (follows.isEmpty()) return emptyList()
            
            client.postgrest["profiles"].select(columns = Columns.ALL) {
                filter {
                    isIn("id", follows.map { it.followerId })
                }
            }.decodeList<Profile>()
        } catch (e: Exception) {
            println("Error fetching followers: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchFollowing(userId: String): List<Profile> {
        return try {
            val follows = client.postgrest["user_follows"].select(columns = Columns.ALL) {
                filter { eq("follower_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.UserFollow>()
            
            if (follows.isEmpty()) return emptyList()
            
            client.postgrest["profiles"].select(columns = Columns.ALL) {
                filter {
                    isIn("id", follows.map { it.followingId })
                }
            }.decodeList<Profile>()
        } catch (e: Exception) {
            println("Error fetching following: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchSuggestedUsers(userId: String): List<Profile> {
        return try {
            // Fetch all follows to compute graph locally (efficient enough for small scale)
            val allFollows = client.postgrest["user_follows"].select(columns = Columns.ALL)
                .decodeList<com.nephclick.eyefield.models.UserFollow>()
                
            val myFollowers = allFollows.filter { it.followingId == userId }.map { it.followerId }.toSet()
            val myFollowing = allFollows.filter { it.followerId == userId }.map { it.followingId }.toSet()
            
            // "people that follows the people who follows the user"
            val relatedContactIds = allFollows
                .filter { myFollowers.contains(it.followingId) }
                .map { it.followerId }
                .toSet()
                
            val allProfiles = client.postgrest["profiles"].select(columns = Columns.ALL)
                .decodeList<Profile>()
                
            allProfiles.filter { it.id != userId && !myFollowing.contains(it.id) }
                .sortedByDescending { if (relatedContactIds.contains(it.id)) 1 else 0 }
        } catch (e: Exception) {
            println("Error fetching suggested users: ${e.message}")
            emptyList()
        }
    }


    // ===== CALLS =====
    fun generateChannelName(callerId: String, receiverId: String): String {
        val timestamp = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
        return "call_${callerId.take(8)}_${receiverId.take(8)}_$timestamp"
    }

    suspend fun createCallLog(log: com.nephclick.eyefield.models.CallLogInsert): com.nephclick.eyefield.models.CallLog? {
        return try {
            client.postgrest["call_logs"].insert(log) {
                select()
            }.decodeSingle<com.nephclick.eyefield.models.CallLog>()
        } catch (e: Exception) {
            println("Error creating call log: ${e.message}")
            null
        }
    }

    suspend fun updateCallLog(callLogId: String, update: com.nephclick.eyefield.models.CallLogUpdate) {
        try {
            client.postgrest["call_logs"].update(update) {
                filter { eq("id", callLogId) }
            }
        } catch (e: Exception) {
            println("Error updating call log: ${e.message}")
        }
    }

    suspend fun fetchCallLogs(userId: String): List<com.nephclick.eyefield.models.CallLog> {
        return try {
            client.postgrest["call_logs"].select(columns = Columns.ALL) {
                filter {
                    or {
                        eq("caller_id", userId)
                        eq("receiver_id", userId)
                    }
                }
            }.decodeList<com.nephclick.eyefield.models.CallLog>().sortedByDescending { it.createdAt }
        } catch (e: Exception) {
            println("Error fetching call logs: ${e.message}")
            emptyList()
        }
    }

    suspend fun fetchPendingCallsForUser(userId: String): List<com.nephclick.eyefield.models.CallLog> {
        return try {
            client.postgrest["call_logs"].select(columns = Columns.ALL) {
                filter {
                    eq("receiver_id", userId)
                    or {
                        eq("call_status", "initiated")
                        eq("call_status", "ringing")
                    }
                }
            }.decodeList<com.nephclick.eyefield.models.CallLog>().sortedByDescending { it.createdAt }
        } catch (e: Exception) {
            println("Error fetching pending calls: ${e.message}")
            emptyList()
        }
    }
    suspend fun getLiveKitToken(roomName: String, participantId: String): String? {
        return try {
            val httpClient = io.ktor.client.HttpClient()
            val tokenStr = client.auth.currentAccessTokenOrNull() ?: ""
            val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.functions.supabase.co/get-livekit-token") {
                header("Authorization", "Bearer $tokenStr")
                contentType(ContentType.Application.Json)
                setBody("""{"roomName":"$roomName","participantName":"$participantId"}""")
            }
            if (response.status.value in 200..299) {
                val jsonStr = response.bodyAsText()
                val parsed = Json.parseToJsonElement(jsonStr).jsonObject
                val token = parsed["token"]?.jsonPrimitive?.content
                token
            } else {
                println("Failed to get LiveKit token: ${response.status}")
                null
            }
        } catch (e: Exception) {
            println("Error getting LiveKit token: ${e.message}")
            null
        }
    }

    suspend fun getAgoraToken(channelName: String, userAccount: String): AgoraTokenResponse? {
        return try {
            val httpClient = io.ktor.client.HttpClient()
            val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y29sanFkdG1rZ3Jzd3d4a3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzU4NzIsImV4cCI6MjA5NzExMTg3Mn0.bMO4poe2Zs_c_zTor5gFf2BFvRIWSKF6j9OtCdFnOdo"
            val tokenStr = client.auth.currentAccessTokenOrNull() ?: anonKey
            val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.functions.supabase.co/get-agora-token") {
                header("Authorization", "Bearer $tokenStr")
                contentType(ContentType.Application.Json)
                setBody("""{"channelName":"$channelName","userAccount":"$userAccount"}""")
            }
            if (response.status.value in 200..299) {
                val jsonStr = response.bodyAsText()
                val parsed = Json.parseToJsonElement(jsonStr).jsonObject
                val token = parsed["token"]?.jsonPrimitive?.content ?: ""
                val appId = parsed["appId"]?.jsonPrimitive?.content ?: ""
                AgoraTokenResponse(token, appId)
            } else {
                println("Failed to get Agora token: ${response.status}")
                null
            }
        } catch (e: Exception) {
            println("Error getting Agora token: ${e.message}")
            null
        }
    }

    suspend fun saveFcmToken(userId: String, fcmToken: String) {
        try {
            val httpClient = io.ktor.client.HttpClient()
            val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y29sanFkdG1rZ3Jzd3d4a3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzU4NzIsImV4cCI6MjA5NzExMTg3Mn0.bMO4poe2Zs_c_zTor5gFf2BFvRIWSKF6j9OtCdFnOdo"
            val tokenStr = client.auth.currentAccessTokenOrNull() ?: anonKey
            // Upsert via REST — simpler than using the postgrest plugin with raw JSON objects
            val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.supabase.co/rest/v1/device_tokens") {
                header("Authorization", "Bearer $tokenStr")
                header("apikey", anonKey)
                header("Prefer", "resolution=merge-duplicates")
                contentType(ContentType.Application.Json)
                setBody("""{"user_id":"$userId","fcm_token":"$fcmToken","updated_at":"${kotlinx.datetime.Clock.System.now()}"}""")
            }
            println("saveFcmToken status: ${response.status}")
        } catch (e: Exception) {
            println("Error saving FCM token: ${e.message}")
        }
    }

    suspend fun sendCallNotification(
        receiverId: String,
        callerId: String,
        callerName: String,
        roomName: String,
        isVideoCall: Boolean,
        callLogId: String
    ) {
        try {
            val httpClient = io.ktor.client.HttpClient()
            val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y29sanFkdG1rZ3Jzd3d4a3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzU4NzIsImV4cCI6MjA5NzExMTg3Mn0.bMO4poe2Zs_c_zTor5gFf2BFvRIWSKF6j9OtCdFnOdo"
            val tokenStr = client.auth.currentAccessTokenOrNull() ?: anonKey
            val videoStr = isVideoCall.toString()
            val response = httpClient.post("https://fzcoljqdtmkgrswwxkyi.functions.supabase.co/send-call-notification") {
                header("Authorization", "Bearer $tokenStr")
                contentType(ContentType.Application.Json)
                setBody("""{
                    "receiverId":"$receiverId",
                    "callerId":"$callerId",
                    "callerName":"${callerName.replace("\"","")}",
                    "roomName":"$roomName",
                    "isVideoCall":$videoStr,
                    "callLogId":"$callLogId"
                }""")
            }
            println("sendCallNotification status: ${response.status}, body: ${response.bodyAsText()}")
        } catch (e: Exception) {
            println("Error sending call notification: ${e.message}")
        }
    }


    suspend fun fetchNotifications(userId: String): List<com.nephclick.eyefield.models.Notification> {
        return try {
            client.postgrest["notifications"].select {
                filter { eq("user_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.Notification>()
        } catch (e: Exception) {
            println("Error fetching notifications: ${e.message}")
            emptyList()
        }
    }

    suspend fun createUserReport(report: com.nephclick.eyefield.models.UserReport) {
        try {
            client.postgrest["user_reports"].insert(report)
        } catch(e: Exception) {
            println("Error creating user report: ${e.message}")
        }
    }


    suspend fun fetchUserReports(): List<com.nephclick.eyefield.models.UserReport> {
        return try {
            client.postgrest["user_reports"].select().decodeList<com.nephclick.eyefield.models.UserReport>()
        } catch(e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchProductReports(): List<com.nephclick.eyefield.models.ProductReport> {
        return try {
            client.postgrest["product_reports"].select().decodeList<com.nephclick.eyefield.models.ProductReport>()
        } catch(e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchPostReports(): List<com.nephclick.eyefield.models.PostReport> {
        return try {
            client.postgrest["post_reports"].select().decodeList<com.nephclick.eyefield.models.PostReport>()
        } catch(e: Exception) {
            emptyList()
        }
    }

    suspend fun createProductReport(report: com.nephclick.eyefield.models.ProductReport) {
        try {
            client.postgrest["product_reports"].insert(report)
        } catch(e: Exception) {}
    }

    suspend fun fetchAllProfiles(): List<com.nephclick.eyefield.models.Profile> {
        return try {
            client.postgrest["profiles"].select().decodeList<com.nephclick.eyefield.models.Profile>()
        } catch(e: Exception) {
            emptyList()
        }
    }

    suspend fun sendContactMessage(msg: com.nephclick.eyefield.models.ContactMessage) {
        try { client.postgrest["contact_messages"].insert(msg) } catch (e: Exception) { println("Error sending contact msg: ${e.message}") }
    }

    suspend fun updateLastSeen(userId: String) {
        try {
            client.postgrest["profiles"].update({ set("last_seen", kotlinx.datetime.Clock.System.now().toString()) }) { filter { eq("id", userId) } }
        } catch(e: Exception) {}
    }

    suspend fun updateUserStatus(userId: String, status: String) {
        try {
            client.postgrest["profiles"].update({ set("status", status) }) { filter { eq("id", userId) } }
        } catch(e: Exception) {}
    }

    suspend fun deleteProfile(userId: String) {
        try {
            client.postgrest["profiles"].delete { filter { eq("id", userId) } }
        } catch(e: Exception) {}
    }

    suspend fun createPromoCard(promoCard: com.nephclick.eyefield.models.PromoCard) {
        try {
            client.postgrest["promo_cards"].insert(promoCard)
        } catch(e: Exception) {}
    }

    suspend fun fetchMyPostReports(userId: String): List<com.nephclick.eyefield.models.PostReport> {
        return try {
            client.postgrest["post_reports"].select(columns = io.github.jan.supabase.postgrest.query.Columns.ALL) {
                filter { eq("user_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.PostReport>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchMyUserReports(userId: String): List<com.nephclick.eyefield.models.UserReport> {
        return try {
            client.postgrest["user_reports"].select(columns = io.github.jan.supabase.postgrest.query.Columns.ALL) {
                filter { eq("reporter_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.UserReport>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchMyProductReports(userId: String): List<com.nephclick.eyefield.models.ProductReport> {
        return try {
            client.postgrest["product_reports"].select(columns = io.github.jan.supabase.postgrest.query.Columns.ALL) {
                filter { eq("reporter_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.ProductReport>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun deletePostReport(reportId: String) {
        try {
            client.postgrest["post_reports"].delete { filter { eq("id", reportId) } }
        } catch (e: Exception) {}
    }

    suspend fun deleteUserReport(reportId: String) {
        try {
            client.postgrest["user_reports"].delete { filter { eq("id", reportId) } }
        } catch (e: Exception) {}
    }

    suspend fun deleteProductReport(reportId: String) {
        try {
            client.postgrest["product_reports"].delete { filter { eq("id", reportId) } }
        } catch (e: Exception) {}
    }

    suspend fun blockUser(blockerId: String, blockedId: String) {
        try {
            val blockedUser = com.nephclick.eyefield.models.BlockedUser(blockerId = blockerId, blockedId = blockedId)
            client.postgrest["blocked_users"].insert(blockedUser)
        } catch (e: Exception) {}
    }
    
    suspend fun unblockUser(blockerId: String, blockedId: String) {
        try {
            client.postgrest["blocked_users"].delete { 
                filter { 
                    eq("blocker_id", blockerId) 
                    eq("blocked_id", blockedId)
                } 
            }
        } catch (e: Exception) {}
    }

    suspend fun fetchBlockedUsers(userId: String): List<com.nephclick.eyefield.models.Profile> {
        return try {
            val blocks = client.postgrest["blocked_users"].select(columns = io.github.jan.supabase.postgrest.query.Columns.ALL) {
                filter { eq("blocker_id", userId) }
            }.decodeList<com.nephclick.eyefield.models.BlockedUser>()
            
            val blockedIds = blocks.map { it.blockedId }
            if (blockedIds.isEmpty()) return emptyList()
            
            client.postgrest["profiles"].select(columns = io.github.jan.supabase.postgrest.query.Columns.ALL) {
                filter { isIn("id", blockedIds) }
            }.decodeList<com.nephclick.eyefield.models.Profile>()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun fetchApiKeys(): com.nephclick.eyefield.models.ApiKeys {
        return try {
            val keys = client.postgrest["api_keys"].select {
                filter { eq("id", 1) }
            }.decodeList<com.nephclick.eyefield.models.ApiKeys>().firstOrNull()
            keys ?: com.nephclick.eyefield.models.ApiKeys(id = 1, openrouterKey = null, googleApiKey = null)
        } catch (e: Exception) {
            println("Error fetching api keys: ${e.message}")
            com.nephclick.eyefield.models.ApiKeys(id = 1, openrouterKey = null, googleApiKey = null)
        }
    }

    suspend fun updateApiKeys(apiKeys: com.nephclick.eyefield.models.ApiKeys) {
        try {
            client.postgrest["api_keys"].upsert(apiKeys)
        } catch (e: Exception) {
            println("Error updating api keys: ${e.message}")
        }
    }
}



