export type NavigationSection =
  | 'overview'
  | 'projects'
  | 'cache'
  | 'cleanup'
  | 'doctor'
  | 'settings';

export type ScanScope = 'workspace' | 'developer-home' | 'machine' | 'custom';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'poetry' | 'pip' | 'uv' | 'unknown';

export type ProjectFramework =
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'angular'
  | 'electron'
  | 'node-api'
  | 'python'
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

export type UpdateFetchPolicy = 'auto' | 'cache-only' | 'force';

export type EnvironmentToolName =
  | 'npm'
  | 'pnpm'
  | 'yarn'
  | 'bun'
  | 'node'
  | 'python'
  | 'docker'
  | 'go'
  | 'rustc'
  | 'java';

export type EnvironmentToolUpdateStatus = 'current' | 'outdated' | 'unknown' | 'offline';

export type EnvironmentToolUpdateSource = 'npm' | 'nodejs' | 'github';

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
  updateFetchPolicy?: UpdateFetchPolicy;
  cleanupDeletionMode?: CleanupDeletionMode;
  cleanupDryRun?: boolean;
  updatesOnly?: boolean;
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
  signals?: string[];
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
  total: number;
  phase: 'discovering' | 'sizing' | 'done';
};

export type ScanOptions = {
  onProgress?: (progress: ScanProgress) => void;
};

export type CleanupExecutionProgress = {
  currentPath?: string;
  current: number;
  total: number;
  phase: 'validating' | 'deleting' | 'done';
};

export type CleanupExecutionOptions = {
  onProgress?: (progress: CleanupExecutionProgress) => void;
};

export type CleanupExecutionSummary = {
  requestedCount: number;
  plannedCount: number;
  deletedCount: number;
  failedCount: number;
  reclaimedBytes: number;
  dryRun: boolean;
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
  updatesCheckedAt?: string;
  toolAvailability: Array<{
    name: EnvironmentToolName;
    available: boolean;
    version?: string;
    latestVersion?: string;
    updateStatus?: EnvironmentToolUpdateStatus;
    updateSource?: EnvironmentToolUpdateSource;
    category: 'package-manager' | 'runtime' | 'container';
  }>;
  recommendations: string[];
};

export type EnvironmentUpdatesSnapshot = {
  checkedAt: string;
  tools: Array<{
    name: Extract<EnvironmentToolName, 'npm' | 'pnpm' | 'yarn' | 'bun' | 'node'>;
    latestVersion?: string;
    source: EnvironmentToolUpdateSource;
    fetchState: 'ok' | 'offline' | 'unknown';
  }>;
};

export type CleanupExecutionResult = {
  deleted: CleanupTargetRecord[];
  planned?: CleanupTargetRecord[];
  failed: Array<{
    target: CleanupTargetRecord;
    reason: string;
  }>;
  reclaimedBytes: number;
  dryRun?: boolean;
  summary: CleanupExecutionSummary;
};

export type DashboardDataSnapshot = {
  roots: string[];
  scope?: ScanScope;
  projects?: ProjectRecord[];
  cleanupTargets?: CleanupTargetRecord[];
  health?: EnvironmentHealthSnapshot;
  activeSection?: NavigationSection;
  statusLine: string;
  helpLines?: string[];
  cleanupExecution?: CleanupExecutionResult;
  updatesOnly?: boolean;
};

export type OperationProgress = {
  label: string;
  current: number;
  total: number;
  detail?: string;
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
