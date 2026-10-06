import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '@/components/ticketing/PublicLayout';
import { RegisterForm } from '@/components/ticketing/RegisterForm';
import { fetchEventBySlug } from '@/hooks/useTicketing';
import { formatEventDate } from '@/lib/datetime';
import { isEventAcceptingRegistrations, ticketHomePath } from '@/lib/ticketing';
import type { Event } from '@/types/event';
import { supabase } from '@/lib/supabase';

function imageUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = supabase.storage.from('ticket-images').getPublicUrl(path);
  return data.publicUrl;
}

export default function PublicEventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchEventBySlug(slug);
        setEvent(data);
        if (!data) setError('Event niet gevonden.');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-4">
          <p className="text-muted">Laden…</p>
        </main>
      </PublicLayout>
    );
  }

  if (error || !event) {
    return (
      <PublicLayout>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-4">
          <p className="rounded-[28px] border border-accent/30 bg-accent/10 px-6 py-8 text-accent">
            {error ?? 'Event niet gevonden.'}
          </p>
          <p className="mt-8">
            <Link to={ticketHomePath()} className="text-sm text-muted hover:text-ink">
              ← Alle events
            </Link>
          </p>
        </main>
      </PublicLayout>
    );
  }

  const open = isEventAcceptingRegistrations(event);
  const description = (event.beschrijving_website ?? '').trim();
  const img = imageUrl(event.ticket_image_path);
  const when = event.event_datum
    ? event.start_tijd
      ? `${event.event_datum}T${event.start_tijd}`
      : event.event_datum
    : null;

  return (
    <PublicLayout>
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <section className="max-w-xl pt-4">
          {img ? (
            <img
              src={img}
              alt=""
              className="mb-8 h-56 w-full rounded-[28px] object-cover"
            />
          ) : null}
          <p className="text-sm tracking-[0.18em] uppercase text-accent">
            {open ? 'Live inschrijving' : 'Inschrijving gesloten'}
          </p>
          <h1 className="serif mt-4 text-5xl leading-[1.05] sm:text-6xl">
            {event.titel}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-muted">
            {event.ticket_intro || description || 'Schrijf je in voor dit event.'}
          </p>
          {description && event.ticket_intro ? (
            <div className="mt-6 max-w-md whitespace-pre-wrap text-base leading-8 text-ink">
              {description}
            </div>
          ) : null}
          <dl className="mt-10 grid gap-5 text-sm">
            {when ? (
              <div>
                <dt className="text-muted">Wanneer</dt>
                <dd className="mt-1 text-base">{formatEventDate(when)}</dd>
              </div>
            ) : null}
            {event.locatie ? (
              <div>
                <dt className="text-muted">Waar</dt>
                <dd className="mt-1 text-base">{event.locatie}</dd>
              </div>
            ) : null}
            {(event.registration_opens_at || event.registration_closes_at) && (
              <div>
                <dt className="text-muted">Inschrijfperiode</dt>
                <dd className="mt-1 text-base">
                  {event.registration_opens_at
                    ? formatEventDate(event.registration_opens_at)
                    : 'Nu'}
                  {' → '}
                  {event.registration_closes_at
                    ? formatEventDate(event.registration_closes_at)
                    : 'geen einddatum'}
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-8">
            <Link to={ticketHomePath()} className="text-sm text-muted hover:text-ink">
              ← Alle events
            </Link>
          </p>
        </section>
        <section className="rounded-[28px] border border-line bg-card p-6 sm:p-8">
          {open && event.ticket_slug ? (
            <>
              <h2 className="serif text-3xl">Je gegevens</h2>
              <p className="mt-2 mb-8 text-sm text-muted">
                Alle velden zijn verplicht, behalve extra info (tenzij je “Andere” kiest bij
                eten).
              </p>
              <RegisterForm eventSlug={event.ticket_slug} />
            </>
          ) : (
            <>
              <h2 className="serif text-3xl">Niet beschikbaar</h2>
              <p className="mt-4 text-muted">
                Inschrijven voor dit event is momenteel niet mogelijk.
              </p>
              <Link
                to="/afgelopen"
                className="mt-8 inline-flex rounded-full border border-line px-5 py-3 text-sm font-semibold"
              >
                Bekijk afgelopen events
              </Link>
            </>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
