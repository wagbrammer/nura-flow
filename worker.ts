import {
  clearSessionCookie,
  createSessionCookie,
  getAuthConfig,
  hasValidSession,
  renderLoginPage,
  verifyPassword,
} from './auth';

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetsBinding;
  ROBUSTEC_AUTH_USER?: string;
  ROBUSTEC_AUTH_PASSWORD_HASH?: string;
  ROBUSTEC_AUTH_SESSION_SECRET?: string;
}

type JsonRecord = Record<string, unknown>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const html = (body: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });

async function readJson(request: Request): Promise<JsonRecord> {
  try {
    return await request.json() as JsonRecord;
  } catch {
    return {};
  }
}

function asList(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object') : [];
}

async function handleApi(request: Request, pathname: string): Promise<Response> {
  if (pathname === '/api/health' && request.method === 'GET') {
    return json({ status: 'ok', service: 'NuRa Flow Sites', mode: 'local', timestamp: new Date().toISOString() });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Método não permitido.' }, 405);
  }

  const body = await readJson(request);

  if (pathname === '/api/gemini/chat') {
    const context = body.context && typeof body.context === 'object' ? body.context as JsonRecord : {};
    const tasks = asList(context.tasks);
    const meetings = asList(context.meetings);
    const openTasks = tasks.filter((task) => task.status !== 'done');
    const highPriority = openTasks.filter((task) => task.priority === 'urgent' || task.priority === 'high');
    const message = typeof body.message === 'string' ? body.message : '';

    return json({
      mode: 'local',
      reply: `Modo local: encontrei ${openTasks.length} tarefa(s) aberta(s), ${highPriority.length} de alta prioridade e ${meetings.length} reunião(ões) no contexto atual. Sua pergunta foi: “${message}”. A análise generativa requer a integração Gemini no servidor local.`,
    });
  }

  if (pathname === '/api/gemini/summarize-meeting') {
    const title = typeof body.meetingTitle === 'string' ? body.meetingTitle : 'Reunião';
    const date = typeof body.meetingDate === 'string' ? body.meetingDate : 'data não informada';
    const agenda = typeof body.agenda === 'string' ? body.agenda : '';
    const notes = typeof body.notes === 'string' ? body.notes : Array.isArray(body.notes) ? body.notes.join('\n') : '';
    const transcripts = typeof body.transcripts === 'string' ? body.transcripts : Array.isArray(body.transcripts) ? body.transcripts.join('\n') : '';
    const sourceNotes = [notes, transcripts].filter(Boolean).join('\n\n').trim();

    return json({
      mode: 'local',
      summary: sourceNotes || `Reunião “${title}” em ${date}. Pauta registrada: ${agenda || 'não informada'}.`,
      decisions: [],
      pendingQuestions: [],
      suggestedTasks: [],
      keyTopics: [title, agenda].filter(Boolean).slice(0, 2),
      actionItemsCaptured: typeof body.actionItemsCaptured === 'string' ? body.actionItemsCaptured : '',
    });
  }

  if (pathname === '/api/gemini/transcribe') {
    if (!body.audioBase64) {
      return json({ error: 'Nenhum áudio foi enviado para transcrição.' }, 400);
    }
    return json({ error: 'Transcrição por IA não está habilitada na versão publicada.' }, 503);
  }

  if (pathname === '/api/gemini/context-action') {
    const actionType = typeof body.actionType === 'string' ? body.actionType : '';
    const content = typeof body.content === 'string' ? body.content : '';

    if (actionType === 'transcribe_handwriting') {
      return json({ error: 'Leitura de manuscrito por IA não está habilitada na versão publicada.' }, 503);
    }
    if (actionType === 'extract_tasks') {
      const tasks = content
        .split(/\r?\n|[.;]/)
        .map((item) => item.replace(/^[-*\d.)\s]+/, '').trim())
        .filter((item) => item.length >= 6)
        .slice(0, 8)
        .map((title) => ({ title, priority: 'medium', assignee: 'A definir' }));
      return json({ mode: 'local', tasks });
    }
    if (actionType === 'daily_briefing') {
      return json({ mode: 'local', result: `Briefing local: ${content || 'não há informações suficientes para gerar o resumo do dia.'}` });
    }
    return json({ mode: 'local', result: content ? `### Conteúdo organizado localmente\n\n${content}` : 'Nenhum conteúdo foi informado.' });
  }

  return json({ error: 'Rota não encontrada.' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const authConfig = getAuthConfig(env as unknown as Record<string, unknown>);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return handleApi(request, url.pathname);
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return new Response(null, {
        status: 303,
        headers: { location: '/', 'set-cookie': clearSessionCookie(), 'cache-control': 'no-store' },
      });
    }

    if (!authConfig) {
      if (url.pathname.startsWith('/api/')) return json({ error: 'Acesso protegido não configurado.' }, 503);
      return html(renderLoginPage(false, true), 503);
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      const form = await request.formData();
      const username = String(form.get('username') || '');
      const password = String(form.get('password') || '');
      const validUsername = username === authConfig.username;
      const validPassword = await verifyPassword(password, authConfig.passwordHash);

      if (!validUsername || !validPassword) {
        await new Promise((resolve) => setTimeout(resolve, 550));
        return html(renderLoginPage(true), 401);
      }

      return new Response(null, {
        status: 303,
        headers: {
          location: '/',
          'set-cookie': await createSessionCookie(authConfig.username, authConfig.sessionSecret),
          'cache-control': 'no-store',
        },
      });
    }

    const authenticated = await hasValidSession(request.headers.get('cookie'), authConfig);
    if (!authenticated) {
      if (url.pathname.startsWith('/api/')) return json({ error: 'Autenticação necessária.' }, 401);
      if (request.method === 'GET') return html(renderLoginPage());
      return json({ error: 'Autenticação necessária.' }, 401);
    }

    if (url.pathname === '/api/auth/session' && request.method === 'GET') {
      return json({ authenticated: true, username: authConfig.username });
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, url.pathname);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') {
      return response;
    }

    return env.ASSETS.fetch(new Request(new URL('/', url).toString(), {
      method: 'GET',
      headers: request.headers,
    }));
  },
};
