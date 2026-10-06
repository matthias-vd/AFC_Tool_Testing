import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneInput } from '@/components/ticketing/PhoneInput';
import { FOOD_OPTIONS } from '@/lib/food';
import { registerForEvent } from '@/hooks/useTicketing';
import { ticketViewPath } from '@/lib/ticketing';

export function RegisterForm({ eventSlug }: { eventSlug: string }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [foodPreference, setFoodPreference] = useState('');
  const extraRequired = foodPreference === 'andere';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const cvFile = data.get('cv') as File | null;

    try {
      if (!cvFile?.size) throw new Error('Upload een CV als PDF.');
      const result = await registerForEvent({
        eventSlug,
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        foodPreference: String(data.get('foodPreference') ?? ''),
        extraInfo: String(data.get('extraInfo') ?? ''),
        cvFile,
      });
      const params = new URLSearchParams({ nieuw: '1', mail: '0' });
      navigate(
        `${ticketViewPath(result.eventSlug, result.token)}?${params.toString()}`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inschrijven is niet gelukt.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <input type="hidden" name="eventSlug" value={eventSlug} />
      <div className="field">
        <label htmlFor="name">Naam</label>
        <input id="name" name="name" autoComplete="name" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="phone">Telefoonnummer</label>
        <PhoneInput id="phone" name="phone" required />
        <p className="text-sm text-muted">
          Voor internationale telefoonnummers, verwijder de (+32).
        </p>
      </div>
      <div className="field">
        <label htmlFor="foodPreference">Voedselvoorkeur</label>
        <select
          id="foodPreference"
          name="foodPreference"
          required
          value={foodPreference}
          onChange={(event) => setFoodPreference(event.target.value)}
        >
          <option value="" disabled>
            Kies een optie
          </option>
          {FOOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="extraInfo">
          Extra info
          {extraRequired ? ' (verplicht bij Andere)' : ''}
        </label>
        <textarea
          id="extraInfo"
          name="extraInfo"
          rows={4}
          maxLength={2000}
          required={extraRequired}
          placeholder={
            extraRequired
              ? 'Beschrijf je allergie of andere voorkeur…'
              : 'Allergieën, opmerkingen, extra context…'
          }
        />
      </div>
      <div className="field">
        <label htmlFor="cv">CV (PDF)</label>
        <input
          id="cv"
          name="cv"
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
        />
        <p className="text-sm text-muted">
          {fileName ? fileName : 'Maximaal 15 MB, alleen PDF.'}
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-forest px-5 py-3.5 text-card font-semibold transition hover:bg-navy-hover disabled:opacity-60"
      >
        {pending ? 'Bezig met inschrijven…' : 'Schrijf me in'}
      </button>
    </form>
  );
}
