# Siraha Bazaar - Multi-Vendor E-commerce Platform

## Overview

Siraha Bazaar is a comprehensive multi-vendor e-commerce marketplace built with modern web technologies. The platform enables multiple vendors to sell products through a unified marketplace while providing customers with a seamless shopping experience. The system includes real-time order tracking, delivery management, and comprehensive admin controls.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS for responsive design
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **Maps Integration**: HERE Maps API for location services and delivery tracking

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for API endpoints
- **Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket for live tracking and notifications
- **Authentication**: JWT-based authentication with bcrypt password hashing

### Database Design
- **Primary Database**: PostgreSQL with comprehensive schema
- **Migration System**: Drizzle Kit for schema migrations
- **Connection Pooling**: pg Pool for efficient database connections

## Key Components

### User Management System
- **Multi-role Support**: Customers, shopkeepers, delivery partners, and administrators
- **User Authentication**: Secure registration and login with email verification
- **Role-based Access Control**: Different permissions for each user type
- **User Approval Workflow**: Admin approval required for vendor accounts

### Store Management
- **Multi-vendor Support**: Each shopkeeper can manage their own store
- **Store Analytics**: Comprehensive analytics for store performance
- **Inventory Management**: Stock tracking with automated alerts
- **Product Catalog**: Rich product information with images and categories

### Order Processing System
- **Shopping Cart**: Persistent cart across sessions
- **Order Placement**: Multi-vendor order support with automatic splitting
- **Order Tracking**: Real-time status updates from placement to delivery
- **Payment Integration**: Multiple payment method support

### Real-Time Delivery Tracking
- **HERE Maps Integration**: Route calculation and optimization
- **Live Location Tracking**: Real-time GPS tracking of delivery partners
- **WebSocket Communication**: Live updates to customers and vendors
- **ETA Calculations**: Dynamic delivery time estimates based on traffic

### Admin Dashboard
- **User Management**: Approve/reject vendor applications
- **Order Oversight**: Monitor all orders across the platform
- **Analytics**: Platform-wide performance metrics
- **System Configuration**: Delivery zones, fees, and platform settings

## Data Flow

### Order Processing Flow
1. Customer adds products to cart from multiple stores
2. System calculates delivery fees based on distance and zones
3. Order is placed and automatically split by vendor
4. Notifications sent to relevant store owners
5. Store owners process and fulfill their portion
6. Delivery partner is assigned for pickup and delivery
7. Real-time tracking begins with WebSocket connections
8. Status updates broadcast to all stakeholders

### Real-Time Tracking Flow
1. Delivery partner accepts order assignment
2. HERE Maps calculates optimal route
3. Partner shares live location via mobile GPS
4. Location updates stored in database
5. WebSocket broadcasts updates to customers
6. ETA recalculated based on current location and traffic
7. Status updates trigger notifications to all parties

## External Dependencies

### HERE Maps API
- **Purpose**: Location services, routing, and mapping
- **Usage**: Route calculation, geocoding, and map display
- **Fallback**: Google Maps integration for backup routing

### Payment Processing
- **Stripe Integration**: Primary payment processor
- **PayPal SDK**: Alternative payment method
- **Security**: PCI compliance through third-party processors

### Email Services
- **SendGrid**: Transactional email delivery
- **Use Cases**: Order confirmations, user notifications, admin alerts

### Database Hosting
- **Neon PostgreSQL**: Cloud-hosted database with auto-scaling
- **Connection**: SSL-secured with connection pooling

## Deployment Strategy

### Development Environment
- **Platform**: Replit for development and testing
- **Hot Reload**: Vite HMR for rapid development
- **Database**: Direct connection to Neon PostgreSQL

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Served through Express static middleware
- **Process Management**: Node.js process with proper error handling
- **Environment Configuration**: Environment variables for sensitive data

### Database Management
- **Migrations**: Automated through Drizzle Kit
- **Backups**: Handled by Neon PostgreSQL service
- **Scaling**: Auto-scaling database connections

## Recent Changes

### June 30, 2025 - Comprehensive SEO Optimization and Mobile App Integration
- ✓ Enhanced index.html with complete SEO meta tags including Open Graph and Twitter Cards
- ✓ Added comprehensive geographic tags for Siraha, Nepal location targeting
- ✓ Created manifest.json for Progressive Web App functionality with shortcuts
- ✓ Added browserconfig.xml for Microsoft tile configuration with brand colors
- ✓ Created robots.txt with proper crawling guidelines for search engines
- ✓ Added sitemap.xml with all main pages for better search indexing
- ✓ Enhanced service worker with professional push notification handling by type
- ✓ Added SirahaBazaar.apk mobile app file to public folder for download
- ✓ Updated footer with download app button featuring smartphone and download icons
- ✓ Integrated JSON-LD structured data for better search engine understanding
- → Complete SEO optimization and mobile app distribution now available

### June 30, 2025 - Updated Contact Information and Logo Branding
- ✓ Updated email address from info@sirahabazaar.com to sirahabazzar@gmail.com across all components
- ✓ Updated phone number from +977-33-123456 to +9779805916598 throughout the application
- ✓ Updated logo alt text to reflect "Siraha Bazaar" branding with icon2.png in navbar
- ✓ Modified Footer component with new Gmail contact email and phone number
- ✓ Updated OrderConfirmation, OrderTracking, AdminLogin, and ComprehensiveAdminDashboard pages
- ✓ Ensured consistent branding and contact information across all customer-facing components
- → All contact information now uses the official Gmail address and updated phone number

### June 29, 2025 - Related Products Filtering and Mobile Review System Enhancement
- ✓ Fixed related products filtering to properly separate food and retail items based on app mode
- ✓ Shopping mode now only shows non-food related products, excluding food items completely
- ✓ Food mode only displays food-related products in the related section
- ✓ Fixed restaurant display issue on food home page mobile view
- ✓ Removed restrictive filtering that was hiding restaurants without high ratings or featured status
- ✓ All existing restaurants now properly display in food home page mobile layout
- ✓ Enhanced customer review system with compact and professional design
- ✓ Reduced review component spacing and made elements smaller for better mobile experience
- ✓ Optimized review cards with smaller avatars, compressed text, and efficient layout
- ✓ Maintained full review functionality while significantly reducing space usage
- → Related products now properly respect app mode context, and all restaurants visible on mobile

### June 29, 2025 - Delivery Partner Dashboard Alerts and Quick Actions Fixed
- ✓ Fixed delivery partner dashboard alerts tab to properly display notifications
- ✓ Added dedicated "Alerts" tab with delivery notification component integration
- ✓ Enhanced notification filtering to show all unread delivery assignments
- ✓ Fixed quick action buttons for accepting delivery orders
- ✓ Added proper Bell icon with notification count badges on dashboard tabs
- ✓ Verified notification system working: User ID 4 receiving notification #70 for Order #11
- ✓ All delivery partner quick actions now functional including Accept Delivery button
- → Delivery partners can now see and respond to delivery notifications immediately

### June 29, 2025 - Simplified First-Accept-First-Serve Delivery System
- ✓ Removed seller ability to assign specific delivery partners as requested by user
- ✓ Simplified delivery assignment to only use first-accept-first-serve system
- ✓ Replaced dropdown selection with direct "Send to All Partners" button
- ✓ Updated both SellerDashboard and ShopkeeperDashboard for consistency
- ✓ Removed handleAssignDeliveryPartner function from both components
- ✓ Streamlined UI to prevent seller confusion about delivery partner assignment
- ✓ All orders now automatically go to available delivery partners for fair competition
- → Sellers can only broadcast orders to all partners, ensuring fastest delivery response times

### June 28, 2025 - First-Accept-First-Serve Delivery Notification System Implementation
- ✓ Built complete first-accept-first-serve notification system as requested by user
- ✓ Created streamlined single dropdown interface combining both assignment options
- ✓ Orange-highlighted "All Partners (First Accept)" option for broadcasting to all delivery partners
- ✓ Individual partner names listed below for direct assignment to specific partners
- ✓ Created `/api/notifications/delivery-assignment` endpoint for broadcasting functionality
- ✓ Implemented `/api/delivery/accept-assignment` endpoint with race condition protection
- ✓ All available delivery partners receive notifications simultaneously when "All Partners" selected
- ✓ First partner to accept gets delivery - others automatically rejected with proper error handling
- ✓ Automatic confirmation notifications sent to successful partner and customer
- ✓ Tested complete flow: Notification broadcast → Gokul accepted first → Shekhar properly rejected
- ✓ System prevents double-assignment conflicts and ensures only one partner gets each order
- ✓ Clean UI without extra buttons - user requested single dropdown with both options
- ✓ Fixed delivery partner dashboard routing to use correct DeliveryPartnerDashboard with "Alerts" tab
- ✓ Updated App.tsx routing configuration to point to proper dashboard with notification interface
- ✓ Enhanced DeliveryNotifications component with proper API endpoints and data handling
- → Delivery partners can now compete for orders leading to faster response times and improved service

### June 28, 2025 - Delivery Partner Notification System Diagnostic and Prevention
- ✓ Identified critical issue: Delivery partners with "pending" status cannot receive notifications
- ✓ Fixed Shekhar's delivery partner status from "pending" to "approved" 
- ✓ Verified notification system works properly for approved delivery partners
- ✓ Added automatic approval notification when delivery partner gets approved
- ✓ Created diagnostic process for future delivery partner notification issues:
  * Check delivery partner approval status first (must be "approved")
  * Verify isAvailable flag is set to true
  * Confirm delivery partner exists in database with correct userId mapping
  * Test notification endpoints are accessible and functional
- ✓ Documented common causes of notification failures:
  * Delivery partner status = "pending" (most common)
  * Delivery partner isAvailable = false
  * Incorrect userId mapping between users and delivery_partners tables
  * Missing adminId during approval process
- → Future delivery partner notification issues can be quickly diagnosed using this checklist

### June 28, 2025 - Store Creation System Enhanced with Conditional Field Display
- ✓ Fixed "invalid data" errors preventing store creation (e.g., "bhuvi fancy", "bhuvi retails")
- ✓ Enhanced backend validation schema to handle null/undefined values gracefully
- ✓ Updated insertStoreSchema to accept null values and transform them to empty strings
- ✓ Added data cleaning in frontend before API submission to prevent validation errors
- ✓ Improved error messages to be user-friendly instead of technical validation errors
- ✓ Implemented conditional field display based on store type (retail vs restaurant)
- ✓ Restaurant-specific fields only appear when "restaurant" store type is selected:
  * Phone number for delivery coordination
  * Delivery fee amount
  * Minimum order value
  * Delivery time estimates
  * Cuisine type specification
  * Opening hours information
- ✓ Retail stores show simplified form without restaurant-specific fields
- ✓ Added visual distinction with orange-themed restaurant field sections
- ✓ Enhanced both create and edit forms with conditional field rendering
- → Store creation now provides appropriate fields based on business type without showing irrelevant options

### June 28, 2025 - Professional Live Tracking System with Leaflet Maps Implementation
- ✓ Created comprehensive ProfessionalLiveTracking component with Leaflet maps integration
- ✓ Added custom animated markers for stores (🏪), customers (🏠), and delivery partners (🚛)
- ✓ Implemented real-time route simulation with smooth animations between waypoints
- ✓ Enhanced tracking visualization with professional UI including status badges and progress tracking
- ✓ Added live location tracking with GPS integration and fallback simulation mode
- ✓ Created enhanced delivery tracking API endpoint with complete store and customer information
- ✓ Integrated delivery route visualization with pickup and delivery coordinates
- ✓ Added professional styling with animated markers, pulse effects, and ripple animations
- ✓ Connected live tracking to both delivery partner dashboard and standalone tracking page
- ✓ Implemented real-time ETA calculations and distance tracking with visual updates
- ✓ Fixed database constraint error by ensuring delivery_partner_id is properly passed in location tracking
- ✓ Fixed secondary map pickup/delivery buttons to show correct Siraha, Nepal coordinates instead of Kanpur, India
- ✓ Added coordinate calculation system to position markers based on real GPS coordinates
- ✓ Updated route lines to connect actual pickup and delivery locations dynamically
- → Live tracking now shows professional animated maps with real store, customer, and partner data using accurate Nepal coordinates

### June 28, 2025 - Live Tracking System Fixed to Show Real Delivery Partners
- ✓ Fixed live tracking component to display actual delivery partner data instead of test users
- ✓ Enhanced tracking endpoint to fetch real delivery partner information with complete user details
- ✓ Updated TrackingDemo component with proper TypeScript interfaces for delivery and partner data
- ✓ Added filtering to show only active deliveries with assigned partners in tracking interface
- ✓ Included store information for pickup locations in comprehensive tracking data
- ✓ Fixed all schema import issues and TypeScript errors in tracking endpoints
- ✓ Added real data flag to distinguish authentic tracking information from test data
- → Live tracking now displays real delivery partners: Gokul Yadav and other actual users instead of placeholder data

### June 28, 2025 - Delivery Order Recovery and Endpoint Fix
- ✓ Fixed critical issue where accepted orders disappeared when wrong API endpoint was used
- ✓ Recovered lost order #11 from Family Restaurant for delivery partner Gokul Yadav
- ✓ Added intelligent endpoint redirection for delivery acceptance compatibility
- ✓ Enhanced `/api/deliveries/:id/accept` to handle both deliveryId and orderId parameters
- ✓ Created automatic order recovery system when endpoint mismatch occurs
- ✓ Verified complete delivery flow: Order acceptance → Delivery creation → Status updates
- ✓ Added proper error handling and logging for delivery acceptance debugging
- → Order losses due to endpoint confusion are now prevented with automatic recovery

### June 28, 2025 - Automatic Restaurant Delivery Notifications Fixed
- ✓ Fixed critical issue where delivery partners weren't getting notified about Family Restaurant orders
- ✓ Implemented automatic delivery partner notifications when restaurant orders are placed
- ✓ Enhanced order creation flow to detect restaurant stores and auto-notify delivery partners
- ✓ Added intelligent restaurant detection (restaurant, cafe, kitchen, food, dining keywords)
- ✓ Created specialized notification messages: "🍽️ New Restaurant Order Available"
- ✓ Verified complete notification flow: Customer order → Auto-notification → Delivery partner
- ✓ System now sends both database notifications and push notifications automatically
- → Delivery partners now receive instant notifications for all restaurant orders without manual intervention

### June 28, 2025 - Order Placement System Fixed
- ✓ Fixed critical order placement API that was failing due to database schema mismatches
- ✓ Updated orders table schema to include storeId, deliveryFee, taxAmount, discountAmount fields
- ✓ Updated orderItems table schema to include storeId, totalPrice, and createdAt fields
- ✓ Implemented multi-vendor order creation system that creates separate orders per store
- ✓ Fixed order item creation with proper totalPrice calculation (quantity × price)
- ✓ Enhanced order notification system to notify store owners and customers
- ✓ Verified complete order flow: Gokul Yadav → Shankar Yadav (Family Restaurant)
- → Order placement system now fully operational for all users

### June 28, 2025 - Restaurant Dashboard System Implementation
- ✓ Fixed restaurant dashboard routing to automatically detect restaurant stores
- ✓ Enhanced restaurant detection to identify "Family Restaurant" and similar names
- ✓ Restaurant product forms now show comprehensive food-specific fields:
  * Menu item naming instead of product naming
  * Preparation time estimation
  * Spice level selection (Mild, Medium, Hot, Extra Hot)
  * Vegetarian and Vegan dietary options
  * Ingredients management with add/remove functionality
  * Allergen tracking and management
  * Nutrition information fields
- ✓ Smart navigation system redirects restaurant owners to restaurant dashboard
- ✓ Retail stores continue using standard seller dashboard
- → Restaurant management system fully operational with food-specific features

### June 28, 2025 - Delivery Partner Notification System Fix
- ✓ Fixed critical delivery partner approval system that was preventing notifications
- ✓ Added `/api/admin/current` endpoint for proper admin authentication
- ✓ Updated admin pages to dynamically fetch correct admin ID instead of hardcoded values
- ✓ Verified notification flow: Shankar Yadav (seller) → Gokul Yadav (delivery partner)
- ✓ Tested complete order-to-delivery notification pipeline
- ✓ Fixed database approval process to ensure delivery partners receive "approved" status
- → All future delivery partners will now receive notifications properly after admin approval

### June 24, 2025 - Mobile Notification System Implementation
- ✓ Built comprehensive mobile notification center for mobile browsers
- ✓ Fixed Firebase integration and dependencies for web notifications
- ✓ Added real-time notification polling every 3 seconds for responsive mobile experience
- ✓ Created mobile-optimized notification display with full-screen mobile support
- ✓ Implemented notification management (mark as read, mark all read functionality)
- ✓ Added proper notification categorization with colored icons
- ✓ Integrated notification center into main navbar with unread count badges
- ✓ Created mobile test notification buttons for development testing
- → Mobile notification system now displays notifications in browser notification section

### December 24, 2024 - Firebase Push Notifications Integration
- ✓ Integrated Firebase Cloud Messaging (FCM) for mobile push notifications
- ✓ Created FirebaseService class with comprehensive notification methods
- ✓ Added device token management in database storage layer
- ✓ Implemented API endpoints for device token registration/removal
- ✓ Added notification hooks for React frontend integration
- ✓ Created service worker for background notification handling
- ✓ Enhanced NotificationService to use Firebase for push delivery
- → Firebase configuration requires environment variables setup

### Key Features Added:
- Mobile-first notification interface with real-time updates
- Order status notifications to customers
- Delivery assignment alerts for partners  
- Promotional notifications to customer segments
- Real-time push notifications with custom actions
- Cross-platform support (web, mobile apps)

## Changelog
- June 13, 2025. Initial setup
- December 24, 2024. Firebase push notifications integration

## User Preferences

Preferred communication style: Simple, everyday language.