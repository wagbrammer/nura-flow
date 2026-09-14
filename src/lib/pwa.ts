export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notify();
  });
}

export const pwaInstall = {
  isAvailable: () => Boolean(deferredInstallPrompt),
  isStandalone: () => typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  ),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  prompt: async () => {
    if (!deferredInstallPrompt) return 'unavailable' as const;
    const prompt = deferredInstallPrompt;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredInstallPrompt = null;
    notify();
    return choice.outcome;
  }
};
