'use client';

import { useState } from 'react';

const JOKES = [
  "Why do golfers carry an extra pair of pants? In case they get a hole in one.",
  "What do you call a wizard who's great at golf? Harry Putter.",
  "Why did the golfer bring an extra pair of socks? In case he got a hole in one.",
  "Golf is the only sport where the objective is to play as little as possible.",
  "What's a golfer's favorite letter? Tee.",
  "Why do golfers hate cake? Because they might get a slice.",
  "What do you call a monkey who wins the Masters? The chimpion.",
  "Why did the golfer get a new driver? His old one wasn't iron-ic enough.",
  "I'm reading a great book about golf. It's a real page-turner — just like my scorecard.",
  "Golf is a lot like taxes: you go for the green and wind up in the hole.",
  "What did the golfer name his son? Chip.",
  "Why do golfers make bad employees? They're always trying to get out of the office.",
  "Golf tip: aim for the fairway. Or the parking lot — same result.",
  "I asked my caddie what club to use. He said the one that gets me closest to the bar.",
  "Golf is a 5-mile walk punctuated by disappointment.",
];

export default function GolfJoke() {
  const [joke] = useState(() => JOKES[Math.floor(Math.random() * JOKES.length)]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-800 italic text-center">
      ⛳ {joke}
    </div>
  );
}
