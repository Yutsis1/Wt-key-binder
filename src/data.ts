export type Category = 'Aircraft' | 'Ground' | 'Helicopters' | 'Naval' | 'Common';
export type Binding = { code: string; ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean };
export type Action = { id: string; name: string; description: string; category: Category; group: string; bindings: Binding[] };

export const categories: Category[] = ['Aircraft', 'Ground', 'Helicopters', 'Naval', 'Common'];
export const initialActions: Action[] = [
  { id: 'fire-primary', name: 'Fire primary weapons', description: 'Fire machine guns and cannons', category: 'Aircraft', group: 'Weapons', bindings: [{code:'Space'}, {code:'Mouse0'}] },
  { id: 'fire-secondary', name: 'Fire secondary weapons', description: 'Fire currently selected secondary weapon', category: 'Aircraft', group: 'Weapons', bindings: [{code:'KeyR'}] },
  { id: 'missile', name: 'Fire air-to-air missile', description: 'Launch the selected air-to-air missile', category: 'Aircraft', group: 'Weapons', bindings: [{code:'KeyF', alt:true}] },
  { id: 'bombs', name: 'Drop bomb', description: 'Release a bomb from the aircraft', category: 'Aircraft', group: 'Weapons', bindings: [{code:'Space', ctrl:true}] },
  { id: 'rockets', name: 'Fire rockets', description: 'Launch unguided rockets', category: 'Aircraft', group: 'Weapons', bindings: [{code:'KeyR', shift:true}] },
  { id: 'gear', name: 'Toggle landing gear', description: 'Extend or retract landing gear', category: 'Aircraft', group: 'Flight controls', bindings: [{code:'KeyG'}] },
  { id: 'flaps', name: 'Toggle flaps', description: 'Cycle through available flap positions', category: 'Aircraft', group: 'Flight controls', bindings: [{code:'KeyF'}] },
  { id: 'airbrake', name: 'Toggle airbrake', description: 'Deploy or retract airbrakes', category: 'Aircraft', group: 'Flight controls', bindings: [{code:'KeyH'}] },
  { id: 'throttle-up', name: 'Increase throttle', description: 'Increase engine throttle', category: 'Aircraft', group: 'Engine', bindings: [{code:'ShiftLeft'}] },
  { id: 'throttle-down', name: 'Decrease throttle', description: 'Decrease engine throttle', category: 'Aircraft', group: 'Engine', bindings: [{code:'ControlLeft'}] },
  { id: 'tank-fire', name: 'Fire main gun', description: 'Fire the main armament', category: 'Ground', group: 'Weapons', bindings: [{code:'Mouse0'}] },
  { id: 'tank-mg', name: 'Fire machine gun', description: 'Fire coaxial or roof machine gun', category: 'Ground', group: 'Weapons', bindings: [{code:'Space'}] },
  { id: 'tank-range', name: 'Rangefinder', description: 'Measure target distance', category: 'Ground', group: 'Targeting', bindings: [{code:'KeyR'}] },
  { id: 'tank-night', name: 'Toggle night vision', description: 'Enable or disable night vision', category: 'Ground', group: 'Targeting', bindings: [{code:'KeyN'}] },
  { id: 'heli-hover', name: 'Toggle hover mode', description: 'Enable automatic hover stabilization', category: 'Helicopters', group: 'Flight controls', bindings: [{code:'KeyH'}] },
  { id: 'heli-missile', name: 'Fire guided missile', description: 'Fire selected guided missile', category: 'Helicopters', group: 'Weapons', bindings: [{code:'KeyF'}] },
  { id: 'naval-guns', name: 'Fire main caliber', description: 'Fire main naval guns', category: 'Naval', group: 'Weapons', bindings: [{code:'Mouse0'}] },
  { id: 'naval-torp', name: 'Launch torpedo', description: 'Launch selected torpedo', category: 'Naval', group: 'Weapons', bindings: [{code:'Space'}] },
  { id: 'map', name: 'Show tactical map', description: 'Open tactical map', category: 'Common', group: 'Interface', bindings: [{code:'KeyM'}] },
  { id: 'scoreboard', name: 'Show scoreboard', description: 'Display player list and scores', category: 'Common', group: 'Interface', bindings: [{code:'Tab'}] },
  { id: 'camera', name: 'Change camera view', description: 'Cycle between cameras', category: 'Common', group: 'Camera', bindings: [{code:'KeyV'}] },
];

const labelMap: Record<string,string> = {
  Space:'Space', Escape:'Esc', Tab:'Tab', Enter:'Enter', Backspace:'Backspace',
  ShiftLeft:'L Shift', ShiftRight:'R Shift', ControlLeft:'L Ctrl', ControlRight:'R Ctrl', AltLeft:'L Alt', AltRight:'R Alt',
  ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',
  BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',Backquote:'`',Minus:'-',Equal:'=',
  Mouse0:'Mouse 1',Mouse1:'Mouse 2',Mouse2:'Mouse 3'
};
export function keyLabel(code: string): string {
  return labelMap[code] ?? (code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : code);
}
export function bindingLabel(binding: Binding): string {
  return [...(binding.ctrl ? ['Ctrl'] : []), ...(binding.alt ? ['Alt'] : []), ...(binding.shift ? ['Shift'] : []), ...(binding.meta ? ['Meta'] : []), keyLabel(binding.code)].join(' + ');
}
export function bindingSignature(binding: Binding): string {
  return `${binding.ctrl?'C':''}${binding.alt?'A':''}${binding.shift?'S':''}${binding.meta?'M':''}:${binding.code}`;
}
export function isModifier(code: string): boolean { return /^(Shift|Control|Alt|Meta)(Left|Right)$/.test(code); }
