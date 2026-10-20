import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendBulkMail, type MailAudience } from '@/lib/mail';
import type { Event, TicketRegistration } from '@/types/event';

export function BulkMailDialog({
  open,
  onClose,
  events,
  registrations,
  defaultEventId,
  defaultAudience = 'confirmed',
}: {
  open: boolean;
  onClose: () => void;
  events: Event[];
  registrations: TicketRegistration[];
  defaultEventId?: string;
  defaultAudience?: MailAudience;
}) {
  const [eventId, setEventId] = useState(defaultEventId ?? events[0]?.id ?? '');
  const [audience, setAudience] = useState<MailAudience>(defaultAudience);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEventId(defaultEventId ?? events[0]?.id ?? '');
    setAudience(defaultAudience);
  }, [open, defaultEventId, defaultAudience, events]);

  const event = events.find((e) => e.id === eventId);

  const recipients = useMemo(() => {
    return registrations.filter((r) => {
      if (!eventId || r.event_id !== eventId) return false;
      if (r.cancelled_at) return false;
      if (audience === 'waitlist') return Boolean(r.is_waitlisted);
      return !r.is_waitlisted;
    });
  }, [registrations, eventId, audience]);

  async function handleSend() {
    if (!eventId) {
      toast.error('Kies een event.');
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Vul onderwerp en bericht in.');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Geen ontvangers voor deze selectie.');
      return;
    }

    setSending(true);
    try {
      const result = await sendBulkMail({
        eventId,
        audience,
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success(
        `${result.sent} mail(s) verzonden` +
          (result.failed ? ` · ${result.failed} mislukt` : ''),
      );
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verzenden mislukt');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-[#041c3a]">Bulkmail</DialogTitle>
          <DialogDescription>
            Verstuur een bericht via je SMTP-server naar bevestigde deelnemers of
            de wachtlijst.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="mail-event">Event</Label>
            <select
              id="mail-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.titel}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Ontvangers</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAudience('confirmed')}
                className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                  audience === 'confirmed'
                    ? 'border-[#041c3a] bg-[#041c3a] text-white'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Ingeschrevenen
              </button>
              <button
                type="button"
                onClick={() => setAudience('waitlist')}
                className={`flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                  audience === 'waitlist'
                    ? 'border-[#ed6425] bg-[#ed6425] text-white'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Wachtlijst
              </button>
            </div>
            <p className="text-[12px] text-zinc-400">
              {recipients.length} ontvanger{recipients.length === 1 ? '' : 's'}
              {event ? ` · ${event.titel}` : ''}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mail-subject">Onderwerp</Label>
            <Input
              id="mail-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Update over het event…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mail-body">Bericht</Label>
            <Textarea
              id="mail-body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              placeholder="Hallo,&#10;&#10;…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
            Annuleren
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || recipients.length === 0}
            className="bg-[#041c3a] text-white hover:bg-[#041c3a]/90"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            Verstuur ({recipients.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
