import { BaseApiClient } from './base-api.client';
import type { EnabledModsArchive, ModItem } from '@shared/types/mod-vfs.types';

export interface PlatformDetectionData {
  platforms: readonly { name: string; path: string; detected: boolean }[];
  activePlatform: string;
}

export interface CustomPathValidationResult {
  valid: boolean;
  gameExeFound: boolean;
  localizationsFound: boolean;
  entityCount: number;
  readWriteOk: boolean;
}

export class ModApiClient extends BaseApiClient {
  public static async detectPlatforms(): Promise<PlatformDetectionData> {
    return this.request<PlatformDetectionData>('api/mods/detect-platforms');
  }

  public static async validateCustomPath(path: string): Promise<CustomPathValidationResult> {
    return this.request<CustomPathValidationResult>('api/mods/validate-custom-path', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  public static async scanMods(): Promise<{ availableMods: readonly ModItem[]; totalCount: number }> {
    return this.request<{ availableMods: readonly ModItem[]; totalCount: number }>('api/mods/scan');
  }

  public static async getEnabledMods(): Promise<EnabledModsArchive> {
    return this.request<EnabledModsArchive>('api/mods/enabled');
  }

  public static async saveEnabledMods(mods: readonly string[]): Promise<{ saved: boolean; count: number }> {
    return this.request<{ saved: boolean; count: number }>('api/mods/save', {
      method: 'POST',
      body: JSON.stringify({ mods }),
    });
  }

  public static async synthesizeSession(payload: { minimodName: string; activeMods: readonly string[] }): Promise<{ success: boolean; minimodPath: string }> {
    return this.request<{ success: boolean; minimodPath: string }>('api/mods/synthesize-session', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
