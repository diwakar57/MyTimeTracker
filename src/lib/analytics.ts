import { startOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns';
import { Activity, Session } from './store';

type Period = 'today' | 'week' | 'month';

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'today': return startOfDay(now);
    case 'week': return startOfWeek(now, { weekStartsOn: 1 });
    case 'month': return startOfMonth(now);
  }
}

export function getTotalSecForPeriod(
  sessions: Session[],
  activityId: string,
  period: Period
): number {
  const start = getPeriodStart(period);
  return sessions
    .filter(s => s.activityId === activityId && new Date(s.startTime) >= start)
    .reduce((sum, s) => sum + s.durationSec, 0);
}

export function getDailyTotals(
  sessions: Session[],
  days: number
): { date: string; totalSec: number }[] {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const nextDay = new Date(day.getTime() + 86400000);
    const totalSec = sessions
      .filter(s => {
        const t = new Date(s.startTime);
        return t >= day && t < nextDay;
      })
      .reduce((sum, s) => sum + s.durationSec, 0);
    result.push({ date: format(day, 'MMM d'), totalSec });
  }
  return result;
}

export function getStreak(sessions: Session[], activityId?: string): number {
  const filtered = activityId
    ? sessions.filter(s => s.activityId === activityId)
    : sessions;

  let streak = 0;
  let day = startOfDay(new Date());

  while (true) {
    const nextDay = new Date(day.getTime() + 86400000);
    const hasActivity = filtered.some(s => {
      const t = new Date(s.startTime);
      return t >= day && t < nextDay;
    });
    if (!hasActivity) break;
    streak++;
    day = new Date(day.getTime() - 86400000);
  }

  return streak;
}

export function getTopActivity(
  activities: Activity[],
  sessions: Session[],
  period: Period
): Activity | null {
  if (activities.length === 0) return null;
  const start = getPeriodStart(period);
  let best: Activity | null = null;
  let bestSec = 0;
  for (const a of activities) {
    const sec = sessions
      .filter(s => s.activityId === a.id && new Date(s.startTime) >= start)
      .reduce((sum, s) => sum + s.durationSec, 0);
    if (sec > bestSec) { bestSec = sec; best = a; }
  }
  return best;
}

export function getActivityBreakdown(
  activities: Activity[],
  sessions: Session[],
  period: Period
): { activity: Activity; totalSec: number; percentage: number }[] {
  const start = getPeriodStart(period);
  const data = activities.map(a => ({
    activity: a,
    totalSec: sessions
      .filter(s => s.activityId === a.id && new Date(s.startTime) >= start)
      .reduce((sum, s) => sum + s.durationSec, 0),
    percentage: 0,
  }));
  const total = data.reduce((sum, d) => sum + d.totalSec, 0);
  if (total > 0) {
    data.forEach(d => { d.percentage = Math.round((d.totalSec / total) * 100); });
  }
  return data.filter(d => d.totalSec > 0);
}
