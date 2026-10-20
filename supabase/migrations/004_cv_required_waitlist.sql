-- =============================================================================
-- CV-required toggle + waitlist for AFC Ticketing
-- Run in Supabase SQL editor after previous migrations.
-- =============================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cv_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS waitlist_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS is_waitlisted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS registrations_event_waitlist_idx
  ON public.registrations (event_id)
  WHERE bron = 'afc_ticket' AND cancelled_at IS NULL AND is_waitlisted = true;

-- Public status for registration page (capacity / waitlist / cv)
CREATE OR REPLACE FUNCTION public.get_event_ticket_status(p_event_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_confirmed int;
  v_waitlisted int;
  v_sold_out boolean;
BEGIN
  SELECT * INTO v_event
  FROM events
  WHERE ticket_slug = p_event_slug
    AND ticket_enabled = true
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT count(*)::int INTO v_confirmed
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND cancelled_at IS NULL
    AND coalesce(is_waitlisted, false) = false;

  SELECT count(*)::int INTO v_waitlisted
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND cancelled_at IS NULL
    AND coalesce(is_waitlisted, false) = true;

  v_sold_out := v_event.max_deelnemers IS NOT NULL AND v_confirmed >= v_event.max_deelnemers;

  RETURN jsonb_build_object(
    'eventId', v_event.id,
    'slug', v_event.ticket_slug,
    'cvRequired', coalesce(v_event.cv_required, true),
    'waitlistEnabled', coalesce(v_event.waitlist_enabled, false),
    'maxDeelnemers', v_event.max_deelnemers,
    'confirmedCount', v_confirmed,
    'waitlistCount', v_waitlisted,
    'soldOut', v_sold_out,
    'ticketIsOpen', coalesce(v_event.ticket_is_open, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_ticket_status(text) TO anon, authenticated;

-- Updated register: optional CV + waitlist when full
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
  v_waitlisted boolean := false;
  v_cv_required boolean;
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

  v_cv_required := coalesce(v_event.cv_required, true);
  IF v_cv_required AND (p_cv_path IS NULL OR length(trim(p_cv_path)) = 0) THEN
    RAISE EXCEPTION 'CV is verplicht voor dit event.';
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

  -- Count confirmed seats only (not waitlist)
  SELECT count(*)::int INTO v_count
  FROM registrations
  WHERE event_id = v_event.id
    AND bron = 'afc_ticket'::registratie_bron
    AND cancelled_at IS NULL
    AND coalesce(is_waitlisted, false) = false;

  IF v_event.max_deelnemers IS NOT NULL AND v_count >= v_event.max_deelnemers THEN
    IF coalesce(v_event.waitlist_enabled, false) THEN
      v_waitlisted := true;
    ELSE
      RAISE EXCEPTION 'Dit event is volzet.';
    END IF;
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
      is_waitlisted = v_waitlisted,
      registered_at = v_now,
      ingeschreven_op = v_now
    WHERE id = v_cancelled_id;
  ELSE
    INSERT INTO registrations (
      id, event_id, bron, email, naam, phone, extra_info, food_preference,
      cv_original_name, cv_path, ticket_token, ticket_code,
      checked_in, checked_in_at, cancelled_at, is_waitlisted, registered_at, ingeschreven_op
    ) VALUES (
      v_reg_id,
      v_event.id,
      'afc_ticket'::registratie_bron,
      lower(trim(p_email)),
      trim(p_name),
      trim(p_phone),
      coalesce(p_extra_info, ''),
      p_food_preference,
      p_cv_original_name,
      p_cv_path,
      p_ticket_token,
      left(p_ticket_token, 12),
      false,
      null,
      null,
      v_waitlisted,
      v_now,
      v_now
    );
  END IF;

  RETURN jsonb_build_object(
    'token', p_ticket_token,
    'eventSlug', v_event.ticket_slug,
    'waitlisted', v_waitlisted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_afc_ticket(text, text, text, text, text, text, text, text, text)
  TO anon, authenticated;

-- Promote one waitlist entry to a confirmed seat (admin / authenticated)
CREATE OR REPLACE FUNCTION public.promote_waitlist_registration(p_registration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg registrations%ROWTYPE;
  v_event events%ROWTYPE;
  v_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd.';
  END IF;

  SELECT * INTO v_reg
  FROM registrations
  WHERE id = p_registration_id
    AND bron = 'afc_ticket'::registratie_bron
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inschrijving niet gevonden.';
  END IF;

  IF v_reg.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'Deze inschrijving is geannuleerd.';
  END IF;

  IF coalesce(v_reg.is_waitlisted, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Deze persoon staat niet op de wachtlijst.';
  END IF;

  SELECT * INTO v_event FROM events WHERE id = v_reg.event_id LIMIT 1;

  SELECT count(*)::int INTO v_count
  FROM registrations
  WHERE event_id = v_reg.event_id
    AND bron = 'afc_ticket'::registratie_bron
    AND cancelled_at IS NULL
    AND coalesce(is_waitlisted, false) = false;

  IF v_event.max_deelnemers IS NOT NULL AND v_count >= v_event.max_deelnemers THEN
    RAISE EXCEPTION 'Geen vrije plaatsen om te promoveren.';
  END IF;

  UPDATE registrations
  SET is_waitlisted = false
  WHERE id = v_reg.id;

  RETURN jsonb_build_object(
    'id', v_reg.id,
    'email', v_reg.email,
    'naam', v_reg.naam,
    'promoted', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_waitlist_registration(uuid) TO authenticated;
