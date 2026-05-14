import packageJsonData from '../../package.json';

type PackageJsonMetadata = {
  version: string;
  description?: string;
  author?: string | { name?: string };
  homepage?: string;
  repository?: string | { url?: string };
  bugs?: string | { url?: string };
};

const packageJson = packageJsonData as PackageJsonMetadata;

const normalizeRepositoryUrl = (value: string) => value.replace(/^git\+/, '').replace(/\.git$/, '');

const resolveStringOrUrl = (
  value: PackageJsonMetadata['repository'] | PackageJsonMetadata['bugs'],
  fallback: string
) => {
  if (typeof value === 'string') {
    return value;
  }

  return value?.url ?? fallback;
};

const resolveAuthorName = (value: PackageJsonMetadata['author']) => {
  if (typeof value === 'string') {
    return value;
  }

  return value?.name ?? 'OpenPkg contributors';
};

const repositoryUrl = normalizeRepositoryUrl(
  resolveStringOrUrl(packageJson.repository, 'https://github.com/melloxyz/openpkg-cli.git')
);

export const APP_NAME = 'OpenPkg';
export const APP_VERSION = packageJson.version;
export const APP_DESCRIPTION =
  packageJson.description ?? 'Developer operating center for local development environments.';
export const APP_AUTHOR = resolveAuthorName(packageJson.author);
export const APP_HOMEPAGE = packageJson.homepage ?? repositoryUrl;
export const APP_REPOSITORY_URL = repositoryUrl;
export const APP_ISSUES_URL = resolveStringOrUrl(
  packageJson.bugs,
  'https://github.com/melloxyz/openpkg-cli/issues'
);
export const APP_LATEST_RELEASE = `v${packageJson.version}`;
export const APP_ROADMAP_STATUS = '0.4.x under development';
