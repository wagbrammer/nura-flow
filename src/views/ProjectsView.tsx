import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FolderKanban,
  Plus,
  TrendingUp,
  CheckSquare,
  Calendar,
  FileText,
  Users,
  Flag,
  ArrowRight,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { ProjectEditModal } from '../components/common/ProjectEditModal';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    tasks,
    meetings,
    notes,
    selectedProjectId,
    setSelectedProjectId,
    addProject,
    deleteProject,
    setCurrentView,
    setSelectedMeetingId
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#15803d');

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

  const projectTasks = tasks.filter(t => t.projectId === activeProject?.id);
  const projectMeetings = meetings.filter(m => m.projectId === activeProject?.id);
  const projectNotes = notes.filter(n => n.projectId === activeProject?.id);

  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const progressCalc = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : activeProject?.progress || 0;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    addProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      color: newProjectColor,
      progress: 0,
      milestones: []
    });

    setIsCreateOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  return (
    <div id="projects-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Espaços de Projetos NuRa
            </h1>
            <p className="text-xs text-slate-500">
              Iniciativas estratégicas, cronogramas, marcos e entregas conectadas
            </p>
          </div>
        </div>

        <button
          type="button"
          id="new-project-btn"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => {
          const isSelected = activeProject?.id === p.id;
          const pTasks = tasks.filter(t => t.projectId === p.id);
          const pDone = pTasks.filter(t => t.status === 'done').length;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`p-5 rounded-3xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: p.color }} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {p.name}
                  </h3>
                </div>
                <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400">
                  {p.progress}%
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {p.description}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${p.progress}%`, backgroundColor: p.color }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{pTasks.length} tarefas ({pDone} concluídas)</span>
                <div className="flex items-center gap-2">
                  <span>{p.milestones.length} marcos</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProjectId(p.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar Projeto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Space Detail */}
      {activeProject && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-4 h-8 rounded-full" style={{ backgroundColor: activeProject.color }} />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {activeProject.name}
                </h2>
                <p className="text-xs text-slate-500">{activeProject.description}</p>
                {activeProject.lead && (
                  <p className="text-[11px] text-slate-400 mt-1">Líder: <span className="font-semibold text-slate-600 dark:text-slate-300">{activeProject.lead}</span></p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingProjectId(activeProject.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editar Projeto</span>
              </button>

              <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400">Progresso Geral</span>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                  {progressCalc}%
                </p>
              </div>
            </div>
          </div>

          {/* Connected Milestones */}
          {activeProject.milestones.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                Marcos Estratégicos (Milestones)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeProject.milestones.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {m.completed ? 'Atingido' : 'Em Curso'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">Prazo: {m.dueDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Tasks & Meetings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Tarefas do Projeto ({projectTasks.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentView('tasks')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Abrir Tarefas
                </button>
              </div>

              <div className="space-y-2">
                {projectTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.title}
                    </span>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
                {projectTasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhuma tarefa vinculada ainda.</p>
                )}
              </div>
            </div>

            {/* Project Meetings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Reuniões Vinculadas ({projectMeetings.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setCurrentView('meetings')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Abrir Reuniões
                </button>
              </div>

              <div className="space-y-2">
                {projectMeetings.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMeetingId(m.id);
                      setCurrentView('meetings');
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">{m.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.date} • {m.startTime} às {m.endTime}</p>
                  </div>
                ))}
                {projectMeetings.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhuma reunião vinculada a este projeto.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div
          id="new-project-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            id="new-project-modal-content"
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Criar Novo Espaço de Projeto
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: NuRa Implementos Agrícolas 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição & Objetivos
                </label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Resumo do escopo deste projeto..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cor de Destaque
                </label>
                <input
                  type="color"
                  value={newProjectColor}
                  onChange={(e) => setNewProjectColor(e.target.value)}
                  className="w-16 h-8 rounded-lg cursor-pointer bg-transparent"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      <ProjectEditModal
        projectId={editingProjectId}
        isOpen={!!editingProjectId}
        onClose={() => setEditingProjectId(null)}
      />
    </div>
  );
};
