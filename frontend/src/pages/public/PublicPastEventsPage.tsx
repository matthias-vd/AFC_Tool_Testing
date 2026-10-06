import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/ticketing/PublicLayout';
import { usePublicPastEvents } from '@/hooks/useTicketing';
import { formatEventDate } from '@/lib/datetime';
import { ticketHomePath } from '@/lib/ticketing';
import { supabase } from '@/lib/supabase';

function imageUrl(path: string | null | undefined) {
  if (!path) return null;
  const { data } = supabase.storage.from('ticket-images').getPublicUrl(path);
  return data.publicUrl;
}

export default function PublicPastEventsPage() {
  const { events, loading } = usePublicPastEvents();

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
        <section className="max-w-2xl pt-4">
          <p className="text-sm tracking-[0.18em] uppercase text-accent">Archief</p>
          <h1 className="serif mt-4 text-5xl leading-[1.05] sm:text-6xl">
            Afgelopen events
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted">
            Eerdere AFC-activiteiten. Voor deze events kun je niet meer inschrijven.
          </p>
        </section>

        {loading ? (
          <p className="mt-10 text-muted">Laden…</p>
        ) : events.length === 0 ? (
          <p className="mt-10 rounded-[28px] border border-line bg-card px-6 py-8 text-muted">
            Er zijn nog geen gearchiveerde events.
          </p>
        ) : (
          <section className="mt-10 grid gap-5 md:grid-cols-2">
            {events.map((event) => {
              const img = imageUrl(event.ticket_image_path);
              const when = event.event_datum
                ? event.start_tijd
                  ? `${event.event_datum}T${event.start_tijd}`
                  : event.event_datum
                : null;
              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[28px] border border-line bg-card"
                >
                  {img ? (
                    <img src={img} alt="" className="h-44 w-full object-cover" />
                  ) : null}
                  <div className="p-6 sm:p-8">
                    <p className="text-sm tracking-[0.18em] uppercase text-muted">
                      Afgelopen
                    </p>
                    <h2 className="serif mt-3 text-3xl">{event.titel}</h2>
                    <p className="mt-4 text-muted">
                      {event.ticket_intro || event.beschrijving_website}
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
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="mt-10">
          <Link to={ticketHomePath()} className="text-sm font-semibold text-forest">
            ← Terug naar openstaande events
          </Link>
        </p>
      </main>
    </PublicLayout>
  );
}
