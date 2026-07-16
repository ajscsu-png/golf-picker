# Stats Money Roasts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a ruthless, personalized money-loser joke rotation on `/stats` while preserving the existing jokes everywhere else.

**Architecture:** Put the Stats-only joke pool and route-selection helper in a pure TypeScript module so route behavior can be unit tested. Keep `GolfJoke` as the single banner component and select its joke pool with Next.js `usePathname()`.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Node test runner.

---

### Task 1: Route-specific joke selection

**Files:**
- Create: `src/lib/statsMoneyRoasts.ts`
- Create: `src/lib/statsMoneyRoasts.test.ts`

- [ ] **Step 1: Write the failing route-selection test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { getJokePool, STATS_MONEY_ROASTS } from './statsMoneyRoasts.ts';

test('uses money roasts only on the Stats route', () => {
  const normal = ['normal joke'];
  assert.equal(getJokePool('/stats', normal), STATS_MONEY_ROASTS);
  assert.equal(getJokePool('/', normal), normal);
  assert.equal(getJokePool('/leaderboard/tournament', normal), normal);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/lib/statsMoneyRoasts.test.ts`

Expected: FAIL because `statsMoneyRoasts.ts` does not exist.

- [ ] **Step 3: Add the brutal joke collection and selector**

Create `STATS_MONEY_ROASTS` with personalized jokes about Bill, Brad, Connor, Kyle, and Wyatt having `$0` gross winnings. Export:

```ts
export function getJokePool(pathname: string, normalJokes: readonly string[]): readonly string[] {
  return pathname === '/stats' ? STATS_MONEY_ROASTS : normalJokes;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/lib/statsMoneyRoasts.test.ts`

Expected: 1 passing test and 0 failures.

### Task 2: Wire the route-aware banner

**Files:**
- Modify: `src/components/GolfJoke.tsx`

- [ ] **Step 1: Select the route-specific pool**

Import `usePathname`, `getJokePool`, and `STATS_MONEY_ROASTS`. Initialize with a Stats roast on `/stats`, preserve the first existing joke elsewhere, and select a random joke from the active pool in the existing effect.

- [ ] **Step 2: Verify the complete codebase**

Run: `node --test src/lib/*.test.ts && npm run lint && npm run build`

Expected: all tests pass; lint and build exit 0.

- [ ] **Step 3: Verify the real routes in a browser**

Open `/stats` and confirm its banner contains a `$0`-winnings roast. Open `/` and confirm its banner still comes from the existing general-golf collection.

- [ ] **Step 4: Commit and deploy**

```bash
git add src/lib/statsMoneyRoasts.ts src/lib/statsMoneyRoasts.test.ts src/components/GolfJoke.tsx
git -c commit.gpgsign=false commit -m "feat: roast winless players on stats page"
git push origin main
```

Confirm Vercel succeeds and repeat the two-route browser verification against `https://golf-picker.vercel.app`.
