import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Calendar,
  Plus,
  CheckSquare,
  Menu,
  X,
  Users,
  FileText,
  FolderKanban,
  Inbox,
  Paperclip,
  Mail,
  Sparkles,
  History,
  Settings,
  Link2,
  Smartphone,
  CheckCircle2,
  Clock,
  Key
} from 'lucide-react';
import { ViewType } from '../../types';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { pwaInstall } from '../../lib/pwa';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, setIsQuickCaptureOpen, tasks, meetings, inbox } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(pwaInstall.isAvailable());
  const [isStandalone, setIsStandalone] = useState(pwaInstall.isStandalone());
  const [installMessage, setInstallMessage] = useState('');

  useEffect(() => pwaInstall.subscribe(() => {
    setCanInstall(pwaInstall.isAvailable());
    setIsStandalone(pwaInstall.isStandalone());
  }), []);

  const handleInstall = async () => {
    const outcome = await pwaInstall.prompt();
    setInstallMessage(outcome === 'accepted'
      ? 'Instalação iniciada! Abra o NuRa pelo ícone criado na tela inicial.'
      : outcome === 'dismissed'
        ? 'Instalação cancelada. Você pode tentar novamente pelo menu do navegador.'
        : 'No navegador, toque em Menu → Adicionar à tela inicial ou Instalar aplicativo.');
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;
  const todayMeetingsCount = meetings.filter(
    m => m.date === new Date().toISOString().split('T')[0]
  ).length;

  const fullMenuItems: { view: ViewType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'today', label: 'Hoje (Painel Operacional)', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { view: 'agenda', label: 'Agenda Google', icon: <Calendar className="w-4 h-4 text-blue-500" />, badge: todayMeetingsCount },
    { view: 'meetings', label: 'Reuniões & Atas', icon: <Users className="w-4 h-4 text-emerald-500" /> },
    { view: 'notes', label: 'Notas & Desenhos', icon: <FileText className="w-4 h-4 text-indigo-500" /> },
    { view: 'tasks', label: 'Lista de Tarefas', icon: <CheckSquare className="w-4 h-4 text-emerald-600" />, badge: pendingTasksCount },
    { view: 'projects', label: 'Projetos', icon: <FolderKanban className="w-4 h-4 text-purple-500" /> },
    { view: 'inbox', label: 'Caixa de Entrada', icon: <Inbox className="w-4 h-4 text-amber-600" />, badge: inbox.length },
    { view: 'files', label: 'Arquivos & Drive', icon: <Paperclip className="w-4 h-4 text-slate-500" /> },
    { view: 'useful_links', label: 'Links Úteis', icon: <Link2 className="w-4 h-4 text-cyan-500" /> },
    { view: 'email', label: 'E-mails', icon: <Mail className="w-4 h-4 text-red-500" /> },
    { view: 'assistant', label: 'Assistente IA', icon: <Sparkles className="w-4 h-4 text-emerald-500" /> },
    { view: 'timeline', label: 'Linha do Tempo', icon: <History className="w-4 h-4 text-teal-500" /> },
    { view: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4 text-slate-400" /> },
    { view: 'pomodoro', label: 'Pomodoro', icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { view: 'passwords', label: 'Senhas', icon: <Key className="w-4 h-4 text-violet-500" /> },
  ];

  return (
    <>
      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div
          id="mobile-drawer-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            id="mobile-drawer-content"
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center">
                  R
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Menu NuRa
                  </span>
                  <p className="text-xs text-slate-400">Navegue pelas ferramentas</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme switcher inside mobile drawer */}
            <div className="py-1">
              <ThemeSwitcher compact={false} />
            </div>

            {/* PWA Install Card */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/25 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">Instalar como App</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    Abra o NuRa na tela inicial, sem a barra do navegador.
                  </p>
                </div>
              </div>
              {isStandalone ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 px-3 py-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Aplicativo instalado
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={!canInstall}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-extrabold py-2.5 transition-colors"
                >
                  <Smartphone className="h-4 w-4" />
                  {canInstall ? 'Instalar no Celular' : 'Abrir menu do navegador'}
                </button>
              )}
              {installMessage && (
                <p className="mt-2 rounded-lg bg-white/80 dark:bg-slate-900/70 px-3 py-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300" role="status">
                  {installMessage}
                </p>
              )}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {fullMenuItems.map(item => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => {
                    setCurrentView(item.view);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all ${
                    currentView === item.view
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40"
      >
        {/* Hoje */}
        <button
          type="button"
          onClick={() => setCurrentView('today')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[11px] font-medium transition-colors ${
            currentView === 'today'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Sun className="w-5 h-5 mb-0.5" />
          <span>Hoje</span>
        </button>

        {/* Agenda */}
        <button
          type="button"
          onClick={() => setCurrentView('agenda')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[11px] font-medium transition-colors ${
            currentView === 'agenda'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>Agenda</span>
        </button>

        {/* Floating Quick Action (+) Button */}
        <button
          type="button"
          id="mobile-quick-add-btn"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg -mt-5 ring-4 ring-white dark:ring-slate-900 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-3" />
        </button>

        {/* Tarefas */}
        <button
          type="button"
          onClick={() => setCurrentView('tasks')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[11px] font-medium transition-colors ${
            currentView === 'tasks'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span>Tarefas</span>
        </button>

        {/* Pomodoro */}
        <button
          type="button"
          onClick={() => setCurrentView('pomodoro')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[11px] font-medium transition-colors ${
            currentView === 'pomodoro'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Pomodoro</span>
        </button>

        {/* Menu */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl text-[11px] font-medium text-slate-500 dark:text-slate-400"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
};
