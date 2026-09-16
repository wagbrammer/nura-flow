import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  MoreVertical,
  ExternalLink,
  Sparkles,
  Users,
  Bot,
  ChevronRight,
  Loader2,
  Paperclip,
  Mic,
  Smile,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  Mail
} from 'lucide-react';
import { formatDateBR, formatRelativeTimeBR } from '../lib/date';
import { ChatSpace, ChatMessage } from '../types';

interface GoogleSpace {
  name: string;
  displayName: string;
  spaceType: string;
  spaceId: string;
  dmDetails?: {
    userToMessage: string;
  };
}

interface GoogleUser {
  resourceName: string;
  name: string;
  email: string;
}

export const ChatView: React.FC = () => {
  const {
    user,
    addTask,
    addNote
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showWebhookAlert, setShowWebhookAlert] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [googleSpaces, setGoogleSpaces] = useState<GoogleSpace[]>([]);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);

  // DM search state
  const [showDMPanel, setShowDMPanel] = useState(false);
  const [dmEmail, setDmEmail] = useState('');
  const [dmSearchResult, setDmSearchResult] = useState<GoogleUser | null>(null);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmMessageText, setDmMessageText] = useState('');
  const [sendingDM, setSendingDM] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local chat messages (for history display)
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('robustec_chat_messages');
      if (saved) return JSON.parse(saved);
    }
    return {};
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('robustec_chat_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Check Google connection
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'same-origin' });
        const data = await res.json();
        setGoogleConnected(data?.googleConnected || false);
      } catch {
        setGoogleConnected(false);
      }
    };
    checkGoogleConnection();
  }, []);

  // Fetch Google Chat spaces
  useEffect(() => {
    if (!googleConnected) return;

    setLoadingSpaces(true);
    fetch('/api/google/chat/spaces', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        const spaces: GoogleSpace[] = data.spaces || [];
        setGoogleSpaces(spaces);
      })
      .catch(err => console.error('Erro ao buscar espaços:', err))
      .finally(() => setLoadingSpaces(false));
  }, [googleConnected]);

  const filteredSpaces = googleSpaces.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSpace = googleSpaces.find(s => s.spaceId === selectedSpaceId);
  const spaceMessages = selectedSpaceId ? (chatMessages[selectedSpaceId] || []) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [spaceMessages, selectedSpaceId]);

  // Search for user to send DM
  const handleSearchUser = async () => {
    if (!dmEmail.trim()) return;
    setDmLoading(true);
    setDmSearchResult(null);

    try {
      const res = await fetch(`/api/google/chat/search-user?email=${encodeURIComponent(dmEmail)}`, {
        credentials: 'same-origin'
      });
      const data = await res.json();

      if (data.success) {
        setDmSearchResult({
          resourceName: data.resourceName,
          name: data.name,
          email: data.email
        });
      } else {
        alert(data.error || 'Usuário não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      alert('Erro ao buscar usuário');
    } finally {
      setDmLoading(false);
    }
  };

  // Send room message via API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedSpaceId) return;

    setIsSending(true);
    setSendMessageError(null);

    // Optimistic update
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      spaceId: selectedSpaceId,
      sender: {
        name: `users/${user.email.split('@')[0]}`,
        displayName: user.name,
        type: 'HUMAN'
      },
      text: messageText.trim(),
      createTime: new Date().toISOString()
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedSpaceId]: [...(prev[selectedSpaceId] || []), newMessage]
    }));

    // Try to send via API if Google is connected
    if (googleConnected && selectedSpace) {
      try {
        const res = await fetch('/api/google/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            roomId: selectedSpace.spaceId,
            text: `${user.name}: ${messageText.trim()}`
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enviar mensagem');
        }

        console.log('✅ Mensagem enviada via API:', data.messageId);
      } catch (err: any) {
        console.warn('API falhou, tentando webhook:', err.message);
        setSendMessageError(err.message);

        // Fallback to webhook
        const webhookUrl = localStorage.getItem('robustec_google_chat_webhook');
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: `${user.name}: ${messageText.trim()}` })
            });
          } catch (webhookErr) {
            console.warn('Webhook também falhou:', webhookErr);
          }
        }
      }
    } else {
      // No Google connection - try webhook only
      const webhookUrl = localStorage.getItem('robustec_google_chat_webhook');
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `${user.name}: ${messageText.trim()}` })
          });
        } catch (err) {
          console.warn('Webhook falhou (ignorado localmente):', err);
        }
      }
    }

    setMessageText('');
    setIsSending(false);
  };

  // Send DM via API
  const handleSendDM = async () => {
    if (!dmMessageText.trim() || !dmSearchResult) return;

    setSendingDM(true);
    try {
      const res = await fetch('/api/google/chat/send-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          targetUserEmail: dmSearchResult.email,
          text: `${user.name}: ${dmMessageText.trim()}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar DM');
      }

      alert(`✅ Mensagem enviada para ${dmSearchResult.name}!`);
      setDmMessageText('');
      setDmSearchResult(null);
      setDmEmail('');
    } catch (err: any) {
      console.error('Erro ao enviar DM:', err);
      alert(`Erro ao enviar mensagem: ${err.message}`);
    } finally {
      setSendingDM(false);
    }
  };

  const handleConvertToTask = (msg: ChatMessage) => {
    addTask({
      title: `Chat: ${msg.text?.slice(0, 50)}...`,
      description: `De ${msg.sender.displayName} em ${selectedSpace?.displayName}\n\n${msg.text}`,
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      originType: 'manual'
    });
    alert('Tarefa criada a partir da mensagem!');
  };

  const handleConvertToNote = (msg: ChatMessage) => {
    addNote({
      title: `Chat: ${msg.sender.displayName}`,
      content: msg.text || '',
      type: 'text',
      privacy: 'private'
    });
    alert('Nota criada a partir da mensagem!');
  };

  const handleOpenInChat = (space: GoogleSpace) => {
    const url = `https://chat.google.com/u/0/${space.name}`;
    window.open(url, '_blank');
  };

  return (
    <div id="chat-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Google Chat
            </h1>
            <p className="text-xs text-slate-500">
              {googleConnected
                ? 'Conectado ao Google Chat — enviando mensagens diretamente'
                : 'Conecte-se ao Google nas configurações para usar o Chat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar salas e conversas..."
              className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowDMPanel(!showDMPanel)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="Enviar mensagem direta (DM)"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enviar DM</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWebhookAlert(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="Configurar Webhook para envio real"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Webhook</span>
          </button>
        </div>
      </div>

      {/* DM Panel */}
      {showDMPanel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Enviar Mensagem Direta (DM)
            </h3>
            <button
              onClick={() => setShowDMPanel(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search user */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email do destinatário
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={dmEmail}
                  onChange={e => setDmEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchUser()}
                  placeholder="nome@empresa.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSearchUser}
                  disabled={dmLoading || !dmEmail.trim()}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {dmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {dmSearchResult && (
                <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">
                    {dmSearchResult.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{dmSearchResult.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{dmSearchResult.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mensagem
              </label>
              <textarea
                value={dmMessageText}
                onChange={e => setDmMessageText(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSendDM}
              disabled={!dmSearchResult || !dmMessageText.trim() || sendingDM}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingDM ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar DM
            </button>
          </div>
        </div>
      )}

      {/* Webhook Config Alert */}
      {showWebhookAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={() => setShowWebhookAlert(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Webhook do Google Chat</h3>
              <button onClick={() => setShowWebhookAlert(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Para <strong>enviar mensagens reais</strong> do NuRa para o Google Chat, crie um webhook de entrada na sala desejada:
            </p>

            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
              <li>Abra o Google Chat → Entre na Sala/Espaço</li>
              <li>Clique no nome da sala → <strong>Apps e integrações</strong> → <strong>Gerenciar webhooks</strong></li>
              <li><strong>Adicionar webhook</strong> → Nome: "NuRa" → <strong>Copiar URL</strong></li>
              <li>Cole a URL abaixo e salve</li>
            </ol>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL do Webhook
              </label>
              <input
                type="text"
                value={localStorage.getItem('robustec_google_chat_webhook') || ''}
                onChange={e => localStorage.setItem('robustec_google_chat_webhook', e.target.value)}
                placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWebhookAlert(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Spaces List + Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Spaces List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Salas & Conversas ({filteredSpaces.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowWebhookAlert(true)}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="Configurar Webhook"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex min-h-11 items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtrar..."
                className="w-full bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {loadingSpaces ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
                <p className="text-xs text-slate-500">Carregando salas...</p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma sala encontrada.</p>
                    {!googleConnected && (
                  <p className="text-xs mt-2 text-amber-600">Conecte-se ao Google nas configurações</p>
                )}
              </div>
            ) : (
              filteredSpaces.map(space => {
                const messages = chatMessages[space.spaceId] || [];
                const lastMsg = messages[messages.length - 1];
                const isSelected = selectedSpaceId === space.spaceId;
                const isDM = space.spaceType === 'DM';

                return (
                  <div
                    key={space.spaceId}
                    onClick={() => setSelectedSpaceId(space.spaceId)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isDM
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      }`}>
                        {isDM ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {space.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {lastMsg ? lastMsg.text?.slice(0, 40) + '...' : 'Sem mensagens ainda'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInChat(space);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600"
                        title="Abrir no Google Chat"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {lastMsg && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatRelativeTimeBR(lastMsg.createTime)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation View (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {selectedSpaceId ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedSpace?.spaceType === 'DM'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  }`}>
                    {selectedSpace?.spaceType === 'DM' ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedSpace?.displayName}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {spaceMessages.length} mensagem(s) • {selectedSpace?.spaceType === 'DM' ? 'Mensagem direta' : 'Sala de equipe'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedSpace && handleOpenInChat(selectedSpace)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                    title="Abrir no Google Chat"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
                {spaceMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-12 h-12 opacity-30 mb-3" />
                    <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Seja o primeiro a escrever!</p>
                    {googleConnected && (
                      <p className="text-xs mt-2 text-emerald-600">
                        Mensagens serão enviadas diretamente ao Google Chat
                      </p>
                    )}
                  </div>
                ) : (
                  spaceMessages.map((msg, idx) => {
                    const isOwn = msg.sender.name === `users/${user.email.split('@')[0]}`;
                    const showDate = idx === 0 ||
                      new Date(msg.createTime).toDateString() !== new Date(spaceMessages[idx - 1].createTime).toDateString();

                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                          {!isOwn && (
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold">
                              {msg.sender.displayName.charAt(0)}
                            </div>
                          )}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && (
                              <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.sender.displayName}</span>
                            )}
                            <div className={`p-3 rounded-2xl ${
                              isOwn
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                            }`}>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-[9px] text-slate-400 font-mono">
                                {formatRelativeTimeBR(msg.createTime)}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-400 hover:text-emerald-600"
                                title="Ações"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {isOwn && (
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                              {user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      title="Anexar arquivo"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={isSending}
                    />
                    <button
                      type="button"
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      title="Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={!messageText.trim() || isSending}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Enviar"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {googleConnected ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Conectado ao Google Chat — envio automático habilitado
                      </span>
                    ) : localStorage.getItem('robustec_google_chat_webhook') ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Webhook configurado — mensagens serão enviadas via webhook
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <AlertTriangle className="w-3 h-3" />
                        Modo local — conecte-se ao Google nas configurações para enviar mensagens reais
                      </span>
                    )}
                    {sendMessageError && (
                      <span className="text-red-600 ml-2">{sendMessageError}</span>
                    )}
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Selecione uma sala ou conversa</p>
                <p className="text-xs mt-1">
                  {googleConnected
                    ? 'Carregando suas salas do Google Chat...'
                    : 'Ou configure um webhook para começar'}
                </p>
                {!googleConnected && (
                  <button
                    onClick={() => window.location.href = '/settings'}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    Conectar ao Google
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
