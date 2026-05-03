// Helper: send notifications to the admin Telegram bot via edge function.
// Uses Lovable Cloud client (separate from external students DB).
import { cloudSupabase } from '@/integrations/supabase/cloudClient';

export type TelegramKind = 'rating' | 'feedback' | 'support' | 'visitor';

export interface TelegramPayload {
  kind: TelegramKind;
  name?: string;
  email?: string;
  message?: string;
  rating?: number;
}

export async function notifyTelegram(payload: TelegramPayload): Promise<boolean> {
  try {
    const { error } = await cloudSupabase.functions.invoke('telegram-notify', {
      body: payload,
    });
    if (error) {
      console.warn('telegram-notify error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('telegram-notify exception:', e);
    return false;
  }
}

// Cached bot username (fetched once per session).
let botUsernameCache: string | null = null;
export async function getBotUsername(): Promise<string> {
  if (botUsernameCache) return botUsernameCache;
  try {
    const { data } = await cloudSupabase.functions.invoke('telegram-info', {});
    if (data && typeof data === 'object' && 'username' in data) {
      const u = String((data as { username: string }).username || '').replace(/^@/, '');
      if (u) {
        botUsernameCache = u;
        return u;
      }
    }
  } catch (e) {
    console.warn('telegram-info failed:', e);
  }
  // Fallback to known username (set as a secret too).
  return 'responsstshubbot';
}

export function botDeepLink(username: string, startPayload?: string): string {
  // Strip any accidental "https://t.me/" prefix or leading "@".
  const clean = String(username || '')
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '')
    .trim() || 'responsstshubbot';
  const base = `https://t.me/${clean}`;
  return startPayload ? `${base}?start=${encodeURIComponent(startPayload)}` : base;
}

/**
 * Stable per-device id used as the Telegram `start` payload so the
 * bot can link a Telegram chat back to this website visitor.
 */
export function getDeviceLinkId(): string {
  const KEY = 'tg_device_link_id_v1';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'web_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
