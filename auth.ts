/**
 * auth.ts - gerenciamento de sessão, hash de senha e página de login
 * --------------------------------------------------------------
 * Este módulo é consumido por `server.ts` e pelo `worker.ts`.
 *
 * • Cria/valida cookies de sessão (HTTP-only, SameSite=Strict)
 * • Verifica senhas usando PBKDF2-SHA256 (formato "algorithm$iters$salt$hash")
 * • Renderiza a página HTML de login (com suporte a logo opcional)
 * • Permite "bypass" temporário de autenticação via var env `SKIP_AUTH`
 */

// crypto é built-in do Node 20 (Web Crypto API global)

const SESSION_COOKIE = 'nura_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8h

export interface AuthConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
}

type AuthEnvironment = Record<string, unknown>;

const encoder = new TextEncoder();

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const hexToBytes = (hex: string): Uint8Array | null => {
  if (!/^[a-f\d]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const matches = hex.match(/.{2}/g);
  return matches ? new Uint8Array(matches.map((b) => Number.parseInt(b, 16))) : null;
};

const safeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
};

const sign = async (value: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToHex(new Uint8Array(sig));
};

export const SKIP_AUTH_BYPASS = process.env.SKIP_AUTH === '1';

export const getAuthConfig = (environment: AuthEnvironment): AuthConfig | null => {
  const username =
    (environment.NURA_AUTH_USER as string) ??
    (environment.ROBUSTEC_AUTH_USER as string);
  const passwordHash =
    (environment.NURA_AUTH_PASSWORD_HASH as string) ??
    (environment.ROBUSTEC_AUTH_PASSWORD_HASH as string);
  const sessionSecret =
    (environment.NURA_AUTH_SESSION_SECRET as string) ??
    (environment.ROBUSTEC_AUTH_SESSION_SECRET as string);

  if (
    typeof username !== 'string' ||
    typeof passwordHash !== 'string' ||
    typeof sessionSecret !== 'string'
  ) {
    if (SKIP_AUTH_BYPASS) {
      return { username: 'dev', passwordHash: '', sessionSecret: 'dev-secret' };
    }
    return null;
  }

  if (!username || !passwordHash || sessionSecret.length < 32) return null;
  return { username, passwordHash, sessionSecret };
};

export const verifyPassword = async (
  password: string,
  storedHash: string
): Promise<boolean> => {
  try {
    const [algorithm, iterationsText, saltHex, expectedHex] = storedHash.split('$');
    const iterations = Number.parseInt(iterationsText, 10);
    const salt = hexToBytes(saltHex ?? '');
    const expected = hexToBytes(expectedHex ?? '');

    if (
      algorithm !== 'pbkdf2_sha256' ||
      !Number.isFinite(iterations) ||
      iterations !== 100_000 ||
      !salt ||
      !expected
    ) {
      console.error('Password hash verification failed: invalid hash format');
      return false;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derived = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt,
          iterations,
        },
        key,
        expected.length * 8
      )
    );

    const result = safeEqual(bytesToHex(derived), expectedHex.toLowerCase());
    console.log(`Password verification for user: ${result}`);
    return result;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

export const createSessionCookie = async (
  username: string,
  secret: string
): Promise<string> => {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `${encodeURIComponent(username)}.${expiresAt}`;
  const signature = await sign(payload, secret);
  const isSecure = process.env.NODE_ENV === 'production';

  return `${SESSION_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; ${
    isSecure ? 'Secure; ' : ''
  }SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;
};

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export const hasValidSession = async (
  cookieHeader: string | null | undefined,
  config: AuthConfig
): Promise<boolean> => {
  try {
    if (!cookieHeader || typeof cookieHeader !== 'string') {
      console.log('No cookie header provided');
      return false;
    }

    const cookie = cookieHeader
      .split(';')
      .map((p) => p.trim())
      .find((p) => p.startsWith(`${SESSION_COOKIE}=`));

    if (!cookie) {
      console.log('Session cookie not found');
      return false;
    }

    const token = cookie.slice(SESSION_COOKIE.length + 1);
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token format');
      return false;
    }

    const [encodedUsername, expiresText, providedSignature] = parts;
    const expiresAt = Number.parseInt(expiresText, 10);

    if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
      console.log('Session expired');
      return false;
    }

    let username = '';
    try {
      username = decodeURIComponent(encodedUsername);
    } catch {
      console.log('Failed to decode username');
      return false;
    }

    if (!safeEqual(username, config.username)) {
      console.log(`Username mismatch: expected ${config.username}, got ${username}`);
      return false;
    }

    const expectedSignature = await sign(
      `${encodedUsername}.${expiresText}`,
      config.sessionSecret
    );
    const isValid = safeEqual(providedSignature, expectedSignature);
    console.log(`Session validation: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

export const renderLoginPage = (
  invalidCredentials = false,
  configurationMissing = false,
  logoUrl = ''
): string => {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="width:44px;height:44px;border-radius:15px;object-fit:contain;background:white;padding:4px;" />`
    : `<div class="mark">N</div>`;

  const errorMissing = configurationMissing
    ? '<p class="error" role="alert">O acesso protegido ainda não foi configurado no servidor.</p>'
    : '';

  const errorInvalid = invalidCredentials
    ? '<p class="error" role="alert">Usuário ou senha inválidos. Verifique os dados e tente novamente.</p>'
    : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Acesso | NuRa Flow</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; color: #e2e8f0; background: radial-gradient(circle at 20% 10%, rgba(16,185,129,.18), transparent 34%), radial-gradient(circle at 90% 90%, rgba(37,99,235,.16), transparent 32%), #07111f; }
      .shell { width: min(100%, 430px); }
      .brand { display: flex; align-items: center; gap: 12px; margin: 0 0 20px 4px; }
      .mark { width: 44px; height: 44px; border-radius: 15px; display: grid; place-items: center; font-size: 19px; font-weight: 900; color: white; background: linear-gradient(145deg, #047857, #10b981); box-shadow: 0 14px 38px rgba(16,185,129,.26); }
      .brand strong { font-size: 16px; letter-spacing: .08em; }
      .brand span { font-size: 12px; color: #94a3b8; }
      .card { position: relative; overflow: hidden; padding: 34px; border: 1px solid rgba(148,163,184,.2); border-radius: 28px; background: rgba(15,23,42,.9); box-shadow: 0 30px 90px rgba(0,0,0,.45); backdrop-filter: blur(20px); }
      .card::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: linear-gradient(90deg, #10b981, #22c55e, #38bdf8); }
      h1 { margin: 0; color: white; font-size: 27px; line-height: 1.18; }
      .intro { margin: 10px 0 26px; color: #94a3b8; font-size: 14px; line-height: 1.6; }
      label { display: block; margin: 0 0 8px; color: #cbd5e1; font-size: 12px; font-weight: 750; }
      input { width: 100%; margin-bottom: 17px; padding: 13px 14px; border: 1px solid #334155; border-radius: 13px; outline: none; color: white; background: #0b1324; font: inherit; transition: .2s ease; }
      input:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,.13); }
      button { width: 100%; margin-top: 5px; padding: 13px 16px; border: 0; border-radius: 13px; cursor: pointer; color: white; background: linear-gradient(135deg, #059669, #047857); font: inherit; font-weight: 850; box-shadow: 0 12px 28px rgba(5,150,105,.25); }
      button:hover { filter: brightness(1.08); }
      .error { margin: 0 0 18px; padding: 11px 13px; border: 1px solid rgba(248,113,113,.35); border-radius: 12px; color: #fecaca; background: rgba(127,29,29,.3); font-size: 12px; line-height: 1.45; }
      .secure { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 18px; color: #64748b; font-size: 11px; }
      .credit { margin-top: 24px; text-align: center; color: #64748b; font-size: 11px; font-weight: 500; letter-spacing: .02em; }
      @media (max-width:480px) { .card { padding:27px 22px; border-radius:23px; } h1 { font-size:24px; } }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="brand">
        ${logoHtml}
        <div>
          <strong>NURA</strong>
          <span>Produtividade e conhecimento</span>
        </div>
      </div>
      <section class="card" aria-labelledby="login-title">
        <h1 id="login-title">Bem-vindo de volta</h1>
        <p class="intro">Entre com suas credenciais para acessar o seu ambiente de trabalho.</p>
        ${errorMissing}${errorInvalid}
        <form method="post" action="/api/auth/login">
          <label for="username">Usuário</label>
          <input id="username" name="username" type="text" autocomplete="username" autocapitalize="none" required autofocus />
          <label for="password">Senha</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
          <button type="submit">Entrar no NuRa</button>
        </form>
        <div class="secure"><span aria-hidden="true">●</span> Sessão protegida e expiração automática</div>
      </section>
      <footer class="credit">Desenvolvido por Wagner Brammer - 2026</footer>
    </main>
  </body>
</html>`;
};