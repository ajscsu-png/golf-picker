import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server.js';

import { requireAdmin } from './requireAdmin.ts';

function req(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/x', { method: 'POST', headers });
}

test('requireAdmin returns 401 when ADMIN_TOKEN is unset, even for "undefined" cookie', async () => {
  const prev = process.env.ADMIN_TOKEN;
  delete process.env.ADMIN_TOKEN;
  try {
    const res = requireAdmin(req({ cookie: 'admin_token=undefined' }));
    assert.equal(res?.status, 401);
    assert.equal(requireAdmin(req())?.status, 401);
  } finally {
    if (prev !== undefined) process.env.ADMIN_TOKEN = prev;
  }
});

test('requireAdmin allows matching cookie and rejects wrong one', () => {
  const prev = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = 'good-token';
  try {
    assert.equal(requireAdmin(req({ cookie: 'admin_token=good-token' })), null);
    assert.equal(requireAdmin(req({ authorization: 'Bearer good-token' })), null);
    assert.equal(requireAdmin(req({ cookie: 'admin_token=bad' }))?.status, 401);
    assert.equal(requireAdmin(req())?.status, 401);
  } finally {
    if (prev === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = prev;
  }
});
