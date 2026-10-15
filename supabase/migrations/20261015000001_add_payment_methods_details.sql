-- Migration: Add details JSONB column to payment_methods table
-- Enables storing bank, Nequi, Daviplata, Bre-B keys, account numbers, holder info, and instructions

ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
