export type ThemeMode = 'light' | 'dark' | 'auto';

export type ViewType =
  | 'today'
  | 'agenda'
  | 'meetings'
  | 'notes'
  | 'tasks'
  | 'projects'
  | 'inbox'
  | 'files'
  | 'useful_links'
  | 'email'
  | 'chat'
  | 'assistant'
  | 'pomodoro'
  | 'timeline'
  | 'settings'
  | 'meeting_mode'
  | 'passwords';

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  focusMinutes: number;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  durationMs: number;
  remainingMs: number;
  isRunning: boolean;
  sessionsCompletedToday: number;
  sessions: PomodoroSession[];
  totalFocusMinutesToday: number;
  settings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
    soundEnabled: boolean;
  };
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type NoteType = 'text' | 'drawing' | 'audio' | 'checklist';

export type NotePrivacy = 'private' | 'shared' | 'team';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  logoUrl?: string; // URL da logo configurada pelo usuário
  themePreference: ThemeMode;
  sidebarCollapsed: boolean;
  activeCalendarIds: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string; // hex code
  isFavorite?: boolean;
}

export interface Participant {
  name: string;
  email: string;
  avatar?: string;
  status: 'accepted' | 'pending' | 'declined';
  role?: string;
}

export interface DrawingStroke {
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  size: number;
  tool: 'pen' | 'highlighter' | 'eraser';
}

export interface DrawingNoteData {
  strokes: DrawingStroke[];
  previewUrl?: string;
  background: 'blank' | 'grid' | 'ruled';
}

export interface AudioNoteData {
  audioUrl?: string;
  durationSeconds: number;
  waveform?: number[];
  transcript?: string;
  keyTopics?: string[];
  suggestedActionItems?: string[];
  decisions?: string[];
}

export interface Note {
  id: string;
  title: string;
  type: NoteType;
  content: string; // rich text or markdown
  drawingData?: DrawingNoteData;
  audioData?: AudioNoteData;
  checklist?: { id: string; text: string; completed: boolean }[];
  tags: string[];
  projectId?: string;
  meetingId?: string;
  privacy: NotePrivacy;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeEmail?: string;
  assigneeAvatar?: string;
  dueDate: string; // YYYY-MM-DD
  projectId?: string;
  tags: string[];
  checklist: TaskChecklistItem[];
  originType: 'manual' | 'meeting' | 'email' | 'note' | 'inbox' | 'ai_suggested';
  originId?: string;
  originTitle?: string;
  meetingId?: string;
  waitingFor?: {
    person: string;
    personEmail?: string;
    sinceDate: string;
    daysWaiting: number;
    reason?: string;
  };
  comments: TaskComment[];
  attachmentsCount?: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  lead: string;
  members: { name: string; email: string; role: string }[];
  tags: string[];
  milestones: ProjectMilestone[];
  progress?: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;
  endTime: string;
  location?: string;
  meetUrl?: string;
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  participants: Participant[];
  tags: string[];
  meetingId?: string; // Linked NuRa Meeting
}

export interface MeetingDecision {
  id: string;
  text: string;
  createdAt: string;
  approvedBy?: string;
}

export interface Meeting {
  id: string;
  eventId?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location?: string;
  meetUrl?: string;
  agenda: string;
  participants: Participant[];
  tags: string[];
  projectId?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  liveNotes?: string;
  drawingNotes?: DrawingNoteData;
  audioNotes?: AudioNoteData;
  audioRecordings?: AudioNoteData[];

  // Previous meeting link for recurrence
  previousMeetingId?: string;
  previousPendingTasksCount?: number;
  previousSummary?: string;

  // Recurrence settings
  recurrenceRule?: 'none' | 'daily' | 'weekly' | 'monthly';

  // Real-time & Recorded Notes
  miniAta?: string;
  notes: Note[];
  decisions: MeetingDecision[];
  aiSummary?: {
    summary: string;
    decisions: string[];
    pendingQuestions: string[];
    keyTopics: string[];
    generatedAt: string;
  };
  summary?: {
    executiveSummary: string;
    keyTopics: string[];
    decisions: string[];
    actionItems: Array<{
      task?: string;
      title?: string;
      assignee: string;
      dueDate: string;
      priority: TaskPriority;
    }>;
    nextSteps?: string;
  };
  suggestedTasks?: {
    id: string;
    title: string;
    priority: TaskPriority;
    assignee: string;
    dueDate: string;
    converted?: boolean;
  }[];
  attachments: {
    id: string;
    name: string;
    type: string;
    size: string;
    url?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailReference {
  id: string;
  subject: string;
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  date: string;
  snippet: string;
  body: string;
  tags: string[];
  projectId?: string;
  meetingId?: string;
  taskId?: string;
  hasAttachment?: boolean;
}

export interface DriveReference {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'video' | 'audio' | 'other';
  size: string;
  url: string;
  lastModified: string;
  projectId?: string;
  meetingId?: string;
  tags: string[];
}

export type UsefulLinkLocation = 'web' | 'local';

export type UsefulLinkIcon =
  | 'globe'
  | 'folder'
  | 'hard-drive'
  | 'app'
  | 'chart'
  | 'mail'
  | 'users'
  | 'database'
  | 'document'
  | 'settings';

export interface UsefulLink {
  id: string;
  title: string;
  description?: string;
  address: string;
  location: UsefulLinkLocation;
  icon: UsefulLinkIcon;
  color: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailItem {
  id: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  body: string;
  snippet: string;
  tags: string[];
  isRead: boolean;
  isStarred: boolean;
  projectId?: string;
  meetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeEmail?: string;
  dueDate: string; // YYYY-MM-DD
  projectId?: string;
  tags: string[];
  checklist: TaskChecklistItem[];
  originType: 'manual' | 'meeting' | 'email' | 'note' | 'inbox' | 'ai_suggested';
  originId?: string;
  originTitle?: string;
  meetingId?: string;
  waitingFor?: {
    person: string;
    personEmail?: string;
    sinceDate: string;
    daysWaiting: number;
    reason?: string;
  };
  comments: TaskComment[];
  attachmentsCount?: number;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'task' | 'meeting' | 'note' | 'project' | 'milestone' | 'deadline';
  projectId?: string;
  meetingId?: string;
  tags: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordItem {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  id: string;
  type: 'text' | 'voice' | 'idea' | 'task_raw' | 'file';
  content: string;
  audioUrl?: string;
  fileName?: string;
  fileSize?: string;
  tags: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  entityType: 'task' | 'meeting' | 'note' | 'project' | 'inbox' | 'tag';
  entityId: string;
  entityTitle: string;
  timestamp: string;
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  agendaStructure: string;
  defaultTags: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'meeting_soon' | 'task_overdue' | 'waiting_followup' | 'ai_insight';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionView?: ViewType;
  actionId?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

// Google Chat Types
export interface ChatSpace {
  id: string;
  name: string;
  displayName: string;
  type: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  spaceThreadingState?: 'GROUPED_MESSAGES' | 'UNTHREADED_MESSAGES';
  createTime: string;
}

export interface GoogleChatMessage {
  id: string;
  spaceId: string;
  sender: {
    name: string;
    displayName: string;
    avatarUrl?: string;
    type: 'HUMAN' | 'BOT';
  };
  text?: string;
  formattedText?: string;
  createTime: string;
  updateTime?: string;
  thread?: {
    name: string;
    threadKey?: string;
  };
  cards?: any[];
}

// Alias for backward compatibility
export type ChatMessage = GoogleChatMessage;
