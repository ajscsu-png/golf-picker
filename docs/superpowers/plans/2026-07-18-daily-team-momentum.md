# Daily Team Momentum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist each participant's primary team total during the current tournament day and render it as an interactive hourly line graph inside the expanded leaderboard row.

**Architecture:** Keep Google Sheets as the only backend by adding an automatically created `TeamScoreHistory` tab. Pure momentum helpers calculate participant totals, Central-time buckets, daily baselines, and SVG coordinates; the score cron persists snapshots, while the leaderboard reads only the current day's history and passes it to a focused client chart component.

**Tech Stack:** Next.js 14 App Router, TypeScript, React, inline responsive SVG, Google Sheets API, Vercel Cron, Node test runner via `tsx`.

---

### Task 1: Define momentum calculations and daily snapshot rules

**Files:**
- Create: `src/lib/teamMomentum.ts`
- Create: `src/lib/teamMomentum.test.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write failing tests for displayed totals, Central-time buckets, carryover, and chart direction**

```ts
test('calculates the same primary total shown on the leaderboard', () => {
  assert.equal(computeDisplayedTeamTotal([
    { totalScore: -4, dropped: false },
    { totalScore: 2, dropped: false },
    { totalScore: 8, dropped: true },
  ]), -2);
});

test('starts Sunday from Saturday closing total', () => {
  const result = buildParticipantSnapshots({
    participantName: 'Wyatt',
    tournamentId: 'open',
    now: new Date('2026-07-19T14:05:00Z'),
    currentTotal: -9,
    earliestTeeTime: '8:00 AM',
    previousSnapshots: [{ localDate: '2026-07-18', teamTotal: -10 }],
  });
  assert.equal(result[0].teamTotal, -10);
  assert.equal(result[0].snapshotType, 'baseline');
});

test('maps better golf scores higher on the y axis', () => {
  const scale = getMomentumYScale([-10, -14, -18], 36, 174);
  assert.ok(scale(-18) < scale(-10));
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx --yes tsx --test src/lib/teamMomentum.test.ts`

Expected: FAIL because `teamMomentum.ts` and its exports do not exist.

- [ ] **Step 3: Add the snapshot type and minimal pure implementation**

```ts
export interface TeamScoreSnapshot {
  tournamentId: string;
  participantName: string;
  localDate: string;
  hourKey: string;
  capturedAt: string;
  teamTotal: number;
  snapshotType: 'baseline' | 'hourly' | 'final';
}

export function computeDisplayedTeamTotal(
  golfers: Array<{ totalScore: number | null; dropped: boolean }>
): number | null {
  const values = golfers
    .filter((golfer) => !golfer.dropped && golfer.totalScore !== null)
    .map((golfer) => golfer.totalScore as number);
  return values.length ? values.reduce((sum, score) => sum + score, 0) : null;
}
```

Implement `getCentralTimeParts`, `parseTeeHour`, `buildParticipantSnapshots`, `dedupeSnapshots`, `getCurrentDaySnapshots`, and `getMomentumYScale` with the exact signatures exercised by the tests. Baselines use the prior local day's last snapshot, hourly keys use `America/Chicago`, and the Y scale maps smaller totals to smaller SVG Y coordinates.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx --yes tsx --test src/lib/teamMomentum.test.ts`

Expected: all momentum calculation tests pass.

- [ ] **Step 5: Commit the pure momentum layer**

```bash
git add src/lib/teamMomentum.ts src/lib/teamMomentum.test.ts src/types/index.ts
git commit -m "feat: calculate daily team momentum"
```

### Task 2: Persist idempotent hourly history in Google Sheets

**Files:**
- Modify: `src/lib/sheets.ts`
- Modify: `src/lib/sheets.test.ts`

- [ ] **Step 1: Write failing row-conversion and logical-upsert tests**

```ts
test('replaces a matching participant hour without duplicating it', () => {
  const existing = [['open', 'Wyatt', '2026-07-19', '2026-07-19T09:00', 'old', '-10', 'hourly']];
  const incoming = snapshot({ capturedAt: 'new', teamTotal: -12 });
  const rows = getRowsWithTeamScoreSnapshots(existing, [incoming]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0][4], 'new');
  assert.equal(rows[0][5], '-12');
});
```

- [ ] **Step 2: Run the Sheets test and verify RED**

Run: `npx --yes tsx --test src/lib/sheets.test.ts`

Expected: FAIL because the history row helpers do not exist.

- [ ] **Step 3: Implement Sheet creation, reading, and upsert**

Add:

```ts
const TEAM_SCORE_HISTORY_HEADER = [
  'tournament_id', 'participant_name', 'local_date', 'hour_key',
  'captured_at', 'team_total', 'snapshot_type',
];

export function getRowsWithTeamScoreSnapshots(
  rows: string[][],
  snapshots: TeamScoreSnapshot[]
): string[][] {
  const key = (row: string[]) => [row[0], row[1], row[2], row[3]].join('\u0000');
  const merged = new Map(rows.map((row) => [key(row), row]));
  for (const snapshot of snapshots) {
    const row = [
      snapshot.tournamentId,
      snapshot.participantName,
      snapshot.localDate,
      snapshot.hourKey,
      snapshot.capturedAt,
      String(snapshot.teamTotal),
      snapshot.snapshotType,
    ];
    merged.set(key(row), row);
  }
  return [...merged.values()];
}

export async function getTeamScoreHistory(tournamentId: string): Promise<TeamScoreSnapshot[]>;
export async function upsertTeamScoreSnapshots(snapshots: TeamScoreSnapshot[]): Promise<void>;
```

`ensureSheetWithHeader('TeamScoreHistory', TEAM_SCORE_HISTORY_HEADER)` must use `spreadsheets.values.get`, create the tab with `spreadsheets.batchUpdate` when the range is missing, tolerate an already-created race, and write the header before the first upsert.

- [ ] **Step 4: Run Sheets and full library tests**

Run: `npx --yes tsx --test src/lib/sheets.test.ts src/lib/*.test.ts`

Expected: all tests pass with no duplicate logical history rows.

- [ ] **Step 5: Commit Sheets persistence**

```bash
git add src/lib/sheets.ts src/lib/sheets.test.ts
git commit -m "feat: persist hourly team scores"
```

### Task 3: Capture history from the score-update workflow

**Files:**
- Create: `src/lib/teamMomentumCapture.ts`
- Create: `src/lib/teamMomentumCapture.test.ts`
- Modify: `src/app/api/cron/update-scores/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write failing orchestration tests**

Test that capture maps picks to ESPN scores with `findScoreForPick`, excludes submitted drops, creates one participant snapshot set, skips null totals, and returns a non-fatal warning if history persistence fails.

```ts
const score = (id: string, totalScore: number, teeTime: string): GolferScore => ({
  tournamentId: 'open', golferEspnId: id, golferName: id.toUpperCase(), position: 'T1',
  totalScore, r1: totalScore, r2: null, r3: null, r4: null,
  thru: 1, teeTime, status: 'active',
});

test('captures every participant without changing score refresh success', async () => {
  const result = await captureTeamMomentum({
    tournamentId: 'open',
    now: new Date('2026-07-19T14:05:00Z'),
    participants: [{ tournamentId: 'open', name: 'Andy', draftPosition: 1 }, { tournamentId: 'open', name: 'Wyatt', draftPosition: 2 }],
    picks: [
      { id: '1', tournamentId: 'open', participantName: 'Andy', golferEspnId: 'a', golferName: 'A', roundNumber: 1, pickNumber: 1 },
      { id: '2', tournamentId: 'open', participantName: 'Wyatt', golferEspnId: 'w', golferName: 'W', roundNumber: 1, pickNumber: 2 },
    ],
    scores: [score('a', -2, '8:00 AM'), score('w', -4, '8:10 AM')],
    cuts: [],
    previousSnapshots: [],
  });
  assert.deepEqual(result.snapshots.map((row) => row.participantName), ['Andy', 'Wyatt']);
});
```

- [ ] **Step 2: Run the focused capture test and verify RED**

Run: `npx --yes tsx --test src/lib/teamMomentumCapture.test.ts`

Expected: FAIL because the capture module does not exist.

- [ ] **Step 3: Implement capture and connect only successful ESPN updates**

`captureTeamMomentum` receives tournament, participants, picks, scores, cuts, prior history, and `now`; it produces snapshots with the pure Task 1 helpers. The cron route fetches participants, picks, cuts, and history after `upsertScores`, persists history in a nested `try/catch`, and still returns refreshed golfer counts if history storage fails.

Change the scheduled trigger to hourly:

```json
{
  "path": "/api/cron/update-scores",
  "schedule": "0 * * * *"
}
```

- [ ] **Step 4: Run capture, route-adjacent, and full library tests**

Run: `npx --yes tsx --test src/lib/teamMomentumCapture.test.ts src/lib/*.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit capture workflow**

```bash
git add src/lib/teamMomentumCapture.ts src/lib/teamMomentumCapture.test.ts src/app/api/cron/update-scores/route.ts vercel.json
git commit -m "feat: capture team momentum hourly"
```

### Task 4: Render the responsive daily line graph

**Files:**
- Create: `src/components/TeamMomentumChart.tsx`
- Modify: `src/components/Leaderboard.tsx`
- Modify: `src/app/leaderboard/[tournamentId]/page.tsx`

- [ ] **Step 1: Extend pure tests for chart points and empty states**

Add tests proving current-day filtering, sorted hourly points, a dashed baseline at the first point, and negative totals mapping upward. Run them before adding the component and confirm they fail for the missing chart-series helper.

- [ ] **Step 2: Implement `TeamMomentumChart`**

The client component accepts `participantName`, `snapshots`, and `today`. It renders:

```tsx
<section aria-label={`${participantName} team momentum today`}>
  <div className="flex justify-between gap-2 flex-wrap">
    <h3>Today's momentum</h3>
    <span>{weekday} · hourly team total</span>
  </div>
  <svg viewBox="0 0 660 250" role="img" aria-label={`${participantName} team score by hour`}>
    <line x1="52" y1={baselineY} x2="635" y2={baselineY} strokeDasharray="4 4" />
    <path d={linePath} fill="none" stroke="currentColor" strokeWidth="3" />
    {points.map((point) => <circle key={point.hourKey} cx={point.x} cy={point.y} r="5" />)}
  </svg>
  <p aria-live="polite">{selectedPointDetail}</p>
</section>
```

Use buttons over or alongside SVG points for native keyboard access, a dynamic padded Y domain, `overflow-visible`, and responsive width. Render approved empty and single-point messages without hiding the golfer table.

- [ ] **Step 3: Pass history into each leaderboard row**

The server leaderboard page loads `getTeamScoreHistory(tournament.id)` alongside scores, filters it to the Central-time current date, and passes snapshots through `LeaderboardToggle` and `Leaderboard`. `Leaderboard` renders the chart above its existing table only inside the expanded participant card.

- [ ] **Step 4: Run tests, lint, and production build**

Run:

```bash
npx --yes tsx --test src/lib/*.test.ts
npm run lint
npm run build
```

Expected: all tests pass, lint has no warnings/errors, and Next.js production build completes.

- [ ] **Step 5: Commit UI integration**

```bash
git add src/components/TeamMomentumChart.tsx src/components/Leaderboard.tsx src/components/LeaderboardToggle.tsx 'src/app/leaderboard/[tournamentId]/page.tsx' src/lib/teamMomentum.ts src/lib/teamMomentum.test.ts
git commit -m "feat: graph daily team momentum"
```

### Task 5: Deploy and verify the real workflow

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run fresh completion gates**

Run `npx --yes tsx --test src/lib/*.test.ts`, `npm run lint`, `npm run build`, and `git diff --check`.

Expected: zero failures, zero lint errors, successful build, and no whitespace errors.

- [ ] **Step 2: Push `main` and wait for Vercel**

Run `git push origin main`, then verify the commit status reports `Deployment has completed` rather than assuming the push is live.

- [ ] **Step 3: Verify production data creation**

Call the authenticated cron path or use the deployed refresh workflow, confirm `TeamScoreHistory` is created automatically, and confirm repeated capture in one participant/hour produces one logical graph point.

- [ ] **Step 4: Browser-test production**

At `https://golf-picker.vercel.app/leaderboard/<active-tournament-id>`:

1. Expand multiple participants.
2. Confirm the graph is above the golfer table.
3. Confirm current-day baseline and points match the primary team total.
4. Confirm better totals are higher.
5. Select points on desktop and a 390x844 mobile viewport.
6. Reload and confirm history persists.

- [ ] **Step 5: Report the live URL and honest verification boundary**

State that pre-deploy hourly history cannot be backfilled. Include the live URL, workflow exercised, expected next clock-hour behavior, and any scheduler limitation discovered during deploy.
