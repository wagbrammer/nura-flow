import React, { useEffect, useState } from 'react';
import { AppWindow, CheckCircle2, Expand, Maximize2, Minimize2, Tablet } from 'lucide-react';
import { pwaInstall } from '../../lib/pwa';

export const FullscreenToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  };

  if (!document.documentElement.requestFullscreen) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={compact
        ? 'grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400'
        : 'flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}
      title={isFullscreen ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
      aria-label={isFullscreen ? 'Sair da tela cheia' : 'Abrir em tela cheia'}
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      {!compact && <span>{isFullscreen ? 'Sair da tela cheia' : 'Abrir em tela cheia'}</span>}
    </button>
  );
};

export const TabletExperienceCard: React.FC = () => {
  const [canInstall, setCanInstall] = useState(pwaInstall.isAvailable());
  const [isStandalone, setIsStandalone] = useState(pwaInstall.isStandalone());
  const [installMessage, setInstallMessage] = useState('');

  useEffect(() => pwaInstall.subscribe(() => {
    setCanInstall(pwaInstall.isAvailable());
    setIsStandalone(pwaInstall.isStandalone());
  }), []);

  const handleInstall = async () => {
    const outcome = await pwaInstall.prompt();
    setInstallMessage(outcome === 'accepted'
      ? 'Instalação iniciada. Abra o NuRa pelo ícone criado no seu dispositivo.'
      : outcome === 'dismissed'
        ? 'Instalação cancelada. Você pode tentar novamente pelo menu do navegador.'
        : 'No navegador, use Menu → Adicionar à tela inicial ou Instalar aplicativo.');
  };

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs dark:border-emerald-900 dark:bg-emerald-950/25 sm:p-6" aria-labelledby="tablet-experience-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white"><Tablet className="h-5 w-5" /></span>
          <div>
            <h2 id="tablet-experience-title" className="text-sm font-extrabold text-slate-900 dark:text-white">Instalação como App (PWA) & Tela Cheia</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Instale o NuRa no seu celular ou tablet para abrir pelo ícone, sem a barra do navegador. O botão de tela cheia também funciona durante o uso comum.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isStandalone ? (
            <span className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-extrabold text-white"><CheckCircle2 className="h-4 w-4" /> Aplicativo instalado</span>
          ) : (
            <button type="button" onClick={handleInstall} className="flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-extrabold text-white hover:bg-emerald-800">
              <AppWindow className="h-4 w-4" /> {canInstall ? 'Instalar no dispositivo' : 'Como instalar'}
            </button>
          )}
          <FullscreenToggle />
        </div>
      </div>

      {installMessage && <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-slate-900/70 dark:text-emerald-300" role="status">{installMessage}</p>}

      <div className="mt-5 grid gap-2 text-[11px] text-slate-600 dark:text-slate-300 sm:grid-cols-3">
        <span className="flex items-center gap-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><AppWindow className="h-4 w-4 shrink-0 text-emerald-600" /> Ícone próprio na tela inicial</span>
        <span className="flex items-center gap-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><Expand className="h-4 w-4 shrink-0 text-emerald-600" /> Abre sem barra do navegador</span>
        <span className="flex items-center gap-2 rounded-xl bg-white/70 p-3 dark:bg-slate-900/50"><Tablet className="h-4 w-4 shrink-0 text-emerald-600" /> Layout adaptado a retrato e paisagem</span>
      </div>
    </section>
  );
};
