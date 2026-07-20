package com.nephclick.eyefield

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform