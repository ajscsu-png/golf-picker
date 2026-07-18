# Daily Team Momentum Design

## Goal

Add a line graph inside each participant's expanded leaderboard row so the pool can see whether that team is gaining or losing shots during the current tournament day.

## Approved Behavior

- Plot the participant's primary displayed team total, not the projected post-cut total.
- Better scores move upward on the Y axis; worse scores move downward.
- Show only the current day in the `America/Chicago` timezone.
- Carry the cumulative tournament total into each new day. If a team ends Saturday at `-10`, its Sunday baseline is `-10`.
- Start the graph in the clock-hour bucket containing that participant's first non-dropped golfer tee time for the day.
- Add subsequent snapshots on clock hours.
- Keep the existing golfer table directly below the graph.
- Selecting an hourly point shows its time, team total, and change during the day.

## Data Model

Add a `TeamScoreHistory` Google Sheet tab with these columns:

| Column | Meaning |
|---|---|
| `tournament_id` | Stable tournament identifier |
| `participant_name` | Participant whose displayed total was captured |
| `local_date` | Tournament day in `America/Chicago`, formatted `YYYY-MM-DD` |
| `hour_key` | Clock-hour bucket in ISO format |
| `captured_at` | Actual UTC capture timestamp |
| `team_total` | Primary displayed participant total at capture time |
| `snapshot_type` | `baseline`, `hourly`, or `final` |

Tournament ID, participant name, local date, and hour key form the logical uniqueness key. Repeated cron calls, browser auto-refreshes, and manual refreshes update the existing bucket rather than adding duplicates.

The application creates the Sheet tab and header automatically when first needed. No manual Sheet setup is required.

## Snapshot Lifecycle

The existing score-update path remains the source of ESPN scores. After scores are refreshed, a separate history service calculates the same participant team totals used by the leaderboard.

For each participant and tournament day:

1. Determine the earliest scheduled tee time among that participant's non-dropped golfers.
2. Create a baseline in that tee time's clock-hour bucket using the prior day's closing team total. Thursday uses the opening team total, normally even par.
3. On each later clock hour, store the current displayed team total.
4. After the participant's last golfer finishes, store one final point if the total changed since the last hourly snapshot, then stop recording that participant for the day.
5. Stop all recording when the tournament is completed.

If ESPN does not supply a usable tee time, history begins in the first clock-hour bucket where one of the participant's golfers is observed playing. No synthetic earlier points are invented.

The server endpoint is idempotent, so the scheduled hourly trigger and user-driven refreshes may safely call the same history logic. A scheduled hourly call provides snapshots even when nobody has the leaderboard open.

## Graph Design

The graph appears at the top of the participant's existing expanded dropdown.

- Heading: `Today's momentum` plus the current weekday.
- Supporting line: prior-day finish and today's starting baseline.
- X axis: current-day clock hours only.
- Y axis: dynamically padded around the day's observed totals, with lower golf scores placed higher.
- Baseline: a dashed horizontal line through the day's starting total.
- Points: touch- and keyboard-selectable, with exact time and total details.
- Empty state: before a participant starts, explain when momentum tracking begins.
- Single-point state: show the baseline point and explain that the next point arrives after the next clock-hour snapshot.

The chart is responsive at phone widths and does not add horizontal scrolling to the participant card.

## Error Handling

- If ESPN score refresh fails, do not write a misleading snapshot; retain the last successful point.
- If the history Sheet write fails, the live leaderboard still renders from current Scores data.
- Duplicate or delayed calls update the same hourly bucket.
- Missing history shows the empty or single-point state rather than hiding the golfer table.
- History is not retroactively fabricated. The first deploy begins collecting real snapshots from that point forward.

## Verification

- Unit-test team-total calculation parity with the leaderboard, daily carryover, first-tee bucketing, clock-hour bucketing, duplicate replacement, final snapshots, missing tee times, and current-day filtering.
- Test that negative/better scores map upward and positive/worse scores map downward.
- Run the full test suite, lint, and production build.
- Deploy to Vercel and confirm the hourly scheduler is accepted and running.
- Browser-test the deployed leaderboard at desktop and phone widths: expand multiple participants, select points, reload, and confirm history persists.
- Verify the exact deployed leaderboard URL and confirm the golfer table remains usable below the graph.

## Out of Scope

- Projected post-cut score history.
- Multi-day graph navigation or historical-day selectors.
- Per-golfer history lines.
- Reconstructing hours from before the feature was deployed.
