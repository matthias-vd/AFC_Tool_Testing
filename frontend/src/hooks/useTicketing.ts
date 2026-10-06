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
  cvFile: File;
};

export async function registerForEvent(
  input: RegisterInput,
): Promise<{ token: string; eventSlug: string }> {
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
  if (!input.cvFile || input.cvFile.type !== 'application/pdf') {
    throw new Error('Upload een CV als PDF.');
  }
  if (input.cvFile.size > MAX_CV_BYTES) {
    throw new Error('CV mag maximaal 15 MB zijn.');
  }

  const event = await fetchEventBySlug(input.eventSlug);
  if (!event || !isEventAcceptingRegistrations(event)) {
    throw new Error('Inschrijvingen voor dit event zijn gesloten.');
  }

  const token = mintTicketToken();
  const registrationId = crypto.randomUUID();
  const cvPath = `${event.id}/${registrationId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(cvPath, input.cvFile, { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    throw new Error('CV uploaden mislukt: ' + uploadError.message);
  }

  const { data, error } = await supabase.rpc('register_afc_ticket', {
    p_event_slug: input.eventSlug,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_food_preference: foodPreference,
    p_extra_info: extraInfo,
    p_cv_original_name: input.cvFile.name,
    p_cv_path: cvPath,
    p_ticket_token: token,
  });

  if (!error && data) {
    const result = data as { token: string; eventSlug: string };
    return { token: result.token, eventSlug: result.eventSlug };
  }

  const rpcMessage = error?.message ?? '';
  const rpcNeedsFallback = /timestamp|type text|ingeschreven_op|rewrite or cast/i.test(
    rpcMessage,
  );

  // Fallback when DB function still has the old text cast (run 003_fix_*.sql to fix).
  if (!rpcNeedsFallback) {
    await supabase.storage.from(CV_BUCKET).remove([cvPath]);
    throw new Error(rpcMessage.replace(/^.*ERROR:\s*/i, '').split('\n')[0] || 'Inschrijven mislukt.');
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from('registrations').insert({
    id: registrationId,
    event_id: event.id,
    bron: 'afc_ticket',
    email,
    naam: name,
    phone,
    extra_info: extraInfo,
    food_preference: foodPreference,
    cv_original_name: input.cvFile.name,
    cv_path: cvPath,
    ticket_token: token,
    ticket_code: token.slice(0, 12),
    checked_in: false,
    checked_in_at: null,
    cancelled_at: null,
    registered_at: now,
    ingeschreven_op: now,
  });

  if (insertError) {
    await supabase.storage.from(CV_BUCKET).remove([cvPath]);
    if (/duplicate|unique/i.test(insertError.message)) {
      throw new Error('Dit e-mailadres is al ingeschreven voor dit event.');
    }
    throw new Error(insertError.message);
  }

  return { token, eventSlug: event.ticket_slug! };
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
} {
  const active = registrations.filter((r) => !r.cancelled_at);
  return {
    total: active.length,
    checkedIn: active.filter((r) => r.checked_in || r.checked_in_at).length,
    cancelled: registrations.filter((r) => r.cancelled_at).length,
  };
}
