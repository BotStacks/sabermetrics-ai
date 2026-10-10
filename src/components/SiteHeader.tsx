import { siteConfig } from '../config';
import { BaseballMark, GithubIcon } from './icons';

export function SiteHeader() {
  return (
    <header className="header">
      <div className="shell header__inner">
        <a className="brand" href="#top" aria-label={`${siteConfig.name} home`}>
          <BaseballMark className="brand__mark" />
          <span>
            Sabermetrics <span className="brand__ai">AI</span>
          </span>
        </a>

        <nav className="nav" aria-label="Primary">
          <a className="nav__link" href="#capabilities">
            About
          </a>
          <a className="nav__link" href="#how-it-works">
            How it works
          </a>
          <a
            className="nav__link nav__link--hide-sm"
            href={siteConfig.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <a
            className="nav__link nav__link--external"
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon />
            <span className="nav__link--hide-sm">GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
