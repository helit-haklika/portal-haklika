-- Phase 1: Full schema for all Airtable tables migrated to Supabase
-- Idempotent: safe to re-run. Builds on 0001_customers_poc.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============== compounds (מתחמים) ==============
CREATE TABLE IF NOT EXISTS compounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  name text NOT NULL,
  whatsapp_group_url text,
  created_at timestamptz DEFAULT now()
);

-- ============== rooms (חדרים) ==============
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  name text NOT NULL,
  compound_name text,
  room_type text,
  address text,
  opening_hours text,
  default_pricing text,
  usage_count int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rooms_name_idx ON rooms (name);

-- ============== Add compound_id FK to customers ==============
ALTER TABLE customers ADD COLUMN IF NOT EXISTS compound_id uuid REFERENCES compounds(id);

-- ============== session_pricing (מחירון ססיות) ==============
CREATE TABLE IF NOT EXISTS session_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  hours_per_month numeric,
  price numeric
);

-- ============== discount_tiers (מדרגות הנחה) ==============
CREATE TABLE IF NOT EXISTS discount_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  min_amount numeric,
  discount_percent numeric
);

-- ============== message_templates (נוסחי הודעות) ==============
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  title text,
  body text,
  category text,
  description text,
  template_number numeric,
  airtable_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============== session_transactions (עסקאות ססיה) ==============
CREATE TABLE IF NOT EXISTS session_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  airtable_number int,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text,
  start_date date,
  standing_order_start_date date,
  price_before_discount numeric,
  price_after_discount numeric,
  notes text,
  airtable_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS session_transactions_customer_idx ON session_transactions (customer_id);

-- ============== sessions (ססיות) ==============
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  airtable_number int,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  session_transaction_id uuid REFERENCES session_transactions(id) ON DELETE SET NULL,
  status text,
  start_date date,
  day_of_week text,
  start_time text,
  end_time text,
  room_name text,
  hours numeric,
  price_before_discount numeric,
  price_after_discount numeric,
  pricing_subscription text,
  notes text,
  airtable_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_customer_idx ON sessions (customer_id);

-- ============== payments (תשלומים) ==============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  session_transaction_id uuid REFERENCES session_transactions(id) ON DELETE SET NULL,
  payment_type text,
  payment_method text,
  status text,
  payment_date date,
  reference_number text,
  amount numeric,
  hours_purchased numeric,
  description_from_morning text,
  invoice_url text,
  compound_name text,
  notes text,
  airtable_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_customer_idx ON payments (customer_id);
CREATE INDEX IF NOT EXISTS payments_date_idx ON payments (payment_date);
CREATE INDEX IF NOT EXISTS payments_type_status_idx ON payments (payment_type, status);

-- ============== bookings (שימושים) ==============
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  airtable_number int,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  booking_title text,
  status text,
  source text,
  date date,
  start_at timestamptz,
  end_at timestamptz,
  duration_hours numeric GENERATED ALWAYS AS (
    CASE WHEN start_at IS NOT NULL AND end_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (end_at - start_at)) / 3600.0
      ELSE NULL END
  ) STORED,
  revenue_per_use numeric,
  source_import_id text,
  notes text,
  airtable_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_room_idx ON bookings (room_id);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (date);
CREATE INDEX IF NOT EXISTS bookings_title_status_idx ON bookings (booking_title, status);

-- ============== skedda_raw_imports (ייבוא Skedda Raw) ==============
CREATE TABLE IF NOT EXISTS skedda_raw_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  external_id text,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes numeric,
  activity_title text,
  first_name text,
  last_name text,
  email text,
  phone text,
  room_name text,
  price numeric,
  payment_status text,
  source_created_date date,
  processed boolean DEFAULT false,
  error_notes text,
  airtable_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS skedda_raw_external_idx ON skedda_raw_imports (external_id);

-- ============== leads (לידים + HAKLIKA TALK + dreamlab) ==============
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  source_table text NOT NULL,                     -- 'leads' | 'haklika_talk' | 'dreamlab'
  category text DEFAULT 'main',
  name text,
  phone text,
  email text,
  status text,
  source text,                                    -- מקור הגעה
  lead_source_type text,                          -- מקור ליד
  treatment_type text,
  rental_type text,
  location text,
  meeting_location text,
  meeting_at timestamptz,
  follow_up_status text,
  customer_notes text,
  internal_notes text,
  task_helit text,
  task_avigail text,
  send_message_choice text,                       -- מה לשלוח לליד?
  short_link text,
  standby_days text[],
  excel_import_date date,
  last_follow_up_at timestamptz,
  converted_to_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  airtable_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_source_table_idx ON leads (source_table);

-- ============== tasks (התראות ומשימות) ==============
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  title text,
  status text,
  notes text,
  airtable_created_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_customer_idx ON tasks (customer_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);

-- ============== call_logs (תיעוד שיחות) ==============
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE NOT NULL,
  occurred_at timestamptz,
  log_type text,
  responsible text,
  description text,
  scheduled_message_content text,
  scheduled_send_at timestamptz,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS call_logs_customer_idx ON call_logs (customer_id);
CREATE INDEX IF NOT EXISTS call_logs_lead_idx ON call_logs (lead_id);
CREATE INDEX IF NOT EXISTS call_logs_scheduled_idx ON call_logs (scheduled_send_at)
  WHERE scheduled_send_at IS NOT NULL;
