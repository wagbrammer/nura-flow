import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

import {
  Sun,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Radio,
  FileText,
  AlertTriangle,
  Users,
  CheckCircle2,
  TrendingUp,
  Inbox,
  Paperclip,
  PenTool,
  Edit3,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Loader2,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { MeetingMiniAtaModal } from '../components/common/MeetingMiniAtaModal';
import { formatDateBR } from '../lib/date';
import { SortableItem } from '../components/common/SortableItem';

// Lista de Frases Motivacionais de Marketing
const MARKETING_QUOTES = [
  "O bom marketing faz a empresa parecer inteligente. O ótimo marketing faz o cliente parecer inteligente. - Joe Chernov",
  "As pessoas não compram o que você faz, elas compram o porquê de você fazer isso. - Simon Sinek",
  "O melhor marketing não parece marketing. - Tom Fishburne",
  "Não encontre clientes para os seus produtos, encontre produtos para os seus clientes. - Seth Godin",
  "Marketing é sobre conexões, não sobre transações. - Robby Berthume",
  "Fazer negócios sem marketing é como piscar para uma garota no escuro. Você sabe o que está fazendo, mas ninguém mais sabe. - Steuart Henderson Britt",
  "Seja tão bom que eles não possam te ignorar. - Steve Martin",
  "A consistência supera a genialidade. Continue conectando com o seu público.",
  "O valor de uma marca é construído a cada pequena interação com o cliente.",
  "Diga a verdade, mas torne a verdade fascinante. - David Ogilvy"
];

interface HourlyForecast {
  time: string;
  temp: number;
  conditionCode: number;
  precipProb: number;
}

interface WeatherData {
  temp: number;
  wind: number;
  conditionCode: number;
  city: string;
  hourly: HourlyForecast[];
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    time: string[];
    precipitation_probability_max: number[];
  };
}

export const TodayView: React.FC = () => {
  const {
    user,
    meetings,
    tasks,
    inbox,
    projects,
    toggleTaskStatus,
    startMeetingMode,
    setCurrentView,
    setSelectedMeetingId,
    setIsQuickCaptureOpen,
    quickSummary,
    setQuickSummary,
    notes
  } = useApp();

  // State to hold the order of grid blocks (by IDs)
  const [blockOrder, setBlockOrder] = useState<string[]>(['nextMeeting', 'tasks', 'weather', 'quotes', 'pomodoro', 'quickCapture']);
  const [isEditMode, setIsEditMode] = useState(false);

  // Move block up in the order
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    setBlockOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  };

  // Move block down in the order
  const moveBlockDown = (index: number) => {
    if (index === blockOrder.length - 1) return;
    setBlockOrder(prev => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  // Mapping of block IDs to JSX
  const renderBlock = (id: string) => {
    switch (id) {
      case 'nextMeeting':
        return upcomingTodayMeeting ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Próxima Reunião do Dia
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {upcomingTodayMeeting.startTime} - {upcomingTodayMeeting.endTime}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {upcomingTodayMeeting.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {upcomingTodayMeeting.agenda}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{upcomingTodayMeeting.participants.map(p => p.name).join(', ')}</span>
              </div>
              {upcomingTodayMeeting.location && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{upcomingTodayMeeting.location}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                id="start-live-meeting-btn"
                onClick={() => startMeetingMode(upcomingTodayMeeting.id)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Radio className="w-4 h-4" />
                <span>Modo Reunião (Foco)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalMeetingId(upcomingTodayMeeting.id)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>Mini Ata & Anexos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMeetingId(upcomingTodayMeeting.id);
                  setCurrentView('meetings');
                }}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                Ver Preparação
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center py-10 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Agenda Livre de Reuniões Restantes
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Aproveite o tempo de foco contínuo para avançar nas entregas prioritárias da NuRa.
            </p>
          </div>
        );

      case 'tasks':
        return (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tarefas do Dia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('tasks')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map(t => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(t.id)}
                    className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-emerald-600 transition-colors shrink-0"
                  >
                    {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Clima em {weather?.city || 'Local'}
                </h3>
              </div>
            </div>
            {isLoadingWeather ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : weather ? (
              <div>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                    {weather.temp}°C
                  </span>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p>{getWeatherIcon(weather.conditionCode)}</p>
                    <p className="mt-1">Vento: {weather.wind} km/h</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {weather.hourly.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex-1 text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[10px] text-slate-500">{h.time}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {h.temp}°
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nenhum dado disponível</p>
            )}
          </div>
        );

      case 'quotes':
        return (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <h3 className="text-sm font-bold text-emerald-100">
                Frase do Dia
              </h3>
            </div>
            <p className="text-sm font-semibold leading-relaxed italic">
              "{quote}"
            </p>
          </div>
        );

      case 'pomodoro':
        return (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Pomodoro
                </h3>
              </div>
            </div>
            <div className="text-center py-6">
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                25:00
              </p>
              <p className="text-xs text-slate-500 mt-2">Foco: 25 minutos</p>
            </div>
          </div>
        );

      case 'quickCapture':
        return (
          <div
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
            onClick={() => setIsQuickCaptureOpen(true)}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Captura Rápida
              </h3>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Clique para registrar uma nova tarefa ou nota
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const [briefingText, setBriefingText] = useState(quickSummary);
  const [activeModalMeetingId, setActiveModalMeetingId] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Estados de customização (Frase & Clima)
  const [quote, setQuote] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingStatusWeather] = useState(true);
  const [showWeeklyForecast, setShowWeeklyForecast] = useState(false);

  // Selecionar frase baseada no dia ou aleatória
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MARKETING_QUOTES.length);
    setQuote(MARKETING_QUOTES[randomIndex]);
  }, []);

  // Previsão do tempo com localização configurável
  const { weatherLocation } = useApp();
  useEffect(() => {
    if (!weatherLocation ||
        weatherLocation.latitude === undefined ||
        weatherLocation.longitude === undefined ||
        weatherLocation.cityName === undefined) {
      setIsLoadingStatusWeather(false);
      return;
    }

    const fetchWeather = async () => {
      const { latitude, longitude, cityName } = weatherLocation;
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto`
        );
        const data = await res.json();

        if (data.current_weather) {
          const hourlyForecasts: HourlyForecast[] = [];
          if (data.hourly && data.hourly.time) {
            const now = new Date();
            const currentHour = now.getHours();

            const intervals = [2, 4, 6];
            intervals.forEach(offset => {
              const targetHour = (currentHour + offset) % 24;
              const targetIndex = data.hourly.time.findIndex((t: string) => {
                const date = new Date(t);
                return date.getHours() === targetHour && date.getDate() === (currentHour + offset >= 24 ? now.getDate() + 1 : now.getDate());
              });

              if (targetIndex !== -1) {
                hourlyForecasts.push({
                  time: `${targetHour.toString().padStart(2, '0')}:00`,
                  temp: Math.round(data.hourly.temperature_2m[targetIndex]),
                  conditionCode: data.hourly.weathercode[targetIndex],
                  precipProb: data.hourly.precipitation_probability[targetIndex]
                });
              }
            });
          }

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            wind: Math.round(data.current_weather.windspeed),
            conditionCode: data.current_weather.weathercode,
            city: cityName || 'Localização não definida',
            hourly: hourlyForecasts,
            daily: {
              temperature_2m_max: data.daily?.temperature_2m_max || [],
              temperature_2m_min: data.daily?.temperature_2m_min || [],
              weathercode: data.daily?.weathercode || [],
              time: data.daily?.time || [],
              precipitation_probability_max: data.daily?.precipitation_probability_max || []
            }
          });
        }
      } catch (err) {
        console.error('Erro ao buscar previsão do tempo:', err);
      } finally {
        setIsLoadingStatusWeather(false);
      }
    };
    fetchWeather();
  }, [
    weatherLocation?.latitude,
    weatherLocation?.longitude,
    weatherLocation?.cityName
  ]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />;
    if (code <= 3) return <CloudSun className="w-4 h-4 text-blue-400" />;
    if (code <= 48) return <Cloud className="w-4 h-4 text-slate-400" />;
    if (code <= 67) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (code <= 77) return <CloudSnow className="w-4 h-4 text-blue-300" />;
    if (code <= 82) return <CloudRain className="w-4 h-4 text-blue-600" />;
    return <CloudLightning className="w-4 h-4 text-amber-500" />;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeetings = meetings.filter(m => m.date === todayStr);
  const upcomingTodayMeeting = todayMeetings.find(m => m.status !== 'completed');

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const completedTodayCount = tasks.filter(
    t => t.status === 'done' && t.completedAt?.startsWith(todayStr)
  ).length;

  const handleGenerateDayBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const response = await fetch('/api/gemini/context-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'daily_briefing',
          content: `Reuniões de hoje: ${todayMeetings.map(m => m.title).join(', ') || 'nenhuma'}. Tarefas urgentes: ${urgentTasks.map(t => t.title).join(', ') || 'nenhuma'}. Itens na caixa de entrada: ${inbox.length}.`,
          context: {
            user: user.name,
            meetingsCount: todayMeetings.length,
            urgentTasksCount: urgentTasks.length,
            inboxCount: inbox.length,
            topMeeting: upcomingTodayMeeting?.title || 'Nenhuma reunião agendada para hoje'
          }
        })
      });
      const data = await response.json();
      const text = data.result || 'Hoje seu foco principal é o Alinhamento Estratégico de Implementos e a revisão das entregas críticas.';
      setBriefingText(text);
      setQuickSummary(text);
    } catch (err) {
      console.error(err);
      const fallback = `Briefing local: ${todayMeetings.length} reunião(ões) hoje, ${urgentTasks.length} tarefa(s) de alta prioridade e ${inbox.length} item(ns) na caixa de entrada.`;
      setBriefingText(fallback);
      setQuickSummary(fallback);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  return (
    <div id="today-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Smart Executive Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                {formatDateBR(new Date())}
              </span>

              {!isLoadingWeather && weather ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold font-mono">
                    {getWeatherIcon(weather.conditionCode)}
                    <span>{weather.city}: {weather.temp}°C</span>
                  </span>

                  {weather.hourly && weather.hourly.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium font-mono"
                      title={`Probabilidade de chuva: ${h.precipProb}%`}
                    >
                      <span>{h.time}</span>
                      {getWeatherIcon(h.conditionCode)}
                      <span>{h.temp}°C</span>
                      {h.precipProb > 10 && (
                        <span className="text-[10px] text-blue-500 font-bold ml-0.5">☔{h.precipProb}%</span>
                      )}
                    </span>
                  ))}

                  <button
                    onClick={() => setShowWeeklyForecast(!showWeeklyForecast)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium font-mono hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    {showWeeklyForecast ? (
                      <>
                        <span>Ver Horário</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Ver Semanal</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              ) : isLoadingWeather ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Buscando clima...
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Bom dia, {user.name}
            </h1>

            {quote && (
              <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 italic max-w-2xl bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10">
                {quote}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="today-briefing-btn"
              onClick={handleGenerateDayBriefing}
              disabled={isGeneratingBriefing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
              <span>{isGeneratingBriefing ? 'Sintetizando...' : 'Gerar Briefing do Dia'}</span>
            </button>

            <button
              type="button"
              id="toggle-edit-mode-btn"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isEditMode ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-300 hover:bg-red-200' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'} text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors`}
            >
              <SlidersHorizontal className={`w-3 h-3 ${isEditMode ? 'text-red-600 animate-spin' : 'text-slate-600'}`} />
              <span>{isEditMode ? 'Concluir Edição' : 'Modo Edição'}</span>
            </button>

            <button
              type="button"
              id="today-quick-capture-btn"
              onClick={() => setIsQuickCaptureOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Captura Rápida</span>
            </button>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 relative">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Briefing Operacional & Recomendações
                </span>
                <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Atualizado agora</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                {briefingText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reuniões Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {todayMeetings.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {upcomingTodayMeeting ? `Próxima: ${upcomingTodayMeeting.startTime}` : 'Todas concluídas'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tarefas Pendentes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {pendingTasks.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {urgentTasks.length} com prioridade alta/urgente
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Concluídas Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {completedTodayCount}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Ritmo produtivo estável
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Caixa de Entrada</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {inbox.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Itens rápidos para triagem
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Blocos */}
        <div className="lg:col-span-7 space-y-4">
          {blockOrder.map((id, index) => (
            <div key={id} className="rounded-2xl overflow-hidden border bg-white dark:bg-slate-900 transition-all">
              {/* Header with block name and reorder controls */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="w-1 h-3 bg-slate-400 rounded-full" />
                    <span className="w-1 h-3 bg-slate-400 rounded-full" />
                    <span className="w-1 h-3 bg-slate-400 rounded-full" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {id === 'nextMeeting' && 'Próxima Reunião'}
                    {id === 'tasks' && 'Tarefas'}
                    {id === 'weather' && 'Clima'}
                    {id === 'quotes' && 'Frase do Dia'}
                    {id === 'pomodoro' && 'Pomodoro'}
                    {id === 'quickCapture' && 'Captura Rápida'}
                  </span>
                </div>

                {/* Reorder buttons - only visible in edit mode */}
                {isEditMode && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlockUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlockDown(index)}
                      disabled={index === blockOrder.length - 1}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5">
                {renderBlock(id)}
              </div>
            </div>
          ))}
        </div>

          {/* Right Column - Fixa */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">PriorIDADES & Ações</h3>
                </div>
                <button type="button" onClick={() => setCurrentView('tasks')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                  <span>Ver Tarefas ({pendingTasks.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <button type="button" onClick={() => toggleTaskStatus(t.id)} className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 dark:border-slate-600 shrink-0">
                      {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs sm:text-sm font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Espaços de Projetos NuRa
                </h3>
                <button type="button" onClick={() => setCurrentView('projects')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Ver todos</button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => setCurrentView('projects')} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-md" style={{ backgroundColor: p.color }} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Meeting Mini Ata Modal */}
      {activeModalMeetingId && (
        <MeetingMiniAtaModal
          meetingId={activeModalMeetingId}
          isOpen={Boolean(activeModalMeetingId)}
          onClose={() => setActiveModalMeetingId(null)}
        />
      )}
    </div>
  );
};
