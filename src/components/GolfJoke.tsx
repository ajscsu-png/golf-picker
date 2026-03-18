'use client';

import { useState } from 'react';

const JOKES = [
  "Golf is like sex — you don't have to be good at it to enjoy it.",
  "Why do golfers make great lovers? They know how to use their wood and they're not afraid to lay up.",
  "What do golf and sex have in common? You don't have to be good to enjoy it, but a hole in one is always celebrated.",
  "My golf game is like my sex life — lots of strokes, rarely in the hole.",
  "Why did the golfer's wife leave him? He spent too much time at the back nine and not enough at home.",
  "Golf tip: grip it like you mean it, but don't choke — same advice works in the bedroom.",
  "A bad day of golf still beats a good day at work. A bad night in bed does not.",
  "Why do golfers always want to play 18? Because 9 holes just leaves everyone unsatisfied.",
  "My therapist told me to try harder. My caddie said the same thing. Neither helped.",
  "Golf: the only sport where you brag about how few times you went in.",
  "Why don't golfers shower before a round? Because they know they'll be in the rough later anyway.",
  "I told my wife I was going to play with my balls all day. She said fine, just clean up after yourself.",
  "What's the difference between a golfer and a skydiver? A skydiver doesn't regret his holes.",
  "My doctor said I need to watch my stroke count. So does my wife.",
  "Golf is the only time it's acceptable for a man to moan about his shaft.",
  "Why do golfers make terrible husbands? They always pull out their wood at the wrong time.",
  "I finally got a hole in one. My wife said 'that's what she said.'",
  "My caddie told me to keep my head down and follow through. Same advice my ex gave me.",
  "Golf is like marriage — you spend a lot of money, curse a lot, and still end up in a bad lie.",
  "What's a golfer's idea of a perfect date? 18 holes, a cold beer, and someone who doesn't talk.",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one and needed a clean pair.",
  "I asked my wife if she wanted to come watch me golf. She said she'd rather watch paint dry. Same pace, she said.",
  "The key to a great golf swing is the same as the key to great sex — rhythm, timing, and not thinking about your ex.",
  "My ball went into the rough and I couldn't find it for 20 minutes. My wife has been in there for years.",
  "Why do golfers hate blind dates? Too many bad lies.",
  "A golfer walks into a bar and orders a double. The bartender says 'you've been playing today, huh?'",
  "Golf and marriage: both involve a lot of lying about how many strokes it took.",
  "My golf score and my age have the same thing in common — I lie about both.",
  "Why did the golfer get arrested? He kept pulling out his wood in public.",
  "My playing partner said he was going to play his balls off today. His wife overheard and seemed relieved.",
  "A good golf swing is hard to find. So is a good plumber. About the same cost too.",
  "Golf courses have 19 holes if you count the bar. That's the only one I ever par.",
  "My caddie said 'sir, you've improved so much.' I said 'really?' He said 'yes, last year you were terrible.'",
  "I shot a 68 today. Tomorrow I'll try the second hole.",
  "Golf is 90% mental and 10% mental.",
  "Why do golfers always carry a spare ball? In case they get a hole in one and want to keep going.",
  "My handicap is that I actually have to play sober.",
  "Wife: 'You love golf more than me.' Husband: 'Yes, but I love you more than tennis.'",
  "What's the difference between a bad golfer and a bad skydiver? One says 'whack... damn.' The other says 'damn... whack.'",
  "I used to be a terrible golfer. Then I realized lying about my score is just called a handicap.",
  "Golf is a walk in the park ruined by the fact that you have to keep track of everything.",
  "Why did the golfer wear two jackets? In case he got a hole in one and caught a chill.",
  "My golf instructor said I had a natural swing. He didn't say which direction.",
  "The perfect round of golf: great weather, fast greens, cold beer, and your phone dies on hole 2.",
  "I'm not saying I cheat at golf, but my scorecard has more fiction than a Stephen King novel.",
  "Golf: the art of playing fetch with yourself.",
  "What do you call a golfer who keeps losing balls? Divorced.",
  "My wife gave me an ultimatum — her or golf. I sure do miss her.",
  "Golf is like a bad habit — expensive, time-consuming, and everyone judges you for it.",
  "Why is golf the perfect sport? Four hours of outdoor drinking with occasional exercise.",
];

export default function GolfJoke() {
  const [joke] = useState(() => JOKES[Math.floor(Math.random() * JOKES.length)]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-800 italic text-center">
      ⛳ {joke}
    </div>
  );
}
