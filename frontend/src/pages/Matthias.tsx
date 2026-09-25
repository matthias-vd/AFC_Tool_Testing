import { useState } from 'react';
import { Trash2, RotateCcw, XCircle, Loader2, AlertCircle, CalendarDays, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '../components/layout/AppLayout';
import { useTrash } from '../hooks/useTrash';
import { useEventMutations } from '../hooks/useEvents';
import { useDeleteAcademicYear } from '../hooks/useAcademicYears';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type PendingAction =
  | { type: 'permanent-event'; id: string; label: string }
  | { type: 'permanent-year'; id: string; label: string }
  | null;

export default function TrashPage() {
  const { trashedEvents, trashedYears, loading, error, refetch } = useTrash();
  const { restoreEvent, permanentlyDeleteEvent } = useEventMutations();
  const { restore: restoreYear, permanentlyDelete: permanentlyDeleteYear } = useDeleteAcademicYear();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleRestoreEvent(id: string) {
    setBusyId(id);
    await restoreEvent(id);
    await refetch();
    setBusyId(null);
  }

  async function handleRestoreYear(id: string) {
    setBusyId(id);
    await restoreYear(id);
    await refetch();
    setBusyId(null);
  }

  async function handleConfirmPermanentDelete() {
    if (!pendingAction) return;
    setActionLoading(true);
    if (pendingAction.type === 'permanent-event') {
      await permanentlyDeleteEvent(pendingAction.id);
    } else {
      await permanentlyDeleteYear(pendingAction.id);
    }
    await refetch();
    setActionLoading(false);
    setPendingAction(null);
  }

  const isEmpty = !loading && trashedEvents.length === 0 && trashedYears.length === 0;

  return (
    <AppLayout title="Prullenbak" subtitle="Verwijderde items - herstel of verwijder definitief">
      <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#041c3a]">
            <Trash2 className="h-5 w-5 text-[#ed6425]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#041c3a] tracking-tight">Prullenbak</h1>
            <p className="text-sm text-slate-500">
              Verwijderde evenementen en academiejaren blijven hier staan tot je ze
              herstelt of definitief verwijdert.
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-[#ed6425]/30 via-[#041c3a]/10 to-transparent" />

        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-3 text-[#ed6425]" />
            <span className="text-sm">Prullenbak laden...</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#041c3a]/5 border border-[#041c3a]/10 flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-[#041c3a]/30" />
            </div>
            <h3 className="text-base font-semibold text-[#041c3a] mb-1">Prullenbak is leeg</h3>
            <p className="text-sm text-slate-400">Verwijderde items verschijnen hier.</p>
          </div>
        )}

        {!loading && trashedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#ed6425]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#041c3a]">
                Evenementen
              </h2>
              <Badge className="text-[10px] bg-[#041c3a]/10 text-[#041c3a] border-0">
                {trashedEvents.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {trashedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#041c3a] truncate">
                      {event.titel}
                    </p>
                    <p className="text-xs text-slate-400">
                      Verwijderd op {event.deleted_at ? formatDate(event.deleted_at) : '—'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === event.id}
                    onClick={() => handleRestoreEvent(event.id)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs h-8 gap-1.5"
                  >
                    {busyId === event.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Herstellen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPendingAction({
                        type: 'permanent-event',
                        id: event.id,
                        label: event.titel,
                      })
                    }
                    className="border-red-200 text-red-500 hover:bg-red-50 text-xs h-8 gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Definitief verwijderen
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && trashedYears.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#ed6425]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#041c3a]">
                Academiejaren
              </h2>
              <Badge className="text-[10px] bg-[#041c3a]/10 text-[#041c3a] border-0">
                {trashedYears.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {trashedYears.map((year) => (
                <div
                  key={year.id}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#041c3a] truncate">
                      {year.naam}
                    </p>
                    <p className="text-xs text-slate-400">
                      Verwijderd op {year.deleted_at ? formatDate(year.deleted_at) : '—'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === year.id}
                    onClick={() => handleRestoreYear(year.id)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs h-8 gap-1.5"
                  >
                    {busyId === year.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Herstellen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPendingAction({
                        type: 'permanent-year',
                        id: year.id,
                        label: year.naam,
                      })
                    }
                    className="border-red-200 text-red-500 hover:bg-red-50 text-xs h-8 gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Definitief verwijderen
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingAction} onOpenChange={(v) => !v && setPendingAction(null)}>
        <AlertDialogContent className="border-slate-200 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#041c3a] font-black text-lg">
              Definitief verwijderen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
              <span className="font-semibold text-slate-700">"{pendingAction?.label}"</span>{' '}
              wordt permanent verwijderd, inclusief alle gekoppelde data. Dit kan niet
              ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setPendingAction(null)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPermanentDelete}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold gap-2 border-0"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading ? 'Verwijderen...' : 'Definitief verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}