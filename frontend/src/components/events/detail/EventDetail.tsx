import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar, MapPin, Users, Clock, User, Package, Star,
  MessageSquare, Euro, TrendingUp, TrendingDown, CheckCircle2,
  XCircle, UserCheck, Archive,
} from 'lucide-react';
import type { Event } from '../../../types/event';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface EventDetailProps {
  event: Event;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  badge,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4 border-b border-slate-100">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#041c3a] flex items-center gap-2">
          {icon}
          {title}
          {badge != null && badge > 0 && (
            <Badge className="ml-0.5 text-[10px] bg-[#ed6425] text-white border-0 px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3">{children}</CardContent>
    </Card>
  );
}

const ScoreBar = ({ score, max = 5 }: { score: number; max?: number }) => (
  <div className="flex items-center gap-2 flex-1">
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#041c3a] to-[#ed6425] rounded-full transition-all"
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
    <span className="text-sm font-black text-[#041c3a] w-8 text-right">{score}</span>
  </div>
);
function formatTijd(tijd: string | null): string {
  if (!tijd) return '';
  return tijd.slice(0, 5); // "14:00:00" -> "14:00"
}
// ─── main component ───────────────────────────────────────────────────────────

export function EventDetail({ event }: EventDetailProps) {
  const regCount = event.registraties?.length ?? 0;
  const fbCount = event.feedback?.length ?? 0;

  const avgScore =
    event.feedback?.length
      ? (
          event.feedback
            .map((f) => ((f.schaal_1 ?? 0) + (f.schaal_2 ?? 0) + (f.schaal_3 ?? 0)) / 3)
            .reduce((a, b) => a + b, 0) / event.feedback.length
        ).toFixed(1)
      : null;

  const financieel = (event as any).financieel_resultaat as number | null | undefined;
  const isPositive = financieel != null && financieel >= 0;
  const isNegative = financieel != null && financieel < 0;

  // Rollen — may be joined on the event object
  const rollen: any[] = (event as any).event_rollen ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header badges ── */}
      <div className="flex flex-wrap gap-2 items-center">
        {event.is_published && (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold uppercase tracking-wide"
          >
            Gepubliceerd
          </Badge>
        )}
      </div>

      <h2 className="text-xl font-black text-[#041c3a] leading-tight">{event.titel}</h2>

      {/* ── Details grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {event.event_datum && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <Calendar className="w-4 h-4 text-[#ed6425] flex-shrink-0" />
            <span className="font-medium">
              {format(new Date(event.event_datum), 'd MMMM yyyy', { locale: nl })}
            </span>
          </div>
        )}
        {event.locatie && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <MapPin className="w-4 h-4 text-[#ed6425] flex-shrink-0" />
            <span className="font-medium">{event.locatie}</span>
          </div>
        )}
        {event.start_tijd && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <Clock className="w-4 h-4 text-[#ed6425] flex-shrink-0" />
            <span className="font-medium">
              {event.deuren_open && `Deuren: ${formatTijd(event.deuren_open)}  `}
              <br />
              {`Uur: ${formatTijd(event.start_tijd)}`} – {formatTijd(event.einde_tijd)}
            </span>
          </div>
        )}
        {event.max_deelnemers && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <Users className="w-4 h-4 text-[#ed6425] flex-shrink-0" />
            <span className="font-medium">Max. {event.max_deelnemers} deelnemers</span>
          </div>
        )}
      </div>

      {/* ── Stats (compleet) ── */}
      {event.status === 'compleet' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-[#041c3a] rounded-xl text-center">
            <p className="text-3xl font-black text-white">{regCount}</p>
            <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mt-1">
              Inschrijvingen
            </p>
          </div>
          <div className="p-4 bg-[#ed6425] rounded-xl text-center">
            <p className="text-3xl font-black text-white">{fbCount}</p>
            <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mt-1">
              Feedback
            </p>
          </div>
          {avgScore && (
            <div className="p-4 bg-amber-400 rounded-xl text-center">
              <p className="text-3xl font-black text-white flex items-center justify-center gap-1">
                <Star className="w-5 h-5" />
                {avgScore}
              </p>
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wide mt-1">
                Gem. score
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Financieel resultaat ── */}
      {financieel != null && (
        <SectionCard
          icon={<Euro className="w-3.5 h-3.5 text-[#ed6425]" />}
          title="Financieel resultaat"
        >
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isPositive
                ? 'bg-emerald-50 border-emerald-100'
                : isNegative
                ? 'bg-red-50 border-red-100'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-2xl font-black ${
                isPositive ? 'text-emerald-700' : isNegative ? 'text-red-600' : 'text-slate-600'
              }`}
            >
              € {financieel.toFixed(2)}
            </span>
            <Badge
              variant="outline"
              className={`ml-auto text-xs font-semibold ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-red-100 text-red-600 border-red-200'
              }`}
            >
              {isPositive ? 'Winst' : 'Verlies'}
            </Badge>
          </div>
        </SectionCard>
      )}

      {/* ── Descriptions ── */}
      {event.beschrijving_website && (
        <SectionCard title="Beschrijving website">
          <p className="text-sm text-slate-600 leading-relaxed">{event.beschrijving_website}</p>
        </SectionCard>
      )}

      {event.beschrijving_sociaal && (
        <SectionCard title="Sociale media tekst">
          <p className="text-sm text-slate-600 leading-relaxed">{event.beschrijving_sociaal}</p>
        </SectionCard>
      )}

      
      {/* ── Sprekers ── */}
      {event.sprekers && event.sprekers.length > 0 && (
        <SectionCard
          icon={<User className="w-3.5 h-3.5 text-[#ed6425]" />}
          title="Sprekers"
          badge={event.sprekers.length}
        >
          <div className="space-y-3">
            {event.sprekers
              .sort((a, b) => a.volgorde - b.volgorde)
              .map((spreker) => (
                <div
                  key={spreker.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#041c3a] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-[#041c3a]">{spreker.naam}</p>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize bg-[#ed6425]/10 text-[#ed6425] border-[#ed6425]/20 font-semibold"
                      >
                        {spreker.rol}
                      </Badge>
                    </div>
                    {spreker.email && (
                      <p className="text-xs text-slate-500 mt-0.5">{spreker.email}</p>
                    )}
                    {spreker.telefoon && (
                      <p className="text-xs text-slate-400 mt-0.5">{spreker.telefoon}</p>
                    )}
                    {spreker.omschrijving && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {spreker.omschrijving}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>
      )}

      {/* ── Rollen ── */}
      {rollen.length > 0 && (
        <SectionCard
          icon={<Users className="w-3.5 h-3.5 text-[#ed6425]" />}
          title="Shiftenlijst"
          badge={rollen.reduce((sum, r) => sum + (r.toegewezen?.length ?? 0), 0)}
        >
          <div className="space-y-3">
            {rollen.map((rol: any) => {
              const count = rol.toegewezen?.length ?? 0;
              const full = !rol.is_default && count >= rol.plaatsen;
              return (
                <div key={rol.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#041c3a]">{rol.naam}</p>
                      {rol.is_default && (
                        <Badge variant="outline" className="text-[9px] bg-[#ed6425]/10 text-[#ed6425] border-[#ed6425]/20">
                          Standaard
                        </Badge>
                      )}
                    </div>
                    {!rol.is_default && (
                      <span className={`text-xs font-semibold ${full ? 'text-red-500' : 'text-slate-400'}`}>
                        {count} / {rol.plaatsen}
                      </span>
                    )}
                  </div>
                  {rol.uren && <p className="text-xs text-slate-400">{rol.uren}</p>}
                  {count > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rol.toegewezen.map((t: any) => {
                        const name = t.user_naam ?? t.user_email?.split('@')[0] ?? 'Gebruiker';
                        return (
                          <span
                            key={t.user_id}
                            className="text-[11px] font-medium text-[#041c3a] bg-white border border-slate-200 rounded-full px-2.5 py-1"
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Feedback summary ── */}
      {event.status === 'compleet' &&
        event.feedback &&
        event.feedback.length > 0 &&
        (() => {
          const fb = event.feedback;
          const avg = (key: 'schaal_1' | 'schaal_2' | 'schaal_3') => {
            const vals = fb.map((f) => f[key]).filter(Boolean) as number[];
            return vals.length
              ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
              : null;
          };
          const avg1 = avg('schaal_1');
          const avg2 = avg('schaal_2');
          const avg3 = avg('schaal_3');

          return (
            <SectionCard
              icon={<MessageSquare className="w-3.5 h-3.5 text-[#ed6425]" />}
              title={`Feedback — ${fb.length} ${fb.length === 1 ? 'respons' : 'responses'}`}
            >
              <div className="space-y-5">
                {/* Gemiddelde scores */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gemiddelde scores (op 5)
                  </p>
                  {[
                    { label: 'Organisatie', value: avg1 },
                    { label: 'Locatie & faciliteiten', value: avg2 },
                    { label: 'Inhoud', value: avg3 },
                  ].map(
                    ({ label, value }) =>
                      value && (
                        <div key={label} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-600 w-36 flex-shrink-0">
                            {label}
                          </span>
                          <ScoreBar score={parseFloat(value)} />
                        </div>
                      )
                  )}
                </div>

                <Separator />

                {/* Kwalitatieve antwoorden */}
                {['wat_kon_beter', 'favo_onderdeel', 'andere_opmerkingen'].some((key) =>
                  fb.some((f) => f[key as keyof typeof f])
                ) && (
                  <div className="space-y-4">
                    {[
                      { key: 'wat_kon_beter', label: 'Wat kon beter?' },
                      { key: 'favo_onderdeel', label: 'Favoriet onderdeel' },
                      { key: 'andere_opmerkingen', label: 'Andere opmerkingen' },
                    ].map(({ key, label }) => {
                      const answers = fb
                        .map((f) => f[key as keyof typeof f] as string)
                        .filter(Boolean);
                      if (!answers.length) return null;
                      return (
                        <div key={key}>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {label}
                          </p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {answers.map((ans, i) => (
                              <div
                                key={i}
                                className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 leading-relaxed"
                              >
                                {ans}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>
          );
        })()}
    </div>
  );
}