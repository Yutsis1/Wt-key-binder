/** Raw BLK data, deliberately separate from browser KeyboardEvent.code bindings. */
export interface BlkProperty {
  name: string;
  valueType: string;
  rawValue: string;
}

export interface Keybind {
  actionId: string;
  /** Zero-based occurrence of this action in the file; duplicates are intentional. */
  occurrence: number;
  properties: BlkProperty[];
}

export interface KeybindResponse {
  source: string;
  sha256: string;
  keybinds: Keybind[];
}
