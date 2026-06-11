-- POC: customers table for Airtable -> Supabase migration
-- Source: docs/airtable-schema-raw.json table "לקוחות" (95 fields)
-- Migrated: 54 scalar fields. Skipped: 10 formulas, 8 rollups, 6 lookups, 5 buttons, 2 attachments, 10 record_links (FKs to be added in Phase 1).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,

  -- Personal
  first_name text,
  last_name text,
  billing_name text,
  sb_marker text,
  phone text,
  email text,
  email_secondary text,
  birth_date date,
  national_id text,
  business_id text,
  home_address text,

  -- Business
  compound_name text,
  status text,
  payment_type text,
  standby_status text,
  standby_days text[],

  -- Treatment
  treatment_type text,
  treatment_duration text,
  max_patients_in_room int,
  service_uses text[],
  rental_types text[],
  special_room_needs text,

  -- Contract
  start_date date,
  commitment_months text,
  standing_order_start_date date,
  work_start_date date,
  full_room_price numeric,
  full_room_cleaning_price numeric,
  full_room_furniture_price numeric,

  -- Source / external
  morning_client_id text,

  -- About
  about_me text,
  website_url text,
  instagram_url text,
  facebook_url text,
  other_url text,
  avg_patient_age text,
  patient_origin text,
  wants_promotion text,

  -- Status flags
  has_received_key boolean DEFAULT false,
  completed_intake boolean DEFAULT false,
  standing_order_sent_for_approval boolean DEFAULT false,
  standing_order_sent_at timestamptz,
  intake_payment_status text,
  details_update_status text,
  no_overage_alerts boolean DEFAULT false,
  no_low_balance_alerts boolean DEFAULT false,
  no_overage_messages boolean DEFAULT false,

  -- Notes
  internal_notes text,
  customer_intake_summary text,
  contract_prep_summary text,
  contract_notes text,
  legacy_credit_2024 numeric DEFAULT 0,

  -- Timestamps
  airtable_created_at timestamptz,
  airtable_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_email_secondary_idx ON customers (lower(email_secondary));
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers (phone);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers (status);
CREATE INDEX IF NOT EXISTS customers_airtable_id_idx ON customers (airtable_id);
