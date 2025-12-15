-- Migration: Add accessibility and medical care fields
-- Run this migration to add support for disability-accessible locations and medical care facilities

-- Add accessibility fields
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessible_parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessible_restrooms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accessible_entrance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS elevator_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ramp_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sign_language_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS braille_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hearing_loop_available BOOLEAN DEFAULT false;

-- Add medical care specific fields
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS medical_specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS emergency_services BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hours_24 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_accepted BOOLEAN DEFAULT false;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS listings_wheelchair_accessible_idx ON listings(wheelchair_accessible);
CREATE INDEX IF NOT EXISTS listings_emergency_services_idx ON listings(emergency_services);

-- Update type comment (informational only, actual constraint is in application)
-- Types now include: accommodation, fuel_service, volunteer_request, car_transportation, site_sponsor, school, event, medical_care

