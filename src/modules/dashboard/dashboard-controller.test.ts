import { describe, expect, it } from 'vitest';
import { DashboardController } from './dashboard-controller.js';

describe('DashboardController', () => {
  it('returns unknown-command snapshot without running scanners', async () => {
    const controller = new DashboardController();
    const snapshot = await controller.runCommand('/does-not-exist', {
      scopeOverride: 'workspace'
    });

    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.roots).toEqual([process.cwd()]);
    expect(snapshot.statusLine).toBe('Unknown command: /does-not-exist');
  });

  it('refreshes settings section without scan side-effects', async () => {
    const controller = new DashboardController();
    const snapshot = await controller.refreshSection('settings', 'workspace');

    expect(snapshot.activeSection).toBe('settings');
    expect(snapshot.scope).toBe('workspace');
    expect(snapshot.statusLine).toBe('Settings panel refreshed.');
  });

  it('exposes formatted help lines', () => {
    const controller = new DashboardController();
    const helpLines = controller.getHelpLines();

    expect(helpLines.length).toBeGreaterThan(0);
    expect(helpLines.some((line) => line.startsWith('/scan'))).toBe(true);
  });
});
