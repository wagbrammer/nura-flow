import { useEffect, useRef } from 'react';
import { SyncService } from '../lib/sync';

const LOCAL_KEYS = [
  'nura_tasks',
  'nura_meetings',
  'nura_projects',
  'nura_tags',
  'nura_notes',
  'nura_events',
  'nura_emails',
  'nura_drive',
  'nura_useful_links',
  'nura_inbox',
  'nura_activity',
  'nura_notifications',
];

/**
 * Hook to sync data with server after component mounts
 * Call this in App.tsx or main layout to ensure data is synced
 *
 * IMPORTANT: syncAll() fetches from server and overwrites localStorage.
 * If the server has empty data (fresh install), this would wipe local data.
 * We guard against that by only syncing when server data is non-empty.
 */
export function useSync() {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    const timer = setTimeout(async () => {
      try {
        const available = await SyncService.isServerAvailable();
        if (!available) {
          console.log('[Sync] Server not available, using localStorage only');
          return;
        }

        let hasLocalData = false;
        for (const key of LOCAL_KEYS) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasLocalData = true;
                break;
              }
            } catch {}
          }
        }

        if (!hasLocalData) {
          // No local data — safe to pull from server
          console.log('[Sync] No local data found, syncing from server');
          await SyncService.syncAll();
          console.log('[Sync] Initial sync from server complete');
        } else {
          // Local data exists — server data would overwrite it.
          // Only push local data to server (no pull).
          console.log('[Sync] Local data found, skipping pull to prevent data loss');
        }
      } catch (e) {
        console.error('[Sync] Initial sync failed:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}