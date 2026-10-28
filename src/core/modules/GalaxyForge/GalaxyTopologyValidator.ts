/**
 * Solaris Nexus Studio - GalaxyTopologyValidator Subsystem
 * Breadth-First Search (BFS) graph connectivity validation for phase lane networks
 */

import type { GalaxyScenario, GraphConnectivityResult } from './types';

export class GalaxyTopologyValidator {
  public validate(galaxy: GalaxyScenario): GraphConnectivityResult {
    if (!galaxy.planets || galaxy.planets.length === 0) {
      return { isConnected: true, unreachedCount: 0, visitedNodes: [] };
    }

    const adj: Record<string, string[]> = {};
    galaxy.planets.forEach(p => { adj[p.name] = []; });

    (galaxy.phaseLanes || []).forEach(l => {
      if (adj[l.source] && adj[l.target]) {
        adj[l.source]!.push(l.target);
        adj[l.target]!.push(l.source);
      }
    });

    const visited = new Set<string>();
    const firstPlanet = galaxy.planets[0];
    if (!firstPlanet) {
      return { isConnected: true, unreachedCount: 0, visitedNodes: [] };
    }

    const startNode = firstPlanet.name;
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      (adj[cur] || []).forEach(nxt => {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      });
    }

    const unreached = galaxy.planets.filter(p => !visited.has(p.name));
    const isConnected = unreached.length === 0;

    this.updateBadge(isConnected, unreached.length);

    return {
      isConnected,
      unreachedCount: unreached.length,
      visitedNodes: Array.from(visited)
    };
  }

  private updateBadge(isConnected: boolean, unreachedCount: number): void {
    const badge = document.getElementById('galaxy-connectivity-badge');
    if (!badge) return;

    if (isConnected) {
      badge.className = 'metric-badge-pill';
      badge.style.color = 'var(--text-success)';
      badge.innerText = '● Grafo 100% Conexo (BFS OK)';
    } else {
      badge.className = 'metric-badge-pill neutral';
      badge.style.color = '#dc2626';
      badge.innerText = `⚠️ ${unreachedCount} Planetas Aislados`;
    }
  }
}
