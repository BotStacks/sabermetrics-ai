import type { AssistantStatus } from '../hooks/useBotstacksStage';
import type { BotstacksLoadError } from '../lib/botstacks';
import { StageError, StageLoading, StageUnconfigured } from './StageStates';

interface AssistantStageProps {
  stageRef: React.RefObject<HTMLDivElement | null>;
  status: AssistantStatus;
  error: BotstacksLoadError | null;
  onRetry: () => void;
}

/**
 * The host element for the BotStacks widget.
 *
 * React never renders the conversation itself — the widget's shadow root is
 * moved in here and paints edge-to-edge. These overlays only cover the states
 * that exist before the widget is alive.
 */
export function AssistantStage({ stageRef, status, error, onRetry }: AssistantStageProps) {
  return (
    <div className="stage" ref={stageRef}>
      <h2 className="visually-hidden">Sabermetrics AI assistant</h2>
      {status === 'loading' && <StageLoading />}
      {status === 'error' && <StageError error={error} onRetry={onRetry} />}
      {status === 'unconfigured' && <StageUnconfigured />}
    </div>
  );
}
