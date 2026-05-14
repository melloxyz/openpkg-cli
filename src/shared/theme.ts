import gradient from 'gradient-string';
import type { ThemePalette } from '../types/index.js';

export const theme: ThemePalette = {
  background: '#09090B',
  panel: '#111113',
  panelBorder: '#27272A',
  primary: '#3B82F6',
  accent: '#60A5FA',
  success: '#7DD3FC',
  warning: '#A5B4FC',
  danger: '#94A3B8',
  text: '#FAFAFA',
  muted: '#71717A'
};

const brandGradient = gradient(['#3B82F6', '#60A5FA']);

export const renderBrandTitle = (value: string): string => brandGradient.multiline(value);
