import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Activity, Session, TimerState } from '@/types';

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: uuidv4(), name: 'Study', color: '#6366f1', createdAt: new Date().toISOString(), userId: 'local-default' },
  { id: uuidv4(), name: 'Grading', color: '#f59e0b', createdAt: new Date().toISOString(), userId: 'local-default' },
  { id: uuidv4(), name: 'Exercise', color: '#10b981', createdAt: new Date().toISOString(), userId: 'local-default' },
  { id: uuidv4(), name: 'Research', color: '#3b82f6', createdAt: new Date().toISOString(), userId: 'local-default' },
  { id: uuidv4(), name: 'Paper Reading', color: '#ec4899', createdAt: new Date().toISOString(), userId: 'local-default' },
];

interface StoreState {
  activities: Activity[];
  sessions: Session[];
  timers: Record<string, TimerState>;
  allowOverlap: boolean;
  addActivity: (name: string, color: string, userId: string) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  startTimer: (activityId: string) => void;
  pauseTimer: (activityId: string) => void;
  resumeTimer: (activityId: string) => void;
  resetTimer: (activityId: string) => void;
  setAllowOverlap: (val: boolean) => void;
  setStoreData: (data: { activities: Activity[]; sessions: Session[]; timers: Record<string, TimerState>; allowOverlap: boolean }) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activities: DEFAULT_ACTIVITIES,
      sessions: [],
      timers: {},
      allowOverlap: false,

      addActivity: (name, color, userId) => {
        const activity: Activity = {
          id: uuidv4(),
          name,
          color,
          createdAt: new Date().toISOString(),
          userId,
        };
        set((state) => ({ activities: [...state.activities, activity] }));
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteActivity: (id) => {
        set((state) => {
          const timers = { ...state.timers };
          delete timers[id];
          return {
            activities: state.activities.filter((a) => a.id !== id),
            sessions: state.sessions.filter((s) => s.activityId !== id),
            timers,
          };
        });
      },

      startTimer: (activityId) => {
        const state = get();
        const now = new Date().toISOString();
        const newTimers: Record<string, TimerState> = { ...state.timers };

        if (!state.allowOverlap) {
          Object.keys(newTimers).forEach((id) => {
            if (id !== activityId && newTimers[id].status === 'running') {
              const t = newTimers[id];
              const startTime = t.startTime ? new Date(t.startTime) : new Date();
              const segmentSec = (Date.now() - startTime.getTime()) / 1000;
              const totalAccumulated = t.accumulatedSec + segmentSec;
              const session: Session = {
                id: uuidv4(),
                activityId: id,
                startTime: t.startTime!,
                endTime: now,
                durationSec: segmentSec,
              };
              set((s) => ({ sessions: [...s.sessions, session] }));
              newTimers[id] = { ...t, status: 'paused', startTime: null, accumulatedSec: totalAccumulated };
            }
          });
        }

        const existing = newTimers[activityId];
        newTimers[activityId] = {
          activityId,
          status: 'running',
          startTime: now,
          accumulatedSec: existing?.accumulatedSec ?? 0,
        };

        set({ timers: newTimers });
      },

      pauseTimer: (activityId) => {
        const state = get();
        const timer = state.timers[activityId];
        if (!timer || timer.status !== 'running') return;

        const now = new Date().toISOString();
        const startTime = timer.startTime ? new Date(timer.startTime) : new Date();
        const segmentSec = (Date.now() - startTime.getTime()) / 1000;
        const totalSec = timer.accumulatedSec + segmentSec;

        const session: Session = {
          id: uuidv4(),
          activityId,
          startTime: timer.startTime!,
          endTime: now,
          durationSec: segmentSec,
        };

        set((s) => ({
          sessions: [...s.sessions, session],
          timers: {
            ...s.timers,
            [activityId]: {
              ...timer,
              status: 'paused',
              startTime: null,
              accumulatedSec: totalSec,
            },
          },
        }));
      },

      resumeTimer: (activityId) => {
        const state = get();
        const timer = state.timers[activityId];
        if (!timer || timer.status !== 'paused') return;

        const now = new Date().toISOString();

        if (!state.allowOverlap) {
          const newTimers = { ...state.timers };
          Object.keys(newTimers).forEach((id) => {
            if (id !== activityId && newTimers[id].status === 'running') {
              const t = newTimers[id];
              const startTime = t.startTime ? new Date(t.startTime) : new Date();
              const segmentSec = (Date.now() - startTime.getTime()) / 1000;
              const totalAccumulated = t.accumulatedSec + segmentSec;
              const session: Session = {
                id: uuidv4(),
                activityId: id,
                startTime: t.startTime!,
                endTime: now,
                durationSec: segmentSec,
              };
              set((s) => ({ sessions: [...s.sessions, session] }));
              newTimers[id] = { ...t, status: 'paused', startTime: null, accumulatedSec: totalAccumulated };
            }
          });
          set({ timers: newTimers });
        }

        set((s) => ({
          timers: {
            ...s.timers,
            [activityId]: {
              ...timer,
              status: 'running',
              startTime: now,
            },
          },
        }));
      },

      setAllowOverlap: (val) => set({ allowOverlap: val }),

      resetTimer: (activityId) => {
        set((state) => {
          const timers = { ...state.timers };
          delete timers[activityId];
          return { timers };
        });
      },

      setStoreData: (data) => {
        set({
          activities: data.activities,
          sessions: data.sessions,
          timers: data.timers,
          allowOverlap: data.allowOverlap,
        });
      },
    }),
    {
      name: 'mytimetracker-store',
    }
  )
);
