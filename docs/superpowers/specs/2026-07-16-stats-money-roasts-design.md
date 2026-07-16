# Stats Money Roasts Design

## Goal

Replace the joke banner on `/stats` with a rotating set of ruthless, personalized jokes about participants who have never received a pool payout. Preserve the existing joke rotation on every other page.

## Design

- `GolfJoke` will inspect the current route.
- On `/stats`, it will select from a dedicated set of money-roast jokes targeting Bill, Brad, Connor, Kyle, and Wyatt, the participants currently showing `$0` gross winnings.
- On all other routes, it will continue selecting from the existing `JOKES` collection without changing that content.
- The banner's visual styling and placement remain unchanged.

## Verification

- Confirm `/stats` renders only a money-roast joke.
- Confirm `/` and a tournament page still render jokes from the existing collection.
- Run tests, lint, and the production build.
- Deploy and verify the production Stats and home pages in a browser.
