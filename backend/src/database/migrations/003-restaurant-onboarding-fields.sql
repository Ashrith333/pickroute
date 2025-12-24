-- Add restaurant onboarding and management fields

-- Restaurant status enum
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS "legalName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "displayName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "fssaiNumber" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "primaryContactName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'live', 'paused', 'suspended')),
ADD COLUMN IF NOT EXISTS "entryPickupPoint" TEXT,
ADD COLUMN IF NOT EXISTS "landmark" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "defaultPrepTimeMinutes" INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS "maxOrdersPer15Min" INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS "maxOrdersPer30Min" INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS "holdTimeAfterReadyMinutes" INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS "peakHourBufferMinutes" INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS "autoAcceptOrders" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "bankIfscCode" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "bankAccountName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "pickupInstructions" TEXT;

-- Update menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS "isVeg" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "isFastPickup" BOOLEAN DEFAULT false;

-- Create restaurant_capacity_slots table for time-based capacity
CREATE TABLE IF NOT EXISTS restaurant_capacity_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  "slotTime" TIMESTAMP NOT NULL,
  "maxOrders" INTEGER NOT NULL DEFAULT 5,
  "currentOrders" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("restaurantId", "slotTime")
);

-- Create index for capacity slots
CREATE INDEX IF NOT EXISTS idx_capacity_slots_restaurant_time ON restaurant_capacity_slots("restaurantId", "slotTime");

