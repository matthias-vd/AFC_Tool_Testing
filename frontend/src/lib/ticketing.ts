import type { Event } from '@/types/event';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isEventAcceptingRegistrations(event: Pick<
  Event,
  | 'ticket_enabled'
  | 'ticket_is_open'
  | 'deleted_at'
  | 'registration_opens_at'
  | 'registration_closes_at'
>): boolean {
  if (!event.ticket_enabled || !event.ticket_is_open || event.deleted_at) {
    return false;
  }
  const now = Date.now();
  if (event.registration_opens_at && new Date(event.registration_opens_at).getTime() > now) {
    return false;
  }
  if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() < now) {
    return false;
  }
  return true;
}

export function ticketPublicPath(slug: string): string {
  return `/events/${slug}`;
}

export function ticketHomePath(): string {
  return '/';
}

export function ticketViewPath(slug: string, token: string): string {
  return `/ticket/${slug}/${encodeURIComponent(token)}`;
}

export function cancelPath(token: string): string {
  return `/uitschrijven/${encodeURIComponent(token)}`;
}

/** Absolute URL for QR codes (uses current origin in the browser). */
export function ticketAbsoluteUrl(slug: string, token: string): string {
  const path = ticketViewPath(slug, token);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export function parseTicketPayload(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const prefixed = value.match(/^(?:TICKET|AFC):(.+)$/i);
  if (prefixed) {
    const token = prefixed[1].trim();
    return isPlausibleToken(token) ? token : null;
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const ticketIndex = parts.findIndex((part) => part === 'ticket' || part === 't');
    if (ticketIndex >= 0) {
      const token = decodeURIComponent(parts.at(-1) ?? '');
      if (isPlausibleToken(token)) return token;
    }
  } catch {
    // not a URL
  }

  try {
    const decoded = decodeURIComponent(value);
    if (isPlausibleToken(decoded)) return decoded;
  } catch {
    // ignore
  }

  return isPlausibleToken(value) ? value : null;
}

function isPlausibleToken(token: string): boolean {
  return /^[A-Za-z0-9._-]{16,}$/.test(token);
}

export function mintTicketToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}
