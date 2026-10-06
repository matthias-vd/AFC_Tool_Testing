import { formatDateTime } from '@/lib/datetime';
import { foodLabel } from '@/lib/food';
import type { TicketRegistration } from '@/types/event';

function csvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export function registrationsToCsv(
  rows: TicketRegistration[],
  eventNameById: Record<string, string>,
) {
  const header = [
    'Event',
    'Naam',
    'E-mail',
    'Telefoon',
    'Voedselvoorkeur',
    'Extra info',
    'CV',
    'Ingeschreven op',
    'Status',
    'Aanwezig',
    'Check-in tijd',
    'Uitgeschreven op',
    'Ticketcode',
  ];

  const lines = rows.map((row) =>
    [
      eventNameById[row.event_id] ?? '',
      row.naam ?? '',
      row.email ?? '',
      row.phone ?? '',
      foodLabel(row.food_preference ?? ''),
      row.extra_info ?? '',
      row.cv_original_name ?? '',
      formatDateTime(row.registered_at),
      row.cancelled_at ? 'Uitgeschreven' : 'Ingeschreven',
      row.checked_in_at || row.checked_in ? 'Ja' : 'Nee',
      formatDateTime(row.checked_in_at),
      formatDateTime(row.cancelled_at),
      row.ticket_token ?? '',
    ]
      .map(csvCell)
      .join(';'),
  );

  return `\uFEFF${header.join(';')}\n${lines.join('\n')}\n`;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
