// VERIFY before publishing: confirm each figure and wording against its source.

export interface Stat {
  id: string;
  /** Large figure shown on the card. */
  figure: string;
  text: string;
  source: { name: string; title: string; url: string };
}

export const STATS: Stat[] = [
  {
    id: "leaving",
    figure: "200,000+",
    text: "More than 200,000 service members leave the military each year.",
    source: {
      name: "DAV",
      title: "Back to civilian life: the resources transitioning veterans are owed (2024)",
      url: "https://www.dav.org/learn-more/news/2024/back-to-civilian-life-the-resources-transitioning-veterans-are-owed/",
    },
  },
  {
    id: "class",
    figure: "1 in 4",
    text: "Nearly 1 in 4 service members required to attend the 2-day transition class didn't attend.",
    source: {
      name: "GAO",
      title: "GAO-24-107083: Servicemember Transition Assistance Program",
      url: "https://gao.gov/products/gao-24-107083",
    },
  },
  {
    id: "planning",
    figure: "~70%",
    text: "About 70% didn't start transition planning a year before separating.",
    source: {
      name: "GAO",
      title: "GAO-24-107083: Servicemember Transition Assistance Program",
      url: "https://gao.gov/products/gao-24-107083",
    },
  },
];
