# Real-Time Order Tracking System with HERE Maps Integration

## Overview

This document describes the comprehensive real-time order tracking system built for Siraha Bazaar, featuring HERE Maps integration, WebSocket communication, and push notifications for seamless delivery tracking.

## System Architecture

### Core Components

1. **HERE Maps Service** (`server/services/hereMapService.ts`)
   - Route calculation and optimization
   - Traffic information integration
   - Polyline decoding for map visualization
   - ETA calculations with real-time traffic
   - Google Maps fallback for navigation

2. **Real-Time Tracking Service** (`server/services/realTimeTrackingService.ts`)
   - WebSocket connection management
   - Live location updates
   - Delivery status management
   - Real-time notifications to stakeholders

3. **Push Notification Service** (`server/services/pushNotificationService.ts`)
   - Cross-platform notification delivery
   - Token management for devices
   - Contextual delivery notifications

4. **Frontend Components**
   - `RealTimeTrackingMap.tsx` - Interactive HERE Maps component
   - `DeliveryTrackingDashboard.tsx` - Delivery partner interface
   - Enhanced `OrderTracking.tsx` - Customer tracking interface

## Database Schema

### New Tables Added

```sql
-- Real-time location tracking
CREATE TABLE delivery_location_tracking (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL,
  delivery_partner_id INTEGER NOT NULL,
  current_latitude DECIMAL(10, 8) NOT NULL,
  current_longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(8, 2),
  accuracy DECIMAL(8, 2),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Route information with HERE Maps data
CREATE TABLE delivery_routes (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  delivery_latitude DECIMAL(10, 8) NOT NULL,
  delivery_longitude DECIMAL(11, 8) NOT NULL,
  route_geometry TEXT,
  distance_meters INTEGER NOT NULL,
  estimated_duration_seconds INTEGER NOT NULL,
  actual_duration_seconds INTEGER,
  traffic_info TEXT,
  here_route_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- WebSocket session management
CREATE TABLE websocket_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL,
  connected_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Detailed delivery status history
CREATE TABLE delivery_status_history (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER,
  metadata TEXT
);
```

## API Endpoints

### Real-Time Tracking APIs

```
POST /api/tracking/location
- Updates delivery partner's current location
- Triggers real-time notifications to stakeholders

PATCH /api/tracking/status/:deliveryId
- Updates delivery status with location data
- Records status history

GET /api/tracking/:deliveryId
- Retrieves complete tracking data for a delivery
- Includes current location, route, and status history

POST /api/tracking/route/:deliveryId
- Calculates and stores optimized route using HERE Maps
- Updates ETA based on traffic conditions
```

### HERE Maps Integration

```
POST /api/maps/route
- Calculates route between two points
- Returns route geometry, distance, duration
- Includes Google Maps fallback link
```

## WebSocket Communication

### Connection Protocol

1. **Authentication**
```javascript
ws.send(JSON.stringify({
  type: 'auth',
  userId: 123,
  userType: 'delivery_partner', // or 'customer', 'shopkeeper'
  token: 'auth-token'
}));
```

2. **Location Updates**
```javascript
ws.send(JSON.stringify({
  type: 'location_update',
  payload: {
    deliveryId: 456,
    deliveryPartnerId: 123,
    latitude: 26.6593,
    longitude: 86.1924,
    heading: 45.5,
    speed: 25.3,
    accuracy: 5.0
  }
}));
```

3. **Status Updates**
```javascript
ws.send(JSON.stringify({
  type: 'status_update',
  payload: {
    deliveryId: 456,
    status: 'picked_up',
    description: 'Package collected from store',
    latitude: 26.6593,
    longitude: 86.1924
  }
}));
```

### Real-Time Notifications

The system broadcasts the following notification types:

- `location_update` - Live location changes
- `status_update` - Delivery status changes
- `route_update` - Route recalculations
- `eta_update` - Updated arrival estimates

## HERE Maps Features

### API Integration

```typescript
// Route calculation
const route = await hereMapService.calculateRoute({
  origin: { lat: 26.6593, lng: 86.1924 },
  destination: { lat: 26.6600, lng: 86.1930 }
});

// ETA calculation with traffic
const eta = hereMapService.calculateETA(route, currentLocation);

// Google Maps navigation fallback
const googleMapsUrl = hereMapService.generateGoogleMapsLink(origin, destination);
```

### Map Visualization

- Interactive HERE Maps with custom markers
- Real-time route display with traffic information
- Polyline decoding for smooth route visualization
- Automatic map centering on delivery location

## Delivery Partner Features

### Live Tracking Dashboard

1. **Location Tracking**
   - GPS location updates every 10 seconds
   - Heading and speed monitoring
   - Location accuracy reporting

2. **Status Management**
   - One-click status updates
   - Automated status flow
   - Location-aware status changes

3. **Navigation Integration**
   - HERE Maps route display
   - Google Maps deep linking
   - Turn-by-turn navigation support

### Status Flow

```
assigned → en_route_pickup → picked_up → en_route_delivery → delivered
```

Each status change triggers:
- Database update with location
- Real-time WebSocket broadcast
- Push notifications to stakeholders

## Customer Experience

### Real-Time Tracking

1. **Live Map View**
   - Delivery partner's current location
   - Estimated route visualization
   - Real-time ETA updates

2. **Status Updates**
   - Push notifications for status changes
   - In-app status history
   - Contact information for delivery partner

3. **Communication**
   - Direct calling to delivery partner
   - SMS notifications (future enhancement)
   - In-app messaging (future enhancement)

## Configuration Requirements

### Environment Variables

```bash
# HERE Maps API Key (optional - falls back to Google Maps)
HERE_API_KEY=your_here_maps_api_key

# Database connection
DATABASE_URL=postgresql://user:password@host:port/database

# Push notification keys (for production)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Frontend Environment

```bash
# HERE Maps API Key for frontend
VITE_HERE_API_KEY=your_here_maps_api_key
```

## Performance Optimizations

### Real-Time Updates

- Location updates throttled to prevent spam
- WebSocket connection pooling
- Automatic cleanup of inactive sessions
- Database indexing on tracking tables

### Caching Strategy

- Route caching for frequently used paths
- Traffic data caching (5-minute TTL)
- WebSocket session state in memory
- Push token cleanup automation

## Security Considerations

### Authentication

- WebSocket authentication with JWT tokens
- API endpoint protection
- User role-based access control
- Session management and cleanup

### Data Privacy

- Location data encryption at rest
- GDPR-compliant data retention
- User consent for location tracking
- Anonymized analytics data

## Error Handling

### Graceful Degradation

1. **HERE Maps Unavailable**
   - Fallback to Google Maps links
   - Basic distance calculations
   - Manual ETA input option

2. **WebSocket Connection Lost**
   - Automatic reconnection attempts
   - Offline status indicators
   - Cached data synchronization

3. **GPS/Location Issues**
   - Manual location input
   - Last known location display
   - Accuracy warnings

## Monitoring and Analytics

### Key Metrics

- Average delivery time per zone
- Location accuracy statistics
- WebSocket connection health
- API response times
- User engagement with tracking features

### Logging

- Location update frequency
- Status change events
- Error rates and types
- Performance bottlenecks

## Future Enhancements

### Planned Features

1. **Advanced Route Optimization**
   - Multiple delivery batching
   - Traffic-aware rerouting
   - Delivery time slot optimization

2. **Enhanced Communication**
   - In-app voice calls
   - Automated SMS updates
   - Multi-language support

3. **AI-Powered Features**
   - Delivery time prediction
   - Route learning algorithms
   - Anomaly detection

4. **Integration Expansions**
   - Multiple map providers
   - Weather condition integration
   - Public transport route options

## Testing Strategy

### Unit Tests
- Service layer testing
- WebSocket connection handling
- Map integration functions

### Integration Tests
- End-to-end delivery flow
- Real-time notification delivery
- Cross-platform compatibility

### Load Testing
- WebSocket connection limits
- Database performance under load
- API response times at scale

## Deployment Notes

### Production Considerations

1. **Database Optimization**
   - Proper indexing on location columns
   - Partition large tracking tables
   - Regular cleanup of old data

2. **Scalability**
   - Load balancer configuration
   - WebSocket clustering
   - Redis for session management

3. **Monitoring**
   - Application performance monitoring
   - Real-time alerting system
   - User experience tracking

This real-time tracking system provides a comprehensive solution for modern delivery management, ensuring transparency, efficiency, and excellent user experience across all stakeholders in the delivery process.