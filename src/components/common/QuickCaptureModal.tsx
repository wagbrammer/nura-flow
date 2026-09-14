import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckSquare,
  FileText,
  Mic,
  Calendar,
  Lightbulb,
  Plus,
  ArrowRight
} from 'lucide-react';
import { TaskPriority } from '../../types';
import { AudioRecorder } from './AudioRecorder';

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    addTask,
    addNote,
    addMeeting,
    addInboxItem,
    projects,
    tags,
    addTag,
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<'task' | 'note' | 'audio' | 'event' | 'idea'>('task');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskProjectId, setTaskProjectId] = useState<string>(projects[0]?.id || '');
  const [taskSelectedTags, setTaskSelectedTags] = useState<string[]>([]);
  const [isCreatingTaskTag, setIsCreatingTaskTag] = useState(false);
  const [taskTagName, setTaskTagName] = useState('');

  // Note form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteProjectId, setNoteProjectId] = useState<string>('');
  const [noteSelectedTags, setNoteSelectedTags] = useState<string[]>([]);
  const [isCreatingNoteTag, setIsCreatingNoteTag] = useState(false);
  const [noteTagName, setNoteTagName] = useState('');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventStartTime, setEventStartTime] = useState('14:00');
  const [eventEndTime, setEventEndTime] = useState('15:00');
  const [eventAgenda, setEventAgenda] = useState('');
  const [eventSelectedTags, setEventSelectedTags] = useState<string[]>([]);
  const [isCreatingEventTag, setIsCreatingEventTag] = useState(false);
  const [eventTagName, setEventTagName] = useState('');

  // Idea/Inbox form
  const [ideaContent, setIdeaContent] = useState('');
  const [ideaSelectedTags, setIdeaSelectedTags] = useState<string[]>([]);
  const [isCreatingIdeaTag, setIsCreatingIdeaTag] = useState(false);
  const [ideaTagName, setIdeaTagName] = useState('');

  if (!isQuickCaptureOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      dueDate: taskDueDate,
      priority: taskPriority,
      projectId: taskProjectId || undefined,
      tags: taskSelectedTags,
      assignee: user.name,
      assigneeEmail: user.email,
      originType: 'manual'
    });

    setTaskTitle('');
    setTaskDesc('');
    setTaskSelectedTags([]);
    setIsQuickCaptureOpen(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      projectId: noteProjectId || undefined,
      type: 'text',
      privacy: 'private',
      tags: noteSelectedTags
    });

    setNoteTitle('');
    setNoteContent('');
    setNoteSelectedTags([]);
    setIsQuickCaptureOpen(false);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    addMeeting({
      title: eventTitle.trim(),
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      agenda: eventAgenda.trim(),
      tags: eventSelectedTags
    });

    setEventTitle('');
    setEventAgenda('');
    setEventSelectedTags([]);
    setIsQuickCaptureOpen(false);
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaContent.trim()) return;

    addInboxItem({
      type: 'idea',
      content: ideaContent.trim(),
      tags: ideaSelectedTags
    });

    setIdeaContent('');
    setIdeaSelectedTags([]);
    setIsQuickCaptureOpen(false);
  };

  const toggleTag = (tagId: string) => {
    setTaskSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div
      id="quick-capture-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsQuickCaptureOpen(false)}
    >
      <div
        id="quick-capture-modal-content"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Captura Rápida
              </h3>
              <p className="text-xs text-slate-500">
                Registre uma ação, pensamento ou reunião instantaneamente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickCaptureOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'task'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tarefa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('note')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'note'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nota</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Áudio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('event')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'event'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reunião</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('idea')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'idea'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Inbox</span>
          </button>
        </div>

        {/* Tab Forms */}
        <div className="p-5 overflow-y-auto">
          {/* TASK TAB */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Revisar campanha Google Ads"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição ou Contexto
                </label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detalhes opcionais..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Projeto
                </label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sem Projeto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Selector & Inline Creator for Tasks */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags da Tarefa
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTaskTag(!isCreatingTaskTag)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar nova tag</span>
                  </button>
                </div>

                {isCreatingTaskTag && (
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da tag (ex: Financeiro)..."
                      value={taskTagName}
                      onChange={e => setTaskTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (taskTagName.trim()) {
                          const created = addTag({ name: taskTagName.trim() });
                          setTaskSelectedTags(prev => [...prev, created.id]);
                          setTaskTagName('');
                          setIsCreatingTaskTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTaskTag(false)}
                      className="text-xs text-slate-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const isSelected = taskSelectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          )}

          {/* NOTE TAB */}
          {activeTab === 'note' && (
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Nota *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ex: Pontos estratégicos da nova linha"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Conteúdo
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Digite suas anotações, ideias ou lista de tópicos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Projeto Vinculado
                </label>
                <select
                  value={noteProjectId}
                  onChange={(e) => setNoteProjectId(e.target.value)}
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

              {/* Tags Selector for Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags da Nota
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNoteTag(!isCreatingNoteTag)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar nova tag</span>
                  </button>
                </div>

                {isCreatingNoteTag && (
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da tag..."
                      value={noteTagName}
                      onChange={e => setNoteTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (noteTagName.trim()) {
                          const created = addTag({ name: noteTagName.trim() });
                          setNoteSelectedTags(prev => [...prev, created.id]);
                          setNoteTagName('');
                          setIsCreatingNoteTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNoteTag(false)}
                      className="text-xs text-slate-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const isSelected = noteSelectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setNoteSelectedTags(prev =>
                            isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <AudioRecorder
                onSave={(audioData) => {
                  addNote({
                    title: `Gravação de Voz (${new Date().toLocaleDateString('pt-BR')})`,
                    type: 'audio',
                    content: audioData.transcript || 'Gravação rápida capturada',
                    audioData,
                    privacy: 'private'
                  });
                  setIsQuickCaptureOpen(false);
                }}
              />
              <p className="text-xs text-slate-500 text-center">
                O áudio será salvo como nota. A transcrição exige uma chave Gemini configurada no servidor.
              </p>
            </div>
          )}

          {/* EVENT / MEETING TAB */}
          {activeTab === 'event' && (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Reunião *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ex: Alinhamento de Vendas & Suprimentos"
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
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Início
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pauta
                </label>
                <textarea
                  rows={3}
                  value={eventAgenda}
                  onChange={(e) => setEventAgenda(e.target.value)}
                  placeholder="Tópicos que serão discutidos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tags Selector & Inline Creator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags da Reunião
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingEventTag(!isCreatingEventTag)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Criar nova tag</span>
                  </button>
                </div>

                {isCreatingEventTag && (
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da tag (ex: Diretoria)..."
                      value={eventTagName}
                      onChange={(e) => setEventTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (eventTagName.trim()) {
                          const created = addTag({ name: eventTagName.trim() });
                          setEventSelectedTags(prev => [...prev, created.id]);
                          setEventTagName('');
                          setIsCreatingEventTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingEventTag(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const isSelected = eventSelectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setEventSelectedTags(prev =>
                            isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]
                          );
                        }}
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Agendar Reunião
                </button>
              </div>
            </form>
          )}

          {/* INBOX / QUICK IDEA TAB */}
          {activeTab === 'idea' && (
            <form onSubmit={handleCreateIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Captura Rápida (Inbox)
                </label>
                <textarea
                  rows={3}
                  autoFocus
                  required
                  value={ideaContent}
                  onChange={(e) => setIdeaContent(e.target.value)}
                  placeholder="Capture uma ideia rápida, pensamento ou lembrete para triar depois..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tags Selector for Inbox Idea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingIdeaTag(!isCreatingIdeaTag)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar nova tag</span>
                  </button>
                </div>

                {isCreatingIdeaTag && (
                  <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome da tag..."
                      value={ideaTagName}
                      onChange={e => setIdeaTagName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (ideaTagName.trim()) {
                          const created = addTag({ name: ideaTagName.trim() });
                          setIdeaSelectedTags(prev => [...prev, created.id]);
                          setIdeaTagName('');
                          setIsCreatingIdeaTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingIdeaTag(false)}
                      className="text-xs text-slate-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => {
                    const isSelected = ideaSelectedTags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setIdeaSelectedTags(prev =>
                            isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]
                          );
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCaptureOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Salvar na Inbox
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
