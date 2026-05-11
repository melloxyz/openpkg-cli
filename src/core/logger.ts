export type LogLevel = 'info' | 'warn' | 'error';

export const createLogger = () => ({
  log: (level: LogLevel, message: string) => {
    if (process.env.OPENPGK_DEBUG === '1') {
      process.stderr.write(`[${level}] ${message}\n`);
    }
  }
});
