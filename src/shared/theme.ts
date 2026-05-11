import gradient from 'gradient-string';
import type { ThemePalette } from '../types/index.js';

export const theme: ThemePalette = {
  background: '#0B1020',
  panel: '#11182B',
  panelBorder: '#23314F',
  primary: '#6EE7F9',
  accent: '#F59E0B',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  text: '#E5EEF9',
  muted: '#8FA4C7'
};

const brandGradient = gradient(['#4FE1F7', '#5EEAD4', '#F8B84E']);

export const renderBrandTitle = (value: string): string => brandGradient.multiline(value);
