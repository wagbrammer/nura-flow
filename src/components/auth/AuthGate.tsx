import React, { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

type AuthState = 'checking' | 'authenticated' | 'anonymous';

export const AuthGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    // Check session first
    fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => {
        if (active) setAuthState(response.ok ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (active) setAuthState('anonymous');
      });
    // Load logo from server settings
    fetch('/api/settings/logo', { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const form = new URLSearchParams({ username, password });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      });

      const session = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok || !session.ok) {
        setError('Usuário ou senha inválidos. Verifique os dados e tente novamente.');
        return;
      }

      setPassword('');
      setAuthState('authenticated');
    } catch {
      setError('Não foi possível validar o acesso agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const brandLogo = () => {
    if (logoUrl) {
      return <img src={logoUrl} alt="Logo" className="h-11 w-11 rounded-2xl object-contain bg-white shadow-xl" />;
    }
    return (
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-lg font-black text-white shadow-xl shadow-emerald-950/50">
        N
      </div>
    );
  };

  if (authState === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07111f] text-white">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          {brandLogo()}
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span className="text-xs font-semibold tracking-wide text-slate-400">Verificando acesso seguro...</span>
        </div>
      </div>
    );
  }

  if (authState === 'authenticated') return <>{children}</>;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07111f] px-5 py-8 text-slate-100">
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-7rem] h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

      <main className="relative w-full max-w-[430px]">
        <div className="mb-5 ml-1 flex items-center gap-3">
          {brandLogo()}
          <div>
            <strong className="block text-sm font-black tracking-[0.12em] text-white">NURA</strong>
            <span className="mt-0.5 block text-xs text-slate-400">Produtividade e conhecimento</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-slate-700/70 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-sky-400" />
          <div className="p-7 sm:p-9">
            <div className="mb-6">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-950 text-emerald-400 ring-1 ring-emerald-800/70">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black leading-tight text-white sm:text-[27px]">Bem-vindo de volta</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">Entre com suas credenciais para acessar o seu ambiente de trabalho.</p>
            </div>

            {error && (
              <p className="mb-5 rounded-xl border border-red-400/30 bg-red-950/40 px-3.5 py-3 text-xs leading-5 text-red-200" role="alert">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="mb-2 block text-xs font-bold text-slate-300">Usuário</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-3 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-xs font-bold text-slate-300">Senha</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-3 pr-12 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 transition hover:text-slate-200"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-emerald-950/40 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Validando acesso...' : 'Entrar no NuRa'}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Sessão protegida e expiração automática
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

