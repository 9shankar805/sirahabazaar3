package com.siraha.myweb;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.util.Log;

public class WebAppInterface {
    Context mContext;
    private static final String TAG = "WebAppInterface";

    public WebAppInterface(Context c) {
        mContext = c;
    }

    @JavascriptInterface
    public void showToast(String toast) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void registerFCMToken(String token, int userId) {
        Log.d(TAG, "Registering FCM token for user " + userId + ": " + token);
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        return "Android Device";
    }

    @JavascriptInterface
    public void logMessage(String message) {
        Log.d(TAG, "Web message: " + message);
    }
}