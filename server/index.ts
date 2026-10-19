import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import pg from 'pg';
import { createApp } from './app.ts';
import { initializeStore, loadKeybinds } from './store.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString && !process.env.PGHOST) throw new Error('DATABASE_URL or PGHOST is required');
const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 3000, query_timeout: 5000, max: 5 });
pool.on('error', error => console.error('PostgreSQL pool error', error));
try {
  const file = process.env.BLK_FILE ?? new URL('../files/jetfighter.blk', import.meta.url);
  const bytes = await readFile(file);
  const sha256 = await initializeStore(pool, bytes, typeof file === 'string' ? basename(file) : basename(file.pathname));
  const server = createApp({
    health: async () => { await pool.query('SELECT 1'); },
    keybinds: () => loadKeybinds(pool, sha256),
    logError: error => console.error('API request failed', error),
  });
  server.listen(port, '0.0.0.0', () => console.log(`API listening on port ${port}`));
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(() => { void pool.end().then(() => { clearTimeout(timeout); }); });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  await pool.end();
  throw error;
}
