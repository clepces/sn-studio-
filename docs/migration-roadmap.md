# Hoja de Ruta y Bitácora de Migración - Solaris Nexus Studio

## 1. Visión General de la Migración
Este documento registra la transformación arquitectónica de **Solaris Nexus Studio** desde una pila monolítica local (WAMP / Apache / PHP 8.2 + SQLite3) hacia una arquitectura nativa en la nube optimizada para **Google AI Studio** sobre **Node.js 22 LTS**.

---

## 2. Fases de Ejecución

### Fase 1: Saneamiento y Normalización de Entorno (Completada)
- ✅ Eliminación de dependencias heredadas de PHP (`composer.json`, `phpcs.xml`, `phpstan.neon`, scripts en `/src/backend/`).
- ✅ Limpieza y eliminación de documentación histórica obsoleta (`docs/legacy/`).
- ✅ Unificación del gestor de paquetes bajo `npm`.
- ✅ Configuración de `metadata.json` con las capacidades de AI Studio (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`).

### Fase 2: Backend Unificado en TypeScript / Express (Completada)
- ✅ Creación de `server.ts` implementando los 29 endpoints REST de la API con envelope canónico JSON y UUID Safety.
- ✅ Servidor escuchando en `0.0.0.0:3000` con arranque directo mediante `tsx`.
- ✅ Modelo de persistencia reactivo en memoria que neutraliza por completo los errores de bloqueo `SQLITE_BUSY`.
- ✅ Erradicación del "Bug del Proyecto Zombi" al respetar listas de proyectos vacías sin sembrado compulsivo forzado.
- ✅ Blindaje ante Path Traversal mediante resolución de rutas canónicas en sandbox seguro.
- ✅ Reemplazo de comandos CLI inseguros por pipelines sanitizados con hashing SHA-256.

### Fase 3: Ensamblaje y Compilación del Frontend (Completada)
- ✅ Script de ensamblaje `scripts/build-html.ts` que compila el cascarón SPA a partir de las plantillas modulares (`app-shell`, `dock`, `sidebar`, `header`, `modal`, y las 12 vistas).
- ✅ Generación de `index.html` en la raíz sincronizado con los metadatos de la aplicación.
- ✅ Compilación de TypeScript mediante `esbuild` hacia `public/assets/js/bundle.js`.
- ✅ Compilación de hojas de estilo SASS modular (7-1) hacia `public/assets/css/main-theme.css`.
- ✅ Verificación limpia con `npm run lint` (`tsc --noEmit`) y `compile_applet`.

### Fase 4: Hitos Futuros (Roadmap)
- 🚀 **Integración Cloud SQL (PostgreSQL):** Integración nativa opcional para persistencia compartida entre usuarios y equipos de traducción mediante Unix Domain Sockets de AI Studio.
- 🚀 **Asistente Gemini AI en Traducción:** Sugerencias contextuales de localización mediante el SDK `@google/genai` en el servidor para traducir términos del lore de Sins of a Solar Empire.
- 🚀 **Exportador de Minimod en Archivo ZIP:** Generación de paquetes instalables `.zip` listos para descomprimir en la carpeta `Mods-Rebellion v1.85`.
