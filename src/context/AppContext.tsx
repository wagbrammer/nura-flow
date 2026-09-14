import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  PomodoroState,
  PomodoroSession,
  PomodoroPhase,
  ActivityLog,
  NotificationItem,
  AIChatMessage,
  ThemeMode,
  ViewType,
  TaskStatus,
  TaskPriority,
  UsefulLink,
  PasswordItem
} from '../types';
import { StorageService } from '../lib/storage';
import { SyncStorageService } from '../lib/sync-storage';
import { CURRENT_USER } from '../lib/constants';
import { scheduleNotification, cancelNotification } from '../lib/notifier';

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true
};

function getDurationMsForPomodoroPhase(phase: PomodoroPhase): number {
  const mins: Record<PomodoroPhase, number> = {
    focus: DEFAULT_SETTINGS.focusDuration,
    short_break: DEFAULT_SETTINGS.shortBreakDuration,
    long_break: DEFAULT_SETTINGS.longBreakDuration
  };
  return mins[phase] * 60 * 1000;
}

function buildInitialPomodoro(): PomodoroState {
  const dur = DEFAULT_SETTINGS.focusDuration;
  return {
    phase: 'focus',
    durationMs: dur * 60 * 1000,
    remainingMs: dur * 60 * 1000,
    isRunning: false,
    sessionsCompletedToday: 0,
    sessions: [],
    totalFocusMinutesToday: 0,
    settings: DEFAULT_SETTINGS
  };
}

interface AppContextType {
  // Navigation & Theme
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  user: User;
  updateUser: (user: Partial<User>) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Active Modals & Focus
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (open: boolean) => void;
  activeMeetingId: string | null;
  setActiveMeetingId: (id: string | null) => void;
  selectedMeetingId: string | null;
  setSelectedMeetingId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;

  // State Entities
  projects: Project[];
  tags: Tag[];
  meetings: Meeting[];
  events: CalendarEvent[];
  tasks: Task[];
  notes: Note[];
  emails: EmailReference[];
  driveFiles: DriveReference[];
  usefulLinks: UsefulLink[];
  inbox: InboxItem[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  chatMessages: AIChatMessage[];
  quickSummary: string;
  setQuickSummary: (summary: string) => void;
  assistantDraft: string;
  setAssistantDraft: (draft: string) => void;
  pomodoro: PomodoroState;
  setPomodoro: (updater: (prev: PomodoroState) => PomodoroState) => void;
  // Weather Location
  weatherLocation: { latitude: number, longitude: number, cityName?: string };
  setWeatherLocation: (id: string) => void;

  // Task Actions
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskStatus: (id: string) => void;
  toggleTaskChecklist: (taskId: string, checklistId: string) => void;
  addTaskComment: (taskId: string, comment: string) => void;

  // Meeting Actions
  addMeeting: (meeting: Partial<Meeting>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  startMeetingMode: (meetingId: string) => void;
  endMeetingMode: () => void;
  finishMeetingMode: (meetingId: string, aiSummary?: any) => void;
  addMeetingDecision: (meetingId: string, text: string) => void;
  addNoteToMeeting: (meetingId: string, note: Partial<Note>) => Note;
  updateMeetingMiniAta: (meetingId: string, miniAta: string) => void;
  addAttachmentToMeeting: (meetingId: string, attachment: { name: string; type: string; size: string; url?: string }) => void;
  removeAttachmentFromMeeting: (meetingId: string, attachmentId: string) => void;

  // Note Actions
  addNote: (note: Partial<Note>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  convertNoteToTask: (noteId: string, customTitle?: string, priority?: TaskPriority) => Task;

  // Project Actions
  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;

  // Tag Actions
  addTag: (tag: Partial<Tag>) => Tag;
  deleteTag: (id: string) => void;

  // Inbox Actions
  addInboxItem: (item: Partial<InboxItem>) => InboxItem;
  deleteInboxItem: (id: string) => void;
  convertInboxToTask: (inboxId: string, priority?: TaskPriority) => Task;
  convertInboxToNote: (inboxId: string) => Note;
  processInboxItem: (inboxId: string) => void;

  // Assistant Actions
  addChatMessage: (message: Pick<AIChatMessage, 'role' | 'content'>) => AIChatMessage;

  // Email Actions
  convertEmailToTask: (emailId: string) => Task;

  // Useful Links Actions
  addUsefulLink: (link: Omit<UsefulLink, 'id' | 'createdAt' | 'updatedAt'>) => UsefulLink;
  updateUsefulLink: (id: string, updates: Partial<UsefulLink>) => void;
  deleteUsefulLink: (id: string) => void;
  toggleUsefulLinkFavorite: (id: string) => void;

  // Password Management Actions
  passwords: PasswordItem[];
  addPassword: (item: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>) => PasswordItem;
  updatePassword: (id: string, updates: Partial<PasswordItem>) => void;
  deletePassword: (id: string) => void;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // System & Reset
  resetDatabase: () => void;
  logActivity: (action: string, details: string, entityType: ActivityLog['entityType'], entityId: string, entityTitle: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Ensure seed data exists before the state initializers read browser storage.
  StorageService.initializeIfNeeded();

  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = StorageService.getUser();
      return savedUser.themePreference || 'auto';
    }
    return 'auto';
  });

  const [user, setUser] = useState<User>(() => StorageService.getUser());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => user.sidebarCollapsed || false);
  const [passwords, setPasswords] = useState<PasswordItem[]>([]);
  // Weather locations management
  const [weatherLocations, setWeatherLocations] = useState<Array<{id: string; latitude: number; longitude: number; cityName: string}>>([]);
  const [selectedWeatherLocationId, setSelectedWeatherLocationId] = useState<string | null>(null);

  // Buscar senhas do servidor e sincronizar com o usuário
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/settings/logo')
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl) {
          const updatedUser = { ...user, logoUrl: data.logoUrl };
          setUser(updatedUser);
          StorageService.saveUser(updatedUser);
        }
      })
      .catch(err => console.error('Erro ao carregar logo do servidor:', err));
  }, []);

  // Buscar lista de localizações do weather do servidor e sincronizar com o contexto
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/settings/weather-locations')
      .then(res => res.json())
      .then(data => {
        if (data.locations && Array.isArray(data.locations)) {
          const validLocations = data.locations.filter((loc: any) =>
            typeof loc.latitude === 'number' &&
            typeof loc.longitude === 'number' &&
            typeof loc.cityName === 'string' &&
            loc.latitude >= -90 && loc.latitude <= 90 &&
            loc.longitude >= -180 && loc.longitude <= 180
          );
          if (validLocations.length > 0) {
            setWeatherLocations(validLocations);
            // Selecionar a primeira como padrão se nenhuma estiver selecionada
            if (!selectedWeatherLocationId && validLocations.length > 0) {
              setSelectedWeatherLocationId(validLocations[0].id);
            }
            // Atualizar localStorage com a seleção atual
            localStorage.setItem('nura_weather_locations', JSON.stringify({
              locations: validLocations,
              selectedId: selectedWeatherLocationId || validLocations[0].id
            }));
          } else {
            // Fallback para padrão
            const defaultLoc = { id: 'default_1', latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
            setWeatherLocations([defaultLoc]);
            setSelectedWeatherLocationId(defaultLoc.id);
            localStorage.setItem('nura_weather_locations', JSON.stringify({
              locations: [defaultLoc],
              selectedId: defaultLoc.id
            }));
          }
        } else {
          // Fallback para padrão
          const defaultLoc = { id: 'default_1', latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
          setWeatherLocations([defaultLoc]);
          setSelectedWeatherLocationId(defaultLoc.id);
          localStorage.setItem('nura_weather_locations', JSON.stringify({
            locations: [defaultLoc],
            selectedId: defaultLoc.id
          }));
        }
      })
      .catch(err => {
        console.error('Erro ao carregar lista de localizações do weather do servidor:', err);
        // Fallback para padrão
        const defaultLoc = { id: 'default_1', latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
        setWeatherLocations([defaultLoc]);
        setSelectedWeatherLocationId(defaultLoc.id);
        localStorage.setItem('nura_weather_locations', JSON.stringify({
          locations: [defaultLoc],
          selectedId: defaultLoc.id
        }));
      });
  }, []);

// Função para obter a localização atualmente selecionada
  const getSelectedWeatherLocation = React.useCallback(() => {
    if (!selectedWeatherLocationId || weatherLocations.length === 0) return null;
    return weatherLocations.find(loc => loc.id === selectedWeatherLocationId) || null;
  }, [selectedWeatherLocationId, weatherLocations]);

  // Sincronizar seleção com localStorage sempre que mudar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nura_weather_locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.locations) && typeof parsed.selectedId === 'string') {
          // Apenas atualizar o selectedId se as locations forem as mesmas (ou aceitar novas)
          setSelectedWeatherLocationId(parsed.selectedId);
          // Atualizar locations se necessário (mescla)
          // Por simplicidade, atualizamos as locations também
          setWeatherLocations(parsed.locations);
        }
      } catch {}
    }
  }, []); // Run once on mount to load from localStorage

  // Salvar seleção no localStorage quando mudar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('nura_weather_locations', JSON.stringify({
      locations: weatherLocations,
      selectedId: selectedWeatherLocationId
    }));
  }, [weatherLocations, selectedWeatherLocationId]);

  // Função para selecionar uma localização por ID
  const setSelectedWeatherLocation = (id: string) => {
    setSelectedWeatherLocationId(id);
  };
  // Alias for compatibility
  const setWeatherLocation = setSelectedWeatherLocation;

  // Função para obter a localização atualmente selecionada (compatibilidade com TodayView)
  const weatherLocation = getSelectedWeatherLocation();

  // Função para adicionar nova localização
  const addWeatherLocation = async (latitude: number, longitude: number, cityName: string) => {
    try {
      const response = await fetch('/api/settings/weather-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, cityName })
      });
      const data = await response.json();
      if (data.success) {
        setWeatherLocations(prev => [...prev, data.location]);
        // Selecionar a nova localização por padrão
        setSelectedWeatherLocationId(data.location.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao adicionar localização do weather:', error);
      return false;
    }
  };

  // Função para atualizar localização existente
  const updateWeatherLocation = async (id: string, latitude: number, longitude: number, cityName: string) => {
    try {
      const response = await fetch(`/api/settings/weather-locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, cityName })
      });
      const data = await response.json();
      if (data.success) {
        setWeatherLocations(prev => prev.map(loc => loc.id === id ? data.location : loc));
        // Se estiver editando a localização atualmente selecionada, mantê-la selecionada
        if (selectedWeatherLocationId === id) {
          // Mantém a seleção
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar localização do weather:', error);
      return false;
    }
  };

  // Função para excluir localização
  const deleteWeatherLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/settings/weather-locations/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setWeatherLocations(prev => prev.filter(loc => loc.id !== id));
        // Se a localização excluída era a selecionada, selecionar a primeira disponível
        if (selectedWeatherLocationId === id) {
          const newSelected = weatherLocations.filter(loc => loc.id !== id)[0];
          setSelectedWeatherLocationId(newSelected ? newSelected.id : null);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao excluir localização do weather:', error);
      return false;
    }
  };

  // Função para definir localização como padrão (mover para primeira posição)
  const setWeatherLocationAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/settings/weather-locations/${id}/set-default`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        // Reordenar lista: mover o item selecionado para o início
        setWeatherLocations(prev => {
          const item = prev.find(loc => loc.id === id);
          if (!item) return prev;
          const others = prev.filter(loc => loc.id !== id);
          return [item, ...others];
        });
        // Garantir que este item esteja selecionado
        setSelectedWeatherLocationId(id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao definir localização padrão:', error);
      return false;
    }
  };

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
  const [assistantDraft, setAssistantDraft] = useState('');
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => {
    if (typeof window === 'undefined') return buildInitialPomodoro();
    const raw = localStorage.getItem('nura_pomodoro');
    if (!raw) return buildInitialPomodoro();
    try {
      const parsed = JSON.parse(raw);
      return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) } } as PomodoroState;
    } catch {
      return buildInitialPomodoro();
    }
  });

  useEffect(() => {
    localStorage.setItem('nura_pomodoro', JSON.stringify(pomodoro));
  }, [pomodoro]);

  // Timer do Pomodoro - funciona independentemente da página
  const startTimeRef = React.useRef<number | null>(null);
  const savedRemainingMsRef = React.useRef<number>(0);
  const notificationTimerRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  const pomodoroRef = React.useRef(pomodoro);

  // Keep ref in sync with current pomodoro state
  React.useEffect(() => {
    pomodoroRef.current = pomodoro;
  }, [pomodoro]);

  // Efeito para atualizar o timer baseado no timestamp
  React.useEffect(() => {
    if (!pomodoro.isRunning || pomodoro.remainingMs <= 0) {
      startTimeRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Se não tem startTime registrado, registra agora
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      savedRemainingMsRef.current = pomodoro.remainingMs;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const tick = () => {
      const current = pomodoroRef.current;
      if (!current.isRunning) return;

      const elapsed = Date.now() - startTimeRef.current!;
      const newRemaining = Math.max(0, savedRemainingMsRef.current - elapsed);

      if (newRemaining <= 0) {
        // Timer finished - dispatch complete action
        setPomodoro(prev => ({
          ...prev,
          remainingMs: 0,
          isRunning: false,
          sessionsCompletedToday: prev.sessionsCompletedToday + 1,
          totalFocusMinutesToday: prev.totalFocusMinutesToday + (prev.phase === 'focus' ? Math.round(prev.durationMs / 60000) : 0)
        }));
        startTimeRef.current = null;
        return;
      }

      setPomodoro(prev => ({ ...prev, remainingMs: newRemaining }));
    };

    // Execute immediately and then every 100ms
    tick();
    intervalRef.current = window.setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pomodoro.isRunning]); // Only depend on isRunning, not remainingMs

  // Notificação do timer - funciona independentemente da página
  React.useEffect(() => {
    // Limpar notificação anterior se existir
    if (notificationTimerRef.current) {
      cancelNotification(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }

    // Só agenda notificação se estiver rodando e com tempo restante
    if (pomodoro.isRunning && pomodoro.remainingMs > 0) {
      notificationTimerRef.current = scheduleNotification(pomodoro.remainingMs, {
        title: 'Pomodoro',
        body: pomodoro.phase === 'focus' ? 'Foco concluído! Hora da pausa.' : 'Pausa encerrada! Hora de focar novamente.',
        tag: 'pomodoro-timer',
      });
    }

    // Limpar notificação ao desmontar
    return () => {
      if (notificationTimerRef.current) {
        cancelNotification(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, [pomodoro.isRunning, pomodoro.remainingMs, pomodoro.phase]);

  // Modal / Selection states
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Apply Dark/Light theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // Auto: listen to system media query
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Global Keyboard Shortcuts (Ctrl+K for search, N for note, T for task, A for audio capture, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
        return;
      }

      // Ignore shortcuts when user is typing inside input, textarea or contenteditable
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      } else if (e.key === 'Escape') {
        setIsGlobalSearchOpen(false);
        setIsQuickCaptureOpen(false);
        setSelectedMeetingId(null);
        setSelectedTaskId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const updated = { ...user, themePreference: newTheme };
    setUser(updated);
    StorageService.saveUser(updated);
  };

  const updateUser = (updates: Partial<User>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    StorageService.saveUser(updated);
  };

  const logActivity = (
    action: string,
    details: string,
    entityType: ActivityLog['entityType'],
    entityId: string,
    entityTitle: string
  ) => {
    const now = new Date();
    const timeStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      action,
      details,
      entityType,
      entityId,
      entityTitle,
      timestamp: timeStr
    };
    const updated = [newLog, ...activityLogs].slice(0, 50);
    setActivityLogs(updated);
    StorageService.saveActivityLogs(updated);
  };

  // Task Handlers
  const addTask = (taskData: Partial<Task>): Task => {
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: taskData.title || 'Nova Tarefa',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee || user.name,
      assigneeEmail: taskData.assigneeEmail || user.email,
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      projectId: taskData.projectId,
      tags: taskData.tags || [],
      checklist: taskData.checklist || [],
      originType: taskData.originType || 'manual',
      originId: taskData.originId,
      originTitle: taskData.originTitle,
      meetingId: taskData.meetingId,
      waitingFor: taskData.waitingFor,
      comments: taskData.comments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    StorageService.saveTasks(updated);
    logActivity('Tarefa Criada', `Criada tarefa "${newTask.title}"`, 'task', newTask.id, newTask.title);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const item = { ...t, ...updates, updatedAt: new Date().toISOString() };
        if (updates.status === 'done' && t.status !== 'done') {
          item.completedAt = new Date().toISOString();
        }
        return item;
      }
      return t;
    });
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    StorageService.saveTasks(updated);
    if (taskToDelete) {
      logActivity('Tarefa Excluída', `Excluída tarefa "${taskToDelete.title}"`, 'task', id, taskToDelete.title);
    }
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const statusNames: Record<TaskStatus, string> = {
      todo: 'A Fazer',
      in_progress: 'Em Andamento',
      waiting: 'Aguardando',
      done: 'Concluído'
    };
    updateTask(id, { status });
    logActivity('Status de Tarefa', `Tarefa "${task.title}" marcada como ${statusNames[status]}`, 'task', id, task.title);
  };

  const toggleTaskStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  };

  const toggleTaskChecklist = (taskId: string, checklistId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedChecklist = task.checklist.map(item =>
      item.id === checklistId ? { ...item, completed: !item.completed } : item
    );
    updateTask(taskId, { checklist: updatedChecklist });
  };

  const addTaskComment = (taskId: string, commentText: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newComment = {
      id: `comm_${Date.now()}`,
      author: user.name,
      authorEmail: user.email,
      content: commentText,
      createdAt: new Date().toISOString()
    };
    updateTask(taskId, { comments: [...task.comments, newComment] });
    logActivity('Comentário Adicionado', `Novo comentário na tarefa "${task.title}"`, 'task', taskId, task.title);
  };

  // Meeting Handlers
  const addMeeting = (meetingData: Partial<Meeting>): Meeting => {
    const newMeeting: Meeting = {
      id: `meet_${Date.now()}`,
      title: meetingData.title || 'Nova Reunião',
      date: meetingData.date || new Date().toISOString().split('T')[0],
      startTime: meetingData.startTime || '10:00',
      endTime: meetingData.endTime || '11:00',
      location: meetingData.location || 'Google Meet',
      meetUrl: meetingData.meetUrl || 'https://meet.google.com/new',
      agenda: meetingData.agenda || '',
      participants: meetingData.participants || [{ name: user.name, email: user.email, status: 'accepted' }],
      tags: meetingData.tags || [],
      projectId: meetingData.projectId,
      status: 'scheduled',
      notes: meetingData.notes || [],
      decisions: meetingData.decisions || [],
      attachments: meetingData.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    StorageService.saveMeetings(updated);

    // Also create corresponding CalendarEvent
    const newEvent: CalendarEvent = {
      id: `evt_${newMeeting.id}`,
      calendarId: 'cal_nura_main',
      title: newMeeting.title,
      description: newMeeting.agenda,
      startDate: newMeeting.date,
      startTime: newMeeting.startTime,
      endDate: newMeeting.date,
      endTime: newMeeting.endTime,
      location: newMeeting.location,
      meetUrl: newMeeting.meetUrl,
      participants: newMeeting.participants,
      tags: newMeeting.tags,
      meetingId: newMeeting.id
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    StorageService.saveEvents(updatedEvents);

    logActivity('Reunião Agendada', `Agendada reunião "${newMeeting.title}" para ${newMeeting.date} às ${newMeeting.startTime}`, 'meeting', newMeeting.id, newMeeting.title);
    return newMeeting;
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    const updated = meetings.map(m => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m));
    setMeetings(updated);
    StorageService.saveMeetings(updated);
  };

  const deleteMeeting = (id: string) => {
    const meet = meetings.find(m => m.id === id);
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    StorageService.saveMeetings(updated);
    if (meet) {
      logActivity('Reunião Cancelada', `Cancelada reunião "${meet.title}"`, 'meeting', id, meet.title);
    }
  };

  const startMeetingMode = (meetingId: string) => {
    setActiveMeetingId(meetingId);
    setCurrentView('meeting_mode');
    updateMeeting(meetingId, { status: 'in_progress' });
    const meet = meetings.find(m => m.id === meetingId);
    if (meet) {
      logActivity('Reunião Iniciada', `Modo Reunião ativo para "${meet.title}"`, 'meeting', meetingId, meet.title);
    }
  };

  const endMeetingMode = () => {
    setActiveMeetingId(null);
    setCurrentView('meetings');
  };

  const finishMeetingMode = (meetingId: string, aiSummaryData?: any) => {
    updateMeeting(meetingId, {
      status: 'completed',
      ...(aiSummaryData ? { aiSummary: aiSummaryData } : {})
    });
    setActiveMeetingId(null);
    setCurrentView('meetings');
    const meet = meetings.find(m => m.id === meetingId);
    if (meet) {
      logActivity('Reunião Finalizada', `Reunião "${meet.title}" concluída com sucesso`, 'meeting', meetingId, meet.title);
    }
  };

  const addMeetingDecision = (meetingId: string, text: string) => {
    const meet = meetings.find(m => m.id === meetingId);
    if (!meet) return;
    const newDecision = {
      id: `dec_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      approvedBy: user.name
    };
    updateMeeting(meetingId, { decisions: [...meet.decisions, newDecision] });
    logActivity('Decisão Registrada', `Decisão em "${meet.title}": "${text}"`, 'meeting', meetingId, meet.title);
  };

  const addNoteToMeeting = (meetingId: string, noteData: Partial<Note>): Note => {
    const meet = meetings.find(m => m.id === meetingId);
    const newNote = addNote({
      ...noteData,
      meetingId,
      projectId: meet?.projectId
    });
    if (meet) {
      updateMeeting(meetingId, { notes: [...meet.notes, newNote] });
    }
    return newNote;
  };

  const updateMeetingMiniAta = (meetingId: string, miniAta: string) => {
    updateMeeting(meetingId, { miniAta });
  };

  const addAttachmentToMeeting = (
    meetingId: string,
    attachment: { name: string; type: string; size: string; url?: string }
  ) => {
    const meet = meetings.find(m => m.id === meetingId);
    if (!meet) return;
    const newAtt = {
      id: `att_${Date.now()}`,
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      url: attachment.url || '#'
    };
    const updatedAttachments = [...meet.attachments, newAtt];
    updateMeeting(meetingId, { attachments: updatedAttachments });
    logActivity('Arquivo Anexado', `Anexado arquivo "${attachment.name}" à reunião "${meet.title}"`, 'meeting', meetingId, meet.title);
  };

  const removeAttachmentFromMeeting = (meetingId: string, attachmentId: string) => {
    const meet = meetings.find(m => m.id === meetingId);
    if (!meet) return;
    const attToRemove = meet.attachments.find(a => a.id === attachmentId);
    const updatedAttachments = meet.attachments.filter(a => a.id !== attachmentId);
    updateMeeting(meetingId, { attachments: updatedAttachments });
    if (attToRemove) {
      logActivity('Anexo Removido', `Removido arquivo "${attToRemove.name}" da reunião "${meet.title}"`, 'meeting', meetingId, meet.title);
    }
  };

  // Note Handlers
  const addNote = (noteData: Partial<Note>): Note => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: noteData.title || 'Nova Anotação',
      type: noteData.type || 'text',
      content: noteData.content || '',
      drawingData: noteData.drawingData,
      audioData: noteData.audioData,
      checklist: noteData.checklist,
      tags: noteData.tags || [],
      projectId: noteData.projectId,
      meetingId: noteData.meetingId,
      privacy: noteData.privacy || 'private',
      isFavorite: noteData.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    StorageService.saveNotes(updated);
    logActivity('Nota Criada', `Criada anotação "${newNote.title}" (${newNote.type})`, 'note', newNote.id, newNote.title);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
    setNotes(updated);
    StorageService.saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    StorageService.saveNotes(updated);
    if (note) {
      logActivity('Nota Excluída', `Excluída nota "${note.title}"`, 'note', id, note.title);
    }
  };

  const convertNoteToTask = (noteId: string, customTitle?: string, priority?: TaskPriority): Task => {
    const note = notes.find(n => n.id === noteId);
    const taskTitle = customTitle || note?.title || 'Tarefa a partir de Anotação';
    const newTask = addTask({
      title: taskTitle,
      description: note?.content?.substring(0, 300) || '',
      priority: priority || 'medium',
      projectId: note?.projectId,
      tags: note?.tags || [],
      originType: 'note',
      originId: noteId,
      originTitle: note?.title || 'Anotação'
    });
    return newTask;
  };

  // Project Handlers
  const addProject = (projectData: Partial<Project>): Project => {
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: projectData.name || 'Novo Projeto',
      description: projectData.description || '',
      color: projectData.color || '#15803d',
      lead: projectData.lead || user.name,
      members: projectData.members || [{ name: user.name, email: user.email, role: 'Líder' }],
      tags: projectData.tags || [],
      milestones: projectData.milestones || [],
      isFavorite: projectData.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...projects, newProj];
    setProjects(updated);
    StorageService.saveProjects(updated);
    logActivity('Projeto Criado', `Criado projeto "${newProj.name}"`, 'project', newProj.id, newProj.name);
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    setProjects(updated);
    StorageService.saveProjects(updated);
  };

  const deleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    StorageService.saveProjects(updated);
    if (proj) {
      logActivity('Projeto Excluído', `Excluído projeto "${proj.name}"`, 'project', id, proj.name);
    }
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updatedMilestones = proj.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    updateProject(projectId, { milestones: updatedMilestones });
  };

  // Tag Handlers
  const addTag = (tagData: Partial<Tag>): Tag => {
    const newTag: Tag = {
      id: `tag_${Date.now()}`,
      name: tagData.name || 'Nova Tag',
      color: tagData.color || '#15803d',
      isFavorite: tagData.isFavorite || false
    };
    const updated = [...tags, newTag];
    setTags(updated);
    StorageService.saveTags(updated);
    return newTag;
  };

  const deleteTag = (id: string) => {
    const updated = tags.filter(t => t.id !== id);
    setTags(updated);
    StorageService.saveTags(updated);
  };

  // Inbox Handlers
  const addInboxItem = (itemData: Partial<InboxItem>): InboxItem => {
    const newItem: InboxItem = {
      id: `inbox_${Date.now()}`,
      type: itemData.type || 'text',
      content: itemData.content || '',
      audioUrl: itemData.audioUrl,
      fileName: itemData.fileName,
      fileSize: itemData.fileSize,
      tags: itemData.tags || [],
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...inbox];
    setInbox(updated);
    StorageService.saveInbox(updated);
    logActivity('Item na Caixa de Entrada', `Captura rápida registrada na Inbox`, 'inbox', newItem.id, 'Inbox Item');
    return newItem;
  };

  const deleteInboxItem = (id: string) => {
    const updated = inbox.filter(i => i.id !== id);
    setInbox(updated);
    StorageService.saveInbox(updated);
  };

  const processInboxItem = (id: string) => {
    deleteInboxItem(id);
  };

  const convertInboxToTask = (inboxId: string, priority?: TaskPriority): Task => {
    const item = inbox.find(i => i.id === inboxId);
    const newTask = addTask({
      title: item?.content.slice(0, 80) || 'Tarefa da Inbox',
      description: item?.content || '',
      priority: priority || 'medium',
      originType: 'inbox',
      originId: inboxId,
      originTitle: 'Caixa de Entrada',
      tags: item?.tags || []
    });
    deleteInboxItem(inboxId);
    return newTask;
  };

  const convertInboxToNote = (inboxId: string): Note => {
    const item = inbox.find(i => i.id === inboxId);
    const newNote = addNote({
      title: item?.content.slice(0, 50) || 'Nota da Inbox',
      content: item?.content || '',
      type: item?.type === 'voice' ? 'audio' : 'text',
      tags: item?.tags || []
    });
    deleteInboxItem(inboxId);
    return newNote;
  };

  // Email Handlers
  const convertEmailToTask = (emailId: string): Task => {
    const email = emails.find(e => e.id === emailId);
    const newTask = addTask({
      title: email ? `Follow-up: ${email.subject}` : 'Tarefa a partir de E-mail',
      description: `E-mail de ${email?.from.name} (${email?.from.email}):\n\n${email?.body}`,
      priority: 'high',
      projectId: email?.projectId,
      tags: email?.tags || [],
      originType: 'email',
      originId: emailId,
      originTitle: email?.subject || 'E-mail'
    });
    return newTask;
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const addChatMessage = (message: Pick<AIChatMessage, 'role' | 'content'>): AIChatMessage => {
    const newMessage: AIChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString()
    };
    setChatMessages(current => {
      const updated = [...current, newMessage].slice(-100);
      StorageService.saveChatMessages(updated);
      return updated;
    });
    return newMessage;
  };

  const setQuickSummary = (summary: string) => {
    setQuickSummaryState(summary);
    StorageService.saveQuickSummary(summary);
  };

  const addPassword = (itemData: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>): PasswordItem => {
    const now = new Date().toISOString();
    const newItem: PasswordItem = {
      ...itemData,
      id: `pwd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now
    };
    const updated = [...passwords, newItem];
    setPasswords(updated);
    StorageService.savePasswords(updated);
    return newItem;
  };

  const updatePassword = (id: string, updates: Partial<PasswordItem>) => {
    const updated = passwords.map(item => item.id === id
      ? { ...item, ...updates, id: item.id, updatedAt: new Date().toISOString() }
      : item);
    setPasswords(updated);
    StorageService.savePasswords(updated);
  };

  const deletePassword = (id: string) => {
    const updated = passwords.filter(item => item.id !== id);
    setPasswords(updated);
    StorageService.savePasswords(updated);
  };

  const addUsefulLink = (linkData: Omit<UsefulLink, 'id' | 'createdAt' | 'updatedAt'>): UsefulLink => {
    const now = new Date().toISOString();
    const newLink: UsefulLink = {
      ...linkData,
      id: `useful_link_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };
    const updated = [newLink, ...usefulLinks];
    setUsefulLinks(updated);
    StorageService.saveUsefulLinks(updated);
    return newLink;
  };

  const updateUsefulLink = (id: string, updates: Partial<UsefulLink>) => {
    const updated = usefulLinks.map(link => link.id === id
      ? { ...link, ...updates, id: link.id, updatedAt: new Date().toISOString() }
      : link);
    setUsefulLinks(updated);
    StorageService.saveUsefulLinks(updated);
  };

  const deleteUsefulLink = (id: string) => {
    const updated = usefulLinks.filter(link => link.id !== id);
    setUsefulLinks(updated);
    StorageService.saveUsefulLinks(updated);
  };

  const toggleUsefulLinkFavorite = (id: string) => {
    const link = usefulLinks.find(item => item.id === id);
    if (link) updateUsefulLink(id, { isFavorite: !link.isFavorite });
  };

  // Reset demo
  const resetDatabase = () => {
    StorageService.resetToSeedData();
    setUser(StorageService.getUser());
    setProjects(StorageService.getProjects());
    setTags(StorageService.getTags());
    setMeetings(StorageService.getMeetings());
    setEvents(StorageService.getEvents());
    setTasks(StorageService.getTasks());
    setNotes(StorageService.getNotes());
    setEmails(StorageService.getEmails());
    setDriveFiles(StorageService.getDriveFiles());
    setUsefulLinks(StorageService.getUsefulLinks());
    setInbox(StorageService.getInbox());
    setActivityLogs(StorageService.getActivityLogs());
    setNotifications(StorageService.getNotifications());
    setChatMessages(StorageService.getChatMessages());
    setPomodoro(prev => ({ ...prev, isRunning: false, remainingMs: prev.durationMs }));
    setQuickSummaryState(StorageService.getQuickSummary());
    setActiveMeetingId(null);
    setSelectedMeetingId(null);
    setSelectedTaskId(null);
    setSelectedProjectId(null);
    setSelectedTagId(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        theme,
        setTheme,
        user,
        updateUser,
        sidebarCollapsed,
        setSidebarCollapsed,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isQuickCaptureOpen,
        setIsQuickCaptureOpen,
        activeMeetingId,
        setActiveMeetingId,
        selectedMeetingId,
        setSelectedMeetingId,
        selectedTaskId,
        setSelectedTaskId,
        selectedProjectId,
        setSelectedProjectId,
        selectedTagId,
        setSelectedTagId,
        projects,
        tags,
        meetings,
        events,
        tasks,
        notes,
        emails,
        driveFiles,
        usefulLinks,
        inbox,
        activityLogs,
        notifications,
        chatMessages,
        quickSummary: quickSummaryState,
        setQuickSummary,
        assistantDraft,
        setAssistantDraft,
        pomodoro,
        setPomodoro,
        addTask,
        updateTask,
        deleteTask,
        setTaskStatus,
        toggleTaskStatus,
        toggleTaskChecklist,
        addTaskComment,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        startMeetingMode,
        endMeetingMode,
        finishMeetingMode,
        addMeetingDecision,
        addNoteToMeeting,
        updateMeetingMiniAta,
        addAttachmentToMeeting,
        removeAttachmentFromMeeting,
        addNote,
        updateNote,
        deleteNote,
        convertNoteToTask,
        addProject,
        updateProject,
        deleteProject,
        toggleProjectMilestone,
        addTag,
        deleteTag,
        addInboxItem,
        deleteInboxItem,
        convertInboxToTask,
        convertInboxToNote,
        processInboxItem,
        addChatMessage,
        convertEmailToTask,
        addUsefulLink,
        updateUsefulLink,
        deleteUsefulLink,
        toggleUsefulLinkFavorite,
        markNotificationRead,
        clearAllNotifications,
        resetDatabase,
        logActivity,
        passwords,
        addPassword,
        updatePassword,
        deletePassword,
        weatherLocation,
        setWeatherLocation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
