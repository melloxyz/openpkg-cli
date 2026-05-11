# Roadmap

This roadmap reflects the current state of OpenPgk and the planned direction of the project.

OpenPgk is under active development, so priorities may shift as performance, UX, and platform support evolve.

## Vision

Build a production-grade terminal control center for developer environments that feels fast, modern, and operationally useful across day-to-day workflows.

## Current Stage

OpenPgk is currently in the foundation-plus-initial-operations stage.

The project already has:

- a working terminal UI
- a working command system
- real filesystem scanning
- real cleanup execution
- initial Docker and Python awareness
- responsive layouts
- cached scan snapshots

## Delivered

### Core Platform

- TypeScript-based Node.js CLI/TUI foundation
- pnpm-based project setup
- tsup build pipeline
- ESLint, Prettier, and Vitest configuration
- modular project structure aligned with future growth

### Terminal Experience

- Ink-based TUI application shell
- sidebar navigation
- keyboard-first workflows
- command palette with slash commands
- headless CLI execution mode
- responsive layout behavior for smaller terminals
- progress feedback for scans and deletion workflows

### Command System

- command parser and registry
- fuzzy command suggestions
- built-in commands for scan, projects, cache, cleanup, doctor, help, and settings
- support for both `--scope=...` and positional scope commands such as `/scan machine`

### Scanning and Discovery

- recursive cleanup target discovery
- project discovery across workspace, developer roots, and machine scope
- directory size calculation with runtime fallback support
- project framework detection for:
  - React
  - Next.js
  - Vue
  - Angular
  - Electron
  - Node APIs
  - initial Python projects
- package manager detection using:
  - lockfiles
  - `packageManager` in `package.json`
  - initial Python signals such as Poetry, uv, and pip

### Cleanup Operations

- live cleanup candidate inventory
- multi-select cleanup flow
- select all
- select safe candidates
- preview of reclaimable space before deletion
- real deletion with safety checks
- live refresh after deletion

### Diagnostics

- package manager availability detection
- runtime/tool detection for:
  - npm
  - pnpm
  - yarn
  - bun
  - python
  - docker
  - go
  - rustc
  - java
- recommendation output for missing tooling

### Initial Ecosystem Signals

- Docker-related project signals
- Python-related project signals
- visibility into projects that include compose or Docker configuration

## In Progress / Immediate Next Priorities

### Performance and Scale

- make machine-wide scans faster with incremental indexing
- improve scan granularity so progress reflects real file and directory movement
- reduce repeated directory size computation overhead
- add smarter cache invalidation per root and per directory

### TUI UX Depth

- better pagination for very small terminals
- richer detail panes and drill-down views
- improved command palette affordances
- stronger filtering and sorting inside project and cleanup views

### Cleanup Intelligence

- more nuanced safety heuristics
- better inactive-project detection
- dry-run deletion reports
- structured cleanup summaries export

## Planned

### Docker Module

- Docker engine and daemon health
- image, volume, network, and container inspection
- cache and disk usage views
- safe cleanup flows for Docker artifacts

### Python Module

- virtual environment detection
- Poetry and uv environment insights
- pip cache inspection
- interpreter and environment health checks

### Additional Language and Runtime Modules

- Rust
- Go
- Java
- Bun-specific environment tooling

### Project Operations

- richer project metadata
- workspace grouping
- recent activity heuristics
- profile-based project views

### Plugin Architecture

- plugin loading model
- third-party commands
- external scanners and custom modules

### Background Services

- background indexing
- persistent machine inventory
- delta-based rescans

### AI and Diagnostics

- AI-assisted environment health guidance
- remediation suggestions
- anomaly detection for cache growth and disk usage

## Longer-Term Direction

### Production Readiness

- stronger cross-platform coverage
- broader test coverage for scanning edge cases
- more defensive permission handling
- stable persistence model for preferences and state

### Product Experience

- premium terminal dashboard polish
- workflow shortcuts for daily maintenance
- deeper operational visibility for developer machines

## Release Milestones

### Milestone 0.1.x

Focus:

- stabilize the existing foundation
- improve machine-scan performance
- deepen cleanup and diagnostics workflows

### Milestone 0.2.x

Focus:

- ship stronger Docker and Python modules
- improve project intelligence
- strengthen terminal UX and filtering

### Milestone 0.3.x

Focus:

- introduce plugin architecture
- begin background indexing and profile support

## Contribution Direction

The project should continue favoring:

- clear modular boundaries
- cross-platform behavior
- keyboard-driven workflows
- safe destructive operations
- responsiveness under large developer filesystems
