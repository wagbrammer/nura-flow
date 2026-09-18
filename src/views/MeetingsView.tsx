import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  Radio,
  Sparkles,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  Filter,
  Paperclip,
  PenTool,
  Mic,
  Save,
  Trash2,
  ExternalLink,
  Edit3,
  Volume2,
  X
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { MEETING_TEMPLATES } from '../lib/constants';
import { MeetingMiniAtaModal } from '../components/common/MeetingMiniAtaModal';
import { formatDateBR } from '../lib/date';
import { getAllAudioRecordings, getAudioRecording } from '../lib/audioStorage';
import { AudioNoteData, Meeting, Participant } from '../types';
import { GoogleContactsPicker } from '../components/common/GoogleContactsPicker';

export const MeetingsView: React.FC = () => {
  const {
    meetings,
    notes,
    selectedMeetingId,
    setSelectedMeetingId,
    startMeetingMode,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingMiniAta,
    addAttachmentToMeeting,
    removeAttachmentFromMeeting,
    addNoteToMeeting,
    tags,
    addTag,
    projects
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMiniAtaModalOpen, setIsMiniAtaModalOpen] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);

  // Fetch Google Calendar events on mount
  useEffect(() => {
    const fetchGoogleEvents = async () => {
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
      } catch {}
    };
    fetchGoogleEvents();
  }, []);

  // Quick tag creator in modal
  const [isCreatingInlineTag, setIsCreatingInlineTag] = useState(false);
  const [inlineTagName, setInlineTagName] = useState('');

  // Tag manager state in detail panel
  const [isDetailTagPickerOpen, setIsDetailTagPickerOpen] = useState(false);
  const [isCreatingDetailTag, setIsCreatingDetailTag] = useState(false);
  const [detailTagName, setDetailTagName] = useState('');

  // In-place Mini Ata editor state
  const [miniAtaContent, setMiniAtaContent] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // New meeting form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newAgenda, setNewAgenda] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([]);
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newParticipants, setNewParticipants] = useState<Participant[]>([]);
  const [isContactsPickerOpen, setIsContactsPickerOpen] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editRecurrence, setEditRecurrence] = useState<string>('none');

  // Combine local meetings with Google Calendar events
  const allMeetings = [...meetings, ...(showGoogleEvents ? googleEvents : [])];

  // Helper to check if meeting is from Google
  const isGoogleMeeting = (m: any) => m.isGoogleEvent || m.googleEventId;

  const filteredMeetings = allMeetings.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.agenda && m.agenda.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    // Skip tag/status filters for Google events (they don't have these properties)
    const isGoogle = isGoogleMeeting(m);
    const matchesTag = isGoogle || selectedTag === 'all' || (m.tags || []).includes(selectedTag);
    const matchesStatus = isGoogle || statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesTag && matchesStatus;
  });

  const activeSelectedMeeting = allMeetings.find(m => m.id === selectedMeetingId) || filteredMeetings[0] || null;
  const linkedNotes = activeSelectedMeeting ? notes.filter(n => n.meetingId === activeSelectedMeeting.id) : [];

  // Load audio recordings for the active meeting from IndexedDB
  const [meetingAudioRecordings, setMeetingAudioRecordings] = useState<AudioNoteData[]>([]);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = React.useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Revoke previous blob URLs
    blobUrlsRef.current.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
    blobUrlsRef.current = [];

    const load = async () => {
      if (!activeSelectedMeeting) { setMeetingAudioRecordings([]); return; }
      const all = await getAllAudioRecordings();
      const recordings: AudioNoteData[] = [];
      await Promise.all(all.filter(r => r.meetingId === activeSelectedMeeting.id).map(async r => {
        if (cancelled) return;
        try {
          const record = await getAudioRecording(r.id);
          if (!record || cancelled) return;
          const blob = new Blob([record.dataUrl], { type: record.mimeType });
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
          recordings.push({ audioUrl: url, durationSeconds: record.durationSeconds, transcript: '', keyTopics: [], suggestedActionItems: [], decisions: [] });
        } catch { /* skip */ }
      }));
      if (!cancelled) setMeetingAudioRecordings(recordings);
    };
    load();
    return () => { cancelled = true; blobUrlsRef.current.forEach(url => { try { URL.revokeObjectURL(url); } catch {} }); };
  }, [activeSelectedMeeting?.id]);

  const handlePlayAudio = (id: string, src: string) => {
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
    if (isPlayingAudioId === id) { setIsPlayingAudioId(null); return; }
    const el = new Audio(src);
    el.onended = () => setIsPlayingAudioId(null);
    audioElRef.current = el;
    setIsPlayingAudioId(id);
    el.play().catch(() => setIsPlayingAudioId(null));
  };

  const handleSaveInPlaceMiniAta = () => {
    if (activeSelectedMeeting && !isGoogleMeeting(activeSelectedMeeting)) {
      updateMeetingMiniAta(activeSelectedMeeting.id, miniAtaContent);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    if (!activeSelectedMeeting || isGoogleMeeting(activeSelectedMeeting)) return;
    setSelectedTemplateId(templateId);
    const tmpl = MEETING_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setNewTitle(tmpl.name);
      setNewAgenda(tmpl.agendaStructure);
    }
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addMeeting({
      title: newTitle.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      agenda: newAgenda.trim(),
      tags: newSelectedTags,
      projectId: newProjectId || undefined,
      participants: newParticipants.length > 0
        ? newParticipants
        : [{ name: 'Wagner Brammer', email: 'wagner.brammer@gmail.com', role: 'Organizador', status: 'accepted' }]
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewAgenda('');
  };

  // Edit handlers
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
    updateMeeting(editMeeting.id, {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      agenda: editAgenda.trim(),
      recurrenceRule: (editRecurrence !== 'none' ? editRecurrence : undefined) as Meeting['recurrenceRule']
    });
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

  const toggleTag = (id: string) => {
    setNewSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div id="meetings-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Hub de Reuniões & Atas
            </h1>
            <p className="text-xs text-slate-500">
              Preparação, condução em tempo real e síntese opcional com IA
            </p>
          </div>
        </div>

        <button
          type="button"
          id="new-meeting-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Reunião</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="flex min-h-11 items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar reuniões..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          {(['all', 'scheduled', 'in_progress', 'completed'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`min-h-10 px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {status === 'all' ? 'Todas' : status === 'scheduled' ? 'Agendadas' : status === 'in_progress' ? 'Em Curso' : 'Concluídas'}
            </button>
          ))}
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`min-h-10 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              selectedTag === 'all' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Todas Tags
          </button>
          {tags.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTag(t.id)}
              className={`min-h-10 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedTag === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Meeting Cards List + Detailed Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Meetings List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredMeetings.map(m => {
            const isSelected = activeSelectedMeeting?.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMeetingId(m.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {formatDateBR(m.date)} • {m.startTime} às {m.endTime}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                          {m.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isGoogleMeeting(m) && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMeeting(m);
                              }}
                              className="p-1 rounded transition-colors text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-white dark:hover:bg-emerald-700"
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
                                  if (selectedMeetingId === m.id) setSelectedMeetingId(null);
                                }
                              }}
                              className="p-1 rounded transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-white dark:hover:bg-red-950"
                              title="Excluir reunião"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isGoogleMeeting(m)
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : m.status === 'completed'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : m.status === 'in_progress'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {isGoogleMeeting(m) ? 'Google Calendar' : m.status === 'completed' ? 'Concluída' : m.status === 'in_progress' ? 'Em Andamento' : 'Agendada'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {m.agenda || m.description || ''}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {!isGoogleMeeting(m) && m.tags && m.tags.map(tagId => (
                    <TagBadge key={tagId} tagId={tagId} />
                  ))}

                  {isGoogleMeeting(m) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      Google
                    </span>
                  )}

                  {Boolean(m.miniAta && m.miniAta.trim().length > 0) && !isGoogleMeeting(m) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" />
                      Ata
                    </span>
                  )}

                  {(m.attachments?.length || 0) > 0 && !isGoogleMeeting(m) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1">
                      <Paperclip className="w-2.5 h-2.5" />
                      {m.attachments.length}
                    </span>
                  )}

                  {!isGoogleMeeting(m) && (
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {m.participants.length} participantes
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMeetings.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma reunião encontrada com os filtros atuais.</p>
            </div>
          )}
        </div>

        {/* Meeting Detail & Preparation Panel (7 cols) */}
        <div className="lg:col-span-7">
          {activeSelectedMeeting ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {formatDateBR(activeSelectedMeeting.date)}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeSelectedMeeting.startTime} - {activeSelectedMeeting.endTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {activeSelectedMeeting.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Workspace da Ata</span>
                  </button>

                  <button
                    type="button"
                    id="active-meeting-mode-btn"
                    onClick={() => !isGoogleMeeting(activeSelectedMeeting) && startMeetingMode(activeSelectedMeeting.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Modo Reunião</span>
                  </button>
                </div>
              </div>

              {/* TAGS & CATEGORIAS (Editáveis em Tempo Real) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Tags da Reunião ({activeSelectedMeeting.tags?.length || 0})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDetailTagPickerOpen(!isDetailTagPickerOpen)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDetailTagPickerOpen ? 'Fechar Editor' : 'Editar / Adicionar Tags'}</span>
                    </button>
                  </div>
                </div>

                {/* Active Tags on Meeting */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(!activeSelectedMeeting.tags || activeSelectedMeeting.tags.length === 0) ? (
                    <span className="text-xs text-slate-400 italic">Nenhuma tag vinculada a esta reunião.</span>
                  ) : (
                    activeSelectedMeeting.tags.map(tagId => {
                      const tagObj = tags.find(t => t.id === tagId);
                      if (!tagObj) return null;
                      return (
                        <div
                          key={tagId}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
                          style={{
                            backgroundColor: `${tagObj.color || '#059669'}18`,
                            borderColor: `${tagObj.color || '#059669'}40`,
                            color: tagObj.color || '#059669'
                          }}
                        >
                          <span>{tagObj.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = activeSelectedMeeting.tags.filter(t => t !== tagId);
                              updateMeeting(activeSelectedMeeting.id, { tags: updated });
                            }}
                            className="hover:opacity-75 p-0.5 rounded"
                            title="Remover tag desta reunião"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inline Tag Picker & Creator for this meeting */}
                {isDetailTagPickerOpen && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Clique para alternar:</span>
                      {tags.map(t => {
                        const isAssigned = activeSelectedMeeting.tags?.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              const current = activeSelectedMeeting.tags || [];
                              const updated = isAssigned
                                ? current.filter(id => id !== t.id)
                                : [...current, t.id];
                              updateMeeting(activeSelectedMeeting.id, { tags: updated });
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                              isAssigned
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            <span>{t.name}</span>
                            {isAssigned ? <span>✓</span> : <span className="text-slate-400">+</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Create New Tag */}
                    <div className="flex items-center gap-2 pt-1">
                      {!isCreatingDetailTag ? (
                        <button
                          type="button"
                          onClick={() => setIsCreatingDetailTag(true)}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Criar nova tag no sistema e aplicar</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full max-w-sm">
                          <input
                            type="text"
                            placeholder="Nome da nova tag..."
                            value={detailTagName}
                            onChange={(e) => setDetailTagName(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (detailTagName.trim()) {
                                const created = addTag({ name: detailTagName.trim() });
                                const current = activeSelectedMeeting.tags || [];
                                updateMeeting(activeSelectedMeeting.id, { tags: [...current, created.id] });
                                setDetailTagName('');
                                setIsCreatingDetailTag(false);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailTagName('');
                              setIsCreatingDetailTag(false);
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 px-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* MINI ATA DO COMPROMISSO (Core Feature) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Mini Ata & Deliberações do Compromisso
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSavedNotice && (
                      <span className="text-xs text-emerald-600 font-semibold animate-pulse">
                        ✓ Salvo!
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMiniAtaModalOpen(true)}
                      className="text-xs text-emerald-600 hover:underline font-bold"
                    >
                      Modo Reunião
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  defaultValue={activeSelectedMeeting.miniAta || activeSelectedMeeting.agenda || ''}
                  onBlur={(e) => updateMeetingMiniAta(activeSelectedMeeting.id, e.target.value)}
                  placeholder="Escreva aqui a mini ata, deliberações e acordos firmados durante este compromisso (salva automaticamente ao sair do campo)..."
                  className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Edição em tempo real vinculada ao evento.</span>
                  <span className="text-emerald-600 font-medium">Auto-save habilitado</span>
                </div>
              </div>

              {/* ARQUIVOS & DOCUMENTOS ANEXADOS AO COMPROMISSO */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Arquivos & Documentos Vinculados ({activeSelectedMeeting.attachments?.length || 0})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    + Gerenciar Anexos
                  </button>
                </div>

                {(!activeSelectedMeeting.attachments || activeSelectedMeeting.attachments.length === 0) ? (
                  <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    Nenhuma referência de arquivo vinculada a este compromisso.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeSelectedMeeting.attachments.map(att => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{att.size}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => alert(`Visualizando: ${att.name}`)}
                            className="p-1 text-slate-400 hover:text-emerald-600"
                            title="Abrir arquivo"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAttachmentFromMeeting(activeSelectedMeeting.id, att.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Remover anexo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ANOTAÇÕES & RASCUNHOS VINCULADOS */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Notas & Rascunhos Vinculados ({linkedNotes.length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMiniAtaModalOpen(true)}
                    className="text-xs text-purple-600 hover:underline font-bold"
                  >
                    + Nova Nota Vinculada
                  </button>
                </div>

                {linkedNotes.length === 0 ? (
                  <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    Nenhuma nota stylus, texto ou gravação vinculada a esta reunião.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedNotes.map(note => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{note.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{note.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize shrink-0 ml-2">{note.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ÁUDIOS GRAVADOS NA REUNIÃO */}
              {activeSelectedMeeting && (
                <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Áudios Gravados ({meetingAudioRecordings.length})
                      </span>
                    </div>
                  </div>

                  {meetingAudioRecordings.length === 0 ? (
                    <div className="p-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                      Nenhuma gravação de áudio nesta reunião.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {meetingAudioRecordings.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              Gravação {idx + 1}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {Math.floor((rec.durationSeconds || 0) / 60)}min {(rec.durationSeconds || 0) % 60}s
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => rec.audioUrl && handlePlayAudio(`rec-${idx}`, rec.audioUrl)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isPlayingAudioId === `rec-${idx}`
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {isPlayingAudioId === `rec-${idx}` ? '⏸ Pausar' : '▶ Ouvir'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Agenda Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pauta Original & Objetivos
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activeSelectedMeeting.agenda}
                </div>
              </div>

              {/* Participantes */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Participantes ({activeSelectedMeeting.participants.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeSelectedMeeting.participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.role || p.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ata / Resumo Gerado por IA (if available) */}
              {activeSelectedMeeting.summary && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Ata & Síntese Estruturada
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono">Registrada no NuRa</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeSelectedMeeting.summary.executiveSummary}
                  </p>

                  {/* Decisions */}
                  {activeSelectedMeeting.summary.decisions?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Decisões Tomadas:
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 mt-1 space-y-1">
                        {activeSelectedMeeting.summary.decisions.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {activeSelectedMeeting.summary.actionItems?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Plano de Ação & Responsáveis:
                      </span>
                      <div className="space-y-1.5 mt-1.5">
                        {activeSelectedMeeting.summary.actionItems.map((act, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/70 dark:bg-slate-900/60">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{act.task}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{act.assignee} ({act.dueDate})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Selecione uma reunião para ver o resumo completo ou conduzir.</p>
            </div>
          )}
        </div>
      </div>

      {/* Agendar Nova Reunião Modal */}
      {isCreateModalOpen && (
        <div
          id="new-meeting-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            id="new-meeting-modal-content"
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Nova Reunião / Alinhamento
                  </h3>
                  <p className="text-xs text-slate-500">Configure pauta, horário e modelos pré-definidos</p>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Modelos de Reunião Rápidos:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MEETING_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleApplyTemplate(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      selectedTemplateId === t.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Reunião *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Alinhamento de Marketing & Vendas"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pauta e Itens de Discussão
                </label>
                <textarea
                  rows={4}
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  placeholder="Escreva os tópicos da pauta..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Projeto Vinculado
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Geral / Sem Projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags da Reunião
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInlineTag(!isCreatingInlineTag)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar nova tag</span>
                  </button>
                </div>

                {isCreatingInlineTag && (
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da tag (ex: Diretoria)..."
                      value={inlineTagName}
                      onChange={(e) => setInlineTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineTagName.trim()) {
                          const created = addTag({ name: inlineTagName.trim() });
                          setNewSelectedTags(prev => [...prev, created.id]);
                          setInlineTagName('');
                          setIsCreatingInlineTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineTag(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const isSelected = newSelectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                {/* Participants section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Participantes ({newParticipants.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsContactsPickerOpen(true)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Buscar no Google</span>
                    </button>
                  </div>

                  {newParticipants.length > 0 ? (
                    <div className="space-y-1.5">
                      {newParticipants.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {p.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewParticipants(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhum participante selecionado</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar Reunião
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Contacts Picker */}
      <GoogleContactsPicker
        open={isContactsPickerOpen}
        onClose={() => setIsContactsPickerOpen(false)}
        onAddParticipants={(participants) => {
          setNewParticipants(prev => [...prev, ...participants]);
          setIsContactsPickerOpen(false);
        }}
        existingParticipants={newParticipants}
      />
      {/* Meeting Mini Ata & Attachments Modal */}
      {activeSelectedMeeting && (
        <MeetingMiniAtaModal
          meetingId={activeSelectedMeeting.id}
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
                    if (selectedMeetingId === editMeeting.id) setSelectedMeetingId(null);
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
