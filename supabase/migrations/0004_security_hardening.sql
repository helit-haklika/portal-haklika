-- Phase 2 hardening per Supabase Postgres best practices:
-- 1. Revoke anon/authenticated access to dashboard view (service_role only)
-- 2. Add missing FK indexes (HIGH impact - 10-100x faster JOINs/cascades)
-- 3. Enable RLS on customer-data tables (defense in depth - service_role bypasses RLS)

-- ===== 1. Restrict customer_dashboard view to service_role only =====
REVOKE SELECT ON customer_dashboard FROM anon, authenticated;
-- service_role retains access (default)

-- ===== 2. Missing FK indexes =====
CREATE INDEX IF NOT EXISTS bookings_session_id_idx
  ON bookings (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_compound_id_idx
  ON customers (compound_id) WHERE compound_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_converted_to_customer_id_idx
  ON leads (converted_to_customer_id) WHERE converted_to_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_session_id_idx
  ON payments (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_session_transaction_id_idx
  ON payments (session_transaction_id) WHERE session_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sessions_session_transaction_id_idx
  ON sessions (session_transaction_id) WHERE session_transaction_id IS NOT NULL;

-- ===== 3. Enable RLS on all customer-data tables =====
-- We use SUPABASE_SERVICE_ROLE_KEY only (server-side) which bypasses RLS.
-- Enabling RLS with NO policies = deny-all to anon/authenticated.
-- This prevents accidental data exposure if the ANON key is ever used to read these tables.
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skedda_raw_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
