export const STATS_MONEY_ROASTS = [
  "Bill has $0 in winnings and two second-place finishes. He's the human version of 'almost' — except 'almost' occasionally gets paid.",
  "Bill's gross winnings are $0. His golf résumé is just a list of people he helped fund.",
  "Bill keeps knocking on the door of victory. Victory turned off the lights and is pretending nobody's home.",
  "Brad has earned $0. If confidence were cash he'd be rich, but unfortunately we pay for wins, not unsolicited swing analysis.",
  "Brad's trophy case has incredible airflow. Not a single object in there to block the breeze.",
  "Brad has the financial instincts of a man who sees Andy's name and thinks, 'Yeah, I'll bet against that again.'",
  "Connor isn't playing a golf pool. He's subscribed to Andy Premium at $10 per tournament.",
  "Connor has more letters in his name than dollars in career winnings. It isn't close.",
  "Connor's $0 gross proves one thing: you can draft golfers without ever threatening the people who drafted well.",
  "Kyle keeps bringing up an untracked Masters win like a divorced guy showing everyone his wedding photos. On this board: $0.",
  "Kyle's career earnings on the tracked board are $0. Even his nostalgia has to cover the bar tab.",
  "Kyle has a previous-champion badge and no tracked winnings. That's a crown from Burger King, buddy.",
  "Wyatt has paid $40 to watch other men succeed. That's not competition; that's a humiliation kink with a scorecard.",
  "Wyatt's net is −$40 and his gross is $0. The money didn't disappear — it just found people better at golf pools.",
  "Wyatt is proof that Venmo needs a 'stop funding your friends' warning.",
  "Five men have won $0. Together they form the strongest support group Andy never had to ask for.",
  "The $0 club has no membership dues. They already paid them directly to the winners.",
  "Some people chase greatness. Bill, Brad, Connor, Kyle, and Wyatt chase Venmo requests.",
  "This leaderboard has three competitors and five recurring payment methods.",
  "If losing money were a draft format, the $0 club would finally have something to celebrate.",
] as const;

export function getJokePool(pathname: string, normalJokes: readonly string[]): readonly string[] {
  return pathname === '/stats' ? STATS_MONEY_ROASTS : normalJokes;
}
