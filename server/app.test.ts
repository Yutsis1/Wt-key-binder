import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from './app.ts';

test('HTTP endpoints, methods, missing routes and dependency failures', async () => {
  let unavailable = false;
  const payload = { source: 'jetfighter.blk', sha256: 'a'.repeat(64), keybinds: [] };
  const app = createApp({
    health: async () => { if (unavailable) throw new Error('private connection string'); },
    keybinds: async () => { if (unavailable) throw new Error('private filename'); return payload; },
  });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  try {
    const address = app.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    let result = await fetch(`${base}/api/health`);
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { status: 'ok', database: 'ok' });
    result = await fetch(`${base}/api/keybinds`);
    assert.deepEqual(await result.json(), payload);
    assert.equal((await fetch(`${base}/missing`)).status, 404);
    result = await fetch(`${base}/api/keybinds`, { method: 'POST' });
    assert.equal(result.status, 405);
    assert.equal(result.headers.get('allow'), 'GET');
    unavailable = true;
    for (const route of ['health', 'keybinds']) {
      result = await fetch(`${base}/api/${route}`);
      assert.equal(result.status, 503);
      assert.ok(!(await result.text()).includes('private'));
    }
  } finally {
    app.closeAllConnections();
    await new Promise<void>((resolve, reject) => app.close(error => error ? reject(error) : resolve()));
  }
});
