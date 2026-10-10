/**
 * Thin adapter around the official BotStacks web widget.
 *
 * The supported integration is a single credential-free script tag:
 *
 *   <script src="https://api.botstacks.ai/widget/widget.js"
 *           data-bot="<published bot uuid>" data-kit="full-screen" defer></script>
 *
 * The script mounts `<div id="botstacks-widget">` on `document.body`, renders
 * itself inside a shadow root, and talks to the public `/widget/*` endpoints on
 * the same origin. There is no API key, no token and no cookie involved.
 *
 * This module does three things and nothing more:
 *   1. loads that script once,
 *   2. relocates the shadow host into the page's chat stage,
 *   3. injects a stylesheet so the widget paints edge-to-edge in that stage.
 *
 * The widget's own DOM, transport and features are never reimplemented.
 */

import { BOTSTACKS_STAGE_STYLES } from './botstacksStageStyles';

const HOST_ID = 'botstacks-widget';
const SCRIPT_ID = 'botstacks-widget-script';
const STYLE_ID = 'sabermetrics-stage-styles';

/** The widget paints only after `/widget/config` answers; give it room. */
const READY_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 90;

export interface BotstacksWidgetOptions {
  botId: string;
  apiOrigin: string;
  primaryColor: string;
  textColor: string;
  fontFamily: string;
  kit: string;
}

export class BotstacksLoadError extends Error {
  readonly reason: 'script' | 'unavailable' | 'timeout';

  constructor(reason: 'script' | 'unavailable' | 'timeout', message: string) {
    super(message);
    this.name = 'BotstacksLoadError';
    this.reason = reason;
  }
}

declare global {
  interface Window {
    __botstacksWidgetLoaded?: boolean;
  }
}

let loadPromise: Promise<HTMLElement> | null = null;

function getHost(): HTMLElement | null {
  return document.getElementById(HOST_ID);
}

/**
 * Give the widget's shadow root the page's stage stylesheet. Safe to call on
 * every poll tick: it bails out once the sheet is in place.
 */
function prepareHost(host: HTMLElement): boolean {
  const shadow = host.shadowRoot;
  if (!shadow) return false;

  if (!shadow.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = BOTSTACKS_STAGE_STYLES;
    // Appended last so it outranks the widget's own sheet, which the widget
    // rewrites in place (textContent) rather than re-inserting.
    shadow.appendChild(style);
  }

  // Inline styles beat the widget's `:host { all: initial }` rule. `display` is
  // deliberately left alone — the widget uses it to stay hidden until it knows
  // the bot is published.
  host.style.position = 'absolute';
  host.style.inset = '0';
  host.style.zIndex = '1';

  return true;
}

function removeWidget(): void {
  getHost()?.remove();
  document.getElementById(SCRIPT_ID)?.remove();
  window.__botstacksWidgetLoaded = false;
}

function injectScript(options: BotstacksWidgetOptions, onError: () => void): void {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = `${options.apiOrigin}/widget/widget.js`;
  script.defer = true;
  script.dataset.bot = options.botId;
  script.dataset.kit = options.kit;
  script.dataset.primary = options.primaryColor;
  script.dataset.textColor = options.textColor;
  script.dataset.font = options.fontFamily;
  script.dataset.api = options.apiOrigin;
  script.addEventListener('error', onError, { once: true });

  document.body.appendChild(script);
}

/**
 * Load the widget and resolve once its shadow host is live and styled.
 *
 * Resolves with the host element. The caller is responsible for parenting it
 * into the stage via {@link attachBotstacksWidget}.
 */
export function loadBotstacksWidget(options: BotstacksWidgetOptions): Promise<HTMLElement> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<HTMLElement>((resolve, reject) => {
    // A previous attempt may have left a half-built widget behind.
    if (!getHost() && window.__botstacksWidgetLoaded) removeWidget();

    const startedAt = Date.now();
    let timer: number | undefined;
    let sawHost = false;
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      fn();
    };

    const fail = (error: BotstacksLoadError) => finish(() => reject(error));

    const tick = () => {
      const host = getHost();

      if (host) {
        sawHost = true;
        if (prepareHost(host) && host.style.display !== 'none') {
          finish(() => resolve(host));
          return;
        }
      } else if (sawHost) {
        // The widget removes its own host when `/widget/config` rejects the id,
        // which is how an unpublished or unknown bot surfaces.
        fail(
          new BotstacksLoadError(
            'unavailable',
            'BotStacks returned no published assistant for this bot id.',
          ),
        );
        return;
      }

      if (Date.now() - startedAt > READY_TIMEOUT_MS) {
        fail(new BotstacksLoadError('timeout', 'The BotStacks assistant took too long to load.'));
        return;
      }

      timer = window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    injectScript(options, () =>
      fail(new BotstacksLoadError('script', 'The BotStacks widget script could not be loaded.')),
    );
    tick();
  });

  loadPromise.catch(() => {
    // Let the caller retry from scratch.
    loadPromise = null;
    removeWidget();
  });

  return loadPromise;
}

/** Move the widget's shadow host into the page's chat stage. */
export function attachBotstacksWidget(host: HTMLElement, stage: HTMLElement): void {
  if (host.parentElement !== stage) stage.appendChild(host);
}

/** Park the widget back on `document.body`, hidden, when the stage unmounts. */
export function detachBotstacksWidget(host: HTMLElement): void {
  if (!host.isConnected) return;
  host.style.display = 'none';
  document.body.appendChild(host);
}

function queryShadow<T extends Element>(selector: string): T | null {
  return getHost()?.shadowRoot?.querySelector<T>(selector) ?? null;
}

/**
 * Trigger the widget's own "open" path so it seeds its greeting, conversation
 * starters and handoff affordance. The launcher is hidden by the stage
 * stylesheet, but clicking it programmatically still runs the handler.
 */
export function openBotstacksPanel(): void {
  const root = queryShadow<HTMLElement>('.root');
  if (!root || root.classList.contains('open')) return;

  // The widget focuses its textarea on open; keep the page where it was.
  const { scrollX, scrollY } = window;
  queryShadow<HTMLButtonElement>('.bubble')?.click();
  window.scrollTo(scrollX, scrollY);
}

/**
 * Put a question into the widget's composer and send it, exactly as a visitor
 * typing it would. Returns false when the widget is absent or mid-request so
 * callers can leave their own UI untouched.
 */
export function askBotstacks(question: string): boolean {
  const input = queryShadow<HTMLTextAreaElement>('.composer .input');
  const send = queryShadow<HTMLButtonElement>('.composer .send');
  if (!input || !send || input.disabled || send.disabled) return false;

  input.value = question;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  send.click();
  return true;
}

/** Move keyboard focus into the widget's composer. */
export function focusBotstacksComposer(): void {
  queryShadow<HTMLTextAreaElement>('.composer .input')?.focus();
}
