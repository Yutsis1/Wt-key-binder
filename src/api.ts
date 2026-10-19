import type { KeybindResponse } from '../shared/keybinds.ts';

export function isKeybindResponse(value: unknown): value is KeybindResponse {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return typeof data.source === 'string' && typeof data.sha256 === 'string'
    && /^[a-f0-9]{64}$/.test(data.sha256) && Array.isArray(data.keybinds)
    && data.keybinds.every((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return false;
      const binding = entry as Record<string, unknown>;
      return typeof binding.actionId === 'string' && Number.isInteger(binding.occurrence)
        && typeof binding.occurrence === 'number' && binding.occurrence >= 0
        && Array.isArray(binding.properties) && binding.properties.every((item: unknown) => {
          if (typeof item !== 'object' || item === null) return false;
          const property = item as Record<string, unknown>;
          return typeof property.name === 'string' && typeof property.valueType === 'string' && typeof property.rawValue === 'string';
        });
    });
}

export async function fetchKeybinds(signal: AbortSignal): Promise<KeybindResponse> {
  const response = await fetch('/api/keybinds', { signal });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!isKeybindResponse(data)) throw new Error('API returned an invalid keybinding response');
  return data;
}
