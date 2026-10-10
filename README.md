# Sabermetrics AI

The website that will frame the BotStacks full-screen assistant for baseball analytics.

**Status: design only.** The page is built and responsive, but the BotStacks widget is not wired up
yet — the site reserves a large, visually dominant area for it and nothing more. There is no chat
UI in this repo.

React · TypeScript · Vite.

---

## Quick start

```bash
npm install
npm run dev
npm run build
```

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Vite dev server                             |
| `npm run build`     | Type-check (`tsc -b`) then production build |
| `npm run preview`   | Serve the production build locally          |
| `npm run typecheck` | Types only                                  |

---

## Where the BotStacks widget mounts

[`src/components/BotStacksWidgetMount.tsx`](./src/components/BotStacksWidgetMount.tsx) reserves the
centerpiece of the page and exposes one stable mounting point:

```html
<div id="botstacks-widget-root"></div>
```

It is absolutely positioned to `inset: 0` inside the stage, so whatever the widget renders into it
fills 100% of the width and height with no further layout work. The stage is sized to
`min(68svh, 760px)` on desktop and grows to fill the remainder of the first viewport.

When the integration lands, the only cleanup required is deleting the placeholder paragraph:

```tsx
<p className="widget-mount__placeholder">BotStacks Full-Screen Widget Mount</p>
```

The component intentionally contains no integration code, no transport, and no chat markup.

---

## Page structure

```
header         Sabermetrics AI · About · How It Works · Data
intro          heading, one supporting line, four static example questions
widget mount   the reserved full-screen BotStacks area  ← the centerpiece
about          three capabilities
details        how it works · data families
footer
```

The example questions under the intro are plain `<li>` text. They are illustrative only and are not
wired to any behaviour.

## Project layout

```
src/
  App.tsx                          page composition
  config.ts                        public site config
  components/
    BotStacksWidgetMount.tsx       the reserved widget area
    Intro.tsx  SiteHeader.tsx  SupportingSections.tsx  SiteFooter.tsx  icons.tsx
  data/content.ts                  copy and example questions
  styles/base.css                  design tokens, reset
  styles/app.css                   layout
```

## Deployment

`dist/` is plain static output, suitable for any static host. Hosting is not configured yet.
