import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Sparkles, Loader2, Volume2, CheckCircle2 } from 'lucide-react';
import { AudioNoteData } from '../../types';
import { saveAudioRecording, getAudioRecording, deleteAudioRecording } from '../../lib/audioStorage';

interface AudioRecorderProps {
  onSave?: (data: AudioNoteData) => void;
  initialAudio?: AudioNoteData;
  meetingId?: string;
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSave,
  initialAudio,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<AudioNoteData | null>(initialAudio || null);
  const audioIdRef = useRef<string | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const meetingIdRef = useRef<string | null>(null);

  // Load audio from IndexedDB when component mounts with initialAudio
  useEffect(() => {
    const loadAudio = async () => {
      if (initialAudio?.audioUrl && !initialAudio.audioUrl.startsWith('blob:')) {
        const id = initialAudio.audioUrl;
        try {
          const record = await getAudioRecording(id);
          if (record) {
            const blob = new Blob([record.dataUrl], { type: record.mimeType });
            audioBlobRef.current = blob;
            const objectUrl = URL.createObjectURL(blob);
            setRecordedAudio(prev => ({
              ...initialAudio,
              audioUrl: objectUrl
            }));
          }
        } catch (err) {
          console.error('Failed to load audio from IndexedDB:', err);
        }
      }
    };
    loadAudio();

    // Cleanup object URL on unmount
    return () => {
      if (recordedAudio?.audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(recordedAudio.audioUrl);
      }
    };
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const cancelledRef = useRef(false);

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  // Timer while recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  // Waveform visualizer
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / 32) - 2;
    let x = 0;

    for (let i = 0; i < 32; i++) {
      const barHeight = (dataArray[i * 2] / 255) * canvas.height * 0.9 + 4;
      ctx.fillStyle = '#15803d'; // NuRa green
      ctx.beginPath();
      ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight, 4);
      ctx.fill();
      x += barWidth + 2;
    }

    if (isRecording && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio analysis for live visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = audioBlob;

        if (cancelledRef.current) {
          stream.getTracks().forEach(track => track.stop());
          if (audioCtx.state !== 'closed') await audioCtx.close();
          return;
        }

        // Generate synthetic waveform peaks
        const peaks = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 15);

        // Create a unique ID for this recording
        const recordingId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        audioIdRef.current = recordingId;

        // Save to IndexedDB
        try {
          await saveAudioRecording(recordingId, await blobToDataUrl(audioBlob), 'audio/webm', recordDuration, meetingIdRef.current);
        } catch (err) {
          console.error('Failed to save audio to IndexedDB:', err);
        }

        const newAudioData: AudioNoteData = {
          audioUrl: recordingId,
          durationSeconds: recordDuration,
          waveform: peaks,
          transcript: '',
          keyTopics: [],
          suggestedActionItems: [],
          decisions: []
        };

        setRecordedAudio(newAudioData);
        if (onSave) onSave(newAudioData);

        // stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);
      requestAnimationFrame(drawWaveform);
    } catch (err) {
      console.warn('Microphone permission or audio capture not available:', err);
      setErrorMessage('Não foi possível acessar o microfone. Verifique a permissão do navegador e tente novamente.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordedAudio(null);
      setRecordDuration(0);
    }
  };

  const togglePlayback = async () => {
    // If we don't have a blob yet, try to load it from IndexedDB
    if (!audioBlobRef.current && recordedAudio?.audioUrl && !recordedAudio.audioUrl.startsWith('blob:')) {
      try {
        const record = await getAudioRecording(recordedAudio.audioUrl);
        if (record) {
          audioBlobRef.current = new Blob([record.dataUrl], { type: record.mimeType });
          const objectUrl = URL.createObjectURL(audioBlobRef.current);
          setRecordedAudio(prev => prev ? { ...prev, audioUrl: objectUrl } : null);
        }
      } catch (err) {
        console.error('Failed to load audio:', err);
        setErrorMessage('Não foi possível carregar o áudio.');
        return;
      }
    }

    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const transcribeAudio = async () => {
    if (!recordedAudio) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      let audioDataUrl = '';

      // If we have the blob in memory, use it directly
      if (audioBlobRef.current) {
        audioDataUrl = await blobToDataUrl(audioBlobRef.current);
      } else if (recordedAudio.audioUrl && !recordedAudio.audioUrl.startsWith('blob:')) {
        // Otherwise, try to load from IndexedDB
        const record = await getAudioRecording(recordedAudio.audioUrl);
        if (record) {
          audioBlobRef.current = new Blob([record.dataUrl], { type: record.mimeType });
          audioDataUrl = record.dataUrl;
        }
      }

      const audioBase64 = audioDataUrl.includes(',') ? audioDataUrl.split(',')[1] : '';
      if (!audioBase64) throw new Error('A gravação não possui dados de áudio disponíveis.');

      const response = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/webm'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível transcrever o áudio.');

      const updated: AudioNoteData = {
        ...recordedAudio,
        transcript: data.transcript || 'Transcrição concluída com sucesso.',
        suggestedActionItems: data.actionItems || [],
        decisions: data.decisions || []
      };

      setRecordedAudio(updated);
      if (onSave) onSave(updated);
    } catch (err) {
      console.error('Transcription error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível transcrever o áudio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="audio-recorder-panel"
      className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs ${className}`}
    >
      {errorMessage && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {errorMessage}
        </div>
      )}
      {/* Recording State */}
      {isRecording ? (
        <div className="flex flex-col items-center gap-4 py-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono">
              {formatTime(recordDuration)}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              GRAVANDO ÁUDIO
            </span>
          </div>

          <div className="w-full max-w-sm h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-center p-2 border border-slate-200 dark:border-slate-700">
            <canvas ref={canvasRef} width={280} height={40} className="w-full h-full block" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Concluir Gravação</span>
            </button>

            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Cancelar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : recordedAudio ? (
        /* Saved Audio Review & Player */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Áudio da Reunião
                </span>
                <p className="text-xs text-slate-500">
                  Duração: {formatTime(recordedAudio.durationSeconds || 0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlaying ? 'Pausar' : 'Ouvir'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRecordedAudio(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Descartar áudio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {recordedAudio.audioUrl && (
            <audio
              ref={audioElementRef}
              src={recordedAudio.audioUrl.startsWith('blob:') ? recordedAudio.audioUrl : ''}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
              className="hidden"
            />
          )}

          {/* Waveform representation */}
          <div className="flex items-center gap-1 h-8 px-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
            {(recordedAudio.waveform || [25, 40, 60, 30, 80, 50, 90, 70, 45, 60, 85, 30]).map((h, idx) => (
              <span
                key={idx}
                className="w-1.5 rounded-full bg-emerald-600/80 dark:bg-emerald-500/80 shrink-0"
                style={{ height: `${Math.max(15, h * 0.3)}px` }}
              />
            ))}
          </div>

          {/* Transcription Area */}
          {recordedAudio.transcript ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Transcrição Inteligente
                </span>
                <span className="text-[10px] text-slate-400">IA opcional</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{recordedAudio.transcript}"
              </p>

              {recordedAudio.suggestedActionItems && recordedAudio.suggestedActionItems.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Ações Identificadas:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 mt-1 space-y-0.5">
                    {recordedAudio.suggestedActionItems.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={transcribeAudio}
              disabled={isTranscribing}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Transcrevendo com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transcrever Áudio & Extrair Decisões</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* Start Recording Button */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Gravação de Voz
              </p>
              <p className="text-[11px] text-slate-500">
                Grave falas para transcrição e extração de ações
              </p>
            </div>
          </div>

          <button
            type="button"
            id="start-audio-record-btn"
            onClick={startRecording}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Gravar Áudio</span>
          </button>
        </div>
      )}
    </div>
  );
};
