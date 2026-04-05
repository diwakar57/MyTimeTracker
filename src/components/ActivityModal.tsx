'use client';

import { useState, useEffect } from 'react';
import { Activity } from '@/types';

const PRESET_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16',
];

interface Props {
  activity?: Activity;
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}

export default function ActivityModal({ activity, onSave, onClose }: Props) {
  const [name, setName] = useState(activity?.name ?? '');
  const [color, setColor] = useState(activity?.color ?? PRESET_COLORS[0]);

  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setColor(activity.color);
    }
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-4">
          {activity ? 'Edit Activity' : 'New Activity'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Activity name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {activity ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
