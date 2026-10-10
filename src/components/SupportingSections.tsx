import { CAPABILITIES, DATA_FAMILIES, HOW_IT_WORKS } from '../data/content';

export function Capabilities() {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="shell">
        <h2 className="section__title" id="about-title">
          What it does
        </h2>
        <div className="capabilities">
          {CAPABILITIES.map((capability) => (
            <article className="capability" key={capability.title}>
              <h3 className="capability__title">{capability.title}</h3>
              <p className="capability__desc">{capability.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Details() {
  return (
    <section className="section section--details" aria-label="How it works and supported data">
      <div className="shell details">
        <div id="how-it-works">
          <h2 className="section__title">How it works</h2>
          <ol className="details__list details__list--steps">
            {HOW_IT_WORKS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div id="data">
          <h2 className="section__title">Data</h2>
          <ul className="details__list">
            {DATA_FAMILIES.map((family) => (
              <li key={family}>{family}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
