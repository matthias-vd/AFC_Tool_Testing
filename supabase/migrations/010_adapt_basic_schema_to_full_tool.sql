-- =============================================================================
-- AFC Tool — adapt "basic" schema → full EventBeheer + Ticketing
-- =============================================================================
-- Input: schema zoals in sqldb.rtf (academic_years, events, registrations, …)
-- Output: kolommen, enums, RPCs, storage + RLS die de huidige frontend nodig heeft.
--
-- VEILIG: idempotent waar mogelijk (IF NOT EXISTS / CREATE OR REPLACE).
--
-- UITVOEREN IN 2 STAPPEN in de Supabase SQL editor:
--   1) Sectie A alleen (enum afc_ticket) → Run
--   2) Sectie B volledig → Run
-- =============================================================================


-- #############################################################################
-- SECTIE A — alleen dit eerst (aparte query / run)
-- #############################################################################

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
    CREATE TYPE public.event_type AS ENUM ('event', 'workshop', 'project');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
    CREATE TYPE public.event_status AS ENUM ('concept', 'voorbereid', 'afgerond', 'compleet');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'spreker_rol') THEN
    CREATE TYPE public.spreker_rol AS ENUM ('spreker', 'moderator', 'panellid');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registratie_bron') THEN
    CREATE TYPE public.registratie_bron AS ENUM (
      'tally', 'ticket_tailor', 'tickettailor', 'manueel', 'afc_ticket'
    );
  END IF;
END $$;

-- Als registratie_bron al bestond zonder afc_ticket:
ALTER TYPE public.registratie_bron ADD VALUE IF NOT EXISTS 'tally';
ALTER TYPE public.registratie_bron ADD VALUE IF NOT EXISTS 'ticket_tailor';
ALTER TYPE public.registratie_bron ADD VALUE IF NOT EXISTS 'tickettailor';
ALTER TYPE public.registratie_bron ADD VALUE IF NOT EXISTS 'manueel';
ALTER TYPE public.registratie_bron ADD VALUE IF NOT EXISTS 'afc_ticket';

ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'event';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'workshop';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'project';

ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'concept';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'voorbereid';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'afgerond';
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'compleet';

ALTER TYPE public.spreker_rol ADD VALUE IF NOT EXISTS 'spreker';
ALTER TYPE public.spreker_rol ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.spreker_rol ADD VALUE IF NOT EXISTS 'panellid';

-- STOP HIER NA SECTIE A → Run. Daarna Sectie B.


-- #############################################################################
-- SECTIE B — rest van de adaptatie (na Sectie A committed)
-- #############################################################################

-- ── Basis-tabellen die soms ontbreken in "basic" ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.academic_years (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text NOT NULL UNIQUE,
  start_datum date NOT NULL,
  eind_datum date NOT NULL,
  is_huidig boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  type public.event_type NOT NULL DEFAULT 'event',
  status public.event_status NOT NULL DEFAULT 'concept',
  is_published boolean NOT NULL DEFAULT false,
  titel text NOT NULL,
  beschrijving_website text,
  beschrijving_sociaal text,
  event_datum date,
  locatie text,
  max_deelnemers integer,
  deuren_open time,
  start_tijd time,
  einde_tijd time,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  financieel_resultaat numeric,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.event_domains (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, domain_id)
);

CREATE TABLE IF NOT EXISTS public.event_sprekers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rol public.spreker_rol NOT NULL DEFAULT 'spreker',
  naam text NOT NULL,
  email text,
  telefoon text,
  omschrijving text,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_materiaal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  item text NOT NULL,
  hoeveelheid text,
  leverancier text,
  contact_naam text,
  contact_email text,
  contact_telefoon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  bron public.registratie_bron NOT NULL,
  email text,
  faculteit text,
  hoe_gevonden text,
  voornaam text,
  achternaam text,
  studiejaar text,
  ingediend_op timestamptz,
  naam text,
  ingeschreven_op timestamptz,
  checked_in boolean NOT NULL DEFAULT false,
  registered_at timestamptz NOT NULL DEFAULT now(),
  ticket_code text,
  study_program text
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email text,
  schaal_1 smallint CHECK (schaal_1 IS NULL OR (schaal_1 >= 1 AND schaal_1 <= 5)),
  schaal_2 smallint CHECK (schaal_2 IS NULL OR (schaal_2 >= 1 AND schaal_2 <= 5)),
  schaal_3 smallint CHECK (schaal_3 IS NULL OR (schaal_3 >= 1 AND schaal_3 <= 5)),
  wat_kon_beter text,
  favo_onderdeel text,
  andere_opmerkingen text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_todos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tekst text NOT NULL,
  voltooid boolean NOT NULL DEFAULT false,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text NOT NULL,
  beschrijving text,
  totaal_stock integer NOT NULL DEFAULT 0,
  eenheid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  hoeveelheid integer NOT NULL DEFAULT 1,
  teruggegeven boolean NOT NULL DEFAULT false,
  notities text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_rollen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  naam text NOT NULL,
  beschrijving text,
  plaatsen integer NOT NULL DEFAULT 1 CHECK (plaatsen > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_default boolean NOT NULL DEFAULT false,
  start_uur time,
  eind_uur time
);

CREATE TABLE IF NOT EXISTS public.event_rol_users (
  event_rol_id uuid NOT NULL REFERENCES public.event_rollen(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_rol_id, user_id)
);

-- Optioneel crew-systeem (gebruikt door Eventcrewsection)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  naam text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crew_rollen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam text NOT NULL,
  beschrijving text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_crew (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_id uuid NOT NULL REFERENCES public.crew_rollen(id) ON DELETE CASCADE,
  notities text,
  bevestigd boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Events: ticketing-kolommen ───────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticket_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_slug text,
  ADD COLUMN IF NOT EXISTS ticket_intro text,
  ADD COLUMN IF NOT EXISTS ticket_is_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS ticket_image_path text,
  ADD COLUMN IF NOT EXISTS financieel_resultaat numeric,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS events_ticket_slug_unique
  ON public.events (ticket_slug)
  WHERE ticket_slug IS NOT NULL;

-- ── Registrations: ticketing + type-fix ingeschreven_op ─────────────────────
-- Basic template heeft vaak ingeschreven_op als DATE → tool/RPC verwachten timestamptz.
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO col_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'registrations'
    AND a.attname = 'ingeschreven_op'
    AND NOT a.attisdropped;

  IF col_type IS NULL THEN
    ALTER TABLE public.registrations ADD COLUMN ingeschreven_op timestamptz;
  ELSIF col_type = 'date' THEN
    ALTER TABLE public.registrations
      ALTER COLUMN ingeschreven_op TYPE timestamptz
      USING CASE
        WHEN ingeschreven_op IS NULL THEN NULL
        ELSE ingeschreven_op::timestamp AT TIME ZONE 'Europe/Brussels'
      END;
  ELSIF col_type = 'text' THEN
    ALTER TABLE public.registrations
      ALTER COLUMN ingeschreven_op TYPE timestamptz
      USING NULLIF(ingeschreven_op, '')::timestamptz;
  END IF;
END $$;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS extra_info text DEFAULT '',
  ADD COLUMN IF NOT EXISTS food_preference text,
  ADD COLUMN IF NOT EXISTS cv_original_name text,
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS ticket_token text,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS ticket_code text,
  ADD COLUMN IF NOT EXISTS study_program text,
  ADD COLUMN IF NOT EXISTS naam text,
  ADD COLUMN IF NOT EXISTS voornaam text,
  ADD COLUMN IF NOT EXISTS achternaam text,
  ADD COLUMN IF NOT EXISTS faculteit text,
  ADD COLUMN IF NOT EXISTS hoe_gevonden text,
  ADD COLUMN IF NOT EXISTS studiejaar text,
  ADD COLUMN IF NOT EXISTS ingediend_op timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registered_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS registrations_ticket_token_unique
  ON public.registrations (ticket_token)
  WHERE ticket_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_email_active_unique
  ON public.registrations (event_id, lower(email))
  WHERE bron = 'afc_ticket'::public.registratie_bron AND cancelled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_ticket_event
  ON public.registrations (event_id)
  WHERE bron = 'afc_ticket'::public.registratie_bron;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_ticket_code_unique
  ON public.registrations (event_id, ticket_code)
  WHERE ticket_code IS NOT NULL;

-- ── Helper view (dashboard) ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.events_with_registration_count AS
SELECT
  e.*,
  (
    SELECT count(*)::int
    FROM public.registrations r
    WHERE r.event_id = e.id
      AND r.cancelled_at IS NULL
  ) AS registration_count
FROM public.events e;

-- ── get_users_info (rollen / academiejaren) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_users_info(user_ids uuid[])
RETURNS TABLE (id uuid, email text, naam text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email::text,
    coalesce(p.naam, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')::text AS naam
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = ANY (user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_users_info(uuid[]) TO authenticated;

-- ── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-cvs', 'ticket-cvs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sprekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rollen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rol_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view ticket-enabled events" ON public.events;
CREATE POLICY "Public can view ticket-enabled events"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL AND ticket_enabled = true);

DROP POLICY IF EXISTS "Authenticated full access events" ON public.events;
CREATE POLICY "Authenticated full access events"
  ON public.events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert ticket registrations" ON public.registrations;
CREATE POLICY "Public can insert ticket registrations"
  ON public.registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bron = 'afc_ticket'::public.registratie_bron
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
        AND e.ticket_enabled = true
        AND e.ticket_is_open = true
        AND e.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Authenticated manage registrations" ON public.registrations;
CREATE POLICY "Authenticated manage registrations"
  ON public.registrations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full academic_years" ON public.academic_years;
CREATE POLICY "Authenticated full academic_years"
  ON public.academic_years FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full domains" ON public.domains;
CREATE POLICY "Authenticated full domains"
  ON public.domains FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full feedback" ON public.feedback;
CREATE POLICY "Authenticated full feedback"
  ON public.feedback FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full event_todos" ON public.event_todos;
CREATE POLICY "Authenticated full event_todos"
  ON public.event_todos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full event_sprekers" ON public.event_sprekers;
CREATE POLICY "Authenticated full event_sprekers"
  ON public.event_sprekers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full event_domains" ON public.event_domains;
CREATE POLICY "Authenticated full event_domains"
  ON public.event_domains FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full event_rollen" ON public.event_rollen;
CREATE POLICY "Authenticated full event_rollen"
  ON public.event_rollen FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full event_rol_users" ON public.event_rol_users;
CREATE POLICY "Authenticated full event_rol_users"
  ON public.event_rol_users FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Storage policies (CV upload + images)
DROP POLICY IF EXISTS "Anon upload ticket cvs" ON storage.objects;
CREATE POLICY "Anon upload ticket cvs"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Anon select ticket cvs" ON storage.objects;
CREATE POLICY "Anon select ticket cvs"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Anon update ticket cvs" ON storage.objects;
CREATE POLICY "Anon update ticket cvs"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'ticket-cvs')
  WITH CHECK (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Authenticated delete ticket cvs" ON storage.objects;
CREATE POLICY "Authenticated delete ticket cvs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ticket-cvs');

DROP POLICY IF EXISTS "Public read ticket images" ON storage.objects;
CREATE POLICY "Public read ticket images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ticket-images');

DROP POLICY IF EXISTS "Authenticated upload ticket images" ON storage.objects;
CREATE POLICY "Authenticated upload ticket images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ticket-images');

DROP POLICY IF EXISTS "Authenticated update ticket images" ON storage.objects;
CREATE POLICY "Authenticated update ticket images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ticket-images');

-- ── Ticketing RPCs ───────────────────────────────────────────────────────────
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
  FROM public.registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.ticket_token = p_token
    AND r.bron = 'afc_ticket'::public.registratie_bron
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

  UPDATE public.registrations
  SET
    cancelled_at = coalesce(cancelled_at, clock_timestamp()),
    checked_in = false,
    checked_in_at = null
  WHERE ticket_token = p_token
    AND bron = 'afc_ticket'::public.registratie_bron;

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
  v_event public.events%ROWTYPE;
  v_existing_id uuid;
  v_cancelled_id uuid;
  v_count int;
  v_reg_id uuid;
  v_now timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO v_event
  FROM public.events
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
  FROM public.registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::public.registratie_bron
    AND lower(email) = lower(trim(p_email))
    AND cancelled_at IS NULL
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Dit e-mailadres is al ingeschreven voor dit event.';
  END IF;

  SELECT count(*)::int INTO v_count
  FROM public.registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::public.registratie_bron
    AND cancelled_at IS NULL;

  IF v_event.max_deelnemers IS NOT NULL AND v_count >= v_event.max_deelnemers THEN
    RAISE EXCEPTION 'Dit event is volzet.';
  END IF;

  SELECT id INTO v_cancelled_id
  FROM public.registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::public.registratie_bron
    AND lower(email) = lower(trim(p_email))
    AND cancelled_at IS NOT NULL
  ORDER BY registered_at DESC NULLS LAST
  LIMIT 1;

  v_reg_id := coalesce(v_cancelled_id, gen_random_uuid());

  IF v_cancelled_id IS NOT NULL THEN
    UPDATE public.registrations SET
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
    INSERT INTO public.registrations (
      id, event_id, bron, email, naam, phone, extra_info, food_preference,
      cv_original_name, cv_path, ticket_token, ticket_code,
      checked_in, checked_in_at, cancelled_at, registered_at, ingeschreven_op
    ) VALUES (
      v_reg_id, v_event.id, 'afc_ticket'::public.registratie_bron,
      lower(trim(p_email)), trim(p_name), trim(p_phone),
      coalesce(p_extra_info, ''), p_food_preference,
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
GRANT EXECUTE ON FUNCTION public.register_afc_ticket(text, text, text, text, text, text, text, text, text)
  TO anon, authenticated;

-- Klaar. Controle:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'registrations' AND column_name IN ('ingeschreven_op','ticket_token','phone');
-- SELECT enum_range(NULL::registratie_bron);
