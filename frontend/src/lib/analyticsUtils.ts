// ─── Extended Analytics Utils ─────────────────────────────────────────────────
// Add these exports to your existing analyticsUtils.ts

import type { AnalyticsEvent } from '../hooks/useAnalytics';
import type { Registration } from '../types/event';

// ─── Loyalty / Event Count Distribution ───────────────────────────────────────

export interface LoyaltyBucket {
  label: string;
  count: number;       // number of unique people
  percentage: number;
  emoji: string;
  description: string;
}

export interface LoyaltyData {
  buckets: LoyaltyBucket[];
  superfans: { name: string; email: string; eventCount: number }[];
  totalUnique: number;
  avgEventsPerPerson: number;
  maxEventsOnePersonAttended: number;
}

export function computeLoyaltyData(events: AnalyticsEvent[]): LoyaltyData {
  const allRegs = events.flatMap((e) => e.registrations ?? []);

  // Group by email
  const emailToCount: Record<string, number> = {};
  const emailToName: Record<string, string> = {};

  for (const reg of allRegs) {
    if (!reg.email) continue;
    const email = reg.email.toLowerCase().trim();
    emailToCount[email] = (emailToCount[email] ?? 0) + 1;
    if (!emailToName[email] && reg.naam) {
      emailToName[email] = reg.naam;
    }
  }

  const counts = Object.values(emailToCount);
  const totalUnique = counts.length;
  const sum = counts.reduce((a, b) => a + b, 0);
  const avgEventsPerPerson = totalUnique > 0 ? Math.round((sum / totalUnique) * 10) / 10 : 0;
  const maxEventsOnePersonAttended = counts.length > 0 ? Math.max(...counts) : 0;

  // Build buckets
  const bucketDef = [
    { min: 1, max: 1, label: '1 event',    emoji: '👋', description: 'Eenmalige bezoeker' },
    { min: 2, max: 2, label: '2 events',   emoji: '🔄', description: 'Terugkerende bezoeker' },
    { min: 3, max: 3, label: '3 events',   emoji: '⭐', description: 'Trouwe bezoeker' },
    { min: 4, max: 5, label: '4–5 events', emoji: '🔥', description: 'Superfan in wording' },
    { min: 6, max: 999, label: '6+ events', emoji: '🏆', description: 'Absolute loyalist' },
  ];

  const buckets: LoyaltyBucket[] = bucketDef.map(({ min, max, label, emoji, description }) => {
    const count = counts.filter((c) => c >= min && c <= max).length;
    return {
      label,
      count,
      percentage: totalUnique > 0 ? Math.round((count / totalUnique) * 100) : 0,
      emoji,
      description,
    };
  });

  // Superfans: top 10 by event count
  const superfans = Object.entries(emailToCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email, eventCount]) => ({
      name: emailToName[email] ?? email,
      email,
      eventCount,
    }));

  return { buckets, superfans, totalUnique, avgEventsPerPerson, maxEventsOnePersonAttended };
}

// ─── Registration Timing ──────────────────────────────────────────────────────

export interface TimingData {
  byHourOfDay: { hour: number; label: string; count: number }[];
  byDayOfWeek: { day: number; label: string; count: number }[];
  byDaysBeforeEvent: { bucket: string; count: number }[];
  peakHour: number;
  peakDay: string;
  lastMinuteCount: number;     // registered ≤ 1 day before
  lastMinutePct: number;
  sameWeekCount: number;
  earlyBirdCount: number;      // > 14 days before
  earlyBirdPct: number;
}
export interface DaysBeforeBucket {
  daysBefore: number | string; // number, or '14+' for overflow bucket
  count: number;
}

function toDateOnly(dateInput: string): Date {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function computeDaysBeforeDistribution(events: EventData[]): DaysBeforeBucket[] {
  const buckets = new Map<number, number>();
  const OVERFLOW_THRESHOLD = 21;

  events.forEach((event) => {
    if (!event.event_datum) return;
    const eventDateOnly = toDateOnly(event.event_datum);

    (event.registrations ?? []).forEach((reg) => {
      const submittedAt = reg.ingediend_op ?? reg.ingeschreven_op;
      if (!submittedAt) return;

      const regDateOnly = toDateOnly(submittedAt);
      const diffMs = eventDateOnly.getTime() - regDateOnly.getTime();
      const daysBefore = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (daysBefore < 0) return;

      const key = daysBefore > OVERFLOW_THRESHOLD ? OVERFLOW_THRESHOLD + 1 : daysBefore;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
  });

  // Fill in every day from 0 to OVERFLOW_THRESHOLD, even if count is 0
  const result: DaysBeforeBucket[] = [];
  for (let day = 0; day <= OVERFLOW_THRESHOLD; day++) {
    result.push({ daysBefore: day, count: buckets.get(day) ?? 0 });
  }
  // Overflow bucket (only include if it has data, or always — your call)
  result.push({
    daysBefore: `${OVERFLOW_THRESHOLD}+`,
    count: buckets.get(OVERFLOW_THRESHOLD + 1) ?? 0,
  });

  return result;
}
// Helper: parse timestamptz string of number correct
function parseTs(ts: string | number | null | undefined): Date | null {
  if (!ts) return null;
  // Getal = Unix seconds (TicketTailor API)
  if (typeof ts === 'number') {
    const d = new Date(ts < 1e10 ? ts * 1000 : ts);
    return isNaN(d.getTime()) ? null : d;
  }
  // "2024-11-10 13:48:55+00" → vervang spatie door T zodat alle browsers correct parsen
  const normalized = ts.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export function computeTimingData(events: AnalyticsEvent[]): TimingData {
  const allRegs = events.flatMap((e) => e.registrations ?? []);

  const hourCounts = Array(24).fill(0);
  const dayCounts = Array(7).fill(0);
  const dayLabels = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  for (const reg of allRegs) {
    const d = parseTs(reg.ingediend_op); // ← enkel dit veld, correct geparsed
    if (!d) continue;
    hourCounts[d.getHours()]++;
    dayCounts[d.getDay()]++;
  }

  const byHourOfDay = hourCounts.map((count, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}u`,
    count,
  }));

  const byDayOfWeek = dayCounts.map((count, day) => ({
    day,
    label: dayLabels[day],
    count,
  }));

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
  const peakDay = dayLabels[peakDayIdx];

  // Days-before buckets
  const bucketDef = [
    { label: 'Zelfde dag',     min: 0,  max: 0 },
    { label: '1 dag voor',     min: 1,  max: 1 },
    { label: '2–3 dagen voor', min: 2,  max: 3 },
    { label: '4–7 dagen voor', min: 4,  max: 7 },
    { label: '1–2 weken voor', min: 8,  max: 14 },
    { label: '2–4 weken voor', min: 15, max: 28 },
    { label: '1+ maand voor',  min: 29, max: 9999 },
  ];

  const daysBeforeValues: number[] = [];
  for (const ev of events) {
    if (!ev.event_datum) continue;
    const evDate = new Date(ev.event_datum);
    for (const reg of ev.registrations ?? []) {
      const regDate = parseTs(reg.ingediend_op); // ← enkel ingediend_op
      if (!regDate) continue;
      const diff = Math.round((evDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) daysBeforeValues.push(diff);
    }
  }

  const byDaysBeforeEvent = bucketDef.map(({ label, min, max }) => ({
    label,
    count: daysBeforeValues.filter((d) => d >= min && d <= max).length,
  }));

  const lastMinuteCount = daysBeforeValues.filter((d) => d <= 1).length;
  const lastMinutePct = daysBeforeValues.length > 0 ? Math.round((lastMinuteCount / daysBeforeValues.length) * 100) : 0;
  const sameWeekCount = daysBeforeValues.filter((d) => d <= 7).length;
  const earlyBirdCount = daysBeforeValues.filter((d) => d > 14).length;
  const earlyBirdPct = daysBeforeValues.length > 0 ? Math.round((earlyBirdCount / daysBeforeValues.length) * 100) : 0;

  return {
    byHourOfDay,
    byDayOfWeek,
    byDaysBeforeEvent,
    peakHour,
    peakDay,
    lastMinuteCount,
    lastMinutePct,
    sameWeekCount,
    earlyBirdCount,
    earlyBirdPct,
  };
}

// ─── Unique Attendees & Growth ─────────────────────────────────────────────────

export interface UniqueAttendeesData {
  totalUnique: number;
  totalRegistrations: number;
  duplicateRate: number; // % of registrations that are repeat visitors
  newVsReturning: { label: string; count: number; percentage: number }[];
  cumulativeUniqueOverEvents: { event: string; cumulative: number; newThisEvent: number }[];
}

export function computeUniqueAttendeesData(events: AnalyticsEvent[]): UniqueAttendeesData {
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.event_datum || !b.event_datum) return 0;
    return new Date(a.event_datum).getTime() - new Date(b.event_datum).getTime();
  });

  const seenEmails = new Set<string>();
  const cumulativeUniqueOverEvents: { event: string; cumulative: number; newThisEvent: number }[] = [];

  for (const ev of sortedEvents) {
    const evEmails = new Set(
      (ev.registrations ?? []).map((r) => r.email?.toLowerCase().trim()).filter(Boolean)
    );
    const newCount = [...evEmails].filter((e) => e && !seenEmails.has(e)).length;
    evEmails.forEach((e) => e && seenEmails.add(e));
    cumulativeUniqueOverEvents.push({
      event: ev.titel.length > 25 ? ev.titel.slice(0, 22) + '…' : ev.titel,
      cumulative: seenEmails.size,
      newThisEvent: newCount,
    });
  }

  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const totalRegistrations = allRegs.length;

  const emailCounts: Record<string, number> = {};
  for (const reg of allRegs) {
    if (!reg.email) continue;
    const e = reg.email.toLowerCase().trim();
    emailCounts[e] = (emailCounts[e] ?? 0) + 1;
  }

  const totalUnique = Object.keys(emailCounts).length;
  const returningRegs = Object.values(emailCounts).filter((c) => c > 1).reduce((sum, c) => sum + c - 1, 0);
  const duplicateRate = totalRegistrations > 0 ? Math.round((returningRegs / totalRegistrations) * 100) : 0;

  const returningPeople = Object.values(emailCounts).filter((c) => c > 1).length;
  const newPeople = totalUnique - returningPeople;

  const newVsReturning = [
    { label: 'Nieuwe deelnemer', count: newPeople, percentage: totalUnique > 0 ? Math.round((newPeople / totalUnique) * 100) : 0 },
    { label: 'Terugkerend', count: returningPeople, percentage: totalUnique > 0 ? Math.round((returningPeople / totalUnique) * 100) : 0 },
  ];

  return { totalUnique, totalRegistrations, duplicateRate, newVsReturning, cumulativeUniqueOverEvents };
}

// ─── Fun Facts ─────────────────────────────────────────────────────────────────

export interface FunFact {
  id: string;
  emoji: string;
  title: string;
  value: string;
  detail: string;
  color: 'orange' | 'blue' | 'green' | 'purple' | 'pink';
}

export function computeFunFacts(events: AnalyticsEvent[], loyaltyData: LoyaltyData, timingData: TimingData): FunFact[] {
  const facts: FunFact[] = [];
  const allRegs = events.flatMap((e) => e.registrations ?? []);

  // Most loyal person
  if (loyaltyData.superfans.length > 0) {
    const top = loyaltyData.superfans[0];
    facts.push({
      id: 'superfan',
      emoji: '🏆',
      title: 'Grootste superfan',
      value: top.name || top.email,
      detail: `was aanwezig bij ${top.eventCount} van de ${events.length} evenementen`,
      color: 'orange',
    });
  }

  // Peak registration hour
  const hourLabel = timingData.peakHour < 12 ? `${timingData.peakHour}u 's ochtends` :
                    timingData.peakHour < 18 ? `${timingData.peakHour}u 's middags` :
                    `${timingData.peakHour}u 's avonds`;
  facts.push({
    id: 'peak-hour',
    emoji: '🕐',
    title: 'Populairste inschrijfmoment',
    value: hourLabel,
    detail: `De meeste mensen schrijven zich in om ${timingData.peakHour}u`,
    color: 'blue',
  });

  // Peak day
  facts.push({
    id: 'peak-day',
    emoji: '📅',
    title: 'Populairste inschrijfdag',
    value: timingData.peakDay,
    detail: `Op ${timingData.peakDay} zijn de meeste inschrijvingen binnengekomen`,
    color: 'green',
  });

  // Last minute people
  if (timingData.lastMinuteCount > 0) {
    facts.push({
      id: 'lastminute',
      emoji: '⚡',
      title: 'Last-minute inschrijvers',
      value: `${timingData.lastMinuteCount} personen`,
      detail: `${timingData.lastMinutePct}% schreef zich in op de dag zelf of de dag ervoor`,
      color: 'pink',
    });
  }

  // Early birds
  if (timingData.earlyBirdCount > 0) {
    facts.push({
      id: 'earlybird',
      emoji: '🐦',
      title: 'Early birds',
      value: `${timingData.earlyBirdCount} personen`,
      detail: `${timingData.earlyBirdPct}% schreef zich meer dan 2 weken op voorhand in`,
      color: 'green',
    });
  }

  // Most popular study program
  const studyCounts: Record<string, number> = {};
  for (const reg of allRegs) {
    const s = (reg as any).study_program?.trim();
    if (s) studyCounts[s] = (studyCounts[s] ?? 0) + 1;
  }
  const topStudy = Object.entries(studyCounts).sort((a, b) => b[1] - a[1])[0];
  if (topStudy) {
    facts.push({
      id: 'top-study',
      emoji: '📚',
      title: 'Populairste opleiding',
      value: topStudy[0].length > 30 ? topStudy[0].slice(0, 27) + '…' : topStudy[0],
      detail: `${topStudy[1]} inschrijvingen vanuit deze richting`,
      color: 'purple',
    });
  }

  // Loyalty rate
  if (loyaltyData.totalUnique > 0) {
    const loyalPct = Math.round(((loyaltyData.totalUnique - (loyaltyData.buckets[0]?.count ?? 0)) / loyaltyData.totalUnique) * 100);
    facts.push({
      id: 'loyalty',
      emoji: '❤️',
      title: 'Loyaliteitsgraad',
      value: `${loyalPct}%`,
      detail: `van alle unieke bezoekers schreef zich in voor meer dan 1 evenement`,
      color: 'pink',
    });
  }

  return facts;
}

// ─── Email Domain Distribution ────────────────────────────────────────────────

export interface EmailDomainData {
  label: string;
  count: number;
  percentage: number;
  isUniversity: boolean;
}

export function computeEmailDomains(events: AnalyticsEvent[]): EmailDomainData[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const domainCounts: Record<string, number> = {};

  for (const reg of allRegs) {
    if (!reg.email) continue;
    const parts = reg.email.toLowerCase().split('@');
    if (parts.length < 2) continue;
    const domain = parts[1].trim();
    domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
  }

  const total = allRegs.filter((r) => r.email).length;
  const UNIVERSITY_DOMAINS = ['ugent.be', 'kuleuven.be', 'vub.be', 'uantwerpen.be', 'uhasselt.be', 'uliege.be', 'ulb.be', 'uclouvain.be'];

  return Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      isUniversity: UNIVERSITY_DOMAINS.some((u) => label.includes(u)),
    }));
    
}

export interface EventCheckInData {
  titel: string;
  registrations: number;
  checkedIn: number;
  checkInRate: number;
  type: string;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export function computeFacultyDistribution(
  events: AnalyticsEvent[],
  topN = 10
): DistributionItem[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const counts: Record<string, number> = {};

  for (const reg of allRegs) {
    const key =
      reg.faculteit?.trim() || 'Onbekend';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const total = allRegs.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}


export function computeHowFoundDistribution(
  events: AnalyticsEvent[]
): DistributionItem[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const counts: Record<string, number> = {};

  for (const reg of allRegs) {
    const key = reg.hoe_gevonden?.trim() || 'Onbekend';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const total = allRegs.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}


export function computeKPIs(events: AnalyticsEvent[]): KPIData {
  const allRegs: Registration[] = events.flatMap((e) => e.registrations ?? []);
  const totalRegistrations = allRegs.length;
  const totalCheckedIn = allRegs.filter((r) => r.checked_in).length;

  const eventsWithCapacity = events.filter(
    (e) => e.max_deelnemers != null && e.max_deelnemers > 0
  );
  const totalCapacity = eventsWithCapacity.reduce(
    (sum, e) => sum + (e.max_deelnemers ?? 0),
    0
  );
  const regsForCapacityEvents = eventsWithCapacity.reduce(
    (sum, e) => sum + (e.registrations?.length ?? 0),
    0
  );

  const faculties = allRegs
    .map((r) => r.faculteit)
    .filter((f): f is string => !!f && f.trim() !== '');
  const uniqueFaculties = new Set(faculties.map((f) => f.toLowerCase().trim())).size;

  return {
    totalRegistrations,
    totalEvents: events.length,
    totalCheckedIn,
    checkInRate:
      totalRegistrations > 0
        ? Math.round((totalCheckedIn / totalRegistrations) * 100)
        : 0,
    avgRegistrationsPerEvent:
      events.length > 0 ? Math.round(totalRegistrations / events.length) : 0,
    capacityUtilization:
      eventsWithCapacity.length > 0 && totalCapacity > 0
        ? Math.round((regsForCapacityEvents / totalCapacity) * 100)
        : null,
    totalWithFaculty: faculties.length,
    uniqueFaculties,
  };
}

export interface KPIData {
  totalRegistrations: number;
  totalEvents: number;
  totalCheckedIn: number;
  checkInRate: number;
  avgRegistrationsPerEvent: number;
  capacityUtilization: number | null; // null if no max_deelnemers set
  totalWithFaculty: number;
  uniqueFaculties: number;
}


const STUDIEJAAR_ORDER = [
  'Bachelor 1',
  'Bachelor 2',
  'Bachelor 3',
  'Master 1',
  'Master 2',
  'Doctoraat',
  'Andere',
  'Onbekend',
];

export function computeStudyYearDistribution(
  events: AnalyticsEvent[]
): DistributionItem[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const counts: Record<string, number> = {};

  for (const reg of allRegs) {
    const key = reg.studiejaar?.trim() || 'Onbekend';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const total = allRegs.length;
  const items = Object.entries(counts).map(([label, count]) => ({
    label,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // Sort by predefined order where possible, others alphabetically
  return items.sort((a, b) => {
    const ai = STUDIEJAAR_ORDER.indexOf(a.label);
    const bi = STUDIEJAAR_ORDER.indexOf(b.label);
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

// ─── Registration Source Distribution ────────────────────────────────────────

export function computeSourceDistribution(
  events: AnalyticsEvent[]
): DistributionItem[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const counts: Record<string, number> = {};

  const BRON_LABELS: Record<string, string> = {
    tally: 'Tally',
    ticket_tailor: 'Ticket Tailor',
    manueel: 'Manueel',
  };

  for (const reg of allRegs) {
    const key = BRON_LABELS[reg.bron] ?? reg.bron ?? 'Onbekend';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const total = allRegs.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

// ─── Check-In Rate Per Event ──────────────────────────────────────────────────

export interface EventCheckInData {
  titel: string;
  registrations: number;
  checkedIn: number;
  checkInRate: number;
  type: string;
}

export function computeEventCheckInRates(
  events: AnalyticsEvent[]
): EventCheckInData[] {
  return events
    .map((e) => {
      const regs = e.registrations ?? [];
      const checkedIn = regs.filter((r) => r.checked_in).length;
      return {
        titel:
          e.titel.length > 30 ? e.titel.slice(0, 27) + '…' : e.titel,
        registrations: regs.length,
        checkedIn,
        checkInRate:
          regs.length > 0 ? Math.round((checkedIn / regs.length) * 100) : 0,
        type: e.type,
      };
    })
    .sort((a, b) => b.checkInRate - a.checkInRate);
}

// ─── Strategic Insights ───────────────────────────────────────────────────────

export interface StrategicInsight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'opportunity';
  title: string;
  description: string;
  metric?: string;
}

export function generateInsights(
  events: AnalyticsEvent[],
  kpis: KPIData
): StrategicInsight[] {
  const insights: StrategicInsight[] = [];

  if (events.length === 0) return insights;

  const allRegs = events.flatMap((e) => e.registrations ?? []);

  // Check-in rate insight
  if (kpis.checkInRate >= 75) {
    insights.push({
      id: 'checkin-high',
      type: 'positive',
      title: 'Hoge opkomst',
      description: `${kpis.checkInRate}% van de ingeschreven deelnemers verscheen effectief. Dit wijst op sterk engagement en relevante topics.`,
      metric: `${kpis.checkInRate}% check-in`,
    });
  } else if (kpis.checkInRate < 50 && kpis.checkInRate > 0) {
    insights.push({
      id: 'checkin-low',
      type: 'warning',
      title: 'Lage opkomst vs. inschrijvingen',
      description: `Slechts ${kpis.checkInRate}% verscheen na inschrijving. Overweeg herinneringsmails of een wachtlijstsysteem om no-shows te reduceren.`,
      metric: `${kpis.checkInRate}% check-in`,
    });
  }

  // Capacity utilization
  if (kpis.capacityUtilization != null) {
    if (kpis.capacityUtilization >= 90) {
      insights.push({
        id: 'capacity-full',
        type: 'opportunity',
        title: 'Capaciteit bijna vol',
        description: `De evenementen bereiken gemiddeld ${kpis.capacityUtilization}% bezetting. Overweeg grotere locaties of extra editie's om vraag op te vangen.`,
        metric: `${kpis.capacityUtilization}% bezetting`,
      });
    } else if (kpis.capacityUtilization < 60) {
      insights.push({
        id: 'capacity-low',
        type: 'warning',
        title: 'Lage capaciteitsbenutting',
        description: `Gemiddeld wordt slechts ${kpis.capacityUtilization}% van de capaciteit benut. Investeer in betere promotie of pas de locatiegrootte aan.`,
        metric: `${kpis.capacityUtilization}% bezetting`,
      });
    }
  }

  // Top faculty
  const facultyDist = computeFacultyDistribution(events, 1);
  if (facultyDist.length > 0 && facultyDist[0].label !== 'Onbekend') {
    insights.push({
      id: 'top-faculty',
      type: 'info',
      title: `Populairste faculteit: ${facultyDist[0].label}`,
      description: `${facultyDist[0].percentage}% van de deelnemers komt uit ${facultyDist[0].label}. Versterk de band via gerichte communicatie. Analyseer ook ondervertegenwoordigde faculteiten voor groeikansen.`,
      metric: `${facultyDist[0].percentage}% van deelnemers`,
    });
  }

  // How found
  const howFoundDist = computeHowFoundDistribution(events).filter(
    (d) => d.label !== 'Onbekend'
  );
  if (howFoundDist.length > 0) {
    const top = howFoundDist[0];
    insights.push({
      id: 'top-channel',
      type: 'positive',
      title: `Sterkste kanaal: ${top.label}`,
      description: `${top.percentage}% van de deelnemers vond ons via ${top.label}. Verhoog de investeringen in dit kanaal en test nieuwe kanalen voor diversificatie.`,
      metric: `${top.percentage}% van inschrijvingen`,
    });
  }

  // Study year insight
  const studyYearDist = computeStudyYearDistribution(events).filter(
    (d) => d.label !== 'Onbekend'
  );
  if (studyYearDist.length > 0) {
    const topYear = studyYearDist[0];
    const masterCount = studyYearDist
      .filter((d) => d.label.toLowerCase().includes('master'))
      .reduce((sum, d) => sum + d.count, 0);
    const bachelorCount = studyYearDist
      .filter((d) => d.label.toLowerCase().includes('bachelor'))
      .reduce((sum, d) => sum + d.count, 0);
    const total = allRegs.length;

    if (total > 0) {
      const masterPct = Math.round((masterCount / total) * 100);
      const bachelorPct = Math.round((bachelorCount / total) * 100);

      if (masterPct > bachelorPct) {
        insights.push({
          id: 'studiejaar-masters',
          type: 'info',
          title: 'Masterstudenten domineren',
          description: `${masterPct}% van de deelnemers is masterstudent vs. ${bachelorPct}% bachelor. Inhoud en timing afstemmen op mastertraject biedt kansen.`,
          metric: `${masterPct}% masters`,
        });
      } else if (bachelorPct > masterPct) {
        insights.push({
          id: 'studiejaar-bachelors',
          type: 'info',
          title: 'Bachelorstudenten domineren',
          description: `${bachelorPct}% van de deelnemers is bachelorstudent. Introductiegerichte content en workshops sluiten goed aan op deze doelgroep.`,
          metric: `${bachelorPct}% bachelors`,
        });
      }
    }
  }

  // Events with high variance in check-in rates
  const checkInRates = computeEventCheckInRates(events).map((e) => e.checkInRate);
  if (checkInRates.length >= 3) {
    const max = Math.max(...checkInRates);
    const min = Math.min(...checkInRates);
    if (max - min > 40) {
      insights.push({
        id: 'variance-high',
        type: 'opportunity',
        title: 'Grote variatie in opkomst per evenement',
        description: `De opkomst varieert van ${min}% tot ${max}%. Analyseer welke factoren (topic, dag, locatie) de beste opkomst verklaren om succesvolle elementen te repliceren.`,
        metric: `${min}–${max}% range`,
      });
    }
  }

  return insights;
}


export function computeStudyProgramDistribution(
  events: AnalyticsEvent[],
  topN = 20
): DistributionItem[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const counts: Record<string, number> = {};
 
  for (const reg of allRegs) {
    const key = (reg as any).study_program?.trim();
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
 
  const total = allRegs.filter((r) => (r as any).study_program?.trim()).length;
 
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}


// ─── 1. Retention Funnel ──────────────────────────────────────────────────────
// Shows: Registered → Checked in → Returned (attended 2+ events)

export interface RetentionFunnelData {
  stages: { label: string; count: number; percentage: number; color: string }[];
  dropOffRegistrationToCheckIn: number;
  dropOffCheckInToReturn: number;
}

export function computeRetentionFunnel(events: AnalyticsEvent[]): RetentionFunnelData {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const totalRegistered = allRegs.length;
  const totalCheckedIn = allRegs.filter((r) => r.checked_in).length;

  // "Returned" = unique email that checked in at 2+ different events
  const emailCheckInCounts: Record<string, number> = {};
  for (const ev of events) {
    const regs = ev.registrations ?? [];
    for (const reg of regs) {
      if (!reg.checked_in || !reg.email) continue;
      const email = reg.email.toLowerCase().trim();
      emailCheckInCounts[email] = (emailCheckInCounts[email] ?? 0) + 1;
    }
  }
  const returned = Object.values(emailCheckInCounts).filter((c) => c >= 2).length;

  const stages = [
    { label: 'Ingeschreven',    count: totalRegistered, percentage: 100,                                                                           color: '#bfdbfe' },
    { label: 'Aanwezig',        count: totalCheckedIn,  percentage: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0, color: '#ed6425' },
    { label: 'Terugkerend',     count: returned,        percentage: totalRegistered > 0 ? Math.round((returned / totalRegistered) * 100) : 0,       color: '#041c3a' },
  ];

  return {
    stages,
    dropOffRegistrationToCheckIn: 100 - stages[1].percentage,
    dropOffCheckInToReturn: stages[1].percentage - stages[2].percentage,
  };
}

// ─── 2. Event Success Score ───────────────────────────────────────────────────
// Composite score per event: check-in rate (50%) + capacity utilization (30%) + absolute registrations normalized (20%)
// Useful for identifying which event formats/topics work best.

export interface EventSuccessScore {
  titel: string;
  type: string;
  score: number;          // 0–100
  checkInRate: number;
  capacityPct: number | null;
  registrations: number;
  grade: 'excellent' | 'good' | 'average' | 'low';
}

export function computeEventSuccessScores(events: AnalyticsEvent[]): EventSuccessScore[] {
  if (events.length === 0) return [];

  const maxRegs = Math.max(...events.map((e) => e.registrations?.length ?? 0));

  return events
    .map((e) => {
      const regs = e.registrations ?? [];
      const checkedIn = regs.filter((r) => r.checked_in).length;
      const checkInRate = regs.length > 0 ? Math.round((checkedIn / regs.length) * 100) : 0;
      const capacityPct =
        e.max_deelnemers && e.max_deelnemers > 0
          ? Math.min(100, Math.round((regs.length / e.max_deelnemers) * 100))
          : null;
      const regScore = maxRegs > 0 ? Math.round((regs.length / maxRegs) * 100) : 0;

      const score =
        checkInRate * 0.5 +
        (capacityPct ?? regScore) * 0.3 +
        regScore * 0.2;

      const roundedScore = Math.round(score);
      const grade: EventSuccessScore['grade'] =
        roundedScore >= 75 ? 'excellent' :
        roundedScore >= 55 ? 'good' :
        roundedScore >= 35 ? 'average' : 'low';

      return {
        titel: e.titel.length > 30 ? e.titel.slice(0, 27) + '…' : e.titel,
        type: e.type,
        score: roundedScore,
        checkInRate,
        capacityPct,
        registrations: regs.length,
        grade,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── 3. Channel Effectiveness ─────────────────────────────────────────────────
// Cross-tabs hoe_gevonden with check-in rate — reveals which discovery channels
// produce the most committed attendees (not just registrations).

export interface ChannelEffectivenessData {
  channel: string;
  registrations: number;
  checkedIn: number;
  checkInRate: number;
  shareOfRegistrations: number;
}

export function computeChannelEffectiveness(events: AnalyticsEvent[]): ChannelEffectivenessData[] {
  const allRegs = events.flatMap((e) => e.registrations ?? []);
  const total = allRegs.length;

  const channelMap: Record<string, { regs: number; checkedIn: number }> = {};

  for (const reg of allRegs) {
    const key = reg.hoe_gevonden?.trim() || 'Onbekend';
    if (!channelMap[key]) channelMap[key] = { regs: 0, checkedIn: 0 };
    channelMap[key].regs++;
    if (reg.checked_in) channelMap[key].checkedIn++;
  }

  return Object.entries(channelMap)
    .filter(([key]) => key !== 'Onbekend')
    .map(([channel, { regs, checkedIn }]) => ({
      channel,
      registrations: regs,
      checkedIn,
      checkInRate: regs > 0 ? Math.round((checkedIn / regs) * 100) : 0,
      shareOfRegistrations: total > 0 ? Math.round((regs / total) * 100) : 0,
    }))
    .sort((a, b) => b.registrations - a.registrations);
}