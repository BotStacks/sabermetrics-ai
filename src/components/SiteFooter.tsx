import { siteConfig } from '../config';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <p>{siteConfig.name} — powered by BotStacks. Not affiliated with Major League Baseball.</p>
        <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
