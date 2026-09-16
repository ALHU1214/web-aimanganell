interface AMSupabaseConfig {
  url: string;
  key: string;
  table: string;
}

interface AMConfig {
  waNumber: string;
  waMsg: string;
  calUrl: string;
  heroVideo: string;
  supabase: AMSupabaseConfig;
  webhookUrl: string;
  turnstileSiteKey: string;
  gaId: string;
  metaPixelId: string;
  clarityId: string;
}

interface LeadFormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  biz?: string;
  bizLabel?: string;
  mensaje: string;
}

interface TurnstileWidget {
  render: (container: HTMLElement | string, options: { sitekey: string; theme?: string }) => string;
  getResponse: (widgetId?: string) => string;
  reset: (widgetId?: string) => void;
}

interface LeadFormElement extends HTMLFormElement {
  _turnstileId?: string;
  nombre: HTMLInputElement;
  empresa: HTMLInputElement;
  email: HTMLInputElement;
  telefono: HTMLInputElement;
  biz: HTMLSelectElement;
  mensaje: HTMLTextAreaElement;
  acepta: HTMLInputElement;
}

interface Window {
  onloadTurnstile?: () => void;
  turnstile?: TurnstileWidget;
  dataLayer?: unknown[];
  gtag?: (command: string, actionOrTarget: string | Date, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  _fbq?: unknown;
  clarity?: (...args: unknown[]) => void;
}

declare const process: {
  env: Record<string, string | undefined>;
};

