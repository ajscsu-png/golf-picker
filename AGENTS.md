# Golf Picker — Codex Context

## Hosting
- Deployed on **Vercel** at https://golf-picker.vercel.app
- Pushing to `main` triggers a deploy automatically
- Repo: https://github.com/ajscsu-png/golf-picker

## Data Storage
- All tournament data lives in a **Google Sheet** named **"Golf Tournament Picker"**
- Sheet tabs: `Tournaments`, `Participants`, `Picks`, `Scores`, `Drops`, `Trash`, `Config`
- Auth via Google service account — credentials in env vars (`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
- Codex cannot directly read live sheet data — user must paste data or hit the API

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
