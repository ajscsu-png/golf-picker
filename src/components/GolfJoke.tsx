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
];

export default function GolfJoke() {
  const [joke] = useState(() => JOKES[Math.floor(Math.random() * JOKES.length)]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-800 italic text-center">
      ⛳ {joke}
    </div>
  );
}
