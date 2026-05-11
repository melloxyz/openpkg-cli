# OpenPgk

OpenPgk is a keyboard-first developer control center for the terminal.

It is designed to help developers inspect and manage local environments, package managers, runtimes, caches, projects, disk-heavy artifacts, diagnostics, and cleanup workflows from one fast TUI/CLI experience.

## Status

OpenPgk is currently in active development.

The project already has a runnable foundation with real scanning, diagnostics, cleanup execution, and a responsive terminal UI, but the product is not yet considered stable. Expect rapid iteration, behavior changes, and unfinished modules while the architecture is still expanding.

## Goals

OpenPgk is not intended to be only a wrapper around package managers.

The long-term goal is to provide a cross-platform developer operating center for:

- package managers
- runtimes
- local projects
- caches and build artifacts
- cleanup workflows
- diagnostics and environment health
- Docker and container visibility
- Python and other polyglot tooling
- future plugins, profiles, indexing, and AI-assisted diagnostics

## Current Capabilities

The current implementation includes:

- interactive TUI built with Ink and React
- sidebar navigation with keyboard focus management
- command palette with slash commands and fuzzy suggestions
- headless CLI command execution for non-interactive environments
- project discovery across workspace, developer roots, or machine scope
- cleanup target discovery for `node_modules`, `.pnpm-store`, `.npm`, `.turbo`, `.next`, `dist`, and `build`
- real cleanup execution with confirmation flow and live refresh
- project framework detection for React, Next.js, Vue, Angular, Electron, Node APIs, and initial Python support
- package manager detection via lockfiles and `packageManager` in `package.json`
- Docker and Python signals surfaced in diagnostics and project metadata
- cached scan snapshots for faster repeated use
- responsive layout handling for different terminal sizes
- progress feedback during scans and deletion flows

## Tech Stack

- Node.js
- TypeScript
- Ink
- `@inkjs/ui`
- execa
- chalk
- gradient-string
- boxen
- zod
- fast-glob
- tsup
- Vitest
- ESLint
- Prettier
- pnpm

## Installation

### Requirements

- Node.js 20 or newer
- pnpm

### Local Setup

```bash
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
```

### Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Running OpenPgk

### Interactive TUI

```bash
pnpm dev
```

Or after building:

```bash
node dist/cli.js
```

### Headless Commands

Examples:

```bash
node dist/cli.js /doctor
node dist/cli.js /projects workspace
node dist/cli.js /cleanup machine
node dist/cli.js /cleanup workspace --delete-safe
node dist/cli.js /scan machine
```

## Command Reference

### Supported Commands

- `/scan`
- `/projects`
- `/cache`
- `/cleanup`
- `/doctor`
- `/help`
- `/settings`

### Scope Variants

The scanner supports both option-based and positional scope syntax.

Examples:

```bash
/scan --scope=workspace
/scan workspace
/scan machine
/projects machine
/cleanup workspace
/cache machine
```

### Supported Scopes

- `workspace`: scans only the current working directory
- `developer-home`: scans common developer roots such as Desktop, Projects, Code, dev, and Developer
- `machine`: scans the current user's home directory broadly to discover developer projects and artifacts

## Keyboard Navigation

### Global

- `Tab`: switch focus between sidebar and content
- `h` / `Left`: move focus to sidebar
- `l` / `Right`: move focus to content
- `j` / `Down`: move selection
- `k` / `Up`: move selection
- `/`: open command palette
- `r`: refresh current section
- `Ctrl+C`: exit

### Cleanup Views

- `Space`: toggle selection
- `s`: select all visible cleanup targets
- `a`: select all safe cleanup targets
- `c`: clear selection
- `x`: arm deletion
- `y`: confirm deletion
- `Esc`: cancel deletion

## Cleanup Safety Model

Cleanup is a real destructive operation.

OpenPgk currently protects the deletion flow by:

- limiting deletion to known cleanup directory names
- refusing filesystem root deletion
- verifying the target still exists and is a directory
- requiring a confirmation step in the interactive TUI
- refreshing the cleanup inventory after deletion

Even with these protections, review deletion candidates carefully before confirming them.

## Project Detection

OpenPgk currently scans for project signals such as:

- `package.json`
- `pyproject.toml`
- `requirements.txt`
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.yaml`
- `compose.yml`
- `compose.yaml`

It uses these files to infer:

- project name
- framework
- package manager
- activity status
- size
- Docker and Python signals

## Repository Structure

```text
src/
├── app/
├── commands/
├── core/
├── hooks/
├── modules/
├── plugins/
├── services/
├── shared/
├── types/
├── ui/
└── utils/
```

## Architecture Notes

The current codebase is intentionally modular and organized around separable concerns:

- `commands/`: parsing, registry, built-in command definitions
- `modules/dashboard/`: orchestration and stateful command execution
- `services/`: environment inspection, scanning, caching, cleanup execution
- `ui/`: terminal layout, panels, lists, screens, and interaction surfaces
- `shared/` and `types/`: reusable constants, schemas, and contracts

This structure is intended to support future additions such as plugin systems, language-specific modules, workspace profiles, and background indexing without tightly coupling features together.

## Roadmap

See [ROADMAP.md](/C:/Users/user/Desktop/openpkg/ROADMAP.md) for the current delivery status and planned work.

## License

This project is licensed under the MIT License.

See [LICENSE](/C:/Users/user/Desktop/openpkg/LICENSE) for details.
