import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    id("com.google.gms.google-services")
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_11
    }
}
dependencies {
    implementation(projects.sharedUI)
    implementation(projects.sharedLogic)
    implementation(libs.supabase.auth)

    implementation(libs.androidx.activity.compose)

    implementation(libs.compose.uiToolingPreview)
    debugImplementation(libs.compose.uiTooling)
    // Agora SDK
    implementation(libs.agora.rtc)
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    
    // Jetpack Compose
    implementation(libs.compose.runtime)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui)
    implementation("androidx.compose.material:material-icons-extended:1.6.0")

    // Firebase SDKs
    implementation(platform("com.google.firebase:firebase-bom:34.14.0"))
    implementation("com.google.firebase:firebase-analytics")
    implementation("com.google.firebase:firebase-messaging")
}

android {
    namespace = "com.nephclick.eyefield"
    compileSdk = libs.versions.android.compileSdk.get().toInt()
    ndkVersion = "26.1.10909125"

    signingConfigs {
        create("release") {
            // Codemagic sets CM_KEYSTORE_PATH, CM_KEYSTORE_PASSWORD, CM_KEY_ALIAS, CM_KEY_PASSWORD
            // via its android_signing integration. Local builds fall back to the in-repo keystore.
            storeFile   = file(System.getenv("CM_KEYSTORE_PATH") ?: "release-key.jks")
            storePassword = System.getenv("CM_KEYSTORE_PASSWORD") ?: "eyefield123"
            keyAlias      = System.getenv("CM_KEY_ALIAS")          ?: "upload"
            keyPassword   = System.getenv("CM_KEY_PASSWORD")        ?: "eyefield123"
        }
    }


    defaultConfig {
        applicationId = "com.nephclick.eyefield"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 18
        versionName = "1.0.18"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
        jniLibs {
            useLegacyPackaging = false
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
            ndk {
                debugSymbolLevel = "FULL"
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
    }
}

tasks.register<Zip>("packageReleaseNativeDebugSymbols") {
    dependsOn("mergeReleaseNativeLibs")
    archiveFileName.set("native-debug-symbols.zip")
    destinationDirectory.set(file("${layout.buildDirectory.get()}/outputs/symbols"))
    from("${layout.buildDirectory.get()}/intermediates/merged_native_libs/release/mergeReleaseNativeLibs/out/lib") {
        include("**/*.so")
    }
}

tasks.matching { it.name == "bundleRelease" }.configureEach {
    finalizedBy("packageReleaseNativeDebugSymbols")
}

