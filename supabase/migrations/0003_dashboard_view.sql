-- Phase 2 optimization: customer_dashboard view aggregates balance computation
-- into a single query, replacing 4 round trips with 1.

CREATE OR REPLACE VIEW customer_dashboard AS
SELECT
  c.id,
  c.airtable_id,
  c.first_name,
  c.last_name,
  c.email,
  c.email_secondary,
  c.status,
  c.legacy_credit_2024,
  c.details_update_status,
  c.legacy_credit_2024
    + COALESCE((
        SELECT SUM(p.hours_purchased)
        FROM payments p
        WHERE p.customer_id = c.id
          AND p.payment_type = 'כרטיסיה'
          AND p.status = 'שולם'
      ), 0)
    - COALESCE((
        SELECT SUM(b.duration_hours)
        FROM bookings b
        WHERE b.customer_id = c.id
          AND b.booking_title = 'שעתי'
          AND (b.status IS NULL OR b.status != 'מבוטל')
      ), 0)
    AS balance_hours
FROM customers c;

-- Allow service_role + authenticated to read the view
GRANT SELECT ON customer_dashboard TO anon, authenticated, service_role;
