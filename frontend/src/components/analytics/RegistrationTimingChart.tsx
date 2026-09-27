import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TimingData } from '../../lib/analyticsUtils';

interface RegistrationTimingChartProps {
  data: TimingData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#041c3a] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-[#ed6425]">{payload[0]?.value} inschrijvingen</p>
      </div>
    );
  }
  return null;
};

function getHourColor(hour: number, maxVal: number, val: number): string {
  const intensity = maxVal > 0 ? val / maxVal : 0;
  // Sleep hours (0-7): muted blue
  if (hour >= 0 && hour < 7) return `rgba(148, 163, 184, ${0.2 + intensity * 0.4})`;
  // Morning (7-12): sky blue
  if (hour < 12) return `rgba(56, 189, 248, ${0.3 + intensity * 0.7})`;
  // Afternoon (12-18): orange
  if (hour < 18) return `rgba(237, 100, 37, ${0.3 + intensity * 0.7})`;
  // Evening (18-23): purple
  return `rgba(139, 92, 246, ${0.3 + intensity * 0.7})`;
}

export function RegistrationTimingChart({ data }: RegistrationTimingChartProps) {
  if (!data) return null;

  const maxHour = Math.max(...data.byHourOfDay.map((h) => h.count));
  const maxDay = Math.max(...data.byDayOfWeek.map((d) => d.count));
  const maxDaysBefore = Math.max(...data.byDaysBeforeEvent.map((d) => d.count));

  return (
    <div className="space-y-6">

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-[#ed6425]">⚡ {data.lastMinutePct}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Last-minute (≤1 dag)</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">🐦 {data.earlyBirdPct}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Early birds (&gt;2 weken)</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-600">🕐 {data.peakHour}u</p>
          <p className="text-xs text-slate-500 mt-0.5">Piekuur inschrijvingen</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-purple-600">📅 {data.peakDay.slice(0, 3)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Drukste dag</p>
        </div>
      </div>

      {/* Hour of day heatmap-style */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Inschrijvingen per uur</p>
        <div className="grid grid-cols-12 gap-1">
          {data.byHourOfDay.map(({ hour, count }) => {
            const h = getHourColor(hour, maxHour, count);
            const heightPct = maxHour > 0 ? Math.max(10, (count / maxHour) * 100) : 10;
            return (
              <div key={hour} className="flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${heightPct * 0.5}px`,
                    minHeight: 4,
                    maxHeight: 50,
                    background: h,
                  }}
                />
                <span className="text-[9px] text-slate-400">{hour}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[#041c3a] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                  {hour}u: {count} inschrijvingen
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {[
            { color: 'bg-slate-300', label: '🌙 Nacht (0–7u)' },
            { color: 'bg-sky-400', label: '☀️ Ochtend (7–12u)' },
            { color: 'bg-orange-400', label: '🌤️ Middag (12–18u)' },
            { color: 'bg-purple-400', label: '🌇 Avond (18–24u)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day of week */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Inschrijvingen per weekdag</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data.byDayOfWeek} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.byDayOfWeek.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.count === maxDay ? '#ed6425' : '#041c3a'}
                  opacity={entry.count === maxDay ? 1 : 0.4 + (entry.count / maxDay) * 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}