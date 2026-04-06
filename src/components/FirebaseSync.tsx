'use client';

import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/useStore';
import { saveToFirestore, subscribeToFirestore, StoreSnapshot } from '@/lib/firestoreSync';

const DEBOUNCE_MS = 1500;

export default function FirebaseSync() {
  const { user } = useAuth();
  const activities = useStore((s) => s.activities);
  const sessions = useStore((s) => s.sessions);
  const timers = useStore((s) => s.timers);
  const allowOverlap = useStore((s) => s.allowOverlap);
  const setStoreData = useStore((s) => s.setStoreData);

  const lastWriteId = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  // Build a snapshot from current store slices (stable reference via useCallback)
  const buildSnapshot = useCallback((): StoreSnapshot => ({
    activities,
    sessions,
    timers,
    allowOverlap,
  }), [activities, sessions, timers, allowOverlap]);

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
        setStoreData(snapshot);
        isInitialized.current = true;
      },
      () => {
        // Document doesn't exist yet (new user) — push current local data to Firestore
        const snapshot = buildSnapshot();
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
  }, [user, setStoreData, buildSnapshot]);

  // Debounced write to Firestore whenever local state changes
  useEffect(() => {
    if (!user || !isInitialized.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const snapshot = buildSnapshot();
      const writeId = uuidv4();
      lastWriteId.current = writeId;
      saveToFirestore(user.uid, snapshot, writeId).catch(console.error);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [user, buildSnapshot]);

  return null;
}
