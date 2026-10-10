import { EXAMPLE_PROMPTS } from '../data/content';
import { ArrowRight } from './icons';

interface PromptChipsProps {
  disabled: boolean;
  onSelect: (question: string) => void;
}

export function PromptChips({ disabled, onSelect }: PromptChipsProps) {
  return (
    <ul className="chips" aria-label="Example questions">
      {EXAMPLE_PROMPTS.map((prompt) => (
        <li key={prompt.question}>
          <button
            type="button"
            className="chip"
            disabled={disabled}
            onClick={() => onSelect(prompt.question)}
            title={prompt.question}
          >
            {prompt.label}
            <ArrowRight className="chip__arrow" />
          </button>
        </li>
      ))}
    </ul>
  );
}
