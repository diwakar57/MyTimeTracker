'use client';

import { useStore } from '@/store/useStore';
import { formatDuration, getDayBoundary, getWeekBoundary, getMonthBoundary } from '@/lib/timeUtils';
import {
  getAllActivitiesTotalSec,
  getActivityTotalSec,
  getStreak,
  getTopActivity,
} from '@/lib/analytics';

export default function Analytics() {
  const { sessions, activities } = useStore();
  const now = new Date();
  const { start: dayStart, end: dayEnd } = getDayBoundary(now);
  const { start: weekStart, end: weekEnd } = getWeekBoundary(now);
  const { start: monthStart, end: monthEnd } = getMonthBoundary(now);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const todayTotal = getAllActivitiesTotalSec(sessions, dayStart, dayEnd);
  const weekTotal = getAllActivitiesTotalSec(sessions, weekStart, weekEnd);
  const monthTotal = getAllActivitiesTotalSec(sessions, monthStart, monthEnd);
  const lastWeekTotal = getAllActivitiesTotalSec(sessions, lastWeekStart, lastWeekEnd);

  const streak = getStreak(sessions);
  const topActivity = getTopActivity(sessions, activities, weekStart, weekEnd);
  const weekVsLast = weekTotal - lastWeekTotal;

  const recentSessions = [...sessions]
    .filter((s) => s.endTime !== null)
    .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())
    .slice(0, 10);

  const getActivityName = (id: string) =>
    activities.find((a) => a.id === id)?.name ?? 'Unknown';
  const getActivityColor = (id: string) =>
    activities.find((a) => a.id === id)?.color ?? '#888';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Today', value: formatDuration(Math.floor(todayTotal)) },
          { label: 'This Week', value: formatDuration(Math.floor(weekTotal)) },
          { label: 'This Month', value: formatDuration(Math.floor(monthTotal)) },
        ].map((item) => (
          <div key={item.label} className="bg-gray-800 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm">{item.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Streak / Top / Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">🔥 Streak</p>
          <p className="text-2xl font-bold text-white mt-1">{streak} day{streak !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">🏆 Top Activity (Week)</p>
          {topActivity ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topActivity.color }} />
              <p className="text-xl font-bold text-white">{topActivity.name}</p>
            </div>
          ) : (
            <p className="text-white mt-1">—</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">📈 Week vs Last Week</p>
          <p className={`text-2xl font-bold mt-1 ${weekVsLast >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weekVsLast >= 0 ? '↑' : '↓'} {formatDuration(Math.abs(Math.floor(weekVsLast)))}
          </p>
        </div>
      </div>

      {/* Per-activity breakdown */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-5 pb-3">Activity Breakdown</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left border-b border-gray-700">
              <th className="px-5 py-2">Activity</th>
              <th className="px-5 py-2">Today</th>
              <th className="px-5 py-2">This Week</th>
              <th className="px-5 py-2">This Month</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-white">{a.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-300">
                  {formatDuration(Math.floor(getActivityTotalSec(sessions, a.id, dayStart, dayEnd)))}
                </td>
                <td className="px-5 py-3 text-gray-300">
                  {formatDuration(Math.floor(getActivityTotalSec(sessions, a.id, weekStart, weekEnd)))}
                </td>
                <td className="px-5 py-3 text-gray-300">
                  {formatDuration(Math.floor(getActivityTotalSec(sessions, a.id, monthStart, monthEnd)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Sessions */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <h2 className="text-lg font-semibold text-white p-5 pb-3">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500 px-5 pb-5">No sessions yet.</p>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {recentSessions.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getActivityColor(s.activityId) }} />
                  <span className="text-white text-sm">{getActivityName(s.activityId)}</span>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 text-sm">{formatDuration(Math.floor(s.durationSec ?? 0))}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(s.endTime!).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
