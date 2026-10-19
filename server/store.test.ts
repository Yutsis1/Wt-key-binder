import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { initializeStore, loadKeybinds, readKeybindFile } from './store.ts';

// Run against a disposable test database, never a production database.
test('PostgreSQL retains exact original bytes and repeated initialization is idempotent', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Isolate the unqualified application table from any existing real data.
    await client.query('CREATE TEMP TABLE blk_sources (sha256 text PRIMARY KEY, filename text NOT NULL, original bytea NOT NULL, imported_at timestamptz NOT NULL DEFAULT now())');
    // A single checked-out client provides the same query interface used by the store.
    const store = { query: client.query.bind(client) } as Pick<pg.Pool, 'query'>;
    const bytes = await readFile(new URL('../files/jetfighter.blk', import.meta.url));
    const sha256 = await initializeStore(store, bytes, 'jetfighter.blk');
    await initializeStore(store, bytes, 'jetfighter.blk');
    assert.deepEqual(await loadKeybinds(store, sha256), readKeybindFile(bytes, 'jetfighter.blk'));
    const result = await client.query<{ original: Buffer }>('SELECT original FROM blk_sources');
    assert.equal(result.rows.length, 1);
    assert.deepEqual(result.rows[0].original, bytes);
    await assert.rejects(loadKeybinds(store, 'missing'), /unavailable/);
  } finally {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
  }
});
