/**
 * Solaris Nexus Studio - GalaxyForge Types
 * Strict typing for 2D galaxy scenario generation, topology graph, and canvas rendering
 */

export interface GalaxyPlanet {
  name: string;
  type: string;
  x: number;
  y: number;
  isHomePlanet: boolean;
}

export interface GalaxyStar {
  name: string;
  type?: string;
  x?: number;
  y?: number;
}

export interface PhaseLane {
  source: string;
  target: string;
}

export interface GalaxyScenario {
  scenarioName: string;
  stars: GalaxyStar[];
  planets: GalaxyPlanet[];
  phaseLanes: PhaseLane[];
}

export interface GraphConnectivityResult {
  isConnected: boolean;
  unreachedCount: number;
  visitedNodes: string[];
}

export interface GalaxyForgeInterface {
  init(): void;
  refreshCanvas(): void;
  generate(count: number): Promise<void>;
  exportGalaxy(): void;
}
