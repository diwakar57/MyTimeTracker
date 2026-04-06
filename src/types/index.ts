export interface Activity {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  activityId: string;
  startTime: string;
  endTime: string | null;
  durationSec: number | null;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  activityId: string;
  status: TimerStatus;
  startTime: string | null;
  accumulatedSec: number;
}
