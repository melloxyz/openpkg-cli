import { useMemo } from 'react';
import type { CommandPaletteSuggestion } from '../types/index.js';
import { CommandRegistry } from '../commands/registry.js';

export const useCommandSuggestions = (
  registry: CommandRegistry,
  input: string
): CommandPaletteSuggestion[] => {
  return useMemo(() => registry.getPaletteSuggestions(input), [input, registry]);
};
