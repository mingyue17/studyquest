'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '@/store/useStore';
import { toDateKey } from '@/lib/streaks';

/** Minutes studied per day over the last two weeks. */
export function StudyTimeChart() {
  const sessions = useStore((s) => s.sessions);

  const data = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = toDateKey(d);
    const minutes = sessions
      .filter((s) => s.completedAt && toDateKey(s.completedAt) === key)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { day: d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }), minutes };
  });

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#1b2560" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#1b2560' }} interval={2} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(34,224,255,0.08)' }}
            contentStyle={{ background: '#0b1130', border: '3px solid #28337a', borderRadius: 0, fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(v: number) => [`${v} min`, 'Studied']}
          />
          <Bar dataKey="minutes" fill="#39ff6a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
