-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "exact_location" TEXT,
    "location_consent" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacity_min" INTEGER,
    "capacity_max" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "family_friendly" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "facebook_contact" TEXT,
    "image_url" TEXT,
    "reference_link" TEXT,
    "google_maps_link" TEXT,
    "duration_days" INTEGER,
    "expires_at" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "opening_hours" TEXT,
    "services_offered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "average_rating" DOUBLE PRECISION,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "event_date" DATE,
    "event_time" TEXT,
    "event_end_date" DATE,
    "organizer_name" TEXT,
    "organizer_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_seekers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "help_type" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "last_updated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "shared_with_contacts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_seekers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_type_idx" ON "listings"("type");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_area_idx" ON "listings"("area");

-- CreateIndex
CREATE INDEX "listings_verified_idx" ON "listings"("verified");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "help_seekers_share_token_key" ON "help_seekers"("share_token");

-- CreateIndex
CREATE INDEX "help_seekers_status_idx" ON "help_seekers"("status");

-- CreateIndex
CREATE INDEX "help_seekers_help_type_idx" ON "help_seekers"("help_type");

-- CreateIndex
CREATE INDEX "help_seekers_urgency_idx" ON "help_seekers"("urgency");

-- CreateIndex
CREATE INDEX "help_seekers_share_token_idx" ON "help_seekers"("share_token");

