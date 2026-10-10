# Sabermetrics AI

A baseball analytics assistant for people who are new to the sport and for people who argue about
park factors. Ask a question in plain English — "What is WAR?", "Explain wRC+ like I'm new to
baseball", "What does a wRC+ of 125 mean?" — and get an answer grounded in the baseball knowledge
base behind it.

The site is built around a **BotStacks** assistant. The chat is not a widget bolted onto a marketing
page; it is the page.

React · TypeScript · Vite. No server, no backend of its own.

---

## Quick start

```bash
npm install
cp .env.example .env     # then set VITE_BOTSTACKS_BOT_ID
npm run dev
```

| Script            | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Vite dev server                           |
| `npm run build`   | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally        |
| `npm run typecheck` | Types only                              |

---

## Configuration

One variable is required:

```sh
VITE_BOTSTACKS_BOT_ID=<public uuid of a published BotStacks assistant>
```

Find it in the BotStacks dashboard under your assistant's **Activate** tab — it is the `data-bot`
value in the generated embed snippet. The assistant must be **published**; the API only serves
config for published bots.

Without it the page renders a clearly-labelled "assistant not configured" state rather than a broken
chat. Optional overrides are documented in [`.env.example`](./.env.example).

### Security

There is nothing to keep secret here, by design. The BotStacks web widget takes **no API key, no
token and no cookie** — a published bot's public UUID is the entire identity, and the API refuses
anything unpublished. Every `VITE_*` value is inlined into the client bundle, so never add a private
BotStacks token, workspace key or model provider key to `.env`.

---

## How the BotStacks integration works

### The supported mechanism

BotStacks ships one integration for third-party sites: a single credential-free script tag,
documented in the Activation Kit and served from the production API.

```html
<script
  src="https://api.botstacks.ai/widget/widget.js"
  data-bot="<bot uuid>"
  data-kit="full-screen"
  defer
></script>
```

The script is zero-dependency, mounts `<div id="botstacks-widget">` on `document.body`, renders
itself inside a **shadow root** (so neither site CSS nor widget CSS can leak across), and calls
these public endpoints on the same origin:

| Endpoint                | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `GET /widget/config`    | Bot name, colour, logo, font, kit, conversation starters   |
| `POST /widget/chat`     | One conversation turn; returns the answer and its sources  |
| `POST /widget/handoff`  | "Talk to a person" contact capture                         |
| `POST /widget/skill`    | Structured skill form submission                           |
| `GET /widget/live/messages` | Polls for replies while a human is in the thread       |

The production origin is **`https://api.botstacks.ai`**, which is also the widget's own built-in
default. No sandbox host appears anywhere in this repo.

### Making it full screen

The shipped widget always renders the same DOM — a corner launcher, a scrim and a floating panel —
and only swaps a `kit-*` class on its root to position it. Even `data-kit="full-screen"` is a
centred modal with a bubble in the corner, which is the opposite of what this product wants.

Rather than reimplement the chat, [`src/lib/botstacks.ts`](./src/lib/botstacks.ts) adapts the real
widget in three steps:

1. **Load** the official script once, with the bot id and brand attributes.
2. **Relocate** its shadow host into the page's stage element once `/widget/config` confirms a live
   bot. (The widget keeps itself `display: none` until then, so an unpublished bot never leaves a
   dead panel on screen.)
3. **Restyle** it by appending one stylesheet _inside_ the shadow root
   ([`botstacksStageStyles.ts`](./src/lib/botstacksStageStyles.ts)): the launcher, scrim and close
   button are hidden, the panel is docked to `inset: 0`, and the chrome is scaled up for a
   full-height canvas.

The widget's markup, transport, markdown renderer, copy buttons, citation chips, handoff cards and
live-agent polling are all left exactly as shipped. Because the dashboard's Bot Design setting can
override `data-kit` at runtime, the stylesheet neutralises **every** kit rather than assuming
`kit-full` is the one that loads.

The hero's example-prompt chips drive the widget the same way a visitor would: they fill its
composer and click its send button.

### What you get from the widget itself

Markdown rendering (headings, lists, code blocks, bold, inline code, links), per-answer copy
buttons, source citation chips, a typing indicator, an error bubble on a failed turn, conversation
starters from the dashboard, and the human-handoff flow.

### What this app adds

A loading skeleton while the widget boots, a retryable error state (script failure, unpublished bot,
timeout), an explicit "not configured" state, and the responsive stage that keeps the chat dominant
on both desktop and mobile.

---

## Local preview without a published bot

Layout work does not need a real assistant. A dev-only harness proxies the **real** widget script
from production and stubs the two chat endpoints:

```bash
node scripts/mock-botstacks.mjs      # terminal 1

VITE_BOTSTACKS_BOT_ID=11111111-1111-4111-8111-111111111111 \
VITE_BOTSTACKS_API_ORIGIN=http://localhost:8787 \
npm run dev                          # terminal 2
```

This is a development tool only. Never point a deployed build at it.

---

## Project layout

```
src/
  config.ts                      public runtime config (bot id, API origin, brand)
  lib/botstacks.ts               load / relocate / drive the official widget
  lib/botstacksStageStyles.ts    the stylesheet injected into the widget's shadow root
  hooks/useBotstacksStage.ts     widget lifecycle + loading / error / retry state
  components/                    header, hero, prompt chips, stage, sections, footer
  data/content.ts                prompts and supporting copy
  styles/                        design tokens, base styles, layout
scripts/mock-botstacks.mjs       dev-only preview harness
```

## Deployment

The build output in `dist/` is plain static files, suitable for any static host. Hosting is not
configured in this repo yet.
