/**
 * Stylesheet injected into the BotStacks widget's shadow root.
 *
 * The shipped widget always renders the same DOM (backdrop, corner launcher,
 * floating panel) and only swaps a `kit-*` class on `.root` to position it. The
 * dashboard's Bot Design setting can also replace the kit at runtime via
 * `/widget/config`, so these rules neutralise the positioning for *every* kit
 * instead of relying on `kit-full` being the one that loads.
 *
 * Nothing here changes the widget's behaviour — only where it is painted. The
 * widget's own markup, chat transport, markdown renderer, copy buttons,
 * citations, handoff cards and live-agent polling are all left untouched.
 */
export const BOTSTACKS_STAGE_STYLES = `
/* Fill the host element we relocated the widget into. */
:host {
  contain: layout paint;
}

.root,
.root.kit-bubble,
.root.kit-full,
.root.kit-search,
.root.kit-sidebar,
.root.kit-popup,
.root.kit-tab {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: auto !important;
}

/* The page itself is the chat surface: no scrim, no corner launcher. */
.root .backdrop,
.root .bubble,
.root .tease,
.root .search-launch,
.root .hdr-close {
  display: none !important;
}

/* Dock the floating panel to the stage, in every kit and at every breakpoint. */
.root .panel,
.root .panel.open,
.root.open .panel,
.root.kit-full .panel,
.root.kit-full .panel.open,
.root.kit-search .panel,
.root.kit-search .panel.open,
.root.kit-sidebar .panel,
.root.kit-sidebar .panel.open,
.root.kit-popup .panel,
.root.kit-popup .panel.open,
.root.kit-tab .panel,
.root.kit-tab .panel.open {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  transform: none !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  transition: none !important;
}

/* ---- Scale the chat chrome up for a full-height canvas ---- */

.root .header {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.015);
}

.root .avatar {
  width: 34px;
  height: 34px;
}

.root .name {
  font-size: 15px;
}

.root .log {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 20px 8px;
  gap: 18px;
  scrollbar-width: thin;
  overscroll-behavior: contain;
}

/* A tall stage leaves the opening greeting stranded at the top. Pushing the
   first row down sits the conversation above the composer and collapses to 0
   as soon as the thread is long enough to scroll — unlike justify-content,
   which clips overflowing content at the top. */
.root .log > *:first-child {
  margin-top: auto;
}

/* Stock rows bottom-align the avatar, which drops it below the bubble once a
   copy button or citation row is attached. Top-align reads as a chat thread. */
.root .msg-row.bot,
.root .msg-row.error {
  align-items: flex-start;
}

.root .msg-row.bot .msg-avatar,
.root .msg-row.error .msg-avatar {
  margin-top: 2px;
}

/* Long answers: cap the measure so text stays readable on a wide stage. */
.root .msg {
  max-width: min(76%, 68ch);
  font-size: 15px;
  line-height: 1.62;
  padding: 12px 18px;
}

.root .msg-stack {
  max-width: min(82%, 72ch);
}

.root .msg.bot {
  border-radius: 16px;
  border-top-left-radius: 6px;
}

.root .msg-code-block code {
  font-size: 12.5px;
}

.root .suggest {
  padding: 0 0 0 40px;
  gap: 8px;
}

.root .suggest-chip {
  font-size: 13px;
}

.root .form {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 12px 20px 8px;
  border-top: 0;
}

.root .composer {
  padding: 10px 14px 10px 18px;
  border-radius: 14px;
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.root .input {
  font-size: 15px;
  max-height: 168px;
}

.root .send {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.root .talk {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding: 0 20px 16px;
  justify-content: center;
}

/* Full-bleed at this width it reads as an empty toolbar; shrink to a link. */
.root .talk button {
  width: auto;
  font-size: 12px;
  padding: 6px 12px;
  background: transparent;
  border-color: transparent;
  color: rgba(255, 255, 255, 0.42);
}

.root .talk button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  transform: none;
}

.root .handoff {
  max-width: min(82%, 60ch);
}

@media (max-width: 720px) {
  .root .log {
    padding: 16px 14px 6px;
    gap: 14px;
  }

  .root .msg {
    max-width: 88%;
    font-size: 14.5px;
  }

  .root .msg-stack {
    max-width: 92%;
  }

  .root .suggest {
    padding-left: 40px;
  }

  .root .form {
    padding: 10px 14px 6px;
  }

  .root .talk {
    padding: 0 14px 12px;
  }
}
`;
