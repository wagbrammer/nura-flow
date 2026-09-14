import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Lightbulb,
  CheckSquare,
  Calendar,
  FileText,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { AIChatMessage } from '../types';

export const AssistantView: React.FC = () => {
  const {
    chatMessages,
    addChatMessage,
    user,
    meetings,
    tasks,
    projects,
    notes,
    assistantDraft,
    setAssistantDraft,
    setCurrentView,
    setSelectedMeetingId
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Qual é o meu resumo operacional de hoje?',
    'O que ficou acordado na última reunião de Implementos?',
    'Quais são minhas tarefas com prioridade alta atrasadas?',
    'Sugira uma pauta para alinhamento com a diretoria',
    'Quais projetos estão com progresso abaixo de 50%?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  useEffect(() => {
    if (assistantDraft) {
      setInputText(assistantDraft);
      setAssistantDraft('');
    }
  }, [assistantDraft, setAssistantDraft]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Add user message
    addChatMessage({
      role: 'user',
      content: text
    });
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            user: user.name,
            meetings: meetings.slice(0, 5).map(m => ({ title: m.title, date: m.date, summary: m.summary?.executiveSummary })),
            tasks: tasks.slice(0, 8).map(t => ({ title: t.title, priority: t.priority, status: t.status, dueDate: t.dueDate })),
            projects: projects.map(p => ({ name: p.name, progress: p.progress }))
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o assistente.');
      addChatMessage({
        role: 'model',
        content: data.reply || 'Entendido. Estou processando as informações operacionais da NuRa.'
      });
    } catch (err) {
      console.error(err);
      addChatMessage({
        role: 'model',
        content: 'Não foi possível consultar o assistente agora. Seus dados locais continuam disponíveis nas telas de reuniões, tarefas e projetos.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="assistant-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Assistente Executivo Inteligente
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                IA opcional + modo local
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Analisa o contexto local de reuniões, tarefas e projetos; respostas avançadas exigem Gemini configurado
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs">
        {chatMessages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-xs ${
                  isUser
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isUser ? 'WB' : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs whitespace-pre-line'
                }`}
              >
                {msg.content}
                <span
                  className={`block text-[10px] mt-1.5 font-mono ${
                    isUser ? 'text-emerald-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Consultando reuniões, tarefas e contexto do projeto...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 whitespace-nowrap shadow-2xs transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte ao Assistente IA sobre reuniões, tarefas, metas da NuRa..."
          className="flex-1 px-4 py-2.5 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
