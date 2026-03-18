import WebApp from '@twa-dev/sdk';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== '';
};

export const getTelegramTheme = () => {
  if (isTelegramWebApp()) {
    return WebApp.colorScheme;
  }
  return 'light';
};

export const setupTelegram = () => {
  if (isTelegramWebApp()) {
    WebApp.ready();
    WebApp.expand();
    WebApp.enableClosingConfirmation();
    
    // Set colors to match our dark theme
    WebApp.setHeaderColor('#000002');
    WebApp.setBackgroundColor('#000002');
  }
};
