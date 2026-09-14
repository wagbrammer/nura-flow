import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Eye,
  Edit3,
  PenTool,
  Mic,
  Plus,
  Search,
  Trash2,
  Lock,
  Globe,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { DrawingCanvas } from '../components/common/DrawingCanvas';
import { AudioRecorder } from '../components/common/AudioRecorder';
import { Note, NoteType, NotePrivacy } from '../types';
import { formatDateBR } from '../lib/date';

const normalizeNoteContent = (content: string) => content
  .replace(/\\r\\n|\\n|\\r/g, '\n')
  .replace(/\r\n?|\u2028|\u2029/g, '\n')
  .replace(/(^|\n)(\s*#{1,6})(?=\S)/g, '$1$2 ')
  .replace(/\s+(#{1,6})\s+(?=\S)/g, '\n$1 ')
  .trim();

const cleanNoteSnippet = (content: string) => normalizeNoteContent(content)
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/^[-*]\s+/gm, '')
  .replace(/^\d+[.)]\s+/gm, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const InlineNoteText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${part}-${index}`} className="font-extrabold text-slate-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      )
    )}
  </>
);

const NoteTextPreview: React.FC<{ content: string }> = ({ content }) => {
  const normalizedContent = normalizeNoteContent(content);

  if (!normalizedContent) {
    return <p className="text-sm text-slate-400">Esta nota ainda não possui conteúdo.</p>;
  }

  return (
    <article className="min-h-[420px] rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-inner dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:p-7">
      {normalizedContent.split('\n').map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={`space-${index}`} className="h-3" aria-hidden="true" />;
        const heading = line.match(/^(#{1,6})\s*(.*)$/);
        if (heading) {
          const level = heading[1].length;
          const headingText = heading[2];
          if (level === 1) {
            return <h2 key={index} className="mb-4 break-words text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl"><InlineNoteText text={headingText} /></h2>;
          }
          if (level === 2) {
            return <h3 key={index} className="mb-2 mt-6 break-words border-b border-slate-200 pb-2 text-lg font-extrabold text-emerald-800 first:mt-0 dark:border-slate-800 dark:text-emerald-300"><InlineNoteText text={headingText} /></h3>;
          }
          return <h4 key={index} className="mb-2 mt-5 break-words text-base font-extrabold text-slate-900 first:mt-0 dark:text-white"><InlineNoteText text={headingText} /></h4>;
        }
        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={index} className="mb-2 flex items-start gap-3 pl-1 text-sm leading-7 sm:text-base">
              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />
              <p><InlineNoteText text={line.replace(/^[-*]\s+/, '')} /></p>
            </div>
          );
        }
        const orderedItem = line.match(/^(\d+)[.)]\s+(.*)$/);
        if (orderedItem) {
          return (
            <div key={index} className="mb-2 flex items-start gap-3 text-sm leading-7 sm:text-base">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-emerald-100 px-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{orderedItem[1]}</span>
              <p><InlineNoteText text={orderedItem[2]} /></p>
            </div>
          );
        }
        return <p key={index} className="mb-3 break-words text-sm leading-7 sm:text-base"><InlineNoteText text={line} /></p>;
      })}
    </article>
  );
};

export const NotesView: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote, projects, meetings, tags, addTask, user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [textViewMode, setTextViewMode] = useState<'preview' | 'edit'>('preview');

  // New note form
  const [newType, setNewType] = useState<NoteType>('text');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newMeetingId, setNewMeetingId] = useState<string>('');
  const [newPrivacy, setNewPrivacy] = useState<NotePrivacy>('private');

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || n.type === selectedType;
    return matchesSearch && matchesType;
  });

  const activeNote = notes.find(n => n.id === selectedNoteId) || filteredNotes[0] || null;

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addNote({
      title: newTitle.trim(),
      type: newType,
      content: newContent.trim(),
      projectId: newProjectId || undefined,
      meetingId: newMeetingId || undefined,
      privacy: newPrivacy,
      tags: []
    });

    setIsCreating(false);
    setNewTitle('');
    setNewContent('');
    setNewMeetingId('');
  };

  const handleConvertNoteToTask = (note: Note) => {
    addTask({
      title: `Ação baseada em: ${note.title}`,
      description: note.content.slice(0, 300),
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      projectId: note.projectId,
      originType: 'manual'
    });
    alert('Tarefa criada a partir da nota!');
  };

  return (
    <div id="notes-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-lg font-extrabold leading-tight text-slate-900 dark:text-slate-100 sm:text-xl">
              Notas, Desenho & Memória de Conhecimento
            </h1>
            <p className="text-xs text-slate-500">
              Anotações ricas, esboços manuais e gravações de voz integradas
            </p>
          </div>
        </div>

        <button
          type="button"
          id="new-note-btn"
          onClick={() => setIsCreating(true)}
          className="flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Nota</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex min-h-11 items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar em notas, ideias e transcrições..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex max-w-full items-center gap-1 overflow-x-auto bg-slate-100 p-1 text-xs dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={`min-h-10 px-3 py-1 rounded-lg text-xs font-semibold ${
              selectedType === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Todas ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('text')}
            className={`flex min-h-10 items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
              selectedType === 'text' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Texto</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('drawing')}
            className={`flex min-h-10 items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
              selectedType === 'drawing' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>Desenho / Stylus</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('audio')}
            className={`flex min-h-10 items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
              selectedType === 'audio' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>Áudio / Voz</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Notes list + Active note editor */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Notes List Column (4 cols) */}
        <div className="xl:col-span-4 space-y-3">
          {filteredNotes.map(n => {
            const isSelected = activeNote?.id === n.id;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedNoteId(n.id);
                  setTextViewMode('preview');
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    {n.type === 'drawing' ? (
                      <PenTool className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : n.type === 'audio' ? (
                      <Mic className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <h3 className="min-w-0 break-words text-xs font-bold leading-snug text-slate-900 line-clamp-2 dark:text-slate-100 sm:text-sm">
                      {n.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDateBR(n.createdAt)}
                  </span>
                </div>

                <p className="mt-2 break-words text-xs leading-relaxed text-slate-500 line-clamp-3">
                  {cleanNoteSnippet(n.content) || (n.type === 'drawing' ? 'Esboço visual manuscrito' : 'Gravação de voz')}
                </p>

                {n.drawingData?.previewUrl && (
                  <div className="mt-2 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-700">
                    <img
                      src={n.drawingData.previewUrl}
                      alt="Preview do desenho"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {n.meetingId && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    <Calendar className="w-2.5 h-2.5" />
                    <span className="truncate">
                      Reunião: {meetings.find(m => m.id === n.meetingId)?.title || 'Compromisso'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    {n.privacy === 'private' ? (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Privado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Equipe
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {n.tags.map(tId => (
                      <TagBadge key={tId} tagId={tId} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Note Editor (8 cols) */}
        <div className="min-w-0 xl:col-span-8">
          {activeNote ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                      {activeNote.type === 'drawing' ? 'Esboço / Stylus' : activeNote.type === 'audio' ? 'Gravação de Voz' : 'Documento de Texto'}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(activeNote.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-500 w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleConvertNoteToTask(activeNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    title="Converter conteúdo em tarefa"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Criar Tarefa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteNote(activeNote.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Excluir nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Linked Meeting Banner if applicable */}
              {activeNote.meetingId && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">
                      Nota vinculada ao compromisso: {meetings.find(m => m.id === activeNote.meetingId)?.title || 'Reunião'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                    {meetings.find(m => m.id === activeNote.meetingId) ? formatDateBR(meetings.find(m => m.id === activeNote.meetingId)!.date) : ''}
                  </span>
                </div>
              )}

              {/* Note Content by Type */}
              {activeNote.type === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="hidden pl-2 text-xs text-slate-500 sm:block">
                      Visualização formatada para títulos, tópicos e listas.
                    </p>
                    <div className="ml-auto flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setTextViewMode('preview')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${textViewMode === 'preview' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Visualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextViewMode('edit')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${textViewMode === 'edit' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                  </div>

                  {textViewMode === 'preview' ? (
                    <NoteTextPreview content={activeNote.content} />
                  ) : (
                    <textarea
                      rows={16}
                      value={activeNote.content}
                      onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                      placeholder="Escreva suas anotações, atas ou planejamento em texto..."
                      className="min-h-[420px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-5 font-sans text-base leading-7 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:p-6"
                    />
                  )}
                </div>
              )}

              {activeNote.type === 'drawing' && (
                <div className="space-y-2">
                  <DrawingCanvas
                    initialData={activeNote.drawingData}
                    onChange={(data) => updateNote(activeNote.id, { drawingData: data })}
                    height={440}
                  />
                </div>
              )}

              {activeNote.type === 'audio' && (
                <div className="space-y-4">
                  <AudioRecorder
                    initialAudio={activeNote.audioData}
                    onSave={(data) => updateNote(activeNote.id, { audioData: data, content: data.transcript || activeNote.content })}
                  />

                  {activeNote.audioData?.transcript && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Transcrição & Notas:
                      </span>
                      <textarea
                        rows={5}
                        value={activeNote.content}
                        onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Selecione uma nota ou crie uma nova.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div
          id="new-note-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreating(false)}
        >
          <div
            id="new-note-modal-content"
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Criar Nova Nota de Conhecimento
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewType('text')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  newType === 'text'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Texto / Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setNewType('drawing')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  newType === 'drawing'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <PenTool className="w-5 h-5" />
                <span>Desenho / Stylus</span>
              </button>

              <button
                type="button"
                onClick={() => setNewType('audio')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  newType === 'audio'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mic className="w-5 h-5" />
                <span>Áudio / Voz</span>
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Nota *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Estrutura da Campanha de Implementos"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {newType === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Conteúdo Inicial
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Digite suas observações..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Projeto Vinculado
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Compromisso / Calendário Vinculado
                </label>
                <select
                  value={newMeetingId}
                  onChange={(e) => setNewMeetingId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
                >
                  <option value="">Nenhum compromisso específico</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>
                      {formatDateBR(m.date)} - {m.title} ({m.startTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Criar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
