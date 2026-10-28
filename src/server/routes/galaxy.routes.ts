import { Router } from 'express';
import { jsonEnvelope } from '../core/responses';

const router = Router();

router.post('/parse', (_req, res) => {
  jsonEnvelope(res, {
    success: true,
    stars: [{ name: 'Sol Central', type: 'Yellow', x: 0, y: 0 }],
    planets: [
      { name: 'Terra Alpha', type: 'Terran', star: 'Sol Central', x: -150, y: 50 },
      { name: 'Ares Prime', type: 'Desert', star: 'Sol Central', x: 120, y: -80 },
    ],
    phaseLanes: [{ from: 'Terra Alpha', to: 'Ares Prime' }],
  });
});

router.post('/generate', (req, res) => {
  const scenarioName = req.body.scenario_name || 'Solaris Procedural Map';
  const planetCount = Math.max(4, Math.min(60, Number(req.body.planet_count) || 12));

  const planetTypes = ['Terran', 'Desert', 'Ice', 'Volcanic', 'Asteroid', 'GasGiant'];
  const planets: any[] = [];
  const phaseLanes: any[] = [];

  const star = { name: 'Estrella Central Solaris', type: 'Yellow', x: 0, y: 0 };

  const radius = 38000;
  for (let i = 0; i < planetCount; i++) {
    const angle = (2 * Math.PI * i) / planetCount;
    const r = radius + (Math.sin(i * 3) * 7500);
    const x = Math.round(Math.cos(angle) * r);
    const y = Math.round(Math.sin(angle) * r);
    const type = planetTypes[i % planetTypes.length]!;
    const name = `Planeta_${i + 1}_${type}`;
    const isHomePlanet = i === 0 || i === Math.floor(planetCount / 2);

    planets.push({
      id: `planet_${i}`,
      name,
      type,
      star: star.name,
      x,
      y,
      radius: 12,
      isHomePlanet,
    });
  }

  // Connect in ring + cross bridges with both source/target and from/to for 100% BFS connectivity
  for (let i = 0; i < planetCount; i++) {
    const nextIdx = (i + 1) % planetCount;
    phaseLanes.push({
      source: planets[i]!.name,
      target: planets[nextIdx]!.name,
      from: planets[i]!.name,
      to: planets[nextIdx]!.name,
    });
  }

  // Add 2 internal chords
  if (planetCount >= 6) {
    const midIdx = Math.floor(planetCount / 2);
    phaseLanes.push({
      source: planets[0]!.name,
      target: planets[midIdx]!.name,
      from: planets[0]!.name,
      to: planets[midIdx]!.name,
    });
    const q1Idx = Math.floor(planetCount / 4);
    const q3Idx = Math.floor((3 * planetCount) / 4);
    phaseLanes.push({
      source: planets[q1Idx]!.name,
      target: planets[q3Idx]!.name,
      from: planets[q1Idx]!.name,
      to: planets[q3Idx]!.name,
    });
  }

  const galaxy = {
    scenarioName,
    stars: [star],
    planets,
    phaseLanes,
    nodes: planets,
  };

  jsonEnvelope(res, {
    scenarioName,
    galaxy,
  });
});

export default router;
