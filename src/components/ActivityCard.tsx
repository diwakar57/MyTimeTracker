'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore, getActivityTotalSec, Activity } from '@/lib/store';
import { getTotalSecForPeriod } from '@/lib/analytics';

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

interface Props {
  activity: Activity;
  onEdit: (activity: Activity) => void;
}

export default function ActivityCard({ activity, onEdit }: Props) {
  const { sessions, timer, startTimer, pauseTimer, deleteActivity } = useStore();
  const isRunning = timer.runningActivityId === activity.id;
  const [liveElapsed, setLiveElapsed] = useState(0);
  const lastClickRef = useRef(0);

  useEffect(() => {
    if (!isRunning || !timer.runningStartTime) {
      setLiveElapsed(0);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(timer.runningStartTime!).getTime()) / 1000);
      setLiveElapsed(elapsed);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isRunning, timer.runningStartTime]);

  const baseSec = getActivityTotalSec(sessions, activity.id);
  const totalSec = baseSec + (isRunning ? liveElapsed : 0);
  const todaySec = getTotalSecForPeriod(sessions, activity.id, 'today') + (isRunning ? liveElapsed : 0);

  const handleToggle = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer(activity.id);
    }
  }, [isRunning, pauseTimer, startTimer, activity.id]);

  return (
    <div
      className={`bg-gray-900 border rounded-2xl p-5 flex flex-col gap-4 transition-all ${isRunning ? 'border-opacity-80 shadow-lg' : 'border-gray-700 hover:border-gray-600'}`}
      style={isRunning ? { borderColor: activity.color, boxShadow: `0 0 20px ${activity.color}33` } : {}}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: activity.color }} />
          <h3 className="font-semibold text-white text-lg truncate">{activity.name}</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(activity)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => deleteActivity(activity.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors" title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      <div>
        <div className="text-3xl font-mono font-bold text-white">{formatTime(totalSec)}</div>
        <div className="text-sm text-gray-500 mt-1">Today: {formatTime(todaySec)}</div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 text-sm" style={{ color: activity.color }}>
          <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ backgroundColor: activity.color }} />
          Running
        </div>
      )}

      <button
        onClick={handleToggle}
        className="w-full py-2.5 rounded-xl font-medium text-white transition-all active:scale-95"
        style={isRunning ? { backgroundColor: '#374151' } : { backgroundColor: activity.color }}
      >
        {isRunning ? '⏸ Pause' : '▶ Start'}
      </button>
    </div>
  );
}
