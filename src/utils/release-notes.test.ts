import { describe, expect, it } from 'vitest';
import {
  buildReleaseNotes,
  extractReleaseNotes,
  getReleaseVersionFromTag
} from './release-notes.js';

const changelog = `# Changelog

## [Unreleased] (Em Desenvolvimento)

### Added

- Future work

## [0.2.0] - 2026-05-12

### Added

- Local release notes extraction helper.

### Fixed

- Release validation now uses a local script.

## [0.1.0] - 2026-05-11

### Added

- Initial release.
`;

describe('release notes utils', () => {
  it('parses the release version from a tag', () => {
    expect(getReleaseVersionFromTag('v0.2.0')).toBe('0.2.0');
    expect(() => getReleaseVersionFromTag('release-0.2.0')).toThrow(
      'Invalid release tag "release-0.2.0". Expected a tag in the form vX.X.X.'
    );
  });

  it('extracts the matching changelog section', () => {
    expect(extractReleaseNotes(changelog, '0.2.0')).toBe(
      '### Added\n\n- Local release notes extraction helper.\n\n### Fixed\n\n- Release validation now uses a local script.'
    );
  });

  it('drops trailing changelog separators from the extracted section', () => {
    const changelogWithSeparator = `${changelog}\n---\n`;

    expect(extractReleaseNotes(changelogWithSeparator, '0.2.0')).not.toContain('\n---');
  });

  it('validates tag and package version before extracting notes', () => {
    expect(
      buildReleaseNotes({
        changelog,
        tag: 'v0.2.0',
        packageVersion: '0.2.0'
      })
    ).toContain('Release validation now uses a local script.');

    expect(() =>
      buildReleaseNotes({
        changelog,
        tag: 'v0.2.1',
        packageVersion: '0.2.0'
      })
    ).toThrow('Release tag "v0.2.1" does not match package version "0.2.0".');
  });
});
