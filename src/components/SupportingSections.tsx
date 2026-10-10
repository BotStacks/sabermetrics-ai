import { CAPABILITIES, DATA_TYPES } from '../data/content';
import { CheckIcon } from './icons';

export function Capabilities() {
  return (
    <section className="section" id="capabilities" aria-labelledby="capabilities-title">
      <div className="shell">
        <div className="section__head">
          <h2 className="section__title" id="capabilities-title">
            What Sabermetrics AI can answer
          </h2>
          <p className="section__sub">
            Built for the fan who just heard the word &ldquo;wRC+&rdquo; and for the analyst who
            wants the formula behind it.
          </p>
        </div>

        <div className="capabilities">
          {CAPABILITIES.map((capability) => (
            <article className="capability" key={capability.title}>
              <h3 className="capability__title">{capability.title}</h3>
              <p className="capability__desc">{capability.description}</p>
              <ul className="capability__examples">
                {capability.examples.map((example) => (
                  <li className="capability__example" key={example}>
                    {example}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DataTypes() {
  return (
    <section className="section" aria-labelledby="data-title">
      <div className="shell">
        <div className="section__head">
          <h2 className="section__title" id="data-title">
            Data types supported
          </h2>
          <p className="section__sub">
            The assistant answers from the knowledge base connected to it. These are the families of
            baseball data it is designed to reason about.
          </p>
        </div>

        <div className="data-grid">
          {DATA_TYPES.map((item) => (
            <div className="data-row" key={item.label}>
              <span className="data-row__label">{item.label}</span>
              <span className="data-row__detail">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WHY_POINTS = [
  {
    title: 'Answers cite their sources.',
    body: 'When the knowledge base backs an answer, the assistant links the documents it used.',
  },
  {
    title: 'Nothing secret ships to the browser.',
    body: 'The BotStacks web widget is identified by a published bot id alone — no API key, no token, no cookie.',
  },
  {
    title: 'The assistant is the product.',
    body: 'The widget is embedded as the page itself rather than a corner bubble, so the chat is the first and largest thing you see.',
  },
  {
    title: 'Change the bot without redeploying.',
    body: 'Persona, colour, logo and conversation starters come from the BotStacks dashboard at runtime.',
  },
];

export function HowItWorks() {
  return (
    <section className="section" id="how-it-works" aria-labelledby="how-title">
      <div className="shell why">
        <div>
          <h2 className="section__title" id="how-title">
            How it works
          </h2>
          <p className="section__sub" style={{ marginTop: 12 }}>
            Sabermetrics AI is a thin, fast React front end wrapped around a published BotStacks
            assistant. Your question goes to the BotStacks production API, which retrieves from the
            assistant&rsquo;s baseball knowledge base and answers in context.
          </p>
        </div>

        <ul className="why__points">
          {WHY_POINTS.map((point) => (
            <li className="why__point" key={point.title}>
              <CheckIcon />
              <span>
                <strong>{point.title}</strong> {point.body}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
