import React, { useEffect, useRef, useState } from 'react';
import { DrawingStroke, DrawingNoteData } from '../../types';
import {
  PenTool,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Maximize2,
  Minimize2,
  Grid,
  Download,
  Check,
  LockKeyhole,
  Unlock,
  Hand
} from 'lucide-react';

interface DrawingCanvasProps {
  initialData?: DrawingNoteData;
  onChange?: (data: DrawingNoteData) => void;
  onSave?: (data: DrawingNoteData) => void;
  readOnly?: boolean;
  className?: string;
  height?: number | string;
  portrait?: boolean;
  touchLockDefault?: boolean;
}

const COLORS = ['#15803d', '#0f172a', '#2563eb', '#dc2626', '#d97706', '#9333ea', '#64748b'];
const STROKE_WIDTHS = [2, 4, 8, 14];

type ActivePointer = {
  x: number;
  y: number;
  pointerType: string;
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  initialData,
  onChange,
  onSave,
  readOnly = false,
  className = '',
  height = 420,
  portrait = false,
  touchLockDefault = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const panCenterRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#15803d');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [backgroundType, setBackgroundType] = useState<'blank' | 'grid' | 'ruled'>(
    initialData?.background || 'ruled'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchLocked, setTouchLocked] = useState(touchLockDefault);
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialData?.strokes || []);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const strokesRef = useRef(strokes);
  const backgroundRef = useRef(backgroundType);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    backgroundRef.current = backgroundType;
  }, [backgroundType]);

  const redraw = (currentStrokes: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const heightPx = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, heightPx);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, heightPx);

    if (backgroundRef.current === 'grid') {
      ctx.fillStyle = '#94a3b850';
      const gridSize = 24;
      for (let x = gridSize; x < width; x += gridSize) {
        for (let y = gridSize; y < heightPx; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (backgroundRef.current === 'ruled') {
      ctx.strokeStyle = '#94a3b840';
      ctx.lineWidth = 1;
      const lineGap = 32;
      for (let y = lineGap; y < heightPx; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f8717160';
      ctx.beginPath();
      ctx.moveTo(42, 0);
      ctx.lineTo(42, heightPx);
      ctx.stroke();
    }

    currentStrokes.forEach(stroke => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size * 2;
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = `${stroke.color}60`;
        ctx.lineWidth = stroke.size * 2.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let index = 1; index < stroke.points.length; index += 1) {
        ctx.lineTo(stroke.points[index].x, stroke.points[index].y);
      }
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'source-over';
  };

  useEffect(() => {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    if (!page || !canvas) return;

    const resizeCanvas = () => {
      const rect = page.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redraw(strokesRef.current);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(page);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    redraw(strokes);
  }, [strokes, backgroundType]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const buildData = (nextStrokes: DrawingStroke[]): DrawingNoteData => ({
    strokes: nextStrokes,
    background: backgroundType,
    previewUrl: canvasRef.current?.toDataURL('image/png')
  });

  const notifyChange = (nextStrokes: DrawingStroke[]) => {
    onChange?.(buildData(nextStrokes));
  };

  const getCanvasCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: event.pressure > 0 ? event.pressure : 0.5
    };
  };

  const getTouchCenter = () => {
    const touches = [...activePointersRef.current.values()].filter(pointer => pointer.pointerType === 'touch');
    if (touches.length < 2) return null;
    return {
      x: (touches[0].x + touches[1].x) / 2,
      y: (touches[0].y + touches[1].y) / 2
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType
    });

    if (event.pointerType === 'touch' && touchLocked) {
      const center = getTouchCenter();
      if (center) {
        panCenterRef.current = center;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      return;
    }

    if (drawingPointerIdRef.current !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingPointerIdRef.current = event.pointerId;
    setIsDrawing(true);
    currentStrokeRef.current = {
      tool,
      color,
      size: strokeWidth,
      points: [getCanvasCoordinates(event)]
    };
    setUndoStack([]);
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const activePointer = activePointersRef.current.get(event.pointerId);
    if (activePointer) {
      activePointersRef.current.set(event.pointerId, {
        ...activePointer,
        x: event.clientX,
        y: event.clientY
      });
    }

    if (event.pointerType === 'touch' && touchLocked) {
      const center = getTouchCenter();
      const scrollArea = scrollAreaRef.current;
      if (center && panCenterRef.current && scrollArea) {
        scrollArea.scrollLeft -= center.x - panCenterRef.current.x;
        scrollArea.scrollTop -= center.y - panCenterRef.current.y;
        panCenterRef.current = center;
      }
      event.preventDefault();
      return;
    }

    if (!isDrawing || drawingPointerIdRef.current !== event.pointerId || !currentStrokeRef.current || readOnly) return;
    currentStrokeRef.current.points.push(getCanvasCoordinates(event));
    redraw([...strokesRef.current, currentStrokeRef.current]);
    event.preventDefault();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId);
    if (event.pointerType === 'touch' && touchLocked) {
      if (!getTouchCenter()) panCenterRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
      return;
    }

    if (drawingPointerIdRef.current !== event.pointerId || !currentStrokeRef.current || readOnly) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    const updated = [...strokesRef.current, currentStrokeRef.current];
    currentStrokeRef.current = null;
    drawingPointerIdRef.current = null;
    setIsDrawing(false);
    setStrokes(updated);
    notifyChange(updated);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const next = strokes.slice(0, -1);
    setUndoStack(previous => [...previous, [last]]);
    setStrokes(next);
    notifyChange(next);
  };

  const handleRedo = () => {
    if (undoStack.length === 0) return;
    const item = undoStack[undoStack.length - 1];
    const next = [...strokes, ...item];
    setUndoStack(previous => previous.slice(0, -1));
    setStrokes(next);
    notifyChange(next);
  };

  const handleClear = () => {
    if (strokes.length === 0 || !window.confirm('Limpar toda a página manuscrita?')) return;
    setUndoStack(previous => [...previous, strokes]);
    setStrokes([]);
    notifyChange([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `anotacao_robustec_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      await document.exitFullscreen();
      return;
    }
    if (container.requestFullscreen) {
      try {
        await container.requestFullscreen();
        return;
      } catch {
        // CSS fallback below keeps the writing surface usable.
      }
    }
    setIsFullscreen(previous => !previous);
  };

  return (
    <div
      ref={containerRef}
      id="drawing-canvas-container"
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 ${
        isFullscreen ? 'fixed inset-0 z-[90] h-[100dvh] rounded-none' : ''
      } ${className}`}
      style={{ height: isFullscreen ? '100dvh' : height }}
    >
      {!readOnly && (
        <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-2.5 select-none dark:border-slate-700/80 dark:bg-slate-800/95">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-700 dark:bg-slate-700/60">
            {([
              ['pen', 'Caneta', PenTool],
              ['highlighter', 'Destaque', Highlighter],
              ['eraser', 'Borracha', Eraser]
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTool(value)}
                title={label}
                className={`flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-all ${
                  tool === value
                    ? value === 'highlighter' ? 'bg-amber-500 text-white' : value === 'eraser' ? 'bg-slate-800 text-white dark:bg-slate-950' : 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {tool !== 'eraser' && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-700/60">
              {COLORS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={`Selecionar cor ${option}`}
                  className={`h-8 w-8 rounded-full transition-transform ${color === option ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
                  style={{ backgroundColor: option }}
                >
                  {color === option && <Check className="mx-auto h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-700/60">
            {STROKE_WIDTHS.map(width => (
              <button
                key={width}
                type="button"
                onClick={() => setStrokeWidth(width)}
                title={`Espessura ${width}px`}
                className={`grid h-10 w-9 place-items-center rounded-lg ${strokeWidth === width ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
              >
                <span className="rounded-full bg-slate-800 dark:bg-slate-100" style={{ width: width * 1.1, height: width * 1.1 }} />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setTouchLocked(previous => !previous)}
              aria-pressed={touchLocked}
              title={touchLocked ? 'Toque travado: desenha apenas com caneta; use dois dedos para mover' : 'Toque livre: um dedo também desenha'}
              className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-extrabold ${
                touchLocked ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {touchLocked ? <LockKeyhole className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              <span>{touchLocked ? 'Caneta protegida' : 'Toque livre'}</span>
            </button>
            <button type="button" onClick={() => setBackgroundType(previous => previous === 'grid' ? 'ruled' : previous === 'ruled' ? 'blank' : 'grid')} title={`Fundo: ${backgroundType}`} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><Grid className="h-4 w-4" /></button>
            <button type="button" onClick={handleUndo} disabled={strokes.length === 0} title="Desfazer" className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"><Undo2 className="h-4 w-4" /></button>
            <button type="button" onClick={handleRedo} disabled={undoStack.length === 0} title="Refazer" className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"><Redo2 className="h-4 w-4" /></button>
            <button type="button" onClick={handleClear} disabled={strokes.length === 0} title="Limpar página" className="grid h-10 w-10 place-items-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-950/40"><Trash2 className="h-4 w-4" /></button>
            <button type="button" onClick={handleDownload} title="Baixar imagem" className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"><Download className="h-4 w-4" /></button>
            {onSave && <button type="button" onClick={() => onSave(buildData(strokes))} disabled={strokes.length === 0} title="Salvar desenho" className="grid h-10 w-10 place-items-center rounded-xl text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 dark:hover:bg-emerald-950/40"><Check className="h-4 w-4" /></button>}
            <button type="button" onClick={toggleFullscreen} title={isFullscreen ? 'Sair da tela inteira' : 'Escrever em tela inteira'} className="flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white dark:bg-slate-950">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Sair' : 'Tela inteira'}</span>
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollAreaRef}
        className={`relative flex-1 overflow-auto overscroll-contain ${portrait ? 'bg-slate-200 p-2 sm:p-4 dark:bg-slate-950' : 'bg-white dark:bg-slate-950'}`}
      >
        <div
          ref={pageRef}
          className={`relative ${portrait ? 'mx-auto aspect-[210/297] w-full max-w-[860px] overflow-hidden bg-white shadow-2xl ring-1 ring-slate-300' : 'h-full min-h-full w-full'}`}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`block h-full w-full touch-none ${touchLocked ? 'cursor-crosshair' : 'cursor-cell'}`}
          />

          {strokes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-sm font-semibold text-slate-400">
              <span>
                {touchLocked
                  ? 'Caneta ativa. A palma e um dedo são ignorados; use dois dedos para mover a folha.'
                  : 'Toque livre. Escreva com caneta, mouse ou um dedo.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {portrait && touchLocked && (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <Hand className="h-3.5 w-3.5" /> Um dedo não marca a página • dois dedos movem • a caneta escreve
        </div>
      )}
    </div>
  );
};
