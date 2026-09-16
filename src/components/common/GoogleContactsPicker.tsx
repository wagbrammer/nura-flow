import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone } from 'lucide-react';
import type { Participant } from '../../types';

interface GoogleContactsPickerProps {
  open: boolean;
  onClose: () => void;
  onAddParticipants: (participants: Participant[]) => void;
  existingParticipants?: Participant[];
}

export const GoogleContactsPicker: React.FC<GoogleContactsPickerProps> = ({
  open,
  onClose,
  onAddParticipants,
  existingParticipants = []
}) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch('/api/google/contacts', { credentials: 'same-origin' })
      .then(res => res.json())
      .then(data => {
        setContacts(data.contacts || []);
      })
      .catch(err => console.error('Erro ao buscar contatos:', err))
      .finally(() => setLoading(false));
  }, [open]);

  const toggleContact = (resourceName: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(resourceName)) {
      newSelected.delete(resourceName);
    } else {
      newSelected.add(resourceName);
    }
    setSelected(newSelected);
  };

  const handleAddSelected = () => {
    const participants: Participant[] = Array.from(selected)
      .map(resourceName => contacts.find(c => c.resourceName === resourceName))
      .filter(Boolean)
      .map(contact => ({
        name: contact.name,
        email: contact.email,
        role: 'Participante',
        status: 'pending' as const
      }));

    onAddParticipants(participants);
    onClose();
  };

  if (!open) return null;

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Selecionar Contatos do Google
                </h2>
                <p className="text-xs text-slate-500">
                  Escolha até {Math.min(50 - existingParticipants.length, 50)} participantes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 flex-1 text-sm"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Carregando contatos...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Nenhum contato encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Tente buscar com outros termos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const isSelected = selected.has(contact.resourceName);
                const isAlreadyAdded = existingParticipants.some(
                  p => p.email === contact.email || p.name === contact.name
                );

                return (
                  <button
                    key={contact.resourceName}
                    onClick={() => !isAlreadyAdded && toggleContact(contact.resourceName)}
                    disabled={isAlreadyAdded}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isAlreadyAdded
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                        : isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {contact.name}
                        {isAlreadyAdded && (
                          <span className="ml-2 text-xs text-slate-400 font-normal">(já adicionado)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {contact.email && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selected.size === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold transition-colors"
            >
              Adicionar Participantes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
