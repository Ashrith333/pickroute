# PickRoute Project Structure

## Overview

PickRoute is a pickup-first, route-aware food ordering platform built with:
- **Frontend**: React Native + TypeScript
- **Backend**: Node.js + NestJS
- **Database**: PostgreSQL + PostGIS + Redis

## Directory Structure

```
pickroute/
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   └── decorators/
│   │   ├── users/              # User management
│   │   ├── restaurants/        # Restaurant management
│   │   │   ├── entities/
│   │   │   │   ├── restaurant.entity.ts
│   │   │   │   └── menu-item.entity.ts
│   │   ├── orders/             # Order management
│   │   │   ├── entities/
│   │   │   │   ├── order.entity.ts
│   │   │   │   └── order-item.entity.ts
│   │   ├── routes/             # Route planning
│   │   ├── payments/           # Payment processing
│   │   ├── redis/              # Redis service
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React Native App
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/           # Authentication screens
│   │   │   │   ├── PhoneAuthScreen.tsx
│   │   │   │   └── OtpVerificationScreen.tsx
│   │   │   ├── user/           # User screens
│   │   │   │   ├── UserHomeScreen.tsx
│   │   │   │   ├── RouteSetupScreen.tsx
│   │   │   │   ├── RestaurantDiscoveryScreen.tsx
│   │   │   │   ├── RestaurantMenuScreen.tsx
│   │   │   │   ├── PickupTimeConfirmationScreen.tsx
│   │   │   │   ├── PaymentScreen.tsx
│   │   │   │   ├── LiveOrderTrackingScreen.tsx
│   │   │   │   ├── PickupScreen.tsx
│   │   │   │   └── OrderCompleteScreen.tsx
│   │   │   └── restaurant/     # Restaurant screens
│   │   │       ├── RestaurantDashboardScreen.tsx
│   │   │       └── OrderDetailScreen.tsx
│   │   ├── navigation/         # Navigation stacks
│   │   ├── context/            # React context
│   │   ├── services/           # API services
│   │   └── config/             # Configuration
│   ├── App.tsx
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── SETUP.md
```

## Key Features Implemented

### User Flow (10 Screens)
1. **User Home** - Primary intent selection
2. **Route Setup** - Plan route with constraints
3. **Restaurant Discovery** - Find restaurants on route
4. **Restaurant Menu** - Browse and add items
5. **Pickup Time Confirmation** - Lock time slot
6. **Payment** - Full or partial payment
7. **Live Order Tracking** - Real-time status updates
8. **Pickup** - OTP verification
9. **Order Complete** - Rating and feedback

### Restaurant Flow (2 Screens)
1. **Restaurant Dashboard** - View incoming orders
2. **Order Detail** - Manage order status and verify pickup

### Backend APIs

#### Authentication
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login
- `GET /auth/session` - Get current session

#### Routes
- `POST /routes/preview` - Preview route with constraints
- `GET /routes` - Get user routes

#### Restaurants
- `POST /restaurants/on-route` - Find restaurants on route
- `GET /restaurants/:id` - Get restaurant details
- `GET /restaurants/:id/menu` - Get restaurant menu

#### Orders
- `POST /orders/validate-cart` - Validate cart items
- `POST /orders/lock-slot` - Lock pickup time slot
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/restaurant` - Get restaurant orders
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status
- `POST /orders/:id/verify-otp` - Verify pickup OTP
- `POST /orders/:id/rating` - Rate order

#### Payments
- `POST /payments/initiate` - Initiate payment
- `POST /payments/webhook` - Payment webhook

## Database Schema

### Core Tables
- `users` - User accounts with role-based access
- `restaurants` - Restaurant information with PostGIS location
- `menu_items` - Restaurant menu items
- `orders` - Order records with status tracking
- `order_items` - Order line items
- `routes` - User route plans
- `payments` - Payment transactions

### Key Relationships
- Users → Orders (one-to-many)
- Restaurants → Orders (one-to-many)
- Restaurants → MenuItems (one-to-many)
- Orders → OrderItems (one-to-many)
- Orders → Payments (one-to-many)

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js)
- **ORM**: TypeORM
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **Auth**: JWT + OTP
- **Validation**: class-validator

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State**: React Context
- **HTTP**: Axios
- **Maps**: react-native-maps
- **Storage**: Expo SecureStore

## Next Steps

1. **Admin Screens** - Implement admin dashboard and management
2. **Real-time Updates** - Add WebSocket for live order tracking
3. **Payment Integration** - Integrate actual payment gateway
4. **SMS Service** - Integrate SMS provider for OTP
5. **Push Notifications** - Add push notifications for order updates
6. **Analytics** - Add analytics and monitoring
7. **Testing** - Add unit and integration tests
8. **CI/CD** - Set up continuous integration and deployment

