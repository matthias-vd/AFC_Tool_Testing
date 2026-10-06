import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PublicLayout } from '@/components/ticketing/PublicLayout';
import {
  cancelRegistration,
  fetchRegistrationByToken,
} from '@/hooks/useTicketing';
import { formatDateTime } from '@/lib/datetime';
import { ticketHomePath } from '@/lib/ticketing';

export default function PublicCancelPage() {
  const { token } = useParams<{ token: string }>();
  const decoded = token ? decodeURIComponent(token) : '';

  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eventName, setEventName] = useState('');
  const [cancelledAt, setCancelledAt] = useState<string | null>(null);

  useEffect(() => {
    if (!decoded) return;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchRegistrationByToken(decoded);
        if (!result) {
          setError('Ticket niet gevonden.');
          return;
        }
        setName(result.registration.naam ?? '');
        setEmail(result.registration.email ?? '');
        setEventName(result.event.titel);
        setCancelledAt(result.registration.cancelled_at ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [decoded]);

  async function onCancel() {
    setPending(true);
    setError(null);
    try {
      await cancelRegistration(decoded);
      setCancelledAt(new Date().toISOString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Annuleren is niet gelukt.');
    } finally {
      setPending(false);
    }
  }

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-20 pt-4">
        {loading ? (
          <p className="text-muted">Laden…</p>
        ) : (
          <>
            <p className="text-sm tracking-[0.18em] uppercase text-accent">Inschrijving</p>
            <h1 className="serif mt-4 text-4xl sm:text-5xl">
              {cancelledAt ? 'Je bent uitgeschreven' : 'Inschrijving annuleren'}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              {cancelledAt
                ? `Je ticket voor “${eventName}” is niet meer geldig.`
                : `Hallo ${name}, bevestig hieronder als je je wilt uitschrijven voor “${eventName}”.`}
            </p>
            <dl className="mt-8 grid gap-3 text-sm">
              <div>
                <dt className="text-muted">E-mail</dt>
                <dd className="mt-1 text-base">{email}</dd>
              </div>
              {cancelledAt ? (
                <div>
                  <dt className="text-muted">Uitgeschreven op</dt>
                  <dd className="mt-1 text-base">{formatDateTime(cancelledAt)}</dd>
                </div>
              ) : null}
            </dl>

            {error ? (
              <p className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                {error}
              </p>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-3">
              {!cancelledAt ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onCancel}
                  className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-card disabled:opacity-60"
                >
                  {pending ? 'Bezig…' : 'Ja, schrijf me uit'}
                </button>
              ) : null}
              <Link
                to={ticketHomePath()}
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold"
              >
                Terug naar events
              </Link>
            </div>
          </>
        )}
      </main>
    </PublicLayout>
  );
}
