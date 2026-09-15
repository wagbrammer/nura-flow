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
 * This ensures all devices stay in sync by always pulling from server first
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

        // Always sync from server to ensure cross-device consistency
        console.log('[Sync] Syncing from server...');
        await SyncService.syncAll();
        console.log('[Sync] Initial sync from server complete');
      } catch (e) {
        console.error('[Sync] Initial sync failed:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
}
