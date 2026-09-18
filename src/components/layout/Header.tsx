import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Bell,
  CheckCircle,
  Clock,
  Sparkles,
  Radio,
  ExternalLink,
  X,
  CalendarCheck,
  LogOut
} from 'lucide-react';
import { QuickLinksBar } from '../common/QuickLinksBar';
import { FullscreenToggle } from '../common/TabletExperienceControls';

export const Header: React.FC = () => {
  const {
    setIsGlobalSearchOpen,
    setIsQuickCaptureOpen,
    activeMeetingId,
    meetings,
    setCurrentView,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    user
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const activeMeeting = meetings.find(m => m.id === activeMeetingId);
  const unreadNotifs = notifications.filter(n => !n.read);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/');
    }
  };

  return (
    <header
      id="app-header"
      className="relative h-16 px-3 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-2 md:gap-4 sticky top-0 z-20"
    >
      {/* Left: Brand icon on mobile + Search trigger */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <div className="md:hidden flex items-center gap-2">
          {user.logoUrl ? (
            <img src={user.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              N
            </div>
          )}
          <span className="hidden font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 sm:inline">
            NURA
          </span>
        </div>

        {/* Global Search Bar Trigger - smaller on mobile vertical to prevent overlap with dropdown */}
        <button
          type="button"
          id="global-search-trigger"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-medium text-slate-500 shadow-2xs transition-all hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/80 sm:w-full sm:max-w-md sm:justify-between sm:px-3.5 border border-slate-200 dark:border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden truncate sm:inline">Buscar em reuniões, notas, tarefas...</span>
          </div>
          <kbd className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400">
            Ctrl K
          </kbd>
        </button>
        <QuickLinksBar variant="desktop" className="hidden shrink-0 xl:flex" />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Active Meeting Indicator Pill */}
        {activeMeeting && (
          <button
            type="button"
            onClick={() => setCurrentView('meetings')}
            className="flex h-9 items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-2 text-xs font-bold text-emerald-700 shadow-xs animate-pulse hover:opacity-90 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 sm:px-3"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Modo Reunião Ativo:</span>
            <span className="hidden truncate max-w-[120px] sm:block">{activeMeeting.title}</span>
          </button>
        )}

        <QuickLinksBar variant="mobile" />

        <div className="hidden md:block">
          <FullscreenToggle compact />
        </div>

        {/* Quick Add (+) Button - icon only on mobile vertical */}
        <button
          type="button"
          id="header-quick-add-btn"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="flex min-h-11 items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors sm:px-3.5"
          title="Capturar novo item"
          aria-label="Capturar novo item"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Capturar</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            id="notifications-btn"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notificações & Lembretes contextuais"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Lembretes & Contextos
                  </span>
                </div>
                {unreadNotifs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.actionView) setCurrentView(n.actionView);
                      setIsNotifOpen(false);
                    }}
                    className={`pt-2 first:pt-0 p-2 rounded-xl cursor-pointer transition-colors ${
                      !n.read ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors"
          title="Sair do NuRa"
          aria-label="Sair do NuRa"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};