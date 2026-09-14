import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckSquare,
  CheckCircle2,
  Calendar,
  User,
  FolderKanban,
  Tag as TagIcon,
  Plus,
  Trash2,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { PriorityBadge } from './PriorityBadge';

interface TaskEditModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ taskId, isOpen, onClose }) => {
  const {
    tasks,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleTaskChecklist,
    addTaskComment,
    projects,
    tags,
    addTag,
    user
  } = useApp();

  const task = tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Checklist
  const [newChecklistText, setNewChecklistText] = useState('');
  
  // Comment
  const [newCommentText, setNewCommentText] = useState('');

  // Inline Tag creation
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [inlineTagName, setInlineTagName] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignee(task.assignee || user.name);
      setDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
      setProjectId(task.projectId || '');
      setSelectedTags(task.tags || []);
    }
  }, [task, user.name]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTask(task.id, {
      title: title.trim() || task.title,
      description: description.trim(),
      status,
      priority,
      assignee: assignee.trim() || user.name,
      dueDate,
      projectId: projectId || undefined,
      tags: selectedTags
    });
    onClose();
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false
    };
    updateTask(task.id, {
      checklist: [...(task.checklist || []), newItem]
    });
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (chkId: string) => {
    updateTask(task.id, {
      checklist: task.checklist.filter(c => c.id !== chkId)
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addTaskComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                toggleTaskStatus(task.id);
                setStatus(task.status === 'done' ? 'todo' : 'done');
              }}
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                task.status === 'done'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
              }`}
              title={task.status === 'done' ? 'Marcar como pendente' : 'Marcar como concluída'}
            >
              <CheckCircle2 className={`w-4 h-4 ${task.status === 'done' ? 'text-white' : 'text-slate-400'}`} />
            </button>
            <div>
              <span className="text-xs font-bold text-slate-400 font-mono uppercase">
                {task.status === 'done' ? 'Tarefa Concluída' : 'Editar Detalhes da Tarefa'}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {task.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Excluir tarefa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Título da Tarefa
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status & Priority & Prazo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting">Aguardando</option>
                <option value="done">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="urgent">🔴 Urgente</option>
                <option value="high">🟠 Alta</option>
                <option value="medium">🟡 Média</option>
                <option value="low">🟢 Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Data de Entrega (Prazo)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Project & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Projeto Vinculado
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sem Projeto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Responsável
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nome do responsável"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição e Instruções
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que precisa ser feito..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tags */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tags da Tarefa
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingTag(!isCreatingTag)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Criar nova tag</span>
              </button>
            </div>

            {isCreatingTag && (
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome da tag..."
                  value={inlineTagName}
                  onChange={(e) => setInlineTagName(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inlineTagName.trim()) {
                      const created = addTag({ name: inlineTagName.trim() });
                      setSelectedTags(prev => [...prev, created.id]);
                      setInlineTagName('');
                      setIsCreatingTag(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Adicionar
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

            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => {
                const isSelected = selectedTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTags(prev =>
                        isSelected ? prev.filter(id => id !== t.id) : [...prev, t.id]
                      );
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t.name} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtarefas / Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subtarefas / Checklist ({task.checklist?.filter(c => c.completed).length || 0}/{(task.checklist || []).length})</span>
              </h3>
            </div>

            <div className="space-y-1.5">
              {(task.checklist || []).map(chk => (
                <div
                  key={chk.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={chk.completed}
                      onChange={() => toggleTaskChecklist(task.id, chk.id)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={chk.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                        {chk.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(chk.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar subtarefa e pressionar Enter..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                + Adicionar
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Comentários & Atualizações ({task.comments?.length || 0})</span>
            </h3>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(task.comments || []).map(comm => (
                <div key={comm.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{comm.author}</span>
                    <span>{comm.createdAt?.substring(0, 10)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200">{comm.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Escrever atualização ou nota de progresso..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-700"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="text-xs text-slate-400">
            {task.originType && (
              <span className="flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                Origem: {task.originType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
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
