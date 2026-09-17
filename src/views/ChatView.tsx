import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Search,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ChatMessage } from '../types';

interface GoogleSpace {
  name: string;
  displayName: string;
  spaceType: string;
  spaceId: string;
  isDM: boolean;
}

export const ChatView: React.FC = () => {
  const { user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [googleSpaces, setGoogleSpaces] = useState<GoogleSpace[]>([]);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);

  // Fetch spaces and check connection on mount
  useEffect(() => {
    const fetchData = async () => {
      // Check connection
      try {
        const statusRes = await fetch('/api/auth/google/status', { credentials: 'same-origin' });
        const statusData = await statusRes.json();
        console.log('📊 Status do Google:', statusData);
        setGoogleConnected(statusData?.connected || false);
      } catch (err) {
        console.error('Erro ao verificar status do Google:', err);
      }

      // Fetch spaces
      console.log('🔍 Buscando espaços do Google Chat...');
      setLoadingSpaces(true);
      fetch('/api/google/chat/spaces', { credentials: 'same-origin' })
        .then(res => {
          console.log('📡 Resposta da API de espaços:', res.status, res.statusText);
          return res.json();
        })
        .then(data => {
          console.log('📦 Dados recebidos:', JSON.stringify(data, null, 2));
          const spaces: GoogleSpace[] = data.spaces || [];
          setGoogleSpaces(spaces);
          if (spaces.length === 0) {
            console.log('⚠️ Nenhum espaço encontrado');
          }
        })
        .catch(err => {
          console.error('❌ Erro ao buscar espaços:', err);
        })
        .finally(() => setLoadingSpaces(false));
    };

    fetchData();
  }, []);

  const filteredSpaces = googleSpaces.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSpace = googleSpaces.find(s => s.spaceId === selectedSpaceId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedSpaceId) return;

    setIsSending(true);
    setSendMessageError(null);

    // Send via API if Google is connected
    if (googleConnected && selectedSpace) {
      try {
        const res = await fetch('/api/google/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            roomId: selectedSpace.spaceId,
            text: messageText.trim()
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enviar mensagem');
        }

        console.log('✅ Mensagem enviada via API:', data.messageId);
        setMessageText('');
      } catch (err: any) {
        console.warn('API falhou:', err.message);
        setSendMessageError(err.message);
      }
    } else {
      // No Google connection - just clear input
      setMessageText('');
    }

    setIsSending(false);
  };

  const handleOpenInChat = (space: GoogleSpace) => {
    const url = `https://chat.google.com/u/0/${space.name}`;
    window.open(url, '_blank');
  };

  const handleOpenChat = () => {
    window.open('https://chat.google.com', '_blank');
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
                ? 'Conectado ao Google Chat'
                : '⚠️ Reconecte ao Google nas Configurações para usar o Chat'}
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
            onClick={handleOpenChat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="Abrir Google Chat"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Spaces List + Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Spaces List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Salas & Conversas ({filteredSpaces.length})
            </h3>
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
                  <p className="text-xs mt-2 text-amber-600">Reconecte ao Google nas configurações</p>
                )}
              </div>
            ) : (
              filteredSpaces.map(space => {
                const isSelected = selectedSpaceId === space.spaceId;
                const isDM = space.isDM;

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
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {space.displayName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isDM ? 'Conversa direta' : 'Sala'}
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
                );
              })
            )}
          </div>
        </div>

        {/* Conversation View (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {selectedSpace ? (
            <>
              {/* Conversation Header */}
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenInChat(selectedSpace)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                    title="Abrir no Google Chat"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="w-12 h-12 opacity-30 mb-3" />
                  <p className="text-sm font-medium">Envie uma mensagem</p>
                  <p className="text-xs mt-1">A API do Google Chat permite enviar mensagens, mas não ler histórico</p>
                  <p className="text-xs mt-2 text-emerald-600">Use o Google Chat para ver conversas anteriores</p>
                </div>
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      disabled={isSending}
                    />
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
                        Conectado ao Google Chat
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        Modo local — conecte ao Google para enviar
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
                    ? 'Escolha uma sala para enviar mensagem'
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
