import { useMemo, useState } from 'react';
import { Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { foodLabel } from '@/lib/food';
import { formatDateTime } from '@/lib/datetime';
import {
  deleteTicketRegistration,
  getCvSignedUrl,
  setCheckIn,
} from '@/hooks/useTicketing';
import type { Event, TicketRegistration } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { downloadCsv, registrationsToCsv } from '@/lib/ticketCsv';
import { toast } from 'sonner';

export function AttendeeTable({
  events,
  registrations,
  loading,
  onChange,
}: {
  events: Event[];
  registrations: TicketRegistration[];
  loading: boolean;
  onChange: () => void;
}) {
  const [eventFilter, setEventFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const eventNameById = useMemo(
    () => Object.fromEntries(events.map((e) => [e.id, e.titel])),
    [events],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      if (eventFilter !== 'all' && r.event_id !== eventFilter) return false;
      if (!q) return true;
      return (
        (r.naam ?? '').toLowerCase().includes(q) ||
        (r.email ?? '').toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q)
      );
    });
  }, [registrations, eventFilter, query]);

  async function toggleCheckIn(reg: TicketRegistration) {
    setBusyId(reg.id);
    try {
      const next = !(reg.checked_in || reg.checked_in_at);
      await setCheckIn(reg.id, next);
      onChange();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Check-in mislukt');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(reg: TicketRegistration) {
    if (!confirm(`Verwijder ${reg.naam}?`)) return;
    setBusyId(reg.id);
    try {
      await deleteTicketRegistration(reg.id);
      toast.success('Deelnemer verwijderd');
      onChange();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verwijderen mislukt');
    } finally {
      setBusyId(null);
    }
  }

  async function openCv(reg: TicketRegistration) {
    if (!reg.cv_path) {
      toast.error('Geen CV beschikbaar');
      return;
    }
    try {
      const url = await getCvSignedUrl(reg.cv_path);
      window.open(url, '_blank');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'CV openen mislukt');
    }
  }

  function exportCsv() {
    const csv = registrationsToCsv(filtered, eventNameById);
    downloadCsv('afc-deelnemers.csv', csv);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Event
          </label>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="flex h-9 min-w-[200px] rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">Alle events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titel}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[180px]">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Zoeken
          </label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Naam, e-mail, telefoon…"
            className="border-slate-200"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          className="border-slate-200"
        >
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-10">
          <Loader2 className="h-4 w-4 animate-spin" /> Laden…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">Naam</th>
                <th className="px-4 py-3 font-bold">Event</th>
                <th className="px-4 py-3 font-bold">Eten</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Ingeschreven</th>
                <th className="px-4 py-3 font-bold text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => {
                const checked = Boolean(reg.checked_in || reg.checked_in_at);
                const cancelled = Boolean(reg.cancelled_at);
                return (
                  <tr key={reg.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#041c3a]">{reg.naam}</p>
                      <p className="text-xs text-slate-500">{reg.email}</p>
                      <p className="text-xs text-slate-400">{reg.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {eventNameById[reg.event_id] ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {foodLabel(reg.food_preference ?? '')}
                    </td>
                    <td className="px-4 py-3">
                      {cancelled ? (
                        <Badge variant="outline" className="border-red-200 text-red-600">
                          Uitgeschreven
                        </Badge>
                      ) : checked ? (
                        <Badge className="bg-emerald-500 text-white border-0">Aanwezig</Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-200 text-slate-500">
                          Ingeschreven
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateTime(reg.registered_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {reg.cv_path && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openCv(reg)}
                            title="CV"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {!cancelled && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busyId === reg.id}
                            onClick={() => toggleCheckIn(reg)}
                            className="text-xs"
                          >
                            {checked ? 'Undo' : 'Check-in'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busyId === reg.id}
                          onClick={() => handleDelete(reg)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Geen deelnemers gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
