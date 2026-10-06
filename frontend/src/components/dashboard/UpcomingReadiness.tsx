import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, CalendarX, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EventRollenDialog } from '../events/forms/EventRollenDialog';
import type { Event } from '../../../types/event';
// ── Types ──────────────────────────────────────────────────────────────────────

interface UpcomingEvent {
  id: string;
  titel: string;
  status: string;
  type: string;
  event_datum: string | null;
  locatie: string | null;
  beschrijving_website: string | null;
  beschrijving_sociaal: string | null;
  max_deelnemers: number | null;
  start_tijd: string | null;
  registratie_aantal: number;
  created_by: string | null;
}

interface MissingField {
  label: string;
  critical: boolean; // critical = blocks running the event
}

interface ReadinessResult {
  event: UpcomingEvent;
  daysUntil: number;
  missingFields: MissingField[];
  urgencyLevel: 'critical' | 'warning' | 'ok';
  completionPct: number;
}

// ── Readiness logic ────────────────────────────────────────────────────────────

const FIELDS_TO_CHECK: { key: keyof UpcomingEvent; label: string; critical: boolean }[] = [
  { key: 'event_datum',           label: 'Datum',          critical: true  },
  { key: 'locatie',               label: 'Locatie',        critical: true  },
  { key: 'start_tijd',            label: 'Starttijd',      critical: true  },
  { key: 'beschrijving_website',  label: 'Beschrijving website',   critical: false },
  { key: 'beschrijving_sociaal',  label: 'Beschrijving Sociale media',critical: false },
  { key: 'max_deelnemers',        label: 'Max. deelnemers',critical: false },
];

function computeReadiness(event: UpcomingEvent, today: Date, hasSpreker: boolean): ReadinessResult {
  const eventDate = event.event_datum ? new Date(event.event_datum) : null;
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const missingFields: MissingField[] = [];

  for (const field of FIELDS_TO_CHECK) {
    const val = event[field.key];
    const isEmpty = val === null || val === undefined || val === '';
    if (isEmpty) missingFields.push({ label: field.label, critical: field.critical });
  }

  if (event.status === 'concept') {
    missingFields.push({ label: 'Voorbereid Status', critical: daysUntil <= 5 });
  }

  // Nieuwe check: geen spreker toegewezen
  if (!hasSpreker) {
    missingFields.push({ label: 'Spreker', critical: true });
  }

  const totalChecks = FIELDS_TO_CHECK.length + 2; // +1 status, +1 spreker
  const filled = FIELDS_TO_CHECK.filter((f) => {
    const val = event[f.key];
    return val !== null && val !== undefined && val !== '';
  }).length
    + (event.status !== 'concept' ? 1 : 0)
    + (hasSpreker ? 1 : 0);
  const completionPct = Math.round((filled / totalChecks) * 100);

  const hasCritical = missingFields.some((f) => f.critical);
  const urgencyLevel: ReadinessResult['urgencyLevel'] =
    (hasCritical && daysUntil <= 14) ? 'critical' :
    (missingFields.length > 0 && daysUntil <= 30) ? 'warning' : 'ok';

  return { event, daysUntil, missingFields, urgencyLevel, completionPct };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysLabel(days: number): string {
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Morgen';
  if (days < 0)  return `${Math.abs(days)}d geleden`;
  return `Over ${days} dag${days === 1 ? '' : 'en'}`;
}

const URGENCY_STYLES = {
  critical: {
    border:   'border-red-200 bg-red-50/60',
    pill:     'bg-red-100 text-red-700',
    dot:      'bg-red-500',
    icon:     AlertTriangle,
    iconColor:'text-red-500',
    dayColor: 'text-red-600 font-bold',
  },
  warning: {
    border:   'border-amber-200 bg-amber-50/40',
    pill:     'bg-amber-100 text-amber-700',
    dot:      'bg-amber-400',
    icon:     Clock,
    iconColor:'text-amber-500',
    dayColor: 'text-amber-600 font-semibold',
  },
  ok: {
    border:   'border-zinc-200 bg-white',
    pill:     'bg-emerald-100 text-emerald-700',
    dot:      'bg-emerald-400',
    icon:     CheckCircle2,
    iconColor:'text-emerald-500',
    dayColor: 'text-zinc-500 font-medium',
  },
} as const;

// ── Component ──────────────────────────────────────────────────────────────────

export function UpcomingReadiness() {
  const [results, setResults] = useState<ReadinessResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollenEvent, setRollenEvent] = useState<UpcomingEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      const { data: currentYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_huidig', true)
        .maybeSingle();

      if (!currentYear) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('events')
        .select('id, titel, status, type, event_datum, locatie, beschrijving_website, beschrijving_sociaal, max_deelnemers, start_tijd, created_by')
        .eq('academic_year_id', currentYear.id)
        .is('deleted_at', null)
        .not('status', 'eq', 'compleet')
        .or(`event_datum.gte.${today},event_datum.is.null`)
        .order('event_datum', { ascending: true, nullsFirst: false })
        .limit(10);

      if (!data) { setLoading(false); return; }

      const eventIds = (data as UpcomingEvent[]).map((e) => e.id);

      // Welke events hebben al minstens 1 spreker?
      let sprekerEventIds = new Set<string>();
      if (eventIds.length > 0) {
        const { data: sprekersData } = await supabase
          .from('event_sprekers')
          .select('event_id')
          .in('event_id', eventIds);

        sprekerEventIds = new Set((sprekersData ?? []).map((s) => s.event_id));
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const computed = (data as UpcomingEvent[])
        .map((ev) => computeReadiness(ev, now, sprekerEventIds.has(ev.id)))
        .sort((a, b) => {
          const urgencyOrder = { critical: 0, warning: 1, ok: 2 };
          if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel])
            return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
          return a.daysUntil - b.daysUntil;
        });

      setResults(computed);
      setLoading(false);
    }

    fetch();
  }, []);

  const criticalCount = results.filter((r) => r.urgencyLevel === 'critical').length;
  const warningCount  = results.filter((r) => r.urgencyLevel === 'warning').length;

  return (
    <section>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-0.5 rounded-full bg-[#ed6425]" />
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
            Voorbereiding evenementen
          </h2>
          {!loading && (criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1.5 ml-1">
              {criticalCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 rounded-full px-2 py-0.5">
                  {criticalCount} urgent
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-600 rounded-full px-2 py-0.5">
                  {warningCount} aandacht
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl border border-zinc-100 bg-zinc-50 animate-pulse" />
          ))
        )}

        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-xl border border-zinc-200/80 bg-white text-center">
            <CalendarX className="h-7 w-7 text-zinc-300" />
            <div>
              <p className="text-sm font-semibold text-[#041c3a]">Geen geplande evenementen</p>
              <p className="text-xs text-zinc-400 mt-0.5">Alle evenementen zijn afgerond of er zijn er nog geen aangemaakt.</p>
            </div>
          </div>
        )}

        {!loading && results.map((result) => {
          const styles = URGENCY_STYLES[result.urgencyLevel];
          const Icon = styles.icon;

          return (
            <button
              key={result.event.id}
              onClick={() => navigate(`/evenementen?event=${result.event.id}`)}
              className={`w-full text-left rounded-xl border px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-all group ${styles.border}`}
            >
              {/* Urgency icon */}
              <div className="mt-0.5 shrink-0">
                <Icon className={`h-4 w-4 ${styles.iconColor}`} />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#041c3a] truncate">
                    {result.event.titel}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${styles.pill}`}>
                    {daysLabel(result.daysUntil)}
                  </span>
                  <span className="text-[10px] text-zinc-400 capitalize shrink-0">
                    {result.event.status}
                  </span>
                </div>

                {result.missingFields.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {result.missingFields.map((f) => (
                      <span
                        key={f.label}
                        className={`text-[10px] px-1.5 py-0.5 rounded-md border ${
                          f.critical
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}
                      >
                        {f.label} ontbreekt
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Alle velden ingevuld ✓
                  </p>
                )}
              </div>
              {/* Quick crew signup */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRollenEvent(result.event);
                }}
                className="shrink-0 self-center p-2 rounded-lg border border-slate-200 text-[#041c3a] hover:bg-[#041c3a] hover:text-white transition-colors"
                title="Inschrijven voor een rol"
              >
                <Users className="h-3.5 w-3.5" />
              </button>
              {/* Completion bar + chevron */}
              <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
                <span className="text-[11px] font-semibold text-zinc-400">
                  {result.completionPct}%
                </span>
                <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      result.completionPct === 100 ? 'bg-emerald-400' :
                      result.completionPct >= 60  ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${result.completionPct}%` }}
                  />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-[#ed6425] transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
      {rollenEvent && (
        <EventRollenDialog
          event={{
            id: rollenEvent.id,
            titel: rollenEvent.titel,
           status: rollenEvent.status as Event['status'],
            created_by: rollenEvent.created_by,
          } as Event}
          open={!!rollenEvent}
          onOpenChange={(o) => { if (!o) setRollenEvent(null); }}
        />
      )}
    </section>
  );
}