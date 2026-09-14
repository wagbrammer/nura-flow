import React, { FormEvent, useMemo, useState } from 'react';
import {
  AppWindow,
  BarChart3,
  Copy,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe2,
  HardDrive,
  Link2,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Users,
  X,
  type LucideIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UsefulLink, UsefulLinkIcon, UsefulLinkLocation } from '../types';

type LinkDraft = Omit<UsefulLink, 'id' | 'createdAt' | 'updatedAt'>;
type LinkFilter = 'all' | 'favorites' | UsefulLinkLocation;

const ICON_OPTIONS: Array<{ id: UsefulLinkIcon; label: string; Icon: LucideIcon }> = [
  { id: 'globe', label: 'Web', Icon: Globe2 },
  { id: 'folder', label: 'Pasta', Icon: FolderOpen },
  { id: 'hard-drive', label: 'HD', Icon: HardDrive },
  { id: 'app', label: 'Sistema', Icon: AppWindow },
  { id: 'chart', label: 'Indicadores', Icon: BarChart3 },
  { id: 'mail', label: 'E-mail', Icon: Mail },
  { id: 'users', label: 'Pessoas', Icon: Users },
  { id: 'database', label: 'Dados', Icon: Database },
  { id: 'document', label: 'Documento', Icon: FileText },
  { id: 'settings', label: 'Ferramenta', Icon: Settings }
];

const COLOR_OPTIONS: Array<{ id: UsefulLink['color']; label: string; swatch: string }> = [
  { id: 'emerald', label: 'Verde', swatch: 'bg-emerald-500' },
  { id: 'blue', label: 'Azul', swatch: 'bg-blue-500' },
  { id: 'violet', label: 'Violeta', swatch: 'bg-violet-500' },
  { id: 'amber', label: 'Âmbar', swatch: 'bg-amber-500' },
  { id: 'rose', label: 'Vermelho', swatch: 'bg-rose-500' },
  { id: 'slate', label: 'Cinza', swatch: 'bg-slate-500' }
];

const COLOR_STYLES: Record<UsefulLink['color'], { tile: string; accent: string; border: string }> = {
  emerald: { tile: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', accent: 'text-emerald-700 dark:text-emerald-300', border: 'hover:border-emerald-400 dark:hover:border-emerald-700' },
  blue: { tile: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', accent: 'text-blue-700 dark:text-blue-300', border: 'hover:border-blue-400 dark:hover:border-blue-700' },
  violet: { tile: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', accent: 'text-violet-700 dark:text-violet-300', border: 'hover:border-violet-400 dark:hover:border-violet-700' },
  amber: { tile: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', accent: 'text-amber-700 dark:text-amber-300', border: 'hover:border-amber-400 dark:hover:border-amber-700' },
  rose: { tile: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', accent: 'text-rose-700 dark:text-rose-300', border: 'hover:border-rose-400 dark:hover:border-rose-700' },
  slate: { tile: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', accent: 'text-slate-700 dark:text-slate-300', border: 'hover:border-slate-400 dark:hover:border-slate-600' }
};

const EMPTY_DRAFT: LinkDraft = {
  title: '',
  description: '',
  address: '',
  location: 'web',
  icon: 'globe',
  color: 'emerald',
  category: '',
  isFavorite: true
};

const getIcon = (icon: UsefulLinkIcon) => ICON_OPTIONS.find(option => option.id === icon)?.Icon || Link2;

const normalizeWebAddress = (address: string) => {
  const candidate = /^https?:\/\//i.test(address.trim()) ? address.trim() : `https://${address.trim()}`;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.appendChild(temporary);
    temporary.select();
    document.execCommand('copy');
    temporary.remove();
  }
};

export const UsefulLinksView: React.FC = () => {
  const {
    usefulLinks,
    addUsefulLink,
    updateUsefulLink,
    deleteUsefulLink,
    toggleUsefulLinkFavorite
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LinkFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LinkDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const visibleLinks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return usefulLinks
      .filter(link => {
        const matchesFilter = filter === 'all'
          || (filter === 'favorites' ? link.isFavorite : link.location === filter);
        const matchesSearch = !query || [link.title, link.description, link.category, link.address]
          .some(value => value.toLocaleLowerCase('pt-BR').includes(query));
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.title.localeCompare(b.title, 'pt-BR'));
  }, [filter, search, usefulLinks]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (link: UsefulLink) => {
    setEditingId(link.id);
    setDraft({
      title: link.title,
      description: link.description,
      address: link.address,
      location: link.location,
      icon: link.icon,
      color: link.color,
      category: link.category,
      isFavorite: link.isFavorite
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.title.trim();
    const rawAddress = draft.address.trim();
    if (!title || !rawAddress) {
      setFormError('Informe o nome e o endereço do atalho.');
      return;
    }

    const address = draft.location === 'web' ? normalizeWebAddress(rawAddress) : rawAddress;
    if (!address) {
      setFormError('Informe um endereço web válido, como https://exemplo.com.');
      return;
    }

    const normalizedDraft: LinkDraft = {
      ...draft,
      title,
      description: draft.description.trim(),
      category: draft.category.trim() || (draft.location === 'web' ? 'Web' : 'Computador'),
      address
    };

    if (editingId) {
      updateUsefulLink(editingId, normalizedDraft);
      setNotice('Atalho atualizado com sucesso.');
    } else {
      addUsefulLink(normalizedDraft);
      setNotice('Novo atalho cadastrado com sucesso.');
    }
    closeModal();
  };

  const handleUseLink = async (link: UsefulLink) => {
    if (link.location === 'web') {
      const address = normalizeWebAddress(link.address);
      if (!address) {
        setNotice('Este endereço web precisa ser corrigido antes de abrir.');
        return;
      }
      window.open(address, '_blank', 'noopener,noreferrer');
      return;
    }

    await copyText(link.address);
    setNotice('Caminho copiado. Cole-o na barra do Explorador de Arquivos.');
  };

  const handleDelete = (link: UsefulLink) => {
    if (!window.confirm(`Excluir o atalho “${link.title}”?`)) return;
    deleteUsefulLink(link.id);
    setNotice('Atalho excluído.');
  };

  return (
    <div id="useful-links-view" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300">
            <Link2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Links Úteis</h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Cadastre atalhos e marque com estrela os que devem aparecer na barra superior.</p>
          </div>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Cadastrar atalho
        </button>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome, categoria ou endereço..." className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" />
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {([
            ['all', 'Todos'],
            ['favorites', 'Favoritos'],
            ['web', 'Web'],
            ['local', 'HD / Pastas']
          ] as Array<[LinkFilter, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === value ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{label}</button>
          ))}
        </div>
      </section>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
        </div>
      )}

      {visibleLinks.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Atalhos cadastrados">
          {visibleLinks.map(link => {
            const Icon = getIcon(link.icon);
            const styles = COLOR_STYLES[link.color];
            return (
              <article key={link.id} className={`group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${styles.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${styles.tile}`}><Icon className="h-5 w-5" /></div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => toggleUsefulLinkFavorite(link.id)} className={`rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 ${link.isFavorite ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} aria-label={link.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}><Star className="h-4 w-4" fill={link.isFavorite ? 'currentColor' : 'none'} /></button>
                    <button type="button" onClick={() => openEdit(link)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800" aria-label={`Editar ${link.title}`}><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => handleDelete(link)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={`Excluir ${link.title}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="mt-4 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-base font-extrabold text-slate-900 dark:text-white">{link.title}</h2>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{link.category}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{link.description || 'Atalho de acesso rápido.'}</p>
                  <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60">
                    {link.location === 'web' ? <Globe2 className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <HardDrive className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                    <span className="truncate font-mono text-[10px] text-slate-500" title={link.address}>{link.address}</span>
                  </div>
                </div>

                <button type="button" onClick={() => handleUseLink(link)} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-extrabold transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 ${styles.accent}`}>
                  {link.location === 'web' ? <><ExternalLink className="h-4 w-4" /> Abrir sistema</> : <><Copy className="h-4 w-4" /> Copiar caminho</>}
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <Link2 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h2 className="mt-4 text-sm font-extrabold text-slate-800 dark:text-slate-200">Nenhum atalho encontrado</h2>
          <p className="mt-1 text-xs text-slate-500">Cadastre um novo link ou altere os filtros de pesquisa.</p>
          <button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Cadastrar primeiro atalho</button>
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={closeModal}>
          <section className="my-6 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="useful-link-form-title" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 id="useful-link-form-title" className="text-sm font-extrabold text-slate-900 dark:text-white">{editingId ? 'Editar atalho' : 'Cadastrar novo atalho'}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Escolha o destino, o ícone e como ele aparecerá na sua central.</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" onClick={() => setDraft(current => ({ ...current, location: 'web', icon: current.location === 'local' ? 'globe' : current.icon }))} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${draft.location === 'web' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500'}`}><Globe2 className="h-4 w-4" /> Link web</button>
                <button type="button" onClick={() => setDraft(current => ({ ...current, location: 'local', icon: current.location === 'web' ? 'folder' : current.icon }))} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold ${draft.location === 'local' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500'}`}><HardDrive className="h-4 w-4" /> HD / Pasta</button>
              </div>

              {formError && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">{formError}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome do atalho *<input value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} required autoFocus placeholder="Ex.: Portal Comercial" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoria<input value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))} placeholder="Ex.: Comercial, Arquivos" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
              </div>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{draft.location === 'web' ? 'Endereço do site ou sistema *' : 'Caminho no computador *'}<input value={draft.address} onChange={event => setDraft(current => ({ ...current, address: event.target.value }))} required placeholder={draft.location === 'web' ? 'https://sistema.exemplo.com' : 'C:\\Users\\Wagner\\Documentos'} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />{draft.location === 'local' && <span className="mt-1.5 block text-[11px] font-normal leading-5 text-slate-500">O caminho será copiado para você colar no Explorador de Arquivos do Windows.</span>}</label>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Descrição<textarea value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))} rows={2} placeholder="Para que serve este atalho?" className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>

              <fieldset>
                <legend className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Ícone</legend>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {ICON_OPTIONS.map(option => <button key={option.id} type="button" onClick={() => setDraft(current => ({ ...current, icon: option.id }))} className={`grid aspect-square place-items-center rounded-xl border transition ${draft.icon === option.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/15 dark:bg-emerald-950 dark:text-emerald-300' : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`} title={option.label} aria-label={`Ícone ${option.label}`}><option.Icon className="h-4 w-4" /></button>)}
                </div>
              </fieldset>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <fieldset>
                  <legend className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Cor</legend>
                  <div className="flex gap-2">{COLOR_OPTIONS.map(color => <button key={color.id} type="button" onClick={() => setDraft(current => ({ ...current, color: color.id }))} className={`h-7 w-7 rounded-full ${color.swatch} ${draft.color === color.id ? 'ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`} aria-label={`Cor ${color.label}`} />)}</div>
                </fieldset>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"><input type="checkbox" checked={draft.isFavorite} onChange={event => setDraft(current => ({ ...current, isFavorite: event.target.checked }))} className="h-4 w-4 accent-emerald-600" /> Marcar como favorito</label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700">{editingId ? 'Salvar alterações' : 'Cadastrar atalho'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
