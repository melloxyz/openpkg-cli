import { createLogger } from './logger.js';
import { CommandRegistry } from '../commands/registry.js';
import { createBuiltInCommands } from '../commands/builtins.js';
import { EnvironmentService } from '../services/environment.service.js';
import { CleanupScannerService } from '../services/scanner/cleanup-scanner.service.js';
import { ProjectScannerService } from '../services/scanner/project-scanner.service.js';

export const createAppContainer = () => {
  const logger = createLogger();
  const environmentService = new EnvironmentService();
  const cleanupScanner = new CleanupScannerService();
  const projectScanner = new ProjectScannerService();
  const commandRegistry = new CommandRegistry();

  createBuiltInCommands().forEach(commandRegistry.register);

  return {
    logger,
    environmentService,
    cleanupScanner,
    projectScanner,
    commandRegistry
  };
};
