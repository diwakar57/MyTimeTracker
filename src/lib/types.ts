export interface Activity {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Session {
  id: string;
  activityId: string;
  startTime: string;
  endTime: string;
  durationSec: number;
}
