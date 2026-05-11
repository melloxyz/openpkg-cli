import { useMemo } from 'react';
import type { CommandMatch } from '../types/index.js';
import { CommandRegistry } from '../commands/registry.js';

export const useCommandSuggestions = (registry: CommandRegistry, input: string): CommandMatch[] => {
  return useMemo(() => registry.getSuggestions(input), [input, registry]);
};
