import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { foodLabel } from '@/lib/food';
import { cancelPath, ticketAbsoluteUrl, ticketHomePath } from '@/lib/ticketing';
import type { TicketRegistration } from '@/types/event';

export function TicketCard({
  eventName,
  eventSlug,
  registration,
  isNew,
  emailSent = false,
}: {
  eventName: string;
  eventSlug: string;
  registration: TicketRegistration;
  isNew?: boolean;
  emailSent?: boolean | null;
}) {
  const cancelled = Boolean(registration.cancelled_at);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (cancelled || !registration.ticket_token) return;
    const url = ticketAbsoluteUrl(eventSlug, registration.ticket_token);
    QRCode.toDataURL(url, {
      width: 440,
      margin: 1,
      color: { dark: '#081c3c', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [cancelled, eventSlug, registration.ticket_token]);

  return (
    <article className="ticket-card mx-auto w-full max-w-xl overflow-hidden rounded-[28px]">
      <div className="flex flex-col gap-8 p-7 sm:p-10">
        {cancelled ? (
          <p className="text-sm tracking-[0.18em] uppercase text-accent">Uitgeschreven</p>
        ) : isNew ? (
          <p className="no-print text-sm tracking-[0.18em] uppercase text-ok">
            Inschrijving bevestigd
          </p>
        ) : (
          <p className="text-sm tracking-[0.18em] uppercase text-muted">Ticket</p>
        )}
        <div>
          <h1 className="serif text-4xl leading-tight sm:text-5xl">{eventName}</h1>
        </div>
        {cancelled ? (
          <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            Deze inschrijving is geannuleerd. Het ticket is niet meer geldig voor check-in.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-3">
              <p className="text-sm text-muted">Gast</p>
              <p className="serif text-3xl">{registration.naam}</p>
              <p className="text-muted">{registration.email}</p>
              <p className="text-sm">
                Eten: {foodLabel(registration.food_preference ?? '')}
              </p>
            </div>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR-code voor check-in"
                width={220}
                height={220}
                className="mx-auto h-52 w-52 rounded-2xl bg-card"
              />
            ) : null}
          </div>
        )}
        {!cancelled && isNew && emailSent === false ? (
          <p className="no-print rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
            We konden geen e-mail versturen. Sla deze pagina op of maak een screenshot van
            je QR-code.
          </p>
        ) : !cancelled && isNew ? (
          <p className="no-print text-sm text-muted">
            Je ticket staat ook in je mailbox (met een link om je uit te schrijven). Toon
            deze QR-code aan de ingang.
          </p>
        ) : null}
        <div className="no-print flex flex-wrap gap-3">
          {!cancelled ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-card"
            >
              Print of bewaar
            </button>
          ) : null}
          {!cancelled && registration.ticket_token ? (
            <Link
              to={cancelPath(registration.ticket_token)}
              className="rounded-full border border-accent/40 px-5 py-2.5 text-sm font-semibold text-accent"
            >
              Uitschrijven
            </Link>
          ) : null}
          <Link
            to={ticketHomePath()}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold"
          >
            Terug naar inschrijving
          </Link>
        </div>
      </div>
    </article>
  );
}
