-- Fix: CV upload fails with "new row violates row-level security policy"
-- Storage INSERT uses RETURNING *, so anon also needs SELECT (and UPDATE for upsert).

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-cvs', 'ticket-cvs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anon upload ticket cvs" ON storage.objects;
CREATE POLICY "Anon upload ticket cvs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'ticket-cvs');

-- Required: upload response reads the new row back
DROP POLICY IF EXISTS "Anon select ticket cvs" ON storage.objects;
CREATE POLICY "Anon select ticket cvs"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ticket-cvs');

-- Required: client uses upsert: true
DROP POLICY IF EXISTS "Anon update ticket cvs" ON storage.objects;
CREATE POLICY "Anon update ticket cvs"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'ticket-cvs')
  WITH CHECK (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Authenticated read ticket cvs" ON storage.objects;
CREATE POLICY "Authenticated read ticket cvs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Authenticated delete ticket cvs" ON storage.objects;
CREATE POLICY "Authenticated delete ticket cvs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ticket-cvs');
