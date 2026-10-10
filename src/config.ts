/**
 * Public runtime configuration.
 *
 * Every value here is compiled into the browser bundle. Nothing secret belongs
 * in this file — see `.env.example` for the reasoning.
 */

const DEFAULT_API_ORIGIN = 'https://api.botstacks.ai';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

const rawApiOrigin = (import.meta.env.VITE_BOTSTACKS_API_ORIGIN ?? '').trim();

export const botstacksConfig = {
  /** Public UUID of the published assistant. Empty until an operator sets it. */
  botId: (import.meta.env.VITE_BOTSTACKS_BOT_ID ?? '').trim(),
  apiOrigin: trimTrailingSlash(rawApiOrigin || DEFAULT_API_ORIGIN),
  /** Rendered as the widget accent; kept in sync with --accent in global.css. */
  primaryColor: '#5B8CFF',
  textColor: '#FFFFFF',
  fontFamily: 'Inter Variable',
  /**
   * Requests the widget's own full-screen layout. The dashboard's Bot Design
   * setting can override this, which is why the embed stylesheet neutralises
   * every kit rather than only `kit-full`.
   */
  kit: 'full-screen',
} as const;

export const siteConfig = {
  name: 'Sabermetrics AI',
  tagline: 'Your Baseball Analytics Guru',
  githubUrl: (import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/BotStacks/sabermetrics-ai').trim(),
  docsUrl: 'https://docs.botstacks.ai',
} as const;
