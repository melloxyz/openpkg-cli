import type { ProjectRecord } from '../types/index.js';

export type ProjectFilterMode = 'all' | ProjectRecord['activityStatus'];
export type ProjectSortMode = 'recent' | 'size' | 'name';

const compareStrings = (left: string, right: string) => left.localeCompare(right);

export const filterProjects = (projects: ProjectRecord[], filter: ProjectFilterMode) =>
  filter === 'all' ? projects : projects.filter((project) => project.activityStatus === filter);

export const sortProjects = (projects: ProjectRecord[], sortMode: ProjectSortMode) => {
  const records = [...projects];

  records.sort((left, right) => {
    if (sortMode === 'size') {
      const bySize = (right.sizeInBytes ?? 0) - (left.sizeInBytes ?? 0);
      if (bySize !== 0) {
        return bySize;
      }
    }

    if (sortMode === 'name') {
      const byName = compareStrings(left.name, right.name);
      if (byName !== 0) {
        return byName;
      }
    }

    const byActivity = compareStrings(right.lastActivityAt ?? '', left.lastActivityAt ?? '');
    if (byActivity !== 0) {
      return byActivity;
    }

    return compareStrings(left.name, right.name);
  });

  return records;
};

export const getVisibleProjects = (
  projects: ProjectRecord[],
  filter: ProjectFilterMode,
  sortMode: ProjectSortMode
) => sortProjects(filterProjects(projects, filter), sortMode);
