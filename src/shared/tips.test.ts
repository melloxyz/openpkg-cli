import { describe, expect, it } from 'vitest';
import { getDashboardPrimarySuggestion, getDashboardTip } from './tips.js';

describe('getDashboardTip', () => {
  it('prioritizes cleanup discoverability when cleanup candidates are loaded', () => {
    const tip = getDashboardTip({
      projectCount: 4,
      cleanupCount: 2,
      healthLoaded: true,
      scope: 'developer-home'
    });

    expect(tip.title).toContain('Cleanup');
  });

  it('falls back to the info-screen tip when the dashboard is otherwise calm', () => {
    const tip = getDashboardTip({
      projectCount: 0,
      cleanupCount: 0,
      healthLoaded: true,
      scope: 'developer-home'
    });

    expect(tip.body).toContain('/info');
  });
});

describe('getDashboardPrimarySuggestion', () => {
  it('prioritizes safe cleanup over a generic live-scan call to action', () => {
    const suggestion = getDashboardPrimarySuggestion({
      inactiveProjectCount: 0,
      projectCount: 0,
      safeCandidateCount: 3,
      scope: 'workspace'
    });

    expect(suggestion?.title).toContain('cleanup');
  });

  it('falls back to a live scan only when nothing more actionable exists', () => {
    const suggestion = getDashboardPrimarySuggestion({
      inactiveProjectCount: 0,
      projectCount: 0,
      safeCandidateCount: 0,
      scope: 'workspace'
    });

    expect(suggestion?.title).toContain('live scan');
  });
});
