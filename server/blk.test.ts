import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractKeybinds, originalText, parseBlk } from './blk.ts';
import { readKeybindFile } from './store.ts';

test('real exported fixture round-trips exactly and preserves repeated keys/blocks', async () => {
  const bytes = await readFile(new URL('../files/jetfighter.blk', import.meta.url));
  const source = bytes.toString('utf8');
  const document = parseBlk(source);
  assert.equal(originalText(document), source);
  assert.deepEqual(parseBlk(originalText(document)), document);
  const data = readKeybindFile(bytes, 'jetfighter.blk');
  assert.equal(data.keybinds.length, 27);
  assert.deepEqual(data.keybinds.filter(item => item.actionId === 'ID_FLARES').map(item => item.properties), [
    [{ name: 'keyboardKey', valueType: 'i', rawValue: '56' }, { name: 'keyboardKey', valueType: 'i', rawValue: '18' }],
    [{ name: 'mouseButton', valueType: 'i', rawValue: '1' }],
  ]);
  assert.deepEqual(data.keybinds.filter(item => item.actionId === 'ID_SCREENSHOT').map(item => item.occurrence), [0, 1, 2]);
  assert.deepEqual(data.keybinds.find(item => item.actionId === 'ID_TARGET_CAMERA')?.properties, []);
  assert.ok(source.includes('deviceMapping{}'));
  assert.ok(source.includes('mouseAxisId:i=7'));
});

test('comments, unknown types, escaped strings, BOM, CRLF and ordering are preserved', () => {
  const source = '\uFEFF// original\r\ncontrols { hotkeys { A { unknown:x=1, 2, 3; keyboardKey:i=42 } A{} } }\r\nextra { text:t="a~"b"; /* keep */ future:q=opaque }';
  const document = parseBlk(source);
  assert.equal(originalText(document), source);
  assert.deepEqual(parseBlk(originalText(document)), document);
  assert.equal(extractKeybinds(document)[0].properties[0].valueType, 'x');
  assert.equal(extractKeybinds(document)[1].occurrence, 1);
});

test('malformed/unsupported files fail explicitly', () => {
  for (const source of ['controls{', '}', '/* comment', 'a { x:i=no }', 'a { x:r=no }', 'a { x:b=maybe }', 'a { x:t="oops }', 'a { x:t=unquoted }', 'a { x:i= }']) {
    assert.throws(() => parseBlk(source), SyntaxError, source);
  }
  for (const source of ['', 'controls{}', 'controls{hotkeys{A{nested{}}}}', 'controls{hotkeys{}hotkeys{}}']) {
    assert.throws(() => extractKeybinds(parseBlk(source)), SyntaxError);
  }
  assert.throws(() => readKeybindFile(Buffer.from([0xff]), 'invalid.blk'), TypeError);
});
