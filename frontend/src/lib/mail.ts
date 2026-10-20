import { supabase } from '@/lib/supabase';

export type MailAudience = 'confirmed' | 'waitlist';

export type BulkMailResult = {
  sent: number;
  failed: number;
  failures: string[];
  total: number;
};

async function authHeader(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Je bent niet ingelogd.');
  }
  return `Bearer ${data.session.access_token}`;
}

export async function sendBulkMail(input: {
  eventId: string;
  audience: MailAudience;
  subject: string;
  message: string;
}): Promise<BulkMailResult> {
  const res = await fetch('/api/mail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await authHeader(),
    },
    body: JSON.stringify({
      mode: 'bulk',
      eventId: input.eventId,
      audience: input.audience,
      subject: input.subject,
      message: input.message,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as BulkMailResult & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(payload.error || 'Bulkmail mislukt.');
  }
  return payload;
}
