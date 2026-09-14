import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Radio,
  Video,
  Clock,
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Meeting } from '../../types';
import { NotificationService } from '../../lib/notifications';

export const MeetingReminderAlert: React.FC = () => {
  const { meetings, startMeetingMode } = useApp();
  const [activeAlertMeeting, setActiveAlertMeeting] = useState<Meeting | null>(null);
  const [dismissedMeetingIds, setDismissedMeetingIds] = useState<string[]>([]);
  const [snoozedUntil, setSnoozedUntil] = useState<{ [id: string]: number }>({});
  const [nowMs, setNowMs] = useState(Date.now());
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission === 'granted'
      : false
  );
  // Ref to track the last meeting ID for which we sent a Telegram notification
  const lastNotifiedMeetingId = useRef<string | null>(null);

  // Play subtle chime using Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const requestBrowserNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setHasNotificationPermission(perm === 'granted');
      if (perm === 'granted') {
        new Notification('NuRa Gestão', {
          body: 'Notificações de reuniões ativadas com sucesso!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const sendTelegramMeetingReminder = async (meetingTitle: string) => {
    try {
      await fetch('/api/telegram/reuniao-proxima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: meetingTitle })
      });
    } catch (err) {
      console.error('Failed to send Telegram meeting reminder:', err);
    }
  };

  useEffect(() => {
    const checkMeetings = () => {
      const now = new Date();
      setNowMs(now.getTime());
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMin = currentHours * 60 + currentMinutes;

      // Find upcoming or ongoing meeting today
      const upcoming = meetings.find(m => {
        if (m.date !== todayStr) return false;
        if (dismissedMeetingIds.includes(m.id)) return false;

        // Check snooze
        if (snoozedUntil[m.id] && Date.now() < snoozedUntil[m.id]) return false;

        const [startH, startM] = m.startTime.split(':').map(Number);
        const startTotalMin = startH * 60 + startM;

        const [endH, endM] = m.endTime.split(':').map(Number);
        const endTotalMin = endH * 60 + endM;

        // Trigger if starting within 15 minutes OR currently in progress (within start and end)
        const isImminent = startTotalMin - currentTotalMin <= 15 && startTotalMin - currentTotalMin >= -5;
        const isOngoing = currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;

        return isImminent || isOngoing;
      });

      if (upcoming && upcoming.id !== activeAlertMeeting?.id) {
        setActiveAlertMeeting(upcoming);
        playChime();

        // Send native notification if permitted
        NotificationService.show(`⏰ Reunião Iminente: ${upcoming.title}`, {
          body: `Início: ${upcoming.startTime} às ${upcoming.endTime}\nClique para entrar no Modo Reunião NuRa.`,
          icon: '/favicon.ico'
        });

        // Send Telegram notification if we haven't already for this meeting
        if (lastNotifiedMeetingId.current !== upcoming.id) {
          sendTelegramMeetingReminder(upcoming.title);
          lastNotifiedMeetingId.current = upcoming.id;
        }
      }

      // Reset the last notified meeting ID if the current active meeting is dismissed or snoozed
      if (!upcoming && lastNotifiedMeetingId.current) {
        // Optionally, we could reset when there's no imminent meeting, but let's keep it simple and only update when we have a new meeting
        // We'll leave it as is; the next meeting will update it.
      }
    };

    checkMeetings();
    const interval = setInterval(checkMeetings, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [meetings, dismissedMeetingIds, snoozedUntil, activeAlertMeeting, hasNotificationPermission]);

  useEffect(() => {
    if (!activeAlertMeeting) return;

    primaryActionRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss(activeAlertMeeting.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlertMeeting]);

  // Solicitar permissão de notificação uma vez ao montar
  useEffect(() => {
    NotificationService.requestPermission();
  }, []);

  const handleSnooze = (meetingId: string) => {
    setSnoozedUntil(prev => ({
      ...prev,
      [meetingId]: Date.now() + 5 * 60 * 1000 // 5 minutes
    }));
    setActiveAlertMeeting(null);
    // Reset the last notified meeting ID when snoozed so we can notify again after snooze period
    lastNotifiedMeetingId.current = null;
  };

  const handleDismiss = (meetingId: string) => {
    setDismissedMeetingIds(prev => [...prev, meetingId]);
    setActiveAlertMeeting(null);
    // Reset the last notified meeting ID when dismissed
    lastNotifiedMeetingId.current = null;
  };

  const handleEnterMeetingMode = (meetingId: string) => {
    setActiveAlertMeeting(null);
    startMeetingMode(meetingId);
  };

  if (!activeAlertMeeting) return null;

  const meetingStart = new Date(`${activeAlertMeeting.date}T${activeAlertMeeting.startTime}:00`).getTime();
  const minutesUntilStart = Math.ceil((meetingStart - nowMs) / 60000);
  const timingLabel = minutesUntilStart <= 0
    ? 'REUNIÃO EM ANDAMENTO'
    : minutesUntilStart === 1
      ? 'COMEÇA EM 1 MINUTO'
      : `COMEÇA EM ${minutesUntilStart} MINUTOS`;

  return (
    <div
      id="meeting-live-reminder-banner"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="meeting-reminder-title"
      aria-describedby="meeting-reminder-description"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-[min(86vw,48rem)] w-[min(86vw,48rem)] rounded-full bg-amber-500/15 blur-3xl animate-pulse motion-reduce:animate-none" />
      </div>

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-amber-400 bg-slate-950 text-white shadow-[0_0_0_8px_rgba(245,158,11,0.14),0_30px_100px_rgba(0,0,0,0.65)] animate-in zoom-in-95 duration-300">
        <div className="h-2 w-full bg-linear-to-r from-red-500 via-amber-300 to-red-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />

        <div className="relative p-6 sm:p-9">
          <div className="absolute right-5 top-5 flex items-center gap-2">
            {!hasNotificationPermission && (
              <button
                type="button"
                onClick={requestBrowserNotification}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-colors hover:border-amber-400 hover:text-white"
              >
                Ativar notificações
              </button>
            )}
            <button
              type="button"
              aria-label="Dispensar lembrete"
              onClick={() => handleDismiss(activeAlertMeeting.id)}
              className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 transition-colors hover:border-red-400 hover:bg-red-950 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-7 flex items-center gap-4 pr-24 sm:pr-36">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.65)] animate-pulse motion-reduce:animate-none">
              <Bell className="h-8 w-8" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-red-500" />
            </div>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
                Alerta de agenda
              </p>
              <p className="text-sm font-black uppercase tracking-wider text-red-400 sm:text-base">
                {timingLabel}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/90 p-5 sm:p-6">
            <h2 id="meeting-reminder-title" className="text-2xl font-black leading-tight text-white sm:text-4xl">
              {activeAlertMeeting.title}
            </h2>
            <p id="meeting-reminder-description" className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {activeAlertMeeting.agenda || 'Compromisso agendado no NuRa.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-amber-300">
                <Clock className="h-5 w-5" />
                {activeAlertMeeting.startTime}–{activeAlertMeeting.endTime}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200">
                <Calendar className="h-5 w-5 text-emerald-400" />
                {new Date(`${activeAlertMeeting.date}T12:00:00`).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200">
                <AlertCircle className="h-5 w-5 text-red-400" />
                {activeAlertMeeting.participants?.length || 1} participante(s)
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              ref={primaryActionRef}
              type="button"
              onClick={() => handleEnterMeetingMode(activeAlertMeeting.id)}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black text-slate-950 shadow-[0_12px_35px_rgba(16,185,129,0.28)] transition-transform hover:scale-[1.02] hover:bg-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-300/50 motion-reduce:transform-none"
            >
              <Radio className="h-5 w-5" />
              Abrir Modo Reunião
            </button>

            <button
              type="button"
              onClick={() => window.open(activeAlertMeeting.meetUrl || 'https://meet.google.com/new', '_blank')}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition-transform hover:scale-[1.02] hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300/40 motion-reduce:transform-none"
            >
              <Video className="h-5 w-5" />
              Entrar no Vídeo
            </button>
          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={() => handleSnooze(activeAlertMeeting.id)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-amber-300 transition-colors hover:bg-amber-400/10 hover:text-amber-200"
            >
              Adiar por 5 minutos
            </button>
            <button
              type="button"
              onClick={() => handleDismiss(activeAlertMeeting.id)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Dispensar este lembrete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};