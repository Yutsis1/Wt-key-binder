import { useEffect, useState } from 'react';
import type { KeybindResponse } from '../shared/keybinds.ts';
import { fetchKeybinds } from './api';

export function BackendKeybinds() {
  const [data, setData] = useState<KeybindResponse | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timeout = window.setTimeout(() => controller.abort(new Error('API request timed out')), 10000);
    fetchKeybinds(controller.signal)
      .then(result => { if (active) setData(result); })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load keybindings');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  return (
    <section aria-label="Backend keybindings">
      <details>
        <summary>Server file keybindings (read-only)</summary>
        <p>Raw game IDs from the backend. These are separate from the demo editor below.</p>
        {loading && <p role="status">Loading keybindings…</p>}
        {error && <p role="alert">{error}. Start the backend and PostgreSQL, then retry.</p>}
        <button type="button" className="btn" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Reload server keybindings</button>
        {data && !error && !loading && <>
          <p>{data.source} · {data.keybinds.length} binding blocks</p>
          <ul>
            {data.keybinds.map(binding => <li key={`${binding.actionId}:${binding.occurrence}`}>
              <code>{binding.actionId}</code> (entry {binding.occurrence + 1}):{' '}
              {binding.properties.length ? binding.properties.map(property => `${property.name}:${property.valueType}=${property.rawValue}`).join(', ') : 'No explicit binding'}
            </li>)}
          </ul>
        </>}
      </details>
    </section>
  );
}
