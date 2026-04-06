'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import ActivityCard from '@/components/ActivityCard';
import ActivityModal from '@/components/ActivityModal';
import { Activity } from '@/types';
import { useAuth } from '@/components/AuthProvider';

export default function Dashboard() {
  const { activities, addActivity, updateActivity } = useStore();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  const handleSave = (name: string, color: string) => {
    if (!user) return;

    if (editingActivity) {
      updateActivity(editingActivity.id, { name, color });
    } else {
      addActivity(name, color, user.uid);
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingActivity(undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Activity
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No activities yet.</p>
          <p>Click &quot;Add Activity&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={() => handleEdit(activity)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ActivityModal
          activity={editingActivity}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
