import { useCallback } from 'react';

import { AssistantStage } from './components/AssistantStage';
import { Hero } from './components/Hero';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { Capabilities, DataTypes, HowItWorks } from './components/SupportingSections';
import { useBotstacksStage } from './hooks/useBotstacksStage';
import { askBotstacks, focusBotstacksComposer } from './lib/botstacks';

export default function App() {
  const { stageRef, status, error, retry } = useBotstacksStage();

  const handlePrompt = useCallback(
    (question: string) => {
      if (!askBotstacks(question)) return;
      focusBotstacksComposer();
      stageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    [stageRef],
  );

  return (
    <>
      <a className="skip-link" href="#assistant">
        Skip to the assistant
      </a>

      <SiteHeader />

      <main id="assistant">
        <section className="shell stage-section" aria-label="Ask Sabermetrics AI">
          <div className="stage-layout">
            <Hero promptsDisabled={status !== 'ready'} onPromptSelect={handlePrompt} />
            <AssistantStage stageRef={stageRef} status={status} error={error} onRetry={retry} />
          </div>
        </section>

        <Capabilities />
        <DataTypes />
        <HowItWorks />
      </main>

      <SiteFooter />
    </>
  );
}
