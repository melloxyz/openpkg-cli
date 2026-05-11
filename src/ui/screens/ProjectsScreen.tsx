import React from 'react';
import { Panel } from '../components/Panel.js';
import { Table } from '../components/Table.js';
import { formatBytes, formatRelativeDate } from '../../utils/format.js';
import type { ProjectRecord } from '../../types/index.js';

type ProjectsScreenProps = {
  projects: ProjectRecord[];
};

export const ProjectsScreen = ({ projects }: ProjectsScreenProps) => (
  <Panel
    title="Projects"
    footer="Framework and package manager detection are designed to expand module-by-module."
  >
    <Table
      headers={['Name', 'Framework', 'PM', 'Size', 'Last Active']}
      rows={projects
        .slice(0, 10)
        .map((project) => [
          project.name.padEnd(18),
          project.framework.padEnd(10),
          project.packageManager.padEnd(7),
          formatBytes(project.sizeInBytes).padEnd(8),
          formatRelativeDate(project.lastActivityAt)
        ])}
    />
  </Panel>
);
