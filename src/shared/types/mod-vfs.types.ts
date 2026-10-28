/**
 * Definiciones de tipos para el Virtual File System (VFS) y orquestación de mods
 */

export interface ModItem {
  id: string;
  name: string;
  version: string;
  path: string;
  priority: number;
  isActive: boolean;
  isMinimod: boolean;
  estimatedRamMb: number;
  incompatibilities: readonly string[];
  dependencies: readonly string[];
  sha256Hash?: string;
  status?: 'OK' | 'MISSING_DIRECTORY' | 'EMPTY_DIRECTORY';
}

export interface EnabledModsArchive {
  version: number;
  activeModsCount: number;
  mods: readonly ModItem[];
  totalRamBudgetMb: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}
