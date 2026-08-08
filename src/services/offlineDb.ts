import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Attempt, StudentProgress } from '../types/schema';

interface ShikshaDBSchema extends DBSchema {
  queuedAttempts: {
    key: string;
    value: Attempt;
  };
  cachedProgress: {
    key: string;
    value: StudentProgress;
  };
}

const DB_NAME = 'shikshaflow-offline-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ShikshaDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<ShikshaDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ShikshaDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('queuedAttempts')) {
          database.createObjectStore('queuedAttempts', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('cachedProgress')) {
          database.createObjectStore('cachedProgress', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Stores an attempt in IndexedDB when the device is offline
 */
export async function queueAttemptOffline(attempt: Attempt): Promise<void> {
  const database = await getDB();
  const attemptToQueue = { ...attempt, synced: false };
  await database.put('queuedAttempts', attemptToQueue);
  console.log(`[IndexedDB] Queued attempt ${attempt.id} offline.`);
}

/**
 * Gets all un-synced queued attempts from IndexedDB
 */
export async function getQueuedAttempts(): Promise<Attempt[]> {
  const database = await getDB();
  return await database.getAll('queuedAttempts');
}

/**
 * Gets total count of pending queued attempts
 */
export async function getQueuedAttemptsCount(): Promise<number> {
  const database = await getDB();
  const keys = await database.getAllKeys('queuedAttempts');
  return keys.length;
}

/**
 * Clears a synced attempt from IndexedDB
 */
export async function removeQueuedAttempt(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('queuedAttempts', id);
}

/**
 * Drains the IndexedDB queue into Firestore upon network reconnection.
 * Conflict resolution strategy: Last-Write-Wins (using attempt timestamps).
 */
export async function syncOfflineQueueToFirestore(): Promise<{ syncedCount: number; success: boolean }> {
  if (!navigator.onLine) {
    return { syncedCount: 0, success: false };
  }

  try {
    const queuedAttempts = await getQueuedAttempts();
    if (queuedAttempts.length === 0) {
      return { syncedCount: 0, success: true };
    }

    console.log(`[Offline Sync] Draining ${queuedAttempts.length} queued attempts to Firestore...`);

    let syncedCount = 0;
    for (const attempt of queuedAttempts) {
      try {
        // Push attempt to Firestore
        await addDoc(collection(db, 'attempts'), {
          ...attempt,
          synced: true,
        });

        // Delete attempt from IndexedDB queue
        await removeQueuedAttempt(attempt.id);
        syncedCount++;
      } catch (err) {
        console.warn(`[Offline Sync] Failed to push attempt ${attempt.id}:`, err);
      }
    }

    // Push latest student progress snapshots to Firestore (Last-Write-Wins)
    const localProgressRaw = localStorage.getItem('shiksha_progress');
    if (localProgressRaw) {
      try {
        const localProgressList: StudentProgress[] = JSON.parse(localProgressRaw);
        for (const prog of localProgressList) {
          await setDoc(doc(db, 'studentProgress', prog.id), prog, { merge: true });
        }
      } catch (err) {
        console.warn('[Offline Sync] Failed to push progress snapshot:', err);
      }
    }

    console.log(`[Offline Sync] Sync complete! Successfully uploaded ${syncedCount} attempts.`);
    return { syncedCount, success: true };
  } catch (err) {
    console.error('[Offline Sync] General sync failure:', err);
    return { syncedCount: 0, success: false };
  }
}
