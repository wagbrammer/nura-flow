/**
 * Serviço de Notificações Nativas do Navegador (Desktop e Mobile Push)
 */

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Este navegador não suporta notificações de desktop.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  isGranted(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  },

  show(title: string, options?: NotificationOptions) {
    if (!this.isGranted()) {
      this.requestPermission().then(granted => {
        if (granted) {
          this.triggerNotification(title, options);
        }
      });
      return;
    }

    this.triggerNotification(title, options);
  },

  triggerNotification(title: string, options?: NotificationOptions) {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/app-icon.svg',
            badge: '/app-icon.svg',
            ...options
          });
        });
      } else {
        new Notification(title, {
          icon: '/app-icon.svg',
          ...options
        });
      }
    } catch (e) {
      console.error('Erro ao exibir notificação:', e);
      try {
        new Notification(title, {
          icon: '/app-icon.svg',
          ...options
        });
      } catch (err) {
        console.error('Fallback de notificação falhou:', err);
      }
    }
  }
};
