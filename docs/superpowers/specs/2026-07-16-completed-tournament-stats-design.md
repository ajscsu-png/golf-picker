# Completed Tournament Stats Design

## Goal

Add a durable Stats page that compares each participant's completed Single Golfer and Snake Draft results and tracks the pool's gross winnings and net balance.

## Scope

- Include completed tournaments only.
- Exclude draft and active tournaments from every statistic.
- Seed only the fully verified 2026 PGA Championship and 2026 U.S. Open results.
- Exclude the incomplete Masters history.
- Preserve Single Golfer and Snake Draft as separate pools.

## Data Model

Add an immutable `Results` Google Sheet tab. Each row records one participant's finalized result for one pool:

| Column | Meaning |
|---|---|
| `tournament_id` | Stable tournament identifier |
| `tournament_name` | Display name at finalization time |
| `year` | Tournament year |
| `pool_type` | `single` or `snake` |
| `participant_name` | Participant name |
| `rank` | Final competition rank |
| `total_score` | Final pool score |
| `finalized_at` | ISO timestamp |

The Stats page reads only `Results`; it never derives statistics from active `Picks`, `Scores`, or `Drops` rows. Finalization is idempotent: writing a tournament replaces that tournament's previous result rows rather than duplicating them.

When an active tournament becomes `completed`, the application computes and archives both pools before it can later be deleted. The existing live leaderboard remains backed by the operational Sheet tabs.

## Ranking Rules

- Lower pool score wins.
- Single Golfer uses the round-zero pick.
- Snake Draft uses snake-round picks and the tournament's final drop rules.
- Equal scores receive the same rank.
- Average finish is the arithmetic mean of finalized ranks for that pool type.
- Wins count result rows with rank `1`.

## Money Rules

- Each non-winner pays `$10` in each finalized pool.
- With one winner among eight participants, the winner's gross payout is `$70`.
- Tied winners split contributions from non-winners. For example, two winners receive `$30` each from a `$60` pot.
- Gross winnings are payouts received.
- Net balance is gross winnings minus `$10` for each losing pool.
- Net balances must sum to `$0` across all participants.

## Page Design

The existing `/stats` route becomes a unified leaderboard containing:

1. Summary cards for Money Leader, Single Golfer Leader, and Snake Draft Leader.
2. A leaderboard sorted by net balance descending.
3. Per participant: Single wins and average finish, Snake wins and average finish, gross winnings, and net balance.
4. A count such as `2 completed tournaments tracked`.
5. Compact participant cards on narrow screens instead of a horizontally scrolling table.

The page does not show live scores, projected standings, active tournaments, or draft tournaments.

## Historical Seed

Seed the recovered PGA Championship and U.S. Open Single/Snake final results into `Results`. The Masters is omitted because its full placements and Single Golfer winner cannot be verified.

## Reliability and Verification

- Unit-test pool ranking, tie ranks, averages, payout splitting, zero-sum net totals, completed-only aggregation, and idempotent result-row replacement.
- Preserve normalized golfer-name matching for recovered odds-backed picks.
- Run the complete test suite, lint, and production build.
- Deploy to Vercel and verify `https://golf-picker.vercel.app/stats` in a browser at desktop and mobile widths.

