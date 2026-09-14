import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Radio,
  Clock,
  Play,
  Pause,
  StopCircle,
  Users,
  CheckSquare,
  FileText,
  PenTool,
  Mic,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Loader2,
  Volume2,
  Check,
  Type,
  ArrowRight,
  Download
} from 'lucide-react';
import { DrawingCanvas } from '../components/common/DrawingCanvas';
import { AudioRecorder } from '../components/common/AudioRecorder';
import { DrawingNoteData, AudioNoteData, TaskPriority } from '../types';
import { saveAudioRecording, getAudioRecording, getAllAudioRecordings, deleteAudioRecording } from '../lib/audioStorage';

export const MeetingModeView: React.FC = () => {
  const {
    activeMeetingId,
    endMeetingMode,
    finishMeetingMode,
    meetings,
    updateMeeting,
    addTask,
    user
  } = useApp();

  const meeting = meetings.find(m => m.id === activeMeetingId);

  // Live Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Note Mode: 'text' (typed) or 'handwriting' (pen/stylus canvas)
  const [notesInputMode, setNotesInputMode] = useState<'text' | 'handwriting'>('text');

  // Live Meeting Content
  const [notesContent, setNotesContent] = useState(meeting?.liveNotes || '');
  const [activeTab, setActiveTab] = useState<'notes' | 'canvas' | 'audio' | 'actions'>('notes');
  const [canvasData, setCanvasData] = useState<DrawingNoteData | undefined>(meeting?.drawingNotes);
  const [handwritingNoteData, setHandwritingNoteData] = useState<DrawingNoteData | undefined>(meeting?.drawingNotes);
  const [audioData, setAudioData] = useState<AudioNoteData | undefined>(meeting?.audioNotes);
  const audioRecordingsRef = useRef<AudioNoteData[]>([]);

  // Transcription state for handwriting
  const [isTranscribingHandwriting, setIsTranscribingHandwriting] = useState(false);
  const [transcriptionSuccessNotice, setTranscriptionSuccessNotice] = useState(false);

  // Live Action Items created during meeting
  const [actionItems, setActionItems] = useState<Array<{ id: string; title: string; assignee: string; dueDate: string; priority: TaskPriority }>>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState(user.name);
  const [newActionDueDate, setNewActionDueDate] = useState(new Date().toISOString().split('T')[0]);

  // AI Synthesis Loading State & Modal
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<any | null>(null);
  const [showManualFinishConfirm, setShowManualFinishConfirm] = useState(false);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!meeting) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Radio className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
          Nenhuma reunião ativa no momento
        </h2>
        <button
          type="button"
          onClick={endMeetingMode}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Voltar ao Hub de Reuniões
        </button>
      </div>
    );
  }

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    const newItem = {
      id: `live-act-${Date.now()}`,
      title: newActionTitle.trim(),
      assignee: newActionAssignee,
      dueDate: newActionDueDate,
      priority: 'high' as TaskPriority
    };

    setActionItems(prev => [...prev, newItem]);
    setNewActionTitle('');
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(prev => prev.filter(a => a.id !== id));
  };

  // Convert handwritten notes to text using Gemini Vision
  const handleTranscribeHandwriting = async () => {
    if (!handwritingNoteData?.previewUrl) {
      alert('Por favor, escreva algo à mão no quadro antes de solicitar a transcrição.');
      return;
    }

    setIsTranscribingHandwriting(true);
    try {
      const res = await fetch('/api/gemini/context-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'transcribe_handwriting',
          imageBase64: handwritingNoteData.previewUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível reconhecer a escrita.');
      if (data.text) {
        setNotesContent(prev => prev ? `${prev}\n\n[Transcrição Manuscrita]:\n${data.text}` : data.text);
        setNotesInputMode('text');
        setTranscriptionSuccessNotice(true);
        setTimeout(() => setTranscriptionSuccessNotice(false), 4000);
      }
    } catch (err) {
      console.error('Error transcribing handwriting:', err);
      alert('Não foi possível transcrever a escrita agora. Suas anotações manuais continuam salvas no quadro!');
    } finally {
      setIsTranscribingHandwriting(false);
    }
  };

  // Save audio to IndexedDB when it changes
  useEffect(() => {
    if (audioData?.audioUrl && !audioData.audioUrl.startsWith('blob:')) {
      saveAudioRecording(audioData.audioUrl, audioData.audioUrl, 'audio/webm', audioData.durationSeconds || 0, meeting.id);
    }
  }, [audioData, meeting.id]);

  // Simple direct finish (NO forced AI summary, keeps actual notes intact)
  const handleDirectManualFinish = async () => {
    // Load all recordings for this meeting from IndexedDB and persist them
    const recordingsFromDb = (await getAllAudioRecordings()).filter(r => r.meetingId === meeting.id);
    const savedRecordings: AudioNoteData[] = recordingsFromDb.map(r => ({
      audioUrl: r.id,
      durationSeconds: r.durationSeconds,
      transcript: '',
      keyTopics: [],
      suggestedActionItems: [],
      decisions: []
    }));
    if (audioData && !savedRecordings.some(r => r.audioUrl === audioData.audioUrl)) {
      savedRecordings.unshift(audioData);
    }

    updateMeeting(meeting.id, {
      status: 'completed',
      liveNotes: notesContent,
      drawingNotes: canvasData || handwritingNoteData,
      audioNotes: audioData,
      audioRecordings: savedRecordings,
      miniAta: notesContent || meeting.miniAta || meeting.agenda || ''
    });

    // Save manual action items to real task list
    actionItems.forEach(act => {
      addTask({
        title: act.title,
        assignee: act.assignee,
        assigneeEmail: user.email,
        dueDate: act.dueDate,
        priority: act.priority,
        meetingId: meeting.id,
        originType: 'meeting',
        tags: meeting.tags
      });
    });

    finishMeetingMode(meeting.id);
  };

  // Optional AI Ata Generation
  const handleGenerateAIAta = async () => {
    setIsGeneratingSummary(true);

    try {
      const response = await fetch('/api/gemini/summarize-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
          agenda: meeting.agenda,
          participants: meeting.participants.map(p => p.name).join(', '),
          notes: notesContent,
          transcripts: audioData?.transcript || '',
          actionItemsCaptured: actionItems.map(a => `${a.title} (Resp: ${a.assignee})`).join('; ')
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível estruturar a ata.');
      setGeneratedSummary(data);

      // Load all recordings for this meeting from IndexedDB and persist them
      const recordingsFromDb = (await getAllAudioRecordings()).filter(r => r.meetingId === meeting.id);
      const savedRecordings: AudioNoteData[] = recordingsFromDb.map(r => ({
        audioUrl: r.id,
        durationSeconds: r.durationSeconds,
        transcript: '',
        keyTopics: [],
        suggestedActionItems: [],
        decisions: []
      }));
      if (audioData && !savedRecordings.some(r => r.audioUrl === audioData.audioUrl)) {
        savedRecordings.unshift(audioData);
      }

      // Persist to meeting state
      updateMeeting(meeting.id, {
        liveNotes: notesContent,
        drawingNotes: canvasData || handwritingNoteData,
        audioNotes: audioData,
        audioRecordings: savedRecordings,
        miniAta: data.summary || notesContent,
        summary: {
          executiveSummary: data.summary || data.executiveSummary || 'Reunião alinhada.',
          keyTopics: data.keyTopics || ['Alinhamento Estratégico'],
          decisions: data.decisions || ['Ações validadas pelo time'],
          actionItems: data.suggestedTasks || data.actionItems || actionItems.map(a => ({
            task: a.title,
            assignee: a.assignee,
            dueDate: a.dueDate,
            priority: a.priority
          })),
          nextSteps: 'Acompanhar entregas no painel de tarefas.'
        }
      });

      // Automatically register any extracted tasks
      const taskList = data.suggestedTasks || data.actionItems;
      if (taskList && Array.isArray(taskList)) {
        taskList.forEach((act: any) => {
          addTask({
            title: act.title || act.task || 'Ação de Reunião',
            assignee: act.assignee || user.name,
            assigneeEmail: user.email,
            dueDate: act.dueDate || new Date().toISOString().split('T')[0],
            priority: (act.priority?.toLowerCase() as TaskPriority) || 'high',
            meetingId: meeting.id,
            originType: 'meeting',
            tags: meeting.tags
          });
        });
      }
    } catch (err) {
      console.error('Error generating meeting summary:', err);
      alert(err instanceof Error ? err.message : 'Não foi possível estruturar a ata. Suas anotações estão preservadas.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div id="meeting-mode-screen" className="min-h-full space-y-4 bg-slate-900 p-3 text-slate-100 sm:rounded-3xl sm:border sm:border-slate-800 sm:p-4 sm:shadow-2xl md:p-5">
      {/* Top Meeting Control Bar */}
      <div className="sticky top-0 z-30 -mx-3 -mt-3 flex flex-col justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-3 pb-3 pt-3 backdrop-blur-md sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-4 md:-mx-5 md:-mt-5 md:flex-row md:items-center md:px-5 md:pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={endMeetingMode}
            className="grid h-11 w-11 place-items-center rounded-xl bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700"
            title="Sair do modo foco sem finalizar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                MODO REUNIÃO ATIVO • EM ANDAMENTO
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {meeting.title}
            </h1>
          </div>
        </div>

        {/* Live Timer & Finish Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Live Timer */}
          <div className="flex min-h-11 items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700 font-mono">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-base sm:text-lg font-extrabold text-white">
              {formatTimer(secondsElapsed)}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 text-slate-400 hover:text-white"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Opcional: Gerar Ata com IA */}
          <button
            type="button"
            id="generate-ai-ata-btn"
            onClick={handleGenerateAIAta}
            disabled={isGeneratingSummary}
            className="flex min-h-11 items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-xs transition-all"
            title="Opcional: Gerar resumo e extrair tarefas com Inteligência Artificial"
          >
            {isGeneratingSummary ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Processando IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Estruturar Ata (IA Opcional)</span>
              </>
            )}
          </button>

          {/* Botão Principal de Conclusão / Finalização */}
          <button
            type="button"
            id="finish-meeting-direct-btn"
            onClick={handleDirectManualFinish}
            className="flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar Reunião</span>
          </button>
        </div>
      </div>

      {/* AI Summary Card (shown when generated) */}
      {generatedSummary && (
        <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-black text-white">
                {generatedSummary.mode === 'local' ? 'Ata estruturada em modo local' : 'Ata Executiva Gerada por IA'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGeneratedSummary(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Ocultar
              </button>
              <button
                type="button"
                onClick={handleDirectManualFinish}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Concluir Reunião
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Síntese Executiva
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {generatedSummary.summary || generatedSummary.executiveSummary}
            </p>

            {generatedSummary.decisions && generatedSummary.decisions.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-300">Decisões & Acordos:</span>
                <ul className="list-disc list-inside text-xs text-slate-300 mt-1 space-y-1">
                  {generatedSummary.decisions.map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {(generatedSummary.suggestedTasks || generatedSummary.actionItems) && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-300">Tarefas Registradas:</span>
                <div className="space-y-1.5 mt-1.5">
                  {(generatedSummary.suggestedTasks || generatedSummary.actionItems).map((act: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800">
                      <span className="font-semibold text-slate-100">{act.title || act.task}</span>
                      <span className="text-slate-400 font-mono">{act.assignee} ({act.dueDate})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Execution Split Screen */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {/* Left Side: Agenda & Attendees & Audio (4 cols) */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-4">
          {/* Pauta / Agenda Checklist */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Pauta da Reunião
            </h3>
            <div className="p-3 bg-slate-900/80 rounded-xl text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
              {meeting.agenda}
            </div>
          </div>

          {/* Attendees */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Participantes ({meeting.participants.length})
            </h3>
            <div className="space-y-2">
              {meeting.participants.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                      {p.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{p.role || 'Presente'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated Live Voice Audio Recorder */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              Gravador de Áudio & Transcrição
            </span>
            <AudioRecorder
              meetingId={meeting.id}
              onSave={(data) => {
                // Save to both meeting and notes
                setAudioData(data);
              }}
            />
          </div>
        </div>

        {/* Right Side: Tabbed Work Area: Notes / Canvas / Action Items (8 cols) */}
        <div className="order-1 flex flex-col space-y-4 rounded-3xl border border-slate-700/80 bg-slate-800/60 p-3 sm:p-4 lg:order-2 lg:col-span-8 lg:p-5">
          {/* Sub-tab Switcher */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 gap-2 flex-wrap">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                    <span>Anotações</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'canvas'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                    <span>Diagramas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`flex min-h-10 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'actions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                    <span>Ações ({actionItems.length})</span>
              </button>
            </div>

            {/* Notification notice if transcribed */}
            {transcriptionSuccessNotice && (
              <span className="text-xs text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Manuscrito transcrito para texto!
              </span>
            )}
          </div>

          {/* TAB: Live Notes (supports both Text & Handwriting) */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col space-y-3 min-h-[380px]">
              {/* Switcher between Typing vs Handwriting */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700/80 bg-slate-900 p-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setNotesInputMode('text')}
                    className={`flex min-h-10 items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      notesInputMode === 'text'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Digitar Texto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotesInputMode('handwriting')}
                    className={`flex min-h-10 items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      notesInputMode === 'handwriting'
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Escrita à mão</span>
                  </button>
                </div>

                {/* Transcribe Handwriting button (if in handwriting mode or has handwriting) */}
                {notesInputMode === 'handwriting' && (
                  <button
                    type="button"
                    onClick={handleTranscribeHandwriting}
                    disabled={isTranscribingHandwriting}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                    title="Reconhecer texto manuscrito com IA e adicionar às anotações"
                  >
                    {isTranscribingHandwriting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcrevendo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Transcrever Escrita à Mão</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Mode: TEXT */}
              {notesInputMode === 'text' && (
                <div className="flex-1 flex flex-col space-y-2">
                  <textarea
                    value={notesContent}
                    onChange={(e) => setNotesContent(e.target.value)}
                    placeholder="Registre livremente os acordos, números e pontos falados durante a reunião..."
                    className="w-full flex-1 min-h-[300px] p-4 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Anotações puras preservadas sem substituição forçada.</span>
                    <button
                      type="button"
                      onClick={() => setNotesInputMode('handwriting')}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <PenTool className="w-3 h-3" /> Alternar para caneta à mão
                    </button>
                  </div>
                </div>
              )}

              {/* Mode: HANDWRITING CANVAS */}
              {notesInputMode === 'handwriting' && (
                <div className="flex-1 space-y-2">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900 p-1">
                    <DrawingCanvas
                      initialData={handwritingNoteData}
                      onChange={(data) => {
                        setHandwritingNoteData(data);
                        updateMeeting(meeting.id, { drawingNotes: data });
                      }}
                      height="min(78dvh, 980px)"
                      portrait
                      touchLockDefault
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>A página é salva a cada traço. Use “Tela inteira” para escrever sem distrações.</span>
                    <button
                      type="button"
                      onClick={handleTranscribeHandwriting}
                      disabled={isTranscribingHandwriting}
                      className="text-purple-400 hover:underline font-bold"
                    >
                      {isTranscribingHandwriting ? 'Transcrevendo...' : 'Converter em texto digitado →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Dedicated Diagram Drawing Canvas */}
          {activeTab === 'canvas' && (
            <div className="flex-1 min-h-[380px]">
              <DrawingCanvas
                initialData={canvasData}
                onChange={(data) => {
                  setCanvasData(data);
                  updateMeeting(meeting.id, { drawingNotes: data });
                }}
                height="min(68dvh, 760px)"
              />
            </div>
          )}

          {/* TAB: Action Items */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <form onSubmit={handleAddActionItem} className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  Adicionar Ação Imediata:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    required
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="Descrição da ação acordada..."
                    className="sm:col-span-6 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={newActionAssignee}
                    onChange={(e) => setNewActionAssignee(e.target.value)}
                    placeholder="Responsável"
                    className="sm:col-span-3 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={newActionDueDate}
                    onChange={(e) => setNewActionDueDate(e.target.value)}
                    className="sm:col-span-2 px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-1 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {actionItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                    Nenhuma ação registrada manualmente ainda. Use o formulário acima para registrar deliberações.
                  </div>
                ) : (
                  actionItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <div>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-slate-400 text-[11px]">
                          Responsável: <span className="text-emerald-400 font-semibold">{item.assignee}</span> • Prazo: {item.dueDate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
