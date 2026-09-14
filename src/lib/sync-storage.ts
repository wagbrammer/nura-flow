/**
 * SyncStorageService - Extends StorageService with server synchronization
 */
import { StorageService } from './storage';
import { SyncService } from './sync';

// Helper to wrap async operations
const wrapWithSync = (storageKey: string) => {
  const getOriginal = () => {
    switch (storageKey) {
      case 'nura_projects': return StorageService.getProjects;
      case 'nura_tags': return StorageService.getTags;
      case 'nura_meetings': return StorageService.getMeetings;
      case 'nura_tasks': return StorageService.getTasks;
      case 'nura_notes': return StorageService.getNotes;
      case 'nura_events': return StorageService.getEvents;
      case 'nura_emails': return StorageService.getEmails;
      case 'nura_drive': return StorageService.getDriveFiles;
      case 'nura_useful_links': return StorageService.getUsefulLinks;
      case 'nura_inbox': return StorageService.getInbox;
      case 'nura_activity': return StorageService.getActivityLogs;
      case 'nura_notifications': return StorageService.getNotifications;
      default: return null;
    }
  };

  const setOriginal = () => {
    switch (storageKey) {
      case 'nura_projects': return StorageService.saveProjects;
      case 'nura_tags': return StorageService.saveTags;
      case 'nura_meetings': return StorageService.saveMeetings;
      case 'nura_tasks': return StorageService.saveTasks;
      case 'nura_notes': return StorageService.saveNotes;
      case 'nura_events': return StorageService.saveEvents;
      case 'nura_emails': return StorageService.saveEmails;
      case 'nura_drive': return StorageService.saveDriveFiles;
      case 'nura_useful_links': return StorageService.saveUsefulLinks;
      case 'nura_inbox': return StorageService.saveInbox;
      case 'nura_activity': return StorageService.saveActivityLogs;
      case 'nura_notifications': return StorageService.saveNotifications;
      default: return null;
    }
  };

  return {
    get: async () => {
      return await SyncService.getWithFallback(storageKey);
    },
    set: async (data: any[]) => {
      const originalSet = setOriginal();
      if (originalSet) {
        originalSet(data);
      }
      await SyncService.saveWithServer(storageKey, data);
    }
  };
};

// Export wrapped services
export const SyncStorageService = {
  ...StorageService,
  getProjects: async () => wrapWithSync('nura_projects').get(),
  saveProjects: async (projects: any[]) => wrapWithSync('nura_projects').set(projects),
  getTags: async () => wrapWithSync('nura_tags').get(),
  saveTags: async (tags: any[]) => wrapWithSync('nura_tags').set(tags),
  getMeetings: async () => wrapWithSync('nura_meetings').get(),
  saveMeetings: async (meetings: any[]) => wrapWithSync('nura_meetings').set(meetings),
  getTasks: async () => wrapWithSync('nura_tasks').get(),
  saveTasks: async (tasks: any[]) => wrapWithSync('nura_tasks').set(tasks),
  getNotes: async () => wrapWithSync('nura_notes').get(),
  saveNotes: async (notes: any[]) => wrapWithSync('nura_notes').set(notes),
  getEvents: async () => wrapWithSync('nura_events').get(),
  saveEvents: async (events: any[]) => wrapWithSync('nura_events').set(events),
  getEmails: async () => wrapWithSync('nura_emails').get(),
  saveEmails: async (emails: any[]) => wrapWithSync('nura_emails').set(emails),
  getDriveFiles: async () => wrapWithSync('nura_drive').get(),
  saveDriveFiles: async (files: any[]) => wrapWithSync('nura_drive').set(files),
  getUsefulLinks: async () => wrapWithSync('nura_useful_links').get(),
  saveUsefulLinks: async (links: any[]) => wrapWithSync('nura_useful_links').set(links),
  getInbox: async () => wrapWithSync('nura_inbox').get(),
  saveInbox: async (inbox: any[]) => wrapWithSync('nura_inbox').set(inbox),
  getActivityLogs: async () => wrapWithSync('nura_activity').get(),
  saveActivityLogs: async (logs: any[]) => wrapWithSync('nura_activity').set(logs),
  getNotifications: async () => wrapWithSync('nura_notifications').get(),
  saveNotifications: async (notifs: any[]) => wrapWithSync('nura_notifications').set(notifs),
};