// src/lib/audioStorage.ts
// IndexedDB-based storage for audio recordings (avoids localStorage size limits with base64)

const DB_NAME = 'nura_flow_audio';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

interface AudioRecord {
  id: string;
  dataUrl: string; // base64 audio data URL
  mimeType: string;
  durationSeconds: number;
  createdAt: string;
  meetingId?: string;
}

let db: IDBDatabase | null = null;
let dbReady: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);
  if (dbReady) return dbReady;

  dbReady = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });

  return dbReady;
}

export async function saveAudioRecording(id: string, dataUrl: string, mimeType: string, durationSeconds: number, meetingId?: string): Promise<void> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: AudioRecord = {
        id,
        dataUrl,
        mimeType,
        durationSeconds,
        createdAt: new Date().toISOString(),
        meetingId: meetingId
      };
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save audio recording:', error);
    throw error;
  }
}

export async function getAudioRecording(id: string): Promise<AudioRecord | null> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get audio recording:', error);
    return null;
  }
}

export async function deleteAudioRecording(id: string): Promise<void> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to delete audio recording:', error);
    throw error;
  }
}

export async function getAllAudioRecordings(): Promise<AudioRecord[]> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get all audio recordings:', error);
    return [];
  }
}

export async function clearAllAudioRecordings(): Promise<void> {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear audio recordings:', error);
    throw error;
  }
}
