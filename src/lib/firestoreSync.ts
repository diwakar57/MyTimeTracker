import {
  doc,
  setDoc,
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
  writeId?: string;
}

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid, 'data', 'state');
}

export async function saveToFirestore(uid: string, data: StoreSnapshot, writeId: string): Promise<void> {
  const db = getFirebaseDb();
  const activitiesCollection = collection(db, 'activities');
  const existing = await getDocs(query(activitiesCollection, where('userId', '==', uid)));
  const incomingById = new Map(data.activities.map((activity) => [activity.id, activity]));
  const batch = writeBatch(db);

  existing.docs.forEach((snapshot) => {
    const firestoreActivity = snapshot.data() as Activity;
    if (!incomingById.has(firestoreActivity.id)) {
      batch.delete(snapshot.ref);
    }
  });

  data.activities.forEach((activity) => {
    batch.set(doc(activitiesCollection, activity.id), {
      ...activity,
      userId: uid,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();

  await setDoc(userDocRef(uid), {
    ...data,
    activities: data.activities.map((activity) => ({ ...activity, userId: uid })),
    writeId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToFirestore(
  uid: string,
  onData: (snapshot: StoreSnapshot, writeId: string) => void,
  onMissing: () => void
): Unsubscribe {
  const db = getFirebaseDb();
  const activitiesCollection = collection(db, 'activities');
  let cachedActivities: Activity[] = [];
  let cachedState: (Omit<StoreSnapshot, 'activities'> & { writeId?: string }) | null = null;

  const emitSnapshot = () => {
    if (!cachedState) return;
    onData(
      {
        activities: cachedActivities,
        sessions: cachedState.sessions ?? [],
        timers: cachedState.timers ?? {},
        allowOverlap: cachedState.allowOverlap ?? false,
      },
      cachedState.writeId ?? ''
    );
  };

  const unsubscribeUserState = onSnapshot(userDocRef(uid), (snap) => {
    if (!snap.exists()) {
      cachedState = null;
      onMissing();
      return;
    }

    const data = snap.data() as StoreSnapshot & { writeId?: string };
    cachedState = {
      sessions: data.sessions ?? [],
      timers: data.timers ?? {},
      allowOverlap: data.allowOverlap ?? false,
      writeId: data.writeId ?? '',
    };
    if (cachedActivities.length === 0 && Array.isArray(data.activities)) {
      cachedActivities = data.activities.filter((activity) => activity.userId === uid);
    }
    emitSnapshot();
  });

  const unsubscribeActivities = onSnapshot(
    query(activitiesCollection, where('userId', '==', uid)),
    (activitySnapshot) => {
      const activities = activitySnapshot.docs.map((docSnapshot) => docSnapshot.data() as Activity);
      cachedActivities = activities;
      emitSnapshot();
    }
  );

  return () => {
    unsubscribeUserState();
    unsubscribeActivities();
  };
}
