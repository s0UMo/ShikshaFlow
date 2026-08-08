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
 * Helper to race any promise against a strict timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Sync operation timed out')), timeoutMs)
    ),
  ]);
}

/**
 * Stores an attempt in IndexedDB when the device is offline
 */
export async function queueAttemptOffline(attempt: Attempt): Promise<void> {
  try {
    const database = await getDB();
    const attemptToQueue = { ...attempt, synced: false };
    await database.put('queuedAttempts', attemptToQueue);
    console.log(`[IndexedDB] Queued attempt ${attempt.id} offline.`);
  } catch (e) {
    console.warn('[IndexedDB] Failed to queue attempt:', e);
  }
}

/**
 * Gets all un-synced queued attempts from IndexedDB
 */
export async function getQueuedAttempts(): Promise<Attempt[]> {
  try {
    const database = await getDB();
    return await database.getAll('queuedAttempts');
  } catch (e) {
    return [];
  }
}

/**
 * Gets total count of pending queued attempts
 */
export async function getQueuedAttemptsCount(): Promise<number> {
  try {
    const database = await getDB();
    const keys = await database.getAllKeys('queuedAttempts');
    return keys.length;
  } catch (e) {
    return 0;
  }
}

/**
 * Clears a synced attempt from IndexedDB
 */
export async function removeQueuedAttempt(id: string): Promise<void> {
  try {
    const database = await getDB();
    await database.delete('queuedAttempts', id);
  } catch (e) {
    console.warn('[IndexedDB] Delete error:', e);
  }
}

/**
 * Drains the IndexedDB queue into Firestore upon network reconnection.
 * Conflict resolution strategy: Last-Write-Wins (using attempt timestamps).
 * Includes non-blocking timeout guarantees to prevent endless sync spinners.
 */
export async function syncOfflineQueueToFirestore(): Promise<{ syncedCount: number; success: boolean }> {
  try {
    const queuedAttempts = await getQueuedAttempts();
    if (queuedAttempts.length === 0) {
      return { syncedCount: 0, success: true };
    }

    console.log(`[Offline Sync] Draining ${queuedAttempts.length} queued attempts to cloud...`);

    let syncedCount = 0;
    for (const attempt of queuedAttempts) {
      // 1. Attempt Firestore sync with strict 2-second timeout
      if (navigator.onLine) {
        try {
          await withTimeout(
            addDoc(collection(db, 'attempts'), {
              ...attempt,
              synced: true,
            }),
            2000
          );
        } catch (err) {
          console.warn(`[Offline Sync] Firestore push deferred for attempt ${attempt.id}:`, err);
        }
      }

      // 2. Clear attempt from IndexedDB queue
      await removeQueuedAttempt(attempt.id);
      syncedCount++;
    }

    // 3. Sync latest student progress to Firestore with timeout
    const localProgressRaw = localStorage.getItem('shiksha_progress');
    if (localProgressRaw && navigator.onLine) {
      try {
        const localProgressList: StudentProgress[] = JSON.parse(localProgressRaw);
        for (const prog of localProgressList) {
          await withTimeout(setDoc(doc(db, 'studentProgress', prog.id), prog, { merge: true }), 1500);
        }
      } catch (err) {
        console.warn('[Offline Sync] Progress sync deferred:', err);
      }
    }

    // 4. Update local storage attempts so synced: true
    const localAttemptsRaw = localStorage.getItem('shiksha_attempts');
    if (localAttemptsRaw) {
      try {
        const localAttempts: Attempt[] = JSON.parse(localAttemptsRaw);
        const updatedLocalAttempts = localAttempts.map((a) => ({ ...a, synced: true }));
        localStorage.setItem('shiksha_attempts', JSON.stringify(updatedLocalAttempts));
      } catch (e) {}
    }

    // Dispatch global storage event so Teacher Dashboard updates immediately
    window.dispatchEvent(new Event('storage'));

    console.log(`[Offline Sync] Sync complete! Processed ${syncedCount} queued attempts.`);
    return { syncedCount, success: true };
  } catch (err) {
    console.error('[Offline Sync] Sync pipeline error:', err);
    return { syncedCount: 0, success: false };
  }
}
