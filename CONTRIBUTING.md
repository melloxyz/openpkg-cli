# Contributing

Thank you for contributing to OpenPgk.

This project is still under active development, so contributions should favor clarity, safety, modularity, and cross-platform behavior over quick one-off additions.

## Principles

- keep the CLI/TUI keyboard-first
- preserve modular boundaries between `commands`, `services`, `ui`, and `modules`
- prefer cross-platform implementations
- treat cleanup and deletion flows as high-risk features
- optimize for performance on large developer machines
- keep terminal layouts readable across different terminal sizes

## Development Setup

Requirements:

- Node.js 20+
- pnpm

Install dependencies:

```bash
pnpm install
```

Run in development:

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

## Quality Checks

Before submitting changes, run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Code Guidelines

- use TypeScript with strict typing
- keep files focused on one responsibility
- prefer small, composable services over large coupled modules
- avoid introducing platform-specific assumptions without guards
- preserve safe defaults for destructive operations
- keep command behavior explicit and discoverable
- update documentation when user-facing behavior changes

## UI Guidelines

- keep navigation fully keyboard-driven
- maintain responsive behavior for narrow terminals
- avoid cluttering screens with unnecessary decoration
- prefer fast comprehension over visual noise

## Testing Expectations

Add or update tests when changing:

- command parsing
- cleanup behavior
- filesystem scanning
- package manager detection
- safety checks

Vitest is the current test runner.

## Pull Request Scope

Good contributions usually include:

- one focused feature or fix
- updated docs when relevant
- tests for behavior changes
- no unrelated refactors mixed into the same change

## Areas That Need Extra Care

- cleanup execution
- filesystem traversal
- machine-wide scanning
- progress and responsiveness in the TUI
- Docker and Python detection logic

## Questions and Direction

If a change affects architecture, safety, or scan performance, prefer aligning it with the roadmap first in [ROADMAP.md](ROADMAP.md).
