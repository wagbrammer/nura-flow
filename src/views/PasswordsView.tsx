import React, { useState } from 'react';
import { Key, Eye, EyeOff, Copy, Trash2, Plus, Pencil } from 'lucide-react';

export const PasswordsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', url: '', username: '', password: '', notes: '' });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');

  // Mock data for demo
  const [items, setItems] = useState([
    { id: '1', title: 'GitHub', url: 'https://github.com', username: 'wagbrammer', password: 'ghp_ABC123xyz', notes: 'Token pessoal do repositório', createdAt: '2026-01-15', updatedAt: '2026-09-01' },
    { id: '2', title: 'Banco Inter', url: 'https://inter.com.br', username: '12345678', password: 'senhaSegura99', notes: 'Acesso ao internet banking', createdAt: '2026-03-20', updatedAt: '2026-08-30' },
  ]);

  const visible = items.filter(i =>
    !search.trim() || [i.title, i.username, i.url].some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleReveal = (id: string) => setRevealed(r => ({ ...r, [id]: !r[id] }));
  const copyPass = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setNotice('Senha copiada!'); setTimeout(() => setNotice(''), 1500); } catch {}
  };

  const handleSave = () => {
    if (!draft.title.trim() || !draft.password.trim()) { setNotice('Preencha título e senha'); setTimeout(() => setNotice(''), 2000); return; }
    if (editingId) {
      setItems(items.map(i => i.id === editingId ? { ...i, ...draft, updatedAt: new Date().toISOString() } : i));
      setEditingId(null);
    } else {
      setItems([...items, { ...draft, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    }
    setDraft({ title: '', url: '', username: '', password: '', notes: '' });
    setShowForm(false);
    setNotice('Salvo com sucesso!');
    setTimeout(() => setNotice(''), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir esta senha?')) {
      setItems(items.filter(i => i.id !== id));
      setNotice('Excluído!');
      setTimeout(() => setNotice(''), 1500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"><Key size={22} /></div>
        <div><h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Senhas</h1><p className="text-sm text-slate-500 dark:text-slate-400">Gerencie suas credenciais com segurança e vincule a links.</p></div>
      </div>

      <div className="flex gap-2">
        <input type="text" placeholder="Buscar título, URL ou usuário..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
        <button onClick={() => { setShowForm(true); setEditingId(null); setDraft({ title: '', url: '', username: '', password: '', notes: '' }); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16} /> Nova</button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm">{editingId ? 'Editar senha' : 'Nova senha'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Título" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
            <input placeholder="URL" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
            <input placeholder="Usuário" value={draft.username} onChange={e => setDraft({ ...draft, username: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
            <input type="password" placeholder="Senha" value={draft.password} onChange={e => setDraft({ ...draft, password: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
          </div>
          <textarea placeholder="Notas (opcional)" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold">Salvar</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {notice && <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">{notice}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.title}</h3>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline truncate block">{p.url}</a>
                <p className="text-xs text-slate-500 mt-1">{p.username}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleReveal(p.id)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500" title={revealed[p.id] ? 'Ocultar' : 'Revelar'}>
                  {revealed[p.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => copyPass(p.password)} className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600" title="Copiar senha">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div className="mt-3 font-mono text-sm bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 tracking-widest break-all select-all">
              {revealed[p.id] ? p.password : '*'.repeat(Math.min(p.password.length || 8, 12))}
            </div>
            {p.notes && <p className="text-xs text-slate-500 mt-2">{p.notes}</p>}
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => { setShowForm(true); setEditingId(p.id); setDraft({ title: p.title, url: p.url, username: p.username, password: p.password, notes: p.notes }) }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1" title="Editar"><Pencil size={12} /> Editar</button>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1" title="Excluir"><Trash2 size={12} /> Excluir</button>
            </div>
          </div>
        ))}
        {visible.length === 0 && search.trim() && <p className="text-slate-500 text-sm col-span-2">Nenhuma senha encontrada para "{search}".</p>}
      </div>
    </div>
  );
};
