import { useState, useCallback, useEffect, useRef } from 'react';
import { PomodoroPhase, PomodoroState, PomodoroSession } from '../types';

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true
};

function getDurationMsFor(phase: PomodoroPhase): number {
  const mins: Record<PomodoroPhase, number> = {
    focus: DEFAULT_SETTINGS.focusDuration,
    short_break: DEFAULT_SETTINGS.shortBreakDuration,
    long_break: DEFAULT_SETTINGS.longBreakDuration
  };
  return mins[phase] * 60 * 1000;
}

function buildInitialState(): PomodoroState {
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

function loadPomodoroState(): PomodoroState {
  if (typeof window === 'undefined') return buildInitialState();
  const raw = localStorage.getItem('nura_pomodoro');
  if (!raw) return buildInitialState();
  try {
    const parsed = JSON.parse(raw);
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
    return {
      phase: (parsed.phase as PomodoroPhase) || 'focus',
      durationMs: parsed.durationMs || 25 * 60 * 1000,
      remainingMs: parsed.remainingMs ?? settings.focusDuration * 60 * 1000,
      isRunning: parsed.isRunning || false,
      sessionsCompletedToday: parsed.sessionsCompletedToday ?? 0,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      totalFocusMinutesToday: parsed.totalFocusMinutesToday ?? 0,
      settings
    };
  } catch {
    return buildInitialState();
  }
}

function playBeep(durationMs = 400, frequency = 830, volume = 0.35): void {
  try {
    const Constructor = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new (Constructor || (AudioContext as any))();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  } catch {}
}

function playSequence(times = 3, gapMs = 180): void {
  for (let i = 0; i < times; i++) {
    setTimeout(() => playBeep(300, i === times - 1 ? 1047 : 830, 0.4), i * (400 + gapMs));
  }
}

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>(loadPomodoroState);

  useEffect(() => {
    localStorage.setItem('nura_pomodoro', JSON.stringify(state));
  }, [state]);

  const save = useCallback((s: PomodoroState) => {
    setState(s);
  }, []);

  // Keep timer ticking while running
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!state.isRunning) return;

    lastUpdateRef.current = Date.now();

    const tick = () => {
      setState(prev => {
        if (!prev.isRunning) return prev;
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        lastUpdateRef.current = now;
        const next = prev.remainingMs - elapsed;
        if (next <= 0) {
          playSequence(3, 200);
          return { ...prev, remainingMs: 0, isRunning: false };
        }
        return { ...prev, remainingMs: next };
      });
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  // Notify browser when timer finishes
  useEffect(() => {
    if (state.remainingMs > 0 || !state.isRunning) return;
    const timer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = state.phase === 'focus' ? 'Foco concluído!' : 'Descanso concluído!';
        new Notification(title, { body: 'NuRa — Hora de continuar.', icon: '/icon-192.png' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [state.remainingMs, state.isRunning, state.phase]);

  const startFocus = useCallback(() => {
    const ms = getDurationMsFor('focus');
    save({ ...state, phase: 'focus', durationMs: ms, remainingMs: ms, isRunning: false });
  }, [state, save]);

  const startShortBreak = useCallback(() => {
    const ms = getDurationMsFor('short_break');
    save({ ...state, phase: 'short_break', durationMs: ms, remainingMs: ms, isRunning: false });
  }, [state, save]);

  const startLongBreak = useCallback(() => {
    const ms = getDurationMsFor('long_break');
    save({ ...state, phase: 'long_break', durationMs: ms, remainingMs: ms, isRunning: false });
  }, [state, save]);

  const switchPhase = useCallback((phase: PomodoroPhase) => {
    const ms = getDurationMsFor(phase);
    save({ ...state, phase, durationMs: ms, remainingMs: ms, isRunning: false });
  }, [state, save]);

  const toggleTimer = useCallback(() => {
    setState(prev => {
      if (prev.remainingMs <= 0) {
        const ms = getDurationMsFor(prev.phase);
        return { ...prev, remainingMs: ms, isRunning: true };
      }
      return { ...prev, isRunning: !prev.isRunning };
    });
  }, []);

  const resetTimer = useCallback(() => {
    const ms = getDurationMsFor(state.phase);
    save({ ...state, remainingMs: ms, isRunning: false });
  }, [state, save]);

  const completeSession = useCallback(() => {
    setState(prev => {
      const minutes = Math.round(prev.durationMs / 60000);
      const updatedSessions = [...prev.sessions];
      const last = updatedSessions[updatedSessions.length - 1];
      if (last && !last.completedAt) {
        updatedSessions[updatedSessions.length - 1] = { ...last, completedAt: new Date().toISOString() };
      }
      const newSession: PomodoroSession = {
        id: `pomo_${Date.now()}`,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        focusMinutes: minutes
      };
      const nextCount = prev.sessionsCompletedToday + 1;
      const shouldLongBreak = nextCount % prev.settings.sessionsBeforeLongBreak === 0;
      const nextPhase: PomodoroPhase = prev.phase === 'focus'
        ? (shouldLongBreak ? 'long_break' : 'short_break')
        : 'focus';
      const nextMs = getDurationMsFor(nextPhase);
      return {
        ...prev,
        phase: nextPhase,
        durationMs: nextMs,
        remainingMs: nextMs,
        isRunning: prev.settings.autoStartFocus && nextPhase === 'focus' ? true : false,
        sessionsCompletedToday: nextCount,
        sessions: [...updatedSessions, newSession],
        totalFocusMinutesToday: prev.totalFocusMinutesToday + minutes,
        ...(prev.settings.autoStartBreaks && nextPhase !== 'focus' ? { isRunning: true } : {})
      };
    });
    playSequence(3, 200);
  }, []);

  const updateSettings = useCallback((patch: Partial<PomodoroState['settings']>) => {
    setState(prev => {
      const next = { ...prev, settings: { ...prev.settings, ...patch } };
      if (!next.isRunning && next.remainingMs === 0) {
        const ms = getDurationMsFor(next.phase);
        return { ...next, durationMs: ms, remainingMs: ms };
      }
      return next;
    });
  }, []);

  return {
    state,
    startFocus,
    startShortBreak,
    startLongBreak,
    switchPhase,
    toggleTimer,
    resetTimer,
    completeSession,
    updateSettings
  };
}
