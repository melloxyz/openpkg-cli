import { describe, expect, it } from 'vitest';
import { nextNavigationSection } from './navigation.js';

describe('nextNavigationSection', () => {
  it('moves forward through the navigation order and wraps around', () => {
    expect(nextNavigationSection('dashboard', 1)).toBe('packages');
    expect(nextNavigationSection('settings', 1)).toBe('dashboard');
  });

  it('moves backward through the navigation order and wraps around', () => {
    expect(nextNavigationSection('dashboard', -1)).toBe('settings');
    expect(nextNavigationSection('packages', -1)).toBe('dashboard');
  });
});
