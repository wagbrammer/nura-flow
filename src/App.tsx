import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useSync } from './hooks/useSync';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickCaptureModal } from './components/common/QuickCaptureModal';
import { MeetingReminderAlert } from './components/common/MeetingReminderAlert';
import { AuthGate } from './components/auth/AuthGate';

import { TodayView } from './views/TodayView';
import { AgendaView } from './views/AgendaView';
import { MeetingsView } from './views/MeetingsView';
import { MeetingModeView } from './views/MeetingModeView';
import { NotesView } from './views/NotesView';
import { TasksView } from './views/TasksView';
import { ProjectsView } from './views/ProjectsView';
import { InboxView } from './views/InboxView';
import { FilesView } from './views/FilesView';
import { UsefulLinksView } from './views/UsefulLinksView';
import { EmailView } from './views/EmailView';
import { ChatView } from './views/ChatView';
import { AssistantView } from './views/AssistantView';
import PomodoroView from './views/PomodoroView';
import { TimelineView } from './views/TimelineView';
import { SettingsView } from './views/SettingsView';
import { PasswordsView } from './views/PasswordsView';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();
  useSync();

  // If in meeting mode, render fullscreen distraction-free
  if (currentView === 'meeting_mode') {
    return (
      <main className="h-[100dvh] overflow-y-auto overscroll-contain bg-slate-950 text-slate-100 p-0 sm:p-2 md:p-3">
        <MeetingModeView />
      </main>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'today':
        return <TodayView />;
      case 'agenda':
        return <AgendaView />;
      case 'meetings':
        return <MeetingsView />;
      case 'notes':
        return <NotesView />;
      case 'tasks':
        return <TasksView />;
      case 'projects':
        return <ProjectsView />;
      case 'inbox':
        return <InboxView />;
      case 'files':
        return <FilesView />;
      case 'useful_links':
        return <UsefulLinksView />;
      case 'email':
        return <EmailView />;
      case 'chat':
        return <ChatView />;
      case 'pomodoro':
        return <PomodoroView />;
      case 'passwords':
        return <PasswordsView />;
      case 'assistant':
        return <AssistantView />;
      case 'timeline':
        return <TimelineView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <TodayView />;
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Collapsible Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Modals */}
      <GlobalSearchModal />
      <QuickCaptureModal />
      <MeetingReminderAlert />
    </div>
  );
};

// 根据 URL 路径决定初始视图（供 Google OAuth 回调等场景使用）
function getInitialView(): string {
  // Se veio do callback do Google, forçar a tela de configurações
  const params = new URLSearchParams(window.location.search);
  if (params.get('google') === 'connected') return 'settings';
  const path = window.location.pathname.replace(/^\//, '') || 'today';
  const viewMap: Record<string, string> = {
    settings: 'settings', tasks: 'tasks', meetings: 'meetings',
    notes: 'notes', projects: 'projects', inbox: 'inbox',
    files: 'files', agenda: 'agenda', pomodoro: 'pomodoro',
    passwords: 'passwords', assistant: 'assistant', timeline: 'timeline',
    email: 'email', chat: 'chat', useful_links: 'useful_links'
  };
  return viewMap[path] || 'today';
}

export default function App() {
  return (
    <AuthGate>
      <AppProvider initialView={getInitialView()}>
        <MainLayout />
      </AppProvider>
    </AuthGate>
  );
}
