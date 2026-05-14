import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import type { CommandPaletteSuggestion } from '../../types/index.js';
import { truncateText } from '../../utils/text-layout.js';

type CommandPaletteProps = {
  input: string;
  suggestions: CommandPaletteSuggestion[];
  visible: boolean;
  selectedIndex: number;
  width: number;
};

export const CommandPalette = ({
  input,
  suggestions,
  visible,
  selectedIndex,
  width
}: CommandPaletteProps) => {
  if (!visible) {
    return null;
  }

  const activeSuggestion = suggestions[selectedIndex];
  const panelWidth = Math.max(1, Math.min(78, width));
  const lineWidth = Math.max(1, panelWidth - 6);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.primary}
      backgroundColor={theme.panel}
      paddingX={1}
      paddingY={1}
      marginTop={1}
      width={panelWidth}
    >
      <Box justifyContent="space-between" alignItems="center">
        <Text color={theme.text} bold>
          Command Palette
        </Text>
        <Text color={theme.muted}>{suggestions.length} match(es)</Text>
      </Box>
      <Text color={theme.primary}>{truncateText(input || '/', lineWidth)}</Text>
      <Text color={theme.muted}>Tab completes | Enter runs | Esc closes</Text>
      <Box marginTop={1} flexDirection="column">
        {suggestions.map((suggestion, index) => (
          <Text
            key={`${suggestion.kind}:${suggestion.commandName ?? ''}:${suggestion.label}:${suggestion.insertText}`}
            color={index === selectedIndex ? theme.primary : theme.text}
            bold={index === selectedIndex}
          >
            {index === selectedIndex ? '▸' : ' '} {truncateText(suggestion.label, 20)}{' '}
            <Text color={theme.muted}>{truncateText(suggestion.detail ?? '', lineWidth - 24)}</Text>
          </Text>
        ))}
        {suggestions.length === 0 ? (
          <Text color={theme.muted}>No matching commands. Press Esc to close.</Text>
        ) : null}
      </Box>
      {activeSuggestion ? (
        <Box marginTop={1} flexDirection="column">
          {activeSuggestion.kind === 'command' ? (
            <>
              <Text color={theme.muted}>
                {truncateText(`Usage: ${activeSuggestion.usage ?? '/'}`, lineWidth)}
              </Text>
              {activeSuggestion.example ? (
                <Text color={theme.muted}>
                  {truncateText(`Example: ${activeSuggestion.example}`, lineWidth)}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text color={theme.muted}>
                {truncateText(`Insert: ${activeSuggestion.insertText}`, lineWidth)}
              </Text>
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
