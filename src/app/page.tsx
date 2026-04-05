'use client';
import { useState } from 'react';
import { useStore, Activity } from '@/lib/store';
import ActivityCard from '@/components/ActivityCard';
import AddActivityModal from '@/components/AddActivityModal';
import Analytics from '@/components/Analytics';

export default function Home() {
  const { activities, addActivity, editActivity } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const handleSave = (name: string, color: string) => {
    if (editingActivity) {
      editActivity(editingActivity.id, { name, color });
    } else {
      addActivity({ name, color });
    }
    setEditingActivity(null);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingActivity(null);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">MyTimeTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Track your time, boost your productivity</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Activity
        </button>
      </header>

      {activities.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No activities yet</p>
          <p className="text-sm mt-1">Add an activity to start tracking your time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {activities.map(a => (
            <ActivityCard key={a.id} activity={a} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <Analytics />

      {showModal && (
        <AddActivityModal
          onClose={handleCloseModal}
          onSave={handleSave}
          activity={editingActivity}
        />
      )}
    </main>
  );
}
