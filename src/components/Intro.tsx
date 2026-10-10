import { EXAMPLE_PROMPTS } from '../data/content';

/**
 * Deliberately short. The widget mount below is the centerpiece, so this only
 * has to say what the product is and show the shape of a good question.
 *
 * The prompt examples are static text, not controls — nothing here is wired to
 * any chat behaviour.
 */
export function Intro() {
  return (
    <div className="intro">
      <div className="intro__copy">
        <h1 className="intro__title" id="top">
          Your Baseball <em>Analytics Guru</em>
        </h1>
        <p className="intro__lede">
          Ask baseball questions in plain English and explore advanced baseball analytics through
          real data and knowledge.
        </p>
      </div>

      <ul className="examples" aria-label="Example questions">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li className="examples__item" key={prompt}>
            {prompt}
          </li>
        ))}
      </ul>
    </div>
  );
}
