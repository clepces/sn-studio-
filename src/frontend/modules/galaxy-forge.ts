/**
 * Solaris Nexus Studio - GalaxyForge Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

const PLANET_COLORS: Record<string, string> = {
  'Terran': '#22c55e',
  'Desert': '#eab308',
  'Ice': '#38bdf8',
  'Volcanic': '#ef4444',
  'Asteroid': '#94a3b8',
  'GasGiant': '#a855f7'
};

export class GalaxyForgeModule {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  public init(): void {
    this.canvas = document.getElementById('galaxy-canvas') as HTMLCanvasElement | null;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.generate(12);
  }

  public refreshCanvas(): void {
    if (GlobalNexusCore.state.currentGalaxy) {
      requestAnimationFrame(() => this.drawGalaxy(GlobalNexusCore.state.currentGalaxy));
    }
  }

  public async generate(count: number): Promise<void> {
    const res = await GlobalNexusCore.apiPost('galaxy/generate', {
      scenario_name: `Solaris_Ring_${count}P`,
      planet_count: count
    });
    if (res && res.success && res.data && res.data.galaxy) {
      this.renderGalaxyTopology(res.data.galaxy);
    }
  }

  public renderGalaxyTopology(galaxy: any): void {
    GlobalNexusCore.state.currentGalaxy = galaxy;

    const nameEl = document.getElementById('galaxy-scenario-name');
    const starEl = document.getElementById('galaxy-star-count');
    const planetEl = document.getElementById('galaxy-planet-count');
    const laneEl = document.getElementById('galaxy-lane-count');

    if (nameEl) nameEl.innerText = galaxy.scenarioName || 'Escenario Galáctico';
    if (starEl) starEl.innerText = String(galaxy.stars ? galaxy.stars.length : 1);
    if (planetEl) planetEl.innerText = String(galaxy.planets ? galaxy.planets.length : 0);
    if (laneEl) laneEl.innerText = String(galaxy.phaseLanes ? galaxy.phaseLanes.length : 0);

    const listEl = document.getElementById('galaxy-nodes-list');
    if (listEl) {
      listEl.innerHTML = '';
      (galaxy.planets || []).forEach((p: any) => {
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
          const infoEl = document.getElementById('galaxy-selected-info');
          if (infoEl) {
            infoEl.innerHTML = `
              <div class="galaxy-details-box">
                <div><strong>Planeta:</strong> ${p.name}</div>
                <div><strong>Bioma:</strong> <span>${p.type}</span></div>
                <div><strong>Coordenadas:</strong> X: ${p.x.toFixed(1)}, Y: ${p.y.toFixed(1)}</div>
                <div><strong>Planeta Natal:</strong> ${p.isHomePlanet ? 'SÍ (Spawn Oficial)' : 'NO (Neutral)'}</div>
              </div>
            `;
          }
        });

        listEl.appendChild(item);
      });
    }

    this.validateGraphConnectivity(galaxy);
    this.drawGalaxy(galaxy);
  }

  public validateGraphConnectivity(galaxy: any): void {
    if (!galaxy.planets || galaxy.planets.length === 0) return;
    const adj: Record<string, string[]> = {};
    galaxy.planets.forEach((p: any) => { adj[p.name] = []; });
    (galaxy.phaseLanes || []).forEach((l: any) => {
      if (adj[l.source] && adj[l.target]) {
        adj[l.source]!.push(l.target);
        adj[l.target]!.push(l.source);
      }
    });

    const visited = new Set<string>();
    const startNode = galaxy.planets[0].name;
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

    const unreached = galaxy.planets.filter((p: any) => !visited.has(p.name));
    const badge = document.getElementById('galaxy-connectivity-badge');
    if (badge) {
      if (unreached.length === 0) {
        badge.className = 'metric-badge-pill';
        badge.style.color = 'var(--text-success)';
        badge.innerText = '● Grafo 100% Conexo (BFS OK)';
      } else {
        badge.className = 'metric-badge-pill neutral';
        badge.style.color = '#dc2626';
        badge.innerText = `⚠️ ${unreached.length} Planetas Aislados`;
      }
    }
  }

  public drawGalaxy(galaxy: any): void {
    if (!this.ctx || !this.canvas || !galaxy) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    const bgGrad = this.ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
    bgGrad.addColorStop(0, '#0a1020');
    bgGrad.addColorStop(1, '#03060c');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, height); this.ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(width, y); this.ctx.stroke();
    }

    let maxDist = 60000;
    (galaxy.planets || []).forEach((p: any) => {
      const d = Math.hypot(p.x, p.y);
      if (d > maxDist) maxDist = d;
    });

    const scale = (Math.min(width, height) / 2 - 35) / maxDist;
    const cx = width / 2;
    const cy = height / 2;

    const pMap: Record<string, any> = {};
    (galaxy.planets || []).forEach((p: any) => { pMap[p.name] = p; });

    this.ctx.lineWidth = 1.2;
    (galaxy.phaseLanes || []).forEach((lane: any) => {
      const p1 = pMap[lane.source];
      const p2 = pMap[lane.target];
      if (p1 && p2) {
        this.ctx!.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        this.ctx!.beginPath();
        this.ctx!.moveTo(cx + p1.x * scale, cy + p1.y * scale);
        this.ctx!.lineTo(cx + p2.x * scale, cy + p2.y * scale);
        this.ctx!.stroke();
      }
    });

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    (galaxy.planets || []).forEach((p: any) => {
      const px = cx + p.x * scale;
      const py = cy + p.y * scale;

      this.ctx!.fillStyle = PLANET_COLORS[p.type] || '#94a3b8';
      this.ctx!.beginPath();
      this.ctx!.arc(px, py, p.isHomePlanet ? 5.5 : 4, 0, Math.PI * 2);
      this.ctx!.fill();

      this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.65)';
      this.ctx!.font = '8px -apple-system, sans-serif';
      this.ctx!.textAlign = 'center';
      this.ctx!.fillText(p.name, px, py - 6);
    });
  }

  public exportGalaxy(): void {
    const g = GlobalNexusCore.state.currentGalaxy;
    if (!g) {
      alert('Genera o carga un escenario galáctico primero.');
      return;
    }
    let out = "TXT\r\ngalaxyScenarioDef\r\n";
    out += `\tstar\r\n\t\tname "${g.stars[0].name}"\r\n\t\ttype "Yellow"\r\n\t\tposition [ 0.0 , 0.0 ]\r\n`;
    (g.planets || []).forEach((p: any) => {
      out += `\tplanet\r\n\t\tname "${p.name}"\r\n\t\ttype "${p.type}"\r\n\t\tposition [ ${p.x.toFixed(1)} , ${p.y.toFixed(1)} ]\r\n\t\tisHomePlanet ${p.isHomePlanet ? 'TRUE' : 'FALSE'}\r\n`;
    });
    (g.phaseLanes || []).forEach((lane: any) => {
      out += `\tjumpLane\r\n\t\tsourcePlanet "${lane.source}"\r\n\t\ttargetPlanet "${lane.target}"\r\n`;
    });
    GlobalNexusCore.downloadBlob(out, `${g.scenarioName || 'GalaxyScenario'}.galaxy`);
  }
}

export const GlobalGalaxyForge = new GalaxyForgeModule();

declare global {
  interface Window {
    GalaxyForgeModule: GalaxyForgeModule;
  }
}

if (typeof window !== 'undefined') {
  window.GalaxyForgeModule = GlobalGalaxyForge;
}
