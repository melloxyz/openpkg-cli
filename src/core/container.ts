import { createLogger } from './logger.js';
import { CommandRegistry } from '../commands/registry.js';
import { createBuiltInCommands } from '../commands/builtins.js';
import { CleanupExecutorService } from '../services/cleanup-executor.service.js';
import { EnvironmentService } from '../services/environment.service.js';
import { EnvironmentUpdatesService } from '../services/environment-updates.service.js';
import { ScanCacheService } from '../services/scan-cache.service.js';
import { CleanupScannerService } from '../services/scanner/cleanup-scanner.service.js';
import { ProjectScannerService } from '../services/scanner/project-scanner.service.js';

export const createAppContainer = () => {
  const logger = createLogger();
  const environmentService = new EnvironmentService();
  const environmentUpdatesService = new EnvironmentUpdatesService();
  const cleanupScanner = new CleanupScannerService();
  const projectScanner = new ProjectScannerService();
  const cleanupExecutor = new CleanupExecutorService();
  const scanCache = new ScanCacheService();
  const commandRegistry = new CommandRegistry();

  createBuiltInCommands().forEach(commandRegistry.register);

  return {
    logger,
    environmentService,
    environmentUpdatesService,
    cleanupScanner,
    projectScanner,
    cleanupExecutor,
    scanCache,
    commandRegistry
  };
};
