import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

type Audience = 'confirmed' | 'waitlist';

type BulkBody = {
  mode: 'bulk';
  eventId: string;
  audience: Audience;
  subject: string;
  message: string;
};

type SingleBody = {
  mode: 'single';
  registrationId: string;
  subject: string;
  message: string;
};

type Body = BulkBody | SingleBody;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

function adminClient(authHeader: string | undefined) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Supabase URL/anon key ontbreekt in environment.');
  }
  return createClient(url, anon, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

function toHtml(message: string) {
  return escapeHtml(message).replaceAll('\n', '<br/>');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isMailConfigured()) {
    return res.status(503).json({
      error:
        'SMTP niet geconfigureerd. Zet SMTP_HOST en SMTP_FROM in je environment (.env / Vercel).',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Niet ingelogd.' });
  }

  let body: Body;
  try {
    body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as Body;
  } catch {
    return res.status(400).json({ error: 'Ongeldige JSON body.' });
  }

  if (!body?.subject?.trim() || !body?.message?.trim()) {
    return res.status(400).json({ error: 'Onderwerp en bericht zijn verplicht.' });
  }

  try {
    const supabase = adminClient(authHeader);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Sessie ongeldig.' });
    }

    type Recipient = { id: string; email: string | null; naam: string | null };
    let recipients: Recipient[] = [];
    let eventTitle = 'AFC Gent';

    if (body.mode === 'bulk') {
      if (!body.eventId || !body.audience) {
        return res.status(400).json({ error: 'eventId en audience zijn verplicht.' });
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, titel')
        .eq('id', body.eventId)
        .maybeSingle();
      if (eventError || !event) {
        return res.status(404).json({ error: 'Event niet gevonden.' });
      }
      eventTitle = event.titel;

      let query = supabase
        .from('registrations')
        .select('id, email, naam, is_waitlisted, cancelled_at')
        .eq('event_id', body.eventId)
        .eq('bron', 'afc_ticket')
        .is('cancelled_at', null);

      if (body.audience === 'waitlist') {
        query = query.eq('is_waitlisted', true);
      } else {
        query = query.or('is_waitlisted.is.null,is_waitlisted.eq.false');
      }

      const { data, error } = await query;
      if (error) throw error;
      recipients = (data as Recipient[]) || [];
    } else if (body.mode === 'single') {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, email, naam, event_id, events(titel)')
        .eq('id', body.registrationId)
        .maybeSingle();
      if (error || !data) {
        return res.status(404).json({ error: 'Inschrijving niet gevonden.' });
      }
      recipients = [{ id: data.id, email: data.email, naam: data.naam }];
      const joined = data.events as { titel?: string } | { titel?: string }[] | null;
      eventTitle = Array.isArray(joined)
        ? joined[0]?.titel || eventTitle
        : joined?.titel || eventTitle;
    } else {
      return res.status(400).json({ error: 'Onbekende mode.' });
    }

    const valid = recipients.filter((r) => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    if (valid.length === 0) {
      return res.status(400).json({ error: 'Geen geldige ontvangers gevonden.' });
    }

    const transporter = createTransport();
    const subject = body.subject.trim();
    const message = body.message.trim();
    let sent = 0;
    const failures: string[] = [];

    for (const recipient of valid) {
      try {
        const name = recipient.naam?.trim() || 'daar';
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: recipient.email!,
          subject,
          text: `Hallo ${name},\n\n${message}\n\n— ${eventTitle} · AFC Gent`,
          html: `
            <div style="font-family:Arial,sans-serif;color:#041c3a;line-height:1.55;max-width:560px;">
              <p style="margin:0 0 12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#ed6425;">AFC Gent</p>
              <p style="margin:0 0 16px;">Hallo ${escapeHtml(name)},</p>
              <div style="margin:0 0 20px;font-size:15px;">${toHtml(message)}</div>
              <p style="margin:0;font-size:12px;color:#64748b;">${escapeHtml(eventTitle)}</p>
            </div>
          `,
        });
        sent += 1;
      } catch {
        failures.push(recipient.email!);
      }
    }

    return res.status(200).json({
      sent,
      failed: failures.length,
      failures,
      total: valid.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Mailen mislukt';
    return res.status(500).json({ error: message });
  }
}
