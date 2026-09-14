import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Search,
  CheckSquare,
  Sparkles,
  Calendar,
  Star,
  ExternalLink,
  CheckCircle2,
  Reply,
  Send,
  Forward,
  CornerUpLeft
} from 'lucide-react';
import { EmailReference } from '../types';
import { formatDateBR } from '../lib/date';

export const EmailView: React.FC = () => {
  const { emails, addTask, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailReference | null>(emails[0] || null);

  // Reply state
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessNotice, setSentSuccessNotice] = useState<string | null>(null);
  const [taskNotice, setTaskNotice] = useState<string | null>(null);

  const filteredEmails = emails.filter(
    e =>
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConvertEmailToTask = (email: EmailReference) => {
    addTask({
      title: `Responder/Tratar: ${email.subject}`,
      description: `De: ${email.from.name} (${email.from.email})\n\nTrecho: ${email.snippet}`,
      assignee: user.name,
      assigneeEmail: user.email,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'high',
      originType: 'email'
    });
    setTaskNotice('Tarefa criada com sucesso na sua lista de ações!');
    setTimeout(() => setTaskNotice(null), 3500);
  };

  const handleOpenInGmail = (email: EmailReference) => {
    // Open Gmail search / compose directly
    const gmailUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email.subject)}`;
    window.open(gmailUrl, '_blank');
  };

  const buildGmailReplyUrl = (email: EmailReference, body: string) => {
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: email.from.email,
      su: `Re: ${email.subject}`,
      body
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  };

  const handleOpenMailto = (email: EmailReference) => {
    const mailtoUrl = `mailto:${email.from.email}?subject=${encodeURIComponent(`Re: ${email.subject}`)}&body=${encodeURIComponent(`\n\n--- Mensagem Original ---\nDe: ${email.from.name} <${email.from.email}>\nAssunto: ${email.subject}\n\n${email.snippet}`)}`;
    window.location.href = mailtoUrl;
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;

    setIsSending(true);
    window.open(buildGmailReplyUrl(selectedEmail, replyText.trim()), '_blank', 'noopener,noreferrer');
    setIsSending(false);
    setIsReplying(false);
    setReplyText('');
    setSentSuccessNotice(`Rascunho aberto no Gmail para ${selectedEmail.from.name}. O Gmail aplicará a assinatura definida para respostas.`);
    setTimeout(() => setSentSuccessNotice(null), 4000);
  };

  const handleGenerateAIReply = () => {
    if (!selectedEmail) return;
    const aiDraft = `Olá ${selectedEmail.from.name},\n\nRecebi seu e-mail sobre "${selectedEmail.subject}" e já estamos alinhando os pontos com a equipe técnica da NuRa.\n\nRetornarei com o posicionamento definitivo e o cronograma validado até o final do dia.`;
    setReplyText(aiDraft);
    setIsReplying(true);
  };

  return (
    <div id="email-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Referências de E-mail
            </h1>
            <p className="text-xs text-slate-500">
              Organize mensagens registradas localmente, abra no Gmail ou converta em tarefas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar e-mails..."
            className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* Grid: Email List + Email Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Email List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredEmails.map(e => {
            const isSelected = selectedEmail?.id === e.id;
            return (
              <div
                key={e.id}
                onClick={() => {
                  setSelectedEmail(e);
                  setIsReplying(false);
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {e.from.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDateBR(e.date)}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {e.subject}
                </h4>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {e.snippet}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Email Reader (7 cols) */}
        <div className="lg:col-span-7">
          {selectedEmail ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
              {/* Top notification alerts */}
              {sentSuccessNotice && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{sentSuccessNotice}</span>
                </div>
              )}

              {taskNotice && (
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>{taskNotice}</span>
                </div>
              )}

              {/* Email Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedEmail.subject}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    De: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEmail.from.name}</span> ({selectedEmail.from.email})
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formatDateBR(selectedEmail.date)}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start">
                  <button
                    type="button"
                    onClick={() => handleOpenInGmail(selectedEmail)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                    title="Abrir no Gmail oficial"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-600" />
                    <span>Abrir no Gmail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertEmailToTask(selectedEmail)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Converter em Tarefa</span>
                  </button>
                </div>
              </div>

              {/* Email body preview */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                <p>{selectedEmail.snippet}</p>
                <p>
                  Solicitamos a confirmação das diretrizes e o alinhamento das próximas entregas estratégicas da NuRa.
                </p>
                <p className="pt-2 text-slate-400 text-xs">
                  Atenciosamente,<br />
                  <span className="font-bold text-slate-600 dark:text-slate-300">{selectedEmail.from.name}</span><br />
                  {selectedEmail.from.email}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying(true);
                      if (!replyText) setReplyText(`Olá ${selectedEmail.from.name},\n\n`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Responder</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAIReply}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sugerir rascunho local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMailto(selectedEmail)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium transition-colors"
                    title="Abrir no cliente de e-mail padrão do sistema"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    <span>App de E-mail (mailto)</span>
                  </button>
                </div>
              </div>

              {/* Inline Reply Box */}
              {isReplying && (
                <form
                  onSubmit={handleSendReply}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-blue-300 dark:border-blue-700 space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
                      Respondendo para {selectedEmail.from.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReplying(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    autoFocus
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                  />

                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] leading-relaxed text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Ao clicar em <strong>Abrir resposta no Gmail</strong>, o Gmail acrescentará a assinatura configurada como padrão para respostas e encaminhamentos. O NuRa não copia nem armazena sua assinatura.
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleGenerateAIReply}
                      className="text-xs text-purple-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Regerar rascunho local
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                        <span>{isSending ? 'Abrindo...' : 'Abrir resposta no Gmail'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Selecione um e-mail para ler, responder ou converter em ação.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
