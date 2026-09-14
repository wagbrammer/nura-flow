// src/lib/notifier.ts
// Utilitários para notificações do navegador (push/pop-up)

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Solicita permissão para notificações do navegador
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Verifica se notificações estão habilitadas
 */
export function areNotificationsAllowed(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Mostra uma notificação do navegador
 */
export function showNotification(options: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/icon-192x192.png',
    tag: options.tag || 'pomodoro',
    requireInteraction: true, // Mantém a notificação até o usuário interagir
  });

  // Tocar som se disponível
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  } catch {
    // Ignorar erro de áudio
  }

  return notification;
}

/**
 * Agenda uma notificação para ser mostrada após X milissegundos
 * Útil para notificar quando o timer Pomodoro terminar
 */
export function scheduleNotification(
  delayMs: number,
  options: NotificationOptions
): number | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  const timeoutId = window.setTimeout(() => {
    showNotification(options);
  }, delayMs);

  return timeoutId;
}

/**
 * Cancela uma notificação agendada
 */
export function cancelNotification(timeoutId: number | null): void {
  if (timeoutId) {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Envia notificação de término de ciclo Pomodoro
 */
export function sendPomodoroNotification(
  phase: string,
  completedSessions: number,
  totalMinutes: number
): Notification | null {
  const isFocus = phase === 'focus';
  const title = isFocus ? '🍅 Foco Concluído!' : '☕ Pausa Concluída';
  const body = isFocus
    ? `Parabéns! ${completedSessions} sessão(ões) concluída(s). Hora de descansar.`
    : `Bom retorno! Pronto para mais ${Math.floor(totalMinutes / completedSessions || 25)} min de foco?`;

  return showNotification({
    title,
    body,
    tag: 'pomodoro-ended',
  });
}
