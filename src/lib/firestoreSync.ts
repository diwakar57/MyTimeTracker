import {
  doc,
  setDoc,
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
  await setDoc(userDocRef(uid), {
    ...data,
    writeId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToFirestore(
  uid: string,
  onData: (snapshot: StoreSnapshot, writeId: string) => void,
  onMissing: () => void
): Unsubscribe {
  return onSnapshot(userDocRef(uid), (snap) => {
    if (!snap.exists()) {
      onMissing();
      return;
    }
    const data = snap.data() as StoreSnapshot & { writeId?: string };
    onData(
      {
        activities: data.activities ?? [],
        sessions: data.sessions ?? [],
        timers: data.timers ?? {},
        allowOverlap: data.allowOverlap ?? false,
      },
      data.writeId ?? ''
    );
  });
}
