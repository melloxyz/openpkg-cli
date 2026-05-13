import { describe, expect, it } from 'vitest';
import type { ProjectRecord } from '../types/index.js';
import { filterProjects, getVisibleProjects, sortProjects } from './project-view.js';

const projects: ProjectRecord[] = [
  {
    id: 'alpha',
    name: 'alpha',
    path: '/alpha',
    framework: 'react',
    packageManager: 'pnpm',
    sizeInBytes: 300,
    lastActivityAt: '2026-01-01T00:00:00.000Z',
    activityStatus: 'stale'
  },
  {
    id: 'beta',
    name: 'beta',
    path: '/beta',
    framework: 'node-api',
    packageManager: 'npm',
    sizeInBytes: 100,
    lastActivityAt: '2026-02-01T00:00:00.000Z',
    activityStatus: 'active'
  },
  {
    id: 'gamma',
    name: 'gamma',
    path: '/gamma',
    framework: 'unknown',
    packageManager: 'yarn',
    sizeInBytes: 200,
    activityStatus: 'inactive'
  }
];

describe('project-view helpers', () => {
  it('filters projects by activity status', () => {
    expect(filterProjects(projects, 'active')).toEqual([projects[1]]);
    expect(filterProjects(projects, 'all')).toEqual(projects);
  });

  it('sorts projects by size, name and recency', () => {
    expect(sortProjects(projects, 'size').map((project) => project.id)).toEqual([
      'alpha',
      'gamma',
      'beta'
    ]);

    expect(sortProjects(projects, 'name').map((project) => project.id)).toEqual([
      'alpha',
      'beta',
      'gamma'
    ]);

    expect(sortProjects(projects, 'recent').map((project) => project.id)).toEqual([
      'beta',
      'alpha',
      'gamma'
    ]);
  });

  it('chains filtering and sorting for the visible project list', () => {
    expect(getVisibleProjects(projects, 'active', 'name')).toEqual([projects[1]]);
  });
});
