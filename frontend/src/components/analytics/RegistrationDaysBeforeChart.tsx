import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { DaysBeforeBucket } from '../../lib/analyticsUtils';

interface Props {
  data: DaysBeforeBucket[];
}

export function RegistrationDaysBeforeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-400">
        Geen registratiedata beschikbaar.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 24 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="daysBefore"
          tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          label={{
            value: 'Dagen vóór evenement',
            position: 'insideBottom',
            offset: -12,
            fontSize: 12,
            fill: '#64748b',
            fontWeight: 500,
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          formatter={(value: number) => [`${value} inschrijvingen`, '']}
          labelFormatter={(label) => `${label} dag(en) vóór evenement`}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#ed6425' : '#041c3a'} fillOpacity={i === 0 ? 1 : 0.85} />
          ))}
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}