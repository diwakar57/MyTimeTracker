'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Activity, Session } from './types';

export type { Activity, Session };

interface TimerState {
  runningActivityId: string | null;
  runningStartTime: string | null;
}

interface StoreState {
  activities: Activity[];
  sessions: Session[];
  timer: TimerState;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
  editActivity: (id: string, updates: Partial<Pick<Activity, 'name' | 'color'>>) => void;
  deleteActivity: (id: string) => void;
  startTimer: (activityId: string) => void;
  pauseTimer: () => void;
}

const DEFAULT_ACTIVITIES = [
  { name: 'Study', color: '#ef4444' },
  { name: 'Exercise', color: '#f97316' },
  { name: 'Research', color: '#eab308' },
  { name: 'Paper Reading', color: '#22c55e' },
  { name: 'Grading', color: '#06b6d4' },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activities: DEFAULT_ACTIVITIES.map((a, i) => ({
        id: `default-${i}`,
        name: a.name,
        color: a.color,
        createdAt: new Date().toISOString(),
      })),
      sessions: [],
      timer: { runningActivityId: null, runningStartTime: null },

      addActivity: (activity) => set((state) => ({
        activities: [...state.activities, {
          ...activity,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }],
      })),

      editActivity: (id, updates) => set((state) => ({
        activities: state.activities.map(a => a.id === id ? { ...a, ...updates } : a),
      })),

      deleteActivity: (id) => set((state) => ({
        activities: state.activities.filter(a => a.id !== id),
        sessions: state.sessions.filter(s => s.activityId !== id),
        timer: state.timer.runningActivityId === id
          ? { runningActivityId: null, runningStartTime: null }
          : state.timer,
      })),

      startTimer: (activityId) => {
        const state = get();
        const now = new Date().toISOString();

        if (state.timer.runningActivityId && state.timer.runningStartTime) {
          const endTime = now;
          const startTime = state.timer.runningStartTime;
          const durationSec = Math.round(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
          );
          if (durationSec > 0) {
            set((s) => ({
              sessions: [...s.sessions, {
                id: crypto.randomUUID(),
                activityId: s.timer.runningActivityId!,
                startTime,
                endTime,
                durationSec,
              }],
            }));
          }
        }

        set({ timer: { runningActivityId: activityId, runningStartTime: now } });
      },

      pauseTimer: () => {
        const state = get();
        if (!state.timer.runningActivityId || !state.timer.runningStartTime) return;

        const endTime = new Date().toISOString();
        const startTime = state.timer.runningStartTime;
        const durationSec = Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000
        );

        if (durationSec > 0) {
          set((s) => ({
            sessions: [...s.sessions, {
              id: crypto.randomUUID(),
              activityId: s.timer.runningActivityId!,
              startTime,
              endTime,
              durationSec,
            }],
            timer: { runningActivityId: null, runningStartTime: null },
          }));
        } else {
          set({ timer: { runningActivityId: null, runningStartTime: null } });
        }
      },
    }),
    { name: 'mytimetracker-storage' }
  )
);

export function getActivityTotalSec(sessions: Session[], activityId: string): number {
  return sessions
    .filter(s => s.activityId === activityId)
    .reduce((sum, s) => sum + s.durationSec, 0);
}
