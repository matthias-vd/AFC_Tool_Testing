import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/ticketing/PublicLayout';
import { usePublicOpenEvents } from '@/hooks/useTicketing';
import { formatEventDate } from '@/lib/datetime';
import { ticketPublicPath } from '@/lib/ticketing';
import { supabase } from '@/lib/supabase';

function imageUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = supabase.storage.from('ticket-images').getPublicUrl(path);
  return data.publicUrl;
}

function eventWhen(event: {
  event_datum?: string;
  start_tijd?: string;
}): string | null {
  if (!event.event_datum) return null;
  return event.start_tijd
    ? `${event.event_datum}T${event.start_tijd}`
    : event.event_datum;
}

export default function PublicEventsPage() {
  const { events, loading, error } = usePublicOpenEvents();

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
        <section className="max-w-2xl pt-4">
          <p className="text-sm tracking-[0.18em] uppercase text-accent">
            Beschikbare events
          </p>
          <h1 className="serif mt-4 text-5xl leading-[1.05] sm:text-6xl">
            Kies een event
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Hieronder zie je alle events waarvoor je nu kunt inschrijven.
          </p>
        </section>

        {loading ? (
          <p className="mt-10 text-muted">Laden…</p>
        ) : error ? (
          <p className="mt-10 rounded-[28px] border border-accent/30 bg-accent/10 px-6 py-8 text-accent">
            {error}
          </p>
        ) : events.length === 0 ? (
          <p className="mt-10 rounded-[28px] border border-line bg-card px-6 py-8 text-muted">
            Er zijn momenteel geen events open voor inschrijving.
          </p>
        ) : (
          <section className="mt-10 grid gap-5 md:grid-cols-2">
            {events.map((event) => {
              const img = imageUrl(event.ticket_image_path);
              const when = eventWhen(event);
              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[28px] border border-line bg-card"
                >
                  {img ? (
                    <img src={img} alt="" className="h-48 w-full object-cover" />
                  ) : null}
                  <div className="p-6 sm:p-8">
                    <p className="text-sm tracking-[0.18em] uppercase text-accent">
                      Open voor inschrijving
                    </p>
                    <h2 className="serif mt-3 text-3xl">{event.titel}</h2>
                    <p className="mt-4 text-muted">
                      {event.ticket_intro ||
                        event.beschrijving_website ||
                        'Schrijf je in voor dit event.'}
                    </p>
                    <dl className="mt-6 grid gap-3 text-sm">
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
                    </dl>
                    {event.ticket_slug ? (
                      <Link
                        to={ticketPublicPath(event.ticket_slug)}
                        className="mt-7 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-card"
                      >
                        Inschrijven
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-12">
          <Link to="/afgelopen" className="text-sm font-semibold text-forest">
            Bekijk afgelopen events →
          </Link>
        </p>
      </main>
    </PublicLayout>
  );
}
