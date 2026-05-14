import { NAVIGATION_ITEMS } from '../shared/constants.js';
import type { NavigationSection } from '../types/index.js';

export const NAVIGATION_SECTION_ORDER = NAVIGATION_ITEMS.map((item) => item.key);

export const nextNavigationSection = (current: NavigationSection, direction: 1 | -1) => {
  const currentIndex = NAVIGATION_SECTION_ORDER.indexOf(current);
  const nextIndex =
    (currentIndex + direction + NAVIGATION_SECTION_ORDER.length) % NAVIGATION_SECTION_ORDER.length;
  return NAVIGATION_SECTION_ORDER[nextIndex] ?? 'dashboard';
};
