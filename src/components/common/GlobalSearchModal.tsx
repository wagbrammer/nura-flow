import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  Mail,
  File,
  Sparkles,
  ArrowRight,
  X,
  Clock,
  Tag as TagIcon
} from 'lucide-react';
import { TagBadge } from './TagBadge';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
    meetings,
    tasks,
    notes,
    projects,
    emails,
    driveFiles,
    tags,
    setCurrentView,
    setSelectedMeetingId,
    setSelectedTaskId,
    setSelectedProjectId,
    setAssistantDraft
  } = useApp();

  const [query, setQuery] = useState('');

  // Reset query on open
  useEffect(() => {
    if (isGlobalSearchOpen) {
      setQuery('');
    }
  }, [isGlobalSearchOpen]);

  // Grouped search results
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return {
        meetings: meetings.slice(0, 3),
        tasks: tasks.filter(t => t.status !== 'done').slice(0, 3),
        notes: notes.slice(0, 3),
        projects: projects.slice(0, 3)
      };
    }

    const q = query.toLowerCase();

    return {
      meetings: meetings.filter(
        m => m.title.toLowerCase().includes(q) || m.agenda.toLowerCase().includes(q)
      ),
      tasks: tasks.filter(
        t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      ),
      notes: notes.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      ),
      projects: projects.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      ),
      emails: emails.filter(
        e => e.subject.toLowerCase().includes(q) || e.snippet.toLowerCase().includes(q) || e.from.name.toLowerCase().includes(q)
      ),
      files: driveFiles.filter(f => f.name.toLowerCase().includes(q))
    };
  }, [query, meetings, tasks, notes, projects, emails, driveFiles]);

  if (!isGlobalSearchOpen) return null;

  const handleSelectMeeting = (id: string) => {
    setSelectedMeetingId(id);
    setCurrentView('meetings');
    setIsGlobalSearchOpen(false);
  };

  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id);
    setCurrentView('tasks');
    setIsGlobalSearchOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('projects');
    setIsGlobalSearchOpen(false);
  };

  const handleAskAI = () => {
    setAssistantDraft(`Analise o histórico e as relações encontradas para: ${query}`);
    setCurrentView('assistant');
    setIsGlobalSearchOpen(false);
  };

  return (
    <div
      id="global-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsGlobalSearchOpen(false)}
    >
      <div
        id="global-search-modal-content"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 gap-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            type="text"
            id="global-search-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em reuniões, notas, tarefas, projetos, e-mails ou arquivos..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm md:text-base font-medium focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Ask AI option */}
          {query.trim() && (
            <button
              type="button"
              onClick={handleAskAI}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Perguntar ao Assistente IA
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-md">
                    "Buscar correlações e histórico de: {query}"
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* Reuniões */}
          {filteredResults.meetings && filteredResults.meetings.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Reuniões & Compromissos
              </span>
              <div className="space-y-1">
                {filteredResults.meetings.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMeeting(m.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {m.title}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                          <span>{m.date}</span>
                          <span>•</span>
                          <span>{m.startTime} às {m.endTime}</span>
                          <span>•</span>
                          <span>{m.participants.length} participantes</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {m.tags.slice(0, 2).map(tagId => (
                        <TagBadge key={tagId} tagId={tagId} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarefas */}
          {filteredResults.tasks && filteredResults.tasks.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 flex items-center gap-1.5 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                Tarefas & Ações
              </span>
              <div className="space-y-1">
                {filteredResults.tasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTask(t.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {t.status === 'in_progress' ? 'Em andamento' : t.status === 'waiting' ? 'Aguardando' : 'A fazer'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Responsável: {t.assignee} • Prazo: {t.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {t.tags.slice(0, 2).map(tagId => (
                        <TagBadge key={tagId} tagId={tagId} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anotações */}
          {filteredResults.notes && filteredResults.notes.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Anotações & Documentos
              </span>
              <div className="space-y-1">
                {filteredResults.notes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setCurrentView('notes');
                      setIsGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        Tipo: {n.type} • {n.content.slice(0, 60)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {n.createdAt.split('T')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projetos */}
          {filteredResults.projects && filteredResults.projects.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 flex items-center gap-1.5 mb-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-purple-600" />
                Projetos
              </span>
              <div className="space-y-1">
                {filteredResults.projects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-md" style={{ backgroundColor: p.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E-mails (if matching) */}
          {filteredResults.emails && filteredResults.emails.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 px-2 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-red-500" />
                Referências de E-mail
              </span>
              <div className="space-y-1">
                {filteredResults.emails.map(e => (
                  <div
                    key={e.id}
                    onClick={() => {
                      setCurrentView('email');
                      setIsGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {e.subject}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        De: {e.from.name} • {e.snippet}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{e.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>NuRa • Memória Operacional</span>
          <div className="flex items-center gap-2">
            <span>Selecione para abrir</span>
          </div>
        </div>
      </div>
    </div>
  );
};
