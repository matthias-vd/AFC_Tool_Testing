import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Event,
  EventFormData,
  EventStatus,
  Registration,
  Feedback,
  Domain,
  TallyRegistration,
  TicketTailorRegistration,
  FeedbackImport,
} from '../types/event';

export function useEvents(academicYearId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!academicYearId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sprekers(*),
          registrations(id),
          feedback(*),
          event_domains(domain_id, domains(*))
        `)
        .eq('academic_year_id', academicYearId)
        .is('deleted_at', null)
        .order('event_datum', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((e: any) => ({
        ...e,
        sprekers: e.event_sprekers || [],
        registraties: e.registrations || [],
        domains: e.event_domains?.map((ed: any) => ed.domains).filter(Boolean) || [],
      }));
      setEvents(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [academicYearId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

export function useEvent(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_sprekers(*),
          registrations(*),
          feedback(*),
          event_domains(domain_id, domains(*))
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent({
        ...data,
        sprekers: data.event_sprekers || [],
        registraties: data.registrations || [],
        domains: data.event_domains?.map((ed: any) => ed.domains).filter(Boolean) || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
}

export function useDomains() {
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    supabase.from('domains').select('*').order('naam').then(({ data }) => {
      if (data) setDomains(data);
    });
  }, []);

  return domains;
}

export function useEventMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async (
    academicYearId: string,
    formData: EventFormData,
  ): Promise<Event | null> => {
    setLoading(true);
    setError(null);
    try {
      const { sprekers, domain_ids, ...eventData } = formData;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const insertPayload = {
        academic_year_id: academicYearId,
        type: eventData.type,
        titel: eventData.titel,
        status: 'concept' as EventStatus,
        is_published: false,
        created_by: user.id,
        ...(eventData.beschrijving_website && { beschrijving_website: eventData.beschrijving_website }),
        ...(eventData.beschrijving_sociaal && { beschrijving_sociaal: eventData.beschrijving_sociaal }),
        ...(eventData.event_datum && { event_datum: eventData.event_datum }),
        ...(eventData.locatie && { locatie: eventData.locatie }),
        ...(eventData.max_deelnemers && { max_deelnemers: eventData.max_deelnemers }),
        ...(eventData.deuren_open && { deuren_open: eventData.deuren_open }),
        ...(eventData.start_tijd && { start_tijd: eventData.start_tijd }),
        ...(eventData.einde_tijd && { einde_tijd: eventData.einde_tijd }),
        ticket_enabled: eventData.ticket_enabled ?? false,
        ticket_is_open: eventData.ticket_is_open ?? false,
        ticket_slug: eventData.ticket_slug ?? null,
        ticket_intro: eventData.ticket_intro ?? null,
        registration_opens_at: eventData.registration_opens_at ?? null,
        registration_closes_at: eventData.registration_closes_at ?? null,
      };

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert(insertPayload)
        .select()
        .single();

      if (eventError) throw eventError;

      await supabase.from('event_rollen').insert({
        event_id: event.id,
        naam: 'Aanwezig',
        beschrijving: null,
        plaatsen: 999,
        is_default: true,
      });

      if (sprekers?.length) {
        await supabase.from('event_sprekers').insert(
          sprekers.map((s) => ({ ...s, event_id: event.id }))
        );
      }

      if (domain_ids?.length) {
        await supabase.from('event_domains').insert(
          domain_ids.map((d) => ({ event_id: event.id, domain_id: d }))
        );
      }

      return event;
    } catch (err: any) {
      console.error('createEvent error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (
    eventId: string,
    formData: Partial<EventFormData>,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { sprekers, domain_ids, ...eventData } = formData;

      const { error: eventError } = await supabase
        .from('events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (eventError) throw eventError;

      if (sprekers !== undefined) {
        await supabase.from('event_sprekers').delete().eq('event_id', eventId);
        if (sprekers.length) {
          await supabase.from('event_sprekers').insert(
            sprekers.map((s) => ({ ...s, event_id: eventId }))
          );
        }
      }

      if (domain_ids !== undefined) {
        await supabase.from('event_domains').delete().eq('event_id', eventId);
        if (domain_ids.length) {
          await supabase.from('event_domains').insert(
            domain_ids.map((d) => ({ event_id: eventId, domain_id: d }))
          );
        }
      }

      return true;
    } catch (err: any) {
      console.error('updateEvent error:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Verplaatst het event naar de prullenbak (soft delete) i.p.v. het echt te verwijderen. */
  const deleteEvent = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Zet een event terug uit de prullenbak. */
  const restoreEvent = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('events')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** Verwijdert een event definitief — enkel bedoeld voor items die al in de prullenbak zitten. */
  const permanentlyDeleteEvent = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (eventId: string, newStatus: EventStatus): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', eventId);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importTallyRegistrations = async (
    eventId: string,
    registrations: TallyRegistration[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const rows = registrations.map((r) => ({
        event_id: eventId,
        bron: 'tally',
        email: r.email || null,
        voornaam: r.first_name?.trim() || null,
        achternaam: r.last_name?.trim() || null,
        naam: `${r.first_name?.trim()} ${r.last_name?.trim()}`.trim() || null,
        faculteit: r.faculty || null,
        studiejaar: r.level_of_education || null,
        hoe_gevonden: r.activity_encounter || null,
        ingediend_op: r.submitted_at || null,
        checked_in: false,
        study_program: r.study_program || null,
      }));

      const { error } = await supabase.from('registrations').insert(rows);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importTicketTailorRegistrations = async (
    eventId: string,
    registrations: TicketTailorRegistration[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const rows = registrations.map((r) => {
        const row: Record<string, any> = {
          event_id: eventId,
          bron: 'ticket_tailor',
          checked_in: r.checked_in === 'Yes' || r.checked_in === 'true',
        };

        if (r.ticket_code)   row.ticket_code   = r.ticket_code;
        if (r.name)          row.naam          = r.name;
        if (r.email_address) row.email         = r.email_address;
        if (r.faculteit)     row.faculteit     = r.faculteit;
        if (r.hoe_gevonden)  row.hoe_gevonden  = r.hoe_gevonden;
        if (r.studiejaar)    row.studiejaar    = r.studiejaar;
        if (r.ingediend_op)  row.ingediend_op  = r.ingediend_op;
        if (r.ingeschreven_op) row.ingeschreven_op = r.ingeschreven_op;
        if (r.study_program) row.study_program = r.study_program;
        return row;
      });

      const { error } = await supabase
        .from('registrations')
        .upsert(rows, {
          onConflict: 'event_id,ticket_code',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint);
        throw error;
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importFeedback = async (
    eventId: string,
    feedbackItems: FeedbackImport[]
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const rows = feedbackItems.map((f) => ({
        event_id: eventId,
        email: f.email || null,
        schaal_1: f.vraag_1 ? Number(f.vraag_1) : null,
        schaal_2: f.vraag_2 ? Number(f.vraag_2) : null,
        schaal_3: f.vraag_3 ? Number(f.vraag_3) : null,
        wat_kon_beter: f.wat_kon_beter || null,
        favo_onderdeel: f.favo_onderdeel || null,
        andere_opmerkingen: f.andere_opmerkingen || null,
      }));

      const { error } = await supabase.from('feedback').insert(rows);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addManualRegistration = async (
    eventId: string,
    reg: Partial<Registration>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('registrations').insert({
        ...reg,
        event_id: eventId,
        bron: 'manueel',
        checked_in: false,
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addManualFeedback = async (
    eventId: string,
    fb: Partial<Feedback>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('feedback').insert({
        ...fb,
        event_id: eventId,
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importFromTicketTailorAPI = async (
    eventId: string,
    ticketTailorEventId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('tickettailor-proxy', {
        body: { eventId: ticketTailorEventId },
      });

      if (fnError) throw fnError;

      const allTickets = data.data;

      const rows = allTickets.map((t: any) => {
        const questions = t.custom_questions || [];
        const getAnswer = (q: string) =>
          questions.find((a: any) =>
            a.question?.toLowerCase().includes(q.toLowerCase())
          )?.answer || null;

        return {
          event_id: eventId,
          bron: 'ticket_tailor',
          ticket_code: t.barcode || null,
          naam: t.full_name || null,
          email: t.email || null,
          checked_in: t.checked_in === 'true',
          faculteit: getAnswer('faculteit') || null,
          hoe_gevonden: getAnswer('gevonden') || getAnswer('via') || null,
          studiejaar: getAnswer('studiejaar') || null,
          ingediend_op: t.created_at
            ? new Date(t.created_at * 1000).toISOString()
            : null,
        };
      });

      const { error } = await supabase
        .from('registrations')
        .upsert(rows, { onConflict: 'event_id,ticket_code', ignoreDuplicates: false });

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
    permanentlyDeleteEvent,
    advanceStatus,
    importTallyRegistrations,
    importTicketTailorRegistrations,
    importFeedback,
    addManualRegistration,
    addManualFeedback,
    importFromTicketTailorAPI,
  };
}