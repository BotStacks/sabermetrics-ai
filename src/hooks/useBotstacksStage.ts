import { useCallback, useEffect, useRef, useState } from 'react';

import { botstacksConfig } from '../config';
import {
  attachBotstacksWidget,
  BotstacksLoadError,
  detachBotstacksWidget,
  loadBotstacksWidget,
  openBotstacksPanel,
} from '../lib/botstacks';

export type AssistantStatus = 'unconfigured' | 'loading' | 'ready' | 'error';

export interface BotstacksStage {
  stageRef: React.RefObject<HTMLDivElement | null>;
  status: AssistantStatus;
  error: BotstacksLoadError | null;
  retry: () => void;
}

/**
 * Owns the lifecycle of the embedded BotStacks assistant for one stage element.
 */
export function useBotstacksStage(): BotstacksStage {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<AssistantStatus>(
    botstacksConfig.botId ? 'loading' : 'unconfigured',
  );
  const [error, setError] = useState<BotstacksLoadError | null>(null);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!botstacksConfig.botId) {
      setStatus('unconfigured');
      return;
    }

    let cancelled = false;
    let host: HTMLElement | null = null;

    setStatus('loading');
    setError(null);

    loadBotstacksWidget({
      botId: botstacksConfig.botId,
      apiOrigin: botstacksConfig.apiOrigin,
      primaryColor: botstacksConfig.primaryColor,
      textColor: botstacksConfig.textColor,
      fontFamily: botstacksConfig.fontFamily,
      kit: botstacksConfig.kit,
    })
      .then((loaded) => {
        if (cancelled) {
          detachBotstacksWidget(loaded);
          return;
        }

        host = loaded;
        const stage = stageRef.current;
        if (stage) attachBotstacksWidget(loaded, stage);
        loaded.style.display = '';
        openBotstacksPanel();
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof BotstacksLoadError
            ? cause
            : new BotstacksLoadError('script', 'The BotStacks assistant could not be started.'),
        );
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (host) detachBotstacksWidget(host);
    };
  }, [attempt]);

  return { stageRef, status, error, retry };
}
