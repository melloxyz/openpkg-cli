const releaseHeadingPattern = /^## \[(?<version>[^\]]+)\](?:\s+-\s+.*)?$/;
const releaseTagPattern =
  /^v(?<version>[0-9]+(?:\.[0-9]+){2}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/;
const sectionSeparatorPattern = /^---$/;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getReleaseVersionFromTag = (tag: string): string => {
  const match = releaseTagPattern.exec(tag);

  if (!match?.groups?.version) {
    throw new Error(`Invalid release tag "${tag}". Expected a tag in the form vX.X.X.`);
  }

  return match.groups.version;
};

export const extractReleaseNotes = (changelog: string, version: string): string => {
  const lines = changelog.split(/\r?\n/);
  const headingPattern = new RegExp(`^## \\[${escapeRegExp(version)}\\](?:\\s+-\\s+.*)?$`);
  const releaseStart = lines.findIndex((line) => headingPattern.test(line));

  if (releaseStart === -1) {
    throw new Error(`Release notes for ${version} were not found in the changelog.`);
  }

  const nextReleaseHeading = lines
    .slice(releaseStart + 1)
    .findIndex((line) => releaseHeadingPattern.test(line));
  const releaseEnd =
    nextReleaseHeading === -1 ? lines.length : releaseStart + 1 + nextReleaseHeading;
  const notesLines = lines.slice(releaseStart + 1, releaseEnd);

  while (
    notesLines.length > 0 &&
    (notesLines.at(-1)?.trim() === '' ||
      sectionSeparatorPattern.test(notesLines.at(-1)?.trim() ?? ''))
  ) {
    notesLines.pop();
  }

  const notes = notesLines.join('\n').trim();

  if (!notes) {
    throw new Error(`Release notes for ${version} are empty.`);
  }

  return notes;
};

export const buildReleaseNotes = (options: {
  changelog: string;
  tag: string;
  packageVersion: string;
}): string => {
  const versionFromTag = getReleaseVersionFromTag(options.tag);

  if (versionFromTag !== options.packageVersion) {
    throw new Error(
      `Release tag "${options.tag}" does not match package version "${options.packageVersion}".`
    );
  }

  return extractReleaseNotes(options.changelog, options.packageVersion);
};
