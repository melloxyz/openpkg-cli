import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CommandMatch } from '../../types/index.js';

type CommandPaletteProps = {
  input: string;
  suggestions: CommandMatch[];
  visible: boolean;
};

export const CommandPalette = ({ input, suggestions, visible }: CommandPaletteProps) => {
  if (!visible) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.primary}
      paddingX={1}
      paddingY={1}
      marginTop={1}
    >
      <Text color={theme.accent}>{input || '/'}</Text>
      <Box marginTop={1} flexDirection="column">
        {suggestions.map((suggestion) => (
          <Text key={suggestion.definition.name} color={theme.text}>
            /{suggestion.definition.name}{' '}
            <Text color={theme.muted}>{suggestion.definition.description}</Text>
          </Text>
        ))}
        {suggestions.length === 0 ? <Text color={theme.muted}>No matching commands.</Text> : null}
      </Box>
    </Box>
  );
};
