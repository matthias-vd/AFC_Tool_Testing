import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckinScanner } from '@/components/ticketing/CheckinScanner';
import { AttendeeTable } from '@/components/ticketing/AttendeeTable';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import {
  computeTicketStats,
  updateEventTicketing,
  useTicketEvents,
  useTicketRegistrations,
} from '@/hooks/useTicketing';
import { isEventAcceptingRegistrations, ticketPublicPath } from '@/lib/ticketing';
import { EVENT_TYPE_LABELS } from '@/types/event';
import { toast } from 'sonner';

export default function Ticketing() {
  const { years } = useAcademicYears();
  const currentYear = years.find((y) => y.is_huidig);
  const { events, loading: eventsLoading, error, refetch: refetchEvents } =
    useTicketEvents(currentYear?.id);
  const { registrations, loading: regsLoading, refetch: refetchRegs } =
    useTicketRegistrations('all');

  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => computeTicketStats(registrations), [registrations]);

  const yearRegs = useMemo(() => {
    const ids = new Set(events.map((e) => e.id));
    return registrations.filter((r) => ids.has(r.event_id));
  }, [registrations, events]);

  const yearStats = useMemo(() => computeTicketStats(yearRegs), [yearRegs]);

  async function toggleOpen(eventId: string, currentlyOpen: boolean) {
    setBusyId(eventId);
    try {
      await updateEventTicketing(eventId, { ticket_is_open: !currentlyOpen });
      toast.success(currentlyOpen ? 'Inschrijvingen gesloten' : 'Inschrijvingen geopend');
      await refetchEvents();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update mislukt');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#041c3a] shadow-md">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#041c3a]">Ticketing</h1>
              <p className="mt-1 text-sm text-slate-500">
                Publieke inschrijvingen, QR-tickets en check-in — gesynchroniseerd met Evenementen
                {currentYear ? ` · ${currentYear.naam}` : ''}.
              </p>
              <div className="mt-2 h-0.5 w-24 bg-gradient-to-r from-[#041c3a] to-[#ed6425] rounded-full" />
            </div>
          </div>
          <Button asChild className="bg-[#ed6425] hover:bg-[#d5571f] text-white">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Publieke inschrijving
            </a>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Inschrijvingen', value: yearStats.total },
            { label: 'Aanwezig', value: yearStats.checkedIn },
            { label: 'Uitgeschreven', value: yearStats.cancelled },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-black text-[#041c3a]">{card.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Kon ticket-data niet laden</p>
              <p className="mt-1 text-amber-800/80">
                {error}. Heb je de SQL-migratie{' '}
                <code className="text-xs bg-amber-100 px-1 rounded">
                  supabase/migrations/001_ticketing.sql
                </code>{' '}
                al uitgevoerd?
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="events" className="gap-1.5">
              <Ticket className="h-3.5 w-3.5" /> Events
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-1.5">
              <QrCode className="h-3.5 w-3.5" /> Scanner
            </TabsTrigger>
            <TabsTrigger value="deelnemers" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Deelnemers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <p className="text-sm text-slate-500">
              Events met ticketing aan. Schakel ticketing in via{' '}
              <Link to="/evenementen" className="font-semibold text-[#ed6425] hover:underline">
                Evenementen
              </Link>{' '}
              → event bewerken → sectie Ticketing.
            </p>

            {eventsLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-8">
                <Loader2 className="h-4 w-4 animate-spin" /> Laden…
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[#041c3a]">Nog geen ticket-events</p>
                <p className="mt-2 text-sm text-slate-500">
                  Open een event of workshop in Evenementen en zet ticketing aan.
                </p>
                <Button asChild className="mt-5 bg-[#041c3a] text-white hover:bg-[#041c3a]/90">
                  <Link to="/evenementen">Naar Evenementen</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {events.map((event) => {
                  const open = isEventAcceptingRegistrations(event);
                  const eventRegs = registrations.filter((r) => r.event_id === event.id);
                  const s = computeTicketStats(eventRegs);
                  return (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-[#041c3a] text-white border-0 text-[10px] uppercase">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                          {open ? (
                            <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                              Open
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500">
                              Gesloten
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1.5 font-bold text-[#041c3a] truncate">{event.titel}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {s.total} inschrijvingen · {s.checkedIn} aanwezig
                          {event.ticket_slug ? ` · /events/${event.ticket_slug}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.ticket_slug && (
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={ticketPublicPath(event.ticket_slug)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Link
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === event.id}
                          onClick={() => toggleOpen(event.id, Boolean(event.ticket_is_open))}
                          className="gap-1.5"
                        >
                          {event.ticket_is_open ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-emerald-500" /> Sluiten
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4" /> Openen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Totaal platform (alle jaren): {stats.total} ticket-inschrijvingen.
            </p>
          </TabsContent>

          <TabsContent value="scanner">
            <CheckinScanner events={events} />
          </TabsContent>

          <TabsContent value="deelnemers">
            <AttendeeTable
              events={events}
              registrations={yearRegs}
              loading={regsLoading}
              onChange={refetchRegs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
