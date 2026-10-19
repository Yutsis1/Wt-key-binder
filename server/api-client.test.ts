import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchKeybinds, isKeybindResponse } from '../src/api.ts';

test('frontend validates API responses and reports HTTP failures', async () => {
  const data = { source: 'jetfighter.blk', sha256: 'a'.repeat(64), keybinds: [{ actionId: 'A', occurrence: 0, properties: [{ name: 'keyboardKey', valueType: 'i', rawValue: '42' }] }] };
  assert.ok(isKeybindResponse(data));
  for (const invalid of [null, {}, { ...data, sha256: 'bad' }, { ...data, keybinds: [null] }, { ...data, keybinds: [{ actionId: 'A', occurrence: -1, properties: [] }] }]) assert.ok(!isKeybindResponse(invalid));
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify(data));
    assert.deepEqual(await fetchKeybinds(new AbortController().signal), data);
    globalThis.fetch = async () => new Response('{}');
    await assert.rejects(fetchKeybinds(new AbortController().signal), /invalid keybinding/);
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(fetchKeybinds(new AbortController().signal), /HTTP 503/);
  } finally { globalThis.fetch = originalFetch; }
});
