# Firebase Notification Setup for Siraha Bazaar Android App

## Overview
Your website already has Firebase Cloud Messaging (FCM) implemented. This guide shows you how to wrap it in an Android app and enable push notifications to the device's notification center.

## Your Current Firebase Configuration
```javascript
// Already configured in your project
const firebaseConfig = {
  apiKey: "AIzaSyCUDoNuJ5hUKzwnZJe8hp5Rbt_Ja1MCDpw",
  authDomain: "sirahabazaar-bc62f.firebaseapp.com",
  projectId: "sirahabazaar-bc62f",
  storageBucket: "sirahabazaar-bc62f.firebasestorage.app",
  messagingSenderId: "898667729116",
  appId: "1:898667729116:web:bf417c13c2651c0bc26419",
  measurementId: "G-SK3VBMNR5N"
};
```

## Android Studio Setup Steps

### 1. Create New Android Project
1. Open Android Studio
2. Create new project: "Empty Activity"
3. Package name: `com.sirahabazaar.app`
4. Language: Java
5. API level: 21 or higher

### 2. Add Firebase to Your Android Project
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "sirahabazaar-bc62f"
3. Click "Add app" → Android
4. Package name: `com.sirahabazaar.app`
5. Download `google-services.json` file
6. Place it in `app/` folder of your Android project

### 3. Add Dependencies
In `app/build.gradle`:
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'

android {
    compileSdkVersion 34
    buildToolsVersion "30.0.3"

    defaultConfig {
        applicationId "com.sirahabazaar.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    
    // Firebase dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
    
    // WebView support
    implementation 'androidx.webkit:webkit:1.8.0'
    implementation 'androidx.core:core:1.12.0'
}
```

In `build.gradle` (Project level):
```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.4'
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 4. Copy Android Files
Copy these files to your Android project:

**MainActivity.java** → `app/src/main/java/com/sirahabazaar/app/MainActivity.java`
**MyFirebaseMessagingService.java** → `app/src/main/java/com/sirahabazaar/app/MyFirebaseMessagingService.java`
**activity_main.xml** → `app/src/main/res/layout/activity_main.xml`
**AndroidManifest.xml** → `app/src/main/AndroidManifest.xml`

### 5. Update MainActivity.java
Replace the URL in MainActivity.java with your Replit URL:
```java
// Replace this line in setupWebView()
webView.loadUrl("https://your-replit-project-url.replit.app");
```

### 6. Add Icons and Resources
Create these drawable resources in `app/src/main/res/drawable/`:

**ic_notification.xml**:
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="?attr/colorOnPrimary">
  <path
      android:fillColor="@android:color/white"
      android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
```

### 7. Test Your Setup

1. **Build and run** your Android app
2. **Test notifications** by visiting your website in the app
3. **Check logs** in Android Studio for FCM token registration
4. **Send test notification** from Firebase Console

## How It Works

### Web to Android Communication
1. Your website's JavaScript detects if it's running in the Android WebView
2. Firebase generates an FCM token for the Android app
3. Token is sent to your server via the `/api/firebase-token` endpoint
4. Notifications sent from your server reach the Android notification center

### Notification Flow
```
Website Order → Server API → Firebase Cloud Messaging → Android Notification Center
```

### Key Features Enabled
- ✅ Order status notifications
- ✅ Delivery partner assignments
- ✅ Payment confirmations
- ✅ Store approval updates
- ✅ Real-time delivery tracking alerts
- ✅ Promotional notifications

## Testing Notifications

### From Firebase Console
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Target: Single device
4. FCM registration token: (copy from Android Studio logs)

### From Your Website
Visit any page in the Android app and:
1. Place an order
2. Update order status
3. Assign delivery partner
4. Complete delivery

## Troubleshooting

### Common Issues
1. **Notifications not appearing**: Check AndroidManifest.xml permissions
2. **Token not generated**: Verify google-services.json is in correct location
3. **WebView not loading**: Check internet permissions and URL
4. **Build errors**: Ensure all dependencies are correctly added

### Debug Logs
Check Android Studio Logcat for:
- FCM token generation
- Notification reception
- WebView JavaScript errors
- Network connectivity

## Your Website Integration
Your website already includes:
- ✅ Firebase service worker for background notifications
- ✅ Android bridge for token communication
- ✅ API endpoint for token registration
- ✅ Notification service for all user types

The Android app will automatically work with your existing notification system once properly configured.