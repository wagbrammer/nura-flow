import fs from 'fs';
import path from 'path';

// Storage para subscriptions do Telegram
const telegramConfigPath = path.join(process.cwd(), 'telegram-config.json');

interface TelegramSubscription {
  chatId: string;
  username?: string;
  firstName?: string;
  subscribedAt: string;
  enabled: boolean;
}

export let telegramSubscriptions: Record<string, TelegramSubscription> = {};

function loadTelegramConfig() {
  try {
    if (fs.existsSync(telegramConfigPath)) {
      const data = fs.readFileSync(telegramConfigPath, 'utf8');
      telegramSubscriptions = JSON.parse(data);
    }
  } catch (e) {
    console.error('Erro ao carregar config do Telegram:', e);
  }
}

function saveTelegramConfig() {
  try {
    fs.writeFileSync(telegramConfigPath, JSON.stringify(telegramSubscriptions, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar config do Telegram:', e);
  }
}

// Carregar config ao iniciar
loadTelegramConfig();

export function getTelegramToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function isTelegramConfigured(): boolean {
  return !!getTelegramToken();
}

export function getTelegramApi(): string {
  const token = getTelegramToken();
  return token ? `https://api.telegram.org/bot${token}` : '';
}

// Subscribe um chat_id
export function subscribeTelegram(chatId: string, userInfo: { username?: string; firstName?: string }) {
  telegramSubscriptions[chatId] = {
    chatId,
    username: userInfo.username,
    firstName: userInfo.firstName,
    subscribedAt: new Date().toISOString(),
    enabled: true
  };
  saveTelegramConfig();
  console.log(`Telegram: novo subscriber - ${userInfo.firstName || userInfo.username || chatId}`);
}

// Unsubscribe
export function unsubscribeTelegram(chatId: string) {
  if (telegramSubscriptions[chatId]) {
    delete telegramSubscriptions[chatId];
    saveTelegramConfig();
    console.log(`Telegram: subscriber removido - ${chatId}`);
  }
}

// Listar subscriptions
export function listTelegramSubscriptions(): TelegramSubscription[] {
  return Object.values(telegramSubscriptions).filter(s => s.enabled);
}

// Enviar mensagem para um chat específico
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown';
    disablePreview?: boolean;
  }
): Promise<boolean> {
  if (!isTelegramConfigured()) {
    console.warn('Telegram não configurado (TELEGRAM_BOT_TOKEN ausente)');
    return false;
  }

  try {
    const response = await fetch(`${getTelegramApi()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disablePreview ?? true
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Telegram send error: ${data.description}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Erro ao enviar mensagem Telegram:', e);
    return false;
  }
}

// Broadcast para todos os subscribers ativos
export async function broadcastTelegramMessage(message: string, options: {
  parseMode?: 'HTML' | 'Markdown';
  disablePreview?: boolean;
} = {}): Promise<{ success: number; failed: number }> {
  const subs = listTelegramSubscriptions();
  let success = 0;
  let failed = 0;

  for (const sub of subs) {
    const ok = await sendTelegramMessage(sub.chatId, message, options);
    if (ok) success++;
    else failed++;
  }

  console.log(`Telegram broadcast: ${success} sucesso, ${failed} falhas, ${subs.length} total`);
  return { success, failed };
}

// Helpers para mensagens comuns
export const telegramTemplates = {
  briefingDiario: (resumo: string, tarefasUrgentes: number, proximaReuniao?: string) => {
    let msg = `☀️ <b>Bom dia! Briefing do Dia</b>\n\n`;
    msg += `${resumo}\n\n`;
    if (proximaReuniao) {
      msg += `📅 <b>Próxima reunião:</b> ${proximaReuniao}\n`;
    }
    if (tarefasUrgentes > 0) {
      msg += `⚡ <b>${tarefasUrgentes}</b> tarefa(s) urgente(s)\n`;
    }
    return msg;
  },

  reuniaoProxima: (titulo: string, minutos: number) => {
    return `⏰ <b>Reunião em ${minutos} min</b>\n\n📋 ${titulo}\n\n🔗 <a href="${process.env.APP_URL || 'http://localhost:3000'}">Abrir NuRa Flow</a>`;
  },

  tarefaAtrasada: (titulo: string) => {
    return `🚨 <b>Tarefa atrasada</b>\n\n📌 ${titulo}\n\nVamos colocar em dia? 💪`;
  },

  boasVindas: (firstName?: string) => {
    const nome = firstName ? `, ${firstName}` : '';
    return `👋 Bem-vindo ao NuRa Flow${nome}!\n\nVocê receberá notificações sobre:\n• Briefing do dia\n• Reuniões próximas\n• Tarefas urgentes\n\nPara parar, envie /parar a qualquer momento.`;
  },

  help: () => `🤖 <b>Comandos disponíveis:</b>\n\n/start - Ativar notificações\n/parar - Desativar notificações\n/status - Ver status\n/help - Esta mensagem\n\nVocê também pode digitar qualquer mensagem para testar.`
};
