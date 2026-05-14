import type { ScanScope } from '../types/index.js';

export type DashboardTip = {
  title: string;
  body: string;
};

export type DashboardPrimarySuggestion = {
  title: string;
  detail: string;
  tone: 'primary' | 'warning';
};

export type DashboardTipContext = {
  projectCount: number;
  cleanupCount: number;
  healthLoaded: boolean;
  scope: ScanScope;
};

export type DashboardPrimarySuggestionContext = {
  inactiveProjectCount: number;
  projectCount: number;
  safeCandidateCount: number;
  scope: ScanScope;
  firstHealthRecommendation?: string;
};

export const DASHBOARD_TIPS: readonly [DashboardTip, DashboardTip, DashboardTip, DashboardTip, DashboardTip] = [
  {
    title: 'Start with the current workspace.',
    body: 'Use /scan workspace --force when you want a quick refresh without leaving the repo you are in.'
  },
  {
    title: 'Cleanup is safest when reviewed first.',
    body: 'Open Cleanup with 3, then press a to select safe candidates before you arm any deletion.'
  },
  {
    title: 'Doctor fills in the environment story.',
    body: 'Run /doctor or press 4 to refresh runtime, package-manager, and update diagnostics.'
  },
  {
    title: 'The sidebar stays keyboard-first.',
    body: 'Use 1-8 to jump sections, j/k to move, and r to refresh the current panel.'
  },
  {
    title: 'About is part of the product now.',
    body: 'Press 8 or run /info to review version, links, roadmap status, and the open-box easter egg.'
  }
];

export const getDashboardTip = ({
  projectCount,
  cleanupCount,
  healthLoaded,
  scope
}: DashboardTipContext): DashboardTip => {
  if (cleanupCount > 0) {
    return DASHBOARD_TIPS[1];
  }

  if (projectCount > 0) {
    return DASHBOARD_TIPS[0];
  }

  if (!healthLoaded) {
    return DASHBOARD_TIPS[2];
  }

  if (scope === 'workspace') {
    return DASHBOARD_TIPS[3];
  }

  return DASHBOARD_TIPS[4];
};

export const getDashboardPrimarySuggestion = ({
  inactiveProjectCount,
  projectCount,
  safeCandidateCount,
  scope,
  firstHealthRecommendation
}: DashboardPrimarySuggestionContext): DashboardPrimarySuggestion | undefined => {
  if (safeCandidateCount > 0) {
    return {
      title: 'Review safe cleanup candidates',
      detail: `${safeCandidateCount} cleanup target(s) can be reviewed safely before any deletion.`,
      tone: 'warning'
    };
  }

  if ((firstHealthRecommendation ?? '').length > 0) {
    return {
      title: 'Follow the latest environment note',
      detail: firstHealthRecommendation ?? '',
      tone: 'primary'
    };
  }

  if (inactiveProjectCount > 0) {
    return {
      title: 'Inspect stale projects',
      detail: `${inactiveProjectCount} project(s) look stale or inactive in the current inventory.`,
      tone: 'warning'
    };
  }

  if (projectCount === 0) {
    return {
      title: 'Start with a live scan',
      detail: `Run /scan --scope=${scope} to populate projects, cleanup candidates, and environment signals.`,
      tone: 'primary'
    };
  }

  return undefined;
};
