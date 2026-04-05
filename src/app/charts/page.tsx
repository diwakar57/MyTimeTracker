'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { getWeekBoundary, getDayBoundary } from '@/lib/timeUtils';
import { getActivityTotalSec, getDailyTotals, getActivityBreakdown } from '@/lib/analytics';

export default function Charts() {
  const { sessions, activities } = useStore();
  const now = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBoundary(now);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  const { start: thirtyStart } = getDayBoundary(thirtyDaysAgo);

  const barData = activities.map((a) => ({
    name: a.name,
    minutes: Math.round(getActivityTotalSec(sessions, a.id, weekStart, weekEnd) / 60),
    color: a.color,
  })).filter((d) => d.minutes > 0);

  const lineData = getDailyTotals(sessions, thirtyStart, now);

  const donutData = getActivityBreakdown(sessions, activities, weekStart, weekEnd)
    .filter((d) => d.totalSec > 0)
    .map((d) => ({ ...d, name: d.activity.name }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Charts</h1>

      {/* Bar chart */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Activity Totals This Week</h2>
        {barData.length === 0 ? (
          <p className="text-gray-500">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} label={{ value: 'min', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value) => [`${value ?? 0} min`, 'Time']}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line chart */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Totals (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} label={{ value: 'min', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value) => [`${value ?? 0} min`, 'Total']}
            />
            <Line type="monotone" dataKey="totalMin" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Donut chart */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Activity Split This Week</h2>
        {donutData.length === 0 ? (
          <p className="text-gray-500">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="totalSec"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
              >
                {donutData.map((entry, index) => (
                  <Cell key={index} fill={entry.activity.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                formatter={(value, name) => [`${Math.round(Number(value ?? 0) / 60)} min`, name ?? '']}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
