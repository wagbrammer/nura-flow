import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { TimelineEvent } from '../types';

export const TimelineView: React.FC = () => {
  const { activityLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = activityLogs.filter(e =>
    e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.entityTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'note':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'ai_summary':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div id="timeline-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Linha do Tempo & Trilha de Auditoria
            </h1>
            <p className="text-xs text-slate-500">
              Histórico cronológico de decisões, atas, conclusões de tarefas e marcos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar eventos..."
            className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs relative">
        <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-6 relative">
          {filteredEvents.map(event => (
            <div key={event.id} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0 z-10 shadow-xs">
                {getEventIcon(event.entityType)}
              </div>

              <div className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {event.action}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {event.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
