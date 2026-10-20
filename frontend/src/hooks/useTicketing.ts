import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FOOD_OPTIONS } from '@/lib/food';
import {
  isEventAcceptingRegistrations,
  mintTicketToken,
  parseTicketPayload,
} from '@/lib/ticketing';
import type { Event, TicketRegistration } from '@/types/event';

const CV_BUCKET = 'ticket-cvs';
const MAX_CV_BYTES = 15 * 1024 * 1024;

export type TicketEventStats = {
  eventId: string;
  total: number;
  checkedIn: number;
  cancelled: number;
};

export function useTicketEvents(academicYearId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('ticket_enabled', true)
        .is('deleted_at', null)
        .order('event_datum', { ascending: true });

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      const { data, error: qError } = await query;
      if (qError) throw qError;
      setEvents((data as Event[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kon ticket-events niet laden');
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

/** Public: open events for registration (no auth). */
export function usePublicOpenEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: qError } = await supabase
          .from('events')
          .select('*')
          .eq('ticket_enabled', true)
          .eq('ticket_is_open', true)
          .is('deleted_at', null)
          .order('event_datum', { ascending: true });
        if (qError) throw qError;
        if (cancelled) return;
        const open = ((data as Event[]) || []).filter(isEventAcceptingRegistrations);
        setEvents(open);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Laden mislukt');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, error };
}

export function usePublicPastEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('ticket_enabled', true)
        .is('deleted_at', null)
        .order('event_datum', { ascending: false });

      const now = Date.now();
      const past = ((data as Event[]) || []).filter((e) => {
        if (isEventAcceptingRegistrations(e)) return false;
        if (!e.event_datum) return !e.ticket_is_open;
        return new Date(e.event_datum).getTime() < now || !e.ticket_is_open;
      });
      setEvents(past);
      setLoading(false);
    })();
  }, []);

  return { events, loading };
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('ticket_slug', slug)
    .eq('ticket_enabled', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data as Event | null;
}

export async function fetchRegistrationByToken(
  token: string,
): Promise<{ registration: TicketRegistration; event: Event } | null> {
  const { data, error } = await supabase.rpc('get_ticket_by_token', {
    p_token: token,
  });
  if (error) throw error;
  if (!data) return null;
  const payload = data as { registration: TicketRegistration; event: Event };
  if (!payload.registration || !payload.event) return null;
  return { registration: payload.registration, event: payload.event };
}

export type RegisterInput = {
  eventSlug: string;
  name: string;
  email: string;
  phone: string;
  foodPreference: string;
  extraInfo: string;
  cvFile?: File | null;
  /** When true, allow signup onto waitlist if sold out (server still enforces). */
  allowWaitlist?: boolean;
};

export type EventTicketStatus = {
  eventId: string;
  slug: string;
  cvRequired: boolean;
  waitlistEnabled: boolean;
  maxDeelnemers: number | null;
  confirmedCount: number;
  waitlistCount: number;
  soldOut: boolean;
  ticketIsOpen: boolean;
};

export async function fetchEventTicketStatus(
  slug: string,
): Promise<EventTicketStatus | null> {
  const { data, error } = await supabase.rpc('get_event_ticket_status', {
    p_event_slug: slug,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as EventTicketStatus;
}

export async function registerForEvent(
  input: RegisterInput,
): Promise<{ token: string; eventSlug: string; waitlisted: boolean }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const extraInfo = input.extraInfo.trim();
  const foodPreference = input.foodPreference;

  if (name.length < 2) throw new Error('Vul je naam in.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Vul een geldig e-mailadres in.');
  }
  if (phone.length < 8) throw new Error('Vul een geldig telefoonnummer in.');
  if (!FOOD_OPTIONS.some((o) => o.value === foodPreference)) {
    throw new Error('Kies een voedselvoorkeur.');
  }
  if (foodPreference === 'andere' && extraInfo.length < 2) {
    throw new Error('Vul bij Extra info toe wat je bedoelt met ‘Andere’.');
  }

  const event = await fetchEventBySlug(input.eventSlug);
  if (!event || !isEventAcceptingRegistrations(event)) {
    throw new Error('Inschrijvingen voor dit event zijn gesloten.');
  }

  const status = await fetchEventTicketStatus(input.eventSlug);
  const cvRequired = status?.cvRequired ?? event.cv_required ?? true;
  const soldOut = status?.soldOut ?? false;
  const waitlistEnabled = status?.waitlistEnabled ?? event.waitlist_enabled ?? false;

  if (soldOut && !waitlistEnabled) {
    throw new Error('Dit event is volzet.');
  }
  if (soldOut && waitlistEnabled && !input.allowWaitlist) {
    throw new Error('Dit event is volzet. Je kunt je op de wachtlijst zetten.');
  }

  if (cvRequired) {
    if (!input.cvFile || input.cvFile.type !== 'application/pdf') {
      throw new Error('Upload een CV als PDF.');
    }
    if (input.cvFile.size > MAX_CV_BYTES) {
      throw new Error('CV mag maximaal 15 MB zijn.');
    }
  } else if (input.cvFile?.size) {
    if (input.cvFile.type !== 'application/pdf') {
      throw new Error('CV moet een PDF zijn.');
    }
    if (input.cvFile.size > MAX_CV_BYTES) {
      throw new Error('CV mag maximaal 15 MB zijn.');
    }
  }

  const token = mintTicketToken();
  const registrationId = crypto.randomUUID();
  let cvPath: string | null = null;
  let cvOriginalName: string | null = null;

  if (input.cvFile?.size) {
    cvPath = `${event.id}/${registrationId}.pdf`;
    cvOriginalName = input.cvFile.name;
    const { error: uploadError } = await supabase.storage
      .from(CV_BUCKET)
      .upload(cvPath, input.cvFile, { contentType: 'application/pdf', upsert: true });
    if (uploadError) {
      throw new Error('CV uploaden mislukt: ' + uploadError.message);
    }
  }

  const { data, error } = await supabase.rpc('register_afc_ticket', {
    p_event_slug: input.eventSlug,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_food_preference: foodPreference,
    p_extra_info: extraInfo,
    p_cv_original_name: cvOriginalName,
    p_cv_path: cvPath,
    p_ticket_token: token,
  });

  if (!error && data) {
    const result = data as { token: string; eventSlug: string; waitlisted?: boolean };
    return {
      token: result.token,
      eventSlug: result.eventSlug,
      waitlisted: Boolean(result.waitlisted),
    };
  }

  if (cvPath) {
    await supabase.storage.from(CV_BUCKET).remove([cvPath]);
  }
  const rpcMessage = error?.message ?? '';
  throw new Error(
    rpcMessage.replace(/^.*ERROR:\s*/i, '').split('\n')[0] || 'Inschrijven mislukt.',
  );
}

export async function promoteWaitlistRegistration(registrationId: string) {
  const { data, error } = await supabase.rpc('promote_waitlist_registration', {
    p_registration_id: registrationId,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; email: string; naam: string; promoted: boolean };
}

export async function cancelRegistration(token: string): Promise<void> {
  const { data, error } = await supabase.rpc('cancel_ticket_by_token', {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Ticket niet gevonden.');
}

export function useTicketRegistrations(eventId?: string | 'all') {
  const [registrations, setRegistrations] = useState<TicketRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('registrations')
        .select('*')
        .eq('bron', 'afc_ticket')
        .order('registered_at', { ascending: false });

      if (eventId && eventId !== 'all') {
        query = query.eq('event_id', eventId);
      }

      const { data, error: qError } = await query;
      if (qError) throw qError;
      setRegistrations((data as TicketRegistration[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchRegs();
  }, [fetchRegs]);

  return { registrations, loading, error, refetch: fetchRegs };
}

export async function checkInByPayload(opts: {
  payload?: string;
  email?: string;
  eventId?: string;
}): Promise<{
  name: string;
  alreadyCheckedIn: boolean;
  foodPreference?: string;
}> {
  let registration: TicketRegistration | null = null;

  if (opts.payload) {
    const token = parseTicketPayload(opts.payload);
    if (!token) throw new Error('Ongeldige QR-code.');
    let query = supabase
      .from('registrations')
      .select('*')
      .eq('ticket_token', token)
      .eq('bron', 'afc_ticket');
    if (opts.eventId) query = query.eq('event_id', opts.eventId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    registration = data as TicketRegistration | null;
  } else if (opts.email) {
    let query = supabase
      .from('registrations')
      .select('*')
      .eq('bron', 'afc_ticket')
      .ilike('email', opts.email.trim())
      .is('cancelled_at', null);
    if (opts.eventId) query = query.eq('event_id', opts.eventId);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) throw new Error('Geen inschrijving gevonden.');
    if (data.length > 1) {
      throw new Error('Meerdere events — selecteer eerst een event-filter.');
    }
    registration = data[0] as TicketRegistration;
  } else {
    throw new Error('Geen ticket of e-mail opgegeven.');
  }

  if (!registration) throw new Error('Ticket niet gevonden.');
  if (registration.cancelled_at) {
    throw new Error('Deze inschrijving is geannuleerd.');
  }
  if (registration.is_waitlisted) {
    throw new Error('Deze persoon staat op de wachtlijst (geen geldig ticket).');
  }

  if (registration.checked_in_at || registration.checked_in) {
    return {
      name: registration.naam ?? registration.email,
      alreadyCheckedIn: true,
      foodPreference: registration.food_preference ?? undefined,
    };
  }

  const now = new Date().toISOString();
  const { error: upd } = await supabase
    .from('registrations')
    .update({ checked_in: true, checked_in_at: now })
    .eq('id', registration.id);
  if (upd) throw new Error(upd.message);

  return {
    name: registration.naam ?? registration.email,
    alreadyCheckedIn: false,
    foodPreference: registration.food_preference ?? undefined,
  };
}

export async function setCheckIn(registrationId: string, checkedIn: boolean) {
  const { error } = await supabase
    .from('registrations')
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq('id', registrationId);
  if (error) throw error;
}

export async function deleteTicketRegistration(registrationId: string) {
  const { data } = await supabase
    .from('registrations')
    .select('cv_path')
    .eq('id', registrationId)
    .maybeSingle();

  if (data?.cv_path) {
    await supabase.storage.from(CV_BUCKET).remove([data.cv_path]);
  }

  const { error } = await supabase.from('registrations').delete().eq('id', registrationId);
  if (error) throw error;
}

export async function getCvSignedUrl(cvPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(cvPath, 60 * 10);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'CV niet beschikbaar');
  return data.signedUrl;
}

export async function updateEventTicketing(
  eventId: string,
  patch: Partial<
    Pick<
      Event,
      | 'ticket_enabled'
      | 'ticket_slug'
      | 'ticket_intro'
      | 'ticket_is_open'
      | 'registration_opens_at'
      | 'registration_closes_at'
      | 'ticket_image_path'
      | 'cv_required'
      | 'waitlist_enabled'
    >
  >,
) {
  const { error } = await supabase
    .from('events')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
}

export function computeTicketStats(registrations: TicketRegistration[]): {
  total: number;
  checkedIn: number;
  cancelled: number;
  waitlisted: number;
} {
  const active = registrations.filter((r) => !r.cancelled_at);
  const confirmed = active.filter((r) => !r.is_waitlisted);
  return {
    total: confirmed.length,
    checkedIn: confirmed.filter((r) => r.checked_in || r.checked_in_at).length,
    cancelled: registrations.filter((r) => r.cancelled_at).length,
    waitlisted: active.filter((r) => r.is_waitlisted).length,
  };
}
