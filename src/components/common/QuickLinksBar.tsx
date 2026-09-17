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
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const favorites = usefulLinks
    .filter(link => link.isFavorite)
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  const openManager = () => {
    setIsOpen(false);
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
      setIsOpen(false);
      return;
    }

    await copyPath(link.address);
    setNotice('Caminho copiado. Cole no Explorador de Arquivos.');
  };

  const [showExtraLinks, setShowExtraLinks] = useState(false);
  const visibleFavorites = favorites.slice(0, 4);
  const extraLinks = favorites.slice(4);

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
              onClick={() => setShowExtraLinks(!showExtraLinks)}
              className="grid h-9 min-w-9 place-items-center rounded-xl bg-slate-100 px-2 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={`Ver mais ${extraLinks.length} atalhos`}
            >
              +{extraLinks.length}
            </button>

            {showExtraLinks && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExtraLinks(false)}
                />
                <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
                  <div className="max-h-80 overflow-y-auto">
                    {extraLinks.map(link => {
                      const Icon = ICONS[link.icon] || Link2;
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            activateLink(link);
                            setShowExtraLinks(false);
                          }}
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
                      onClick={() => {
                        setShowExtraLinks(false);
                        openManager();
                      }}
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

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        title="Acessos rápidos"
        aria-label="Abrir acessos rápidos"
      >
        <Link2 className="h-4 w-4" />
        {favorites.length > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/65 backdrop-blur-sm" onMouseDown={() => setIsOpen(false)}>
          <section className="max-h-[78vh] w-full overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-labelledby="mobile-quick-links-title" onMouseDown={event => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300"><Star className="h-4 w-4" fill="currentColor" /></span>
                <div><h2 id="mobile-quick-links-title" className="text-sm font-extrabold text-slate-900 dark:text-white">Acessos rápidos</h2><p className="text-xs text-slate-500">Seus atalhos favoritos</p></div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar acessos rápidos"><X className="h-5 w-5" /></button>
            </div>

            {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" role="status">{notice}</p>}

            {favorites.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {visibleFavorites.map(link => {
                    const Icon = ICONS[link.icon] || Link2;
                    return (
                      <button key={link.id} type="button" onClick={() => { activateLink(link); setIsOpen(false); }} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition active:scale-[.98] dark:border-slate-700 dark:bg-slate-800/70">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${COLORS[link.color]}`}><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0"><strong className="block truncate text-xs text-slate-800 dark:text-slate-100">{link.title}</strong><span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">{link.location === 'web' ? <><ExternalLink className="h-3 w-3" /> Abrir</> : <><Copy className="h-3 w-3" /> Copiar</>}</span></span>
                      </button>
                    );
                  })}
                </div>

                {extraLinks.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowExtraLinks(!showExtraLinks)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Link2 className="h-4 w-4" />
                      Ver mais {extraLinks.length} atalhos
                    </button>

                    {showExtraLinks && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {extraLinks.map(link => {
                          const Icon = ICONS[link.icon] || Link2;
                          return (
                            <button
                              key={link.id}
                              type="button"
                              onClick={() => { activateLink(link); setIsOpen(false); }}
                              className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition active:scale-[.98] dark:border-slate-700 dark:bg-slate-800/70"
                            >
                              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${COLORS[link.color]}`}>
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <strong className="block truncate text-xs text-slate-800 dark:text-slate-100">{link.title}</strong>
                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                  {link.location === 'web' ? <><ExternalLink className="h-3 w-3" /> Abrir</> : <><Copy className="h-3 w-3" /> Copiar</>}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
                <Link2 className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-500">Nenhum atalho favorito.</p>
              </div>
            )}

            <button type="button" onClick={openManager} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white">
              <Settings className="h-4 w-4" />
              Gerenciar Links Úteis
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
