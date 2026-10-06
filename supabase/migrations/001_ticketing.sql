-- Ticketing integration: extend events + registrations for public AFC tickets.
-- PREREQUISITE: run 000_add_afc_ticket_bron.sql first (separate query), then this file.

-- ── Events: public ticketing fields ──────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ticket_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_slug text,
  ADD COLUMN IF NOT EXISTS ticket_intro text,
  ADD COLUMN IF NOT EXISTS ticket_is_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS ticket_image_path text;

CREATE UNIQUE INDEX IF NOT EXISTS events_ticket_slug_unique
  ON events (ticket_slug)
  WHERE ticket_slug IS NOT NULL;

-- ── Registrations: ticket fields (shared with Tally / Ticket Tailor rows) ─────
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS extra_info text DEFAULT '',
  ADD COLUMN IF NOT EXISTS food_preference text,
  ADD COLUMN IF NOT EXISTS cv_original_name text,
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS ticket_token text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_ticket_token_unique
  ON registrations (ticket_token)
  WHERE ticket_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_active_unique
  ON registrations (event_id, lower(email))
  WHERE bron = 'afc_ticket'::registratie_bron AND cancelled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_ticket_event
  ON registrations (event_id)
  WHERE bron = 'afc_ticket'::registratie_bron;

-- ── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-cvs', 'ticket-cvs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── RLS: public read for ticket-enabled events ───────────────────────────────
-- Assumes RLS is enabled. Policies are additive; tweak to match your project.

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view ticket-enabled events" ON events;
CREATE POLICY "Public can view ticket-enabled events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND ticket_enabled = true
  );

DROP POLICY IF EXISTS "Authenticated full access events" ON events;
CREATE POLICY "Authenticated full access events"
  ON events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon: insert only (no broad SELECT/UPDATE — use RPCs below for ticket lookup/cancel)
DROP POLICY IF EXISTS "Public can insert ticket registrations" ON registrations;
CREATE POLICY "Public can insert ticket registrations"
  ON registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bron = 'afc_ticket'::registratie_bron
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND e.ticket_enabled = true
        AND e.ticket_is_open = true
        AND e.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Authenticated manage registrations" ON registrations;
CREATE POLICY "Authenticated manage registrations"
  ON registrations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Secure public ticket lookup / cancel (token required; no table-wide anon read)
CREATE OR REPLACE FUNCTION public.get_ticket_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'registration', to_jsonb(r),
    'event', to_jsonb(e)
  )
  INTO result
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  WHERE r.ticket_token = p_token
    AND r.bron = 'afc_ticket'::registratie_bron
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_ticket_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN false;
  END IF;

  UPDATE registrations
  SET
    cancelled_at = coalesce(cancelled_at, now()),
    checked_in = false,
    checked_in_at = null
  WHERE ticket_token = p_token
    AND bron = 'afc_ticket'::registratie_bron;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_afc_ticket(
  p_event_slug text,
  p_name text,
  p_email text,
  p_phone text,
  p_food_preference text,
  p_extra_info text,
  p_cv_original_name text,
  p_cv_path text,
  p_ticket_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_existing_id uuid;
  v_cancelled_id uuid;
  v_count int;
  v_reg_id uuid;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_event
  FROM events
  WHERE ticket_slug = p_event_slug
    AND ticket_enabled = true
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event niet gevonden.';
  END IF;

  IF v_event.ticket_is_open IS NOT TRUE THEN
    RAISE EXCEPTION 'Inschrijvingen voor dit event zijn gesloten.';
  END IF;

  IF v_event.registration_opens_at IS NOT NULL AND v_event.registration_opens_at > v_now THEN
    RAISE EXCEPTION 'Inschrijvingen voor dit event zijn nog niet open.';
  END IF;

  IF v_event.registration_closes_at IS NOT NULL AND v_event.registration_closes_at < v_now THEN
    RAISE EXCEPTION 'Inschrijvingen voor dit event zijn gesloten.';
  END IF;

  SELECT id INTO v_existing_id
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND lower(email) = lower(trim(p_email))
    AND cancelled_at IS NULL
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Dit e-mailadres is al ingeschreven voor dit event.';
  END IF;

  SELECT count(*)::int INTO v_count
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND cancelled_at IS NULL;

  IF v_event.max_deelnemers IS NOT NULL AND v_count >= v_event.max_deelnemers THEN
    RAISE EXCEPTION 'Dit event is volzet.';
  END IF;

  SELECT id INTO v_cancelled_id
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND lower(email) = lower(trim(p_email))
    AND cancelled_at IS NOT NULL
  ORDER BY registered_at DESC NULLS LAST
  LIMIT 1;

  v_reg_id := coalesce(v_cancelled_id, gen_random_uuid());

  IF v_cancelled_id IS NOT NULL THEN
    UPDATE registrations SET
      naam = trim(p_name),
      email = lower(trim(p_email)),
      phone = trim(p_phone),
      extra_info = coalesce(p_extra_info, ''),
      food_preference = p_food_preference,
      cv_original_name = p_cv_original_name,
      cv_path = p_cv_path,
      ticket_token = p_ticket_token,
      ticket_code = left(p_ticket_token, 12),
      checked_in = false,
      checked_in_at = null,
      cancelled_at = null,
      registered_at = v_now,
      ingeschreven_op = v_now
    WHERE id = v_cancelled_id;
  ELSE
    INSERT INTO registrations (
      id, event_id, bron, email, naam, phone, extra_info, food_preference,
      cv_original_name, cv_path, ticket_token, ticket_code,
      checked_in, checked_in_at, cancelled_at, registered_at, ingeschreven_op
    ) VALUES (
      v_reg_id, v_event.id, 'afc_ticket'::registratie_bron, lower(trim(p_email)), trim(p_name),
      trim(p_phone), coalesce(p_extra_info, ''), p_food_preference,
      p_cv_original_name, p_cv_path, p_ticket_token, left(p_ticket_token, 12),
      false, null, null, v_now, v_now
    );
  END IF;

  RETURN jsonb_build_object(
    'token', p_ticket_token,
    'eventSlug', v_event.ticket_slug
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ticket_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_ticket_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_afc_ticket(text, text, text, text, text, text, text, text, text) TO anon, authenticated;

-- Storage: anon can upload CV during registration
-- Note: INSERT uses RETURNING * → SELECT policy required; upsert needs UPDATE.
DROP POLICY IF EXISTS "Anon upload ticket cvs" ON storage.objects;
CREATE POLICY "Anon upload ticket cvs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Anon select ticket cvs" ON storage.objects;
CREATE POLICY "Anon select ticket cvs"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ticket-cvs');

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

DROP POLICY IF EXISTS "Public read ticket images" ON storage.objects;
CREATE POLICY "Public read ticket images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ticket-images');

DROP POLICY IF EXISTS "Authenticated upload ticket images" ON storage.objects;
CREATE POLICY "Authenticated upload ticket images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ticket-images');

DROP POLICY IF EXISTS "Authenticated update ticket images" ON storage.objects;
CREATE POLICY "Authenticated update ticket images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ticket-images');
