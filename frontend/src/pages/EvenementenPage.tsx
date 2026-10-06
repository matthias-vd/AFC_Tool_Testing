import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEvents, useEventMutations } from '../hooks/useEvents';
import { EventsOverview } from '../components/events/overview/EventsOverview';
import { NewEventDialog } from '../components/events/detail/NewEventDialog';
import { EventDrawer } from '../components/events/detail/EventDrawer';
import { AdvanceStatusDialog } from '../components/events/detail/AdvanceStatusDialog';
import type { Event, EventFormData, EventStatus } from '../types/event';
import { toast } from 'sonner';
import { useAcademicYears } from '../hooks/useAcademicYears';
import { AppLayout } from '../components/layout/AppLayout';

export default function EvenementenPage() {
  const { years } = useAcademicYears();
  const currentYear = years.find((j) => j.is_huidig);

  const { events, loading, refetch } = useEvents(currentYear?.id);
  const mutations = useEventMutations();

  const [searchParams, setSearchParams] = useSearchParams();

  const [newEventOpen, setNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [advanceTarget, setAdvanceTarget] = useState<{
    event: Event;
    newStatus: EventStatus;
  } | null>(null);

  // Open "new event" dialog when ?nieuw=1
  useEffect(() => {
    if (searchParams.get('nieuw') === '1') {
      setNewEventOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Open drawer for a specific event when ?event=<id> is present.
  // Wait until events have loaded so we can look up the full event object.
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (!eventId || loading || events.length === 0) return;

    const target = events.find((e) => e.id === eventId);
    if (target) {
      setSelectedEvent(target);
      setDrawerOpen(true);
      // Clean the param without adding a history entry
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, events, loading, setSearchParams]);

  const handleNewEvent = () => setNewEventOpen(true);

  const handleOpenEvent = (event: Event) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedEvent(null);
    refetch();
  };

  const handleDeleteEvent = async (id: string) => {
    const ok = await mutations.deleteEvent(id);
    if (ok) {
      handleCloseDrawer();
      toast.success('Evenement verwijderd');
    } else {
      toast.error('Fout bij verwijderen: ' + mutations.error);
    }
  };

  const handleCreateEvent = async (data: EventFormData) => {
    if (!currentYear) return;
    const event = await mutations.createEvent(currentYear.id, data);
    if (event) {
      setNewEventOpen(false);
      refetch();
      toast.success('Concept aangemaakt!');
    } else {
      toast.error('Fout bij aanmaken: ' + mutations.error);
    }
  };

  const handleUpdateEvent = async (id: string, data: Partial<EventFormData>) => {
    const ok = await mutations.updateEvent(id, data);
    if (ok) {
      refetch();
      toast.success('Evenement opgeslagen');
    } else {
      toast.error('Fout bij opslaan: ' + mutations.error);
    }
    return ok;
  };

  const handleRequestAdvance = (event: Event, newStatus: EventStatus) => {
    setAdvanceTarget({ event, newStatus });
  };

  const handleConfirmAdvance = async () => {
    if (!advanceTarget) return;
    const ok = await mutations.advanceStatus(advanceTarget.event.id, advanceTarget.newStatus);
    if (ok) {
      setAdvanceTarget(null);
      refetch();
      if (selectedEvent?.id === advanceTarget.event.id) {
        setDrawerOpen(false);
        setSelectedEvent(null);
      }
      toast.success('Status bijgewerkt');
    } else {
      toast.error('Fout bij statuswijziging');
    }
  };

  const handleDrawerAdvance = async (event: Event, newStatus: EventStatus) => {
    handleRequestAdvance(event, newStatus);
  };

  if (!currentYear) {
    return (
      <AppLayout title="Evenementen" subtitle="Overzicht van alle evenementen">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="font-medium text-slate-500">Geen huidig academiejaar gevonden.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Evenementen"
      subtitle={`Overzicht van alle activiteiten · ${currentYear.naam}`}
    >
      <>
        <EventsOverview
          events={events}
          onNewEvent={handleNewEvent}
          onOpenEvent={handleOpenEvent}
          onAdvanceStatus={handleRequestAdvance}
          onRevertStatus={handleRequestAdvance}
        />

        <NewEventDialog
          open={newEventOpen}
          onClose={() => setNewEventOpen(false)}
          onCreate={handleCreateEvent}
          loading={mutations.loading}
        />

        {selectedEvent && (
          <EventDrawer
            event={selectedEvent}
            open={drawerOpen}
            onClose={handleCloseDrawer}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAdvanceStatus={handleDrawerAdvance}
            onImportTally={mutations.importTallyRegistrations}
            onImportTicketTailor={mutations.importTicketTailorRegistrations}
            onImportFeedback={mutations.importFeedback}
            onAddManualRegistration={mutations.addManualRegistration}
            onAddManualFeedback={mutations.addManualFeedback}
            loading={mutations.loading}
            onImportFromTicketTailorAPI={(eventId, ttEventId) =>
              mutations.importFromTicketTailorAPI(eventId, ttEventId)
            }
          />
        )}

        <AdvanceStatusDialog
          event={advanceTarget?.event ?? null}
          newStatus={advanceTarget?.newStatus ?? null}
          open={!!advanceTarget}
          onConfirm={handleConfirmAdvance}
          onCancel={() => setAdvanceTarget(null)}
          loading={mutations.loading}
        />
      </>
    </AppLayout>
  );
}