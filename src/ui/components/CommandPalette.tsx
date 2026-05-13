import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CommandPaletteSuggestion } from '../../types/index.js';

type CommandPaletteProps = {
  input: string;
  suggestions: CommandPaletteSuggestion[];
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
            key={`${suggestion.kind}:${suggestion.commandName ?? ''}:${suggestion.label}:${suggestion.insertText}`}
            color={index === selectedIndex ? theme.accent : theme.text}
          >
            {index === selectedIndex ? '›' : ' '} {suggestion.label}{' '}
            <Text color={theme.muted}>{suggestion.detail}</Text>
          </Text>
        ))}
        {suggestions.length === 0 ? <Text color={theme.muted}>No matching commands.</Text> : null}
      </Box>
      {activeSuggestion ? (
        <Box marginTop={1} flexDirection="column">
          {activeSuggestion.kind === 'command' ? (
            <>
              <Text color={theme.primary}>Usage: {activeSuggestion.usage ?? '/'}</Text>
              {activeSuggestion.example ? (
                <Text color={theme.muted}>Example: {activeSuggestion.example}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text color={theme.primary}>Insert: {activeSuggestion.insertText}</Text>
              {activeSuggestion.commandName ? (
                <Text color={theme.muted}>Command: /{activeSuggestion.commandName}</Text>
              ) : null}
            </>
          )}
        </Box>
      ) : null}
    </Box>
  );
};
