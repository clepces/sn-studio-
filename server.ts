import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleSpaHtml } from './scripts/build-html';

// Modular Route Imports
import systemRoutes from './src/server/routes/system.routes';
import modsRoutes from './src/server/routes/mods.routes';
import translationRoutes from './src/server/routes/translation.routes';
import entitiesRoutes from './src/server/routes/entities.routes';
import galaxyRoutes from './src/server/routes/galaxy.routes';

// Standard Helpers
import { errorEnvelope } from './src/server/core/responses';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// ---------------------------------------------------------------------------
// MIDDLEWARES
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------------------------------------------------------------------------
// STATIC ASSETS
// ---------------------------------------------------------------------------
app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// REST API ROUTES (MODULAR)
// ---------------------------------------------------------------------------
app.use('/api/system', systemRoutes);
app.use('/api/mods', modsRoutes);
app.use('/api/strings', translationRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/galaxy', galaxyRoutes);

// Compatibility for conversion endpoint (if needed globally)
app.use('/api/engine', systemRoutes); 

// ---------------------------------------------------------------------------
// HTML SPA FALLBACK
// ---------------------------------------------------------------------------
let cachedHtml = '';
function getSpaHtml(): string {
  if (!cachedHtml) {
    cachedHtml = assembleSpaHtml();
  }
  return cachedHtml;
}

app.use((req, res) => {
  // If requesting an API route that didn't match, return 404 JSON
  if (req.path.startsWith('/api/')) {
    errorEnvelope(res, `Endpoint "${req.path}" not found.`, 404);
    return;
  }
  res.type('html').send(getSpaHtml());
});

// ---------------------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`🚀 [SolarisNexus] Enterprise modular server listening on http://${HOST}:${PORT}`);
});
