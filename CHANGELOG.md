# Changelog

All notable changes to this project should be documented in this file.

The format is based on Keep a Changelog principles, adapted for the current early-development stage of OpenPgk.

## [Unreleased]

### Added

- Initial OpenPgk CLI/TUI foundation with TypeScript, Ink, tsup, ESLint, Prettier, and Vitest
- Interactive terminal dashboard with sidebar navigation, command palette, keyboard workflows, and responsive layout behavior
- Headless command execution mode for non-interactive environments
- Slash command system with built-in commands for scan, projects, cache, cleanup, doctor, help, and settings
- Project scanning across workspace, developer-home, and machine scopes
- Cleanup scanning for `node_modules`, `.pnpm-store`, `.npm`, `.turbo`, `.next`, `dist`, and `build`
- Real cleanup execution with multi-select, select-all, safe-select, confirmation flow, and live refresh
- Progress feedback for scans and cleanup execution
- Scan snapshot caching
- Initial Docker and Python awareness in diagnostics and project discovery
- Project framework detection for React, Next.js, Vue, Angular, Electron, Node APIs, and initial Python projects
- Package manager detection via lockfiles and `packageManager` in `package.json`
- README, roadmap, MIT license, and contribution documentation

### Changed

- Improved directory size calculation to avoid zero-size fallbacks during development runtime
- Expanded command scope handling to support both `--scope=...` and positional forms like `/scan machine`
- Improved project discovery to detect nested projects and additional project signal files
- Improved cleanup and cache views to show aggregated size totals and deletion previews
- Improved Doctor view to surface Docker and Python availability more clearly

### Fixed

- Fixed cleanup scanning so `node_modules` directories are discovered correctly
- Fixed project scanning so nested `package.json` files are detected
- Fixed runtime size estimation failures when worker-based sizing is unavailable
