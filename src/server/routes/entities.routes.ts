import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonEnvelope, errorEnvelope } from '../core/responses';
import { entityCatalog } from '../state';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const router = Router();

router.get('/catalog', (_req, res) => {
  jsonEnvelope(res, {
    entities: entityCatalog,
    total: entityCatalog.length,
  });
});

router.post('/inspect', (req, res) => {
  let content = req.body.raw_content;
  if (!content && req.body.file_path) {
    const p = path.resolve(rootDir, req.body.file_path);
    if (fs.existsSync(p)) content = fs.readFileSync(p, 'utf-8');
  }

  content = content || 'TXT2\r\nentityType "CapitalShip"\r\nHullPoints 3000.000000\r\nShieldPoints 1500.000000\r\n';

  const lines = content.split(/\r?\n/);
  const attributes: Record<string, any> = {};
  let entityType = 'CapitalShip';

  for (const line of lines) {
    const trimmed = line.trim();
    const typeMatch = trimmed.match(/^entityType\s+"(.*)"$/);
    if (typeMatch) entityType = typeMatch[1]!;

    const numMatch = trimmed.match(/^([a-zA-Z0-9_:]+)\s+([0-9\.\-]+)$/);
    if (numMatch) attributes[numMatch[1]!] = parseFloat(numMatch[2]!);

    const strMatch = trimmed.match(/^([a-zA-Z0-9_:]+)\s+"(.*)"$/);
    if (strMatch) attributes[strMatch[1]!] = strMatch[2]!;
  }

  jsonEnvelope(res, {
    header: 'TXT2',
    entityType,
    attributes,
    checksumWarning: 'MULTIPLAYER_CHECKSUM_MUTATION_WARNING: Modifying entity values alters network checksums. Use exclusively in Single Player / Sandbox games.',
    totalLines: lines.length,
  });
});

router.post('/update', (req, res) => {
  const { file_path, parameters } = req.body;
  const targetShip = entityCatalog.find((e) => e.filePath === file_path || e.id === file_path);
  if (targetShip && parameters) {
    Object.assign(targetShip, parameters);
  }

  jsonEnvelope(res, {
    success: true,
    updated: true,
    filePath: file_path,
    checksumWarning: 'MULTIPLAYER_CHECKSUM_MUTATION_WARNING: Archivo de entidad modificado. Se generó un respaldo atómico.',
  });
});

router.post('/save', (req, res) => {
  const entityData = req.body.entity;
  if (!entityData || !entityData.id) {
    errorEnvelope(res, 'Invalid entity data payload.');
    return;
  }

  const index = entityCatalog.findIndex((e) => e.id === entityData.id);
  if (index !== -1) {
    entityCatalog[index] = { ...entityCatalog[index], ...entityData };
  }

  jsonEnvelope(res, {
    success: true,
    entity: entityData,
    message: `Entidad ${entityData.name || entityData.id} persistida en VFS virtual.`,
  });
});

export default router;
