import React, { useState, useRef } from 'react';
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
  Tag as TagIcon,
  Trash2,
  Edit3,
  X,
  Save,
  Upload
} from 'lucide-react';
import { TagBadge } from '../components/common/TagBadge';
import { formatDateBR } from '../lib/date';

import type { DriveReference } from '../types';

export const FilesView: React.FC = () => {
  const { driveFiles, meetings, tags, saveDriveFiles } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFile, setEditingFile] = useState<DriveReference | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    meetingId: string;
    tags: string[];
  }>({ name: '', description: '', meetingId: '', tags: [] });

  const filteredFiles = driveFiles.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'slide':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: DriveReference[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
      let type: DriveReference['type'] = 'other';

      if (['xls', 'xlsx', 'csv'].includes(ext)) type = 'sheet';
      else if (['ppt', 'pptx'].includes(ext)) type = 'slide';
      else if (['doc', 'docx'].includes(ext)) type = 'doc';
      else if (['pdf'].includes(ext)) type = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'image';

      const newFile: DriveReference = {
        id: `file_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        lastModified: new Date().toISOString(),
        url: '#',
        tags: [],
        description: ''
      };

      newFiles.push(newFile);
    }

    await saveDriveFiles([...driveFiles, ...newFiles]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (file: DriveReference) => {
    setEditingFile(file);
    setEditForm({
      name: file.name,
      description: file.description || '',
      meetingId: file.meetingId || '',
      tags: [...file.tags]
    });
  };

  const cancelEdit = () => {
    setEditingFile(null);
    setEditForm({ name: '', description: '', meetingId: '', tags: [] });
  };

  const saveEdit = async () => {
    if (!editingFile) return;

    const updatedFile: DriveReference = {
      ...editingFile,
      name: editForm.name,
      description: editForm.description || undefined,
      meetingId: editForm.meetingId || undefined,
      tags: editForm.tags
    };

    const updatedFiles = driveFiles.map(f =>
      f.id === editingFile.id ? updatedFile : f
    );

    await saveDriveFiles(updatedFiles);
    setEditingFile(null);
  };

  const confirmDelete = async (fileId: string) => {
    if (!deleteConfirm) return;

    const updatedFiles = driveFiles.filter(f => f.id !== fileId);
    await saveDriveFiles(updatedFiles);
    setDeleteConfirm(null);
    if (editingFile?.id === fileId) {
      setEditingFile(null);
    }
  };

  const toggleTag = (tagId: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  return (
    <div id="files-view" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
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

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivos..."
              className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 w-40"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Enviando...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Editar Arquivo
                </h2>
                <button
                  onClick={cancelEdit}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nome do arquivo
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Descrição
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Adicione uma descrição..."
                />
              </div>

              {/* Reunião vinculada */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Vincular a reunião
                </label>
                <select
                  value={editForm.meetingId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, meetingId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Nenhuma reunião</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        editForm.tags.includes(tag.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Excluir arquivo?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(f => (
          <div
            key={f.id}
            className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all group flex flex-col justify-between"
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
                      {f.size} • {formatDateBR(f.lastModified)}
                    </span>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(f)}
                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(f.id)}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {f.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {f.description}
                </p>
              )}

              {f.meetingId && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {meetings.find(m => m.id === f.meetingId)?.title || 'Reunião'}
                  </span>
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
                  Referência local
                </span>
              )}
              <Download className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors" />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredFiles.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Paperclip className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Nenhum arquivo encontrado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              {searchQuery
                ? 'Tente buscar com outros termos.'
                : 'Faça upload de arquivos ou vincule documentos às suas reuniões e notas.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload de arquivo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
