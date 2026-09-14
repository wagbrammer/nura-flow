import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Paperclip,
  Search,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  Tag as TagIcon
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { formatDateBR } from '../lib/date';

export const FilesView: React.FC = () => {
  const { driveFiles, meetings, tags } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = driveFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'presentation':
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div id="files-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
            <Paperclip className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Arquivos & Anexos
            </h1>
            <p className="text-xs text-slate-500">
              Documentos vinculados a reuniões, notas e projetos da NuRa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar arquivos..."
            className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(f => {
          const linkedMeeting = meetings.find(m => m.id === f.meetingId);
          return (
            <div
              key={f.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {getFileIcon(f.type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {f.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {f.size} • Atualizado em {formatDateBR(f.lastModified)}
                      </span>
                    </div>
                  </div>
                </div>

                {linkedMeeting && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Reunião: {linkedMeeting.title}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {f.tags.map(tId => (
                    <TagBadge key={tId} tagId={tId} />
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {f.url && f.url !== '#' ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir arquivo</span>
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Referência local — sem Drive conectado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
