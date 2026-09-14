import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Users,
  Paperclip,
  FileText,
  Sparkles,
  CheckSquare,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Radio,
  X,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  CheckCircle2,
  PenTool,
  Mic,
  Save,
  Tag as TagIcon
} from 'lucide-react';
import { TagBadge } from './TagBadge';
import { DrawingCanvas } from './DrawingCanvas';
import { AudioRecorder } from './AudioRecorder';
import { Meeting, Note } from '../../types';

interface MeetingMiniAtaModalProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingMiniAtaModal: React.FC<MeetingMiniAtaModalProps> = ({
  meetingId,
  isOpen,
  onClose
}) => {
  const {
    meetings,
    notes,
    updateMeeting,
    updateMeetingMiniAta,
    addAttachmentToMeeting,
    removeAttachmentFromMeeting,
    addNoteToMeeting,
    addMeetingDecision,
    startMeetingMode,
    addTask,
    tags,
    addTag,
    user
  } = useApp();

  const meeting = meetings.find(m => m.id === meetingId);

  const [activeTab, setActiveTab] = useState<'mini_ata' | 'notes' | 'files' | 'decisions'>('mini_ata');
  const [miniAtaText, setMiniAtaText] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Tag manager state
  const [isEditingModalTags, setIsEditingModalTags] = useState(false);
  const [isCreatingModalTag, setIsCreatingModalTag] = useState(false);
  const [modalTagName, setModalTagName] = useState('');

  // New Note Modal state
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteType, setNoteType] = useState<'text' | 'drawing' | 'audio'>('text');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // New Attachment state
  const [isAttachingFile, setIsAttachingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'sheet' | 'image' | 'slide'>('pdf');
  const [newFileSize, setNewFileSize] = useState('1.5 MB');

  // New Decision state
  const [newDecisionText, setNewDecisionText] = useState('');
  const [taskCreatedNotice, setTaskCreatedNotice] = useState<string | null>(null);

  // Sync state when meeting opens
  useEffect(() => {
    if (meeting) {
      setMiniAtaText(meeting.miniAta || meeting.agenda || '');
    }
  }, [meeting?.id, meeting?.miniAta]);

  if (!isOpen || !meeting) return null;

  // Notes tied to this meeting
  const linkedNotes = notes.filter(n => n.meetingId === meeting.id);

  const handleConvertAtaToTask = () => {
    // Extract checklist items from miniAta if available
    const lines = miniAtaText.split('\n');
    const actionLines = lines.filter(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));

    const checklist = actionLines.map((line, idx) => ({
      id: `chk-${Date.now()}-${idx}`,
      text: line.replace(/^-\s*\[\s*\]\s*/, '').replace(/^-\s*\[\s*x\s*\]\s*/i, '').trim(),
      completed: line.includes('[x]') || line.includes('[X]')
    }));

    addTask({
      title: `Ações da Reunião: ${meeting.title}`,
      description: `Tarefas e compromissos derivados da Mini Ata de ${meeting.date} (${meeting.startTime} às ${meeting.endTime}).\n\nResumo da Ata:\n${miniAtaText.slice(0, 500)}${miniAtaText.length > 500 ? '...' : ''}`,
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: meeting.date,
      priority: 'high',
      projectId: meeting.projectId,
      tags: meeting.tags,
      checklist: checklist.length > 0 ? checklist : undefined,
      originType: 'meeting',
      originId: meeting.id,
      originTitle: meeting.title
    });

    setTaskCreatedNotice(`Tarefa criada com sucesso para "${meeting.title}"!`);
    setTimeout(() => setTaskCreatedNotice(null), 3000);
  };

  const handleConvertDecisionToTask = (decisionText: string) => {
    addTask({
      title: `Executar Decisão: ${decisionText}`,
      description: `Decisão oficial deliberada na reunião "${meeting.title}" em ${meeting.date}.`,
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      projectId: meeting.projectId,
      tags: meeting.tags,
      originType: 'meeting',
      originId: meeting.id,
      originTitle: meeting.title
    });

    setTaskCreatedNotice(`Tarefa criada a partir da decisão!`);
    setTimeout(() => setTaskCreatedNotice(null), 3000);
  };

  const handleSaveMiniAta = () => {
    updateMeetingMiniAta(meeting.id, miniAtaText);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleInsertTemplateText = (snippet: string) => {
    setMiniAtaText(prev => `${prev ? prev + '\n\n' : ''}${snippet}`);
  };

  const handleGenerateAIMiniAta = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/gemini/summarize-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
          participants: meeting.participants,
          agenda: meeting.agenda,
          notes: linkedNotes.map(note => note.content),
          transcripts: linkedNotes.filter(note => note.type === 'audio').map(note => note.audioData?.transcript).filter(Boolean)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar a estrutura da ata.');
      const aiTemplate = `### MINI ATA — ${meeting.title.toUpperCase()}
**Data:** ${meeting.date} (${meeting.startTime} - ${meeting.endTime})
**Participantes:** ${meeting.participants.map(p => p.name).join(', ')}

#### Síntese
${data.summary || meeting.agenda || 'Sem conteúdo registrado.'}

#### Decisões registradas
${(data.decisions || []).map((item: string) => `- ${item}`).join('\n') || '- Nenhuma decisão identificada.'}

#### Ações sugeridas
${(data.suggestedTasks || []).map((item: any) => `- [ ] ${item.assignee}: ${item.title} (${item.dueDate})`).join('\n') || '- [ ] Revisar a ata e registrar responsáveis e prazos.'}`;

      setMiniAtaText(aiTemplate);
      updateMeetingMiniAta(meeting.id, aiTemplate);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2500);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Não foi possível gerar a estrutura da ata.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCreateLinkedNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() && noteType === 'text') return;

    addNoteToMeeting(meeting.id, {
      title: newNoteTitle.trim() || `Nota do Compromisso - ${meeting.title}`,
      type: noteType,
      content: newNoteContent,
      privacy: 'team',
      tags: meeting.tags
    });

    setIsCreatingNote(false);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    addAttachmentToMeeting(meeting.id, {
      name: newFileName.endsWith(`.${newFileType}`) ? newFileName : `${newFileName}.${newFileType === 'sheet' ? 'xlsx' : newFileType === 'doc' ? 'docx' : newFileType === 'slide' ? 'pptx' : newFileType}`,
      type: newFileType,
      size: newFileSize,
      url: '#'
    });

    setIsAttachingFile(false);
    setNewFileName('');
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionText.trim()) return;
    addMeetingDecision(meeting.id, newDecisionText.trim());
    setNewDecisionText('');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-purple-600" />;
      case 'doc':
      case 'pdf':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      id="meeting-mini-ata-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {meeting.date}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold font-mono">
                <Clock className="w-3.5 h-3.5" />
                {meeting.startTime} às {meeting.endTime}
              </span>
              {meeting.location && (
                <span className="text-xs text-slate-500 truncate">
                  • {meeting.location}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {meeting.title}
            </h2>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {meeting.tags.map(t => {
                const tagObj = tags.find(tag => tag.id === t);
                if (!tagObj) return null;
                return (
                  <div
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor: `${tagObj.color || '#059669'}18`,
                      borderColor: `${tagObj.color || '#059669'}40`,
                      color: tagObj.color || '#059669'
                    }}
                  >
                    <span>{tagObj.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = meeting.tags.filter(id => id !== t);
                        updateMeeting(meeting.id, { tags: updated });
                      }}
                      className="hover:opacity-75 p-0.5"
                      title="Remover tag da reunião"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsEditingModalTags(!isEditingModalTags)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
              >
                {isEditingModalTags ? 'Fechar' : '+ Gerenciar Tags'}
              </button>
            </div>

            {/* Expanded Tag Manager inside Modal Header */}
            {isEditingModalTags && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                <div className="flex flex-wrap gap-1">
                  {tags.map(t => {
                    const isAssigned = meeting.tags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const updated = isAssigned
                            ? meeting.tags.filter(id => id !== t.id)
                            : [...meeting.tags, t.id];
                          updateMeeting(meeting.id, { tags: updated });
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                          isAssigned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.name} {isAssigned ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                {!isCreatingModalTag ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingModalTag(true)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Criar nova tag e aplicar</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Nome da tag..."
                      value={modalTagName}
                      onChange={(e) => setModalTagName(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTagName.trim()) {
                          const created = addTag({ name: modalTagName.trim() });
                          updateMeeting(meeting.id, { tags: [...meeting.tags, created.id] });
                          setModalTagName('');
                          setIsCreatingModalTag(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingModalTag(false)}
                      className="text-xs text-slate-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                startMeetingMode(meeting.id);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span>Modo Reunião</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-5 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('mini_ata')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'mini_ata'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mini Ata do Compromisso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Notas & Rascunhos ({linkedNotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Arquivos & Anexos ({meeting.attachments?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'decisions'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Decisões ({meeting.decisions?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MINI ATA */}
          {activeTab === 'mini_ata' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
                    Atalhos de Tópicos:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplateText('#### 📌 Tópico Discutido:\n- ')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    + Tópico
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplateText('#### 💡 Decisão Aprovada:\n- ')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    + Decisão
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertTemplateText('#### ⚡ Próximos Passos & Tarefas:\n- [ ] ')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    + Plano de Ação
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {taskCreatedNotice && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 animate-bounce">
                      ✓ {taskCreatedNotice}
                    </span>
                  )}
                  {isSavedNotice && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      ✓ Salvo com sucesso!
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleConvertAtaToTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors"
                    title="Transformar a ata em tarefas na lista de ações"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Transformar em Tarefa</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAIMiniAta}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAI ? 'Estruturando...' : 'Estruturar ata (IA opcional)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveMiniAta}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Mini Ata</span>
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="space-y-1.5">
                <textarea
                  value={miniAtaText}
                  onChange={e => setMiniAtaText(e.target.value)}
                  placeholder="Digite aqui as anotações do compromisso, deliberações, acordos firmados e pontos de atenção..."
                  rows={14}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner resize-y"
                />
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Suporta Markdown com títulos (###), listas (-) e checklists (- [ ]).</span>
                  <span>{miniAtaText.length} caracteres</span>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: NOTAS VINCULADAS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Anotações Exclusivas Deste Compromisso
                  </h3>
                  <p className="text-xs text-slate-500">
                    Textos, desenhos stylus e gravações de áudio atreladas à reunião
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNote(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Anotação Vinculada</span>
                </button>
              </div>

              {/* List of linked notes */}
              {linkedNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-600" />
                  <p className="text-xs font-semibold">Nenhuma anotação vinculada ainda.</p>
                  <p className="text-[11px] mt-0.5">Clique acima para criar notas de texto, esboços manuais ou gravar a conversa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {linkedNotes.map(note => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                            {note.type === 'drawing' ? (
                              <PenTool className="w-3.5 h-3.5" />
                            ) : note.type === 'audio' ? (
                              <Mic className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {note.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {note.type === 'drawing' && note.drawingData && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                          🎨 Esboço manuscrito com {note.drawingData.strokes.length} traços
                        </div>
                      )}

                      {note.type === 'audio' && note.audioData && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600">
                            <Mic className="w-3.5 h-3.5" />
                            <span>Gravação ({note.audioData.durationSeconds}s)</span>
                          </div>
                          {note.audioData.transcript && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                              "{note.audioData.transcript}"
                            </p>
                          )}
                        </div>
                      )}

                      {note.type === 'text' && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                          {note.content}
                        </p>
                      )}

                      {note.checklist && note.checklist.length > 0 && (
                        <div className="space-y-1">
                          {note.checklist.map(item => (
                            <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                              <CheckSquare className="w-3 h-3 text-emerald-600" />
                              <span className={item.completed ? 'line-through text-slate-400' : ''}>{item.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Create Note Inline Form Modal */}
              {isCreatingNote && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Adicionar Nova Nota ao Compromisso:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setNoteType('text')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          noteType === 'text'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        Texto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteType('drawing')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          noteType === 'drawing'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        Desenho
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteType('audio')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                          noteType === 'audio'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        Áudio
                      </button>
                    </div>
                  </div>

                  {noteType === 'text' && (
                    <form onSubmit={handleCreateLinkedNote} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        placeholder="Título da anotação (ex: Tópicos de Alinhamento Técnico)"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <textarea
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        placeholder="Conteúdo da nota..."
                        rows={3}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingNote(false)}
                          className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                        >
                          Salvar Nota
                        </button>
                      </div>
                    </form>
                  )}

                  {noteType === 'drawing' && (
                    <div className="space-y-2">
                      <DrawingCanvas
                        onSave={drawingData => {
                          addNoteToMeeting(meeting.id, {
                            title: `Esboço Manuscrito - ${meeting.title}`,
                            type: 'drawing',
                            content: 'Nota de desenho stylus',
                            drawingData,
                            tags: meeting.tags
                          });
                          setIsCreatingNote(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
                      >
                        Fechar Canvas
                      </button>
                    </div>
                  )}

                  {noteType === 'audio' && (
                    <div className="space-y-2">
                      <AudioRecorder
                        onSave={audioData => {
                          addNoteToMeeting(meeting.id, {
                            title: `Gravação de Voz - ${meeting.title}`,
                            type: 'audio',
                            content: audioData.transcript || 'Gravação de áudio do compromisso',
                            audioData,
                            tags: meeting.tags
                          });
                          setIsCreatingNote(false);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCreatingNote(false)}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
                      >
                        Fechar Gravador
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ARQUIVOS & ANEXOS */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Arquivos Vinculados ao Compromisso
                  </h3>
                  <p className="text-xs text-slate-500">
                    Relatórios em PDF, planilhas Excel, apresentações e documentos anexos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAttachingFile(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anexar Arquivo / Link do Drive</span>
                </button>
              </div>

              {/* Attach Form */}
              {isAttachingFile && (
                <form
                  onSubmit={handleAddAttachment}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Vincular Novo Documento à Reunião:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        placeholder="Nome do arquivo (ex: Relatorio_Fechamento_NuRa)"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <select
                        value={newFileType}
                        onChange={e => setNewFileType(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="sheet">Planilha (.xlsx)</option>
                        <option value="doc">Documento (.docx)</option>
                        <option value="slide">Apresentação (.pptx)</option>
                        <option value="image">Imagem (.png / .jpg)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAttachingFile(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                    >
                      Vincular Arquivo
                    </button>
                  </div>
                </form>
              )}

              {/* Attachments List */}
              {(!meeting.attachments || meeting.attachments.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50 text-blue-600" />
                  <p className="text-xs font-semibold">Nenhum arquivo anexado a este compromisso.</p>
                  <p className="text-[11px] mt-0.5">Registre relatórios, planilhas ou links para acesso rápido durante a reunião.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meeting.attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                          {getFileIcon(att.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {att.size} • Anexado à reunião
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => alert(`Abrindo arquivo: ${att.name}`)}
                          className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600"
                          title="Visualizar Arquivo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAttachmentFromMeeting(meeting.id, att.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600"
                          title="Remover Anexo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DECISÕES & TAREFAS */}
          {activeTab === 'decisions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Decisões Oficiais Tomadas no Compromisso
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de deliberações com validação e histórico
                </p>
              </div>

              {/* Add Decision Form */}
              <form onSubmit={handleAddDecision} className="flex gap-2">
                <input
                  type="text"
                  value={newDecisionText}
                  onChange={e => setNewDecisionText(e.target.value)}
                  placeholder="Registrar nova decisão aprovada (ex: Verba de Marketing 70% aprovada)..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Registrar Decisão
                </button>
              </form>

              {/* List */}
              {(!meeting.decisions || meeting.decisions.length === 0) ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 opacity-50 text-emerald-600" />
                  <p className="text-xs font-semibold">Nenhuma decisão registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {meeting.decisions.map((dec, idx) => (
                    <div
                      key={dec.id || idx}
                      className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {dec.text}
                          </p>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                            Aprovado por {dec.approvedBy || user.name} em {new Date(dec.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConvertDecisionToTask(dec.text)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs shrink-0"
                        title="Criar tarefa a partir desta decisão"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>+ Tarefa</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Compromisso registrado na agenda local do NuRa.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
