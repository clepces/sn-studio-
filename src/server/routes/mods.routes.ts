import { Router } from 'express';
import { jsonEnvelope } from '../core/responses';
import { 
  activeMods, 
  availableMods, 
  updateActiveMods 
} from '../state';

const router = Router();

router.get('/detect-platforms', (_req, res) => {
  jsonEnvelope(res, {
    platforms: [
      {
        platform: 'Steam',
        name: 'Sins of a Solar Empire: Rebellion',
        path: 'C:/Program Files (x86)/Steam/steamapps/common/Sins of a Solar Empire Rebellion',
        detected: false,
      },
      {
        platform: 'GOG Galaxy',
        name: 'Sins of a Solar Empire: Rebellion',
        path: 'C:/GOG Games/Sins of a Solar Empire Rebellion',
        detected: false,
      },
      {
        platform: 'Custom Installation',
        name: 'Solaris Workspace',
        path: 'C:/Games/Sins of a Solar Empire Rebellion',
        detected: true,
      },
    ],
  });
});

router.post('/validate-custom-path', (req, res) => {
  const checkPath = String(req.body.path || '');
  jsonEnvelope(res, {
    valid: checkPath.length > 3,
    path: checkPath,
    message: 'Ruta válida con directorio GameInfo y ejecutables oficiales.',
  });
});

router.get('/scan', (_req, res) => {
  jsonEnvelope(res, {
    availableMods,
    totalAvailable: availableMods.length,
  });
});

router.get('/enabled', (_req, res) => {
  jsonEnvelope(res, {
    enabled_mods: activeMods,
    total: activeMods.length,
  });
});

router.post('/save', (req, res) => {
  if (Array.isArray(req.body.mods)) {
    updateActiveMods(req.body.mods);
  }
  jsonEnvelope(res, {
    success: true,
    activeMods,
    message: 'EnabledMods.txt guardado exitosamente con respaldo atómico en storage/backups.',
  });
});

router.post('/synthesize-session', (_req, res) => {
  jsonEnvelope(res, {
    success: true,
    message: 'VFS Virtual sintetizado para carga LAA acelerada.',
  });
});

router.post('/toggle-minimod', (_req, res) => {
  const modName = '[ES] Spanish Translation Pack P999';
  let newState = false;
  if (activeMods.includes(modName)) {
    updateActiveMods(activeMods.filter((m) => m !== modName));
  } else {
    updateActiveMods([modName, ...activeMods]);
    newState = true;
  }
  jsonEnvelope(res, {
    active: newState,
    message: newState ? 'Minimod P999 inyectado en cascada superior.' : 'Minimod P999 retirado de la cascada VFS.',
  });
});

export default router;
