import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  FolderKanban,
  Inbox,
  Paperclip,
  Mail,
  Sparkles,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Link2,
  MessageSquare,
  Clock,
  Key
} from 'lucide-react';
import { ViewType } from '../../types';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    sidebarCollapsed,
    setSidebarCollapsed,
    tasks,
    inbox,
    meetings,
    notifications,
    user
  } = useApp();

  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;
  const overdueTasksCount = tasks.filter(
    t => t.status !== 'done' && t.dueDate < new Date().toISOString().split('T')[0]
  ).length;
  const inboxCount = inbox.length;
  const todayMeetingsCount = meetings.filter(
    m => m.date === new Date().toISOString().split('T')[0]
  ).length;

  const navItems: { view: ViewType; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { view: 'today', label: 'Hoje', icon: <Sun className="w-4 h-4" /> },
    { view: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" />, badge: todayMeetingsCount, badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
    { view: 'meetings', label: 'Reuniões', icon: <Users className="w-4 h-4" /> },
    { view: 'notes', label: 'Notas & Desenho', icon: <FileText className="w-4 h-4" /> },
    { view: 'tasks', label: 'Tarefas', icon: <CheckSquare className="w-4 h-4" />, badge: pendingTasksCount, badgeColor: overdueTasksCount > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { view: 'projects', label: 'Projetos', icon: <FolderKanban className="w-4 h-4" /> },
    { view: 'inbox', label: 'Caixa de Entrada', icon: <Inbox className="w-4 h-4" />, badge: inboxCount > 0 ? inboxCount : undefined, badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    { view: 'files', label: 'Arquivos & Drive', icon: <Paperclip className="w-4 h-4" /> },
    { view: 'useful_links', label: 'Links Úteis', icon: <Link2 className="w-4 h-4" /> },
    { view: 'email', label: 'Referências de E-mail', icon: <Mail className="w-4 h-4" /> },
    { view: 'chat', label: 'Google Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { view: 'pomodoro', label: 'Pomodoro', icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { view: 'passwords', label: 'Senhas', icon: <Key className="w-4 h-4" /> },
    { view: 'assistant', label: 'Assistente IA', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { view: 'timeline', label: 'Linha do Tempo', icon: <History className="w-4 h-4" /> }
  ];

  return (
    <aside
      id="app-sidebar"
      className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 select-none z-30 ${
        sidebarCollapsed ? 'w-18' : 'w-18 2xl:w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200/80 dark:border-slate-800">
        {!sidebarCollapsed ? (
          <div className="hidden items-center gap-2.5 2xl:flex">
            {user.logoUrl ? (
              <img src={user.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-800 p-1 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black tracking-wider shadow-sm">
                <span className="text-base font-extrabold">N</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  NURA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                Memória Operacional
              </p>
            </div>
          </div>
        ) : null}
        <div className={`w-full justify-center ${sidebarCollapsed ? 'flex' : 'flex 2xl:hidden'}`}>
            {user.logoUrl ? (
              <img src={user.logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-white dark:bg-slate-800 p-1 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base shadow-sm">
                N
              </div>
            )}
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors 2xl:block"
          title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map(item => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              id={`nav-item-${item.view}`}
              onClick={() => setCurrentView(item.view)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              } ${sidebarCollapsed ? 'justify-center px-2' : 'justify-center px-2 2xl:justify-between 2xl:px-3'} min-h-11`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="hidden truncate 2xl:inline">{item.label}</span>}
              </div>

              {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className={`hidden text-[10px] font-bold px-1.5 py-0.5 rounded-full 2xl:inline ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        {!sidebarCollapsed && (
          <div className="hidden px-1 py-1 2xl:block">
            <ThemeSwitcher compact={false} />
          </div>
        )}

        <button
          type="button"
          id="nav-item-settings"
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentView === 'settings'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          } ${sidebarCollapsed ? 'justify-center px-2' : 'justify-center px-2 2xl:justify-start 2xl:px-3'} min-h-11`}
          title="Configurações & Integrações"
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span className="hidden 2xl:inline">Configurações</span>}
        </button>

        {/* User Card */}
        {!sidebarCollapsed ? (
          <div
            onClick={() => setCurrentView('settings')}
            className="hidden items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors 2xl:flex"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/30">
              WB
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        ) : null}
          <div
            onClick={() => setCurrentView('settings')}
            className={`justify-center p-1 cursor-pointer ${sidebarCollapsed ? 'flex' : 'flex 2xl:hidden'}`}
            title={`${user.name} (${user.email})`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/30">
              WB
            </div>
          </div>
      </div>
    </aside>
  );
};
