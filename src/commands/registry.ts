import type {
  CommandDefinition,
  CommandMatch,
  CommandPaletteSuggestion,
  ParsedCommand
} from '../types/index.js';
import { parseCommandInput } from './parser.js';

const scoreCandidate = (input: string, command: CommandDefinition): CommandMatch | undefined => {
  const normalizedInput = input.toLowerCase();
  const name = command.name.toLowerCase();
  const aliases = command.aliases?.map((alias) => alias.toLowerCase()) ?? [];

  if (name === normalizedInput) {
    return { score: 100, definition: command, matchedBy: 'name' };
  }

  if (aliases.includes(normalizedInput)) {
    return { score: 95, definition: command, matchedBy: 'alias' };
  }

  const haystack = [name, ...aliases];
  const fuzzyScore = haystack.reduce((best, candidate) => {
    if (candidate.startsWith(normalizedInput)) {
      return Math.max(best, 80 - (candidate.length - normalizedInput.length));
    }

    if (candidate.includes(normalizedInput)) {
      return Math.max(best, 60 - (candidate.length - normalizedInput.length));
    }

    return best;
  }, 0);

  if (fuzzyScore > 0) {
    return { score: fuzzyScore, definition: command, matchedBy: 'fuzzy' };
  }

  return undefined;
};

const getCurrentTokenInfo = (input: string) => {
  const leadingWhitespace = input.match(/^\s*/)?.[0].length ?? 0;
  const trimmedInput = input.slice(leadingWhitespace);
  const lastSeparator = trimmedInput.lastIndexOf(' ');
  const tokenStart = leadingWhitespace + (lastSeparator >= 0 ? lastSeparator + 1 : 0);

  return {
    token: input.slice(tokenStart),
    rangeStart: tokenStart,
    rangeEnd: input.length
  };
};

const normalizeFlagName = (value: string) => (value.startsWith('--') ? value : `--${value}`);

const buildCommandSuggestion = (
  match: CommandMatch,
  rangeStart: number,
  rangeEnd: number
): CommandPaletteSuggestion => ({
  kind: 'command',
  label: `/${match.definition.name}`,
  detail: match.definition.description,
  insertText: `/${match.definition.name}`,
  rangeStart,
  rangeEnd,
  commandName: match.definition.name,
  ...(match.definition.usage ? { usage: match.definition.usage } : {}),
  ...(match.definition.examples?.[0] ? { example: match.definition.examples[0] } : {})
});

const buildCompletionSuggestions = (
  command: CommandDefinition,
  parsed: ParsedCommand,
  input: string
): CommandPaletteSuggestion[] => {
  const completionEntries = command.completion?.entries ?? [];
  if (completionEntries.length === 0) {
    return [];
  }

  const tokenInfo = getCurrentTokenInfo(input);
  const token = tokenInfo.token;
  const tokenLower = token.toLowerCase();
  const activeOptionName = token.startsWith('--')
    ? token.slice(2).split('=')[0]?.toLowerCase() ?? ''
    : undefined;
  const usedArgs = new Set(parsed.args.map((value) => value.toLowerCase()));
  const usedOptions = new Set(
    Object.keys(parsed.options).map((value) => value.toLowerCase())
  );
  const hasSelectedArgument = usedArgs.size > 0 || usedOptions.has('scope');
  const shouldSuggestArguments = !(hasSelectedArgument && token === '');
  const suggestions: CommandPaletteSuggestion[] = [];

  if (token.startsWith('--')) {
    const equalsIndex = token.indexOf('=');

    if (equalsIndex >= 0) {
      const flagName = token.slice(0, equalsIndex);
      const valuePrefix = token.slice(equalsIndex + 1).toLowerCase();

      for (const entry of completionEntries) {
        if (entry.kind !== 'flag' || normalizeFlagName(entry.value).toLowerCase() !== flagName) {
          continue;
        }

        const values = entry.values ?? [];
        if (values.length === 0) {
          suggestions.push({
            kind: 'flag',
            label: `${flagName}=`,
            detail: entry.description,
            insertText: `${flagName}=`,
            rangeStart: tokenInfo.rangeStart,
            rangeEnd: tokenInfo.rangeEnd,
            commandName: command.name
          });
          continue;
        }

        for (const value of values) {
          if (!value.toLowerCase().startsWith(valuePrefix)) {
            continue;
          }

          suggestions.push({
            kind: 'flag',
            label: value,
            detail: `${entry.description} (${flagName})`,
            insertText: `${flagName}=${value}`,
            rangeStart: tokenInfo.rangeStart,
            rangeEnd: tokenInfo.rangeEnd,
            commandName: command.name
          });
        }
      }

      return suggestions;
    }

    for (const entry of completionEntries) {
      if (entry.kind !== 'flag') {
        continue;
      }

      const flagName = normalizeFlagName(entry.value);
      const optionName = flagName.slice(2).toLowerCase();
      if (usedOptions.has(optionName) && activeOptionName !== optionName) {
        continue;
      }
      if (!flagName.toLowerCase().startsWith(tokenLower)) {
        continue;
      }

      suggestions.push({
        kind: 'flag',
        label: entry.values?.length ? `${flagName}=` : flagName,
        detail: entry.description,
        insertText: entry.values?.length ? `${flagName}=` : flagName,
        rangeStart: tokenInfo.rangeStart,
        rangeEnd: tokenInfo.rangeEnd,
        commandName: command.name
      });
    }

    return suggestions;
  }

  for (const entry of completionEntries) {
    if (entry.kind === 'argument') {
      if (!shouldSuggestArguments) {
        continue;
      }

      if (usedArgs.has(entry.value.toLowerCase())) {
        continue;
      }

      if (token && !entry.value.toLowerCase().startsWith(tokenLower)) {
        continue;
      }

      suggestions.push({
        kind: 'argument',
        label: entry.value,
        detail: entry.description,
        insertText: entry.value,
        rangeStart: tokenInfo.rangeStart,
        rangeEnd: tokenInfo.rangeEnd,
        commandName: command.name
      });
      continue;
    }

    const flagName = normalizeFlagName(entry.value);
    const optionName = flagName.slice(2).toLowerCase();
    if (usedOptions.has(optionName) && activeOptionName !== optionName) {
      continue;
    }
    if (token && !flagName.toLowerCase().startsWith(tokenLower)) {
      continue;
    }

    suggestions.push({
      kind: 'flag',
      label: entry.values?.length ? `${flagName}=` : flagName,
      detail: entry.description,
      insertText: entry.values?.length ? `${flagName}=` : flagName,
      rangeStart: tokenInfo.rangeStart,
      rangeEnd: tokenInfo.rangeEnd,
      commandName: command.name
    });
  }

  return suggestions;
};

export class CommandRegistry {
  readonly #commands = new Map<string, CommandDefinition>();

  register = (command: CommandDefinition): void => {
    this.#commands.set(command.name, command);
  };

  getAll = (): CommandDefinition[] => {
    return [...this.#commands.values()];
  };

  getSuggestions = (input: string): CommandMatch[] => {
    const normalizedInput = input.trim().replace(/^\//, '');

    if (!normalizedInput) {
      return this.getAll().map((definition) => ({
        score: 1,
        definition,
        matchedBy: 'name'
      }));
    }

    return this.getAll()
      .map((command) => scoreCandidate(normalizedInput, command))
      .filter((value): value is CommandMatch => Boolean(value))
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
  };

  getPaletteSuggestions = (input: string): CommandPaletteSuggestion[] => {
    const command = this.resolve(input);

    if (!command) {
      const tokenInfo = getCurrentTokenInfo(input);
      return this.getSuggestions(input).map((match) =>
        buildCommandSuggestion(match, tokenInfo.rangeStart, tokenInfo.rangeEnd)
      );
    }

    const parsed = parseCommandInput(input);
    const tokenInfo = getCurrentTokenInfo(input);
    const shouldOfferCompletions =
      input.endsWith(' ') || tokenInfo.token.startsWith('-') || parsed.args.length > 0;

    if (shouldOfferCompletions) {
      const completionSuggestions = buildCompletionSuggestions(command, parsed, input);
      if (completionSuggestions.length > 0) {
        return completionSuggestions.slice(0, 6);
      }

      return [];
    }

    const commandMatches = this.getSuggestions(`/${parsed.name || command.name}`);
    return commandMatches.map((match) =>
      buildCommandSuggestion(match, tokenInfo.rangeStart, tokenInfo.rangeEnd)
    );
  };

  resolve = (input: string): CommandDefinition | undefined => {
    const parsed = parseCommandInput(input);
    const commandName = parsed.name.toLowerCase();

    return this.getAll().find((command) => {
      if (command.name.toLowerCase() === commandName) {
        return true;
      }

      return command.aliases?.some((alias) => alias.toLowerCase() === commandName) ?? false;
    });
  };

  parse = (input: string): ParsedCommand => parseCommandInput(input);
}
