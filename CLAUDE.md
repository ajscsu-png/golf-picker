# Golf Picker — AI Context

> Auto-read by **Claude Code** (`CLAUDE.md`), **Codex/Grok/Cursor** (`AGENTS.md`, `.cursorrules`) and **Gemini/Antigravity** (`GEMINI.md`) — all symlinks to this file. Edit `CLAUDE.md` only.

---

## Goal

A Masters / golf-tournament pool app for a fixed group of 8 friends — draft golfers, track live scores, manage drops. Optimize for **it just works on tournament weekend** with zero babysitting.

## Priorities (in order)

1. **Reliability during a live tournament** — scores must keep updating even when ESPN's API misbehaves. Graceful fallback over clever features.
2. **Simple data model** — Google Sheets is the backend on purpose; don't add a database.
3. **Low-friction admin** — Andrew runs it; the 8 players just view/pick.

## Hard Rules

- **Never** commit Google service-account credentials — they live in env vars only.
- **Always** verify a UI change in the browser before calling it done (it's a deployed, user-facing site).
- ESPN summary endpoint 502s during live rounds — **always** keep the scoreboard-endpoint fallback working.

## Points of Concern

- ESPN API has two response shapes (summary vs scoreboard) — changes must handle both.
- No database means Sheets rate limits / auth are the failure mode; handle errors gracefully.
- Pushing to `main` auto-deploys to Vercel — a bad push is live immediately.

---

## Hosting
- Deployed on **Vercel** at https://golf-picker.vercel.app
- Pushing to `main` triggers a deploy automatically
- Repo: https://github.com/ajscsu-png/golf-picker

## Data Storage
- All tournament data lives in a **Google Sheet** named **"Golf Tournament Picker"**
- Sheet tabs: `Tournaments`, `Participants`, `Picks`, `Scores`, `Drops`, `Trash`, `Config`
- Auth via Google service account — credentials in env vars (`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
- Claude cannot directly read live sheet data — user must paste data or hit the API

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- No database — Google Sheets is the backend via `src/lib/sheets.ts`

## Key Files
- `src/lib/draft.ts` — draft order computation (snake + optional single-golfer round 0)
- `src/lib/sheets.ts` — all Google Sheets read/write logic
- `src/lib/espn.ts` — ESPN API integration for golfer fields and scores
- `src/types/index.ts` — shared TypeScript types
- `src/components/GolfJoke.tsx` — rotating golf jokes shown on the site (hardcoded array)

## ESPN API Notes
- Summary endpoint returns 502 during live rounds — fall back to scoreboard endpoint
- Scoreboard endpoint always works but has a different response shape

## Players
- Fixed group of 8: **Andy, Connor, Kyle, Tim, Brad, Bill, Wyatt, Andrew**
- These are pre-populated in the admin participants form

## Agent Handoff

- On start, read `.agent/HANDOFF.md` if it exists (branch, uncommitted work, what other tools did).
- When stopping or finishing, commit or stash, then run `agent-ledger note "<what you did, what is next>"`. Never put secrets in a note.

## Commands

- Test: `npm test` · Lint: `npm run lint` · Build: `npm run build` · Run: `npm run dev`
- Pushing to `main` deploys to Vercel; open a PR and let checks pass first.

- Run the checks before saying work is done. Never delete or skip a failing test to make it pass.
