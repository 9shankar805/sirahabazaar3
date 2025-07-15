package com.siraha.myweb;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.util.Log;
import android.content.SharedPreferences;

public class AndroidBridge {
    private static final String TAG = "AndroidBridge";
    private Context context;
    private SharedPreferences prefs;

    public AndroidBridge(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences("SirahaPrefs", Context.MODE_PRIVATE);
    }

    @JavascriptInterface
    public void setFirebaseToken(String token) {
        Log.d(TAG, "Received Firebase token from app: " + token);
        
        // Store token locally
        prefs.edit().putString("firebase_token", token).apply();
        
        // Here you can send the token to your server
        // This would typically be done via HTTP request to your backend
        sendTokenToServer(token);
    }

    @JavascriptInterface
    public String getFirebaseToken() {
        return prefs.getString("firebase_token", "");
    }

    @JavascriptInterface
    public void showToast(String message) {
        android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public boolean isAndroidApp() {
        return true;
    }

    @JavascriptInterface
    public void logMessage(String message) {
        Log.d(TAG, "WebView Log: " + message);
    }

    private void sendTokenToServer(String token) {
        // Send token to your Siraha Bazaar backend
        // This should match your web app's token registration endpoint
        new Thread(() -> {
            try {
                // Example HTTP request to register the token
                // You'll need to replace this with your actual server URL
                String serverUrl = "https://your-replit-url.replit.app/api/device-token";
                
                // Create HTTP request with token
                // Implementation depends on your preferred HTTP library
                Log.d(TAG, "Token would be sent to: " + serverUrl);
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to send token to server", e);
            }
        }).start();
    }
}