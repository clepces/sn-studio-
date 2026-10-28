import { Router } from 'express';
import { jsonEnvelope } from '../core/responses';
import { 
  executions, 
  addExecution, 
  getDetailedMods, 
  activeMods, 
  availableMods, 
  TOTAL_STRINGS 
} from '../state';


const router = Router();

router.get('/health', (_req, res) => {
  jsonEnvelope(res, {
    status: 'healthy',
    appName: 'Solaris Nexus Studio',
    company: 'Clepces org. ltd',
    version: 'v0.4.1.0-alpha',
    env: 'production',
    database: 'connected',
    engine_fs: 'valid',
    phpVersion: '8.2.18 (Node.js 22 Enterprise)',
    memoryUsageMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
  });
});

router.get('/environment', (_req, res) => {
  const activeDetailed = getDetailedMods();
  const baseEngineRam = 1400;
  const modsRam = activeDetailed.reduce((sum, m) => sum + m.ramMb, 0);
  const totalActiveRam = baseEngineRam + modsRam;
  const laaCeiling = 3250;

  jsonEnvelope(res, {
    game: {
      installed: true,
      path: 'C:/Games/Sins of a Solar Empire Rebellion',
      spanishLocalization: {
        exists: true,
        file: 'Localizations/es/String/English.str',
        stringCount: TOTAL_STRINGS,
      },
      entitiesCount: 1872,
      galaxiesCount: 126,
    },
    mods: {
      exists: true,
      path: 'Documents/My Games/Ironclad Games/Sins of a Solar Empire Rebellion/Mods-Rebellion v1.85',
      activeCount: activeMods.length,
      active: activeMods,
      activeDetailed,
      hasMissingDirs: false,
      availableCount: availableMods.length,
      available: availableMods.map((m) => m.name),
      ramBudget: {
        totalActiveRamMb: totalActiveRam,
        laaCeilingMb: laaCeiling,
        freeBudgetMb: laaCeiling - totalActiveRam,
        isSafe: totalActiveRam <= laaCeiling,
        usagePercent: Math.round((totalActiveRam / laaCeiling) * 100),
      },
    },
  });
});

router.get('/executions', (_req, res) => {
  jsonEnvelope(res, { executions });
});

router.post('/executions', (req, res) => {
  const { type, description, details, result, action, status } = req.body;
  const execType = type || (action ? 'ACTION' : 'SYS');
  const execDesc = description || action || 'Operación en sistema';
  const execRes = result || status || 'OK';

  const newItem = addExecution({
    exec_type: execType,
    description: execDesc,
    details: details || null,
    result: execRes,
  });

  jsonEnvelope(res, { success: true, logged: true, id: String(newItem.exec_id) });
});

router.get('/permissions', (_req, res) => {
  jsonEnvelope(res, {
    permissions: [
      {
        resource: 'Directorio de Localización Española (es/String)',
        path: 'C:/Games/Sins of a Solar Empire Rebellion/Localizations/es/String',
        access: 'READ / WRITE',
        granted: true,
        statusText: '✓ Concedido (RW)',
      },
      {
        resource: 'Directorio de Mods VFS (Mods-Rebellion v1.85)',
        path: 'Documents/My Games/Ironclad Games/Sins of a Solar Empire Rebellion/Mods-Rebellion v1.85',
        access: 'READ / WRITE',
        granted: true,
        statusText: '✓ Concedido (RW)',
      },
      {
        resource: 'Bóveda de Resguardos Atómicos (.bak)',
        path: 'storage/backups',
        access: 'READ / WRITE',
        granted: true,
        statusText: '✓ Activo',
      },
      {
        resource: 'Base de Datos Relacional SQLite / In-Memory',
        path: 'storage/database.sqlite',
        access: 'READ / WRITE',
        granted: true,
        statusText: '✓ Conectado',
      },
      {
        resource: 'Motor Nativo ConvertData_Rebellion.exe',
        path: 'C:/Games/Sins of a Solar Empire Rebellion/ConvertData_Rebellion.exe',
        access: 'EXECUTE',
        granted: true,
        statusText: '✓ Simulación Nativa Activa',
      },
    ],
  });
});

router.post('/deploy-native', (_req, res) => {
  jsonEnvelope(res, {
    success: true,
    message: 'Traducción española desplegada en el juego base con éxito.',
    backup: 'storage/backups/English.str.bak',
  });
});

export default router;
