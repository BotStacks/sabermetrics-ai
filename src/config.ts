/**
 * Public site configuration. Every value here is compiled into the browser
 * bundle, so nothing secret belongs in this file.
 */
export const siteConfig = {
  name: 'Sabermetrics AI',
  tagline: 'Your Baseball Analytics Guru',
  githubUrl: (
    import.meta.env.VITE_GITHUB_URL ?? 'https://github.com/BotStacks/sabermetrics-ai'
  ).trim(),
} as const;
