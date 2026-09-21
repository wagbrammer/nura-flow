import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Plus,
  RefreshCw,
  Sparkles,
  Radio,
  FileText,
  CheckCircle2,
  Paperclip,
  PenTool,
  ExternalLink,
  Edit3,
  Tag,
  Trash2
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { MeetingMiniAtaModal } from '../components/common/MeetingMiniAtaModal';
import { formatDateBR, formatRelativeTimeBR } from '../lib/date';
import { Meeting } from '../types';

export const AgendaView: React.FC = () => {
  const {
    meetings,
    notes,
    events,
    setCurrentView,
    setSelectedMeetingId,
    startMeetingMode,
    setIsQuickCaptureOpen,
    updateMeeting,
    deleteMeeting,
    addMeeting,
    tags,
    addTag
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(meetings[0] || null);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);

  // Auto-sync to Google Calendar and fetch Google events when component mounts (if connected)
  useEffect(() => {
    let cancelled = false;
    async function autoSync() {
      try {
        const res = await fetch('/api/auth/google/status', { credentials: 'same-origin' });
        const data = await res.json();
        if (!cancelled && data.connected) {
          // Fetch Google Calendar events
          const eventsRes = await fetch('/api/google/calendar/events', { credentials: 'same-origin' });
          const eventsData = await eventsRes.json();
          if (!cancelled && eventsData.events) {
            // Add flag to identify Google events for UI differentiation
            const googleEventsWithFlag = eventsData.events.map(event => ({
              ...event,
              isGoogleEvent: true
            }));
            setGoogleCalendarEvents(googleEventsWithFlag);
          }
          // Also sync all meetings to Google
          const syncRes = await fetch('/api/google/calendar/sync-all', { credentials: 'same-origin' });
          const syncData = await syncRes.json();
          if (!cancelled) {
            setGoogleSyncMsg(syncData.errors ? `✅ ${syncData.synced} synced, ${syncData.errors} errors` : `✅ ${syncData.synced} events synced`);
          }
        }
      } catch {}
    }
    autoSync();
    return () => { cancelled = true; };
  }, []);
  const [isMiniAtaModalOpen, setIsMiniAtaModalOpen] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<string>('none');

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 to 19:00

  // Days in current week
  const getWeekDays = (baseDate: Date) => {
    const days = [];
    const curr = new Date(baseDate);
    const first = curr.getDate() - curr.getDay() + 1; // Monday start
    for (let i = 0; i < 6; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push(d);
    }
    return days;
  };

  const visibleDays = viewMode === 'day' ? [new Date(currentDate)] : getWeekDays(currentDate);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get active meeting object to reflect realtime updates
  const activeMeeting = meetings.find(m => m.id === selectedMeeting?.id) || selectedMeeting;

  // Filter Google Calendar events for current view
  const googleEvents = googleCalendarEvents.filter((e) => showGoogleEvents);

  // Conflict detection state
  const [conflictAlert, setConflictAlert] = useState<{ id: string; title: string; startTime: string; endTime: string; conflictsWithGoogleEvent?: boolean }[]>([]);

  const checkConflicts = (date: string, startTime: string, endTime: string) => {
    const newStartMs = parseInt(startTime.split(':')[0]) * 3600000 + parseInt(startTime.split(':')[1]) * 60000;
    const newEndMs = parseInt(endTime.split(':')[0]) * 3600000 + parseInt(endTime.split(':')[1]) * 60000;
    const conflicts: { id: string; title: string; startTime: string; endTime: string; conflictsWithGoogleEvent?: boolean }[] = [];

    // Check against NuRa meetings
    meetings.filter(m => m.date === date).forEach(m => {
      const mStartMs = parseInt(m.startTime.split(':')[0]) * 3600000 + parseInt(m.startTime.split(':')[1]) * 60000;
      const mEndMs = parseInt(m.endTime.split(':')[0]) * 3600000 + parseInt(m.endTime.split(':')[1]) * 60000;
      if (newStartMs < mEndMs && mStartMs < newEndMs && m.id !== editingMeetingId) {
        conflicts.push({ id: m.id, title: m.title, startTime: m.startTime, endTime: m.endTime });
      }
    });

    // Check against Google Calendar events
    googleCalendarEvents.filter(e => e.startDate === date).forEach(e => {
      const eStartMs = parseInt(e.startTime.split(':')[0]) * 3600000 + parseInt(e.startTime.split(':')[1]) * 60000;
      const eEndMs = parseInt(e.endTime.split(':')[0]) * 3600000 + parseInt(e.endTime.split(':')[1]) * 60000;
      if (newStartMs < eEndMs && eStartMs < newEndMs) {
        conflicts.push({ id: e.id, title: e.title, startTime: e.startTime, endTime: e.endTime, conflictsWithGoogleEvent: true });
      }
    });

    return conflicts;
  };

  const parseTimeToMs = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 3600000 + m * 60000;
  };

  // Edit meeting handlers
  const handleEditMeeting = (meeting: any) => {
    setEditMeeting(meeting);
    setEditTitle(meeting.title);
    setEditDate(meeting.date);
    setEditStartTime(meeting.startTime);
    setEditEndTime(meeting.endTime);
    setEditAgenda(meeting.agenda || '');
    setEditRecurrence(meeting.recurrenceRule || 'none');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editMeeting || !editTitle.trim()) return;

    // Check for conflicts with other meetings on the same day
    const newStartMs = parseInt(editStartTime.split(':')[0]) * 3600000 + parseInt(editStartTime.split(':')[1]) * 60000;
    const newEndMs = parseInt(editEndTime.split(':')[0]) * 3600000 + parseInt(editEndTime.split(':')[1]) * 60000;
    const conflicts: { id: string; title: string; startTime: string; endTime: string; conflictsWithGoogleEvent?: boolean }[] = [];

    meetings.filter(m => m.date === editDate && m.id !== editMeeting.id).forEach(m => {
      const mStartMs = parseInt(m.startTime.split(':')[0]) * 3600000 + parseInt(m.startTime.split(':')[1]) * 60000;
      const mEndMs = parseInt(m.endTime.split(':')[0]) * 3600000 + parseInt(m.endTime.split(':')[1]) * 60000;
      if (newStartMs < mEndMs && mStartMs < newEndMs) {
        conflicts.push({ id: m.id, title: m.title, startTime: m.startTime, endTime: m.endTime });
      }
    });

    googleCalendarEvents.filter(e => e.startDate === editDate).forEach(e => {
      const eStartMs = parseInt(e.startTime.split(':')[0]) * 3600000 + parseInt(e.startTime.split(':')[1]) * 60000;
      const eEndMs = parseInt(e.endTime.split(':')[0]) * 3600000 + parseInt(e.endTime.split(':')[1]) * 60000;
      if (newStartMs < eEndMs && eStartMs < newEndMs) {
        conflicts.push({ id: e.id, title: e.title, startTime: e.startTime, endTime: e.endTime, conflictsWithGoogleEvent: true });
      }
    });

    if (conflicts.length > 0) {
      const conflictList = conflicts.map(c => `${c.title} (${c.startTime} - ${c.endTime})${c.conflictsWithGoogleEvent ? ' [Google]' : ''}`).join('\n');
      if (!window.confirm(`⚠️ Conflito detectado com:\n\n${conflictList}\n\nDeseja mesmo salvar mesmo assim?`)) {
        return;
      }
    }

    updateMeeting(editMeeting.id, {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      agenda: editAgenda.trim(),
      recurrenceRule: (editRecurrence !== 'none' ? editRecurrence : undefined) as Meeting['recurrenceRule']
    });
    // If this meeting is the selected one, update it too
    if (selectedMeeting?.id === editMeeting.id) {
      setSelectedMeeting({ ...selectedMeeting, title: editTitle.trim(), date: editDate, startTime: editStartTime, endTime: editEndTime, agenda: editAgenda.trim(), recurrenceRule: (editRecurrence !== 'none' ? editRecurrence : undefined) as Meeting['recurrenceRule'] });
    }
    setIsEditModalOpen(false);
    setEditMeeting(null);
  };

  const handleCreateRecurrence = () => {
    if (!editMeeting) return;
    const rule = editRecurrence;
    if (rule === 'none') return;

    const baseDate = new Date(editMeeting.date);
    const recurrenceMap: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };
    const daysToAdd = recurrenceMap[rule] || 7;
    const instances = 4; // Create 4 future instances

    for (let i = 1; i <= instances; i++) {
      const newDate = new Date(baseDate);
      newDate.setDate(newDate.getDate() + daysToAdd * i);
      const newId = `${editMeeting.id}-rec-${i}`;
      addMeeting({
        title: editMeeting.title,
        date: newDate.toISOString().split('T')[0],
        startTime: editMeeting.startTime,
        endTime: editMeeting.endTime,
        agenda: editMeeting.agenda,
        tags: editMeeting.tags,
        participants: editMeeting.participants,
        previousMeetingId: i === 1 ? editMeeting.id : `${editMeeting.id}-rec-${i - 1}`,
        recurrenceRule: rule as Meeting['recurrenceRule']
      });
    }
  };
  const linkedNotes = activeMeeting ? notes.filter(n => n.meetingId === activeMeeting.id) : [];

  // Compute side-by-side layout for overlapping events (Google Calendar style)
  const computeEventLayout = (events: any[]) => {
    if (events.length === 0) return [];
    const sorted = events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const aStart = parseInt(a.event.startTime.split(':')[0]) * 60 + parseInt(a.event.startTime.split(':')[1]);
        const bStart = parseInt(b.event.startTime.split(':')[0]) * 60 + parseInt(b.event.startTime.split(':')[1]);
        return aStart - bStart;
      });
    const columnEndTimes: number[] = [];
    const layoutMap = new Map<string, { column: number; maxColumns: number }>();
    for (const { event } of sorted) {
      const start = parseInt(event.startTime.split(':')[0]) * 60 + parseInt(event.startTime.split(':')[1]);
      const end = parseInt(event.endTime.split(':')[0]) * 60 + parseInt(event.endTime.split(':')[1]);
      let column = 0;
      while (column < columnEndTimes.length && columnEndTimes[column] > start) {
        column++;
      }
      if (column >= columnEndTimes.length) {
        columnEndTimes.push(end);
      } else {
        columnEndTimes[column] = end;
      }
      layoutMap.set(event.id, { column, maxColumns: columnEndTimes.length });
    }
    return events.map(event => layoutMap.get(event.id)!);
  };

  return (
    <div id="agenda-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Agenda Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Agenda & Compromissos com Mini Atas
            </h1>
            <p className="text-xs text-slate-500">
              Agenda interna com anotações, atas e documentos vinculados aos compromissos
            </p>
          </div>
        </div>

        {/* Date Navigation & View switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 font-mono">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {(['day', 'week'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {mode === 'day' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>

          {/* Sync with Google Calendar button */}
          <button
            type="button"
            onClick={async () => {
              setGoogleSyncing(true);
              setGoogleSyncMsg(null);
              try {
                // First sync meetings to Google
                const syncRes = await fetch('/api/google/calendar/sync-all', { credentials: 'same-origin' });
                const syncData = await syncRes.json();
                // Then fetch fresh events from Google
                const eventsRes = await fetch('/api/google/calendar/events', { credentials: 'same-origin' });
                const eventsData = await eventsRes.json();
                if (!cancelled && eventsData.events) {
                  setGoogleCalendarEvents(eventsData.events);
                }
                if (syncRes.ok) {
                  setGoogleSyncMsg(`✅ ${syncData.synced} reuniões sincronizadas com Google Calendar${syncData.errors ? `, ${syncData.errors} erros` : ''}`);
                } else {
                  setGoogleSyncMsg(`❌ ${syncData.error || 'Erro ao sincronizar'}`);
                }
              } catch (err) {
                setGoogleSyncMsg('❌ Erro de conexão');
              } finally {
                setGoogleSyncing(false);
              }
            }}
            disabled={googleSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${googleSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Google Calendar</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar Board & Right Preview Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Time Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs overflow-x-auto">
          {/* Weekday headers */}
          <div
            className={`grid gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 text-center ${viewMode === 'week' ? 'min-w-[500px]' : ''}`}
            style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
          >
            {visibleDays.map((d, i) => {
              const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={i}
                  className={`p-2 rounded-xl ${
                    isToday ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700' : ''
                  }`}
                >
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className={`text-base font-extrabold ${isToday ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Rows */}
          <div className={`relative ${viewMode === 'week' ? 'min-w-[500px]' : ''}`}>
            <div className="flex">
              {/* Time axis */}
              <div className="w-12 flex flex-col">
                {hours.map(hour => {
                  const timeFormatted = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div key={hour} className="h-[55px] text-xs font-mono font-bold text-slate-400 shrink-0 flex items-start pt-0.5">
                      {timeFormatted}
                    </div>
                  );
                })}
              </div>

              {/* Day columns with meetings */}
              <div className="flex-1 grid gap-2"
                   style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
              >
              {visibleDays.map((d, dayIdx) => {
                const dateStr = d.toISOString().split('T')[0];
                const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

                // Get all meetings and Google events for this day
                const dayMeetings = meetings.filter(m => m.date === dateStr);
                const dayGoogleEvents = googleEvents.filter(e => e.startDate === dateStr);

                return (
                  <div key={dayIdx} className={`relative h-[660px]
                            ${isToday ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700' : ''}`}
                       style={{ position: 'relative' }}>

                    {/* Render meetings as duration bars (Google Calendar style) */}
                    {(() => {
                      const layout = computeEventLayout(dayMeetings);
                      return dayMeetings.map((m, meetingIdx) => {
                        const isSelected = activeMeeting?.id === m.id;
                        const hasMiniAta = Boolean(m.miniAta && m.miniAta.trim().length > 0);
                        const filesCount = m.attachments?.length || 0;
                        const notesCount = notes.filter(n => n.meetingId === m.id).length;

                        const startMinutes = parseInt(m.startTime.split(':')[0]) * 60 + parseInt(m.startTime.split(':')[1]);
                        const endMinutes = parseInt(m.endTime.split(':')[0]) * 60 + parseInt(m.endTime.split(':')[1]);
                        const dayStartMinutes = 8 * 60;
                        const dayEndMinutes = 19 * 60;

                        const startOffsetMinutes = Math.max(0, startMinutes - dayStartMinutes);
                        const endOffsetMinutes = Math.min((dayEndMinutes - dayStartMinutes), endMinutes - dayStartMinutes);
                        const durationMinutes = endOffsetMinutes - startOffsetMinutes;
                        const heightMinutes = Math.max(durationMinutes, 5);

                        const { column, maxColumns } = layout[meetingIdx];
                        const colWidthPct = 100 / maxColumns;
                        const leftPct = column * colWidthPct;

                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMeeting(m)}
                            className={`absolute
                              ${isSelected
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40'
                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'}
                              rounded-lg
                              cursor-pointer
                              transition-all
                              flex
                              flex-col
                              justify-between
                              p-1.5
                              text-left
                              z-10`}
                            style={{
                              top: startOffsetMinutes,
                              height: heightMinutes,
                              left: `${leftPct}%`,
                              width: `${colWidthPct - 1}%`,
                              pointerEvents: 'all'
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-[11px] font-bold truncate leading-tight">
                                {m.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMeeting(m);
                                  }}
                                  className="p-1 rounded transition-colors hover:bg-white/20"
                                  title="Editar reunião"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Deseja realmente excluir a reunião "${m.title}"?`)) {
                                      deleteMeeting(m.id);
                                      if (activeMeeting?.id === m.id) setSelectedMeeting(null);
                                    }
                                  }}
                                  className="p-1 rounded transition-colors hover:bg-red-50"
                                  title="Excluir reunião"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] truncate">{m.startTime} - {m.endTime}</p>

                            <div className="flex items-center gap-1 mt-1 flex-wrap text-[8px]">
                              {hasMiniAta && (
                                <span className="flex items-center gap-0.5">
                                  <FileText className="w-2.5 h-2.5" />
                                  Ata
                                </span>
                              )}
                              {filesCount > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {filesCount}
                                </span>
                              )}
                              {notesCount > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <PenTool className="w-2.5 h-2.5" />
                                  {notesCount}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Render Google Calendar events as duration bars (Google Calendar style) */}
                    {(() => {
                      const layout = computeEventLayout(dayGoogleEvents);
                      return dayGoogleEvents.map((e) => {
                        const isSelected = activeMeeting?.id === e.id;

                        const startMinutes = parseInt(e.startTime.split(':')[0]) * 60 + parseInt(e.startTime.split(':')[1]);
                        const endMinutes = parseInt(e.endTime.split(':')[0]) * 60 + parseInt(e.endTime.split(':')[1]);
                        const dayStartMinutes = 8 * 60;
                        const dayEndMinutes = 19 * 60;

                        const startOffsetMinutes = Math.max(0, startMinutes - dayStartMinutes);
                        const endOffsetMinutes = Math.min((dayEndMinutes - dayStartMinutes), endMinutes - dayStartMinutes);
                        const durationMinutes = endOffsetMinutes - startOffsetMinutes;
                        const heightMinutes = Math.max(durationMinutes, 5);

                        const { column, maxColumns } = layout[dayGoogleEvents.findIndex(ev => ev.id === e.id)];
                        const colWidthPct = 100 / maxColumns;
                        const leftPct = column * colWidthPct;

                        return (
                          <div
                            key={e.id}
                            onClick={() => setSelectedMeeting({ ...e, id: e.id, miniAta: e.description, startTime: e.startTime, endTime: e.endTime, date: e.startDate })}
                            className={`absolute
                              ${isSelected
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40'
                                : 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'}
                              rounded-lg
                              cursor-pointer
                              transition-all
                              flex
                              flex-col
                              justify-between
                              p-1.5
                              text-left
                              z-10`}
                            style={{
                              top: startOffsetMinutes,
                              height: heightMinutes,
                              left: `${leftPct}%`,
                              width: `${colWidthPct - 1}%`,
                              pointerEvents: 'all'
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-[11px] font-bold truncate leading-tight flex items-center gap-1">
                                <span className="text-[9px] bg-blue-100 dark:bg-blue-900 px-1 rounded">G</span>
                                {e.title}
                              </p>
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  window.open('https://calendar.google.com', '_blank');
                                }}
                                className="p-1 rounded transition-colors hover:bg-white/20"
                                title="Abrir no Google Calendar"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>

                            <p className="text-[10px] truncate">{e.startTime} - {e.endTime}</p>

                            {e.location && (
                              <p className="text-[9px] truncate flex items-center gap-1">
                                <span>📍</span> {e.location}
                              </p>
                            )}

                            {e.meetUrl && (
                              <a
                                href={e.meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink className="w-2 h-2" /> Meet
                              </a>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Drawer: Mini Ata, Linked Notes & Attached Files (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeMeeting ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Compromisso Selecionado
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {formatDateBR(activeMeeting.date)}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {activeMeeting.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeMeeting.startTime} às {activeMeeting.endTime}</span>
                  {activeMeeting.location && <span>• {activeMeeting.location}</span>}
                </div>
              </div>

              {/* Tags da Reunião (Editar & Gerenciar) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tags ({activeMeeting.tags?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingTags(!isEditingTags)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    {isEditingTags ? 'Concluir' : '+ Gerenciar Tags'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(!activeMeeting.tags || activeMeeting.tags.length === 0) ? (
                    <span className="text-xs text-slate-400 italic">Sem tags atribuídas.</span>
                  ) : (
                    activeMeeting.tags.map((tagId: string) => {
                      const tagObj = tags.find(t => t.id === tagId);
                      if (!tagObj) return null;
                      return (
                        <div
                          key={tagId}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border"
                          style={{
                            backgroundColor: `${tagObj.color || '#059669'}18`,
                            borderColor: `${tagObj.color || '#059669'}40`,
                            color: tagObj.color || '#059669'
                          }}
                        >
                          <span>{tagObj.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (activeMeeting.tags || []).filter((t: string) => t !== tagId);
                              updateMeeting(activeMeeting.id, { tags: updated });
                            }}
                            className="hover:opacity-75 p-0.5"
                            title="Remover tag"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {isEditingTags && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                    <div className="flex flex-wrap gap-1">
                      {tags.map(t => {
                        const isAssigned = (activeMeeting.tags || []).includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              const current = activeMeeting.tags || [];
                              const updated = isAssigned
                                ? current.filter((id: string) => id !== t.id)
                                : [...current, t.id];
                              updateMeeting(activeMeeting.id, { tags: updated });
                            }}
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                              isAssigned
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {t.name} {isAssigned ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>

                    {!isCreatingTag ? (
                      <button
                        type="button"
                        onClick={() => setIsCreatingTag(true)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Criar nova tag</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Nome da tag..."
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTagName.trim()) {
                              const created = addTag({ name: newTagName.trim() });
                              const current = activeMeeting.tags || [];
                              updateMeeting(activeMeeting.id, { tags: [...current, created.id] });
                              setNewTagName('');
                              setIsCreatingTag(false);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreatingTag(false)}
                          className="text-xs text-slate-400 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action: Open Full Mini Ata Modal */}
              <button
                type="button"
                onClick={() => setIsMiniAtaModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Abrir Editor de Mini Ata & Anexos</span>
              </button>

              {/* Mini Ata Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mini Ata do Compromisso</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Editar Ata
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed font-mono">
                  {activeMeeting.miniAta || activeMeeting.agenda || 'Nenhuma anotação de ata registrada ainda. Clique acima para registrar as notas e deliberações.'}
                </p>
              </div>

              {/* Linked Files Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    Arquivos Anexados ({activeMeeting.attachments?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    + Anexar Arquivo
                  </button>
                </div>

                {(!activeMeeting.attachments || activeMeeting.attachments.length === 0) ? (
                  <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    Nenhum arquivo vinculado a este evento.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {activeMeeting.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {att.size}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-purple-600" />
                    Notas & Esboços ({linkedNotes.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    + Nova Nota
                  </button>
                </div>

                {linkedNotes.length === 0 ? (
                  <div className="p-3 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    Nenhuma nota ou rascunho vinculado.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {linkedNotes.map(note => (
                      <div
                        key={note.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {note.title}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">{note.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => startMeetingMode(activeMeeting.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>Conduzir Reunião ao Vivo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Selecione um evento na grade para ver e editar suas mini atas e arquivos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Mini Ata & Attachments Modal */}
      {activeMeeting && (
        <MeetingMiniAtaModal
          meetingId={activeMeeting.id}
          isOpen={isMiniAtaModalOpen}
          onClose={() => setIsMiniAtaModalOpen(false)}
        />
      )}

      {/* Edit Meeting Modal */}
      {isEditModalOpen && editMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Editar Reunião</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Início</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fim</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pauta</label>
                <textarea
                  rows={3}
                  value={editAgenda}
                  onChange={(e) => setEditAgenda(e.target.value)}
                  placeholder="Pauta da reunião..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recorrência</label>
                <select
                  value={editRecurrence}
                  onChange={(e) => setEditRecurrence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="none">Sem recorrência</option>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja realmente excluir esta reunião?')) {
                    deleteMeeting(editMeeting.id);
                    setIsEditModalOpen(false);
                    setEditMeeting(null);
                    if (selectedMeeting?.id === editMeeting.id) setSelectedMeeting(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveEdit();
                    if (editRecurrence !== 'none') handleCreateRecurrence();
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
