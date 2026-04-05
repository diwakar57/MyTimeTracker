import { Session, Activity } from '@/types';
import { getDayBoundary } from './timeUtils';

export function getActivityTotalSec(
  sessions: Session[],
  activityId: string,
  from: Date,
  to: Date
): number {
  return sessions
    .filter((s) => {
      if (s.activityId !== activityId) return false;
      const end = s.endTime ? new Date(s.endTime) : new Date();
      return end >= from && end <= to;
    })
    .reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
}

export function getAllActivitiesTotalSec(sessions: Session[], from: Date, to: Date): number {
  return sessions
    .filter((s) => {
      const end = s.endTime ? new Date(s.endTime) : new Date();
      return end >= from && end <= to;
    })
    .reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
}

export function getStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const completedSessions = sessions.filter((s) => s.endTime !== null);
  if (completedSessions.length === 0) return 0;

  const daySet = new Set<string>();
  completedSessions.forEach((s) => {
    const d = new Date(s.endTime!);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(today);
  checkDate.setDate(today.getDate() - 1);

  while (true) {
    const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (daySet.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getTopActivity(
  sessions: Session[],
  activities: Activity[],
  from: Date,
  to: Date
): Activity | null {
  if (activities.length === 0) return null;
  let topId: string | null = null;
  let topSec = 0;
  activities.forEach((a) => {
    const sec = getActivityTotalSec(sessions, a.id, from, to);
    if (sec > topSec) {
      topSec = sec;
      topId = a.id;
    }
  });
  return topId ? activities.find((a) => a.id === topId) ?? null : null;
}

export function getDailyTotals(
  sessions: Session[],
  from: Date,
  to: Date
): { date: string; totalMin: number }[] {
  const results: { date: string; totalMin: number }[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= to) {
    const { start, end } = getDayBoundary(cursor);
    const totalSec = getAllActivitiesTotalSec(sessions, start, end);
    results.push({
      date: cursor.toISOString().split('T')[0],
      totalMin: Math.round(totalSec / 60),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

export function getActivityBreakdown(
  sessions: Session[],
  activities: Activity[],
  from: Date,
  to: Date
): { activity: Activity; totalSec: number; percentage: number }[] {
  const totals = activities.map((a) => ({
    activity: a,
    totalSec: getActivityTotalSec(sessions, a.id, from, to),
  }));
  const grandTotal = totals.reduce((sum, t) => sum + t.totalSec, 0);
  return totals.map((t) => ({
    ...t,
    percentage: grandTotal > 0 ? Math.round((t.totalSec / grandTotal) * 100) : 0,
  }));
}
