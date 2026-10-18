# AGENTS.md — WT Bind Editor

## Project purpose
WT Bind Editor is a browser-based War Thunder keybinding editor. The current repository is a React 18 + TypeScript + Vite 6 **UI prototype** using illustrative controls. It is not yet a real War Thunder `.blk` editor. Prioritize reliable, lossless game-file editing over appearance-only changes when implementing file support.

## Repository map
- `src/App.tsx`: application UI, category navigation, search/filtering, visual keyboard, binding capture modal, selection, state, conflicts, JSON export, and persistence.
- `src/data.ts`: action/binding types, sample data, labels, signatures, and modifier helpers.
- `src/styles.css`: app and modal styles.
- `src/main.tsx`: React entry point.
- `index.html`: HTML entry.
- `vite.config.ts`, `tsconfig.json`, `package.json`: build/toolchain configuration.
- `README.md`: user-facing setup, capabilities, and limitations.

## Stack and commands
- React 19, TypeScript, Vite 6, Lucide React; CSS without an installed component framework.
- Required Node.js: `24.11+`.
- Install: `npm install`
- Develop: `npm run dev`
- Type-check and production build: `npm run build` (`tsc -b && vite build`)
- Preview: `npm run preview`
- No test or lint script is currently defined. Do not claim either passed unless you add and run them.

## Working rules for coding agents
1. Inspect the relevant files and current behavior before editing. Prefer small, reviewable changes; avoid unrelated rewrites or introducing dependencies without clear value.
2. Keep TypeScript strict and avoid `any`. Centralize shared action/binding types and normalization logic rather than duplicating it in components.
3. Treat existing controls as **demo data**, not authoritative War Thunder action names, default bindings, or keycodes. Never imply JSON export is valid `.blk` output.
4. Preserve user edits. The current prototype stores data under `wt-bind-editor-demo-v1` in `localStorage`; if changing schema, introduce validation and a deliberate migration or versioned storage key. Do not assume `JSON.parse()` returns valid `Action[]`.
5. Preserve action IDs and category names when extending the prototype unless a documented migration is supplied.
6. Make UI changes responsive, keyboard-accessible, and usable without a mouse. Modal changes must handle focus entry, focus trap, Escape, and focus restoration. Ensure buttons have accessible names.
7. Binding capture should run only while its modal is active. Prevent unintended page/browser actions where possible, handle modifier-only input explicitly, and acknowledge OS/browser-reserved shortcuts that cannot be captured.
8. Reuse `bindingSignature()` or one canonical equivalent for exact chord comparisons. Existing conflict detection is scoped to **identical chords within the same category**; do not silently label every shared key across all categories as a conflict.
9. The visual keyboard uses browser `KeyboardEvent.code`. Never assume these strings are War Thunder `.blk` key IDs; build a separately tested translation layer.
10. Keep the repository's documentation aligned with changes. Clearly state feature completeness and limitations.

## Requirements for future `.blk` support
- Before enabling `.blk` import/export, collect representative exported War Thunder configurations and write round-trip fixtures/tests. Do not invent undocumented mappings or fields.
- Build a lexer/parser and serializer that preserve unknown blocks/properties, repeated keys and blocks, value types, ordering, and ideally comments/formatting. A plain nested JavaScript object is not a lossless representation.
- Use an AST or equivalent ordered syntax model, keeping game-file structure separate from the UI's normalized binding model.
- A no-op import/export round trip must not alter semantics; preferably use minimal textual edits to preserve untouched content.
- Validate files and report parse/unsupported-feature errors without destroying the original contents. Keep an in-memory or downloadable original/backup until successful export.
- Handle keyboard, mouse, axes, joystick/HOTAS settings only when real samples and tests establish their encoding. Do not drop unknown device settings.
- Never write directly into a user's War Thunder installation or overwrite a source file without an explicit, user-initiated action and appropriate safety checks.
- Do not ship `.blk` export behind a working-looking button until fixture-based round-trip checks pass.

## Testing expectations
For changes to binding behavior, add tests for:
- Label and signature normalization (modifiers, left/right keys, mouse input).
- Search, category filters, keyboard key selection, and conflicts.
- Add, replace, and remove binding flows; cancel/retry capture; local persistence and malformed stored data.
- Modal keyboard navigation and accessible focus behavior.

For `.blk` work, additionally test repeated keys/blocks, unknown settings, escaping, encoding, malformed input, and parse/serialize/parse equivalence against real exported fixtures. Prefer Vitest and React Testing Library for unit/UI tests and Playwright for critical interaction flows if those tools are introduced.

## Definition of done
- The requested interaction works with keyboard and pointer where appropriate.
- `npm run build` succeeds, or any blocker is explicitly reported.
- New behavior has appropriate tests; test commands/results are stated accurately.
- README and this file remain truthful about demo versus production capabilities.
- No existing binding data is silently lost or converted into an unverified game format.

## Prioritized roadmap
1. Add validation for persisted demo data, component separation, accessibility improvements, and tests.
2. Implement lossless `.blk` parsing/serialization with verified War Thunder fixtures.
3. Add a game-keycode translation layer and safe import/edit/export workflow.
4. Expand conflict analysis, keyboard layouts, undo/redo, comparison, and controller support.
5. Consider a Node.js service only for features requiring a backend (accounts, sharing, cloud presets); the local-file editor can remain client-side.

## FigCraft — UI Design Workflow

Use FigCraft for visual design and layout work on the WT Keybinder web application.

- FigCraft runs locally on Windows and is controlled through its MCP server.
- Start the FigCraft desktop application with `figcraft.exe --control 7979`.
- The Codex MCP server should use `figcraft-cli.exe mcp --attach 7979`.
- Executable paths are machine-specific; use the installed paths, not assumed locations.
- Before editing, confirm that the FigCraft MCP tools are available and inspect the active document.
- Use the `figcraft-design` skill for creating or modifying application designs.
- Inspect the finished design and verify changes before implementation.
- Do not overwrite existing designs or change application source code unless requested.