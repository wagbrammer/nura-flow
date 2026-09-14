import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { ThemeMode } from '../../types';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { theme, setTheme } = useApp();

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Claro', icon: <Sun className="w-4 h-4" /> },
    { mode: 'dark', label: 'Escuro', icon: <Moon className="w-4 h-4" /> },
    { mode: 'auto', label: 'Auto', icon: <Laptop className="w-4 h-4" /> }
  ];

  if (compact) {
    return (
      <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {options.map(opt => (
          <button
            key={opt.mode}
            type="button"
            id={`theme-btn-${opt.mode}`}
            onClick={() => setTheme(opt.mode)}
            title={`Tema ${opt.label}`}
            className={`p-1.5 rounded-md transition-all ${
              theme === opt.mode
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
      {options.map(opt => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            id={`theme-opt-${opt.mode}`}
            onClick={() => setTheme(opt.mode)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
