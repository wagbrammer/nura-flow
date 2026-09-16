import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Project, Tag, Meeting, CalendarEvent, Task, Note,
  EmailReference, DriveReference, InboxItem, ActivityLog,
  NotificationItem, AIChatMessage, UsefulLink, PasswordItem,
  PomodoroState
} from '../types';
import { StorageService } from '../lib/storage';
import { SyncService } from '../lib/sync';

// Weather location type (matching what's stored in localStorage)
interface WeatherLocation {
  id?: string;
  latitude: number;
  longitude: number;
  cityName: string;
}

interface AppContextType {
  user: User;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  resetDatabase: () => void;
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
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  pomodoro: PomodoroState;
  setPomodoro: React.Dispatch<React.SetStateAction<PomodoroState>>;

  // Modal states
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;
  assistantDraft: string;
  setAssistantDraft: (draft: string) => void;

  // Meeting mode
  activeMeetingId: string | null;
  startMeetingMode: (meetingId: string) => void;
  endMeetingMode: () => void;
  finishMeetingMode: (meetingId: string) => void;

  // Selected items
  selectedMeetingId: string | null;
  setSelectedMeetingId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Weather location
  weatherLocation: WeatherLocation | null;
  setWeatherLocation: (loc: WeatherLocation | null) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // CRUD helpers
  addTask: (partial: Partial<Task> & Pick<Task, 'title'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  toggleTaskChecklist: (taskId: string, checklistItemId: string) => Promise<void>;
  addTaskComment: (taskId: string, comment: string) => Promise<void>;
  addMeeting: (partial: Partial<Meeting> & Pick<Meeting, 'title'>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  updateMeetingMiniAta: (id: string, miniAta: string) => Promise<void>;
  addAttachmentToMeeting: (meetingId: string, partial: Pick<NonNullable<Meeting['attachments']>[0], 'name' | 'type' | 'size'> & { url?: string }) => Promise<void>;
  removeAttachmentFromMeeting: (meetingId: string, attachmentId: string) => Promise<void>;
  addNoteToMeeting: (meetingId: string, partial: Partial<Note> & Pick<Note, 'title' | 'type' | 'content'>) => Promise<void>;
  addMeetingDecision: (meetingId: string, decision: string) => Promise<void>;
  addNote: (partial: Partial<Note> & Pick<Note, 'title' | 'type' | 'content'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addTag: (partial: Partial<Tag> & Pick<Tag, 'name'>) => Tag;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addProject: (partial: Partial<Project> & Pick<Project, 'name'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addEvent: (partial: Partial<CalendarEvent> & Pick<CalendarEvent, 'title' | 'startDate' | 'startTime'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEmail: (email: EmailReference) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  addDriveFile: (file: DriveReference) => Promise<void>;
  updateDriveFile: (id: string, updates: Partial<DriveReference>) => Promise<void>;
  deleteDriveFile: (id: string) => Promise<void>;
  addUsefulLink: (partial: Partial<UsefulLink> & Pick<UsefulLink, 'title' | 'address' | 'location' | 'icon' | 'color' | 'category'>) => Promise<void>;
  updateUsefulLink: (id: string, updates: Partial<UsefulLink>) => Promise<void>;
  deleteUsefulLink: (id: string) => Promise<void>;
  addInboxItem: (partial: Partial<InboxItem> & Pick<InboxItem, 'type' | 'content'>) => InboxItem;
  updateInboxItem: (id: string, updates: Partial<InboxItem>) => Promise<void>;
  deleteInboxItem: (id: string) => Promise<void>;
  addNotification: (notif: NotificationItem) => Promise<void>;
  updateNotification: (id: string, updates: Partial<NotificationItem>) => Promise<void>;
  addChatMessage: (partial: Partial<AIChatMessage> & Pick<AIChatMessage, 'role' | 'content'>) => AIChatMessage;
  addActivityLog: (log: ActivityLog) => Promise<void>;
  processInboxItem: (id: string) => Promise<void>;
  setTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  toggleUsefulLinkFavorite: (id: string) => Promise<void>;
  saveDriveFiles: (files: DriveReference[]) => Promise<void>;

  // Sync methods
  syncFromServer: () => Promise<void>;
  saveWithServer: (key: string, data: any[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, initialView }: { children: ReactNode; initialView?: string }) {
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
  const [currentView, setCurrentView] = useState<string>(() => {
    const saved = localStorage.getItem('nura_current_view');
    return saved && ['today','agenda','meetings','notes','tasks','projects','inbox','files','useful_links','email','chat','assistant','pomodoro','timeline','settings','passwords','meeting_mode'].includes(saved) ? saved : (initialView || 'today');
  });
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
    try {
      return JSON.parse(localStorage.getItem('nura_theme') || '"auto"');
    } catch {
      return 'auto';
    }
  });
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => {
    const raw = localStorage.getItem('nura_pomodoro');
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return {
      phase: 'focus', durationMs: 25 * 60 * 1000, remainingMs: 25 * 60 * 1000,
      isRunning: false, sessionsCompletedToday: 0, sessions: [],
      totalFocusMinutesToday: 0,
      settings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
        sessionsBeforeLongBreak: 4, autoStartBreaks: false, autoStartFocus: false, soundEnabled: true }
    };
  });

  // Modal states
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [assistantDraft, setAssistantDraft] = useState('');

  // Meeting mode
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // Selected items
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Weather location
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocation | null>(() => {
    try {
      const saved = localStorage.getItem('nura_weather_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.locations?.length > 0) {
          return {
            id: parsed.selectedLocationId,
            latitude: parsed.locations[0].latitude,
            longitude: parsed.locations[0].longitude,
            cityName: parsed.locations[0].cityName
          };
        }
      }
    } catch {}
    return null;
  });

  // Load user data
  useEffect(() => {
    StorageService.initializeIfNeeded();
    const savedUser = StorageService.getUser();
    if (savedUser) setUser(savedUser);
  }, []);

  // Load settings from API
  useEffect(() => {
    fetch('/api/settings/logo')
      .then(r => r.json())
      .catch(() => {});
    fetch('/api/settings/weather-locations')
      .then(r => r.json())
      .then(data => {
        if (data.locations?.length > 0) {
          const loc = data.locations[0];
          setWeatherLocation({ latitude: loc.latitude, longitude: loc.longitude, cityName: loc.cityName });
          localStorage.setItem('nura_weather_locations', JSON.stringify({
            selectedLocationId: loc.id, locations: data.locations
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Theme persistence + apply to DOM
  useEffect(() => {
    localStorage.setItem('nura_theme', JSON.stringify(theme));
    if (typeof document === 'undefined') return;
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  // Apply initial theme on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const saved = localStorage.getItem('nura_theme');
    const t: 'light' | 'dark' | 'auto' = saved ? JSON.parse(saved) : 'auto';
    const isDark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // Helper: sync save to both localStorage and server
  const syncSave = async (key: string, storageFn: (data: any) => void, data: any[]) => {
    storageFn(data);
    await SyncService.saveWithServer(key, data);
  };

  // ---- User helpers ----
  const updateUser = (updates: Partial<User>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    StorageService.saveUser(updated);
  };

  const resetDatabase = () => {
    StorageService.resetToSeedData();
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

  // ---- Task helpers ----
  const addTask = (partial: Partial<Task> & Pick<Task, 'title'>): Task => {
    const now = new Date().toISOString();
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'todo',
      checklist: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      ...partial
    } as Task;
    const updated = [...tasks, task];
    setTasks(updated);
    syncSave('nura_tasks', StorageService.saveTasks, updated);
    return task;
  };
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    setTasks(updated);
    await syncSave('nura_tasks', StorageService.saveTasks, updated);
  };
  const deleteTask = async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await syncSave('nura_tasks', StorageService.saveTasks, updated);
  };
  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    await updateTask(id, { status: newStatus });
  };
  const toggleTaskChecklist = async (taskId: string, checklistItemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedChecklist = task.checklist.map(chk =>
      chk.id === checklistItemId ? { ...chk, completed: !chk.completed } : chk
    );
    await updateTask(taskId, { checklist: updatedChecklist });
  };
  const addTaskComment = async (taskId: string, comment: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newComment = {
      id: `comment_${Date.now()}`,
      author: user.name,
      authorEmail: user.email,
      content: comment,
      createdAt: new Date().toISOString()
    };
    await updateTask(taskId, { comments: [...task.comments, newComment] });
  };

  // ---- Meeting helpers ----
  const addMeeting = (partial: Partial<Meeting> & Pick<Meeting, 'title'>): Meeting => {
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: [],
      tags: [],
      status: 'scheduled',
      agenda: '',
      notes: [],
      decisions: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
      ...partial
    } as Meeting;
    const updated = [...meetings, meeting];
    setMeetings(updated);
    syncSave('nura_meetings', StorageService.saveMeetings, updated);
    return meeting;
  };
  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    const updated = meetings.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
    setMeetings(updated);
    await syncSave('nura_meetings', StorageService.saveMeetings, updated);
  };
  const deleteMeeting = async (id: string) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    await syncSave('nura_meetings', StorageService.saveMeetings, updated);
  };
  const updateMeetingMiniAta = async (id: string, miniAta: string) => {
    await updateMeeting(id, { miniAta });
  };
  const addAttachmentToMeeting = async (meetingId: string, partial: Pick<NonNullable<Meeting['attachments']>[0], 'name' | 'type' | 'size'> & { url?: string }) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const attachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...partial
    };
    const updatedAttachments = [...(meeting.attachments || []), attachment];
    await updateMeeting(meetingId, { attachments: updatedAttachments });
  };
  const removeAttachmentFromMeeting = async (meetingId: string, attachmentId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const updatedAttachments = (meeting.attachments || []).filter(att => att.id !== attachmentId);
    await updateMeeting(meetingId, { attachments: updatedAttachments });
  };
  const addNoteToMeeting = async (meetingId: string, partial: Partial<Note> & Pick<Note, 'title' | 'type' | 'content'>) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const now = new Date().toISOString();
    const note: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tags: [],
      privacy: 'private',
      createdAt: now,
      updatedAt: now,
      ...partial
    } as Note;
    const updatedNotes = [...(meeting.notes || []), note];
    await updateMeeting(meetingId, { notes: updatedNotes });
  };
  const addMeetingDecision = async (meetingId: string, decision: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const newDecision = { id: `decision_${Date.now()}`, text: decision, createdAt: new Date().toISOString() };
    const updatedDecisions = [...(meeting.decisions || []), newDecision];
    await updateMeeting(meetingId, { decisions: updatedDecisions });
  };

  // Meeting mode
  const startMeetingMode = (meetingId: string) => {
    setActiveMeetingId(meetingId);
    setCurrentView('meeting_mode');
  };
  const endMeetingMode = () => {
    setActiveMeetingId(null);
    setCurrentView('today');
  };
  const finishMeetingMode = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      await updateMeeting(meetingId, { status: 'completed' });
    }
    endMeetingMode();
  };

  // ---- Note helpers ----
  const addNote = (partial: Partial<Note> & Pick<Note, 'title' | 'type' | 'content'>): Note => {
    const now = new Date().toISOString();
    const note: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tags: [],
      privacy: 'private',
      createdAt: now,
      updatedAt: now,
      ...partial
    } as Note;
    const updated = [...notes, note];
    setNotes(updated);
    syncSave('nura_notes', StorageService.saveNotes, updated);
    return note;
  };
  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    await syncSave('nura_notes', StorageService.saveNotes, updated);
  };
  const deleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await syncSave('nura_notes', StorageService.saveNotes, updated);
  };

  // ---- Tag helpers ----
  const addTag = (partial: Partial<Tag> & Pick<Tag, 'name'>): Tag => {
    const tag: Tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      color: '#6366f1',
      createTime: new Date().toISOString(),
      ...partial
    } as Tag;
    const updated = [...tags, tag];
    setTags(updated);
    syncSave('nura_tags', StorageService.saveTags, updated);
    return tag;
  };
  const updateTag = async (id: string, updates: Partial<Tag>) => {
    const updated = tags.map(t => t.id === id ? { ...t, ...updates } : t);
    setTags(updated);
    await syncSave('nura_tags', StorageService.saveTags, updated);
  };
  const deleteTag = async (id: string) => {
    const updated = tags.filter(t => t.id !== id);
    setTags(updated);
    await syncSave('nura_tags', StorageService.saveTags, updated);
  };

  // ---- Project helpers ----
  const addProject = async (partial: Partial<Project> & Pick<Project, 'name'>) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lead: '',
      members: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      ...partial
    } as Project;
    const updated = [...projects, project];
    setProjects(updated);
    await syncSave('nura_projects', StorageService.saveProjects, updated);
  };
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    setProjects(updated);
    await syncSave('nura_projects', StorageService.saveProjects, updated);
  };
  const deleteProject = async (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    await syncSave('nura_projects', StorageService.saveProjects, updated);
  };

  // ---- Event helpers ----
  const addEvent = (partial: Partial<CalendarEvent> & Pick<CalendarEvent, 'title' | 'startDate' | 'startTime'>): CalendarEvent => {
    const event: CalendarEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      calendarId: '',
      participants: [],
      tags: [],
      ...partial
    } as CalendarEvent;
    const updated = [...events, event];
    setEvents(updated);
    syncSave('nura_events', StorageService.saveEvents, updated);
    return event;
  };
  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
    setEvents(updated);
    await syncSave('nura_events', StorageService.saveEvents, updated);
  };
  const deleteEvent = async (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    await syncSave('nura_events', StorageService.saveEvents, updated);
  };

  // ---- Email helpers ----
  const addEmail = async (email: EmailReference) => {
    const updated = [email, ...emails];
    setEmails(updated);
    await syncSave('nura_emails', StorageService.saveEmails, updated);
  };
  const deleteEmail = async (id: string) => {
    const updated = emails.filter(e => e.id !== id);
    setEmails(updated);
    await syncSave('nura_emails', StorageService.saveEmails, updated);
  };

  // ---- Drive file helpers ----
  const addDriveFile = async (file: DriveReference) => {
    const updated = [file, ...driveFiles];
    setDriveFiles(updated);
    await syncSave('nura_drive', StorageService.saveDriveFiles, updated);
  };
  const updateDriveFile = async (id: string, updates: Partial<DriveReference>) => {
    const updated = driveFiles.map(f => f.id === id ? { ...f, ...updates } : f);
    setDriveFiles(updated);
    await syncSave('nura_drive', StorageService.saveDriveFiles, updated);
  };
  const deleteDriveFile = async (id: string) => {
    const updated = driveFiles.filter(f => f.id !== id);
    setDriveFiles(updated);
    await syncSave('nura_drive', StorageService.saveDriveFiles, updated);
  };

  // ---- Useful link helpers ----
  const addUsefulLink = async (partial: Partial<UsefulLink> & Pick<UsefulLink, 'title' | 'address' | 'location' | 'icon' | 'color' | 'category'>) => {
    const now = new Date().toISOString();
    const link: UsefulLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      ...partial
    } as UsefulLink;
    const updated = [...usefulLinks, link];
    setUsefulLinks(updated);
    await syncSave('nura_useful_links', StorageService.saveUsefulLinks, updated);
  };
  const updateUsefulLink = async (id: string, updates: Partial<UsefulLink>) => {
    const updated = usefulLinks.map(l => l.id === id ? { ...l, ...updates } : l);
    setUsefulLinks(updated);
    await syncSave('nura_useful_links', StorageService.saveUsefulLinks, updated);
  };
  const deleteUsefulLink = async (id: string) => {
    const updated = usefulLinks.filter(l => l.id !== id);
    setUsefulLinks(updated);
    await syncSave('nura_useful_links', StorageService.saveUsefulLinks, updated);
  };

  // ---- Inbox helpers ----
  const addInboxItem = (partial: Partial<InboxItem> & Pick<InboxItem, 'type' | 'content'>): InboxItem => {
    const now = new Date().toISOString();
    const item: InboxItem = {
      id: `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tags: [],
      createdAt: now,
      ...partial
    } as InboxItem;
    const updated = [item, ...inbox];
    setInbox(updated);
    syncSave('nura_inbox', StorageService.saveInbox, updated);
    return item;
  };
  const updateInboxItem = async (id: string, updates: Partial<InboxItem>) => {
    const updated = inbox.map(i => i.id === id ? { ...i, ...updates } : i);
    setInbox(updated);
    await syncSave('nura_inbox', StorageService.saveInbox, updated);
  };
  const deleteInboxItem = async (id: string) => {
    const updated = inbox.filter(i => i.id !== id);
    setInbox(updated);
    await syncSave('nura_inbox', StorageService.saveInbox, updated);
  };

  // ---- Notification helpers ----
  const addNotification = async (notif: NotificationItem) => {
    const updated = [notif, ...notifications];
    setNotifications(updated);
    await syncSave('nura_notifications', StorageService.saveNotifications, updated);
  };
  const updateNotification = async (id: string, updates: Partial<NotificationItem>) => {
    const updated = notifications.map(n => n.id === id ? { ...n, ...updates } : n);
    setNotifications(updated);
    await syncSave('nura_notifications', StorageService.saveNotifications, updated);
  };

  // ---- Chat message helpers ----
  const addChatMessage = (partial: Partial<AIChatMessage> & Pick<AIChatMessage, 'role' | 'content'>): AIChatMessage => {
    const message: AIChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...partial
    } as AIChatMessage;
    const updated = [message, ...chatMessages];
    setChatMessages(updated);
    StorageService.saveChatMessages(updated);
    return message;
  };

  // ---- Activity log helpers ----
  const addActivityLog = async (log: ActivityLog) => {
    const updated = [log, ...activityLogs];
    setActivityLogs(updated);
    await syncSave('nura_activity', StorageService.saveActivityLogs, updated);
  };

  // ---- Sync from server ----
  const syncFromServer = async () => {
    await SyncService.syncAll();
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
    user, setUser, updateUser, resetDatabase,
    projects, setProjects: async (p) => { await syncSave('nura_projects', StorageService.saveProjects, p); },
    tags, setTags: async (t) => { await syncSave('nura_tags', StorageService.saveTags, t); },
    meetings, setMeetings: async (m) => { await syncSave('nura_meetings', StorageService.saveMeetings, m); },
    events, setEvents: async (e) => { await syncSave('nura_events', StorageService.saveEvents, e); },
    tasks, setTasks: async (t) => { await syncSave('nura_tasks', StorageService.saveTasks, t); },
    notes, setNotes: async (n) => { await syncSave('nura_notes', StorageService.saveNotes, n); },
    emails, setEmails: async (e) => { await syncSave('nura_emails', StorageService.saveEmails, e); },
    driveFiles, setDriveFiles: async (f) => { await syncSave('nura_drive', StorageService.saveDriveFiles, f); },
    usefulLinks, setUsefulLinks: async (l) => { await syncSave('nura_useful_links', StorageService.saveUsefulLinks, l); },
    inbox, setInbox: async (i) => { await syncSave('nura_inbox', StorageService.saveInbox, i); },
    activityLogs, setActivityLogs: async (a) => { await syncSave('nura_activity', StorageService.saveActivityLogs, a); },
    notifications, setNotifications: async (n) => { await syncSave('nura_notifications', StorageService.saveNotifications, n); },
    chatMessages, setChatMessages,
    quickSummary: quickSummaryState, setQuickSummary: (s) => { setQuickSummaryState(s); StorageService.saveQuickSummary(s); },
    passwords, setPasswords: (p) => { setPasswords(p); StorageService.savePasswords(p); },
    currentView, setCurrentView,
    theme, setTheme,
    pomodoro, setPomodoro,
    // Modal states
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    isQuickCaptureOpen, setIsQuickCaptureOpen,
    assistantDraft, setAssistantDraft,
    // Meeting mode
    activeMeetingId, startMeetingMode, endMeetingMode, finishMeetingMode,
    // Selected items
    selectedMeetingId, setSelectedMeetingId,
    selectedTaskId, setSelectedTaskId,
    selectedProjectId, setSelectedProjectId,
    // Weather
    weatherLocation, setWeatherLocation,
    // Notifications
    markNotificationRead: (id: string) => setNotifications(n => n.map(nf => nf.id === id ? { ...nf, read: true } : nf)),
    clearAllNotifications: () => setNotifications(n => n.map(nf => ({ ...nf, read: true }))),
    // Sidebar
    sidebarCollapsed, setSidebarCollapsed,
    // CRUD helpers
    addTask, updateTask, deleteTask, toggleTaskStatus, toggleTaskChecklist, addTaskComment,
    addMeeting, updateMeeting, deleteMeeting,
    updateMeetingMiniAta, addAttachmentToMeeting, removeAttachmentFromMeeting,
    addNoteToMeeting, addMeetingDecision,
    addNote, updateNote, deleteNote,
    addTag, updateTag, deleteTag,
    addProject, updateProject, deleteProject,
    addEvent, updateEvent, deleteEvent,
    addEmail, deleteEmail,
    addDriveFile, updateDriveFile, deleteDriveFile,
    addUsefulLink, updateUsefulLink, deleteUsefulLink,
    addInboxItem, updateInboxItem, deleteInboxItem,
    addNotification, updateNotification,
    addChatMessage,
    addActivityLog,
    processInboxItem: async (id: string) => {
      const updated = inbox.filter(i => i.id !== id);
      setInbox(updated);
      await syncSave('nura_inbox', StorageService.saveInbox, updated);
    },
    setTaskStatus: async (taskId: string, status: Task['status']) => {
      await updateTask(taskId, { status });
    },
    toggleUsefulLinkFavorite: async (id: string) => {
      const link = usefulLinks.find(l => l.id === id);
      if (!link) return;
      await updateUsefulLink(id, { isFavorite: !link.isFavorite });
    },
    saveDriveFiles: async (files: DriveReference[]) => {
      setDriveFiles(files);
      await syncSave('nura_drive', StorageService.saveDriveFiles, files);
    },
    syncFromServer, saveWithServer
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
