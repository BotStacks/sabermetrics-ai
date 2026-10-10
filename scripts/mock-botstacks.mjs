/**
 * Local preview harness for the BotStacks embed. Development only.
 *
 * Embedding a *real* assistant needs a published bot id, which contributors
 * working on layout usually do not have. This server stands in for the
 * BotStacks API so the stage can be exercised end to end:
 *
 *   - `/widget/widget.js` is proxied straight from https://api.botstacks.ai,
 *     so what renders is the genuine production widget, not a reimplementation.
 *   - `/widget/config` and `/widget/chat` return canned payloads shaped like
 *     the real ones (see the `WidgetConfigResponse` / `WidgetChatResponse`
 *     schemas in https://api.botstacks.ai/openapi.json).
 *
 * Usage:
 *   node scripts/mock-botstacks.mjs
 *   VITE_BOTSTACKS_BOT_ID=11111111-1111-4111-8111-111111111111 \
 *   VITE_BOTSTACKS_API_ORIGIN=http://localhost:8787 npm run dev
 *
 * Never point a deployed build at this.
 */

import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT ?? 8787);
const UPSTREAM_WIDGET = 'https://api.botstacks.ai/widget/widget.js';

const CONFIG = {
  botId: '11111111-1111-4111-8111-111111111111',
  name: 'Sabermetrics AI',
  widgetColor: '#5B8CFF',
  kit: 'full-screen',
  widgetFont: 'Inter Variable',
  conversationStarters: [
    'What is WAR?',
    'Explain wRC+ simply',
    'OPS vs wOBA',
    'Why does BABIP matter?',
  ],
  contactSettings: {},
};

const ANSWER = `**wRC+** (Weighted Runs Created Plus) measures a hitter's total offensive value, adjusted for ballpark and league scoring environment.

The scale is the easy part:

- **100 is exactly league average.**
- Every point above or below 100 is one percent better or worse than average.
- A **125 wRC+** means the hitter created 25% more runs than a league-average hitter in the same park and era.

### Why it beats batting average

Batting average treats a single and a home run as the same event, and it ignores walks entirely. wRC+ weights each outcome by how many runs it actually produces:

\`\`\`text
wRC+ = (((wRAA / PA) + League R/PA) + (League R/PA - Park Factor * League R/PA)) / (AL or NL wRC/PA excluding pitchers) * 100
\`\`\`

### Rough reference points

1. **160+** — MVP-calibre season
2. **130–140** — clear All-Star bat
3. **100** — league average
4. **80 or below** — a bat that needs glove or speed to carry it

Because it is park- and league-adjusted, you can compare a Coors Field hitter to a Petco Park hitter directly — something raw OPS cannot do.`;

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    ...headers,
  });
  res.end(body);
}

function json(res, status, payload) {
  send(res, status, JSON.stringify(payload), { 'content-type': 'application/json' });
}

let cachedWidget = null;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (url.pathname === '/widget/widget.js') {
    try {
      if (!cachedWidget) cachedWidget = await (await fetch(UPSTREAM_WIDGET)).text();
      return send(res, 200, cachedWidget, { 'content-type': 'application/javascript' });
    } catch {
      return json(res, 502, { detail: 'could not reach api.botstacks.ai' });
    }
  }

  if (url.pathname === '/widget/config') {
    return json(res, 200, CONFIG);
  }

  if (url.pathname === '/widget/chat') {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return json(res, 200, {
      answer: ANSWER,
      botName: CONFIG.name,
      conversationId: 'mock-conversation',
      sources: [
        { title: 'FanGraphs — wRC+', url: 'https://library.fangraphs.com/offense/wrc/' },
        { title: 'Glossary: park factors', url: 'https://library.fangraphs.com/park-factors/' },
      ],
      handoff: { collect: false, live: false },
    });
  }

  if (url.pathname === '/widget/live/messages') {
    return json(res, 200, { messages: [] });
  }

  return json(res, 404, { detail: 'not found' });
});

server.listen(PORT, () => {
  console.log(`BotStacks preview harness on http://localhost:${PORT}`);
  console.log(`Bot id: ${CONFIG.botId}`);
});
