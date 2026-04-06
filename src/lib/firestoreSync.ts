import {
  doc,
  getDocs,
  collection,
  query,
  where,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { Activity, Session, TimerState } from '@/types';

export interface StoreSnapshot {
  activities: Activity[];
  sessions: Session[];
  timers: Record<string, TimerState>;
  allowOverlap: boolean;
}

export async function saveToFirestore(uid: string, data: StoreSnapshot): Promise<void> {
  try {
    if (!uid) {
      throw new Error('Missing authenticated user id for Firestore save.');
    }

    const db = getFirebaseDb();
    const activitiesCollection = collection(db, 'activities');
    const normalizedActivities = data.activities.map((activity) => ({
      ...activity,
      userId: uid,
    }));
    const existing = await getDocs(query(activitiesCollection, where('userId', '==', uid)));
    const incomingById = new Map(normalizedActivities.map((activity) => [activity.id, activity]));
    const batch = writeBatch(db);

    existing.docs.forEach((snapshot) => {
      const firestoreActivity = snapshot.data() as Activity;
      if (!incomingById.has(firestoreActivity.id)) {
        batch.delete(snapshot.ref);
      }
    });

    normalizedActivities.forEach((activity) => {
      batch.set(doc(activitiesCollection, activity.id), {
        ...activity,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Firestore Save Error:', error);
    throw error;
  }
}

export function subscribeToFirestore(
  uid: string,
  onData: (snapshot: StoreSnapshot) => void,
  onMissing: () => void
): Unsubscribe {
  const db = getFirebaseDb();
  let hasReceivedSnapshot = false;

  return onSnapshot(query(collection(db, 'activities'), where('userId', '==', uid)), (activitySnapshot) => {
    const activities = activitySnapshot.docs.map((docSnapshot) => docSnapshot.data() as Activity);

    if (!hasReceivedSnapshot && activities.length === 0) {
      hasReceivedSnapshot = true;
      onMissing();
      return;
    }

    hasReceivedSnapshot = true;
    onData(
      {
        activities,
        sessions: [],
        timers: {},
        allowOverlap: false,
      }
    );
  });
}
