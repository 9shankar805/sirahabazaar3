package com.sirahabazaar.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    
    private static final String TAG = "MyFirebaseMsgService";
    private static final String CHANNEL_ID = "siraha_bazaar";
    
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // Handle FCM messages here
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
        }
        
        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
            sendNotification(remoteMessage.getNotification().getTitle(), 
                           remoteMessage.getNotification().getBody(),
                           remoteMessage.getData());
        }
    }
    
    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
        
        // Send token to your server
        sendRegistrationToServer(token);
    }
    
    private void sendRegistrationToServer(String token) {
        // Send token to your Siraha Bazaar server
        // You can implement this by calling your web API
        Log.d(TAG, "Sending token to server: " + token);
    }
    
    private void sendNotification(String title, String messageBody, java.util.Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        // Add data to intent if available
        if (data != null) {
            for (java.util.Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }
        
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);
        
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_notification)
                        .setContentTitle(title != null ? title : "Siraha Bazaar")
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setContentIntent(pendingIntent)
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setVibrate(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
        
        // Add action buttons based on notification type
        String notificationType = data != null ? data.get("type") : null;
        if ("order_update".equals(notificationType)) {
            Intent viewOrderIntent = new Intent(this, MainActivity.class);
            viewOrderIntent.putExtra("action", "view_order");
            if (data.containsKey("orderId")) {
                viewOrderIntent.putExtra("orderId", data.get("orderId"));
            }
            PendingIntent viewOrderPendingIntent = PendingIntent.getActivity(this, 1, viewOrderIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            notificationBuilder.addAction(R.drawable.ic_view, "View Order", viewOrderPendingIntent);
        }
        
        if ("delivery_assignment".equals(notificationType)) {
            Intent acceptIntent = new Intent(this, MainActivity.class);
            acceptIntent.putExtra("action", "accept_delivery");
            if (data.containsKey("orderId")) {
                acceptIntent.putExtra("orderId", data.get("orderId"));
            }
            PendingIntent acceptPendingIntent = PendingIntent.getActivity(this, 2, acceptIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            notificationBuilder.addAction(R.drawable.ic_accept, "Accept", acceptPendingIntent);
        }
        
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        // Since android Oreo notification channel is needed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Siraha Bazaar Notifications",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Notifications for orders, deliveries and updates");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{100, 200, 300, 400, 500, 400, 300, 200, 400});
            notificationManager.createNotificationChannel(channel);
        }
        
        notificationManager.notify(0, notificationBuilder.build());
    }
}