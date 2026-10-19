import type { BlkProperty, Keybind } from '../shared/keybinds.ts';

interface Property extends BlkProperty { kind: 'property'; start: number; end: number }
interface Block { kind: 'block'; name: string; children: Entry[]; start: number; end: number }
type Entry = Property | Block;
export interface BlkDocument { source: string; entries: Entry[] }

/** Read-only parser for the textual subset in the checked-in export.
 * Ordered nodes retain duplicates and offsets; original source retains all trivia.
 * Unknown property types/values are opaque, never coerced or discarded.
 */
export function parseBlk(source: string): BlkDocument {
  let offset = 0;
  const fail = (message: string): never => {
    throw new SyntaxError(`${message} at offset ${offset}`);
  };
  function trivia() {
    while (offset < source.length) {
      if (/\s|\uFEFF/.test(source[offset])) { offset++; continue; }
      if (source.startsWith('//', offset)) {
        while (offset < source.length && source[offset] !== '\n') offset++;
        continue;
      }
      if (source.startsWith('/*', offset)) {
        const end = source.indexOf('*/', offset + 2);
        if (end < 0) fail('Unterminated comment');
        offset = end + 2;
        continue;
      }
      break;
    }
  }
  function identifier(): string {
    const match = /^[A-Za-z_][A-Za-z0-9_.-]*/.exec(source.slice(offset));
    if (!match) return fail('Expected identifier (quoted identifiers are unsupported)');
    offset += match[0].length;
    return match[0];
  }
  function entries(depth: number): Entry[] {
    if (depth > 64) fail('Maximum block depth exceeded');
    const result: Entry[] = [];
    while (true) {
      trivia();
      if (offset === source.length) {
        if (depth) fail('Unclosed block');
        return result;
      }
      if (source[offset] === '}') {
        if (!depth) fail('Unexpected closing brace');
        offset++;
        return result;
      }
      const start = offset;
      const name = identifier();
      trivia();
      if (source[offset] === '{') {
        offset++;
        const children = entries(depth + 1);
        result.push({ kind: 'block', name, children, start, end: offset });
        continue;
      }
      if (source[offset++] !== ':') fail('Expected block or typed property');
      const valueType = identifier();
      trivia();
      if (source[offset++] !== '=') fail('Expected equals');
      // Values may contain spaces (e.g. vectors), but end at newline, semicolon or brace.
      while (source[offset] === ' ' || source[offset] === '\t') offset++;
      const valueStart = offset;
      let quote = '';
      while (offset < source.length) {
        const char = source[offset];
        if (quote) {
          if (char === '\n' || char === '\r') fail('Multiline strings are unsupported');
          if (char === '\\' || char === '~') { offset += 2; continue; }
          if (char === quote) quote = '';
        } else {
          if (char === '"' || char === "'") quote = char;
          else if ('\r\n;}'.includes(char) || source.startsWith('//', offset) || source.startsWith('/*', offset)) break;
          else if (char === '{') fail('Unexpected brace in value');
        }
        offset++;
      }
      if (quote) fail('Unterminated string');
      const rawValue = source.slice(valueStart, offset).trim();
      if (!rawValue) fail('Empty value');
      if (valueType === 'i' && !/^[+-]?\d+$/.test(rawValue)) fail('Invalid integer');
      if (valueType === 'r' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(rawValue)) fail('Invalid real');
      if (valueType === 'b' && !/^(yes|no|true|false|0|1)$/.test(rawValue)) fail('Invalid boolean');
      if (valueType === 't' && !/^(["']).*\1$/.test(rawValue)) fail('Invalid string');
      result.push({ kind: 'property', name, valueType, rawValue, start, end: offset });
      if (source[offset] === ';') offset++;
    }
  }
  return { source, entries: entries(0) };
}

/** No edits/export API: exact original text only, for round-trip verification. */
export function originalText(document: BlkDocument): string { return document.source; }

export function extractKeybinds(document: BlkDocument): Keybind[] {
  const controls = document.entries.filter((entry): entry is Block => entry.kind === 'block' && entry.name === 'controls');
  if (controls.length !== 1) throw new SyntaxError('Expected exactly one controls block');
  const hotkeys = controls[0].children.filter((entry): entry is Block => entry.kind === 'block' && entry.name === 'hotkeys');
  if (hotkeys.length !== 1) throw new SyntaxError('Expected exactly one controls/hotkeys block');
  const occurrences = new Map<string, number>();
  return hotkeys[0].children.map((entry) => {
    if (entry.kind !== 'block' || entry.children.some(child => child.kind !== 'property')) {
      throw new SyntaxError('Unsupported hotkeys structure');
    }
    const occurrence = occurrences.get(entry.name) ?? 0;
    occurrences.set(entry.name, occurrence + 1);
    return {
      actionId: entry.name, occurrence,
      properties: entry.children.map(child => {
        if (child.kind !== 'property') throw new SyntaxError('Nested hotkey block');
        return { name: child.name, valueType: child.valueType, rawValue: child.rawValue };
      }),
    };
  });
}
