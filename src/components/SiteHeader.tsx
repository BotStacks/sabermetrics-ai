import { BaseballMark } from './icons';

export function SiteHeader() {
  return (
    <header className="header">
      <div className="shell header__inner">
        <a className="brand" href="#top" aria-label="Sabermetrics AI home">
          <BaseballMark className="brand__mark" />
          <span>
            Sabermetrics <span className="brand__ai">AI</span>
          </span>
        </a>

        <nav className="nav" aria-label="Primary">
          <a className="nav__link" href="#about">
            About
          </a>
          <a className="nav__link" href="#how-it-works">
            How It Works
          </a>
          <a className="nav__link" href="#data">
            Data
          </a>
        </nav>
      </div>
    </header>
  );
}
