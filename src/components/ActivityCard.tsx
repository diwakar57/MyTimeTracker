'use client';

import { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { useStore } from '@/store/useStore';
import { formatDuration, getElapsedSec, getDayBoundary } from '@/lib/timeUtils';
import { getActivityTotalSec } from '@/lib/analytics';

interface Props {
  activity: Activity;
  onEdit: () => void;
}

export default function ActivityCard({ activity, onEdit }: Props) {
  const { timers, sessions, startTimer, pauseTimer, resumeTimer, resetTimer, deleteActivity } = useStore();
  const timer = timers[activity.id];
  const status = timer?.status ?? 'idle';
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(timer ? getElapsedSec(timer) : 0);
    if (status !== 'running') return;
    const interval = setInterval(() => {
      setElapsed(timer ? getElapsedSec(timer) : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, status]);

  const { start, end } = getDayBoundary(new Date());
  const todayTotal = getActivityTotalSec(sessions, activity.id, start, end);
  const todayDisplay = status === 'running'
    ? todayTotal + elapsed
    : todayTotal;

  const handlePrimary = () => {
    if (status === 'idle') startTimer(activity.id);
    else if (status === 'running') pauseTimer(activity.id);
    else if (status === 'paused') resumeTimer(activity.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${activity.name}"?`)) deleteActivity(activity.id);
  };

  const handleReset = () => {
    if (confirm(`Reset timer for "${activity.name}"?`)) resetTimer(activity.id);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-5 shadow-lg border-l-4 flex flex-col gap-3"
      style={{ borderLeftColor: activity.color }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.color }} />
          <h3 className="text-white font-semibold text-lg">{activity.name}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-blue-400 px-2 py-1 rounded text-xs transition-colors"
            title="Reset timer"
          >
            🔄
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-400 px-2 py-1 rounded text-xs transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-3xl font-mono font-bold text-white">
          {formatDuration(Math.floor(elapsed))}
        </div>
        <div className={`text-xs mt-1 font-medium ${
          status === 'running' ? 'text-green-400' :
          status === 'paused' ? 'text-yellow-400' : 'text-gray-500'
        }`}>
          {status === 'running' ? '● RUNNING' : status === 'paused' ? '⏸ PAUSED' : '○ IDLE'}
        </div>
      </div>

      <button
        onClick={handlePrimary}
        className={`w-full py-2.5 rounded-lg font-semibold text-white transition-all ${
          status === 'running'
            ? 'bg-yellow-600 hover:bg-yellow-700'
            : status === 'paused'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {status === 'running' ? '⏸ Pause' : status === 'paused' ? '▶ Resume' : '▶ Start'}
      </button>

      <div className="text-xs text-gray-400 text-center">
        Today: <span className="text-gray-200 font-medium">{formatDuration(Math.floor(todayDisplay))}</span>
      </div>
    </div>
  );
}
