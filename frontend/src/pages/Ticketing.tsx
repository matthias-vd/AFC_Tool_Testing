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
  Mail,
  ListOrdered,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckinScanner } from '@/components/ticketing/CheckinScanner';
import { AttendeeTable } from '@/components/ticketing/AttendeeTable';
import { BulkMailDialog } from '@/components/ticketing/BulkMailDialog';
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
import type { MailAudience } from '@/lib/mail';

export default function Ticketing() {
  const { years } = useAcademicYears();
  const currentYear = years.find((y) => y.is_huidig);
  const { events, loading: eventsLoading, error, refetch: refetchEvents } =
    useTicketEvents(currentYear?.id);
  const { registrations, loading: regsLoading, refetch: refetchRegs } =
    useTicketRegistrations('all');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailEventId, setMailEventId] = useState<string | undefined>();
  const [mailAudience, setMailAudience] = useState<MailAudience>('confirmed');

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

  async function toggleFlag(
    eventId: string,
    field: 'cv_required' | 'waitlist_enabled',
    currently: boolean,
  ) {
    setBusyId(`${eventId}-${field}`);
    try {
      await updateEventTicketing(eventId, { [field]: !currently });
      toast.success(
        field === 'cv_required'
          ? currently
            ? 'CV niet meer verplicht'
            : 'CV opnieuw verplicht'
          : currently
            ? 'Wachtlijst uitgeschakeld'
            : 'Wachtlijst ingeschakeld',
      );
      await refetchEvents();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update mislukt');
    } finally {
      setBusyId(null);
    }
  }

  function openMail(eventId: string, audience: MailAudience) {
    setMailEventId(eventId);
    setMailAudience(audience);
    setMailOpen(true);
  }

  return (
    <AppLayout
      title="Ticketing"
      subtitle={
        currentYear
          ? `Inschrijvingen, scanner, wachtlijst en mail · ${currentYear.naam}`
          : 'Inschrijvingen, scanner, wachtlijst en mail'
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-8"
            disabled={events.length === 0}
            onClick={() => {
              setMailEventId(events[0]?.id);
              setMailAudience('confirmed');
              setMailOpen(true);
            }}
          >
            <Mail className="h-3.5 w-3.5" /> Bulkmail
          </Button>
          <Button asChild className="h-8 bg-[#ed6425] text-white hover:bg-[#d5571f]">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Front-end
            </a>
          </Button>
        </div>
      }
    >
      <>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Ingeschreven', value: yearStats.total },
            { label: 'Wachtlijst', value: yearStats.waitlisted },
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
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Kon ticket-data niet laden</p>
              <p className="mt-1 text-amber-800/80">
                {error}. Run ook migratie{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">
                  004_cv_required_waitlist.sql
                </code>
                .
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
              Beheer open/dicht, CV-verplichting, wachtlijst en bulkmail per event.
            </p>

            {eventsLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-8">
                <Loader2 className="h-4 w-4 animate-spin" /> Laden…
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <p className="font-semibold text-[#041c3a]">Helemaal leeg</p>
                <p className="mt-2 text-sm text-slate-500">
                  Geen actieve events (waar ticketing op geactiveerd is).
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
                  const cvOn = event.cv_required !== false;
                  const waitOn = Boolean(event.waitlist_enabled);
                  return (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-0 bg-[#041c3a] text-[10px] uppercase text-white">
                              {EVENT_TYPE_LABELS[event.type]}
                            </Badge>
                            {open ? (
                              <Badge className="border-0 bg-emerald-500 text-[10px] text-white">
                                Open
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-slate-500">
                                Gesloten
                              </Badge>
                            )}
                            {cvOn ? (
                              <Badge variant="outline" className="text-[10px]">
                                CV verplicht
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-slate-400">
                                Geen CV
                              </Badge>
                            )}
                            {waitOn && (
                              <Badge className="border-0 bg-[#ed6425] text-[10px] text-white">
                                Wachtlijst aan
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1.5 truncate font-bold text-[#041c3a]">
                            {event.titel}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {s.total} bevestigd · {s.waitlisted} wachtlijst · {s.checkedIn}{' '}
                            aanwezig
                            {event.max_deelnemers != null
                              ? ` · max ${event.max_deelnemers}`
                              : ''}
                            {event.ticket_slug ? ` · /events/${event.ticket_slug}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            onClick={() => openMail(event.id, 'confirmed')}
                          >
                            <Mail className="h-3.5 w-3.5" /> Mail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMail(event.id, 'waitlist')}
                            disabled={s.waitlisted === 0}
                          >
                            <ListOrdered className="h-3.5 w-3.5" /> Wachtlijst-mail
                          </Button>
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

                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === `${event.id}-cv_required`}
                          onClick={() => toggleFlag(event.id, 'cv_required', cvOn)}
                          className="text-xs text-slate-600"
                        >
                          {cvOn ? 'CV uitzetten' : 'CV verplichten'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === `${event.id}-waitlist_enabled`}
                          onClick={() => toggleFlag(event.id, 'waitlist_enabled', waitOn)}
                          className="text-xs text-slate-600"
                        >
                          {waitOn ? 'Wachtlijst uitzetten' : 'Wachtlijst aanzetten'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        <BulkMailDialog
          open={mailOpen}
          onClose={() => setMailOpen(false)}
          events={events}
          registrations={yearRegs}
          defaultEventId={mailEventId}
          defaultAudience={mailAudience}
        />
      </>
    </AppLayout>
  );
}
