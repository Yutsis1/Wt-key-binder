---
name: figcraft-design
description: Create, inspect, and refine UI designs for the WT Keybinder application using the FigCraft MCP server. Use for screen layouts, reusable components, keyboard visualizations, binding tables, modals, and design reviews. Do not use for ordinary React coding tasks unless visual design work is requested.
---

# FigCraft Design Skill

## Purpose

Use FigCraft to design and iterate on the WT Keybinder web application before implementing the UI in React and TypeScript.

## 1. Connect to FigCraft

1. Check whether the FigCraft MCP tools are available.
2. If unavailable, ask the user to start FigCraft with `figcraft.exe --control 7979`.
3. Check that Codex is configured to use `figcraft-cli.exe mcp --attach 7979`.
4. Confirm the connection by inspecting the active FigCraft document.
5. Never assume the connection works without a successful tool call.

Do not start a second FigCraft instance if one is already running and connected.

## 2. Design Guidelines

Create a desktop-first, responsive web interface.

- Theme: modern dark tactical / aviation simulator.
- Background: charcoal and gunmetal.
- Primary accent: amber/orange.
- Secondary accent: steel blue.
- Typography: clean, legible sans-serif.
- Layout: compact, consistent, and keyboard-friendly.
- Accessibility: clear focus indicators, readable contrast, and distinguishable warning states.

Avoid copying official War Thunder artwork or interface assets.

## 3. Application Components

Prioritize these elements:

- Main navigation and profile selector.
- Searchable actions and keybinding table.
- Aircraft, ground, naval, and other binding categories.
- Keyboard visualization with highlighted bindings.
- Key assignment and conflict resolution dialogs.
- Import/export and profile management interfaces.

Use consistent spacing, reusable components, and clearly named layers.

## 4. Design Workflow

1. Understand the requested screen or component.
2. Inspect the current FigCraft document before making changes.
3. Preserve existing components and styling where possible.
4. Create or update the design using FigCraft MCP tools.
5. Inspect the resulting layout, hierarchy, and visual output.
6. Correct obvious spacing, alignment, and contrast issues.
7. Summarize what changed and identify any remaining issues.

Do not claim a design was created or verified unless the relevant FigCraft tools succeeded.

## 5. Handoff to React

When implementation is requested:

1. Identify the design's reusable components and layout dimensions.
2. Translate the approved design into React and TypeScript.
3. Follow existing project conventions.
4. Keep visual design decisions consistent with FigCraft.
5. Report any differences between the design and implementation.

Do not modify application source code during design-only tasks.