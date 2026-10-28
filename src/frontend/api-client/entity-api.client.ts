import { BaseApiClient } from './base-api.client';
import type { CapitalShipEntity } from '@shared/types/entity-inspection.types';

export interface EntityCatalogResponse {
  entities: readonly CapitalShipEntity[];
}

export class EntityApiClient extends BaseApiClient {
  public static async getCatalog(): Promise<EntityCatalogResponse> {
    return this.request<EntityCatalogResponse>('api/entities/catalog');
  }

  public static async inspectEntity(filePath: string): Promise<CapitalShipEntity> {
    return this.request<CapitalShipEntity>('api/entities/inspect', {
      method: 'POST',
      body: JSON.stringify({ file_path: filePath }),
    });
  }

  public static async updateEntity(entity: CapitalShipEntity): Promise<{ success: boolean; updatedPath: string }> {
    return this.request<{ success: boolean; updatedPath: string }>('api/entities/update', {
      method: 'POST',
      body: JSON.stringify(entity),
    });
  }
}
