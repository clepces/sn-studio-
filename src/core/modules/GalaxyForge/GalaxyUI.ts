/**
 * Solaris Nexus Studio - GalaxyUI Subsystem
 * DOM updates for galaxy metrics, planetary node list, and celestial body inspector
 */

import type { GalaxyScenario, GalaxyPlanet } from './types';
import { PLANET_COLORS } from './GalaxyCanvasRenderer';

export class GalaxyUI {
  public renderTopologySummary(galaxy: GalaxyScenario): void {
    const nameEl = document.getElementById('galaxy-scenario-name');
    const starEl = document.getElementById('galaxy-star-count');
    const planetEl = document.getElementById('galaxy-planet-count');
    const laneEl = document.getElementById('galaxy-lane-count');

    if (nameEl) nameEl.innerText = galaxy.scenarioName || 'Escenario Galáctico';
    if (starEl) starEl.innerText = String(galaxy.stars ? galaxy.stars.length : 1);
    if (planetEl) planetEl.innerText = String(galaxy.planets ? galaxy.planets.length : 0);
    if (laneEl) laneEl.innerText = String(galaxy.phaseLanes ? galaxy.phaseLanes.length : 0);
  }

  public renderNodeList(galaxy: GalaxyScenario, onSelectPlanet?: (planet: GalaxyPlanet) => void): void {
    const listEl = document.getElementById('galaxy-nodes-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    (galaxy.planets || []).forEach(p => {
      const item = document.createElement('div');
      item.className = 'galaxy-node-item';
      item.innerHTML = `
        <div>
          <span class="node-dot" style="background:${PLANET_COLORS[p.type] || '#38bdf8'};"></span>
          <strong>${p.name}</strong>
          ${p.isHomePlanet ? '<span class="home-star">★</span>' : ''}
        </div>
        <span class="node-coords">(${Math.round(p.x)}, ${Math.round(p.y)})</span>
      `;

      item.addEventListener('click', () => {
        this.renderPlanetDetails(p);
        if (onSelectPlanet) onSelectPlanet(p);
      });

      listEl.appendChild(item);
    });
  }

  public renderPlanetDetails(planet: GalaxyPlanet): void {
    const infoEl = document.getElementById('galaxy-selected-info');
    if (!infoEl) return;

    infoEl.innerHTML = `
      <div class="galaxy-details-box">
        <div><strong>Planeta:</strong> ${planet.name}</div>
        <div><strong>Bioma:</strong> <span>${planet.type}</span></div>
        <div><strong>Coordenadas:</strong> X: ${planet.x.toFixed(1)}, Y: ${planet.y.toFixed(1)}</div>
        <div><strong>Planeta Natal:</strong> ${planet.isHomePlanet ? 'SÍ (Spawn Oficial)' : 'NO (Neutral)'}</div>
      </div>
    `;
  }
}
