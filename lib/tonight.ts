/** Shared by the /tonight server page and its client form (constants can't cross a "use client" boundary). */
export type TonightValues = { minutes: number; genre: string; type: string; min: number; all: boolean };

export const TIMES = [
  { m: 30, label: "30 min" },
  { m: 60, label: "1 hour" },
  { m: 120, label: "2 hours" },
  { m: 180, label: "3 hours" },
  { m: 300, label: "5 hours" },
  { m: 600, label: "A whole weekend day" },
];
