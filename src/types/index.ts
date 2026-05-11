export type NavigationSection =
  | 'overview'
  | 'projects'
  | 'cache'
  | 'cleanup'
  | 'doctor'
  | 'settings';

export type ScanScope = 'workspace' | 'developer-home' | 'custom';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export type ProjectFramework =
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'angular'
  | 'electron'
  | 'node-api'
  | 'unknown';

export type CleanupTargetKind =
  | 'node_modules'
  | '.pnpm-store'
  | '.npm'
  | '.turbo'
  | '.next'
  | 'dist'
  | 'build';

export type CommandExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export type CommandArgumentValue = string | boolean | number | undefined;

export type CommandCachePolicy = 'prefer-cache' | 'force';

export type CleanupDeletionMode = 'safe' | 'selected';

export type CommandExecutionContext = {
  cwd: string;
  homeDir: string;
};

export type CommandResult = {
  message: string;
  targetSection?: NavigationSection;
  triggerProjectScan?: boolean;
  triggerCleanupScan?: boolean;
  triggerDoctorScan?: boolean;
  cachePolicy?: CommandCachePolicy;
  cleanupDeletionMode?: CleanupDeletionMode;
  showHelp?: boolean;
  scope?: ScanScope;
};

export type CommandDefinition = {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  examples?: string[];
  execute: (
    args: ParsedCommand,
    context: CommandExecutionContext
  ) => Promise<CommandResult> | CommandResult;
};

export type ParsedCommand = {
  name: string;
  aliasUsed?: string;
  raw: string;
  args: string[];
  options: Record<string, CommandArgumentValue>;
};

export type CommandMatch = {
  score: number;
  definition: CommandDefinition;
  matchedBy: 'name' | 'alias' | 'fuzzy';
};

export type ProjectRecord = {
  id: string;
  name: string;
  path: string;
  framework: ProjectFramework;
  packageManager: PackageManager;
  sizeInBytes?: number;
  lastActivityAt?: string;
  activityStatus: 'active' | 'stale' | 'inactive';
};

export type CleanupTargetRecord = {
  id: string;
  kind: CleanupTargetKind;
  path: string;
  sizeInBytes?: number;
  lastModifiedAt?: string;
  recommendation: 'safe' | 'review' | 'active';
};

export type ScanProgress = {
  currentPath?: string;
  visited: number;
  matched: number;
  phase: 'discovering' | 'sizing' | 'done';
};

export type ScanSummary<TRecord> = {
  roots: string[];
  startedAt: string;
  completedAt: string;
  records: TRecord[];
  durationMs: number;
};

export type EnvironmentHealthSnapshot = {
  nodeVersion: string;
  platform: NodeJS.Platform;
  packageManagers: Partial<Record<Exclude<PackageManager, 'unknown'>, boolean>>;
  toolVersions: Record<string, string>;
  toolAvailability: Array<{
    name: string;
    available: boolean;
    version?: string;
    category: 'package-manager' | 'runtime' | 'container';
  }>;
  recommendations: string[];
};

export type CleanupExecutionResult = {
  deleted: CleanupTargetRecord[];
  failed: Array<{
    target: CleanupTargetRecord;
    reason: string;
  }>;
  reclaimedBytes: number;
};

export type DashboardDataSnapshot = {
  roots: string[];
  projects?: ProjectRecord[];
  cleanupTargets?: CleanupTargetRecord[];
  health?: EnvironmentHealthSnapshot;
  activeSection?: NavigationSection;
  statusLine: string;
  helpLines?: string[];
  cleanupExecution?: CleanupExecutionResult;
};

export type ThemePalette = {
  background: string;
  panel: string;
  panelBorder: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  muted: string;
};
