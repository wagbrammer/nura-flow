import React from 'react';
import { TaskPriority, TaskStatus } from '../../types';
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Clock, CheckCircle2, PauseCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const configs: Record<TaskPriority, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    urgent: {
      label: 'Urgente',
      icon: <AlertCircle className="w-3 h-3 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800/50'
    },
    high: {
      label: 'Alta',
      icon: <ArrowUp className="w-3 h-3 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/50'
    },
    medium: {
      label: 'Média',
      icon: <ArrowDown className="w-3 h-3 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/50'
    },
    low: {
      label: 'Baixa',
      icon: <ArrowDown className="w-3 h-3 text-slate-400" />,
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700'
    }
  };

  const config = configs[priority] || configs.medium;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<TaskStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    todo: {
      label: 'A Fazer',
      icon: <Clock className="w-3 h-3 text-slate-500" />,
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700'
    },
    in_progress: {
      label: 'Em Andamento',
      icon: <Clock className="w-3 h-3 text-blue-500 animate-pulse" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    waiting: {
      label: 'Aguardando',
      icon: <PauseCircle className="w-3 h-3 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800'
    },
    done: {
      label: 'Concluído',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    }
  };

  const config = configs[status] || configs.todo;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
