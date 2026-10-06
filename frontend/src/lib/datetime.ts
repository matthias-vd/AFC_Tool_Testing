export function formatEventDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels',
  }).format(parsed);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels',
  }).format(parsed);
}

/** Convert a datetime-local value (Europe/Brussels wall time) to ISO UTC. */
export function brusselsLocalToIso(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error('Ongeldige datum/tijd.');
  }
  const [, year, month, day, hour, minute] = match;
  const desired = `${year}-${month}-${day}T${hour}:${minute}:00`;
  let guess = Date.parse(`${desired}Z`);
  for (let i = 0; i < 3; i += 1) {
    const shown = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(new Date(guess))
      .replace(' ', 'T');
    const desiredMs = Date.parse(`${desired}Z`);
    const shownMs = Date.parse(`${shown}Z`);
    guess += desiredMs - shownMs;
  }
  return new Date(guess).toISOString();
}

/** Format an ISO timestamp for a datetime-local input in Europe/Brussels. */
export function isoToBrusselsInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
