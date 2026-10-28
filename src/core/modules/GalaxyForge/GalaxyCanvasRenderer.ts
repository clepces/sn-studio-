/**
 * Solaris Nexus Studio - GalaxyCanvasRenderer Subsystem
 * HTML5 Canvas 2D renderer for star systems, celestial bodies, and phase lane networks
 */

import type { GalaxyScenario, GalaxyPlanet } from './types';

export const PLANET_COLORS: Record<string, string> = {
  Terran: '#22c55e',
  Desert: '#eab308',
  Ice: '#38bdf8',
  Volcanic: '#ef4444',
  Asteroid: '#94a3b8',
  GasGiant: '#a855f7'
};

export class GalaxyCanvasRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  public init(canvasId: string = 'galaxy-canvas'): void {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  public render(galaxy: GalaxyScenario): void {
    if (!this.ctx || !this.canvas || !galaxy) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    // Deep space radial gradient background
    const bgGrad = this.ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
    bgGrad.addColorStop(0, '#0a1020');
    bgGrad.addColorStop(1, '#03060c');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    // Sector grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Dynamic coordinate normalization
    let maxDist = 60000;
    (galaxy.planets || []).forEach(p => {
      const d = Math.hypot(p.x, p.y);
      if (d > maxDist) maxDist = d;
    });

    const scale = (Math.min(width, height) / 2 - 35) / maxDist;
    const cx = width / 2;
    const cy = height / 2;

    const pMap: Record<string, GalaxyPlanet> = {};
    (galaxy.planets || []).forEach(p => { pMap[p.name] = p; });

    // Render Phase Lanes (jump lanes)
    this.ctx.lineWidth = 1.2;
    (galaxy.phaseLanes || []).forEach(lane => {
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

    // Render Central Star
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Render Planets
    (galaxy.planets || []).forEach(p => {
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
}
