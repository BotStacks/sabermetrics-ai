export interface ExamplePrompt {
  /** Short label for the chip. */
  label: string;
  /** The full question actually sent to the assistant. */
  question: string;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  { label: 'What is WAR?', question: 'What is WAR?' },
  {
    label: 'Explain wRC+ simply',
    question: "Explain wRC+ like I'm new to baseball.",
  },
  {
    label: 'OPS vs wOBA',
    question: 'What is the difference between OPS and wOBA?',
  },
  { label: 'Why BABIP matters', question: 'Why does BABIP matter?' },
  { label: 'Read a 125 wRC+', question: 'What does a wRC+ of 125 mean?' },
  {
    label: 'Compare two players',
    question: 'Compare two players using the available data.',
  },
];

export interface Capability {
  title: string;
  description: string;
  examples: string[];
}

export const CAPABILITIES: Capability[] = [
  {
    title: 'Plain-English definitions',
    description:
      'Every stat explained twice — once for someone new to the sport, once with the formula and the assumptions behind it.',
    examples: ['What is WAR?', 'Explain wRC+ simply', 'What counts as a quality start?'],
  },
  {
    title: 'Metric comparisons',
    description:
      'Where two stats overlap, where they disagree, and which one answers the question you are actually asking.',
    examples: ['OPS vs wOBA', 'FIP vs ERA', 'xwOBA vs wOBA'],
  },
  {
    title: 'Reading a number',
    description:
      'League baselines and context, so a raw figure turns into a judgement you can defend.',
    examples: ['What does a 125 wRC+ mean?', 'Is a .310 BABIP high?', 'How good is 4.0 WAR?'],
  },
  {
    title: 'Player and leaderboard questions',
    description:
      'Side-by-side comparisons and category leaders, answered from the dataset the assistant has been given.',
    examples: ['Compare two players', 'Who leads in wRC+?', 'Best strikeout rate available?'],
  },
];

export interface DataType {
  label: string;
  detail: string;
}

export const DATA_TYPES: DataType[] = [
  { label: 'Batting', detail: 'AVG, OBP, SLG, OPS, wOBA, wRC+, ISO, BABIP' },
  { label: 'Pitching', detail: 'ERA, FIP, xFIP, SIERA, K%, BB%, WHIP' },
  { label: 'Value', detail: 'WAR, WPA, Win Shares, run expectancy' },
  { label: 'Batted ball', detail: 'Exit velocity, launch angle, hard-hit rate, barrels' },
  { label: 'Fielding', detail: 'DRS, UZR, OAA, framing runs' },
  { label: 'Concepts', detail: 'Regression, sample size, park and league adjustments' },
];
