# WT Bind Editor — React UI starter

A dark-themed UI prototype for a War Thunder controls editor, made with React, TypeScript and Vite.

## Run

Requires Node.js 20.19+ (or 22.12+), and npm.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. To compile a production bundle:

```bash
npm run build
```

## Features

- Switch between Aircraft, Ground, Helicopters, Naval, and Common sample actions.
- Search action names/descriptions, filter conflicts, and click keyboard keys to filter controls.
- View selected action, add/change/remove bindings in a keyboard capture dialog.
- View conflicts when **identical chords** are used by separate controls **within the same category**.
- Save demo edits in browser `localStorage` and reset to sample data.
- Export current **demo JSON only**; this is NOT a War Thunder `.blk` export.

## Known limitations / next steps

- Sample controls and mappings are illustrative, **not verified game defaults**.
- No `.blk` parser, import, or export yet. Build a lossless BLK AST parser and serializer before real game-file editing.
- Keyboard capture depends on browser access; some OS and browser shortcuts cannot be captured. Mouse button capture is via the capture area.
- Conflict detection is intentionally limited to exact same chords within one category; contextual applicability may make some overlaps legitimate.
- Modal is currently a minimal dialog. Add focus trapping and complete accessibility checks before production use.
- Add unit tests for input normalization, persistent data validation, parser round trips, and export integration.
