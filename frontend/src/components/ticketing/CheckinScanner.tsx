import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { foodLabel } from '@/lib/food';
import { checkInByPayload } from '@/hooks/useTicketing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Event } from '@/types/event';

type ScanResult = {
  kind: 'ok' | 'repeat' | 'error';
  title: string;
  detail: string;
};

export function CheckinScanner({ events }: { events: Event[] }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState('');
  const [eventId, setEventId] = useState('all');
  const busy = useRef(false);

  const submit = useCallback(
    async (body: { payload?: string; email?: string }) => {
      if (busy.current) return;
      busy.current = true;
      setPaused(true);

      try {
        const payload = await checkInByPayload({
          ...body,
          ...(eventId !== 'all' ? { eventId } : {}),
        });

        if (payload.alreadyCheckedIn) {
          setResult({
            kind: 'repeat',
            title: payload.name,
            detail: 'Dit ticket is eerder al gescand.',
          });
        } else {
          setResult({
            kind: 'ok',
            title: payload.name,
            detail: payload.foodPreference
              ? `Eten: ${foodLabel(payload.foodPreference)}`
              : 'Check-in geregistreerd.',
          });
        }
      } catch (err: unknown) {
        setResult({
          kind: 'error',
          title: 'Niet herkend',
          detail: err instanceof Error ? err.message : 'Check-in mislukt.',
        });
      } finally {
        window.setTimeout(() => {
          setResult(null);
          setPaused(false);
          busy.current = false;
        }, 2400);
      }
    },
    [eventId],
  );

  if (!mounted) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
        Camera wordt geladen…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#041c3a]">
        <Scanner
          paused={paused}
          formats={['qr_code']}
          sound
          onScan={(codes) => {
            const payload = codes[0]?.rawValue;
            if (payload) void submit({ payload });
          }}
          classNames={{ container: 'min-h-[360px]' }}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        {result ? (
          <div
            className={`rounded-xl px-5 py-6 ${
              result.kind === 'ok'
                ? 'bg-emerald-50 border border-emerald-200'
                : result.kind === 'repeat'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className="text-lg font-bold text-[#041c3a]">{result.title}</p>
            <p className="mt-1 text-sm text-slate-600">{result.detail}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Scan een QR-ticket of voer handmatig een e-mail / ticketcode in.
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Event-filter
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">Alle ticket-events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.titel}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Handmatig
          </label>
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="E-mail of ticket-URL"
            className="border-slate-200"
          />
          <Button
            type="button"
            className="w-full bg-[#ed6425] hover:bg-[#d5571f] text-white"
            onClick={() => {
              const value = manual.trim();
              if (!value) return;
              if (value.includes('@')) {
                void submit({ email: value });
              } else {
                void submit({ payload: value });
              }
            }}
          >
            Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
