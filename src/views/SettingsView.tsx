import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  User,
  ShieldCheck,
  Calendar,
  Mail,
  HardDrive,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  Lock,
  Tag,
  Plus,
  Trash2,
  Link,
  Unlink2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Volume2,
  Upload
} from 'lucide-react';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';
import { TagBadge } from '../components/common/TagBadge';
import { StorageService } from '../lib/storage';
import { TabletExperienceCard } from '../components/common/TabletExperienceControls';
import { TelegramSettings } from '../components/TelegramSettings';

// Full CSV parser that handles quoted fields, escaped quotes (""), commas inside quotes
function fullParseCSV(text: string): string[][] {
  const result: string[][] = [];
  let currentField = '';
  let inQuotes = false;
  let currentRow: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        if (currentRow.some(f => f.length > 0) || result.length === 0) {
          result.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }

  currentRow.push(currentField);
  if (currentRow.some(f => f.length > 0) || result.length === 0) {
    result.push(currentRow);
  }

  return result;
}

// Helper function to parse CSV line respecting quotes and commas within quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

const TAG_COLOR_OPTIONS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#64748b'  // Slate
];

const TagsManagementSection: React.FC = () => {
  const { tags, addTag, deleteTag } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_OPTIONS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    addTag({
      name: newTagName.trim(),
      color: newTagColor
    });

    setNewTagName('');
    setIsCreating(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Gerenciamento de Tags & Categorias
            </h2>
            <p className="text-xs text-slate-500">
              Crie tags para classificar reuniões, tarefas, notas e e-mails
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tag</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateTag} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Tag
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Comercial, Implementos, Diretoria..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cor
              </label>
              <div className="flex items-center gap-1.5">
                {TAG_COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newTagColor === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Salvar Tag
            </button>
          </div>
        </form>
      )}

      {/* Tags List */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {tags.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: t.color || '#059669' }}
            />
            <span className="text-slate-800 dark:text-slate-200">{t.name}</span>
            <button
              type="button"
              onClick={() => deleteTag(t.id)}
              className="text-slate-400 hover:text-red-500 ml-1 p-0.5"
              title="Excluir tag"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { user, updateUser, resetDatabase, weatherLocation, setWeatherLocation, events, addEvent } = useApp();

  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [weatherCityName, setWeatherCityName] = useState(weatherLocation?.cityName || 'Passo Fundo, RS');
  const [weatherLatitude, setWeatherLatitude] = useState(weatherLocation?.latitude?.toString() || '');
  const [weatherLongitude, setWeatherLongitude] = useState(weatherLocation?.longitude?.toString() || '');
  const [isSavingWeather, setIsSavingWeather] = useState(false);
  const [weatherSavedMessage, setWeatherSavedMessage] = useState<string | null>(null);
  const [googleStatus, setGoogleStatus] = useState<{ configured: boolean; connected: boolean; message: string; hasWriteAccess?: boolean } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [showRestartAlert, setShowRestartAlert] = useState(false);
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [googleSyncMessage, setGoogleSyncMessage] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; model: string; hasKey: boolean } | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [showGeminiRestartAlert, setShowGeminiRestartAlert] = useState(false);
  const [logoUrl, setLogoUrl] = useState(user.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(user.logoUrl || null);

  // OpenRouter state
  const [openRouterStatus, setOpenRouterStatus] = useState<{ configured: boolean; model: string } | null>(null);
  const [isLoadingOpenRouter, setIsLoadingOpenRouter] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [isSavingOpenRouter, setIsSavingOpenRouter] = useState(false);

  // Email IMAP state
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; host?: string; user?: string } | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [emailHost, setEmailHost] = useState('imap.gmail.com');
  const [emailPort, setEmailPort] = useState('993');
  const [emailUser, setEmailUser] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailSecurity, setEmailSecurity] = useState<'ssl' | 'tls' | 'none'>('ssl');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Calendar ICS state
  const [calendarStatus, setCalendarStatus] = useState<{ configured: boolean; url?: string; fileCount?: number; urlCount?: number; eventCount?: number; lastRefresh?: number } | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [calendarIcsPath, setCalendarIcsPath] = useState('');
  const [calendarIcsUrl, setCalendarIcsUrl] = useState('');
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drive Local state
  const [driveStatus, setDriveStatus] = useState<{ configured: boolean; type?: string; path?: string; url?: string } | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [drivePath, setDrivePath] = useState('drive/');
  const [isSavingDrive, setIsSavingDrive] = useState(false);

  useEffect(() => {
    fetchGoogleStatus();
    fetchGeminiStatus();
    fetchOpenRouterStatus();
    fetchEmailStatus();
    fetchCalendarStatus();
    fetchDriveStatus();
    // Carregar logo do servidor para garantir consistência
    fetch('/api/settings/logo')
      .then(res => res.json())
      .then(data => {
        if (data.logoUrl && data.logoUrl !== user.logoUrl) {
          setLogoUrl(data.logoUrl);
          setLogoPreview(data.logoUrl);
          updateUser({ logoUrl: data.logoUrl });
        }
      })
      .catch(err => console.error('Erro ao carregar logo do servidor:', err));
    // Carregar localização do weather do servidor
    fetch('/api/settings/weather-location')
      .then(res => res.json())
      .then(data => {
        if (data.latitude && data.longitude) {
          setWeatherLatitude(data.latitude.toString());
          setWeatherLongitude(data.longitude.toString());
          setWeatherCityName(data.cityName || 'Passo Fundo, RS');
          // Sincronizar com o contexto
          // setSelectedWeatherLocationId(data.id);
        }
      })
      .catch(err => console.error('Erro ao carregar localização do weather do servidor:', err));

    // Verificar se veio do callback do Google (parâmetro google=connected)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('google') === 'connected') {
      // Remover o parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname);
      // Atualizar o status sem recarregar a página
      fetchGoogleStatus();
    }
  }, []);


  // OpenRouter handlers
  const fetchOpenRouterStatus = async () => {
    setIsLoadingOpenRouter(true);
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setOpenRouterStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do OpenRouter:", error);
    } finally {
      setIsLoadingOpenRouter(false);
    }
  };

  const handleSaveOpenRouterConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openRouterApiKey.trim()) return;
    setIsSavingOpenRouter(true);
    try {
      const response = await fetch('/api/ai/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: openRouterApiKey.trim(), model: openRouterModel })
      });
      const data = await response.json();
      if (data.success) {
        fetchOpenRouterStatus();
        setOpenRouterApiKey('');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingOpenRouter(false);
    }
  };

  // Email handlers
  const fetchEmailStatus = async () => {
    setIsLoadingEmail(true);
    try {
      const response = await fetch('/api/email/status');
      const data = await response.json();
      setEmailStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do email:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailHost || !emailUser || !emailPass) return;
    setIsSavingEmail(true);
    try {
      const response = await fetch('/api/email/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: emailHost,
          port: parseInt(emailPort),
          user: emailUser,
          pass: emailPass,
          security: emailSecurity
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchEmailStatus();
        setEmailPass('');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Calendar handlers
  const fetchCalendarStatus = async () => {
    setIsLoadingCalendar(true);
    try {
      const response = await fetch('/api/calendar/status');
      const data = await response.json();
      setCalendarStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do calendário:", error);
      setCalendarStatus({ configured: false, fileCount: 0 });
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleSaveCalendarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarIcsPath.trim() && !calendarIcsUrl.trim()) return;
    setIsSavingCalendar(true);
    try {
      const payload: any = {
        icsFiles: calendarIcsPath.trim() ? [calendarIcsPath.trim()] : [],
        icsUrls: calendarIcsUrl.trim() ? [calendarIcsUrl.trim()] : []
      };
      const response = await fetch('/api/calendar/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setCalendarIcsPath('');
        setCalendarIcsUrl('');
        fetchCalendarStatus();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingCalendar(false);
    }
  };

  const handleRefreshCalendar = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/calendar/refresh', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        fetchCalendarStatus();
      }
    } catch (error) {
      console.error('Erro ao refrescar calendário:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Drive handlers
  const fetchDriveStatus = async () => {
    setIsLoadingDrive(true);
    try {
      const response = await fetch('/api/drive/status');
      const data = await response.json();
      setDriveStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do drive:", error);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drivePath.trim()) return;
    setIsSavingDrive(true);
    try {
      const response = await fetch('/api/drive/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'local', path: drivePath })
      });
      const data = await response.json();
      if (data.success) {
        setDrivePath('');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingDrive(false);
    }
  };

  const fetchGeminiStatus = async () => {
    setIsLoadingGemini(true);
    try {
      const response = await fetch('/api/settings/gemini-status');
      const data = await response.json();
      setGeminiStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do Gemini:", error);
    } finally {
      setIsLoadingGemini(false);
    }
  };

  const handleSaveGeminiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;
    setIsSavingGemini(true);
    try {
      const response = await fetch('/api/settings/gemini-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey.trim(), model: geminiModel })
      });
      const data = await response.json();
      if (data.success) {
        setShowGeminiRestartAlert(true);
        fetchGeminiStatus();
        setGeminiApiKey('');
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingGemini(false);
    }
  };

  const fetchGoogleStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('/api/auth/google/status', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await response.json();
      setGoogleStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status do Google:", error);
      setGoogleStatus({ configured: true, connected: false, message: "Erro ao conectar" });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const handleSyncGoogle = async () => {
    setGoogleSyncLoading(true);
    setGoogleSyncMessage(null);
    try {
      // Buscar eventos do calendário
      const eventsRes = await fetch('/api/google/calendar/events', { credentials: 'same-origin' });
      const eventsData = await eventsRes.json();
      if (eventsData.events && eventsData.events.length > 0) {
        // Salvar eventos no contexto
        const newEvents = eventsData.events.filter((event: any) =>
          !events.some(e => e.id === event.id)
        );
        if (newEvents.length > 0) {
          newEvents.forEach((event: any) => addEvent(event));
        }
        setGoogleSyncMessage(`✅ ${eventsData.events.length} eventos do calendário sincronizados! (${newEvents.length} novos)`);
      } else {
        setGoogleSyncMessage('⚠️ Nenhum evento novo encontrado no Google Calendar');
      }
    } catch (error) {
      setGoogleSyncMessage('❌ Erro ao sincronizar dados do Google');
      console.error(error);
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Deseja desconectar sua conta Google?')) return;
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      fetchGoogleStatus();
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    }
  };

  const handleSaveGoogleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await fetch('/api/settings/google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret })
      });
      const data = await response.json();
      if (data.success) {
        setShowRestartAlert(true);
        fetchGoogleStatus();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao salvar configuração.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: userName,
      email: userEmail
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar os dados de exemplo da NuRa?')) {
      resetDatabase();
      alert('Dados restaurados com sucesso!');
    }
  };

  const handleExportJSON = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nura_backup_${Date.now()}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(
      '⚠️ ATENÇÃO: A importação substituirá TODOS os dados atuais.\n\n' +
      'Todos os dados do seu dispositivo serão substituídos pelos dados do backup.\n' +
      'Esta ação não pode ser desfeita.\n\nDeseja continuar?'
    )) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      if (!json) return;

      try {
        const parsed = JSON.parse(json);

        // Validação básica
        if (!parsed.user && !parsed.tasks && !parsed.meetings && !parsed.notes) {
          alert('O arquivo de backup não contém dados válidos.');
          return;
        }

        // Salvar no localStorage
        StorageService.importAllData(json);

        alert('✅ Dados importados com sucesso! A página será recarregada.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        console.error('Erro ao importar:', err);
        alert('❌ Erro ao processar o arquivo de backup. Certifique-se de que é um arquivo JSON válido.');
      }
    };
    reader.onerror = () => {
      alert('❌ Erro ao ler o arquivo.');
    };
    reader.readAsText(file);

    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleImportTrello = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(
      '🚨 IMPORTANTE: Para importar do Trello, você precisa exportar seu board como CSV.\n\n' +
      '📥 COMO EXPORTAR DO TRELLO (GRATUITO):\n' +
      '   1. Abra seu board no Trello\n' +
      '   2. Clique em "Menu" (lado direito, ⋯)\n' +
      '   3. Vá em "Mais" → "Imprimir e Exportar"\n' +
      '   4. Selecione: "Exportar como CSV"\n' +
      '   5. Clique em "Exportar"\n' +
      '   6. Salve o arquivo .csv baixado\n\n' +
      '✅ O QUE SERÁ IMPORTADO:\n' +
      '   • Nome do cartão → Título da tarefa\n' +
      '   • Descrição → Descrição da tarefa\n' +
      '   • Data de vencimento → Data de vencimento da tarefa (se houver)\n' +
      '   • Etiquetas → Tags (uma por etiqueta)\n' +
      '   • Primeiro membro atribuído → Responsável da tarefa\n' +
      '   • Cartão arquivado/fechado → Status "done"\n' +
      '   • Cartão ativo/aberto → Status "todo"\n\n' +
      '📝 OBSERVAÇÕES IMPORTANTES:\n' +
      '   • Esta importação apenas ADICIONA tarefas - seus dados existentes ficam intactos\n' +
      '   • Tarefas importadas terão ID único baseado no ID do cartão do Trello\n' +
      '   • Use a busca global (Ctrl+K) e digite "trello-import" para localizá-las facilmente\n\n' +
      'Deseja continuar com a importação?'
    )) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        console.log('🔍 Iniciando importação Trello...', text.substring(0, 300));

        // Detectar se é JSON ou CSV
        const trimmed = text.trim();
        let cards: any[] = [];

        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const json = JSON.parse(trimmed);

            if (Array.isArray(json)) {
              if (json.length > 0 && typeof json[0] === 'object') {
                cards = json;
                console.log('📋 JSON array de objetos detectado, campos:', Object.keys(json[0]).slice(0, 8));
              }
            } else if (json.cards && Array.isArray(json.cards)) {
              cards = json.cards;
              console.log('📋 JSON com propriedade "cards" detectado');
            } else {
              const keys = Object.keys(json);
              for (const key of keys) {
                if (Array.isArray(json[key]) && json[key].length > 0 && typeof json[key][0] === 'object') {
                  const sample = json[key][0];
                  if (sample.name || sample.id || sample.Name || sample.Id) {
                    cards = json[key];
                    console.log('📋 Encontrado array de cards em propriedade:', key);
                    break;
                  }
                }
              }
            }

            if (cards.length === 0) {
              throw new Error('JSON parseado mas não encontrou array de cards. Estrutura: ' + JSON.stringify(json).substring(0, 200));
            }
          } catch (jsonErr) {
            console.warn('Não é JSON válido, tentando como CSV...', jsonErr);
            const rows = fullParseCSV(trimmed);
            if (rows.length < 2) throw new Error('Arquivo não é JSON nem CSV válido.');

            const headers = rows[0].map(h => h.trim());
            console.log('📋 CSV headers:', headers);

            cards = rows.slice(1).map(row => {
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = row[i] || ''; });
              return obj;
            });
          }
        } else {
          const rows = fullParseCSV(trimmed);
          if (rows.length < 2) throw new Error('CSV vazio ou inválido.');

          const headers = rows[0].map(h => h.trim());
          console.log('📋 CSV headers:', headers);

          cards = rows.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((h, i) => { obj[h] = row[i] || ''; });
            return obj;
          });
        }

        // Função auxiliar para obter valor de campo com normalização de nome
        const getCardField = (card: any, ...fieldNames: string[]): string => {
          for (const name of fieldNames) {
            const lower = name.toLowerCase();
            for (const key of Object.keys(card)) {
              if (key.toLowerCase() === lower) return String(card[key] || '');
            }
          }
          return '';
        };

        const tasks: any[] = [];

        for (const card of cards) {
          const cardId = getCardField(card, 'id', 'card id') || `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const name = getCardField(card, 'name', 'title') || 'Sem título';
          const description = getCardField(card, 'description', 'desc');
          const dueDateRaw = getCardField(card, 'due date', 'due');
          const labelsRaw = getCardField(card, 'labels', 'label');
          const membersRaw = getCardField(card, 'members', 'member');
          const closedRaw = getCardField(card, 'closed', 'archived');

          if (tasks.length === 0) {
            console.log('📌 Primeiro cartão:', { cardId, name, description: description?.substring(0, 50), dueDateRaw, labelsRaw, membersRaw, closedRaw });
            console.log('   Chaves disponíveis:', Object.keys(card));
          }

          let dueDate: string | undefined = undefined;
          if (dueDateRaw && dueDateRaw.trim()) {
            const match = dueDateRaw.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) {
              dueDate = match[1];
            } else {
              try {
                const parsed = new Date(dueDateRaw);
                if (!isNaN(parsed.getTime())) dueDate = parsed.toISOString().split('T')[0];
              } catch (e) {}
            }
          }

          const tags: string[] = labelsRaw
            ? labelsRaw.split(',').map(t => t.trim()).filter(t => t)
            : [];

          let assignee = 'Usuário do Trello';
          if (membersRaw && membersRaw.trim()) {
            const ma = membersRaw.split(',').map(m => m.trim()).filter(m => m);
            if (ma.length > 0) assignee = /^\d+$/.test(ma[0]) ? `Membro ${ma[0]}` : ma[0];
          }

          const status: 'todo' | 'done' =
            ['true', '1', 'yes', 'sim'].includes(closedRaw.toLowerCase().trim()) ? 'done' : 'todo';

          const sanitizedId = cardId.toString().replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '');

          tasks.push({
            id: sanitizedId ? `trello_${sanitizedId}` : `trello_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: name.trim(),
            description: description.trim(),
            assignee,
            dueDate,
            priority: 'medium' as const,
            tags,
            status,
            originType: 'trello-import' as const
          });
        }

        console.log(`✅ Processadas ${tasks.length} tarefas`);

        if (tasks.length === 0) {
          alert('Nenhum cartão válido encontrado.');
          return;
        }

        const existingTasks = StorageService.getTasks();
        const allTasks = [...existingTasks, ...tasks];
        StorageService.saveTasks(allTasks);

        alert(`✅ SUCESSO! ${tasks.length} tarefas importadas do Trello.\n\n` +
              '🔍 Use a busca global (Ctrl+K) e digite "trello-import" para encontrá-las.');

        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        console.error('Erro ao importar Trello:', err);
        alert('❌ ERRO: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.onerror = () => {
      alert('❌ ERRO AO LER O ARQUIVO\n\n' +
            'Não foi possível ler o arquivo selecionado.\n\n' +
            'POSSÍVEIS CAUSAS:\n' +
            '   • O arquivo está corrompido ou danificado\n' +
            '   • Você não tem permissão para acessar o arquivo\n' +
            '   • O arquivo é muito grande (tente com um board menor primeiro)\n\n' +
            'SOLUÇÃO:\n' +
            '   • Tente selecionar o arquivo novamente\n' +
            '   • Se persistir, faça uma nova exportação do Trello usando:\n' +
            '     Menu → Mais → Imprimir e Exportar → Exportar como CSV');
    };
    reader.readAsText(file);

    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleSaveWeatherLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const latitude = parseFloat(weatherLatitude);
    const longitude = parseFloat(weatherLongitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      setWeatherSavedMessage('Erro: Coordenadas inválidas.');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setWeatherSavedMessage('Erro: Latitude deve estar entre -90 e 90, longitude entre -180 e 180.');
      return;
    }

    setIsSavingWeather(true);
    try {
      const response = await fetch('/api/settings/weather-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          cityName: weatherCityName.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setWeatherSavedMessage(`✅ Localização salva: ${weatherCityName.trim() || 'Localização atualizada'}! A previsão do tempo será atualizada.`);
      } else {
        setWeatherSavedMessage(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      setWeatherSavedMessage('❌ Erro ao salvar localização. Tente novamente.');
    } finally {
      setIsSavingWeather(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWeatherLatitude(position.coords.latitude.toString());
          setWeatherLongitude(position.coords.longitude.toString());
          setWeatherCityName('Localização atual detectada');
        },
        (error) => {
          setWeatherSavedMessage('Erro ao obter localização: ' + error.message);
        }
      );
    } else {
      setWeatherSavedMessage('Geolocalização não suportada pelo navegador.');
    }
  };

  return (
    <div id="settings-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Configurações & Integrações
            </h1>
            <p className="text-xs text-slate-500">
              Preferências da conta, integrações Google Workspace e persistência
            </p>
          </div>
        </div>
      </div>

      <TabletExperienceCard />

      {/* User Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Perfil do Usuário Principal
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail Google Conectado
            </label>
            <input
              type="email"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Salvar Alterações
            </button>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Google Integration Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Integrações Google Workspace
            </h2>
          </div>

          {isLoadingStatus ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : googleStatus?.configured ? (
            googleStatus.connected ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSyncGoogle}
                  disabled={googleSyncLoading}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw className={`w-3 h-3 ${googleSyncLoading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </button>
                <button
                  onClick={() => { window.location.href = '/api/auth/google?force=true'; }}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800/50"
                >
                  <RotateCcw className="w-3 h-3" /> Reconectar com permissões completas
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <Unlink2 className="w-3 h-3" /> Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
              >
                <Link className="w-3 h-3" /> Conectar Google
              </button>
            )
          ) : (
            <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-200 dark:border-amber-800/50">
              <AlertCircle className="w-3 h-3" /> Requer config no .env
            </div>
          )}
        </div>

        {!isLoadingStatus && !googleStatus?.configured && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-3">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              <strong>Configuração necessária:</strong> Cole abaixo o <strong>Client ID</strong> e <strong>Client Secret</strong> do seu projeto Google Cloud e clique em Salvar.
            </p>

            <form onSubmit={handleSaveGoogleConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="xxxxxxxxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client Secret
                </label>
                <input
                  type="password"
                  required
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar no .env'
                )}
              </button>
            </form>

            <p className="text-[10px] text-amber-600 dark:text-amber-500">
              Dica: No Google Cloud Console → APIs e Serviços → Credenciais → ID do cliente OAuth 2.0
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl border transition-all ${googleStatus?.connected ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className={`w-3.5 h-3.5 ${googleStatus?.connected ? 'text-blue-600' : 'text-slate-400'}`} />
                Calendar
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${googleStatus?.connected && googleStatus?.hasWriteAccess ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
                {googleStatus?.connected ? (googleStatus.hasWriteAccess ? 'Ativo ✓' : 'Ativo ⚠️') : 'Inativo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {googleStatus?.connected
                ? 'Clique em "Sincronizar" para buscar seus eventos.'
                : 'A sincronização requer autorização OAuth para ler seus eventos.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${googleStatus?.connected ? 'bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Mail className={`w-3.5 h-3.5 ${googleStatus?.connected ? 'text-red-600' : 'text-slate-400'}`} />
                Gmail
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${googleStatus?.connected ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {googleStatus?.connected ? 'Conectado' : 'Inativo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {googleStatus?.connected
                ? 'Leitura de e-mails autorizada. Visualização disponível na aba Email.'
                : 'Autorização necessária para gerenciar sua caixa de entrada.'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${googleStatus?.connected ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HardDrive className={`w-3.5 h-3.5 ${googleStatus?.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
                Drive
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${googleStatus?.connected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {googleStatus?.connected ? 'Conectado' : 'Inativo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {googleStatus?.connected
                ? 'Acesso a arquivos e documentos do Workspace ativo.'
                : 'Autorização necessária para listar e abrir seus arquivos.'}
            </p>
          </div>
        </div>
      </div>

      {/* Restart Alert */}
      {showRestartAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Configurações Salvas!</h3>
                <p className="text-xs text-slate-500">As credenciais do Google foram gravadas no arquivo <code>.env</code>.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Para que a integração com Google Calendar, Gmail e Drive funcione, <strong>o servidor precisa ser reiniciado</strong>.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRestartAlert(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Reiniciar Depois
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Reiniciar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Storage */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Gravações de Áudio
            </h2>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
            {(() => {
              try {
                const all = indexedDB.databases;
                return 'Armazenado em IndexedDB';
              } catch {
                return 'Local';
              }
            })()}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-tight">
          Áudios gravados são armazenados localmente no navegador. O áudio é automaticamente salvo quando você encerra a reunião ou no momento da transcrição.
        </p>
      </div>

      {/* Gemini AI Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Configuração da IA (Gemini)
            </h2>
          </div>
          {isLoadingGemini ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : geminiStatus?.hasKey ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Configurado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              Não configurado
            </span>
          )}
        </div>

        {!isLoadingGemini && !geminiStatus?.hasKey && (
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-3">
            <p className="text-[11px] text-purple-700 dark:text-purple-400 leading-relaxed">
              <strong>Configuração necessária:</strong> Cole sua <strong>API Key do Gemini</strong> para habilitar transcrição de áudio e resumos inteligentes de reuniões.
            </p>

            <form onSubmit={handleSaveGeminiConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  API Key do Gemini
                </label>
                <input
                  type="password"
                  required
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modelo
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (recomendado)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSavingGemini}
                className="w-full px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingGemini ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configuração'
                )}
              </button>
            </form>

            <p className="text-[10px] text-purple-600 dark:text-purple-500">
              Dica: Obtenha sua API Key gratuita em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
            </p>
          </div>
        )}

        {!isLoadingGemini && geminiStatus?.hasKey && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ✅ Gemini configurado com sucesso. A transcrição de áudio e resumos inteligentes estão ativos.
            </p>
          </div>
        )}
      </div>

      {/* Gemini Restart Alert */}
      {showGeminiRestartAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-purple-600">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Configuração Salva!</h3>
                <p className="text-xs text-slate-500">A API Key do Gemini foi gravada no arquivo <code>.env</code>.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Para que a IA funcione, <strong>o servidor precisa ser reiniciado</strong>.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGeminiRestartAlert(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Reiniciar Depois
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
              >
                Reiniciar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Configuration */}
      <TelegramSettings />

      {/* Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Aparência do Aplicativo
        </h2>
        <div className="max-w-xs">
          <ThemeSwitcher compact={false} />
        </div>
      </div>

      {/* Logo Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Logo do Aplicativo
        </h2>
        <p className="text-xs text-slate-500">
          Carregue uma imagem (PNG ou JPG) para ser exibida no cabeçalho do aplicativo.
        </p>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Logo Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-extrabold text-slate-400">N</span>
              )}
            </div>
            {logoUrl && (
              <button
                type="button"
                onClick={() => {
                  setLogoUrl('');
                  setLogoPreview(null);
                  updateUser({ logoUrl: '' });
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Remover logo
              </button>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Carregar Logo (PNG, JPG)
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Validate file type
                if (!['image/png', 'image/jpeg'].includes(file.type)) {
                  alert('Apenas arquivos PNG e JPG são permitidos.');
                  return;
                }

                // Validate file size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                  alert('O arquivo deve ter no máximo 2MB.');
                  return;
                }

                setIsUploadingLogo(true);

                try {
                  // Convert to base64
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64Data = reader.result as string;

                    // Upload to server
                    const response = await fetch('/api/settings/upload-logo', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ imageData: base64Data, filename: file.name })
                    });

                    if (!response.ok) {
                      throw new Error('Falha ao fazer upload da logo');
                    }

                    const data = await response.json();
                    setLogoUrl(data.url);
                    setLogoPreview(data.url);
                    updateUser({ logoUrl: data.url });
                  };
                  reader.readAsDataURL(file);
                } catch (error) {
                  console.error('Error uploading logo:', error);
                  alert('Erro ao fazer upload da logo. Tente novamente.');
                } finally {
                  setIsUploadingLogo(false);
                }
              }}
              className="hidden"
              id="logo-upload-input"
            />
            <label
              htmlFor="logo-upload-input"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isUploadingLogo ? 'Enviando...' : 'Selecionar Arquivo'}
            </label>
            <p className="mt-2 text-[10px] text-slate-500">
              Tamanho máximo: 2MB • Formatos: PNG, JPG
            </p>
          </div>
        </div>
      </div>

      {/* Weather Location Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Localização da Previsão do Tempo
          </h2>
        </div>

        <p className="text-xs text-slate-500">
          Configure a cidade onde você deseja ver a previsão do tempo. As coordenadas são usadas para buscar dados da API Open-Meteo.
        </p>

        <form onSubmit={handleSaveWeatherLocation} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={weatherLatitude}
                onChange={(e) => setWeatherLatitude(e.target.value)}
                placeholder="-28.2639"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={weatherLongitude}
                onChange={(e) => setWeatherLongitude(e.target.value)}
                placeholder="-52.4032"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Cidade (opcional)
            </label>
            <input
              type="text"
              value={weatherCityName}
              onChange={(e) => setWeatherCityName(e.target.value)}
              placeholder="Ex: Passo Fundo, RS"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingWeather}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isSavingWeather ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isSavingWeather ? 'Salvando...' : 'Salvar Localização'}</span>
            </button>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Usar Minha Localização Atual</span>
            </button>
          </div>

          {weatherSavedMessage && (
            <p className={`text-xs font-semibold ${weatherSavedMessage.includes('✅') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {weatherSavedMessage}
            </p>
          )}

          <p className="text-[11px] text-slate-400">
            Localização atual: {weatherLocation?.cityName || 'Não configurada'} ({weatherLocation?.latitude}, {weatherLocation?.longitude})
          </p>
        </form>
      </div>

      {/* Tags Management */}
      <TagsManagementSection />

      {/* Backup & Reset */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Gerenciamento de Dados & Memória
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar Backup (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportJSON}
            />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Importar do Trello (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportTrello}
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800/60 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Dados Iniciais</span>
          </button>
        </div>
      </div>

      {/* OpenRouter AI Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              IA Alternativa — OpenRouter (Grátis)
            </h2>
          </div>
          {isLoadingOpenRouter ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : openRouterStatus?.configured ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Configurado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              Não configurado
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          OpenRouter oferece modelos gratuitos como <strong>Llama 3.1</strong>, <strong>Mistral</strong> e <strong>Gemma</strong>.
          Crie uma conta grátis em <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline">openrouter.ai</a> para obter sua API Key.
        </p>

        {!isLoadingOpenRouter && !openRouterStatus?.configured && (
          <form onSubmit={handleSaveOpenRouterConfig} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                API Key do OpenRouter
              </label>
              <input
                type="password"
                value={openRouterApiKey}
                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Modelo
              </label>
              <select
                value={openRouterModel}
                onChange={(e) => setOpenRouterModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (grátis)</option>
                <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (grátis)</option>
                <option value="google/gemma-2-9b-it:free">Gemma 2 9B (grátis)</option>
                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B (pago)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingOpenRouter}
              className="w-full px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingOpenRouter ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>
          </form>
        )}

        {!isLoadingOpenRouter && openRouterStatus?.configured && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ✅ OpenRouter configurado com sucesso. Modelos de IA gratuitos disponíveis.
            </p>
          </div>
        )}
      </div>

      {/* Email IMAP Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Email — Conexão IMAP
            </h2>
          </div>
          {isLoadingEmail ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : emailStatus?.configured ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Configurado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              Não configurado
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Conecte sua conta de email via IMAP. Funciona com Gmail, Outlook, Proton, Yahoo e qualquer provedor.
        </p>

        {!isLoadingEmail && !emailStatus?.configured && (
          <form onSubmit={handleSaveEmailConfig} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Host IMAP
                </label>
                <input
                  type="text"
                  value={emailHost}
                  onChange={(e) => setEmailHost(e.target.value)}
                  placeholder="imap.gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Porta
                </label>
                <input
                  type="number"
                  value={emailPort}
                  onChange={(e) => setEmailPort(e.target.value)}
                  placeholder="993"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Usuário (email)
              </label>
              <input
                type="email"
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Senha / App Password
              </label>
              <input
                type="password"
                value={emailPass}
                onChange={(e) => setEmailPass(e.target.value)}
                placeholder="Sua senha ou app password"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Segurança
              </label>
              <select
                value={emailSecurity}
                onChange={(e) => setEmailSecurity(e.target.value as 'ssl' | 'tls' | 'none')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ssl">SSL (porta 993)</option>
                <option value="tls">TLS (porta 587)</option>
                <option value="none">Nenhuma (porta 143)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingEmail}
              className="w-full px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>
          </form>
        )}

        {!isLoadingEmail && emailStatus?.configured && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ✅ Email IMAP configurado como <strong>{emailStatus.user}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Calendar ICS Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Calendário — Google/ICS
            </h2>
          </div>
          {isLoadingCalendar ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : calendarStatus?.configured ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Configurado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              Não configurado
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Conecte seu Google Calendar usando o link ICS privado. O NuRa busca automaticamente a cada 1 hora.
        </p>

        {!isLoadingCalendar && !calendarStatus?.configured && (
          <form onSubmit={handleSaveCalendarConfig} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL do ICS Privado (Google Calendar)
              </label>
              <input
                type="url"
                value={calendarIcsUrl}
                onChange={(e) => setCalendarIcsUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/xxx%40group.calendar.google.com/private-xxx/basic.ics"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>Dica: Google Calendar → ⚙️ → Nome do calendário → Integrar calendário → Copiar link ICS secreto</span>
            </div>

            <button
              type="submit"
              disabled={isSavingCalendar || (!calendarIcsPath.trim() && !calendarIcsUrl.trim())}
              className="w-full px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingCalendar ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Sincronizar'
              )}
            </button>
          </form>
        )}

        {!isLoadingCalendar && calendarStatus?.configured && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                ✅ Calendário sincronizado: <strong>{calendarStatus.eventCount || 0}</strong> eventos carregados
              </p>
              {calendarStatus.lastRefresh && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">
                  Última atualização: {new Date(calendarStatus.lastRefresh).toLocaleString('pt-BR')}
                </p>
              )}
            </div>

            <button
              onClick={handleRefreshCalendar}
              disabled={isRefreshing}
              className="w-full px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sincronizar Agora
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Drive Local Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Drive Local
            </h2>
          </div>
          {isLoadingDrive ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : driveStatus?.configured ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Configurado
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              Não configurado
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Defina uma pasta local para armazenar e visualizar arquivos. Simula um drive pessoal no navegador.
        </p>

        {!isLoadingDrive && !driveStatus?.configured && (
          <form onSubmit={handleSaveDriveConfig} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Caminho da pasta (relativo ao projeto)
              </label>
              <input
                type="text"
                value={drivePath}
                onChange={(e) => setDrivePath(e.target.value)}
                placeholder="drive/"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingDrive}
              className="w-full px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingDrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>

            <p className="text-[10px] text-slate-400">
              A pasta será criada automaticamente se não existir.
            </p>
          </form>
        )}

        {!isLoadingDrive && driveStatus?.configured && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ✅ Drive configurado: <strong>{driveStatus.path}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};
