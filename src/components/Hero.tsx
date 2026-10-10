import { PromptChips } from './PromptChips';
import { ShieldIcon } from './icons';

interface HeroProps {
  promptsDisabled: boolean;
  onPromptSelect: (question: string) => void;
}

export function Hero({ promptsDisabled, onPromptSelect }: HeroProps) {
  return (
    <div className="hero">
      <span className="hero__eyebrow">
        <span className="hero__dot" aria-hidden="true" />
        Powered by BotStacks
      </span>

      <h1 className="hero__title" id="top">
        Your Baseball <em>Analytics Guru</em>
      </h1>

      <p className="hero__lede">
        Ask baseball questions in plain English and get answers grounded in real baseball data and
        analytics.
      </p>

      <div>
        <p className="hero__prompts-label">Try one of these</p>
        <PromptChips disabled={promptsDisabled} onSelect={onPromptSelect} />
      </div>

      <p className="hero__note">
        <ShieldIcon size={15} />
        No sign-up, no API keys. Just ask.
      </p>
    </div>
  );
}
