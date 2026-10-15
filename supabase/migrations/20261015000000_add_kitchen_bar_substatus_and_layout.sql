-- Migration: Add kitchen and bar sub-statuses to orders, and kitchen_stations_layout to restaurant_settings
-- Date: 2026-10-15

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS kitchen_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS bar_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS kitchen_ready_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS bar_ready_at timestamptz NULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_kitchen_status_check'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_kitchen_status_check 
    CHECK (kitchen_status IN ('none', 'pending', 'preparing', 'ready'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_bar_status_check'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_bar_status_check 
    CHECK (bar_status IN ('none', 'pending', 'preparing', 'ready'));
  END IF;
END $$;

ALTER TABLE public.restaurant_settings 
ADD COLUMN IF NOT EXISTS kitchen_stations_layout jsonb DEFAULT '[]'::jsonb;
