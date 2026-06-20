export interface TournamentFacts {
  course: string;
  location: string;
  par: number;
  yardage: number;
  access: 'Private' | 'Public' | 'Resort';
  founded: number;
  designer: string;
  funFact: string;
}

// Keyed by normalized tournament name (lowercase, no special chars)
const FACTS: Record<string, TournamentFacts> = {
  'the masters': {
    course: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    par: 72,
    yardage: 7510,
    access: 'Private',
    founded: 1934,
    designer: 'Alister MacKenzie & Bobby Jones',
    funFact: 'Members wear green jackets. The winner gets one — but has to give it back after a year.',
  },
  'masters tournament': {
    course: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    par: 72,
    yardage: 7510,
    access: 'Private',
    founded: 1934,
    designer: 'Alister MacKenzie & Bobby Jones',
    funFact: 'Members wear green jackets. The winner gets one — but has to give it back after a year.',
  },
  'pga championship': {
    course: 'Aronimink Golf Club',
    location: 'Newtown Square, PA',
    par: 70,
    yardage: 7394,
    access: 'Private',
    founded: 1896,
    designer: 'Donald Ross',
    funFact: 'Aronimink first hosted the PGA Championship in 1962, when Gary Player won the Wanamaker Trophy.',
  },
  'us open': {
    course: 'Shinnecock Hills Golf Club',
    location: 'Southampton, NY',
    par: 70,
    yardage: 7440,
    access: 'Private',
    founded: 1895,
    designer: 'William Flynn',
    funFact: 'Shinnecock Hills is one of the USGA\'s five founding clubs and is hosting the U.S. Open for the sixth time.',
  },
  'u.s. open': {
    course: 'Shinnecock Hills Golf Club',
    location: 'Southampton, NY',
    par: 70,
    yardage: 7440,
    access: 'Private',
    founded: 1895,
    designer: 'William Flynn',
    funFact: 'Shinnecock Hills is one of the USGA\'s five founding clubs and is hosting the U.S. Open for the sixth time.',
  },
  'the open championship': {
    course: 'Royal Troon Golf Club',
    location: 'Troon, Scotland',
    par: 71,
    yardage: 7385,
    access: 'Private',
    founded: 1860,
    designer: 'Willie Fernie',
    funFact: 'The Open is the oldest of the four majors, dating back to 1860. The winner receives the Claret Jug.',
  },
  'open championship': {
    course: 'Royal Troon Golf Club',
    location: 'Troon, Scotland',
    par: 71,
    yardage: 7385,
    access: 'Private',
    founded: 1860,
    designer: 'Willie Fernie',
    funFact: 'The Open is the oldest of the four majors, dating back to 1860. The winner receives the Claret Jug.',
  },
  'valspar championship': {
    course: 'Innisbrook Resort (Copperhead Course)',
    location: 'Palm Harbor, FL',
    par: 71,
    yardage: 7340,
    access: 'Resort',
    founded: 1987,
    designer: 'Larry Packard',
    funFact: 'The Copperhead course is named after the venomous snake — known for its tight, tree-lined fairways that bite back.',
  },
  'the players championship': {
    course: 'TPC Sawgrass (Stadium Course)',
    location: 'Ponte Vedra Beach, FL',
    par: 72,
    yardage: 7215,
    access: 'Private',
    founded: 1974,
    designer: 'Pete Dye',
    funFact: 'The island green on 17 has swallowed more balls than any other hole in professional golf history.',
  },
  'players championship': {
    course: 'TPC Sawgrass (Stadium Course)',
    location: 'Ponte Vedra Beach, FL',
    par: 72,
    yardage: 7215,
    access: 'Private',
    founded: 1974,
    designer: 'Pete Dye',
    funFact: 'The island green on 17 has swallowed more balls than any other hole in professional golf history.',
  },
  'arnold palmer invitational': {
    course: 'Bay Hill Club & Lodge',
    location: 'Orlando, FL',
    par: 72,
    yardage: 7454,
    access: 'Private',
    founded: 1966,
    designer: 'Dick Wilson (renovated by Arnold Palmer)',
    funFact: 'Arnold Palmer owned Bay Hill. The tournament trophy is a crystal cup — no cutting in line here.',
  },
  'genesis invitational': {
    course: 'Riviera Country Club',
    location: 'Pacific Palisades, CA',
    par: 71,
    yardage: 7322,
    access: 'Private',
    founded: 1929,
    designer: 'George Thomas',
    funFact: 'Riviera is nicknamed "The Riviera of America." Tiger Woods has never won here despite dominating everywhere else.',
  },
  'waste management phoenix open': {
    course: 'TPC Scottsdale (Stadium Course)',
    location: 'Scottsdale, AZ',
    par: 71,
    yardage: 7261,
    access: 'Public',
    founded: 1932,
    designer: 'Tom Weiskopf & Jay Morrish',
    funFact: 'The 16th hole is an amphitheater that holds 20,000 fans. It\'s the loudest hole in golf.',
  },
};

export function getTournamentFacts(name: string): TournamentFacts | null {
  const key = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  // Exact match first
  if (FACTS[key]) return FACTS[key];
  // Partial match
  for (const [k, v] of Object.entries(FACTS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}
