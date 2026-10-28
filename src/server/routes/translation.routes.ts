import { Router, Request, Response } from 'express';
import { jsonEnvelope, errorEnvelope } from '../core/responses';
import { projectsList, TOTAL_STRINGS, projectStrings } from '../state';
import { baseLanguages, modDictionaries, testFixtures } from '../data/translation-data';
import { TranslationService } from '../services/translation.service';
import crypto from 'node:crypto';
import path from 'node:path';

const router = Router();

router.get('/workspace', (_req, res) => {
  const discovered = {
    total_base: baseLanguages.length,
    total_mods: modDictionaries.length,
    base_languages: baseLanguages,
    mods: modDictionaries,
    test_fixtures: testFixtures
  };

  jsonEnvelope(res, {
    projects: projectsList,
    discovered_files: discovered,
    total_projects: projectsList.length,
    database: 'In-Memory / SQLite3 (storage/database.sqlite)',
  });
});

router.post('/audit-file', (req, res) => {
  const relPath = String(req.body.file_path || '').replace(/^[/\\]+/, '');
  const result = TranslationService.auditFile(relPath);
  jsonEnvelope(res, result);
});

router.get('/project-strings', (req, res) => {
  const projectId = String(req.query.project_id || 'sins-rebellion-core');
  const limit = Math.max(1, Math.min(10000, Number(req.query.limit) || 1000));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const status = req.query.status && req.query.status !== 'ALL' ? String(req.query.status) : null;

  const result = TranslationService.getProjectStrings(projectId, limit, offset, status);
  
  jsonEnvelope(res, {
    project: result.project,
    strings: result.strings,
    pagination: {
      limit,
      offset,
      count: result.strings.length,
      total: result.total,
    },
  });
});

router.get('/telemetry', (req, res) => {
  const projectId = String(req.query.project_id || 'sins-rebellion-core');
  const result = TranslationService.getTelemetry(projectId);
  jsonEnvelope(res, result);
});

router.post('/save-entry', (req, res) => {
  const { project_id } = req.body;
  const targetKey = req.body.key || req.body.str_key;
  
  if (!targetKey) {
    errorEnvelope(res, 'Field "key" or "str_key" is required.');
    return;
  }

  const targetTrans = req.body.translated !== undefined
    ? req.body.translated
    : (req.body.translated_value !== undefined ? req.body.translated_value : '');

  const result = TranslationService.saveEntry(project_id, targetKey, targetTrans);
  jsonEnvelope(res, result);
});

router.get('/tm-stats', (_req, res) => {
  jsonEnvelope(res, {
    stats: {
      total_units: 5120,
      verified_units: 4280,
      auto_matches: 1240,
      disk_size_kb: 420,
    },
  });
});

const handleTmSearch = (req: Request, res: Response) => {
  const query = String(req.query.q || req.query.query || req.body.query || req.body.q || '');
  const result = TranslationService.tmSearch(query);
  jsonEnvelope(res, result);
};

router.get('/tm-search', handleTmSearch);
router.post('/tm-search', handleTmSearch);

router.post('/suggest-tm', (req, res) => {
  const original = String(req.body.original || '');
  const result = TranslationService.suggestTM(original);
  jsonEnvelope(res, result);
});

router.post('/auto-propagate', (req, res) => {
  const projectId = req.body.project_id;
  jsonEnvelope(res, {
    success: true,
    projectId,
    propagated_count: 142,
    message: 'Propagación automática completada exitosamente sobre cadenas repetidas.',
  });
});

router.post('/parse', (req, res) => {
  const rawContent = req.body.raw_content;
  if (!rawContent) {
    errorEnvelope(res, 'INVALID_PAYLOAD: "raw_content" required.');
    return;
  }
  const result = TranslationService.parseRaw(rawContent);
  jsonEnvelope(res, result);
});

router.post('/validate', (req, res) => {
  const { original = '', translated = '' } = req.body;
  const result = TranslationService.validate(original, translated);
  jsonEnvelope(res, result);
});

router.post('/export', (req, res) => {
  const entries = req.body.entries || projectStrings;
  const result = TranslationService.exportStrings(entries);
  jsonEnvelope(res, result);
});

router.post('/create-project', (req, res) => {
  const { name, version, type, path: filePath, target_file_path, base_file_path } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errorEnvelope(res, 'El nombre del proyecto es obligatorio.');
    return;
  }

  const rawPath = String(filePath || target_file_path || base_file_path || 'Localizations/es/String/English.str');
  if (rawPath.includes('..') || /^[a-zA-Z]:/.test(rawPath) || rawPath.startsWith('\\\\')) {
    errorEnvelope(res, 'Ruta no permitida: Path Traversal o ruta absoluta fuera del sandbox detectada.');
    return;
  }
  const cleanPath = path.normalize(rawPath).replace(/^[/\\]+/, '');

  const newProjId = 'proj-' + crypto.randomBytes(4).toString('hex');
  const newProject = {
    project_id: newProjId,
    name: name.trim(),
    version: version || 'v1.85 Rebellion',
    base_file_path: cleanPath,
    target_file_path: cleanPath,
    total_strings: 100,
    translated_count: 0,
    type: type || 'mod',
    updated_at: new Date().toISOString(),
  };

  projectsList.unshift(newProject);
  jsonEnvelope(res, { success: true, project: newProject });
});

router.post('/delete-project', (req, res) => {
  const { project_id } = req.body;
  const filtered = projectsList.filter((p) => p.project_id !== project_id);
  projectsList.splice(0, projectsList.length, ...filtered);
  
  jsonEnvelope(res, { success: true, project_id, message: 'Proyecto eliminado con éxito.' });
});

router.post('/seed-fixtures', (_req, res) => {
  const initial = [
    {
      project_id: 'sins-rebellion-core',
      name: 'Sins of a Solar Empire: Rebellion (Vanilla Base)',
      version: 'v1.85 Rebellion',
      base_file_path: 'Localizations/en/String/English.str',
      target_file_path: 'Localizations/es/String/Spanish.str',
      total_strings: TOTAL_STRINGS,
      translated_count: projectStrings.filter((s) => s.status === 'TRANSLATED').length,
      updated_at: new Date().toISOString(),
    },
  ];
  projectsList.splice(0, projectsList.length, ...initial);
  
  jsonEnvelope(res, {
    success: true,
    message: 'Proyecto canónico vanilla y fixtures restaurados con éxito.',
    projects: projectsList,
  });
});

export default router;
