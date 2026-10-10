/** Static examples of the kind of question the assistant is built for. */
export const EXAMPLE_PROMPTS: string[] = [
  'What is WAR?',
  'Explain wRC+ simply',
  'OPS vs wOBA',
  'Compare two players',
];

export interface Capability {
  title: string;
  description: string;
}

export const CAPABILITIES: Capability[] = [
  {
    title: 'Learn advanced baseball metrics',
    description:
      'WAR, wRC+, wOBA, FIP, BABIP — explained in plain English first, with the formula and its assumptions underneath.',
  },
  {
    title: 'Ask across websites, documents and structured data',
    description:
      'One question reaches every source in the knowledge base, whether it is a crawled page, an uploaded document or a table of season stats.',
  },
  {
    title: 'Get answers grounded in your knowledge base',
    description:
      'Responses come from the material you connected, with the sources behind them — not from a model guessing at a box score.',
  },
];

export const DATA_FAMILIES: string[] = [
  'Batting — AVG, OBP, SLG, OPS, wOBA, wRC+, ISO, BABIP',
  'Pitching — ERA, FIP, xFIP, SIERA, K%, BB%, WHIP',
  'Value and fielding — WAR, WPA, DRS, OAA',
  'Batted ball — exit velocity, launch angle, barrel rate',
];

export const HOW_IT_WORKS: string[] = [
  'Connect baseball sources to a BotStacks assistant.',
  'BotStacks indexes them into a searchable knowledge base.',
  'Ask in plain English and get a grounded, cited answer.',
];
