'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/useStore';
import { saveToFirestore, subscribeToFirestore, StoreSnapshot } from '@/lib/firestoreSync';

const DEBOUNCE_MS = 1500;

export default function FirebaseSync() {
  const { user } = useAuth();
  const store = useStore();
  const lastWriteId = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  // Subscribe to real-time Firestore updates when user is logged in
  useEffect(() => {
    if (!user) {
      isInitialized.current = false;
      return;
    }

    const unsubscribe = subscribeToFirestore(
      user.uid,
      (snapshot, writeId) => {
        // Skip updates triggered by our own writes
        if (writeId && writeId === lastWriteId.current) return;

        // Apply remote data to local store
        store.setStoreData(snapshot);
        isInitialized.current = true;
      },
      () => {
        // Document doesn't exist yet (new user) — push current local data to Firestore
        const snapshot: StoreSnapshot = {
          activities: store.activities,
          sessions: store.sessions,
          timers: store.timers,
          allowOverlap: store.allowOverlap,
        };
        const writeId = uuidv4();
        lastWriteId.current = writeId;
        saveToFirestore(user.uid, snapshot, writeId)
          .then(() => { isInitialized.current = true; })
          .catch(console.error);
      }
    );

    return () => {
      unsubscribe();
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounced write to Firestore whenever local state changes
  useEffect(() => {
    if (!user || !isInitialized.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const snapshot: StoreSnapshot = {
        activities: store.activities,
        sessions: store.sessions,
        timers: store.timers,
        allowOverlap: store.allowOverlap,
      };
      const writeId = uuidv4();
      lastWriteId.current = writeId;
      saveToFirestore(user.uid, snapshot, writeId).catch(console.error);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store.activities, store.sessions, store.timers, store.allowOverlap]);

  return null;
}
