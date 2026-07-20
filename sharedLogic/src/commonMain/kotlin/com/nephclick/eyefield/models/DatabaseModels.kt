package com.nephclick.eyefield.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName
import com.nephclick.eyefield.utils.PlatformSerializable

@Serializable
data class Profile(
    val id: String,
    val email: String,
    @SerialName("full_name") val fullName: String? = null,
    val username: String? = null,
    val bio: String? = null,
    @SerialName("date_of_birth") val dateOfBirth: String? = null,
    val country: String? = null,
    @SerialName("phone_number") val phoneNumber: String? = null,
    @SerialName("city_address") val cityAddress: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("banner_url") val bannerUrl: String? = null,
    val status: String = "active",
    @SerialName("onboarding_completed") val onboardingCompleted: Boolean = false,
    @SerialName("followers_count") val followersCount: Int = 0,
    @SerialName("following_count") val followingCount: Int = 0,
    @SerialName("last_seen") val lastSeen: String? = null
) : PlatformSerializable

/**
 * Returns the best available display name for this profile.
 * Priority: fullName → username → email prefix → "User"
 */
fun Profile.displayName(): String =
    fullName?.takeIf { it.isNotBlank() }
    ?: username?.takeIf { it.isNotBlank() }
    ?: email.substringBefore("@").takeIf { it.isNotBlank() }
    ?: "User"

@Serializable
data class Business(
    @SerialName("user_id") val userId: String,
    @SerialName("business_name") val businessName: String,
    val category: String? = null,
    @SerialName("website_url") val websiteUrl: String? = null,
    @SerialName("business_address") val businessAddress: String? = null
) : PlatformSerializable

@Serializable
data class PromotionalCard(
    val id: String = "",
    val title: String,
    @SerialName("image_url") val imageUrl: String,
    val link: String? = null,
    val active: Boolean = true
) : PlatformSerializable

@Serializable
data class Product(
    val id: String = "",
    @SerialName("seller_id") val sellerId: String,
    val name: String,
    val description: String? = null,
    @SerialName("regular_price") val regularPrice: Double? = null,
    @SerialName("current_price") val currentPrice: Double,
    val currency: String = "UGX",
    @SerialName("media_urls") val mediaUrls: List<String> = emptyList(),
    @SerialName("is_limited_edition") val isLimitedEdition: Boolean = false,
    val deadline: String? = null,
    @SerialName("main_category") val mainCategory: String? = null,
    @SerialName("sub_category") val subCategory: String? = null,
    @SerialName("available_colors") val availableColors: List<String> = emptyList(),
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("likes_count") val likesCount: Int = 0,
    @SerialName("rating_avg") val ratingAvg: Double = 0.0
) : PlatformSerializable

@Serializable
data class ProductLike(
    @SerialName("product_id") val productId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class ProductReview(
    val id: String = "",
    @SerialName("product_id") val productId: String,
    @SerialName("user_id") val userId: String,
    val rating: Int,
    @SerialName("review_text") val reviewText: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class KopeCompany(
    val id: String = "",
    @SerialName("user_id") val userId: String,
    val country: String? = null,
    @SerialName("company_name") val companyName: String,
    val description: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class KopeIndividual(
    val id: String = "",
    @SerialName("user_id") val userId: String,
    val country: String? = null,
    @SerialName("full_name") val fullName: String,
    val description: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class MediaItem(
    val url: String,
    val type: String, // "image" or "video"
    @SerialName("aspect_ratio") val aspectRatio: Float = 1f
) : PlatformSerializable

@Serializable
data class Pulse(
    val id: String = "",
    @SerialName("user_id") val userId: String,
    @SerialName("media_url") val mediaUrl: String,
    @SerialName("media_type") val mediaType: String, // "image" or "video"
    @SerialName("link_url") val linkUrl: String? = null,
    val caption: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null
) : PlatformSerializable

@Serializable
data class Post(
    val id: String = "",
    @SerialName("user_id") val userId: String,
    val content: String? = null,
    @SerialName("media_urls") val mediaUrls: List<MediaItem> = emptyList(),
    val location: String? = null,
    @SerialName("link_url") val linkUrl: String? = null,
    val hashtags: List<String> = emptyList(),
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("comments_count") val commentsCount: Int = 0,
    @SerialName("emojis_count") val emojisCount: Int = 0,
    @SerialName("applause_count") val applauseCount: Int = 0
) : PlatformSerializable

@Serializable
data class PostComment(
    val id: String = "",
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    val text: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class PostEmoji(
    val id: String = "",
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    val emoji: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class PostApplause(
    val id: String = "",
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class PostReport(
    val id: String = "",
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    val reason: String,
    @SerialName("custom_reason") val customReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class PostSave(
    val id: String = "",
    @SerialName("post_id") val postId: String,
    @SerialName("user_id") val userId: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class ChatRoom(
    val id: String = "",
    @SerialName("user1_id") val user1Id: String,
    @SerialName("user2_id") val user2Id: String,
    @SerialName("last_message") val lastMessage: String? = null,
    @SerialName("last_message_time") val lastMessageTime: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class ChatRoomUpdate(
    @SerialName("last_message") val lastMessage: String,
    @SerialName("last_message_time") val lastMessageTime: String
)

@Serializable
data class ChatMessage(
    val id: String = "",
    @SerialName("room_id") val roomId: String,
    @SerialName("sender_id") val senderId: String,
    val text: String,
    @SerialName("media_url") val mediaUrl: String? = null,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable


@Serializable
data class UserFollow(
    val id: String = "",
    @SerialName("follower_id") val followerId: String,
    @SerialName("following_id") val followingId: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class CallLog(
    val id: String = "",
    @SerialName("caller_id") val callerId: String,
    @SerialName("receiver_id") val receiverId: String,
    @SerialName("call_type") val callType: String, // "voice" or "video"
    @SerialName("call_status") val callStatus: String = "initiated", // "initiated", "ringing", "accepted", "missed", "declined", "ended"
    @SerialName("duration_seconds") val durationSeconds: Int? = null,
    @SerialName("channel_name") val channelName: String,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("started_at") val startedAt: String? = null,
    @SerialName("ended_at") val endedAt: String? = null
) : PlatformSerializable

@Serializable
data class CallLogInsert(
    @SerialName("caller_id") val callerId: String,
    @SerialName("receiver_id") val receiverId: String,
    @SerialName("call_type") val callType: String,
    @SerialName("call_status") val callStatus: String,
    @SerialName("channel_name") val channelName: String
) : PlatformSerializable

@Serializable
data class CallLogUpdate(
    @SerialName("call_status") val callStatus: String,
    @SerialName("duration_seconds") val durationSeconds: Int? = null,
    @SerialName("started_at") val startedAt: String? = null,
    @SerialName("ended_at") val endedAt: String? = null
)


@Serializable
data class Notification(
    val id: String = "",
    @SerialName("user_id") val userId: String,
    val title: String,
    val message: String,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class UserReport(
    val id: String = "",
    @SerialName("reporter_id") val reporterId: String,
    @SerialName("reported_user_id") val reportedUserId: String,
    val reason: String,
    @SerialName("custom_reason") val customReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class PromoCard(
    val id: String = "",
    @SerialName("image_url") val imageUrl: String,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("external_url") val externalUrl: String? = null,
    val country: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class ProductReport(
    val id: String = "",
    @SerialName("reporter_id") val reporterId: String,
    @SerialName("product_id") val productId: String,
    val reason: String,
    @SerialName("custom_reason") val customReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class BlockedUser(
    @SerialName("blocker_id") val blockerId: String,
    @SerialName("blocked_id") val blockedId: String,
    @SerialName("created_at") val createdAt: String? = null
) : PlatformSerializable

@Serializable
data class AgoraTokenResponse(
    val token: String,
    val appId: String
) : PlatformSerializable
