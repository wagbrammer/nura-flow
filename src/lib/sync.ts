/**
 * Sync Service - Sincroniza dados entre localStorage e backend API
 */

export interface SyncResource {
  storageKey: string;
  apiUrl: string;
  listKey: string;
}

const SYNCABLE_RESOURCES: SyncResource[] = [
  { storageKey: 'nura_meetings', apiUrl: '/api/meetings', listKey: 'meetings' },
  { storageKey: 'nura_tasks', apiUrl: '/api/tasks', listKey: 'tasks' },
  { storageKey: 'nura_notes', apiUrl: '/api/notes', listKey: 'notes' },
  { storageKey: 'nura_projects', apiUrl: '/api/projects', listKey: 'projects' },
  { storageKey: 'nura_tags', apiUrl: '/api/tags', listKey: 'tags' },
  { storageKey: 'nura_events', apiUrl: '/api/events', listKey: 'events' },
  { storageKey: 'nura_emails', apiUrl: '/api/emails', listKey: 'emails' },
  { storageKey: 'nura_drive', apiUrl: '/api/drive-files', listKey: 'files' },
  { storageKey: 'nura_useful_links', apiUrl: '/api/useful-links', listKey: 'links' },
  { storageKey: 'nura_inbox', apiUrl: '/api/inbox', listKey: 'items' },
  { storageKey: 'nura_activity', apiUrl: '/api/activity-logs', listKey: 'logs' },
  { storageKey: 'nura_notifications', apiUrl: '/api/notifications', listKey: 'notifications' },
];

const lastSyncMap: Record<string, number> = {};

export const SyncService = {
  /** Fetch all data from server and sync to localStorage */
  async syncAll(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      for (const resource of SYNCABLE_RESOURCES) {
        try {
          const response = await fetch(resource.apiUrl, { credentials: 'same-origin' });
          if (response.ok) {
            const data = await response.json();
            const items = data[resource.listKey] || [];
            localStorage.setItem(resource.storageKey, JSON.stringify(items));
            lastSyncMap[resource.storageKey] = Date.now();
          }
        } catch (e) {
          console.warn(`[Sync] Failed to sync ${resource.listKey}:`, e);
        }
      }
    } catch (e) {
      console.error('[Sync] General sync error:', e);
    }
  },

  /** Get local data with server fallback */
  async getWithFallback<T>(storageKey: string): Promise<T[]> {
    if (typeof window === 'undefined') return [];

    const resource = SYNCABLE_RESOURCES.find(r => r.storageKey === storageKey);
    if (!resource) {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    }

    try {
      const response = await fetch(resource.apiUrl, { credentials: 'same-origin' });
      if (response.ok) {
        const data = await response.json();
        const items = data[resource.listKey] || [];
        localStorage.setItem(storageKey, JSON.stringify(items));
        lastSyncMap[storageKey] = Date.now();
        return items as T[];
      }
    } catch (e) {
      console.warn(`[Sync] Server unavailable for ${resource.listKey}, using localStorage`);
    }

    const localData = localStorage.getItem(storageKey);
    return localData ? JSON.parse(localData) : [];
  },

  /** Save data to both localStorage and server */
  async saveWithServer(storageKey: string, data: any[]): Promise<void> {
    if (typeof window === 'undefined') return;

    localStorage.setItem(storageKey, JSON.stringify(data));

    const resource = SYNCABLE_RESOURCES.find(r => r.storageKey === storageKey);
    if (!resource) return;

    try {
      const response = await fetch(resource.apiUrl, { credentials: 'same-origin' });
      if (response.ok) {
        const serverData = await response.json();
        const existingItems = serverData[resource.listKey] || [];
        const existingIds = new Set(existingItems.map((item: any) => item.id));
        const currentIds = new Set(data.map((item: any) => item.id));

        // Delete removed items
        for (const id of existingIds) {
          if (!currentIds.has(id)) {
            try {
              await fetch(`${resource.apiUrl}/${id}`, { method: 'DELETE', credentials: 'same-origin' });
            } catch (e) { /* ignore */ }
          }
        }

        // Upsert each item
        for (const item of data) {
          if (existingIds.has(item.id)) {
            try {
              await fetch(`${resource.apiUrl}/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(item)
              });
            } catch (e) { /* ignore */ }
          } else {
            try {
              await fetch(resource.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(item)
              });
            } catch (e) { /* ignore */ }
          }
        }

        lastSyncMap[storageKey] = Date.now();
      }
    } catch (e) {
      console.warn(`[Sync] Failed to save to server, using localStorage only:`, e);
    }
  },

  /** Check if server is available */
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { credentials: 'same-origin' });
      return response.ok;
    } catch {
      return false;
    }
  },

  /** Get sync status */
  getStatus(): { lastSync: Record<string, number> } {
    return { lastSync: { ...lastSyncMap } };
  }
};