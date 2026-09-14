import React, { useState, useEffect, useRef } from 'react';
import { Sun, PlayIcon, PauseIcon, RotateCcw, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateBR } from '../lib/date';
import { scheduleNotification, cancelNotification, showNotification, requestNotificationPermission } from '../lib/notifier';

function formatMinutesTotal(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const getPhaseLabel = (phase: string): string =>
  phase === 'focus' ? 'Foco' : phase === 'short_break' ? 'Pausa Curta' : 'Pausa Longa';

const getPhaseColor = (phase: string): string =>
  phase === 'focus' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400';

const getPhaseBg = (phase: string): string =>
  phase === 'focus'
    ? 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20'
    : 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20';

function getDurationMsForPhase(phase: string): number {
  const mins: Record<string, number> = { focus: 25, short_break: 5, long_break: 15 };
  return (mins[phase] || 25) * 60 * 1000;
}

/** PomodoroCard — timer compacto para usar no TodayView e no PomodoroView */
const PomodoroCardImpl: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { pomodoro: state, setPomodoro } = useApp();
  const notificationTimerRef = useRef<number | null>(null);

  const {
    phase,
    remainingMs,
    isRunning,
    sessionsCompletedToday,
    totalFocusMinutesToday,
    settings,
    durationMs
  } = state;

  const phaseLabel = getPhaseLabel(phase);
  const phaseColor = getPhaseColor(phase);
  const phaseBg = getPhaseBg(phase);
  const progress = Math.max(0, 1 - remainingMs / (durationMs || 1));

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.round((remainingMs % 60000) / 1000);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handlePlayPause = () => {
    if (remainingMs <= 0) {
      setPomodoro(prev => ({ ...prev, remainingMs: getDurationMsForPhase(phase), isRunning: false }));
      return;
    }
    setPomodoro(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleReset = () => {
    setPomodoro(prev => ({ ...prev, remainingMs: getDurationMsForPhase(phase), isRunning: false }));
  };

  const handleCycle = () => {
    const next = phase === 'focus' ? 'short_break' : phase === 'short_break' ? 'long_break' : 'focus';
    setPomodoro(prev => ({ ...prev, phase: next, durationMs: getDurationMsForPhase(next), remainingMs: getDurationMsForPhase(next), isRunning: false }));
  };


  // Solicitar permissão para notificações quando o componente montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }
  }, []);

  // Expor permissão ao usuário via botão se necessário
  const requestPerm = () => requestNotificationPermission();

  if (compact) {
    return (
      <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${phaseBg} p-3`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-extrabold ${phaseColor}`}>{phaseLabel}</span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{sessionsCompletedToday} sessões</span>
        </div>
        <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight">
          {timeStr}
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            onClick={handlePlayPause}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
          >
            {isRunning ? 'Pausar' : remainingMs <= 0 ? 'Reiniciar' : 'Iniciar'}
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            ↺
          </button>
        </div>
        {/* Botão para solicitar permissão de notificação */}
        {('Notification' in window && Notification.permission === 'default') && (
          <button
            onClick={requestPerm}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            🔔 Ativar Notificações
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${phase === 'focus' ? 'bg-emerald-500' : phase === 'short_break' ? 'bg-blue-500' : 'bg-purple-500'}`} />
            Pomodoro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gestão de foco e descanso</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5" />
          <span>{totalFocusMinutesToday} min hoje</span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span>{sessionsCompletedToday} sessões</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className={`rounded-2xl bg-gradient-to-br ${phaseBg} p-6 mb-5 text-center`}>
        <p className={`text-sm font-extrabold uppercase tracking-widest ${phaseColor} mb-2`}>{phaseLabel}</p>
        <p className="text-6xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight">
          {timeStr}
        </p>

        {/* Progress Ring */}
        <div className="mt-4 mx-auto w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background: phase === 'focus'
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #3b82f6, #06b6d4)'
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button
          onClick={handlePlayPause}
          className={`col-span-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-extrabold transition-colors ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-4 h-4" /> Pausar
            </>
          ) : remainingMs <= 0 ? (
            <>
              <PlayIcon className="w-4 h-4" /> Reiniciar
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" /> Iniciar
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          className="col-span-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <button
          onClick={handleCycle}
          className="col-span-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <Clock className="w-4 h-4" /> Ciclar
        </button>
      </div>

      {/* Phase Switch */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'focus' as const, label: 'Foco', color: 'bg-emerald-600 text-white' },
          { key: 'short_break' as const, label: 'Pausa Curta', color: 'bg-blue-600 text-white' },
          { key: 'long_break' as const, label: 'Pausa Longa', color: 'bg-purple-600 text-white' }
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPomodoro(prev => ({ ...prev, phase: p.key, durationMs: getDurationMsForPhase(p.key), remainingMs: getDurationMsForPhase(p.key), isRunning: false }))}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              phase === p.key
                ? p.color
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 select-none flex items-center gap-1">
          <SettingsIcon className="w-3.5 h-3.5" /> Configurações do timer
        </summary>
        <div className="mt-3 space-y-3 text-xs">
          {[
            { key: 'focusDuration' as const, label: 'Foco (min)', default: 25 },
            { key: 'shortBreakDuration' as const, label: 'Pausa curta (min)', default: 5 },
            { key: 'longBreakDuration' as const, label: 'Pausa longa (min)', default: 15 },
            { key: 'sessionsBeforeLongBreak' as const, label: 'Sessões antes da pausa longa', default: 4 }
          ].map(field => (
            <div key={field.key} className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">{field.label}</span>
              <input
                type="number"
                min={1}
                max={120}
                value={settings[field.key]}
                onChange={e => {
                  const val = Number(e.target.value);
                  setPomodoro(prev => ({ ...prev, settings: { ...prev.settings, [field.key]: val } }));
                }}
                className="w-16 text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-900 dark:text-white"
              />
            </div>
          ))}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {[
              { key: 'autoStartBreaks' as const, label: 'Iniciar pausa automaticamente' },
              { key: 'autoStartFocus' as const, label: 'Iniciar foco automaticamente após pausa' },
              { key: 'soundEnabled' as const, label: 'Ativar som ao terminar' }
            ].map(chk => (
              <label key={chk.key} className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-600 dark:text-slate-400">{chk.label}</span>
                <input
                  type="checkbox"
                  checked={settings[chk.key] as boolean}
                  onChange={e => {
                    setPomodoro(prev => ({ ...prev, settings: { ...prev.settings, [chk.key]: e.target.checked } }));
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>
      </details>

      {/* Notification Permission Button */}
      {('Notification' in window && Notification.permission === 'default') && (
        <div className="mt-4">
          <button
            onClick={requestPerm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            🔔 Ativar Notificações
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-lg font-black text-slate-900 dark:text-white">{sessionsCompletedToday}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Sessões hoje</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-lg font-black text-slate-900 dark:text-white">{formatMinutesTotal(totalFocusMinutesToday)}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Foco hoje</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {settings.sessionsBeforeLongBreak - (sessionsCompletedToday % settings.sessionsBeforeLongBreak)}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Até pausa longa</p>
        </div>
      </div>

      {/* Daily Insight */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Hora de usar o Pomodoro</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-amber-700 dark:text-amber-300">{formatDateBR(new Date())}</span>
              {' · '}
              {sessionsCompletedToday} sessão(ões) já feita(s)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Use o timer para criar ciclos de concentração profunda. Cada sessão é uma vitória rumo à conclusão das suas prioridades.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PomodoroCardImpl;

/** Inline SVG icons */
function SettingsIcon(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
