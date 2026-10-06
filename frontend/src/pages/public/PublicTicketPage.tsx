import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '@/components/ticketing/PublicLayout';
import { TicketCard } from '@/components/ticketing/TicketCard';
import { fetchRegistrationByToken } from '@/hooks/useTicketing';
import type { Event, TicketRegistration } from '@/types/event';

export default function PublicTicketPage() {
  const { eventSlug, token } = useParams<{ eventSlug: string; token: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('nieuw') === '1';
  const emailSent =
    searchParams.get('mail') === '1' ? true : searchParams.get('mail') === '0' ? false : null;

  const [registration, setRegistration] = useState<TicketRegistration | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const decoded = decodeURIComponent(token);
    (async () => {
      setLoading(true);
      try {
        const result = await fetchRegistrationByToken(decoded);
        if (!result) {
          setError('Ticket niet gevonden.');
          return;
        }
        setRegistration(result.registration);
        setEvent(result.event);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-4">
        {loading && <p className="text-muted">Ticket laden…</p>}
        {error && (
          <p className="rounded-[28px] border border-accent/30 bg-accent/10 px-6 py-8 text-accent">
            {error}
          </p>
        )}
        {registration && event && (
          <TicketCard
            eventName={event.titel}
            eventSlug={event.ticket_slug || eventSlug || ''}
            registration={registration}
            isNew={isNew}
            emailSent={emailSent}
          />
        )}
      </main>
    </PublicLayout>
  );
}
