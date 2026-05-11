import type { CommandArgumentValue, ParsedCommand } from '../types/index.js';

const coerceOption = (value: string | undefined): CommandArgumentValue => {
  if (value === undefined) {
    return true;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && value.trim() !== '') {
    return numeric;
  }

  return value;
};

export const parseCommandInput = (input: string): ParsedCommand => {
  const trimmed = input.trim();
  const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const tokens = normalized.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const [name = '', ...rest] = tokens;

  const args: string[] = [];
  const options: Record<string, CommandArgumentValue> = {};

  for (const token of rest) {
    const value = token.replaceAll(/^"|"$/g, '');

    if (value.startsWith('--')) {
      const [key, optionValue] = value.slice(2).split('=');
      if (key) {
        options[key] = coerceOption(optionValue);
      }
      continue;
    }

    args.push(value);
  }

  return {
    name,
    raw: input,
    args,
    options
  };
};
