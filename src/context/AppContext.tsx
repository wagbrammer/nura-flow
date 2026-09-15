import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Project, Tag, Meeting, CalendarEvent, Task, Note, EmailReference, DriveReference, InboxItem, ActivityLog, NotificationItem, AIChatMessage, UsefulLink, PasswordItem, PomodoroState } from '../types';
import { StorageService } from '../lib/storage';
import { SyncService } from '../lib/sync';

interface AppContextType {
  user: User;
  setUser: (user: User) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  meetings: Meeting[];
  setMeetings: (meetings: Meeting[]) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  emails: EmailReference[];
  setEmails: (emails: EmailReference[]) => void;
  driveFiles: DriveReference[];
  setDriveFiles: (files: DriveReference[]) => void;
  usefulLinks: UsefulLink[];
  setUsefulLinks: (links: UsefulLink[]) => void;
  inbox: InboxItem[];
  setInbox: (inbox: InboxItem[]) => void;
  activityLogs: ActivityLog[];
  setActivityLogs: (logs: ActivityLog[]) => void;
  notifications: NotificationItem[];
  setNotifications: (notifs: NotificationItem[]) => void;
  chatMessages: AIChatMessage[];
  setChatMessages: (messages: AIChatMessage[]) => void;
  quickSummary: string;
  setQuickSummary: (summary: string) => void;
  passwords: PasswordItem[];
  setPasswords: (passwords: PasswordItem[]) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  pomodoro: PomodoroState;
  setPomodoro: (pomodoro: PomodoroState) => void;
  // Sync methods
  syncFromServer: () => Promise<void>;
  saveWithServer: (key: string, data: any[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => StorageService.getUser());
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects() || []);
  const [tags, setTags] = useState<Tag[]>(() => StorageService.getTags() || []);
  const [meetings, setMeetings] = useState<Meeting[]>(() => StorageService.getMeetings() || []);
  const [events, setEvents] = useState<CalendarEvent[]>(() => StorageService.getEvents() || []);
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks() || []);
  const [notes, setNotes] = useState<Note[]>(() => StorageService.getNotes() || []);
  const [emails, setEmails] = useState<EmailReference[]>(() => StorageService.getEmails() || []);
  const [driveFiles, setDriveFiles] = useState<DriveReference[]>(() => StorageService.getDriveFiles() || []);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>(() => StorageService.getUsefulLinks() || []);
  const [inbox, setInbox] = useState<InboxItem[]>(() => StorageService.getInbox() || []);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs() || []);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications() || []);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>(() => StorageService.getChatMessages());
  const [quickSummaryState, setQuickSummaryState] = useState<string>(() => StorageService.getQuickSummary());
  const [passwords, setPasswords] = useState<PasswordItem[]>(() => StorageService.getPasswords());
  const [currentView, setCurrentView] = useState<string>('today');
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => {
    const raw = localStorage.getItem('nura_pomodoro');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return {
      phase: 'focus',
      durationMs: 25 * 60 * 1000,
      remainingMs: 25 * 60 * 1000,
      isRunning: false,
      sessionsCompletedToday: 0,
      sessions: [],
      totalFocusMinutesToday: 0,
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreaks: false,
        autoStartFocus: false,
        soundEnabled: true
      }
    };
  });

  // Load user data
  useEffect(() => {
    StorageService.initializeIfNeeded();
    const savedUser = StorageService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Load settings from API
  useEffect(() => {
    fetch('/api/settings/logo')
      .then(res => res.json())
      .then(data => {
        // Could update context with logo URL if needed
      })
      .catch(err => console.error('Failed to load logo:', err));

    fetch('/api/settings/weather-locations')
      .then(res => res.json())
      .then(data => {
        if (data.locations && data.locations.length > 0) {
          localStorage.setItem('nura_weather_locations', JSON.stringify({
            selectedLocationId: data.locations[0].id,
            locations: data.locations
          }));
        }
      })
      .catch(err => console.error('Failed to load weather locations:', err));
  }, []);

  // Sync methods that save to both localStorage and server
  const handleSaveUser = async (updated: User) => {
    setUser(updated);
    StorageService.saveUser(updated);
    // Note: User data is not synced to server (it's per-device auth)
  };

  const handleSetProjects = async (updated: Project[]) => {
    setProjects(updated);
    StorageService.saveProjects(updated);
    await SyncService.saveWithServer('nura_projects', updated);
  };

  const handleSetTags = async (updated: Tag[]) => {
    setTags(updated);
    StorageService.saveTags(updated);
    await SyncService.saveWithServer('nura_tags', updated);
  };

  const handleSetMeetings = async (updated: Meeting[]) => {
    setMeetings(updated);
    StorageService.saveMeetings(updated);
    await SyncService.saveWithServer('nura_meetings', updated);
  };

  const handleSetEvents = async (updated: CalendarEvent[]) => {
    setEvents(updated);
    StorageService.saveEvents(updated);
    await SyncService.saveWithServer('nura_events', updated);
  };

  const handleSetTasks = async (updated: Task[]) => {
    setTasks(updated);
    StorageService.saveTasks(updated);
    await SyncService.saveWithServer('nura_tasks', updated);
  };

  const handleSetNotes = async (updated: Note[]) => {
    setNotes(updated);
    StorageService.saveNotes(updated);
    await SyncService.saveWithServer('nura_notes', updated);
  };

  const handleSetEmails = async (updated: EmailReference[]) => {
    setEmails(updated);
    StorageService.saveEmails(updated);
    await SyncService.saveWithServer('nura_emails', updated);
  };

  const handleSetDriveFiles = async (updated: DriveReference[]) => {
    setDriveFiles(updated);
    StorageService.saveDriveFiles(updated);
    await SyncService.saveWithServer('nura_drive', updated);
  };

  const handleSetUsefulLinks = async (updated: UsefulLink[]) => {
    setUsefulLinks(updated);
    StorageService.saveUsefulLinks(updated);
    await SyncService.saveWithServer('nura_useful_links', updated);
  };

  const handleSetInbox = async (updated: InboxItem[]) => {
    setInbox(updated);
    StorageService.saveInbox(updated);
    await SyncService.saveWithServer('nura_inbox', updated);
  };

  const handleSetActivityLogs = async (updated: ActivityLog[]) => {
    setActivityLogs(updated);
    StorageService.saveActivityLogs(updated);
    await SyncService.saveWithServer('nura_activity', updated);
  };

  const handleSetNotifications = async (updated: NotificationItem[]) => {
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    await SyncService.saveWithServer('nura_notifications', updated);
  };

  const handleSetChatMessages = async (updated: AIChatMessage[]) => {
    setChatMessages(updated);
    StorageService.saveChatMessages(updated);
    // Chat messages are stored locally only
  };

  const handleSetQuickSummary = async (summary: string) => {
    setQuickSummaryState(summary);
    StorageService.saveQuickSummary(summary);
  };

  const handleSetPasswords = async (updated: PasswordItem[]) => {
    setPasswords(updated);
    StorageService.savePasswords(updated);
    // Passwords are stored locally only
  };

  const handleSetPomodoro = async (updated: PomodoroState) => {
    setPomodoro(updated);
    localStorage.setItem('nura_pomodoro', JSON.stringify(updated));
    // Pomodoro state is synced via server endpoint
    try {
      await fetch('/api/pomodoro/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Failed to sync pomodoro:', err);
    }
  };

  // Sync from server method
  const syncFromServer = async () => {
    await SyncService.syncAll();
    // Refresh local state from localStorage (which was updated by sync)
    setUser(StorageService.getUser());
    setProjects(StorageService.getProjects() || []);
    setTags(StorageService.getTags() || []);
    setMeetings(StorageService.getMeetings() || []);
    setEvents(StorageService.getEvents() || []);
    setTasks(StorageService.getTasks() || []);
    setNotes(StorageService.getNotes() || []);
    setEmails(StorageService.getEmails() || []);
    setDriveFiles(StorageService.getDriveFiles() || []);
    setUsefulLinks(StorageService.getUsefulLinks() || []);
    setInbox(StorageService.getInbox() || []);
    setActivityLogs(StorageService.getActivityLogs() || []);
    setNotifications(StorageService.getNotifications() || []);
    setChatMessages(StorageService.getChatMessages());
    setQuickSummaryState(StorageService.getQuickSummary());
    setPasswords(StorageService.getPasswords());
  };

  const saveWithServer = async (key: string, data: any[]) => {
    await SyncService.saveWithServer(key, data);
  };

  const contextValue: AppContextType = {
    user,
    setUser: handleSaveUser,
    projects,
    setProjects: handleSetProjects,
    tags,
    setTags: handleSetTags,
    meetings,
    setMeetings: handleSetMeetings,
    events,
    setEvents: handleSetEvents,
    tasks,
    setTasks: handleSetTasks,
    notes,
    setNotes: handleSetNotes,
    emails,
    setEmails: handleSetEmails,
    driveFiles,
    setDriveFiles: handleSetDriveFiles,
    usefulLinks,
    setUsefulLinks: handleSetUsefulLinks,
    inbox,
    setInbox: handleSetInbox,
    activityLogs,
    setActivityLogs: handleSetActivityLogs,
    notifications,
    setNotifications: handleSetNotifications,
    chatMessages,
    setChatMessages: handleSetChatMessages,
    quickSummary: quickSummaryState,
    setQuickSummary: handleSetQuickSummary,
    passwords,
    setPasswords: handleSetPasswords,
    currentView,
    setCurrentView,
    pomodoro,
    setPomodoro: handleSetPomodoro,
    syncFromServer,
    saveWithServer
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
