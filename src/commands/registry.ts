import type { CommandDefinition, CommandMatch, ParsedCommand } from '../types/index.js';
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
