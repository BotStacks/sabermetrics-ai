import { siteConfig } from '../config';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <p>
          {siteConfig.name} — a BotStacks demonstration. Not affiliated with Major League Baseball.
        </p>
        <nav className="footer__links" aria-label="Footer">
          <a href="#capabilities">About</a>
          <a href="#how-it-works">How it works</a>
          <a href={siteConfig.docsUrl} target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
          <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
