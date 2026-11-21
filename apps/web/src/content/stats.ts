// VERIFY before publishing: confirm each figure and wording against its source.
// Tone: we partner with government agencies and service organizations. State the
// opportunity and how we help; never blame service members, veterans or agencies.

export interface Stat {
  id: string;
  /** Large figure shown on the card. */
  figure: string;
  text: string;
  source: { name: string; title: string; url: string };
}

const GAO_TAP = {
  name: "GAO",
  title: "GAO-24-107083: Servicemember Transition Assistance Program",
  url: "https://gao.gov/products/gao-24-107083",
};

export const STATS: Stat[] = [
  {
    id: "leaving",
    figure: "200,000+",
    text: "More than 200,000 service members make the move to civilian life each year.",
    source: {
      name: "DAV",
      title: "Back to civilian life: the resources transitioning veterans are owed (2024)",
      url: "https://www.dav.org/learn-more/news/2024/back-to-civilian-life-the-resources-transitioning-veterans-are-owed/",
    },
  },
  {
    id: "one-year",
    figure: "1 year",
    text: "Transition help is designed to start more than a year before leaving the military.",
    source: GAO_TAP,
  },
  {
    id: "head-start",
    figure: "~70%",
    text: "About 70% started later than that. A clear plan makes an earlier start easier.",
    source: GAO_TAP,
  },
];

/** Each source once, in first-cited order (two stats share the GAO report). */
export const STAT_SOURCES = STATS.map((s) => s.source).filter((src, i, all) => all.findIndex((o) => o.url === src.url) === i);
