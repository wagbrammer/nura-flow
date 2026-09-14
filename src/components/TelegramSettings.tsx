import { useState, useEffect } from 'react';

interface TelegramSubscription {
  chatId: string;
  username?: string;
  firstName?: string;
  subscribedAt: string;
  enabled: boolean;
}

export const TelegramSettings = () => {
  const [status, setStatus] = useState<{ configured: boolean; subscribersCount: number; botUsername?: string } | null>(null);
  const [subscribers, setSubscribers] = useState<TelegramSubscription[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState({
    status: true,
    subscribers: true,
    test: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchSubscribers();
  }, []);

  const fetchStatus = async () => {
    setLoading(prev => ({ ...prev, status: true }));
    try {
      const response = await fetch('/api/telegram/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Falha ao obter status do Telegram');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, status: false }));
    }
  };

  const fetchSubscribers = async () => {
    setLoading(prev => ({ ...prev, subscribers: true }));
    try {
      const response = await fetch('/api/telegram/subscribers');
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (err) {
      setError('Falha ao obter lista de inscritos');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, subscribers: false }));
    }
  };

  const testConnection = async () => {
    setLoading(prev => ({ ...prev, test: true }));
    setTestResult(null);
    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: '123456789', // ID de teste - em produção, usar um chat real ou deixar vazio para validar apenas token
          message: '🧪 Teste de conexão do NuRa Flow'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setTestResult({ success: true, message: 'Conexão testada com sucesso!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erro ao testar conexão' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Falha na conexão' });
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, test: false }));
    }
  };

  const removeSubscriber = async (chatId: string) => {
    if (!window.confirm('Deseja realmente remover este inscrito?')) return;

    try {
      const response = await fetch(`/api/telegram/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });

      if (response.ok) {
        // Atualizar lista local
        setSubscribers(prev => prev.filter(sub => sub.chatId !== chatId));
        setStatus(prev => prev ? { ...prev, subscribersCount: prev.subscribersCount - 1 } : null);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover inscrito');
      }
    } catch (err) {
      setError('Falha ao remover inscrito');
      console.error(err);
    }
  };

  if (loading.status || loading.subscribers) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configuração do Telegram</h2>
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <span className="text-slate-500 text-xs">Carregando configuração...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configuração do Telegram</h2>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
            {error}
          </div>
        )}
        <div className="text-slate-500 text-xs">Não foi possível conectar ao servidor. Verifique se o backend está rodando.</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16l-4-4m8 8V9a4 4 0 00-4-4H9a4 4 0 00-4-4v3" />
        </svg>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Configuração do Telegram</h2>
      </div>

      {/* Status do Bot */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
        <h3 className="font-semibold mb-2 flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.304-.22-2.575-.655-3.726z" />
          </svg>
          Status do Bot
        </h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-gray-600">Token configurado:</span>
            <span className={`font-medium ${status.configured ? 'text-green-600' : 'text-red-600'}`}>
              {status.configured ? '✅ Sim' : '❌ Não'}
            </span>
          </div>
          {status.botUsername && (
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">Username do bot:</span>
              <span className="font-medium">@{status.botUsername}</span>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <span className="text-gray-600">Total de inscritos:</span>
            <span className="font-medium text-emerald-600">{status.subscribersCount}</span>
          </div>
        </div>
      </div>

      {/* Lista de Inscritos */}
      {subscribers.length > 0 && (
        <>
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
              </svg>
              Inscritos Ativos
            </h3>
            <div className="space-y-3">
              {subscribers.map(sub => (
                <div key={sub.chatId} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="font-medium">{sub.firstName || sub.username || 'Usuário'} </p>
                    <p className="text-sm text-gray-500">
                      Chat ID: {sub.chatId} •
                      <span className="whitespace-nowrap">
                        {new Date(sub.subscribedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeSubscriber(sub.chatId)}
                    className="px-3 py-1 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 dark:text-red-400 font-medium rounded text-sm"
                    disabled={loading.test}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Teste de Conexão */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 flex items-center space-x-2">
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Teste de Conexão
        </h3>
        <div className="space-y-3">
          <button
            onClick={testConnection}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            disabled={loading.test}
          >
            {loading.test ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Testando...
              </>
            ) : (
              'Testar Conexão'
            )}
          </button>
          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.success ? '✅ Sucesso' : '❌ Falha'}
              </span>
              <p className="mt-1 text-sm">{testResult.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-slate-800/20 rounded-lg border-l-4 border-blue-400">
        <h3 className="font-semibold mb-3 flex items-center space-x-2 text-blue-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Como Configurar
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            Abra o Telegram e procure por <strong>@{status.botUsername || 'seu_bot'}</strong> (ou use o link direto que você obteve ao criar o bot com @BotFather)
          </li>
          <li>
            Envie o comando <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">/start</code> para o bot
          </li>
          <li>
            Você receberá uma mensagem de boas-vindas e estará inscrito para receber notificações do NuRa Flow
          </li>
          <li>
            Para parar de receber notificações, envie <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">/parar</code> a qualquer momento
          </li>
        </ol>
        {status.configured && subscribers.length === 0 && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl text-yellow-800 dark:text-yellow-400 text-xs">
            ⚠️ Nenhum inscrito ainda. Envie /start para o bot no Telegram para começar a receber notificações.
          </div>
        )}
      </div>
    </div>
  );
};