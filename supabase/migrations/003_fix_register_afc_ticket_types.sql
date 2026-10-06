-- Fix: ingeschreven_op is timestamptz, not text.
-- Re-run this after 001 if you already applied the old function.

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
  v_now timestamptz := now();
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
