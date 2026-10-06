import { useState } from 'react';
import { GraduationCap, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAcademicYears, useCreateAcademicYear, useSetCurrentYear, useDeleteAcademicYear, useEventDetail,useExportEmails } from '../hooks/useAcademicYears';
import { AcademicYearCard } from '../components/academicYear/AcademicYearCard';
import { CreateAcademicYearDialog } from '../components/academicYear/CreateAcademicYearDialog';
import { EventDetailSheet } from '../components/academicYear/EventDetailSheet';
import { SetCurrentYearDialog } from '../components/academicYear/SetCurrentYearDialog';
import type { AcademicYearWithEvents, CreateAcademicYearInput, EventWithRegistrations } from '../types/academiejaar';
import { AppLayout } from '../components/layout/AppLayout';
import { EmailExportDialog } from '../components/academicYear/EmailExportDialog';

export default function AcademiejarenPage() {
  const { years, loading, error, refetch } = useAcademicYears();
  const { create, loading: createLoading } = useCreateAcademicYear();
  const { setCurrent, loading: setCurrentLoading } = useSetCurrentYear();
  const { softDelete } = useDeleteAcademicYear();

  const { event: selectedEvent, loading: eventLoading, load: loadEvent, clear: clearEvent } = useEventDetail();
  const [pendingSetCurrentYear, setPendingSetCurrentYear] = useState<AcademicYearWithEvents | null>(null);

  const currentYear = years.find((y) => y.is_huidig);

  const { exportEmails, loading: exportLoading } = useExportEmails();
  const [exportYear, setExportYear] = useState<AcademicYearWithEvents | null>(null);
  const [exportedEmails, setExportedEmails] = useState<string[]>([]);

  async function handleExportEmails(year: AcademicYearWithEvents) {
    setExportYear(year);
    setExportedEmails([]);
    const emails = await exportEmails(year.events.map((e) => e.id));
    setExportedEmails(emails);
  }

  async function handleCreate(input: CreateAcademicYearInput) {
    await create(input);
    refetch();
  }

  async function handleSetCurrent() {
    if (!pendingSetCurrentYear) return;
    const ok = await setCurrent(pendingSetCurrentYear.id);
    if (ok) {
      setPendingSetCurrentYear(null);
      refetch();
    }
  }

  async function handleDeleteYear(yearId: string) {
    await softDelete(yearId);
    refetch();
  }

  return (
    <AppLayout
      title="Academiejaren"
      subtitle="Overzicht van alle academiejaren en hun evenementen"
      actions={<CreateAcademicYearDialog onConfirm={handleCreate} loading={createLoading} />}
    >
      <>
        {/* Current year highlight */}
        {currentYear && (
          <div className="flex items-center gap-3 rounded-xl border border-[#041c3a] bg-[#041c3a] px-4 py-3">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#ed6425]" />
            <p className="text-sm text-white">
              Huidig actief academiejaar:{' '}
              <strong className="font-semibold text-[#ed6425]">{currentYear.naam}</strong>
              <span className="ml-2 text-slate-300">
                ({currentYear.total_events} evenementen · {currentYear.total_registrations} inschrijvingen)
              </span>
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 mr-3 animate-spin text-[#ed6425]" />
            <span className="text-sm">Academiejaren laden...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Fout bij laden</p>
              <p className="mt-0.5 text-xs text-red-500">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={refetch} className="text-red-600 hover:text-red-700">
              <RefreshCw className="h-4 w-4 mr-1" /> Opnieuw
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && years.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#041c3a]/10 bg-[#041c3a]/5">
              <GraduationCap className="h-8 w-8 text-[#041c3a]/30" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-[#041c3a]">Nog geen academiejaren</h3>
            <p className="mb-6 text-sm text-slate-400">
              Maak je eerste academiejaar aan via de knop rechtsboven.
            </p>
          </div>
        )}

        {/* Year cards */}
        {!loading && !error && years.length > 0 && (
          <div className="space-y-3">
            {years.map((year, i) => (
              <AcademicYearCard
                key={year.id}
                year={year}
                defaultOpen={i === 0}
                onSetCurrent={(id) => {
                  const y = years.find((yr) => yr.id === id);
                  if (y) setPendingSetCurrentYear(y);
                }}
                onViewEvent={(e) => loadEvent(e.id)}
                onDelete={handleDeleteYear}
                onExportEmails={handleExportEmails}
              />
            ))}
          </div>
        )}

        <EventDetailSheet event={selectedEvent} onClose={clearEvent} />

        <EmailExportDialog
          open={!!exportYear}
          onClose={() => setExportYear(null)}
          yearName={exportYear?.naam ?? null}
          emails={exportedEmails}
          loading={exportLoading}
        />

        <SetCurrentYearDialog
          year={pendingSetCurrentYear}
          currentYear={currentYear}
          onConfirm={handleSetCurrent}
          onCancel={() => setPendingSetCurrentYear(null)}
          loading={setCurrentLoading}
        />
      </>
    </AppLayout>
  );
}