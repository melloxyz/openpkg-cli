import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CommandMatch } from '../../types/index.js';

type CommandPaletteProps = {
  input: string;
  suggestions: CommandMatch[];
  visible: boolean;
  selectedIndex: number;
};

export const CommandPalette = ({
  input,
  suggestions,
  visible,
  selectedIndex
}: CommandPaletteProps) => {
  if (!visible) {
    return null;
  }

  const activeSuggestion = suggestions[selectedIndex];

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
        {suggestions.map((suggestion, index) => (
          <Text
            key={suggestion.definition.name}
            color={index === selectedIndex ? theme.accent : theme.text}
          >
            {index === selectedIndex ? '›' : ' '} /{suggestion.definition.name}{' '}
            <Text color={theme.muted}>{suggestion.definition.description}</Text>
          </Text>
        ))}
        {suggestions.length === 0 ? <Text color={theme.muted}>No matching commands.</Text> : null}
      </Box>
      {activeSuggestion ? (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.primary}>Usage: {activeSuggestion.definition.usage ?? '/'}</Text>
          {activeSuggestion.definition.examples?.[0] ? (
            <Text color={theme.muted}>Example: {activeSuggestion.definition.examples[0]}</Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
};
