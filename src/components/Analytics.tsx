'use client';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useStore } from '@/store/useStore';
import {
  getActivityTotalSec, getDailyTotals, getStreak,
  getTopActivity, getActivityBreakdown,
} from '@/lib/analytics';
import { getDayBoundary, getWeekBoundary, getMonthBoundary } from '@/lib/timeUtils';

type Period = 'today' | 'week' | 'month';

function fmtMin(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getPeriodBounds(period: Period): { from: Date; to: Date } {
  const now = new Date();
  if (period === 'today') {
    const { start, end } = getDayBoundary(now);
    return { from: start, to: end };
  } else if (period === 'week') {
    const { start, end } = getWeekBoundary(now);
    return { from: start, to: end };
  } else {
    const { start, end } = getMonthBoundary(now);
    return { from: start, to: end };
  }
}

export default function Analytics() {
  const { activities, sessions } = useStore();
  const [period, setPeriod] = useState<Period>('today');

  const { from, to } = getPeriodBounds(period);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const totalSec = activities.reduce(
    (sum, a) => sum + getActivityTotalSec(sessions, a.id, from, to), 0
  );
  const topActivity = getTopActivity(sessions, activities, from, to);
  const streak = getStreak(sessions);
  const dailyTotals = getDailyTotals(sessions, sevenDaysAgo, new Date());
  const breakdown = getActivityBreakdown(sessions, activities, from, to);

  const barData = activities
    .map(a => ({
      name: a.name,
      minutes: Math.round(getActivityTotalSec(sessions, a.id, from, to) / 60),
      color: a.color,
    }))
    .filter(d => d.minutes > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          {(['today', 'week', 'month'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Time</div>
          <div className="text-2xl font-bold text-white">{fmtMin(totalSec)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-1">Top Activity</div>
          <div className="text-2xl font-bold text-white truncate">{topActivity?.name ?? '—'}</div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-1">Current Streak</div>
          <div className="text-2xl font-bold text-white">{streak} {streak === 1 ? 'day' : 'days'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">
            Activity Totals ({period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'})
          </h3>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [`${v} min`, 'Time']}
                />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Daily Minutes (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                formatter={(v) => [`${v} min`, 'Total']}
              />
              <Line type="monotone" dataKey="totalMin" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {breakdown.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Activity Breakdown</h3>
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="totalSec"
                    nameKey="activity.name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {breakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.activity.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v) => [fmtMin(Number(v)), 'Time']}
                  />
                  <Legend formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
