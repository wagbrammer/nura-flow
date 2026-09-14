import {
  CURRENT_USER,
  INITIAL_PROJECTS,
  INITIAL_TAGS,
  INITIAL_MEETINGS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_TASKS,
  INITIAL_NOTES,
  INITIAL_EMAILS,
  INITIAL_DRIVE_FILES,
  INITIAL_INBOX_ITEMS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USEFUL_LINKS
} from './constants';
import {
  User,
  Project,
  Tag,
  Meeting,
  CalendarEvent,
  Task,
  Note,
  EmailReference,
  DriveReference,
  InboxItem,
  ActivityLog,
  NotificationItem,
  AIChatMessage,
  UsefulLink,
  PasswordItem
} from '../types';

const STORAGE_KEYS = {
  USER: 'nura_user',
  PROJECTS: 'nura_projects',
  TAGS: 'nura_tags',
  MEETINGS: 'nura_meetings',
  EVENTS: 'nura_events',
  TASKS: 'nura_tasks',
  NOTES: 'nura_notes',
  EMAILS: 'nura_emails',
  DRIVE_FILES: 'nura_drive',
  USEFUL_LINKS: 'nura_useful_links',
  INBOX: 'nura_inbox',
  ACTIVITY_LOGS: 'nura_activity',
  NOTIFICATIONS: 'nura_notifications',
  CHAT_MESSAGES: 'nura_chat_messages',
  QUICK_SUMMARY: 'nura_quick_summary',
  IS_INITIALIZED: 'nura_init_v2',
  PASSWORDS: 'nura_passwords'
};

export const StorageService = {
  initializeIfNeeded(): void {
    if (typeof window === 'undefined') return;
    const isInit = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
    if (!isInit) {
      this.resetToSeedData();
    }
  },

  resetToSeedData(): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(CURRENT_USER));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(INITIAL_TAGS));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(INITIAL_MEETINGS));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_CALENDAR_EVENTS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(INITIAL_NOTES));
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(INITIAL_EMAILS));
    localStorage.setItem(STORAGE_KEYS.DRIVE_FILES, JSON.stringify(INITIAL_DRIVE_FILES));
    localStorage.setItem(STORAGE_KEYS.USEFUL_LINKS, JSON.stringify(INITIAL_USEFUL_LINKS));
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(INITIAL_INBOX_ITEMS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUICK_SUMMARY, 'Seu briefing diário ainda não foi gerado.');
    localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
  },

  getUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : CURRENT_USER;
    } catch {
      return CURRENT_USER;
    }
  },

  saveUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  },

  saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getTags(): Tag[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TAGS);
      return data ? JSON.parse(data) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  },

  saveTags(tags: Tag[]): void {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  },

  getMeetings(): Meeting[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      return data ? JSON.parse(data) : INITIAL_MEETINGS;
    } catch {
      return INITIAL_MEETINGS;
    }
  },

  saveMeetings(meetings: Meeting[]): void {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  },

  getEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : INITIAL_CALENDAR_EVENTS;
    } catch {
      return INITIAL_CALENDAR_EVENTS;
    }
  },

  saveEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getNotes(): Note[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  },

  saveNotes(notes: Note[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },

  getEmails(): EmailReference[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMAILS);
      return data ? JSON.parse(data) : INITIAL_EMAILS;
    } catch {
      return INITIAL_EMAILS;
    }
  },

  saveEmails(emails: EmailReference[]): void {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(emails));
  },

  getDriveFiles(): DriveReference[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVE_FILES);
      return data ? JSON.parse(data) : INITIAL_DRIVE_FILES;
    } catch {
      return INITIAL_DRIVE_FILES;
    }
  },

  saveDriveFiles(files: DriveReference[]): void {
    localStorage.setItem(STORAGE_KEYS.DRIVE_FILES, JSON.stringify(files));
  },

  getUsefulLinks(): UsefulLink[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USEFUL_LINKS);
      return data ? JSON.parse(data) : INITIAL_USEFUL_LINKS;
    } catch {
      return INITIAL_USEFUL_LINKS;
    }
  },

  saveUsefulLinks(links: UsefulLink[]): void {
    localStorage.setItem(STORAGE_KEYS.USEFUL_LINKS, JSON.stringify(links));
  },

  getInbox(): InboxItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INBOX);
      return data ? JSON.parse(data) : INITIAL_INBOX_ITEMS;
    } catch {
      return INITIAL_INBOX_ITEMS;
    }
  },

  saveInbox(inbox: InboxItem[]): void {
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(inbox));
  },

  getActivityLogs(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return data ? JSON.parse(data) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  },

  saveActivityLogs(logs: ActivityLog[]): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  },

  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(notifs: NotificationItem[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  getChatMessages(): AIChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: AIChatMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  getPasswords(): PasswordItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePasswords(passwords: PasswordItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
  },

  getQuickSummary(): string {
    return localStorage.getItem(STORAGE_KEYS.QUICK_SUMMARY) || 'Seu briefing diário ainda não foi gerado.';
  },

  saveQuickSummary(summary: string): void {
    localStorage.setItem(STORAGE_KEYS.QUICK_SUMMARY, summary);
  },

  exportAllData(): string {
    const backup = {
      user: this.getUser(),
      projects: this.getProjects(),
      tags: this.getTags(),
      meetings: this.getMeetings(),
      events: this.getEvents(),
      tasks: this.getTasks(),
      notes: this.getNotes(),
      emails: this.getEmails(),
      driveFiles: this.getDriveFiles(),
      usefulLinks: this.getUsefulLinks(),
      inbox: this.getInbox(),
      activityLogs: this.getActivityLogs(),
      notifications: this.getNotifications(),
      chatMessages: this.getChatMessages(),
      quickSummary: this.getQuickSummary(),
      passwords: this.getPasswords(),
      weatherLocations: localStorage.getItem('nura_weather_locations'),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.user) this.saveUser(parsed.user);
      if (parsed.projects) this.saveProjects(parsed.projects);
      if (parsed.tags) this.saveTags(parsed.tags);
      if (parsed.meetings) this.saveMeetings(parsed.meetings);
      if (parsed.events) this.saveEvents(parsed.events);
      if (parsed.tasks) this.saveTasks(parsed.tasks);
      if (parsed.notes) this.saveNotes(parsed.notes);
      if (parsed.emails) this.saveEmails(parsed.emails);
      if (parsed.driveFiles) this.saveDriveFiles(parsed.driveFiles);
      if (parsed.usefulLinks) this.saveUsefulLinks(parsed.usefulLinks);
      if (parsed.inbox) this.saveInbox(parsed.inbox);
      if (parsed.activityLogs) this.saveActivityLogs(parsed.activityLogs);
      if (parsed.notifications) this.saveNotifications(parsed.notifications);
      if (parsed.chatMessages) this.saveChatMessages(parsed.chatMessages);
      if (typeof parsed.quickSummary === 'string') this.saveQuickSummary(parsed.quickSummary);
      if (parsed.passwords) this.savePasswords(parsed.passwords);
      if (typeof parsed.weatherLocations === 'string') {
        localStorage.setItem('nura_weather_locations', parsed.weatherLocations);
      }
      return true;
    } catch (e) {
      console.error("Failed to import data:", e);
      return false;
    }
  }
};
