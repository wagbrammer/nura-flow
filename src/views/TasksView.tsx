import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Columns,
  List,
  Table,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Tag as TagIcon,
  User,
  ArrowUpDown,
  Edit3
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../components/common/PriorityBadge';
import { TagBadge } from '../components/common/TagBadge';
import { TaskEditModal } from '../components/common/TaskEditModal';
import { TaskItem, TaskPriority, TaskStatus } from '../types';
import { formatDateBR } from '../lib/date';

export const TasksView: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setTaskStatus,
    projects,
    tags,
    user
  } = useApp();

  const [viewLayout, setViewLayout] = useState<'list' | 'table' | 'kanban'>('list');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Drag & Drop State for Kanban
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<TaskStatus | null>(null);

  // Track which overdue tasks we've already notified about via Telegram
  const notifiedOverdueTasks = useRef<Set<string>>(new Set());

  // Check for overdue tasks and send Telegram notifications (once per task)
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    // Consider all tasks, not just filtered, to avoid missing due to search/filters
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate < todayStr);
    overdueTasks.forEach(task => {
      if (!notifiedOverdueTasks.current.has(task.id)) {
        // Send Telegram notification
        fetch('/api/telegram/tarefa-atrasada', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: task.title })
        }).catch(err => console.error('Failed to send overdue task Telegram notification:', err));
        notifiedOverdueTasks.current.add(task.id);
      }
    });
    // Clean up notified set for tasks that are no longer overdue (e.g., marked done or due date passed)
    notifiedOverdueTasks.current = new Set(
      [...notifiedOverdueTasks.current].filter(id => {
        const task = tasks.find(t => t.id === id);
        return task && task.status !== 'done' && task.dueDate < todayStr;
      })
    );
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      setTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColId(null);
  };

  // Quick inline add task
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAssignee, setQuickAssignee] = useState(user.name);
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [quickProject, setQuickProject] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.assignee.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'overdue' && t.status !== 'done' && t.dueDate < todayStr) ||
      (filterStatus === 'today' && t.dueDate === todayStr) ||
      t.status === filterStatus;

    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesProject = filterProject === 'all' || t.projectId === filterProject;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    addTask({
      title: quickTitle.trim(),
      assignee: quickAssignee,
      assigneeEmail: user.email,
      dueDate: quickDueDate,
      priority: quickPriority,
      projectId: quickProject || undefined,
      originType: 'manual',
      tags: []
    });

    setQuickTitle('');
  };

  const columns: { id: TaskStatus; label: string; bg: string }[] = [
    { id: 'todo', label: 'A Fazer', bg: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in_progress', label: 'Em Andamento', bg: 'bg-blue-50/60 dark:bg-blue-950/40' },
    { id: 'waiting', label: 'Aguardando', bg: 'bg-amber-50/60 dark:bg-amber-950/40' },
    { id: 'done', label: 'Concluído', bg: 'bg-emerald-50/60 dark:bg-emerald-950/40' }
  ];

  return (
    <div id="tasks-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Gestão de Tarefas & Ações
            </h1>
            <p className="text-xs text-slate-500">
              Controle de entregas operacionais, prazos e responsabilidades
            </p>
          </div>
        </div>

        {/* View Layout Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setViewLayout('list')}
            className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewLayout === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('table')}
            className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewLayout === 'table' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabela</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('kanban')}
            className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewLayout === 'kanban' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2"
      >
        <div className="flex min-h-11 flex-1 min-w-[200px] items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
          <input
            type="text"
            required
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Adicionar nova tarefa rapidamente e pressionar Enter..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />
        </div>

        <input
          type="text"
          value={quickAssignee}
          onChange={(e) => setQuickAssignee(e.target.value)}
          placeholder="Responsável"
          className="min-h-11 w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
        />

        <input
          type="date"
          value={quickDueDate}
          onChange={(e) => setQuickDueDate(e.target.value)}
          className="min-h-11 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
        />

        <select
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
          className="min-h-11 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
        >
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        <select
          value={quickProject}
          onChange={(e) => setQuickProject(e.target.value)}
          className="min-h-11 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none max-w-[140px]"
        >
          <option value="">Sem Projeto</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="min-h-11 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          Adicionar
        </button>
      </form>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex min-h-11 items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'today', label: 'Hoje' },
            { id: 'overdue', label: 'Atrasadas' },
            { id: 'todo', label: 'A Fazer' },
            { id: 'in_progress', label: 'Em Andamento' },
            { id: 'done', label: 'Concluídas' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`min-h-10 px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: LIST */}
      {viewLayout === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          {filteredTasks.map(t => {
            const isOverdue = t.status !== 'done' && t.dueDate < todayStr;
            const project = projects.find(p => p.id === t.projectId);

            return (
              <div
                key={t.id}
                onClick={() => setEditingTaskId(t.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  t.status === 'done'
                    ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                    : isOverdue
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskStatus(t.id);
                    }}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      t.status === 'done'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-600'
                    }`}
                    title={t.status === 'done' ? 'Reabrir tarefa' : 'Concluir tarefa'}
                  >
                    {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-bold truncate ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {t.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {t.assignee}
                      </span>

                      {project && (
                        <span className="inline-flex items-center gap-1 font-semibold" style={{ color: project.color }}>
                          • {project.name}
                        </span>
                      )}

                      {t.checklist && t.checklist.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                          {t.checklist.filter(c => c.completed).length}/{t.checklist.length} itens
                        </span>
                      )}

                      {t.tags.map(tId => (
                        <TagBadge key={tId} tagId={tId} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <PriorityBadge priority={t.priority} />

                  <span className={`text-xs font-mono font-medium ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-500'}`}>
                    {formatDateBR(t.dueDate)}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTaskId(t.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar tarefa"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(t.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma tarefa encontrada para este filtro.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW: TABLE */}
      {viewLayout === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3">Título da Tarefa</th>
                <th className="p-3">Status</th>
                <th className="p-3">Prioridade</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Prazo</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredTasks.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setEditingTaskId(t.id)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(t.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        t.status === 'done'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {t.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </td>
                  <td className="p-3 font-semibold">
                    <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>
                      {t.title}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="p-3 font-medium">{t.assignee}</td>
                  <td className="p-3 font-mono">{formatDateBR(t.dueDate)}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(t.id)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600"
                        title="Editar tarefa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(t.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: KANBAN */}
      {viewLayout === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            const isDragOver = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-3xl border p-4 space-y-3 flex flex-col min-h-[500px] transition-colors ${
                  isDragOver
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.map(t => {
                    const isDragging = draggedTaskId === t.id;
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverColId(null);
                        }}
                        onClick={() => setEditingTaskId(t.id)}
                        className={`p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2 cursor-grab active:cursor-grabbing transition-all ${
                          isDragging ? 'opacity-40 scale-95 border-emerald-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-bold leading-snug ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {t.title}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskStatus(t.id);
                            }}
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            <CheckCircle2 className={`w-4 h-4 ${t.status === 'done' ? 'text-emerald-600' : ''}`} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <PriorityBadge priority={t.priority} />
                          {t.tags.map(tId => (
                            <TagBadge key={tId} tagId={tId} />
                          ))}
                        </div>

                        {/* Date only */}
                        <div className="flex items-center justify-end text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-mono text-[10px]">{formatDateBR(t.dueDate)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Edit / Details Modal */}
      <TaskEditModal
        taskId={editingTaskId}
        isOpen={!!editingTaskId}
        onClose={() => setEditingTaskId(null)}
      />
    </div>
  );
};
