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
  const localStorageClearedForUser = useRef<string | null>(null);

  const lastWriteId = useRef<string>('');
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
    if (!user) {
      localStorageClearedForUser.current = null;
      return;
    }
    if (localStorageClearedForUser.current === user.uid) return;
    localStorage.removeItem('mytimetracker-store');
    localStorageClearedForUser.current = user.uid;
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
      (snapshot, writeId) => {
        if (writeId && writeId === lastWriteId.current) {
          hasPendingWrite.current = false;
          lastConfirmedSnapshot.current = snapshot;
          if (queuedRemoteSnapshot.current) {
            setStoreData(queuedRemoteSnapshot.current);
            lastConfirmedSnapshot.current = queuedRemoteSnapshot.current;
            queuedRemoteSnapshot.current = null;
          }
          isInitialized.current = true;
          return;
        }

        if (hasPendingWrite.current) {
          queuedRemoteSnapshot.current = snapshot;
          return;
        }

        // Apply remote data to local store
        setStoreData(snapshot);
        lastConfirmedSnapshot.current = snapshot;
        isInitialized.current = true;
      },
      () => {
        // Document doesn't exist yet (new user) — push current local data to Firestore
        const snapshot = {
          ...buildSnapshot(),
          sessions: [],
          timers: {},
          allowOverlap: false,
        };
        const writeId = uuidv4();
        lastWriteId.current = writeId;
        hasPendingWrite.current = true;
        saveToFirestore(user.uid, snapshot, writeId)
          .then(() => {
            lastConfirmedSnapshot.current = snapshot;
            hasPendingWrite.current = false;
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
      if (snapshot.activities.length === 0) return;
      const writeId = uuidv4();
      lastWriteId.current = writeId;
      hasPendingWrite.current = true;
      saveToFirestore(user.uid, snapshot, writeId)
        .then(() => {
          lastConfirmedSnapshot.current = snapshot;
          hasPendingWrite.current = false;
        })
        .catch(handleWriteFailure);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [user, buildSnapshot, setStoreData, handleWriteFailure]);

  return null;
}
