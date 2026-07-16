# Completed Tournament Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a completed-tournament-only Stats page with separate Single/Snake performance and zero-sum pool winnings.

**Architecture:** Final tournament standings are snapshotted into an immutable Google Sheets `Results` tab. Pure TypeScript helpers calculate final pool ranks and aggregate per-person stats; `/stats` renders only archived result rows and never reads active tournament data.

**Tech Stack:** Next.js 14 App Router, TypeScript, React, Tailwind CSS, Google Sheets API, Node test runner, Vercel.

---

### Task 1: Final-result and payout calculations

**Files:**
- Create: `src/lib/stats.ts`
- Create: `src/lib/stats.test.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write failing tests for aggregate stats and payouts**

Define finalized rows for two tournaments and assert that `aggregateParticipantStats()` returns separate Single/Snake wins and average ranks, gross payouts, net balances, completed tournament count, tie-payout splitting, and a zero-sum net total.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test src/lib/stats.test.ts`

Expected: FAIL because `src/lib/stats.ts` does not exist.

- [ ] **Step 3: Implement finalized-result types and aggregation**

Add `PoolType`, `FinalizedResult`, `PoolStats`, and `ParticipantStats` types. Implement:

```ts
export function aggregateParticipantStats(results: FinalizedResult[]): {
  participants: ParticipantStats[];
  completedTournamentCount: number;
}
```

For every tournament/pool group, charge each non-winner `$10`, split their combined contributions evenly among rank-one rows, then sort participants by net descending, gross descending, total wins descending, and name.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test src/lib/stats.test.ts`

Expected: all stats tests pass.

- [ ] **Step 5: Commit calculation helpers**

```bash
git add src/types/index.ts src/lib/stats.ts src/lib/stats.test.ts
git -c commit.gpgsign=false commit -m "feat: calculate completed pool stats"
```

### Task 2: Finalize Single and Snake tournament standings

**Files:**
- Create: `src/lib/finalizeResults.ts`
- Create: `src/lib/finalizeResults.test.ts`

- [ ] **Step 1: Write failing tests for final pool rows**

Create fixtures containing round-zero picks, six snake picks, normalized odds-backed IDs, two explicit drops, missing drops, and tied totals. Assert that `buildFinalizedResults()` creates one Single and one Snake result per participant, applies best-four snake scoring when two cuts are required, and assigns competition ranks with ties.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test src/lib/finalizeResults.test.ts`

Expected: FAIL because `src/lib/finalizeResults.ts` does not exist.

- [ ] **Step 3: Implement the pure finalizer**

Implement:

```ts
export function buildFinalizedResults(input: {
  tournament: Tournament;
  participants: Participant[];
  picks: Pick[];
  scores: GolferScore[];
  cuts: Cut[];
  finalizedAt: string;
}): FinalizedResult[]
```

Use `findScoreForPick()` for normalized matching. Single uses round `0`. Snake uses rounds above `0`, removes explicit drops, and excludes the worst remaining scores until exactly `picksPerPerson - cutsPerPerson` snake scores count. Reject incomplete participant pools instead of silently archiving partial results.

- [ ] **Step 4: Run both calculation suites and confirm GREEN**

Run: `node --test src/lib/finalizeResults.test.ts src/lib/stats.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit finalization logic**

```bash
git add src/lib/finalizeResults.ts src/lib/finalizeResults.test.ts
git -c commit.gpgsign=false commit -m "feat: finalize single and snake results"
```

### Task 3: Persist immutable result snapshots

**Files:**
- Modify: `src/lib/sheets.ts`
- Modify: `src/lib/sheets.test.ts`
- Modify: `src/app/api/tournaments/[id]/route.ts`

- [ ] **Step 1: Write failing row-mapping and idempotency tests**

Assert that `getFinalizedResultRows()` emits the exact `Results` column order and `replaceTournamentResultRows()` removes old rows for the same tournament before appending replacements.

- [ ] **Step 2: Run Sheets tests and confirm RED**

Run: `node --test src/lib/sheets.test.ts`

Expected: FAIL because the Results row helpers do not exist.

- [ ] **Step 3: Add Results persistence**

Add the header:

```ts
const RESULTS_HEADER = [
  'tournament_id', 'tournament_name', 'year', 'pool_type',
  'participant_name', 'rank', 'total_score', 'finalized_at',
];
```

Implement `getFinalizedResults()`, pure row helpers, `replaceTournamentResults()`, and `finalizeTournamentResults(tournamentId)`. Update `updateTournament()` so a transition to `completed` archives results before changing status. Update `setActiveTournament()` so any previously active tournament is archived before being demoted to completed. Update the PATCH route to return a clear 400 response when finalization is blocked by incomplete scores.

- [ ] **Step 4: Run persistence and finalization tests**

Run: `node --test src/lib/sheets.test.ts src/lib/finalizeResults.test.ts src/lib/stats.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit Results persistence**

```bash
git add src/lib/sheets.ts src/lib/sheets.test.ts 'src/app/api/tournaments/[id]/route.ts'
git -c commit.gpgsign=false commit -m "feat: archive completed tournament results"
```

### Task 4: Build the unified responsive Stats page

**Files:**
- Modify: `src/app/stats/page.tsx`
- Create: `src/components/StatsLeaderboard.tsx`

- [ ] **Step 1: Replace mixed live-data aggregation with finalized results**

Make `/stats` call `getFinalizedResults()` and `aggregateParticipantStats()`. Render nothing from draft or active tournament rows.

- [ ] **Step 2: Build summary cards and desktop leaderboard**

Render Money Leader, Single Golfer Leader, and Snake Draft Leader cards plus a net-sorted table with Player, Single wins/average finish, Snake wins/average finish, Gross, and Net.

- [ ] **Step 3: Add the mobile participant-card layout**

At narrow widths, hide the desktop table and render one compact card per participant with the same statistics. Format currency with explicit `+`/`−` signs and average ranks with one decimal place.

- [ ] **Step 4: Run lint and build**

Run: `npm run lint && npm run build`

Expected: both commands exit 0.

- [ ] **Step 5: Commit the UI**

```bash
git add src/app/stats/page.tsx src/components/StatsLeaderboard.tsx
git -c commit.gpgsign=false commit -m "feat: add completed tournament stats leaderboard"
```

### Task 5: Seed verified historical results and deploy

**Files:**
- Modify: Google Sheet `Golf Tournament Picker`, new tab `Results!A1:H33`

- [ ] **Step 1: Create the Results tab and seed verified rows**

Create `Results` with the eight-column header and 32 rows: eight participants for Single and Snake across the completed 2026 PGA Championship and 2026 U.S. Open. Do not add Masters or The Open.

- [ ] **Step 2: Verify the live Sheet seed**

Read `Results!A1:H33`, confirm 33 total rows including the header, exactly two tournament IDs, exactly two pool types, and eight participants in each tournament/pool group.

- [ ] **Step 3: Run the complete local verification suite**

Run: `node --test src/lib/*.test.ts && npm run lint && npm run build`

Expected: all tests pass, lint exits 0, and the production build exits 0.

- [ ] **Step 4: Push main and wait for Vercel**

```bash
git push origin main
```

Confirm the deployment for the pushed commit reaches `READY`.

- [ ] **Step 5: Verify the deployed user experience**

Open `https://golf-picker.vercel.app/stats` in a real browser. Verify the completed-tournament count, participant ordering, summary leaders, gross/net values, desktop table, and mobile cards. Confirm active The Open data is absent and the Net column sums to `$0`.

