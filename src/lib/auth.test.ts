import assert from 'node:assert/strict';
import test from 'node:test';

import { isAdminRequest, isCronAuthorized, isValidSecret, parseBearer } from './auth.ts';
import { pickTournamentFields } from './tournamentFields.ts';

test('isValidSecret fails closed when expected secret is unset or empty', () => {
  assert.equal(isValidSecret('anything', undefined), false);
  assert.equal(isValidSecret('anything', ''), false);
  assert.equal(isValidSecret(undefined, undefined), false);
  assert.equal(isValidSecret('', ''), false);
});

test('isValidSecret accepts only the exact secret', () => {
  assert.equal(isValidSecret('s3cret', 's3cret'), true);
  assert.equal(isValidSecret('s3cre', 's3cret'), false);
  assert.equal(isValidSecret('s3cret-longer', 's3cret'), false);
  assert.equal(isValidSecret(null, 's3cret'), false);
});

test('parseBearer extracts the token', () => {
  assert.equal(parseBearer('Bearer abc'), 'abc');
  assert.equal(parseBearer('Basic abc'), null);
  assert.equal(parseBearer(null), null);
});

test('isCronAuthorized requires Bearer CRON_SECRET and fails closed', () => {
  assert.equal(isCronAuthorized('Bearer abc', 'abc'), true);
  assert.equal(isCronAuthorized('Bearer wrong', 'abc'), false);
  assert.equal(isCronAuthorized(null, 'abc'), false);
  assert.equal(isCronAuthorized('Bearer undefined', undefined), false);
  assert.equal(isCronAuthorized('Bearer ', ''), false);
});

test('isAdminRequest accepts cookie or bearer, fails closed without ADMIN_TOKEN', () => {
  assert.equal(isAdminRequest('tok', null, 'tok'), true);
  assert.equal(isAdminRequest(undefined, 'Bearer tok', 'tok'), true);
  assert.equal(isAdminRequest('nope', null, 'tok'), false);
  assert.equal(isAdminRequest(undefined, null, undefined), false);
  assert.equal(isAdminRequest(undefined, null, ''), false);
  assert.equal(isAdminRequest('undefined', null, undefined), false);
});

test('pickTournamentFields drops unknown fields (no raw passthrough)', () => {
  const out = pickTournamentFields({ name: ' Masters ', id: 'evil', extra: 1, year: '2027', isMajor: 'true' });
  assert.deepEqual(out, { name: 'Masters', year: 2027, isMajor: true });
});

test('pickTournamentFields rejects invalid values', () => {
  assert.equal(pickTournamentFields(null), null);
  assert.equal(pickTournamentFields([]), null);
  assert.equal(pickTournamentFields({ status: 'hacked' }), null);
  assert.equal(pickTournamentFields({ year: 'abc' }), null);
  assert.equal(pickTournamentFields({ name: '' }), null);
  assert.equal(pickTournamentFields({ isMajor: 'maybe' }), null);
  assert.deepEqual(pickTournamentFields({ status: 'active' }), { status: 'active' });
});
