import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Paperclip,
  PenTool,
  ExternalLink,
  Trash2,
  Tag,
  Edit3,
  RefreshCw,
  FileText,
  Plus,
  CalendarIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateBR, formatRelativeTimeBR } from '../lib/date';
import { Meeting } from '../types';

export const AgendaView: React.FC = () => {
  const {
    meetings,
    notes,
    events,
    activeMeetingId,
    setCurrentView,
    setSelectedMeetingId,
    setIsGlobalSearchOpen,
    setIsQuickCaptureOpen,
    updateMeeting,
    deleteMeeting,
    addMeeting,
    tags,
    addTag,
  } = useApp();

  const activeMeeting = meetings.find(m => m.id === activeMeetingId) || null;

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(meetings[0] || null);
  const [activeDate, setActiveDate] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<string>('none');
  const [isMiniAtaModalOpen, setIsMiniAtaModalOpen] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  // Load Google Calendar events on mount
  useEffect(() => {
    async function loadGoogleEvents() {
      try {
        const res = await fetch('/api/auth/google/status', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.connected) {
          const eventsRes = await fetch('/api/google/calendar/events', { credentials: 'same-origin' });
          const eventsData = await eventsRes.json();
          if (eventsData.events) {
            setGoogleEvents(eventsData.events);
          }
        }
      } catch (err) {
        console.error('Failed to load Google Calendar events:', err);
      }
    }
    loadGoogleEvents();
  }, []);

  const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 to 19:00
  const PIXELS_PER_MINUTE = 1; // 1 pixel per minute for simplicity
  const DAY_START_MINUTES = 8 * 60; // 8:00 AM
  const DAY_END_MINUTES = 19 * 60; // 7:00 PM
  const DAY_HEIGHT = DAY_END_MINUTES - DAY_START_MINUTES; // 660 pixels

  const getWeekDays = (baseDate: Date) => {
    const days: Date[] = [];
    const curr = new Date(baseDate);
    const first = curr.getDate() - curr.getDay() + 1; // Monday start
    for (let i = 0; i < 6; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push(d);
    }
    return days;
  };

  const visibleDays = viewMode === 'day' ? [new Date(activeDate)] : getWeekDays(activeDate);

  const handlePrev = () => {
    const d = new Date(activeDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    setActiveDate(d);
  };

  const handleNext = () => {
    const d = new Date(activeDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    setActiveDate(d);
  };

  const handleToday = () => setActiveDate(new Date());

  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

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

    const newStartMs = parseInt(editStartTime.split(':')[0]) * 3600000 + parseInt(editStartTime.split(':')[1]) * 60000;
    const newEndMs = parseInt(editEndTime.split(':')[0]) * 3600000 + parseInt(editEndTime.split(':')[1]) * 60000;
    const conflicts: { id: string; title: string; startTime: string; endTime: string }[] = [];

    meetings.filter(m => m.date === editDate && m.id !== editMeeting.id).forEach(m => {
      const mStartMs = parseInt(m.startTime.split(':')[0]) * 3600000 + parseInt(m.startTime.split(':')[1]) * 60000;
      const mEndMs = parseInt(m.endTime.split(':')[0]) * 3600000 + parseInt(m.endTime.split(':')[1]) * 60000;
      if (newStartMs < mEndMs && mStartMs < newEndMs) {
        conflicts.push({ id: m.id, title: m.title, startTime: m.startTime, endTime: m.endTime });
      }
    });

    if (conflicts.length > 0) {
      const conflictList = conflicts.map(c => `${c.title} (${c.startTime} - ${c.endTime})`).join('\n');
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
    const instances = 4;

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

  const getEventPosition = (startTime: string, endTime: string) => {
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const dayStartMinutes = 8 * 60;
    const dayEndMinutes = 19 * 60;

    const startOffsetMinutes = Math.max(0, startMinutes - dayStartMinutes);
    const endOffsetMinutes = Math.min(dayEndMinutes - dayStartMinutes, endMinutes - dayStartMinutes);
    const durationMinutes = Math.max(endOffsetMinutes - startOffsetMinutes, 5);

    return {
      top: startOffsetMinutes * PIXELS_PER_MINUTE,
      height: durationMinutes * PIXELS_PER_MINUTE
    };
  };

  // Google Calendar style overlap layout: divide overlapping events into columns
  const computeEventLayout = (events: any[]) => {
    if (events.length === 0) return [];
    const sorted = events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const aStart = parseTimeToMinutes(a.event.startTime);
        const bStart = parseTimeToMinutes(b.event.startTime);
        return aStart - bStart;
      });
    const columnEndTimes: number[] = [];
    const layoutMap = new Map<string, { column: number; maxColumns: number }>();
    for (const { event } of sorted) {
      const start = parseTimeToMinutes(event.startTime);
      const end = parseTimeToMinutes(event.endTime);
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
            <Calendar className="w-5 h-5" />
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
            {activeDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
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
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
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

          {/* Time Grid */}
          <div className="relative">
            <div className="flex">
              {/* Time axis */}
              <div className="w-12 shrink-0">
                {HOURS.map(hour => (
                  <div key={hour} className="h-[60px] text-xs font-mono font-bold text-slate-400 flex items-start pt-0.5">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div
                className="flex-1 grid"
                style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
              >
                {visibleDays.map((d, dayIdx) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  const dayMeetings = meetings.filter(m => m.date === dateStr);
                  const dayGoogleEvents = events.filter(e => e.startDate === dateStr);
                  const allEvents = [...dayMeetings.map(m => ({ ...m, source: 'local' })), ...dayGoogleEvents.map(e => ({ ...e, source: 'google' }))];

                  return (
                    <div
                      key={dayIdx}
                      className={`relative h-[660px] ${
                        isToday ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700' : ''
                      }`}
                    >
                      {/* Hour lines */}
                      {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => (
                        <div
                          key={hour}
                          className="absolute w-full border-t border-slate-200 dark:border-slate-700 left-0"
                          style={{ top: `${(hour - 8) * 60}px` }}
                        />
                      ))}

                      {/* Compute column layout for overlapping events */}
                      {(() => {
                        const layout = computeEventLayout(allEvents);
                        return allEvents.map((event: any) => {
                          const isGoogle = event.source === 'google';
                          const id = event.id;
                          const title = event.title;
                          const startTime = event.startTime;
                          const endTime = event.endTime;
                          const isSelected = activeMeeting?.id === id;
                          const { top, height } = getEventPosition(event.startTime, event.endTime);
                          const hasMiniAta = !isGoogle && Boolean((event as any).miniAta && (event as any).miniAta.trim().length > 0);
                          const filesCount = !isGoogle ? ((event as any).attachments?.length || 0) : 0;
                          const notesCount = !isGoogle ? notes.filter(n => n.meetingId === id).length : 0;

                          // Find layout info for this event
                          const eventIndex = allEvents.indexOf(event);
                          const eventLayout = layout[eventIndex];
                          const { column, maxColumns } = eventLayout || { column: 0, maxColumns: 1 };

                          // Calculate column position and width
                          const colWidth = maxColumns > 1 ? (100 / maxColumns) : 100;
                          const leftOffset = maxColumns > 1 ? (column * colWidth) : 0;
                          const adjustedWidth = maxColumns > 1 ? (colWidth - 1) : 98;

                          return (
                            <div
                              key={id}
                              onClick={() => setSelectedMeeting(event)}
                              className={`absolute rounded-lg cursor-pointer transition-all overflow-hidden ${
                                isSelected
                                  ? (isGoogle ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40' : 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/40')
                                  : (isGoogle ? 'bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100' : 'bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100')
                              }`}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${leftOffset + 1}%`,
                                width: `${adjustedWidth}%`,
                                zIndex: maxColumns > 1 ? 10 + column : 1
                              }}
                            >
                              <div className="p-1 h-full flex flex-col justify-center min-w-0">
                                {height >= 20 ? (
                                  <>
                                    <p className="text-[9px] font-bold leading-tight break-words overflow-hidden">
                                      {title.length > 20 ? title.substring(0, 20) + '...' : title}
                                    </p>
                                    {height >= 35 && (
                                      <p className="text-[8px] opacity-75 mt-0.5">{startTime} - {endTime}</p>
                                    )}
                                    {height >= 50 && (hasMiniAta || filesCount > 0 || notesCount > 0) && (
                                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                        {hasMiniAta && (
                                          <span className="flex items-center gap-0.5 text-[7px]">
                                            <FileText className="w-1.5 h-1.5" /> Ata
                                          </span>
                                        )}
                                        {filesCount > 0 && (
                                          <span className="flex items-center gap-0.5 text-[7px]">
                                            <Paperclip className="w-1.5 h-1.5" /> {filesCount}
                                          </span>
                                        )}
                                        {notesCount > 0 && (
                                          <span className="flex items-center gap-0.5 text-[7px]">
                                            <PenTool className="w-1.5 h-1.5" /> {notesCount}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-[8px] font-bold leading-none overflow-hidden">
                                    {title.length > 10 ? title.substring(0, 10) + '…' : title}
                                  </p>
                                )}
                              </div>
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
        </div>

        {/* Right Drawer */}
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

              {/* Tags */}
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
              </div>

              {/* Mini Ata Preview */}
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
                  {activeMeeting.miniAta || activeMeeting.agenda || 'Nenhuma anotação de ata registrada ainda.'}
                </p>
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

      {/* Edit Modal */}
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