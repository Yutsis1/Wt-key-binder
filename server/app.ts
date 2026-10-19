import { createServer } from 'node:http';
import type { KeybindResponse } from '../shared/keybinds.ts';

export function createApp(dependencies: { health: () => Promise<void>; keybinds: () => Promise<KeybindResponse>; logError?: (error: unknown) => void }) {
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, body: unknown) => { response.writeHead(status); response.end(JSON.stringify(body)); };
    let path: string;
    try { path = new URL(request.url ?? '/', 'http://localhost').pathname; }
    catch { send(400, { error: 'Invalid request URL' }); return; }
    if (path !== '/api/health' && path !== '/api/keybinds') { send(404, { error: 'Not found' }); return; }
    if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); send(405, { error: 'Method not allowed' }); return; }
    try {
      if (path === '/api/health') {
        await dependencies.health();
        send(200, { status: 'ok', database: 'ok' });
      } else send(200, await dependencies.keybinds());
    } catch (error) {
      dependencies.logError?.(error);
      send(503, path === '/api/health' ? { status: 'unavailable', database: 'unavailable' } : { error: 'Keybindings are temporarily unavailable' });
    }
  });
}
