import assert from 'node:assert/strict';
import test from 'node:test';

import { parseTeeTime } from './espn.ts';

test('uses ESPN scoreboard tee time clock without converting the misleading timezone suffix', () => {
  assert.equal(parseTeeTime('Fri May 15 08:40:00 PDT 2026'), '8:40 AM');
});
