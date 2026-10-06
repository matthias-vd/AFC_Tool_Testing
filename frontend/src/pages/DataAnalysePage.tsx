import { useEffect, useMemo, useState } from 'react';
import {
  BarChart2,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  BarChart,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AppLayout } from '../components/layout/AppLayout';
import { useAnalytics } from '../hooks/useAnalytics';

import { AnalyticsKPICards } from '../components/analytics/AnalyticsKPICards';
import { EventTypeFilterTabs } from '../components/analytics/EventTypeFilterTabs';
import { FacultyChart } from '../components/analytics/FacultyChart';
import { HowFoundChart } from '../components/analytics/HowFoundChart';
import { StudyYearChart } from '../components/analytics/StudyYearChart';
import { CheckInRateChart } from '../components/analytics/CheckInRateChart';
import { RegistrationSourceChart } from '../components/analytics/RegistrationSourceChart';
import { YearComparisonChart } from '../components/analytics/YearComparisonChart';
import { StrategicInsights } from '../components/analytics/StrategicInsights';
import { ChartCard } from '../components/analytics/ChartCard';
import { LoyaltyChart } from '../components/analytics/LoyaltyChart';
import { RegistrationTimingChart } from '../components/analytics/RegistrationTimingChart';
import { FunFactsGrid } from '../components/analytics/FunFactsGrid';
import { UniqueAttendeesChart } from '../components/analytics/UniqueAttendeesChart';
import { EmailDomainChart } from '../components/analytics/EmailDomainChart';
import { StudyProgramChart } from '../components/analytics/StudyProgramChart';
import { RetentionFunnelChart } from '../components/analytics/RetentionFunnelChart';
import { EventSuccessScoreChart } from '../components/analytics/EventSuccessScoreChart';
import { ChannelEffectivenessChart } from '../components/analytics/ChannelEffectivenessChart';
import { EventMultiSelectFilter } from '../components/analytics/EventMultiSelectFilter';
import { RegistrationDaysBeforeChart } from '../components/analytics/RegistrationDaysBeforeChart';
import {
  computeKPIs,
  computeFacultyDistribution,
  computeHowFoundDistribution,
  computeStudyYearDistribution,
  computeSourceDistribution,
  computeEventCheckInRates,
  generateInsights,
  computeLoyaltyData,
  computeTimingData,
  computeUniqueAttendeesData,
  computeFunFacts,
  computeEmailDomains,
  computeStudyProgramDistribution,
  computeRetentionFunnel,
  computeEventSuccessScores,
  computeChannelEffectiveness,
  computeDaysBeforeDistribution,
} from '../lib/analyticsUtils';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Overzicht',    icon: BarChart2 },
  { id: 'doelgroep',  label: 'Doelgroep',    icon: Users },
  { id: 'engagement', label: 'Engagement',   icon: Zap },
  { id: 'bereik',     label: 'Bereik',       icon: Globe },
  { id: 'timing',     label: 'Timing',       icon: Calendar },
  { id: 'vergelijking', label: 'Vergelijking', icon: BarChart },
] as const;

type TabId = typeof TABS[number]['id'];

export default function DataAnalysePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const {
    years,
    selectedYear,
    selectedYearId,
    setSelectedYearId,
    selectedEventType,
    setSelectedEventType,
    events,
    allEvents,
    yearSummaries,
    loading,
    yearsLoading,
    error,
    refetch,
  } = useAnalytics();
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const filteredEvents = useMemo(
  () => selectedEventIds.length === 0
    ? events
    : events.filter((e) => selectedEventIds.includes(e.id)),
  [events, selectedEventIds]
  );
  // ── Computed data ─────────────────────────────────────────────────────────
  const kpis             = useMemo(() => computeKPIs(filteredEvents), [filteredEvents]);
  const facultyData      = useMemo(() => computeFacultyDistribution(filteredEvents, 10), [filteredEvents]);
  const howFoundData     = useMemo(() => computeHowFoundDistribution(filteredEvents), [filteredEvents]);
  const studyYearData    = useMemo(() => computeStudyYearDistribution(filteredEvents), [filteredEvents]);
  const sourceData       = useMemo(() => computeSourceDistribution(filteredEvents), [filteredEvents]);
  const checkInData      = useMemo(() => computeEventCheckInRates(filteredEvents), [filteredEvents]);
  const insights         = useMemo(() => generateInsights(filteredEvents, kpis), [filteredEvents, kpis]);
  const loyaltyData      = useMemo(() => computeLoyaltyData(filteredEvents), [filteredEvents]);
  const timingData       = useMemo(() => computeTimingData(filteredEvents), [filteredEvents]);
  const uniqueData       = useMemo(() => computeUniqueAttendeesData(filteredEvents), [filteredEvents]);
  const funFacts         = useMemo(() => computeFunFacts(filteredEvents, loyaltyData, timingData), [filteredEvents, loyaltyData, timingData]);
  const emailDomains     = useMemo(() => computeEmailDomains(filteredEvents), [filteredEvents]);
  const studyProgramData = useMemo(() => computeStudyProgramDistribution(filteredEvents, 20), [filteredEvents]);
  const retentionFunnel  = useMemo(() => computeRetentionFunnel(filteredEvents), [filteredEvents]);
  const successScores    = useMemo(() => computeEventSuccessScores(filteredEvents), [filteredEvents]);
  const channelData      = useMemo(() => computeChannelEffectiveness(filteredEvents), [filteredEvents]);
  const daysBeforeData   = useMemo(() => computeDaysBeforeDistribution(filteredEvents), [filteredEvents]);
  console.log("daysbefore");
  
  console.log(daysBeforeData);
  
  const hasData = !loading && filteredEvents.length > 0;
  const hasNoEvents = !loading && !error && allEvents.length === 0;
  const hasNoFilteredEvents = !loading && !error && allEvents.length > 0 && filteredEvents.length === 0;

  useEffect(() => {
    setSelectedEventIds([]);
  }, [selectedYearId, selectedEventType]);
  return (
    <AppLayout title="Data Analyse" subtitle="Strategisch inzicht per academiejaar">
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#041c3a]">
                <BarChart2 className="h-5 w-5 text-[#ed6425]" />
              </div>
              <h1 className="text-2xl font-bold text-[#041c3a] tracking-tight">
                Data Analyse
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-[52px]">
              Analyse op afgeronde evenementen — strategische inzichten per academiejaar.
            </p>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-[#ed6425]/30 via-[#041c3a]/10 to-transparent" />

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Academiejaar</span>
            {yearsLoading ? (
              <div className="w-40 h-9 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <Select
                value={selectedYearId ?? ''}
                onValueChange={(v) => setSelectedYearId(v)}
                disabled={years.length === 0}
              >
                <SelectTrigger className="w-44 h-9 text-sm border-slate-200 focus:ring-[#ed6425]">
                  <SelectValue placeholder="Kies jaar…" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.naam}
                      {y.is_huidig && (
                        <span className="ml-1.5 text-[#ed6425] text-[10px] font-bold">●</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

        <div className="w-px h-6 bg-slate-200" />

        <EventTypeFilterTabs
          selected={selectedEventType}
          onChange={setSelectedEventType}
          allEvents={allEvents}
        />

        <div className="w-px h-6 bg-slate-200" />

        <EventMultiSelectFilter
          events={events}
          selectedIds={selectedEventIds}
          onChange={setSelectedEventIds}
        />
        </div>

        {/* ── Active year banner ───────────────────────────────────────── */}
        {selectedYear && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#041c3a]">
            <TrendingUp className="h-4 w-4 text-[#ed6425] shrink-0" />
            <p className="text-sm text-white">
              Analyse voor{' '}
              <strong className="font-semibold text-[#ed6425]">{selectedYear.naam}</strong>
              <span className="text-slate-300 ml-2">
                · {allEvents.length} afgeronde evenementen
                {selectedEventType !== 'all' && ` · filter: ${selectedEventType}`}
              </span>
            </p>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-3 text-[#ed6425]" />
            <span className="text-sm">Data laden…</span>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Fout bij laden</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch?.()} className="text-red-600 hover:text-red-700">
              <RefreshCw className="h-4 w-4 mr-1" /> Opnieuw
            </Button>
          </div>
        )}

        {/* ── Empty states ─────────────────────────────────────────────── */}
        {hasNoEvents && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#041c3a]/5 border border-[#041c3a]/10 flex items-center justify-center mb-4">
              <BarChart2 className="h-8 w-8 text-[#041c3a]/30" />
            </div>
            <h3 className="text-base font-semibold text-[#041c3a] mb-1">Geen afgeronde evenementen</h3>
            <p className="text-sm text-slate-400">
              Analyse is enkel beschikbaar voor evenementen met status <strong>compleet</strong>.
            </p>
          </div>
        )}

        {hasNoFilteredEvents && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-400">
              Geen afgeronde <strong>{selectedEventType}</strong>-evenementen in dit academiejaar.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MAIN ANALYTICS CONTENT
        ══════════════════════════════════════════════════════════════ */}
        {hasData && (
          <div className="space-y-6">

            {/* ── KPI Cards always visible ──────────────────────────────── */}
            <AnalyticsKPICards kpis={kpis} />

            {/* ── Tab navigation ───────────────────────────────────────── */}
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex gap-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                        ${isActive
                          ? 'border-[#ed6425] text-[#ed6425]'
                          : 'border-transparent text-slate-500 hover:text-[#041c3a] hover:border-slate-300'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ══════════════════════════════════════════════════════════
                TAB: OVERZICHT
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {funFacts.length > 0 && (
                  <div>
                    <SectionHeader emoji="🎉" title="Leuke feiten & recordhouders" />
                    <FunFactsGrid facts={funFacts} />
                  </div>
                )}

                <div>
                  <SectionHeader emoji="💡" title="Strategische inzichten" />
                  <StrategicInsights insights={insights} />
                </div>

                {/* Quick snapshot: check-in rate + success scores */}
                <ChartCard
                  title="Evenement prestaties"
                  subtitle="Check-in rate en successcore per evenement"
                  badge={`${events.length} events`}
                >
                  <EventSuccessScoreChart data={successScores} />
                </ChartCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: DOELGROEP
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'doelgroep' && (
              <div className="space-y-6">
                <SectionHeader emoji="🎓" title="Wie zijn onze deelnemers?" />

                {/* Study year — FIXED: Onbekend filtered, proper color coding */}
                <ChartCard
                  title="Studiejaar verdeling"
                  subtitle="Welke studiejaren participeren — enkel bekende data"
                  badge={`${kpis.totalRegistrations} inschrijvingen`}
                >
                  <StudyYearChart data={studyYearData.filter(d => d.label !== 'Onbekend')} />
                </ChartCard>

                {/* Faculty + Email domains side by side */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard
                    title="Faculteitsverdeling"
                    subtitle="Top 10 faculteiten op basis van inschrijvingen"
                    badge={`${kpis.uniqueFaculties} faculteiten`}
                  >
                    <FacultyChart data={facultyData.filter(d => d.label !== 'Onbekend')} />
                  </ChartCard>

                  <ChartCard
                    title="E-maildomeinen"
                    subtitle="Uni vs. privé e-mailadressen"
                    badge={`${emailDomains.length} domeinen`}
                  >
                    <EmailDomainChart data={emailDomains} />
                  </ChartCard>
                </div>

                {/* Study programs */}
                <ChartCard
                  title="Opleidingen"
                  subtitle="Welke studierichtingen schrijven zich het meest in"
                  badge={`${studyProgramData.length} opleidingen`}
                >
                  <StudyProgramChart data={studyProgramData} />
                </ChartCard>

                {/* New: Bachelor vs Master breakdown insight card */}
                <AudienceBreakdownCard studyYearData={studyYearData} />
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: ENGAGEMENT
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'engagement' && (
              <div className="space-y-6">
                <SectionHeader emoji="❤️" title="Loyaliteit & betrokkenheid" />

                {/* Retention funnel */}
                <ChartCard
                  title="Retentietrechter"
                  subtitle="Van inschrijving naar aanwezigheid naar terugkeer"
                >
                  <RetentionFunnelChart data={retentionFunnel} />
                </ChartCard>

                {/* Loyalty */}
                <ChartCard
                  title="Loyaliteit & superfans"
                  subtitle="Hoeveel evenementen bezocht elke persoon?"
                  badge={`${loyaltyData.totalUnique} bezoekers`}
                >
                  <LoyaltyChart data={loyaltyData} />
                </ChartCard>

                {/* Check-in rate per event */}
                <ChartCard
                  title="Check-in rate per evenement"
                  subtitle="Percentage ingeschreven deelnemers dat effectief aanwezig was"
                  badge={`${events.length} events`}
                >
                  <CheckInRateChart data={checkInData} />
                </ChartCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: BEREIK
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'bereik' && (
              <div className="space-y-6">
                <SectionHeader emoji="📡" title="Hoe bereiken we mensen?" />

                {/* Unique attendees growth */}
                <ChartCard
                  title="Unieke bezoekers & bereik"
                  subtitle="Hoeveel unieke mensen bereiken we over evenementen heen"
                  badge={`${uniqueData.totalUnique} uniek`}
                >
                  <UniqueAttendeesChart data={uniqueData} />
                </ChartCard>

                {/* Channel effectiveness — how found vs check-in rate */}
                <ChartCard
                  title="Kanaaleffectiviteit"
                  subtitle="Welk kanaal levert de meeste én meest betrokken deelnemers"
                >
                  <ChannelEffectivenessChart data={channelData} />
                </ChartCard>

                {/* How found + Source side by side */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard
                    title="Hoe gevonden?"
                    subtitle="Via welk kanaal deelnemers de evenementen ontdekten"
                  >
                    <HowFoundChart data={howFoundData.filter(d => d.label !== 'Onbekend')} />
                  </ChartCard>

                  <ChartCard
                    title="Registratiebron"
                    subtitle="Via welk platform werden inschrijvingen ingediend"
                  >
                    <RegistrationSourceChart data={sourceData} />
                  </ChartCard>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: TIMING
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'timing' && (
              <div className="space-y-6">
                <SectionHeader emoji="🕐" title="Wanneer schrijven mensen zich in?" />

                <ChartCard
                  title="Inschrijfgedrag & timing"
                  subtitle="Uur van de dag, dag van de week, en hoe ver op voorhand"
                >
                  <RegistrationTimingChart data={timingData} />
                </ChartCard>

                <ChartCard
                  title="Dagen vóór evenement"
                  subtitle="Hoeveel mensen schreven zich hoeveel dagen op voorhand in"
                  badge={`${daysBeforeData.reduce((s, d) => s + d.count, 0)} inschrijvingen`}
                >
                  <RegistrationDaysBeforeChart data={daysBeforeData} />
                </ChartCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: VERGELIJKING
            ══════════════════════════════════════════════════════════ */}
            {activeTab === 'vergelijking' && (
              <div className="space-y-6">
                <SectionHeader emoji="📊" title="Vergelijking over academiejaren" />

                <ChartCard
                  title="Inschrijvingen & aanwezigheid per academiejaar"
                  subtitle="Alle afgeronde evenementen — langetermijntrend"
                  badge={`${yearSummaries.length} jaren`}
                >
                  <YearComparisonChart
                    summaries={yearSummaries}
                    selectedYearId={selectedYearId}
                  />
                </ChartCard>
              </div>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function SectionHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <h2 className="text-sm font-semibold text-[#041c3a] mb-3 flex items-center gap-2">
      <span className="text-base">{emoji}</span>
      <span>{title}</span>
      <span className="h-px flex-1 bg-slate-100" />
    </h2>
  );
}

/** Quick bachelor vs master breakdown card shown in Doelgroep tab */
function AudienceBreakdownCard({ studyYearData }: { studyYearData: { label: string; count: number; percentage: number }[] }) {
  const known = studyYearData.filter(d => d.label !== 'Onbekend');
  const total = known.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const bachelor = known.filter(d => d.label.toLowerCase().includes('bachelor')).reduce((s, d) => s + d.count, 0);
  const master   = known.filter(d => d.label.toLowerCase().includes('master')).reduce((s, d) => s + d.count, 0);
  const docto    = known.filter(d => d.label.toLowerCase().includes('doctoraat')).reduce((s, d) => s + d.count, 0);
  const other    = total - bachelor - master - docto;

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const segments = [
    { label: 'Bachelor', count: bachelor, pct: pct(bachelor), color: 'bg-blue-400' },
    { label: 'Master',   count: master,   pct: pct(master),   color: 'bg-[#ed6425]' },
    { label: 'Doctoraat',count: docto,    pct: pct(docto),    color: 'bg-[#041c3a]' },
    { label: 'Andere',   count: other,    pct: pct(other),    color: 'bg-slate-300' },
  ].filter(s => s.count > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-[#041c3a] mb-3">Niveauverdeling (enkel bekende data)</p>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-4 mb-4 gap-0.5">
        {segments.map(s => (
          <div
            key={s.label}
            className={`${s.color} transition-all`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label}: ${s.pct}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-sm ${s.color}`} />
            <span className="text-xs text-slate-600">
              <strong className="text-[#041c3a]">{s.pct}%</strong> {s.label}
              <span className="text-slate-400 ml-1">({s.count})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}