import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Inbox as InboxIcon,
  Plus,
  ArrowRight,
  CheckSquare,
  FileText,
  Calendar,
  Trash2,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { InboxItem } from '../types';
import { formatDateBR } from '../lib/date';

export const InboxView: React.FC = () => {
  const {
    inbox,
    addInboxItem,
    processInboxItem,
    addTask,
    addNote,
    addMeeting,
    user
  } = useApp();

  const [newCapture, setNewCapture] = useState('');

  const handleAddDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapture.trim()) return;

    addInboxItem({
      content: newCapture.trim(),
      type: 'idea',
      tags: []
    });

    setNewCapture('');
  };

  const handleConvertToTask = (item: InboxItem) => {
    addTask({
      title: item.content,
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      originType: 'inbox'
    });
    processInboxItem(item.id);
  };

  const handleConvertToNote = (item: InboxItem) => {
    addNote({
      title: `Nota: ${item.content.slice(0, 40)}`,
      content: item.content,
      type: 'text',
      privacy: 'private'
    });
    processInboxItem(item.id);
  };

  const handleConvertToMeeting = (item: InboxItem) => {
    addMeeting({
      title: item.content,
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      agenda: item.content
    });
    processInboxItem(item.id);
  };

  return (
    <div id="inbox-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <InboxIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Caixa de Entrada & Triagem Rápida
            </h1>
            <p className="text-xs text-slate-500">
              Capturas não processadas: converta rapidamente em Tarefas, Notas ou Reuniões
            </p>
          </div>
        </div>

        <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 self-start">
          {inbox.length} itens pendentes de triagem
        </span>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleAddDirect} className="flex gap-2">
        <input
          type="text"
          value={newCapture}
          onChange={(e) => setNewCapture(e.target.value)}
          placeholder="Capturar pensamento rápido ou pendência para triar depois..."
          className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Capturar</span>
        </button>
      </form>

      {/* Inbox Items List */}
      <div className="space-y-3">
        {inbox.map(item => (
          <div
            key={item.id}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {item.content}
                </p>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Capturado em {formatDateBR(item.createdAt)}
                </span>
              </div>
            </div>

            {/* Conversion Actions */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleConvertToTask(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Transformar em Tarefa"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Virar Tarefa</span>
              </button>

              <button
                type="button"
                onClick={() => handleConvertToNote(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Transformar em Nota"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Virar Nota</span>
              </button>

              <button
                type="button"
                onClick={() => handleConvertToMeeting(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                title="Transformar em Reunião"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Virar Reunião</span>
              </button>

              <button
                type="button"
                onClick={() => processInboxItem(item.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Descartar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {inbox.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Caixa de Entrada limpa!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Todas as capturas e ideias rápidas foram triadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
