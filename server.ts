import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { google, Auth, calendar_v3 } from "googleapis";
import dotenv from "dotenv";
import type { PomodoroState } from "./src/types";
import {
  clearSessionCookie,
  createSessionCookie,
  getAuthConfig,
  hasValidSession,
  renderLoginPage,
  verifyPassword,
  SKIP_AUTH_BYPASS,
} from "./auth";
import {
  meetingsStore,
  tasksStore,
  notesStore,
  projectsStore,
  tagsStore,
  eventsStore,
  emailsStore,
  driveFilesStore,
  usefulLinksStore,
  inboxStore,
  activityLogsStore,
  notificationsStore,
  chatMessagesStore
} from "./server/data-store-db";
import { initializeDatabase } from "./server/db";

// Carregar configuração da logo do servidor
const logoConfigPath = path.join(process.cwd(), 'logo-config.json');
let serverLogoConfig = { logoUrl: '' };
if (fs.existsSync(logoConfigPath)) {
  try {
    serverLogoConfig = JSON.parse(fs.readFileSync(logoConfigPath, 'utf8'));
  } catch (e) {
    console.error('Erro ao carregar config da logo:', e);
  }
}

// Carregar configuração do weather do servidor (lista de cidades)
const weatherConfigPath = path.join(process.cwd(), 'weather-config.json');
let serverWeatherLocations: { id: string; latitude: number; longitude: number; cityName: string }[] = [
  { id: 'default_1', latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' }
];
if (fs.existsSync(weatherConfigPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(weatherConfigPath, 'utf8'));
    // Validar formato de array de cidades
    if (Array.isArray(data)) {
      const validLocations = data.filter((loc: any) =>
        typeof loc.latitude === 'number' &&
        typeof loc.longitude === 'number' &&
        typeof loc.cityName === 'string' &&
        loc.latitude >= -90 && loc.latitude <= 90 &&
        loc.longitude >= -180 && loc.longitude <= 180
      );
      if (validLocations.length > 0) {
        serverWeatherLocations = validLocations.map((loc, index) => ({
          id: loc.id || `city_${index + 1}`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          cityName: loc.cityName
        }));
      } else {
        console.warn('Nenhuma localização válida encontrada no weather-config.json, usando padrão');
      }
    } else {
      console.warn('weather-config.json não contém um array, usando padrão');
    }
  } catch (e) {
    console.error('Erro ao carregar config do weather:', e);
  }
}

// Função auxiliar para salvar lista de cidades no arquivo
const saveWeatherLocations = () => {
  try {
    fs.writeFileSync(weatherConfigPath, JSON.stringify(serverWeatherLocations, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar config do weather:', e);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // SERVE STATIC ASSETS FIRST - CRITICAL FIX FOR WHITE SCREEN
  const distPath = path.join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(distPath)) {
    // Serve static assets but NOT the root path (which goes to login)
    app.use(express.static(distPath, {
      index: false // Disable automatic index.html serving
    }));
  }

  let pomodoro: PomodoroState = {
    phase: 'focus',
    durationMs: 25 * 60 * 1000,
    remainingMs: 25 * 60 * 1000,
    isRunning: false,
    sessionsCompletedToday: 0,
    sessions: [],
    totalFocusMinutesToday: 0,
    settings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      soundEnabled: true
    }
  };

  dotenv.config({ path: ".env.local" });
  dotenv.config();

  // Import Telegram bot after dotenv loads
  const {
    getTelegramToken,
    telegramSubscriptions,
    isTelegramConfigured,
    subscribeTelegram,
    unsubscribeTelegram,
    listTelegramSubscriptions,
    sendTelegramMessage,
    broadcastTelegramMessage,
    telegramTemplates
  } = await import("./telegram-bot");

  // Debug: confirmar que TELEGRAM_BOT_TOKEN foi carregado
  console.log(`Telegram: ${getTelegramToken() ? '✅ configurado' : '❌ NÃO configurado'} (token length: ${getTelegramToken().length})`);

  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const GEMINI_AUDIO_MODEL = process.env.GEMINI_AUDIO_MODEL || GEMINI_MODEL;

  // Google OAuth2 Client Setup
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

  let oauth2Client: Auth.OAuth2Client | null = null;
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  }

  // In-memory token storage (for single-user local dev)
  // In production, this should be persisted securely per user
  let storedTokens: { access_token?: string; refresh_token?: string; scope?: string; expiry_date?: number } | null = null;

  function getOAuthClient(): Auth.OAuth2Client | null {
    if (!oauth2Client) return null;
    const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    if (storedTokens) {
      client.setCredentials(storedTokens);
    }
    return client;
  }

  function isGoogleConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "NuRa Server", timestamp: new Date().toISOString() });
  });

  // ============================================
  // TELEGRAM BOT ENDPOINTS
  // ============================================

  // Status/configuração do Telegram
  app.get("/api/telegram/status", async (req, res) => {
    let botUsername: string | null = null;
    if (isTelegramConfigured()) {
      try {
        const { getTelegramApi } = await import("./telegram-bot");
        const response = await fetch(`${getTelegramApi()}/getMe`);
        const data = await response.json();
        if (data.ok && data.result?.username) {
          botUsername = data.result.username;
        }
      } catch (err) {
        console.error('Erro ao obter username do bot:', err);
      }
    }
    res.json({
      configured: isTelegramConfigured(),
      subscribersCount: listTelegramSubscriptions().length,
      botUsername
    });
  });

  // Webhook para receber mensagens do Telegram
  app.post("/api/telegram/webhook", async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({ error: "Telegram não configurado" });
    }

    try {
      const update = req.body;

      // Processar mensagem recebida
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id.toString();
        const text = (message.text || '').trim();
        const firstName = message.from?.first_name;
        const username = message.from?.username;

        console.log(`Telegram message from ${chatId}: ${text}`);

        // Responder baseado no comando
        if (text === '/start' || text === '/notificar') {
          subscribeTelegram(chatId, { username, firstName });
          await sendTelegramMessage(chatId, telegramTemplates.boasVindas(firstName));
        } else if (text === '/parar' || text === '/stop') {
          unsubscribeTelegram(chatId);
          await sendTelegramMessage(chatId, '🔕 Notificações desativadas. Envie /start para reativar.');
        } else if (text === '/status') {
          const isSubscribed = !!telegramSubscriptions[chatId] && telegramSubscriptions[chatId].enabled;
          if (isSubscribed) {
            const sub = telegramSubscriptions[chatId];
            const data = new Date(sub.subscribedAt);
            await sendTelegramMessage(chatId,
              `📊 <b>Seu status:</b>\n` +
              `✅ Ativo desde ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}\n` +
              `📬 Você receberá: briefings diários, lembretes de reuniões e alertas de tarefas`
            );
          } else {
            await sendTelegramMessage(chatId,
              `📭 Você não está inscrito. Envie /start para ativar as notificações.\n` +
              `Use /help para ver todos os comandos disponíveis.`
            );
          }
        } else if (text === '/help' || text === '/ajuda') {
          await sendTelegramMessage(chatId, telegramTemplates.help());
        } else if (text.startsWith('/')) {
          await sendTelegramMessage(chatId, '❓ Comando não reconhecido. Envie /help para ver os comandos.');
        } else if (text) {
          // Mensagem genérica
          await sendTelegramMessage(chatId, `Recebi sua mensagem: "${text}"\n\nEnvie /help para ver os comandos.`);
        }
      }

      res.json({ ok: true });
    } catch (e) {
      console.error('Erro no webhook Telegram:', e);
      res.status(500).json({ error: String(e) });
    }
  });

  // Registrar webhook automaticamente (chamado ao iniciar)
  async function setupTelegramWebhook() {
    if (!isTelegramConfigured()) return;

    const { getTelegramApi } = await import("./telegram-bot");
    const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/telegram/webhook`;

    try {
      const response = await fetch(`${getTelegramApi()}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      const data = await response.json();
      if (data.ok) {
        console.log(`✅ Telegram webhook registrado: ${webhookUrl}`);
      } else {
        console.warn(`⚠️ Telegram webhook falhou: ${data.description}`);
      }
    } catch (e) {
      console.error('Erro ao registrar webhook Telegram:', e);
    }
  }

  const telegramAuthConfig = getAuthConfig(process.env);

  // Endpoint para testar envio (admin)
  app.post("/api/telegram/test", async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({ error: "Telegram não configurado" });
    }
    if (telegramAuthConfig && !(await hasValidSession(req.headers.cookie, telegramAuthConfig))) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: "chatId e message são obrigatórios" });
    }

    const success = await sendTelegramMessage(chatId, message);
    res.json({ success });
  });

  // Endpoint para listar subscribers (admin)
  app.get("/api/telegram/subscribers", async (req, res) => {
    if (telegramAuthConfig && !(await hasValidSession(req.headers.cookie, telegramAuthConfig))) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    res.json({ subscribers: listTelegramSubscriptions() });
  });

  // Endpoint para remover subscriber (admin)
  app.post("/api/telegram/unsubscribe", async (req, res) => {
    if (telegramAuthConfig && !(await hasValidSession(req.headers.cookie, telegramAuthConfig))) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: "chatId é obrigatório" });
    }
    unsubscribeTelegram(chatId);
    res.json({ success: true });
  });

  // Endpoint para enviar lembrete de reunião próxima
  app.post("/api/telegram/reuniao-proxima", async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({ error: "Telegram não configurado" });
    }
    // Optionally check auth if we want to restrict to authenticated users
    // if (!hasValidSession(req)) {
    //   return res.status(401).json({ error: "Não autenticado" });
    // }
    const { titulo } = req.body;
    if (!titulo) {
      return res.status(400).json({ error: "titulo é obrigatório" });
    }
    const message = telegramTemplates.reuniaoProxima(titulo, 5); // 5 minutes
    const result = await broadcastTelegramMessage(message);
    res.json(result);
  });

  // Endpoint para enviar alerta de tarefa atrasada
  app.post("/api/telegram/tarefa-atrasada", async (req, res) => {
    if (!isTelegramConfigured()) {
      return res.status(503).json({ error: "Telegram não configurado" });
    }
    // Optionally check auth
    // if (!hasValidSession(req)) {
    //   return res.status(401).json({ error: "Não autenticado" });
    // }
    const { titulo } = req.body;
    if (!titulo) {
      return res.status(400).json({ error: "titulo é obrigatório" });
    }
    const message = telegramTemplates.tarefaAtrasada(titulo);
    const result = await broadcastTelegramMessage(message);
    res.json(result);
  });

  // Endpoint para enviar briefing (chamado após gerar briefing)
  app.post("/api/telegram/broadcast-briefing", async (req, res) => {
    if (telegramAuthConfig && !(await hasValidSession(req.headers.cookie, telegramAuthConfig))) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { briefingText, tarefasUrgentes, proximaReuniao } = req.body;
    if (!briefingText) {
      return res.status(400).json({ error: "briefingText é obrigatório" });
    }

    const message = telegramTemplates.briefingDiario(
      briefingText,
      tarefasUrgentes || 0,
      proximaReuniao
    );

    const result = await broadcastTelegramMessage(message);
    res.json(result);
  });

  // ============================================
  // CRUD API Endpoints for Data Synchronization
  // ============================================

  // Helper middleware to require authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    if (telegramAuthConfig && !(await hasValidSession(req.headers.cookie, telegramAuthConfig))) {
      return res.status(401).json({ error: "Autenticação necessária" });
    }
    next();
  };

  // Meetings CRUD
  app.get("/api/meetings", requireAuth, async (req, res) => {
    const meetings = await meetingsStore.getAll();
    res.json({ meetings });
  });

  app.get("/api/meetings/:id", requireAuth, async (req, res) => {
    const meeting = await meetingsStore.getById(req.params.id);
    if (!meeting) return res.status(404).json({ error: "Reunião não encontrada" });
    res.json(meeting);
  });

  app.post("/api/meetings", requireAuth, async (req, res) => {
    const meeting = req.body;
    if (!meeting.id) meeting.id = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!meeting.createdAt) meeting.createdAt = new Date().toISOString();
    meeting.updatedAt = new Date().toISOString();
    await meetingsStore.create(meeting);
    res.status(201).json(meeting);
  });

  app.put("/api/meetings/:id", requireAuth, async (req, res) => {
    const updated = await meetingsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Reunião não encontrada" });
    res.json(updated);
  });

  app.delete("/api/meetings/:id", requireAuth, async (req, res) => {
    const deleted = await meetingsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Reunião não encontrada" });
    res.json({ success: true });
  });

  // Tasks CRUD
  app.get("/api/tasks", requireAuth, async (req, res) => {
    const tasks = await tasksStore.getAll();
    res.json({ tasks });
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    const task = await tasksStore.getById(req.params.id);
    if (!task) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json(task);
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    const task = req.body;
    if (!task.id) task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!task.createdAt) task.createdAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    await tasksStore.create(task);
    res.status(201).json(task);
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    const updated = await tasksStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json(updated);
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    const deleted = await tasksStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json({ success: true });
  });

  // Notes CRUD
  app.get("/api/notes", requireAuth, async (req, res) => {
    const notes = await notesStore.getAll();
    res.json({ notes });
  });

  app.post("/api/notes", requireAuth, async (req, res) => {
    const note = req.body;
    if (!note.id) note.id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!note.createdAt) note.createdAt = new Date().toISOString();
    note.updatedAt = new Date().toISOString();
    await notesStore.create(note);
    res.status(201).json(note);
  });

  app.put("/api/notes/:id", requireAuth, async (req, res) => {
    const updated = await notesStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Nota não encontrada" });
    res.json(updated);
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    const deleted = await notesStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Nota não encontrada" });
    res.json({ success: true });
  });

  // Projects CRUD
  app.get("/api/projects", requireAuth, async (req, res) => {
    const projects = await projectsStore.getAll();
    res.json({ projects });
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    const project = req.body;
    if (!project.id) project.id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!project.createdAt) project.createdAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    await projectsStore.create(project);
    res.status(201).json(project);
  });

  app.put("/api/projects/:id", requireAuth, async (req, res) => {
    const updated = await projectsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json(updated);
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    const deleted = await projectsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json({ success: true });
  });

  // Tags CRUD
  app.get("/api/tags", requireAuth, async (req, res) => {
    const tags = await tagsStore.getAll();
    res.json({ tags });
  });

  app.post("/api/tags", requireAuth, async (req, res) => {
    const tag = req.body;
    if (!tag.id) tag.id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!tag.createdAt) tag.createdAt = new Date().toISOString();
    await tagsStore.create(tag);
    res.status(201).json(tag);
  });

  app.put("/api/tags/:id", requireAuth, async (req, res) => {
    const updated = await tagsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Tag não encontrada" });
    res.json(updated);
  });

  app.delete("/api/tags/:id", requireAuth, async (req, res) => {
    const deleted = await tagsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Tag não encontrada" });
    res.json({ success: true });
  });

  // Events (Calendar) CRUD
  app.get("/api/events", requireAuth, async (req, res) => {
    const events = await eventsStore.getAll();
    res.json({ events });
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    const event = req.body;
    if (!event.id) event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!event.createdAt) event.createdAt = new Date().toISOString();
    event.updatedAt = new Date().toISOString();
    await eventsStore.create(event);
    res.status(201).json(event);
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    const updated = await eventsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Evento não encontrado" });
    res.json(updated);
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    const deleted = await eventsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Evento não encontrado" });
    res.json({ success: true });
  });

  // Emails CRUD
  app.get("/api/emails", requireAuth, async (req, res) => {
    const emails = await emailsStore.getAll();
    res.json({ emails });
  });

  app.post("/api/emails", requireAuth, async (req, res) => {
    const email = req.body;
    if (!email.id) email.id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!email.createdAt) email.createdAt = new Date().toISOString();
    email.updatedAt = new Date().toISOString();
    await emailsStore.create(email);
    res.status(201).json(email);
  });

  app.put("/api/emails/:id", requireAuth, async (req, res) => {
    const updated = await emailsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Email não encontrado" });
    res.json(updated);
  });

  app.delete("/api/emails/:id", requireAuth, async (req, res) => {
    const deleted = await emailsStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Email não encontrado" });
    res.json({ success: true });
  });

  // Drive Files CRUD
  app.get("/api/drive-files", requireAuth, async (req, res) => {
    const files = await driveFilesStore.getAll();
    res.json({ files });
  });

  app.post("/api/drive-files", requireAuth, async (req, res) => {
    const file = req.body;
    if (!file.id) file.id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!file.createdAt) file.createdAt = new Date().toISOString();
    file.updatedAt = new Date().toISOString();
    await driveFilesStore.create(file);
    res.status(201).json(file);
  });

  app.put("/api/drive-files/:id", requireAuth, async (req, res) => {
    const updated = await driveFilesStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Arquivo não encontrado" });
    res.json(updated);
  });

  app.delete("/api/drive-files/:id", requireAuth, async (req, res) => {
    const deleted = await driveFilesStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Arquivo não encontrado" });
    res.json({ success: true });
  });

  // Useful Links CRUD
  app.get("/api/useful-links", requireAuth, async (req, res) => {
    const links = await usefulLinksStore.getAll();
    res.json({ links });
  });

  app.post("/api/useful-links", requireAuth, async (req, res) => {
    const link = req.body;
    if (!link.id) link.id = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!link.createdAt) link.createdAt = new Date().toISOString();
    link.updatedAt = new Date().toISOString();
    await usefulLinksStore.create(link);
    res.status(201).json(link);
  });

  app.put("/api/useful-links/:id", requireAuth, async (req, res) => {
    const updated = await usefulLinksStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Link não encontrado" });
    res.json(updated);
  });

  app.delete("/api/useful-links/:id", requireAuth, async (req, res) => {
    const deleted = await usefulLinksStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Link não encontrado" });
    res.json({ success: true });
  });

  // Inbox CRUD
  app.get("/api/inbox", requireAuth, async (req, res) => {
    const items = await inboxStore.getAll();
    res.json({ items });
  });

  app.post("/api/inbox", requireAuth, async (req, res) => {
    const item = req.body;
    if (!item.id) item.id = `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    await inboxStore.create(item);
    res.status(201).json(item);
  });

  app.put("/api/inbox/:id", requireAuth, async (req, res) => {
    const updated = await inboxStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Item não encontrado" });
    res.json(updated);
  });

  app.delete("/api/inbox/:id", requireAuth, async (req, res) => {
    const deleted = await inboxStore.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Item não encontrado" });
    res.json({ success: true });
  });

  // Activity Logs CRUD
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    const logs = await activityLogsStore.getAll();
    res.json({ logs });
  });

  app.post("/api/activity-logs", requireAuth, async (req, res) => {
    const log = req.body;
    if (!log.id) log.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!log.createdAt) log.createdAt = new Date().toISOString();
    await activityLogsStore.create(log);
    res.status(201).json(log);
  });

  // Notifications CRUD
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await notificationsStore.getAll();
    res.json({ notifications });
  });

  app.put("/api/notifications/:id", requireAuth, async (req, res) => {
    const updated = await notificationsStore.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Notificação não encontrada" });
    res.json(updated);
  });

  // Chat Messages CRUD
  app.get("/api/chat-messages", requireAuth, async (req, res) => {
    const messages = await chatMessagesStore.getAll();
    res.json({ messages });
  });

  app.post("/api/chat-messages", requireAuth, async (req, res) => {
    const message = req.body;
    if (!message.id) message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!message.createdAt) message.createdAt = new Date().toISOString();
    await chatMessagesStore.create(message);
    res.status(201).json(message);
  });

  // Initialize database tables on startup
  try {
    await initializeDatabase();
    console.log('[DB] Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('[DB] Erro ao inicializar banco de dados:', error);
  }
    res.setHeader("Set-Cookie", clearSessionCookie());
    res.redirect(303, "/");
  });

  // Google OAuth Routes
  app.get("/api/auth/google", (req, res) => {
    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: "Google OAuth não configurado. Adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env" });
    }
    const client = getOAuthClient();
    if (!client) return res.status(503).json({ error: "Cliente OAuth não inicializado" });

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: 'nura_calendar'
    });
    res.redirect(authUrl);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    if (!isGoogleConfigured()) {
      return res.status(503).send("Google OAuth não configurado no servidor.");
    }
    const client = getOAuthClient();
    if (!client) return res.status(503).send("Cliente OAuth não inicializado");

    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Código de autorização não recebido.");
    }

    try {
      const { tokens } = await client.getToken(code as string);
      storedTokens = tokens;
      client.setCredentials(tokens);
      console.log("Google tokens salvos com sucesso!");
      res.redirect("/settings?google=connected");
    } catch (error: any) {
      console.error("Erro ao trocar código por token:", error);
      res.status(500).send("Erro ao autenticar com o Google: " + error.message);
    }
  });

  app.get("/api/auth/google/status", async (req, res) => {
    if (!isGoogleConfigured()) {
      return res.json({ configured: false, connected: false, message: "Credenciais não configuradas no .env" });
    }
    const client = getOAuthClient();
    if (!client || !storedTokens?.access_token) {
      return res.json({ configured: true, connected: false, message: "Não conectado ao Google" });
    }

    // Check if token is expired
    const isExpired = storedTokens.expiry_date && storedTokens.expiry_date < Date.now();
    if (isExpired && storedTokens.refresh_token) {
      try {
        const { credentials } = await client.refreshAccessToken();
        storedTokens = { ...storedTokens, ...credentials };
        client.setCredentials(storedTokens);
      } catch (e) {
        return res.json({ configured: true, connected: false, message: "Token expirado, reconexão necessária" });
      }
    }

    res.json({ configured: true, connected: true, message: "Conectado ao Google" });
  });

  app.post("/api/auth/google/disconnect", async (req, res) => {
    storedTokens = null;
    res.json({ success: true, message: "Desconectado do Google" });
  });

  // Save Google Config to .env
  app.post("/api/settings/google-config", async (req, res) => {
    const { clientId, clientSecret } = req.body;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: "Client ID e Client Secret são obrigatórios." });
    }

    try {
      const envPath = path.join(process.cwd(), ".env");
      let envContent = "";

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }

      // Replace or Add GOOGLE_CLIENT_ID
      if (envContent.includes("GOOGLE_CLIENT_ID=")) {
        envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*(\r?\n|$)/, `GOOGLE_CLIENT_ID="${clientId}"\n`);
      } else {
        envContent += `\nGOOGLE_CLIENT_ID="${clientId}"`;
      }

      // Replace or Add GOOGLE_CLIENT_SECRET
      if (envContent.includes("GOOGLE_CLIENT_SECRET=")) {
        envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*(\r?\n|$)/, `GOOGLE_CLIENT_SECRET="${clientSecret}"\n`);
      } else {
        envContent += `\nGOOGLE_CLIENT_SECRET="${clientSecret}"`;
      }

      fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");

      res.json({
        success: true,
        message: "Configurações salvas no .env com sucesso! Reinicie o servidor para aplicar."
      });
    } catch (error: any) {
      console.error("Erro ao salvar .env:", error);
      res.status(500).json({ error: "Erro ao salvar as configurações: " + error.message });
    }
  });

  // Save Gemini API Key to .env
  app.post("/api/settings/gemini-config", async (req, res) => {
    const { apiKey, model } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API Key é obrigatória." });
    }

    try {
      const envPath = path.join(process.cwd(), ".env");
      let envContent = "";

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }

      // Replace or Add GEMINI_API_KEY
      if (envContent.includes("GEMINI_API_KEY=")) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*(\r?\n|$)/, `GEMINI_API_KEY="${apiKey}"\n`);
      } else {
        envContent += `\nGEMINI_API_KEY="${apiKey}"`;
      }

      // Replace or Add GEMINI_MODEL
      if (model && model !== "gemini-2.5-flash") {
        if (envContent.includes("GEMINI_MODEL=")) {
          envContent = envContent.replace(/GEMINI_MODEL=.*(\r?\n|$)/, `GEMINI_MODEL="${model}"\n`);
        } else {
          envContent += `\nGEMINI_MODEL="${model}"`;
        }
      }

      fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");

      res.json({
        success: true,
        message: "Configurações da IA salvas no .env com sucesso! Reinicie o servidor para aplicar."
      });
    } catch (error: any) {
      console.error("Erro ao salvar .env:", error);
      res.status(500).json({ error: "Erro ao salvar as configurações: " + error.message });
    }
  });

  // Get Gemini config status (without exposing the key)
  app.get("/api/settings/gemini-status", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    res.json({
      configured: !!apiKey,
      model,
      hasKey: !!apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey.length > 10
    });
  });

  // Get current logo URL from server config
  app.get("/api/settings/logo", async (req, res) => {
    res.json({
      logoUrl: serverLogoConfig.logoUrl || ''
    });
  });

  // Upload Logo Endpoint
  app.post("/api/settings/upload-logo", async (req, res) => {
    try {
      const { imageData, filename } = req.body;

      if (!imageData) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
      }

      // Clean base64 header if present
      const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');

      // Validate base64
      if (!cleanBase64 || cleanBase64.length === 0) {
        return res.status(400).json({ error: "Dados de imagem inválidos." });
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = filename?.split('.').pop() || 'png';
      const uniqueFilename = `logo_${timestamp}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Write file
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));

      // Salvar a URL da logo no config para uso na página de login
      serverLogoConfig.logoUrl = `/uploads/${uniqueFilename}`;
      fs.writeFileSync(logoConfigPath, JSON.stringify(serverLogoConfig, null, 2), 'utf8');

      res.json({
        success: true,
        url: serverLogoConfig.logoUrl
      });
    } catch (error: any) {
      console.error("Erro ao salvar logo:", error);
      res.status(500).json({ error: "Erro ao salvar a logo: " + error.message });
    }
  });

  // Get current weather location (first in list) for backward compatibility
  app.get("/api/settings/weather-location", async (req, res) => {
    const defaultLoc = serverWeatherLocations[0] || { latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
    res.json({
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      cityName: defaultLoc.cityName || ''
    });
  });

  // Google Calendar Events Endpoint
  app.get("/api/google/calendar/events", async (req, res) => {
    try {
      if (!isGoogleConfigured()) {
        return res.status(503).json({ error: "Google OAuth não configurado" });
      }
      const client = getOAuthClient();
      if (!client || !storedTokens?.access_token) {
        return res.status(401).json({ error: "Não autenticado no Google. Conecte primeiro." });
      }

      const calendar = google.calendar({ version: 'v3', auth: client });
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); // Start of current month
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString(); // End of next month

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const formattedEvents = events.map(event => ({
        id: `gcal_${event.id}`,
        calendarId: 'google_primary',
        title: event.summary || '(Sem título)',
        description: event.description || '',
        startDate: event.start?.dateTime ? event.start.dateTime.split('T')[0] : event.start?.date,
        startTime: event.start?.dateTime ? event.start.dateTime.split('T')[1].substring(0, 5) : '00:00',
        endDate: event.end?.dateTime ? event.end.dateTime.split('T')[0] : event.end?.date,
        endTime: event.end?.dateTime ? event.end.dateTime.split('T')[1].substring(0, 5) : '00:00',
        location: event.location || '',
        meetUrl: event.hangoutLink || '',
        color: event.colorId ? getCalendarColor(event.colorId) : '#3b82f6',
        participants: event.attendees?.map(a => ({ name: a.displayName || a.email, email: a.email, status: a.responseStatus })) || [],
        tags: [],
        meetingId: null,
        googleEventId: event.id,
        isGoogleEvent: true
      }));

      res.json({ events: formattedEvents });
    } catch (error: any) {
      console.error("Erro ao buscar eventos do Google Calendar:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar eventos" });
    }
  });

  // Helper to map Google Calendar color IDs to hex colors
  function getCalendarColor(colorId: string): string {
    const colors: Record<string, string> = {
      '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
      '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
      '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
    };
    return colors[colorId] || '#3b82f6';
  }

  // Pomodoro state management moved to proper middleware
  app.post("/api/auth/login", async (req, res) => {
    const authConfig = getAuthConfig(process.env);
    if (!authConfig) {
      return res.status(503)
        .set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        .set("Pragma", "no-cache")
        .set("Expires", "0")
        .send(renderLoginPage(false, true, serverLogoConfig.logoUrl));
    }

    const username = String(req.body.username || "");
    const password = String(req.body.password || "");
    const validUsername = username === authConfig.username;
    const validPassword = await verifyPassword(password, authConfig.passwordHash);
    if (!validUsername || !validPassword) {
      await new Promise((resolve) => setTimeout(resolve, 550));
      return res.status(401)
        .set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        .set("Pragma", "no-cache")
        .set("Expires", "0")
        .send(renderLoginPage(true, false, serverLogoConfig.logoUrl));
    }

    const cookie = await createSessionCookie(authConfig.username, authConfig.sessionSecret);
    res.setHeader("Set-Cookie", cookie);
    // Also set cache-control on redirect to be safe
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.redirect(303, "/");
  });

  app.use(async (req, res, next) => {
    // Allow static assets without authentication
    const isStaticAsset =
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/) ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/static/');
    if (isStaticAsset) return next();

    // Bypass authentication for public Pomodoro API endpoints
    if (req.path.startsWith("/api/pomodoro")) {
      if (req.path === "/api/pomodoro/state" && req.method === "GET") {
        return res.json({ pomodoro: pomodoro });
      }
      if (req.path === "/api/pomodoro/state" && req.method === "POST") {
        const body = req.body as Partial<PomodoroState>;
        if (body.phase !== undefined) pomodoro.phase = body.phase;
        if (body.isRunning !== undefined) pomodoro.isRunning = body.isRunning;
        if (body.remainingMs !== undefined) pomodoro.remainingMs = body.remainingMs;
        if (body.durationMs !== undefined) pomodoro.durationMs = body.durationMs;
        if (body.sessionsCompletedToday !== undefined) pomodoro.sessionsCompletedToday = body.sessionsCompletedToday;
        if (body.sessions !== undefined) pomodoro.sessions = body.sessions;
        if (body.totalFocusMinutesToday !== undefined) pomodoro.totalFocusMinutesToday = body.totalFocusMinutesToday;
        if (body.settings) pomodoro.settings = { ...pomodoro.settings, ...body.settings };
        return res.json({ pomodoro: pomodoro });
      }
      if (req.path === "/api/pomodoro/sync" && req.method === "POST") {
        const body = req.body as Partial<PomodoroState>;
        if (body.phase !== undefined) pomodoro.phase = body.phase;
        if (body.isRunning !== undefined) pomodoro.isRunning = body.isRunning;
        if (body.remainingMs !== undefined) pomodoro.remainingMs = body.remainingMs;
        if (body.durationMs !== undefined) pomodoro.durationMs = body.durationMs;
        if (body.sessionsCompletedToday !== undefined) pomodoro.sessionsCompletedToday = body.sessionsCompletedToday;
        if (body.sessions !== undefined) pomodoro.sessions = body.sessions;
        if (body.totalFocusMinutesToday !== undefined) pomodoro.totalFocusMinutesToday = body.totalFocusMinutesToday;
        if (body.settings) pomodoro.settings = { ...pomodoro.settings, ...body.settings };
        return res.json({ pomodoro: pomodoro });
      }
      return next();
    }

    const authConfig = getAuthConfig(process.env);
    if (!authConfig) {
      if (req.path.startsWith("/api/")) return res.status(503).json({ error: "Acesso protegido não configurado." });
      return res.status(503).set("Cache-Control", "no-store").send(renderLoginPage(false, true, serverLogoConfig.logoUrl));
    }

    if (!await hasValidSession(req.headers.cookie, authConfig)) {
      if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Autenticação necessária." });
      if (req.method === "GET") return res.status(200).set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate").set("Pragma", "no-cache").set("Expires", "0").send(renderLoginPage(false, false, serverLogoConfig.logoUrl));
      return res.status(401).json({ error: "Autenticação necessária." });
    }

    if (req.path === "/api/auth/session" && req.method === "GET") {
      return res.json({ authenticated: true, username: authConfig.username });
    }

    next();
  });

  // AI Meeting Summarizer Endpoint
  app.post("/api/gemini/summarize-meeting", async (req, res) => {
    try {
      const { meetingTitle, meetingDate, participants, agenda, notes, transcripts, actionItemsCaptured } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const sourceNotes = [notes, transcripts].filter(Boolean).join("\n\n").trim();
        return res.json({
          mode: "local",
          summary: sourceNotes || `Reunião "${meetingTitle}" em ${meetingDate}. Pauta registrada: ${agenda || "não informada"}.`,
          decisions: [],
          pendingQuestions: [],
          suggestedTasks: [],
          keyTopics: [meetingTitle, agenda].filter(Boolean).slice(0, 2),
          actionItemsCaptured: actionItemsCaptured || ""
        });
      }

      const prompt = `Você é o assistente inteligente executivo do NuRa Flow, responsável por analisar reuniões de negócios e gerar sínteses de alta precisão.
Analise os dados desta reunião:
Título: ${meetingTitle}
Data: ${meetingDate}
Participantes: ${JSON.stringify(participants || [])}
Pauta: ${agenda || "Não informada"}
Anotações: ${JSON.stringify(notes || [])}
Transcrições de Áudio: ${JSON.stringify(transcripts || [])}

Retorne um JSON estruturado com:
- summary: Resumo executivo conciso e direto dos principais pontos discutidos (2 a 4 parágrafos)
- decisions: Lista de decisões firmadas e acordos estabelecidos
- pendingQuestions: Dúvidas, riscos ou pendências que ficaram em aberto
- suggestedTasks: Lista de tarefas sugeridas com { title: string, priority: "urgent" | "high" | "medium" | "low", assignee: string, dueDate: string (formato YYYY-MM-DD) }
- keyTopics: Lista de tópicos-chave abordados`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              decisions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              pendingQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    assignee: { type: Type.STRING },
                    dueDate: { type: Type.STRING }
                  },
                  required: ["title", "priority", "assignee", "dueDate"]
                }
              },
              keyTopics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "decisions", "pendingQuestions", "suggestedTasks", "keyTopics"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (error: any) {
      console.error("Error in summarize-meeting:", error);
      res.status(500).json({ error: error.message || "Erro ao processar reunião com IA" });
    }
  });

  // AI Productivity Assistant Chat Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const openTasks = Array.isArray(context?.tasks)
          ? context.tasks.filter((task: any) => task.status !== "done")
          : [];
        const highPriority = openTasks.filter((task: any) => ["urgent", "high"].includes(task.priority));
        const nextMeetings = Array.isArray(context?.meetings) ? context.meetings : [];
        return res.json({
          mode: "local",
          reply: `Modo local: encontrei ${openTasks.length} tarefa(s) aberta(s), ${highPriority.length} de alta prioridade e ${nextMeetings.length} reunião(ões) no contexto atual. Sua pergunta foi: “${message}”. Configure a chave Gemini para uma análise conversacional completa.`
        });
      }

      const systemInstruction = `Você é o Assistente Executivo de Inteligência do NuRa Flow para o usuário Wagner na empresa NuRa.
Sua missão é responder com clareza, objetividade, profissionalismo e foco em produtividade.
Você tem acesso ao contexto de trabalho atual do Wagner (reuniões, tarefas, notas, projetos como Implementos, Marketing e Planejamento 2027, e-mails e contatos).
Responda diretamente à dúvida do Wagner, destacando prazos, responsáveis, decisões anteriores e sugestões de ação.
Seja conciso, com formatação rica em markdown quando apropriado (listas, negrito, etc.).`;

      const contents = `Contexto operacional do usuário:
${JSON.stringify(context || {})}

Pergunta do Wagner:
${message}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Error in assistant chat:", error);
      res.status(500).json({ error: error.message || "Erro no assistente de IA" });
    }
  });

  // AI Audio Transcription Endpoint
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const ai = getGeminiClient();

      if (!audioBase64) {
        return res.status(400).json({ error: "Nenhum áudio foi enviado para transcrição." });
      }
      if (!ai) {
        return res.status(503).json({ error: "Transcrição por IA não configurada. Adicione GEMINI_API_KEY no servidor." });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_AUDIO_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: audioBase64
              }
            },
            {
              text: "Transcreva com exatidão o áudio em português e sintetize os tópicos principais e decisões em tópicos claros."
            }
          ]
        }
      });

      res.json({
        transcript: response.text || "Transcrição concluída.",
        actionItems: [],
        decisions: []
      });
    } catch (error: any) {
      console.error("Error in transcribe:", error);
      res.status(500).json({ error: error.message || "Não foi possível transcrever o áudio." });
    }
  });

  // AI Contextual Action (Improve Note, Extract Tasks, Make Action Plan)
  app.post("/api/gemini/context-action", async (req, res) => {
    try {
      const { actionType, content, context, imageBase64 } = req.body;
      const ai = getGeminiClient();

      if (actionType === "transcribe_handwriting") {
        if (!ai || !imageBase64) {
          return res.status(ai ? 400 : 503).json({
            error: ai ? "Nenhuma imagem foi enviada." : "Leitura de manuscrito por IA não configurada."
          });
        }

        // Clean base64 header if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: cleanBase64
                }
              },
              {
                text: "Transcreva fielmente todo o texto manuscrito ou diagramas contidos nesta imagem em português claro e bem estruturado. Se houver listas, setas ou tópicos, formate em markdown limpo."
              }
            ]
          }
        });

        return res.json({ text: response.text || "" });
      }

      if (!ai) {
        if (actionType === "daily_briefing") {
          return res.json({ mode: "local", result: `Briefing local: ${content || "não há informações suficientes para gerar o resumo do dia."}` });
        }
        if (actionType === "extract_tasks") {
          const tasks = String(content || "")
            .split(/\r?\n|[.;]/)
            .map((item: string) => item.replace(/^[-*\d.)\s]+/, "").trim())
            .filter((item: string) => item.length >= 6)
            .slice(0, 8)
            .map((title: string) => ({ title, priority: "medium", assignee: "A definir" }));
          return res.json({
            mode: "local",
            tasks
          });
        }
        return res.json({
          mode: "local",
          result: content ? `### Conteúdo organizado localmente\n\n${content}` : "Nenhum conteúdo foi informado."
        });
      }

      let prompt = "";
      if (actionType === "extract_tasks") {
        prompt = `Extraia todas as tarefas e ações acionáveis a partir deste texto:\n"${content}"\nRetorne um JSON com array de tarefas { title: string, priority: "urgent" | "high" | "medium" | "low", assignee: string }.`;
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      assignee: { type: Type.STRING }
                    },
                    required: ["title", "priority", "assignee"]
                  }
                }
              },
              required: ["tasks"]
            }
          }
        });
        return res.json(JSON.parse(response.text || "{\"tasks\":[]}"));
      } else if (actionType === "action_plan") {
        prompt = `Transforme o seguinte conteúdo em um plano de ação claro com etapas, responsáveis recomendados e prazos sugeridos:\n"${content}"`;
      } else if (actionType === "improve_notes") {
        prompt = `Melhore e organize as seguintes anotações mantendo todas as ideias originais mas com excelente estrutura de tópicos, clareza e destaque visual:\n"${content}"`;
      } else {
        prompt = `Resuma o seguinte texto de forma direta em tópicos essenciais:\n"${content}"`;
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      // Se for daily_briefing, enviar também via Telegram
      if (actionType === "daily_briefing" && response.text && isTelegramConfigured()) {
        try {
          const briefingMessage = telegramTemplates.briefingDiario(
            response.text,
            context?.urgentTasksCount || 0,
            context?.topMeeting
          );
          // Enviar em background (não bloqueia a resposta)
          broadcastTelegramMessage(briefingMessage).catch(err => {
            console.error('Erro no broadcast Telegram:', err);
          });
        } catch (err) {
          console.error('Erro ao preparar mensagem Telegram:', err);
        }
      }

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Error in context-action:", error);
      res.status(500).json({ error: error.message || "Erro na ação contextual com IA" });
    }
  });

  // Serve uploaded files (logos, etc.) - MUST BE FIRST to avoid catch-all route interception
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Weather Locations Endpoints (must be inside startServer after app is defined)
  // Get current weather location (first in list) for backward compatibility
  app.get("/api/settings/weather-location", async (req, res) => {
    const defaultLoc = serverWeatherLocations[0] || { latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
    res.json({
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      cityName: defaultLoc.cityName || ''
    });
  });

  // Get all weather locations
  app.get("/api/settings/weather-locations", async (req, res) => {
    res.json({ locations: serverWeatherLocations });
  });

  // Add a new weather location
  app.post("/api/settings/weather-locations", async (req, res) => {
    try {
      const { latitude, longitude, cityName } = req.body;

      // Validate input
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Latitude e longitude devem ser números válidos." });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Latitude deve estar entre -90 e 90, longitude entre -180 e 180." });
      }

      if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
        return res.status(400).json({ error: "Nome da cidade é obrigatório." });
      }

      const newLocation = {
        id: `city_${Date.now()}`,
        latitude,
        longitude,
        cityName: cityName.trim()
      };

      serverWeatherLocations.push(newLocation);
      saveWeatherLocations();

      res.json({
        success: true,
        location: newLocation
      });
    } catch (error: any) {
      console.error("Erro ao adicionar localização do weather:", error);
      res.status(500).json({ error: "Erro ao salvar a localização do weather: " + error.message });
    }
  });

  // Update a weather location by ID
  app.put("/api/settings/weather-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude, cityName } = req.body;

      // Validate input
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Latitude e longitude devem ser números válidos." });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Latitude deve estar entre -90 e 90, longitude entre -180 e 180." });
      }

      if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
        return res.status(400).json({ error: "Nome da cidade é obrigatório." });
      }

      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      serverWeatherLocations[index] = {
        id,
        latitude,
        longitude,
        cityName: cityName.trim()
      };

      saveWeatherLocations();

      res.json({
        success: true,
        location: serverWeatherLocations[index]
      });
    } catch (error: any) {
      console.error("Erro ao atualizar localização do weather:", error);
      res.status(500).json({ error: "Erro ao atualizar a localização do weather: " + error.message });
    }
  });

  // Delete a weather location by ID
  app.delete("/api/settings/weather-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      const removed = serverWeatherLocations.splice(index, 1)[0];
      saveWeatherLocations();

      res.json({
        success: true,
        message: `Localização "${removed.cityName}" removida com sucesso.`,
        remainingLocations: serverWeatherLocations.length
      });
    } catch (error: any) {
      console.error("Erro ao excluir localização do weather:", error);
      res.status(500).json({ error: "Erro ao excluir a localização do weather: " + error.message });
    }
  });

  // Set a weather location as default (by moving it to first position)
  app.post("/api/settings/weather-locations/:id/set-default", async (req, res) => {
    try {
      const { id } = req.params;
      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      const [defaultLoc] = serverWeatherLocations.splice(index, 1);
      serverWeatherLocations.unshift(defaultLoc);
      saveWeatherLocations();

      res.json({
        success: true,
        message: `Localização "${defaultLoc.cityName}" definida como padrão.`,
        defaultLocation: defaultLoc
      });
    } catch (error: any) {
      console.error("Erro ao definir localização padrão:", error);
      res.status(500).json({ error: "Erro ao definir a localização padrão: " + error.message });
    }
  });

  // Sync pomodoro state with server for cross-tab coordination
  app.post("/api/pomodoro/sync", async (req, res) => {
    const body = req.body as Partial<PomodoroState>;
    if (body.phase !== undefined) pomodoro.phase = body.phase;
    if (body.isRunning !== undefined) pomodoro.isRunning = body.isRunning;
    if (body.remainingMs !== undefined) pomodoro.remainingMs = body.remainingMs;
    if (body.durationMs !== undefined) pomodoro.durationMs = body.durationMs;
    if (body.sessionsCompletedToday !== undefined) pomodoro.sessionsCompletedToday = body.sessionsCompletedToday;
    if (body.sessions !== undefined) pomodoro.sessions = body.sessions;
    if (body.totalFocusMinutesToday !== undefined) pomodoro.totalFocusMinutesToday = body.totalFocusMinutesToday;
    if (body.settings) pomodoro.settings = { ...pomodoro.settings, ...body.settings };
    return res.json({ pomodoro });
  });

  // ============================================
  // HYBRID INTEGRATION ENDPOINTS
  // ============================================

  // Email Service Endpoints
  app.post("/api/email/configure", requireAuth, async (req, res) => {
    try {
      const { host, port, user, pass, security } = req.body;
      if (!host || !user || !pass) {
        return res.status(400).json({ error: "Host, usuário e senha são obrigatórios" });
      }

      // Save config to a JSON file
      const emailConfigPath = path.join(process.cwd(), 'email-config.json');
      const config = { host, port: port || (security === 'ssl' ? 993 : 143), user, pass, security: security || 'tls' };
      fs.writeFileSync(emailConfigPath, JSON.stringify(config, null, 2));

      res.json({ success: true, message: "Configuração de email salva com sucesso" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/email/status", requireAuth, async (req, res) => {
    try {
      const emailConfigPath = path.join(process.cwd(), 'email-config.json');
      if (!fs.existsSync(emailConfigPath)) {
        return res.json({ configured: false, message: "Email não configurado" });
      }
      const config = JSON.parse(fs.readFileSync(emailConfigPath, 'utf8'));
      res.json({ configured: true, host: config.host, user: config.user });
    } catch (error) {
      res.json({ configured: false, message: "Erro ao ler configuração" });
    }
  });

  app.get("/api/email/inbox", requireAuth, async (req, res) => {
    try {
      const emailConfigPath = path.join(process.cwd(), 'email-config.json');
      if (!fs.existsSync(emailConfigPath)) {
        return res.status(503).json({ error: "Email não configurado" });
      }
      res.json({ emails: [], total: 0, message: "IMAP integration placeholder - configure email in Settings" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar Service - In-memory cache with auto-refresh
  let calendarEventsCache: any[] = [];
  let calendarLastRefresh = 0;
  const CALENDAR_CACHE_TTL = 3600000; // 1 hour

  async function refreshCalendarEvents() {
    try {
      const calendarConfigPath = path.join(process.cwd(), 'calendar-config.json');
      if (!fs.existsSync(calendarConfigPath)) {
        calendarEventsCache = [];
        return;
      }

      const config = JSON.parse(fs.readFileSync(calendarConfigPath, 'utf8'));
      const events: any[] = [];

      // Load local ICS files
      if (config.icsFiles) {
        for (const filePath of config.icsFiles) {
          try {
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              let currentEvent: any = {};
              let veventCount = 0;
              for (const line of lines) {
                if (line.startsWith('SUMMARY:')) currentEvent.title = line.replace('SUMMARY:', '').trim();
                if (line.startsWith('DTSTART')) currentEvent.startDate = line.split(':')?.[1];
                if (line.startsWith('DTEND')) currentEvent.endDate = line.split(':')?.[1];
                if (line.startsWith('DESCRIPTION:')) currentEvent.description = line.replace('DESCRIPTION:', '').trim();
                if (line.startsWith('LOCATION:')) currentEvent.location = line.replace('LOCATION:', '').trim();
                if (line === 'END:VEVENT' && currentEvent.title) {
                  veventCount++;
                  events.push({ ...currentEvent, id: `local_${Date.now()}_${veventCount}`, isAllDay: !currentEvent.startDate?.includes('T') });
                  currentEvent = {};
                }
              }
            }
          } catch (e) {
            console.warn('Error parsing local ICS:', e);
          }
        }
      }

      // Load remote ICS URLs
      if (config.icsUrls) {
        for (const url of config.icsUrls) {
          try {
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (response.ok) {
              const content = await response.text();
              const lines = content.split('\n');
              let currentEvent: any = {};
              let veventCount = 0;
              for (const line of lines) {
                if (line.startsWith('SUMMARY:')) currentEvent.title = line.replace('SUMMARY:', '').trim();
                if (line.startsWith('DTSTART')) currentEvent.startDate = line.split(':')?.[1];
                if (line.startsWith('DTEND')) currentEvent.endDate = line.split(':')?.[1];
                if (line.startsWith('DESCRIPTION:')) currentEvent.description = line.replace('DESCRIPTION:', '').trim();
                if (line.startsWith('LOCATION:')) currentEvent.location = line.replace('LOCATION:', '').trim();
                if (line === 'END:VEVENT' && currentEvent.title) {
                  veventCount++;
                  events.push({ ...currentEvent, id: `remote_${Date.now()}_${veventCount}`, isAllDay: !currentEvent.startDate?.includes('T'), source: url });
                  currentEvent = {};
                }
              }
              console.log(`📅 Remote ICS loaded: ${veventCount} events from ${url.substring(0, 50)}...`);
            }
          } catch (e) {
            console.warn('Error fetching remote ICS:', e);
          }
        }
      }

      // Sort by date
      events.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
      calendarEventsCache = events;
      calendarLastRefresh = Date.now();
    } catch (error) {
      console.error('Calendar refresh error:', error);
    }
  }

  // Periodic refresh every hour
  setInterval(refreshCalendarEvents, CALENDAR_CACHE_TTL);
  refreshCalendarEvents(); // Initial load

  // Calendar Service Endpoints
  app.get("/api/calendar/status", requireAuth, async (req, res) => {
    try {
      const calendarConfigPath = path.join(process.cwd(), 'calendar-config.json');
      if (!fs.existsSync(calendarConfigPath)) {
        return res.json({ configured: false, fileCount: 0, urlCount: 0 });
      }
      const config = JSON.parse(fs.readFileSync(calendarConfigPath, 'utf8'));
      const fileCount = config.icsFiles ? config.icsFiles.length : 0;
      const urlCount = config.icsUrls ? config.icsUrls.length : 0;
      res.json({
        configured: fileCount > 0 || urlCount > 0,
        fileCount,
        urlCount,
        lastRefresh: calendarLastRefresh,
        eventCount: calendarEventsCache.length
      });
    } catch (error) {
      res.json({ configured: false, fileCount: 0, urlCount: 0, eventCount: 0 });
    }
  });

  app.post("/api/calendar/configure", requireAuth, async (req, res) => {
    try {
      const { icsFiles, icsUrls } = req.body;
      const calendarConfigPath = path.join(process.cwd(), 'calendar-config.json');
      const existingConfig: any = fs.existsSync(calendarConfigPath) ? JSON.parse(fs.readFileSync(calendarConfigPath, 'utf8')) : {};

      // Merge with existing config
      const config = {
        ...existingConfig,
        type: 'ics',
        icsFiles: icsFiles || existingConfig.icsFiles || [],
        icsUrls: icsUrls || existingConfig.icsUrls || []
      };

      fs.writeFileSync(calendarConfigPath, JSON.stringify(config, null, 2));
      console.log(`📅 Calendar configured: ${config.icsFiles?.length || 0} local files, ${config.icsUrls?.length || 0} remote URLs`);

      // Trigger immediate refresh
      refreshCalendarEvents();

      res.json({ success: true, message: "Configuração de calendário salva" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/calendar/events", requireAuth, async (req, res) => {
    try {
      // Return cached events (auto-refreshed every hour)
      const now = Date.now();
      if (now - calendarLastRefresh > CALENDAR_CACHE_TTL) {
        console.log('📅 Cache expired, refreshing calendar events...');
        await refreshCalendarEvents();
      }

      res.json({
        events: calendarEventsCache,
        lastRefresh: calendarLastRefresh,
        eventCount: calendarEventsCache.length
      });
    } catch (error) {
      console.error('Calendar events error:', error);
      res.json({ events: calendarEventsCache, lastRefresh: calendarLastRefresh, eventCount: calendarEventsCache.length });
    }
  });

  // Force refresh calendar events
  app.post("/api/calendar/refresh", requireAuth, async (req, res) => {
    try {
      await refreshCalendarEvents();
      res.json({ success: true, eventCount: calendarEventsCache.length, lastRefresh: calendarLastRefresh });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get available ICS files from configured directories
  app.get("/api/calendar/files", requireAuth, async (req, res) => {
    try {
      const calendarConfigPath = path.join(process.cwd(), 'calendar-config.json');
      const cwd = process.cwd();
      const files: any[] = [];

      // Scan common directories for .ics files
      const scanDirs = ['calendarios', 'calendar', 'ics', '.'];
      for (const dir of scanDirs) {
        const fullPath = path.join(cwd, dir);
        if (!fs.existsSync(fullPath)) continue;

        try {
          const entries = fs.readdirSync(fullPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.name.toLowerCase().endsWith('.ics')) {
              const relativePath = `${dir}/${entry.name}`;
              const stats = fs.statSync(path.join(fullPath, entry.name));
              // Count events in file
              const content = fs.readFileSync(path.join(fullPath, entry.name), 'utf8');
              const eventCount = (content.match(/BEGIN:VEVENT/g) || []).length;

              files.push({
                path: relativePath,
                name: entry.name,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                events: eventCount
              });
            }
          }
        } catch (e) {
          // Skip directories we can't read
        }
      }

      res.json({ files });
    } catch (error) {
      res.json({ files: [] });
    }
  });

  // Drive Service Endpoints
  app.post("/api/drive/configure", requireAuth, async (req, res) => {
    try {
      const { type, path: drivePath, url, user, pass } = req.body;
      const driveConfigPath = path.join(process.cwd(), 'drive-config.json');
      const config = { type: type || 'local', path: drivePath, url, user, pass };
      fs.writeFileSync(driveConfigPath, JSON.stringify(config, null, 2));
      res.json({ success: true, message: "Configuração de drive salva" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/drive/status", requireAuth, async (req, res) => {
    try {
      const driveConfigPath = path.join(process.cwd(), 'drive-config.json');
      if (!fs.existsSync(driveConfigPath)) {
        return res.json({ configured: false });
      }
      const config = JSON.parse(fs.readFileSync(driveConfigPath, 'utf8'));
      res.json({ configured: true, type: config.type, path: config.path, url: config.url });
    } catch (error) {
      res.json({ configured: false });
    }
  });

  app.get("/api/drive/files", requireAuth, async (req, res) => {
    try {
      const driveConfigPath = path.join(process.cwd(), 'drive-config.json');
      if (!fs.existsSync(driveConfigPath)) {
        return res.json({ files: [], message: "Drive não configurado" });
      }
      const config = JSON.parse(fs.readFileSync(driveConfigPath, 'utf8'));
      let files: any[] = [];

      if (config.type === 'local' && config.path) {
        const fullPath = path.join(process.cwd(), config.path);
        if (fs.existsSync(fullPath)) {
          const entries = fs.readdirSync(fullPath, { withFileTypes: true });
          files = entries.map(entry => ({
            id: `${entry.name}_${Date.now()}`,
            name: entry.name,
            type: entry.isDirectory() ? 'folder' : 'file',
            size: entry.isDirectory() ? undefined : fs.statSync(path.join(fullPath, entry.name)).size,
            path: `${config.path}/${entry.name}`
          }));
        }
      }

      res.json({ files });
    } catch (error) {
      res.json({ files: [] });
    }
  });

  // AI Service Endpoints (OpenRouter)
  app.post("/api/ai/configure", requireAuth, async (req, res) => {
    try {
      const { apiKey, model } = req.body;
      const aiConfigPath = path.join(process.cwd(), 'ai-config.json');
      const config = { apiKey, model: model || 'meta-llama/llama-3.1-8b-instruct:free' };
      fs.writeFileSync(aiConfigPath, JSON.stringify(config, null, 2));
      res.json({ success: true, message: "Configuração de IA salva" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai/status", requireAuth, async (req, res) => {
    try {
      const aiConfigPath = path.join(process.cwd(), 'ai-config.json');
      if (!fs.existsSync(aiConfigPath)) {
        return res.json({ configured: false, message: "IA não configurada" });
      }
      const config = JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));
      res.json({ configured: !!config.apiKey, model: config.model || 'llama-3.1-8b-instruct' });
    } catch (error) {
      res.json({ configured: false });
    }
  });

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const { message, context } = req.body;
      const aiConfigPath = path.join(process.cwd(), 'ai-config.json');
      if (!fs.existsSync(aiConfigPath)) {
        return res.status(503).json({ error: "IA não configurada" });
      }
      const config = JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));
      if (!config.apiKey || config.apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
        return res.status(503).json({ error: "API Key não configurada. Obtenha uma grátis em openrouter.ai" });
      }

      const systemPrompt = context
        ? `Você é um assistente de produtividade. Contexto: ${context}\n\nResponda à mensagem do usuário.`
        : 'Você é um assistente de produtividade chamado NuRa. Ajudi o usuário a organizar tarefas e ideias.';

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'NuRa Flow'
        },
        body: JSON.stringify({
          model: config.model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1500
        })
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      res.json({ success: true, content });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: error.message || 'Erro na IA' });
    }
  });

  app.post("/api/ai/summarize", requireAuth, async (req, res) => {
    try {
      const { text } = req.body;
      const aiConfigPath = path.join(process.cwd(), 'ai-config.json');
      if (!fs.existsSync(aiConfigPath)) {
        return res.status(503).json({ error: "IA não configurada" });
      }
      const config = JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'NuRa Flow'
        },
        body: JSON.stringify({
          model: config.model || 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: 'Resuma o texto de forma concisa em português do Brasil.' },
            { role: 'user', content: text }
          ],
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      res.json({ success: true, summary: content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development vs static serve for production
  const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--production");

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Catch-all for SPA - served AFTER all routes
    // Serve index.html with no-cache headers to prevent stale cache issues
    app.get('*', (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Weather Locations Endpoints (must be inside startServer after app is defined)
  // Get current weather location (first in list) for backward compatibility
  app.get("/api/settings/weather-location", async (req, res) => {
    const defaultLoc = serverWeatherLocations[0] || { latitude: -28.4491, longitude: -52.2004, cityName: 'Marau, RS' };
    res.json({
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      cityName: defaultLoc.cityName || ''
    });
  });

  // Get all weather locations
  app.get("/api/settings/weather-locations", async (req, res) => {
    res.json({ locations: serverWeatherLocations });
  });

  // Add a new weather location
  app.post("/api/settings/weather-locations", async (req, res) => {
    try {
      const { latitude, longitude, cityName } = req.body;

      // Validate input
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Latitude e longitude devem ser números válidos." });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Latitude deve estar entre -90 e 90, longitude entre -180 e 180." });
      }

      if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
        return res.status(400).json({ error: "Nome da cidade é obrigatório." });
      }

      const newLocation = {
        id: `city_${Date.now()}`,
        latitude,
        longitude,
        cityName: cityName.trim()
      };

      serverWeatherLocations.push(newLocation);
      saveWeatherLocations();

      res.json({
        success: true,
        location: newLocation
      });
    } catch (error: any) {
      console.error("Erro ao adicionar localização do weather:", error);
      res.status(500).json({ error: "Erro ao salvar a localização do weather: " + error.message });
    }
  });

  // Update a weather location by ID
  app.put("/api/settings/weather-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { latitude, longitude, cityName } = req.body;

      // Validate input
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Latitude e longitude devem ser números válidos." });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Latitude deve estar entre -90 e 90, longitude entre -180 e 180." });
      }

      if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
        return res.status(400).json({ error: "Nome da cidade é obrigatório." });
      }

      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      serverWeatherLocations[index] = {
        id,
        latitude,
        longitude,
        cityName: cityName.trim()
      };

      saveWeatherLocations();

      res.json({
        success: true,
        location: serverWeatherLocations[index]
      });
    } catch (error: any) {
      console.error("Erro ao atualizar localização do weather:", error);
      res.status(500).json({ error: "Erro ao atualizar a localização do weather: " + error.message });
    }
  });

  // Delete a weather location by ID
  app.delete("/api/settings/weather-locations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      const removed = serverWeatherLocations.splice(index, 1)[0];
      saveWeatherLocations();

      res.json({
        success: true,
        message: `Localização "${removed.cityName}" removida com sucesso.`,
        remainingLocations: serverWeatherLocations.length
      });
    } catch (error: any) {
      console.error("Erro ao excluir localização do weather:", error);
      res.status(500).json({ error: "Erro ao excluir a localização do weather: " + error.message });
    }
  });

  // Set a weather location as default (by moving it to first position)
  app.post("/api/settings/weather-locations/:id/set-default", async (req, res) => {
    try {
      const { id } = req.params;
      const index = serverWeatherLocations.findIndex(loc => loc.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Localização não encontrada." });
      }

      const [defaultLoc] = serverWeatherLocations.splice(index, 1);
      serverWeatherLocations.unshift(defaultLoc);
      saveWeatherLocations();

      res.json({
        success: true,
        message: `Localização "${defaultLoc.cityName}" definida como padrão.`,
        defaultLocation: defaultLoc
      });
    } catch (error: any) {
      console.error("Erro ao definir localização padrão:", error);
      res.status(500).json({ error: "Erro ao definir a localização padrão: " + error.message });
    }
  });

  // Inicializa o banco de dados antes de iniciar o servidor
  try {
    await initializeDatabase();
    console.log('[DB] Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('[DB] Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NuRa Server running on http://0.0.0.0:${PORT}`);
    // Registrar webhook do Telegram após iniciar o servidor
    setupTelegramWebhook();
  });
}

startServer();
