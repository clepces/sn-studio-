/**
 * Solaris Nexus Studio - Mod Management Types
 * Strict typing for VFS Orchestrator, Minimod Injector, and Platform Detector
 */

export interface ActiveMod {
  name: string;
  priority: number;
  isMinimod?: boolean;
  ramMb: number;
  state?: 'OK' | 'MISSING_DIRECTORY' | 'EMPTY_DIRECTORY';
}

export interface PlatformInfo {
  platform: string;
  path: string;
  exists: boolean;
  description: string;
}

export interface CustomPathValidationResult {
  success: boolean;
  is_writable?: boolean;
  has_exe?: boolean;
  has_localizations?: boolean;
  has_gameinfo?: boolean;
  message?: string;
}

export interface VfsCollision {
  file: string;
  badge: string;
  badgeType: 'safe' | 'neutral' | 'warning' | 'danger';
  winner: string;
  detail: string;
}

export interface ModManagerInterface {
  init(): void;
  switchSubTab(targetSubTabId: string): void;
  renderModList(): void;
  scanMods(): Promise<void>;
  restoreVanilla(): Promise<void>;
  saveVfsHierarchy(): Promise<void>;
  checkVfsCollisions(): void;
}
