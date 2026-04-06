'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/useStore';
import { saveToFirestore, subscribeToFirestore, StoreSnapshot } from '@/lib/firestoreSync';
import { STORE_PERSIST_KEY } from '@/store/useStore';

const DEBOUNCE_MS = 1500;

export default function FirebaseSync() {
  const { user } = useAuth();
  const activities = useStore((s) => s.activities);
  const sessions = useStore((s) => s.sessions);
  const timers = useStore((s) => s.timers);
  const allowOverlap = useStore((s) => s.allowOverlap);
  const setStoreData = useStore((s) => s.setStoreData);
  const lastClearedUserId = useRef<string | null>(null);
  const localNonActivityStateRef = useRef({ sessions, timers, allowOverlap });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);
  const lastConfirmedSnapshot = useRef<StoreSnapshot | null>(null);
  const hasPendingWrite = useRef(false);
  const queuedRemoteSnapshot = useRef<StoreSnapshot | null>(null);

  const handleWriteFailure = useCallback((error: unknown) => {
    console.error('Firestore Save Error:', error);
    hasPendingWrite.current = false;
    if (queuedRemoteSnapshot.current) {
      setStoreData(queuedRemoteSnapshot.current);
      lastConfirmedSnapshot.current = queuedRemoteSnapshot.current;
      queuedRemoteSnapshot.current = null;
      return;
    }
    if (lastConfirmedSnapshot.current) setStoreData(lastConfirmedSnapshot.current);
  }, [setStoreData]);

  // Build a snapshot from current store slices (stable reference via useCallback)
  const buildSnapshot = useCallback((): StoreSnapshot => ({
    activities,
    sessions,
    timers,
    allowOverlap,
  }), [activities, sessions, timers, allowOverlap]);

  useEffect(() => {
    localNonActivityStateRef.current = { sessions, timers, allowOverlap };
  }, [sessions, timers, allowOverlap]);

  useEffect(() => {
    if (!user) {
      lastClearedUserId.current = null;
      return;
    }
    // Clear stale persisted local state once per logged-in user to force cloud activity reload.
    if (lastClearedUserId.current === user.uid) return;
    localStorage.removeItem(STORE_PERSIST_KEY);
    lastClearedUserId.current = user.uid;
  }, [user]);

  // Subscribe to real-time Firestore updates when user is logged in
  useEffect(() => {
    if (!user) {
      setStoreData({
        activities: [],
        sessions: [],
        timers: {},
        allowOverlap: false,
      });
      isInitialized.current = false;
      hasPendingWrite.current = false;
      lastConfirmedSnapshot.current = null;
      queuedRemoteSnapshot.current = null;
      return;
    }

    const unsubscribe = subscribeToFirestore(
      user.uid,
      (snapshot) => {
        const mergedSnapshot: StoreSnapshot = {
          activities: snapshot.activities,
          ...localNonActivityStateRef.current,
        };

        if (hasPendingWrite.current) {
          queuedRemoteSnapshot.current = mergedSnapshot;
          return;
        }

        // Apply remote data to local store
        setStoreData(mergedSnapshot);
        lastConfirmedSnapshot.current = mergedSnapshot;
        isInitialized.current = true;
      },
      () => {
        // No remote activities for this user yet; sync current local activities.
        const snapshot = buildSnapshot();
        hasPendingWrite.current = true;
        saveToFirestore(user.uid, snapshot)
          .then(() => {
            hasPendingWrite.current = false;
            if (queuedRemoteSnapshot.current) {
              setStoreData(queuedRemoteSnapshot.current);
              lastConfirmedSnapshot.current = queuedRemoteSnapshot.current;
              queuedRemoteSnapshot.current = null;
            } else {
              lastConfirmedSnapshot.current = snapshot;
            }
            isInitialized.current = true;
          })
          .catch(handleWriteFailure);
      }
    );

    return () => {
      unsubscribe();
      isInitialized.current = false;
      hasPendingWrite.current = false;
      queuedRemoteSnapshot.current = null;
    };
  }, [user, setStoreData, buildSnapshot, handleWriteFailure]);

  // Debounced write to Firestore whenever local state changes
  useEffect(() => {
    if (!user || !isInitialized.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const snapshot = buildSnapshot();
      hasPendingWrite.current = true;
      saveToFirestore(user.uid, snapshot)
        .then(() => {
          hasPendingWrite.current = false;
          if (queuedRemoteSnapshot.current) {
            setStoreData(queuedRemoteSnapshot.current);
            lastConfirmedSnapshot.current = queuedRemoteSnapshot.current;
            queuedRemoteSnapshot.current = null;
          } else {
            lastConfirmedSnapshot.current = snapshot;
          }
        })
        .catch(handleWriteFailure);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [user, buildSnapshot, setStoreData, handleWriteFailure]);

  return null;
}
