import { BaseApiClient } from './base-api.client';
import type { HealthCheckData } from '@shared/types/api-response.types';

export interface SystemEnvironmentData {
  phpVersion: string;
  os: string;
  sinsPath: string;
  modsPath: string;
  isGameInstalled: boolean;
  isModsDirFound: boolean;
  ramUsageMb: number;
}

export interface SystemExecutionItem {
  id: string;
  action: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  timestamp: string;
  details?: string;
}

export class SystemApiClient extends BaseApiClient {
  public static async getHealth(): Promise<HealthCheckData> {
    return this.request<HealthCheckData>('api/system/health');
  }

  public static async getEnvironment(): Promise<SystemEnvironmentData> {
    return this.request<SystemEnvironmentData>('api/system/environment');
  }

  public static async getExecutions(): Promise<{ executions: readonly SystemExecutionItem[] }> {
    return this.request<{ executions: readonly SystemExecutionItem[] }>('api/system/executions');
  }

  public static async recordExecution(payload: { action: string; status: string; details?: string }): Promise<{ id: string }> {
    return this.request<{ id: string }>('api/system/executions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async convertResource(payload: { file_path: string; resource_type: string; direction: string }): Promise<{ output_file: string; duration_ms: number }> {
    return this.request<{ output_file: string; duration_ms: number }>('api/engine/convert', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
