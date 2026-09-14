import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FolderPlus,
  Plus,
  Trash2,
  CheckCircle2,
  Tag as TagIcon,
  Flag,
  Palette,
  Users
} from 'lucide-react';
import { Project, ProjectMilestone } from '../../types';

interface ProjectEditModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#475569', // Slate
];

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  projectId,
  isOpen,
  onClose
}) => {
  const { projects, updateProject, deleteProject, tags, addTag } = useApp();

  const project = projects.find(p => p.id === projectId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#059669');
  const [lead, setLead] = useState('');
  const [projectTags, setProjectTags] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  // New milestone state
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // New tag state
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color || '#059669');
      setLead(project.lead || '');
      setProjectTags(project.tags || []);
      setMilestones(project.milestones || []);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProject(project.id, {
      name: name.trim(),
      description: description.trim(),
      color,
      lead: lead.trim(),
      tags: projectTags,
      milestones
    });

    onClose();
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: ProjectMilestone = {
      id: `milestone-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      dueDate: newMilestoneDate || new Date().toISOString().split('T')[0],
      completed: false
    };

    setMilestones([...milestones, newM]);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  const handleToggleMilestone = (milestoneId: string) => {
    setMilestones(
      milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      )
    );
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };

  const handleCreateNewTag = () => {
    if (newTagName.trim()) {
      const created = addTag({ name: newTagName.trim() });
      setProjectTags([...projectTags, created.id]);
      setNewTagName('');
      setIsCreatingTag(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setProjectTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div
      id="project-edit-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="project-edit-modal-content"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Editar Projeto: {project.name}
              </h3>
              <p className="text-xs text-slate-500">
                Atualize configurações, marcos e responsáveis do projeto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <form id="edit-project-form" onSubmit={handleSave} className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Expansão Linha Agrícola 2026"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descrição do Projeto
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Objetivo principal, escopo e resultados esperados..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Color & Leader */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Líder / Responsável Principal
                </label>
                <input
                  type="text"
                  value={lead}
                  onChange={e => setLead(e.target.value)}
                  placeholder="Nome do líder do projeto"
                  className="w-full px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tags Selection & Creation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                  Tags do Projeto
                </label>
                {!isCreatingTag ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingTag(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar nova tag</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nome da tag..."
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="px-2 py-0.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewTag}
                      className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTag(false)}
                      className="text-xs text-slate-400"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => {
                  const isSelected = projectTags.includes(t.id);
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
                      {t.name} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Strategic Milestones */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                Marcos Estratégicos (Milestones)
              </label>

              {/* Milestones list */}
              <div className="space-y-2">
                {milestones.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          m.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {m.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <span
                        className={`text-xs font-semibold ${
                          m.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{m.dueDate}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {milestones.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nenhum marco cadastrado.</p>
                )}
              </div>

              {/* Add Milestone Form */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Novo marco (ex: Conclusão do Protótipo)..."
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={e => setNewMilestoneDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                deleteProject(project.id);
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Projeto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-project-form"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
