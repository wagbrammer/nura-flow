import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'server', 'data');

interface DataStore<T> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): T;
  update(id: string, updates: Partial<T>): T | undefined;
  delete(id: string): boolean;
}

function createDataStore<T extends { id: string }>(filename: string, seedData: T[] = []): DataStore<T> {
  const filePath = path.join(dataDir, filename);

  // Initialize file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(seedData, null, 2));
  }

  function readAll(): T[] {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  function writeAll(items: T[]): void {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
  }

  return {
    getAll() {
      return readAll();
    },
    getById(id: string) {
      return readAll().find(item => item.id === id);
    },
    create(item: T) {
      const items = readAll();
      items.push(item);
      writeAll(items);
      return item;
    },
    update(id: string, updates: Partial<T>) {
      const items = readAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      writeAll(items);
      return items[index];
    },
    delete(id: string) {
      const items = readAll();
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length === items.length) return false;
      writeAll(filtered);
      return true;
    }
  };
}

// Export all stores
export const meetingsStore = createDataStore('meetings.json');
export const tasksStore = createDataStore('tasks.json');
export const notesStore = createDataStore('notes.json');
export const projectsStore = createDataStore('projects.json');
export const tagsStore = createDataStore('tags.json');
export const eventsStore = createDataStore('events.json');
export const emailsStore = createDataStore('emails.json');
export const driveFilesStore = createDataStore('drive-files.json');
export const usefulLinksStore = createDataStore('useful-links.json');
export const inboxStore = createDataStore('inbox.json');
export const activityLogsStore = createDataStore('activity-logs.json');
export const notificationsStore = createDataStore('notifications.json');
export const chatMessagesStore = createDataStore('chat-messages.json');

/**
 * Initialize server-side stores from localStorage data on startup
 * This is a one-time migration to sync existing client data to server
 */
export function initializeStoresFromLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const migrations: Array<{ store: typeof meetingsStore; key: string }> = [
    { store: meetingsStore, key: 'nura_meetings' },
    { store: tasksStore, key: 'nura_tasks' },
    { store: notesStore, key: 'nura_notes' },
    { store: projectsStore, key: 'nura_projects' },
    { store: tagsStore, key: 'nura_tags' },
    { store: eventsStore, key: 'nura_events' },
    { store: emailsStore, key: 'nura_emails' },
    { store: driveFilesStore, key: 'nura_drive' },
    { store: usefulLinksStore, key: 'nura_useful_links' },
    { store: inboxStore, key: 'nura_inbox' },
    { store: activityLogsStore, key: 'nura_activity' },
    { store: notificationsStore, key: 'nura_notifications' },
  ];

  for (const { store, key } of migrations) {
    try {
      const localData = localStorage.getItem(key);
      if (!localData) continue;

      const items = JSON.parse(localData);
      if (!Array.isArray(items) || items.length === 0) continue;

      const existing = store.getAll();
      const existingIds = new Set(existing.map((item: any) => item.id));

      let createdCount = 0;
      for (const item of items) {
        if (!existingIds.has(item.id)) {
          store.create(item);
          createdCount++;
        }
      }

      if (createdCount > 0) {
        console.log(`[Sync] Migrated ${createdCount} items from ${key} to server`);
      }
    } catch (e) {
      console.warn(`[Sync] Failed to migrate ${key}:`, e);
    }
  }
}