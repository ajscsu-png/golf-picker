# Golf Picker

A private-group golf tournament pool for drafting players and following live scores.
The app uses Google Sheets for tournament data and runs on Vercel.

## Local development

Use Node.js 22 and install the locked dependencies:

```sh
npm ci
npm run dev
```

Configure the Google Sheets service account values as local environment variables or
in Vercel's encrypted environment settings. Never commit credentials or a `.env` file.

## Checks

```sh
npm run lint
npm run build
```

GitHub Actions runs these checks for pull requests and updates to `main`. Changes to
`main` deploy to Vercel, so use a pull request after the repository's required checks
are enabled.

## Deployment and data

The live app is [golf-picker.vercel.app](https://golf-picker.vercel.app). Tournament
records are stored in the Google Sheet named **Golf Tournament Picker**. The hourly
score refresh (`/api/cron/update-scores`) is called from the Unraid server
(`scripts/golf-score-refresh.sh` in `unraid-config`, hourly at :07), which reports each
run to the Tower Uptime Kuma monitor "Golf Picker score refresh" so a skipped or failing
refresh pages. It moved off GitHub Actions because GitHub can delay or drop scheduled runs.
