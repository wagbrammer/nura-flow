import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Search,
  ExternalLink,
  Loader2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { ChatMessage } from '../types';

interface GoogleSpace {
  name: string;
  displayName: string;
  spaceType: string;
  spaceId: string;
  isDM: boolean;
  dmContactEmail?: string;
}

interface NewMessage {
  spaceId: string;
  spaceName: string;
  senderName: string;
  text: string;
  time: string;
  isDM: boolean;
}

export const ChatView: React.FC = () => {
  const { user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [googleSpaces, setGoogleSpaces] = useState<GoogleSpace[]>([]);
  const [spaceMessages, setSpaceMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<NewMessage[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch spaces and check connection on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await fetch('/api/auth/google/status', { credentials: 'same-origin' });
        const statusData = await statusRes.json();
        setGoogleConnected(statusData?.connected || false);
      } catch (err) {
        console.error('Erro ao verificar status do Google:', err);
      }

      setLoadingSpaces(true);
      fetch('/api/google/chat/spaces', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
          const spaces: GoogleSpace[] = data.spaces || [];
          setGoogleSpaces(spaces);
          if (spaces.length > 0 && !selectedSpaceId) {
            setSelectedSpaceId(spaces[0].spaceId);
          }
        })
        .catch(err => console.error('Erro ao buscar espaços:', err))
        .finally(() => setLoadingSpaces(false));
    };

    fetchData();
  }, []);

  // Poll for new messages every 60 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!googleConnected || !selectedSpaceId) return;

      try {
        const res = await fetch(
          `/api/google/chat/messages/${selectedSpaceId}?since=${lastCheckTime}`,
          { credentials: 'same-origin' }
        );
        const data = await res.json();
        const newMsgs = data.messages || [];

        if (newMsgs.length > 0) {
          const latestMsg = newMsgs[newMsgs.length - 1];
          const myEmails = user?.emails?.map((e: any) => e.value.toLowerCase()) || [];
          const isFromSomeoneElse = latestMsg.sender?.email
            ? !myEmails.includes(latestMsg.sender.email.toLowerCase())
            : true;

          if (isFromSomeoneElse) {
            const space = googleSpaces.find(s => s.spaceId === selectedSpaceId);
            const notification: NewMessage = {
              spaceId: selectedSpaceId,
              spaceName: space?.displayName || 'Conversa',
              senderName: latestMsg.sender?.displayName || 'Alguem',
              text: latestMsg.text?.substring(0, 100) || 'Nova mensagem',
              time: latestMsg.createTime,
              isDM: space?.isDM || false
            };

            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            setShowNotifications(true);
          }
        }
        setLastCheckTime(Date.now());
      } catch (err) {
        console.warn('Erro no polling:', err);
      }
    }, 60000); // 60 segundos

    return () => clearInterval(pollInterval);
  }, [googleConnected, selectedSpaceId, lastCheckTime, googleSpaces, user]);

  // Fetch messages when a space is selected
  useEffect(() => {
    if (!selectedSpaceId) return;

    setLoadingMessages(true);
    fetch(`/api/google/chat/messages/${selectedSpaceId}`, { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        setSpaceMessages(data.messages || []);
        setLastCheckTime(Date.now());
      })
      .catch(err => console.error('Erro ao buscar mensagens:', err))
      .finally(() => setLoadingMessages(false));
  }, [selectedSpaceId]);

  const filteredSpaces = googleSpaces.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSpace = googleSpaces.find(s => s.spaceId === selectedSpaceId);

  const handleOpenInChat = (space: GoogleSpace) => {
    const url = `https://chat.google.com/u/0/${space.name}`;
    window.open(url, '_blank');
  };

  const dismissNotification = (spaceId: string) => {
    setNotifications(prev => prev.filter(n => n.spaceId !== spaceId));
    if (notifications.length <= 1) setShowNotifications(false);
  };

  return (
    <div id="chat-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Notification Badge */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-slate-900 rounded-full text-xs font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          </button>
        </div>
      )}

      {/* Notification Panel */}
      {showNotifications && notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-40 w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Notificações</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {notifications.map((notif, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    notif.isDM
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {notif.senderName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{notif.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{notif.spaceName}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notif.spaceId)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleOpenInChat({
                      name: `spaces/${notif.spaceId}`,
                      displayName: notif.spaceName,
                      spaceType: notif.isDM ? 'DIRECT_MESSAGE' : 'SPACE',
                      spaceId: notif.spaceId,
                      isDM: notif.isDM
                    })}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir no Google Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                ? `Monitorando ${filteredSpaces.length} conversas`
                : '⚠️ Reconecte ao Google nas Configurações para monitorar'}
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
              placeholder="Buscar salas..."
              className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => window.open('https://chat.google.com', '_blank')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Spaces List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Salas & Conversas ({filteredSpaces.length})
            </h3>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
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
                <p className="text-xs text-slate-500">Carregando...</p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma sala encontrada.</p>
                {!googleConnected && (
                  <p className="text-xs mt-2 text-amber-600">Reconecte ao Google</p>
                )}
              </div>
            ) : (
              filteredSpaces.map(space => (
                <div
                  key={space.spaceId}
                  onClick={() => setSelectedSpaceId(space.spaceId)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all ${
                    selectedSpaceId === space.spaceId
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      space.isDM
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                    }`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${
                        selectedSpaceId === space.spaceId
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {space.displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {space.isDM ? 'Conversa direta' : 'Sala'}
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {selectedSpace ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedSpace.isDM
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-600'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedSpace.displayName}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {selectedSpace.isDM ? 'Conversa direta' : 'Sala'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenInChat(selectedSpace)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Chat</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : spaceMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare className="w-12 h-12 opacity-30 mb-3" />
                    <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Seja o primeiro a escrever!</p>
                  </div>
                ) : (
                  spaceMessages.map((msg, idx) => {
                    const isOwn = msg.sender?.name?.includes(user?.name?.toLowerCase() || '');
                    return (
                      <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-2xl ${
                              isOwn
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                            }`}>
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                              {new Date(msg.createTime).toLocaleString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Info footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  {googleConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Monitorando mensagens — verifique as notificações</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Reconecte ao Google para monitorar</span>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Selecione uma conversa</p>
                <p className="text-xs mt-1">
                  {googleConnected
                    ? 'Escolha uma sala para ver mensagens'
                    : 'Reconecte ao Google nas configurações'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
