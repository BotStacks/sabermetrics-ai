import type { BotstacksLoadError } from '../lib/botstacks';
import { AlertIcon, SettingsIcon } from './icons';

export function StageLoading() {
  return (
    <div className="stage__state" role="status" aria-live="polite">
      <div className="skeleton">
        <div className="skeleton__header">
          <div className="shimmer shimmer--avatar" />
          <div style={{ display: 'grid', gap: 6, flex: 1, maxWidth: 190 }}>
            <div className="shimmer shimmer--line" style={{ width: '58%' }} />
            <div className="shimmer shimmer--line" style={{ width: '38%', height: 9 }} />
          </div>
        </div>

        <div className="skeleton__body">
          <div className="shimmer shimmer--bubble" style={{ width: 'min(62%, 460px)' }} />
          <div className="shimmer shimmer--bubble-user" style={{ width: 'min(38%, 280px)' }} />
          <div className="shimmer shimmer--bubble" style={{ width: 'min(72%, 540px)', height: 96 }} />
        </div>

        <div className="skeleton__footer">
          <div className="shimmer shimmer--composer" />
        </div>

        <p className="skeleton__caption">
          <span className="spinner" />
          Waking up the assistant…
        </p>
      </div>
    </div>
  );
}

const ERROR_COPY: Record<BotstacksLoadError['reason'], { title: string; body: string }> = {
  script: {
    title: "The assistant didn't load",
    body: 'We could not reach the BotStacks widget. Check your connection, then try again.',
  },
  unavailable: {
    title: 'No published assistant found',
    body: 'BotStacks did not return a published assistant for the configured bot. Publish the assistant in the dashboard, then reload.',
  },
  timeout: {
    title: 'The assistant is taking too long',
    body: 'BotStacks has not responded yet. This is usually temporary.',
  },
};

interface StageErrorProps {
  error: BotstacksLoadError | null;
  onRetry: () => void;
}

export function StageError({ error, onRetry }: StageErrorProps) {
  const copy = ERROR_COPY[error?.reason ?? 'script'];

  return (
    <div className="stage__state" role="alert">
      <div className="stage-message">
        <span className="stage-message__icon">
          <AlertIcon />
        </span>
        <h2 className="stage-message__title">{copy.title}</h2>
        <p className="stage-message__body">{copy.body}</p>
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

export function StageUnconfigured() {
  return (
    <div className="stage__state" role="status">
      <div className="stage-message">
        <span className="stage-message__icon">
          <SettingsIcon />
        </span>
        <h2 className="stage-message__title">Assistant not configured yet</h2>
        <p className="stage-message__body">
          Set <code>VITE_BOTSTACKS_BOT_ID</code> to the public id of a published BotStacks assistant
          and reload. The id is the <code>data-bot</code> value in the embed snippet on the
          assistant&rsquo;s Activate tab.
        </p>
        <p className="stage-message__hint">
          No API key is required — the BotStacks web widget is credential-free.
        </p>
      </div>
    </div>
  );
}
