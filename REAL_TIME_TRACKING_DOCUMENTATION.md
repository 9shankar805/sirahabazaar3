# Real-Time Order Tracking System

## Overview
A comprehensive real-time order tracking system built using HERE Maps API, WebSocket communication, and PostgreSQL database. The system provides live delivery tracking with multi-role functionality for customers, shopkeepers, and delivery partners.

## Architecture

### Backend Components
- **HERE Maps Service** (`server/hereMapService.ts`)
  - Route calculation and optimization
  - Distance and ETA estimation
  - Polyline encoding/decoding
  - Geocoding and navigation

- **Tracking Service** (`server/trackingService.ts`)
  - Real-time location management
  - Route initialization and updates
  - Status history tracking
  - Database operations for tracking data

- **WebSocket Service** (`server/websocketService.ts`)
  - Real-time communication
  - Session management
  - Multi-user notifications
  - Live location broadcasting

- **Database Schema** (`shared/schema.ts`)
  - Deliveries table with status tracking
  - Location tracking with GPS coordinates
  - Route information with HERE Maps integration
  - Status history with timestamps
  - WebSocket session management

### Frontend Components
- **DeliveryTrackingMap** (`client/src/components/tracking/DeliveryTrackingMap.tsx`)
  - Interactive HERE Maps integration
  - Real-time location updates
  - Route visualization with polylines
  - Multi-role view support

- **DeliveryPartnerDashboard** (`client/src/components/tracking/DeliveryPartnerDashboard.tsx`)
  - Partner-specific interface
  - Live location sharing controls
  - Status update actions
  - Order management

- **TrackingDemo** (`client/src/pages/TrackingDemo.tsx`)
  - Comprehensive demonstration interface
  - Multi-tab functionality
  - System overview and analytics
  - Demo data creation and simulation

## Key Features

### 1. Real-Time Location Tracking
- GPS-based location updates every 5 seconds
- High-accuracy positioning with fallback options
- Speed and heading information
- Location history with timestamps

### 2. HERE Maps Integration
- Professional-grade mapping and routing
- Real-time traffic consideration
- Polyline route visualization
- Distance and duration calculations
- Geocoding for address resolution

### 3. Multi-Role Support
- **Customers**: Track order delivery progress
- **Shopkeepers**: Monitor pickup and delivery status
- **Delivery Partners**: Navigate routes and update status

### 4. WebSocket Real-Time Communication
- Instant status updates across all connected clients
- Live location broadcasting
- Session management with automatic reconnection
- Role-based message filtering

### 5. Comprehensive Status Management
- Order assignment to delivery partners
- En route to pickup location
- Order picked up from store
- En route to delivery address
- Order delivered confirmation
- Detailed status history with timestamps

## API Endpoints

### Tracking APIs
- `POST /api/tracking/initialize/:deliveryId` - Initialize tracking for delivery
- `POST /api/tracking/location` - Update delivery partner location
- `POST /api/tracking/status` - Update delivery status
- `GET /api/tracking/:deliveryId` - Get tracking information
- `GET /api/tracking/partner/:partnerId/deliveries` - Get partner's deliveries

### Delivery Management
- `GET /api/deliveries` - List all deliveries
- `POST /api/deliveries` - Create new delivery
- `PUT /api/deliveries/:id/status` - Update delivery status
- `GET /api/delivery-partners` - List delivery partners

### HERE Maps Integration
- `POST /api/tracking/route` - Calculate route between points
- `GET /api/tracking/navigation/:deliveryId` - Get navigation instructions

## Database Tables

### Core Tables
- `deliveries`: Main delivery records with status and addresses
- `delivery_location_tracking`: Real-time GPS coordinates
- `delivery_routes`: HERE Maps route information
- `delivery_status_history`: Complete status change log
- `websocket_sessions`: Active WebSocket connections

### Key Relationships
- Deliveries linked to orders and delivery partners
- Location tracking tied to specific deliveries
- Routes connected to deliveries with HERE Maps data
- Status history maintaining complete audit trail

## WebSocket Events

### Client to Server
- `auth`: Authenticate user session
- `location_update`: Send GPS coordinates
- `status_change`: Update delivery status

### Server to Client
- `location_updated`: Broadcast location changes
- `status_updated`: Notify status changes
- `new_delivery_assignment`: Alert about new assignments
- `delivery_completed`: Confirm completion

## Environment Variables
- `HERE_API_KEY`: HERE Maps API key for routing and mapping
- `DATABASE_URL`: PostgreSQL connection string

## Usage Examples

### Initialize Tracking
```javascript
const response = await fetch(`/api/tracking/initialize/${deliveryId}`, {
  method: 'POST'
});
```

### Update Location
```javascript
await fetch('/api/tracking/location', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliveryId: 123,
    latitude: 26.4499,
    longitude: 80.3319
  })
});
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.send(JSON.stringify({
  type: 'auth',
  userId: partnerId,
  userType: 'delivery_partner'
}));
```

## Demo Access
Visit `/tracking-demo` to access the comprehensive demonstration interface with:
- System overview and status
- Live tracking simulation
- Partner dashboard preview
- Admin management panel

## Technical Specifications

### Performance
- Real-time updates with minimal latency
- Efficient database queries with indexing
- Optimized WebSocket connection management
- HERE Maps API rate limiting compliance

### Security
- User authentication for all tracking operations
- Role-based access control
- Secure WebSocket connections
- Input validation and sanitization

### Scalability
- Horizontal scaling support
- Database connection pooling
- WebSocket session clustering capability
- HERE Maps API optimization

## Troubleshooting

### Common Issues
1. **Location not updating**: Check GPS permissions and network connectivity
2. **Map not loading**: Verify HERE_API_KEY is properly configured
3. **WebSocket disconnections**: Automatic reconnection with exponential backoff
4. **Route calculation failures**: Fallback to basic distance calculation

### Monitoring
- WebSocket connection status indicators
- API response time monitoring
- Database query performance tracking
- HERE Maps API usage analytics

## Future Enhancements
- Push notifications for mobile devices
- Advanced route optimization algorithms
- Predictive delivery time estimates
- Customer communication features
- Analytics and reporting dashboard