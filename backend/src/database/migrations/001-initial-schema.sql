-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'restaurant', 'admin')),
  "currentLocation" POINT,
  "isActive" BOOLEAN DEFAULT true,
  "deviceId" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location POINT NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(255),
  cuisines TEXT[],
  "avgPrepTimeMinutes" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "acceptsOrders" BOOLEAN DEFAULT false,
  "maxConcurrentOrders" INTEGER DEFAULT 10,
  "currentOrders" INTEGER DEFAULT 0,
  "parkingAvailable" BOOLEAN,
  "sameSideOfRoad" BOOLEAN,
  "operatingHours" JSONB,
  "ownerId" UUID REFERENCES users(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  "imageUrl" VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "prepTimeMinutes" INTEGER DEFAULT 0,
  "restaurantId" UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "fromLocation" POINT NOT NULL,
  "toLocation" POINT NOT NULL,
  "viaLocation" POINT,
  polyline TEXT NOT NULL,
  "transportMode" VARCHAR(20),
  "maxDetourKm" INTEGER DEFAULT 5,
  "maxWaitTimeMinutes" INTEGER DEFAULT 10,
  "arrivalFlexibilityMinutes" INTEGER,
  "scheduledStartTime" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id),
  "restaurantId" UUID NOT NULL REFERENCES restaurants(id),
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "paidAmount" DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled', 'no_show')),
  "pickupOtp" VARCHAR(10),
  "pickupOtpExpiresAt" TIMESTAMP,
  "estimatedArrivalTime" TIMESTAMP,
  "estimatedReadyTime" TIMESTAMP,
  "actualReadyTime" TIMESTAMP,
  "actualPickupTime" TIMESTAMP,
  "delayReason" TEXT,
  "userLateByMinutes" INTEGER,
  "routeInfo" JSONB,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  "ratingComment" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "menuItemId" UUID NOT NULL REFERENCES menu_items(id),
  "itemName" VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) DEFAULT 'full' CHECK (type IN ('full', 'partial')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  "gatewayTransactionId" VARCHAR(255),
  "gatewayResponse" TEXT,
  "refundTransactionId" VARCHAR(255),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants("isActive", "acceptsOrders");
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items("restaurantId");
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders("restaurantId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments("orderId");

