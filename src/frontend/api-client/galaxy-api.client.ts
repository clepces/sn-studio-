import { BaseApiClient } from './base-api.client';

export interface GalaxyPlanet {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  owner: string;
}

export interface GalaxyLane {
  from: number;
  to: number;
}

export interface GalaxyTopology {
  planetCount: number;
  planets: readonly GalaxyPlanet[];
  jumpLanes: readonly GalaxyLane[];
  seed: number;
}

export class GalaxyApiClient extends BaseApiClient {
  public static async generateGalaxy(planetCount: number, seed?: number): Promise<GalaxyTopology> {
    return this.request<GalaxyTopology>('api/galaxy/generate', {
      method: 'POST',
      body: JSON.stringify({ planet_count: planetCount, seed }),
    });
  }

  public static async parseGalaxyFile(content: string): Promise<GalaxyTopology> {
    return this.request<GalaxyTopology>('api/galaxy/parse', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}
