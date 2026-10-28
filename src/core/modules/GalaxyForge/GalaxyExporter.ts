/**
 * Solaris Nexus Studio - GalaxyExporter Subsystem
 * Serializes galaxy scenario into canonical Rebellion galaxyScenarioDef .galaxy file
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { ToastNotification } from '../../engine/ui/toast.component';
import type { GalaxyScenario } from './types';

export class GalaxyExporter {
  public export(galaxy: GalaxyScenario | null): void {
    if (!galaxy) {
      ToastNotification.warning('Genera o carga un escenario galáctico primero.');
      return;
    }

    const starName = galaxy.stars && galaxy.stars.length > 0 && galaxy.stars[0]?.name
      ? galaxy.stars[0].name
      : 'Yellow_Star_Alpha';

    let out = "TXT\r\ngalaxyScenarioDef\r\n";
    out += `\tstar\r\n\t\tname "${starName}"\r\n\t\ttype "Yellow"\r\n\t\tposition [ 0.0 , 0.0 ]\r\n`;

    (galaxy.planets || []).forEach(p => {
      out += `\tplanet\r\n\t\tname "${p.name}"\r\n\t\ttype "${p.type}"\r\n\t\tposition [ ${p.x.toFixed(1)} , ${p.y.toFixed(1)} ]\r\n\t\tisHomePlanet ${p.isHomePlanet ? 'TRUE' : 'FALSE'}\r\n`;
    });

    (galaxy.phaseLanes || []).forEach(lane => {
      out += `\tjumpLane\r\n\t\tsourcePlanet "${lane.source}"\r\n\t\ttargetPlanet "${lane.target}"\r\n`;
    });

    const filename = `${galaxy.scenarioName || 'GalaxyScenario'}.galaxy`;
    GlobalNexusCore.downloadBlob(out, filename);
    ToastNotification.success(`Escenario galáctico exportado: ${filename}`);
  }
}
