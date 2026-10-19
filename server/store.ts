import { createHash } from 'node:crypto';
import { TextDecoder } from 'node:util';
import type { Pool } from 'pg';
import { extractKeybinds, parseBlk } from './blk.ts';
import type { KeybindResponse } from '../shared/keybinds.ts';

export function readKeybindFile(bytes: Buffer, source: string): KeybindResponse {
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  return { source, sha256: createHash('sha256').update(bytes).digest('hex'), keybinds: extractKeybinds(parseBlk(text)) };
}

export async function initializeStore(pool: Pick<Pool, 'query'>, bytes: Buffer, source: string) {
  const parsed = readKeybindFile(bytes, source); // Validate before storing; original bytes are retained.
  await pool.query(`CREATE TABLE IF NOT EXISTS blk_sources (
    sha256 text PRIMARY KEY,
    filename text NOT NULL,
    original bytea NOT NULL,
    imported_at timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query('INSERT INTO blk_sources (sha256, filename, original) VALUES ($1, $2, $3) ON CONFLICT (sha256) DO NOTHING', [parsed.sha256, source, bytes]);
  return parsed.sha256;
}

export async function loadKeybinds(pool: Pick<Pool, 'query'>, sha256: string): Promise<KeybindResponse> {
  const result = await pool.query<{ filename: string; original: Buffer }>('SELECT filename, original FROM blk_sources WHERE sha256 = $1', [sha256]);
  const row = result.rows[0];
  if (!row) throw new Error('Configured BLK source is unavailable');
  return readKeybindFile(row.original, row.filename);
}
