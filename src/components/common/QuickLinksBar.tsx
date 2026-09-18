import React, { useState } from 'react';
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
  Settings,
  Star,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  type LucideIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UsefulLink, UsefulLinkIcon } from '../../types';

const ICONS: Record<UsefulLinkIcon, LucideIcon> = {
  globe: Globe2,
  folder: FolderOpen,
  'hard-drive': HardDrive,
  app: AppWindow,
  chart: BarChart3,
  mail: Mail,
  users: Users,
  database: Database,
  document: FileText,
  settings: Settings
};

const COLORS: Record<UsefulLink['color'], string> = {
  emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900',
  blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900',
  violet: 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900',
  amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900',
  rose: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900',
  slate: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
};

const normalizeWebAddress = (address: string) => {
  const candidate = /^https?:\/\//i.test(address.trim()) ? address.trim() : `https://${address.trim()}`;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
};

const copyPath = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path);
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = path;
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.appendChild(temporary);
    temporary.select();
    document.execCommand('copy');
    temporary.remove();
  }
};

type QuickLinksBarProps = {
  variant: 'desktop' | 'mobile';
};

export const QuickLinksBar: React.FC<QuickLinksBarProps> = ({ variant }) => {
  const { usefulLinks, setCurrentView } = useApp();
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(false);
  const favorites = usefulLinks
    .filter(link => link.isFavorite)
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  const openManager = () => {
    setCurrentView('useful_links');
  };

  const activateLink = async (link: UsefulLink) => {
    setNotice('');
    if (link.location === 'web') {
      const address = normalizeWebAddress(link.address);
      if (!address) {
        setNotice('Endereço inválido. Edite este atalho.');
        return;
      }
      window.open(address, '_blank', 'noopener,noreferrer');
      return;
    }

    await copyPath(link.address);
    setNotice('Caminho copiado. Cole no Explorador de Arquivos.');
  };

  const visibleCount = 4;
  const visibleFavorites = favorites.slice(0, visibleCount);
  const extraLinks = favorites.slice(visibleCount);

  // ─── DESKTOP ───────────────────────────────────────────────
  if (variant === 'desktop') {
    return (
      <div className="hidden shrink-0 items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-700 xl:flex" aria-label="Atalhos favoritos">
        {visibleFavorites.length > 0 ? visibleFavorites.map(link => {
          const Icon = ICONS[link.icon] || Link2;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => activateLink(link)}
              className={`flex h-11 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition ${COLORS[link.color]}`}
              title={link.location === 'web' ? `Abrir ${link.title} em nova janela` : `Copiar caminho de ${link.title}`}
              aria-label={link.location === 'web' ? `Abrir ${link.title} em nova janela` : `Copiar caminho de ${link.title}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="block w-full truncate text-center text-[9px] font-extrabold leading-tight">
                {link.title}
              </span>
            </button>
          );
        }) : (
          <button type="button" onClick={openManager} className="flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300" title="Cadastrar atalhos">
            <Link2 className="h-4 w-4" /> Atalhos
          </button>
        )}

        {extraLinks.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="grid h-9 min-w-9 place-items-center rounded-xl bg-slate-100 px-2 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={`Ver mais ${extraLinks.length} atalhos`}
            >
              +{extraLinks.length}
            </button>

            {expanded && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
                  <div className="max-h-80 overflow-y-auto">
                    {extraLinks.map(link => {
                      const Icon = ICONS[link.icon] || Link2;
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => { activateLink(link); setExpanded(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${COLORS[link.color].replace('hover:', '')} hover:opacity-80`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-semibold truncate">{link.title}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setExpanded(false); openManager(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Gerenciar todos os atalhos
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={openManager}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Gerenciar Links Úteis"
          aria-label="Gerenciar Links Úteis"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ─── MOBILE / TABLET ───────────────────────────────────────
  // Strategy:
  //   1. Show "+" button with badge in header
  //   2. Clicking expands a dropdown panel below header
  //   3. Tapping any link navigates and collapses

  return (
    <div className="flex items-center gap-2">
      {/* "+" Button — always visible in header, shows badge if extra links */}
      {favorites.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`relative flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
            expanded
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-expanded={expanded}
          aria-label="Acessos rápidos"
          title="Acessos rápidos"
        >
          <Link2 className="h-4 w-4" />
          {extraLinks.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {extraLinks.length}
            </span>
          )}
        </button>
      )}

      {/* Inline expanded panel — flows with page, never overlays search */}
      {expanded && (
        <div className="fixed inset-x-0 top-16 z-30 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {favorites.map(link => {
                const Icon = ICONS[link.icon] || Link2;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => { activateLink(link); setExpanded(false); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition active:scale-95 ${COLORS[link.color]}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold truncate w-full text-center">{link.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => { setExpanded(false); openManager(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Gerenciar links
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
