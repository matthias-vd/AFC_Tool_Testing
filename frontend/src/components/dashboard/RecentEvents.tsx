import { useEffect, useState } from 'react';
import { MapPin, Users, ArrowRight, CalendarDays, ExternalLink } from 'lucide-react';
import { data, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { EventWithCount } from '@/types';
import { StatusBadge } from '@/components/ui/badges';
import { TypeBadge } from '@/components/ui/badges';

function formatDatum(datum: string | null): string {
  if (!datum) return '—';
  return new Date(datum).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-5 py-3.5">
          <div
            className="h-3.5 rounded-full bg-zinc-100 animate-pulse"
            style={{ width: `${50 + i * 7}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// Statuses that are "editable" — clicking opens the drawer on the events page
const EDITABLE_STATUSES = new Set(['concept', 'voorbereid', 'actief']);

export function RecentEvents() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(8);

      setEvents((data as EventWithCount[]) ?? []);
      setLoading(false);
    }

    fetchEvents();
  }, []);
  
  function handleRowClick(event: EventWithCount) {
    if (!EDITABLE_STATUSES.has(event.status)) return;
    // Navigate to evenementen page with the event id as a query param
    // EvenementenPage (or EventsOverview) can read ?event=<id> to open the drawer
    navigate(`/evenementen?event=${event.id}`);
  }

  return (
    <section>
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-0.5 rounded-full bg-[#ed6425]" />
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
            Recente evenementen
          </h2>
        </div>

        <button
          onClick={() => navigate('/evenementen')}
          className="flex items-center gap-1 text-[11px] font-medium text-[#ed6425] hover:text-[#c2410c] transition-colors"
        >
          Alle evenementen
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm shadow-zinc-900/4">
        {events.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#041c3a]/5 border border-[#041c3a]/8">
              <CalendarDays className="h-6 w-6 text-[#041c3a]/40" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#041c3a]">Nog geen evenementen</p>
              <p className="text-xs text-zinc-400 mt-1">
                Maak je eerste evenement aan via "Nieuw evenement".
              </p>
            </div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Titel
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden md:table-cell">
                    Datum
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden lg:table-cell">
                    Locatie
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:table-cell">
                    Inschrijvingen
                  </th>
                  {/* Extra col for the "open" affordance */}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/80">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : events.map((event) => {
                      const isEditable = EDITABLE_STATUSES.has(event.status);
                      return (
                        <tr
                          key={event.id}
                          onClick={() => handleRowClick(event)}
                          className={[
                            'group transition-colors',
                            isEditable
                              ? 'cursor-pointer hover:bg-[#041c3a]/[0.03]'
                              : 'cursor-default hover:bg-zinc-50/60',
                          ].join(' ')}
                        >
                          {/* Title */}
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-[#041c3a] truncate max-w-[200px] text-[13px]">
                              {event.titel}
                            </p>
                            {event.domeinen?.length > 0 && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-[200px] mt-0.5">
                                {event.domeinen.slice(0, 2).join(' · ')}
                                {event.domeinen.length > 2 && (
                                  <span className="text-zinc-300"> +{event.domeinen.length - 2}</span>
                                )}
                              </p>
                            )}
                          </td>

                          {/* Type */}
                          <td className="px-5 py-3.5">
                            <TypeBadge type={event.type} />
                          </td>

                          {/* Datum */}
                          <td className="px-5 py-3.5 text-[12px] text-zinc-500 hidden md:table-cell whitespace-nowrap font-medium tabular-nums">
                            {formatDatum(event.event_datum)}
                          </td>

                          {/* Locatie */}
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            {event.locatie ? (
                              <span className="flex items-center gap-1.5 text-zinc-500 text-[12px]">
                                <MapPin className="h-3 w-3 shrink-0 text-[#ed6425]" />
                                <span className="truncate max-w-[140px]">{event.locatie}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-200 text-xs">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <StatusBadge status={event.status} />
                          </td>

                          {/* Inschrijvingen */}
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <div className="flex items-center justify-end gap-1.5 text-zinc-500">
                              <Users className="h-3.5 w-3.5 text-zinc-300" />
                              <span className="tabular-nums text-[12px] font-semibold text-[#041c3a]">
                                {event.registratie_aantal}
                              </span>
                              {event.max_deelnemers && (
                                <span className="text-[11px] text-zinc-300 font-normal">
                                  / {event.max_deelnemers}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Open arrow — only shown for editable statuses */}
                          <td className="pr-4">
                            {isEditable && (
                              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 group-hover:text-[#ed6425] transition-colors" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>

            {/* Subtle hint below table */}
            {!loading && events.some((e) => EDITABLE_STATUSES.has(e.status)) && (
              <div className="px-5 py-2.5 border-t border-zinc-100 bg-zinc-50/50">
                <p className="text-[11px] text-zinc-400">
                  Klik op een concept of voorbereid evenement om het meteen te bewerken.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}