# Informe de Estructura del Proyecto — Solaris Nexus Studio

Clepces org. ltd | Arquitectura Modular y Tipado Estricto (TypeScript Enterprise)

---

## 1. Inventario Completo de Directorios y Archivos

### 📁 Configuración, Infraestructura y Dependencias (Raíz)
- `package.json` — **[Código Modular Nuevo]** (Compilación esbuild, sass, lint con TypeScript estricto, TSX).
- `tsconfig.json` — **[Código Modular Nuevo]** (Configuración con `"noImplicitAny": true`, `"noUnusedLocals": true`, rutas `@core/*` y `@/*`).
- `server.ts` — **[Código Modular Nuevo]** (Servidor Express API para endpoints `/api/strings/*`, SQLite3 y archivos estáticos).
- `metadata.json` — **[Código Modular Nuevo]** (Metadatos de la aplicación e identificador del entorno).
- `scripts/build-html.ts` — **[Código Modular Nuevo]** (Ensamblador recursivo de vistas y plantillas parciales).
- `dist/` — **[Código Modular Nuevo]** (Salida compilada de `bundle.js`, `lib/engine.js`, `main-theme.css`, `index.html`).

---

### 📁 `/src/core/modules/` (Nueva Arquitectura Modular — 100% Finalizada)

*Regla de diseño estricta: Todos los archivos se mantienen por debajo de las 500 líneas, con tipado estricto y cero `any`.*

#### 📂 `/src/core/modules/Translation/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (Tipos estrictos de traducción y diccionarios).
- `TranslationValidator.ts` — **[Código Modular Nuevo]** (94 líneas: auditoría fail-fast `/api/strings/audit-file`, extracción de tokens y parser de .STR).
- `TranslationExporter.ts` — **[Código Modular Nuevo]** (95 líneas: serialización .STR canónica, BOM UTF-16LE, descarga Blob).
- `TranslationManager.ts` — **[Código Modular Nuevo]** (384 líneas: gestión de proyectos SQLite3, ajustes, creación y confirmación de borrado con temporizador).
- `TranslationEditor.ts` — **[Código Modular Nuevo]** (388 líneas: motor de grilla virtual, paginación, filtros de estado/texto, modal de edición y TM auto-propagate).
- `TranslationAccordion.ts` — **[Código Modular Nuevo]** (287 líneas: renderizado de tarjetas de diccionarios oficiales, localizaciones y mods).
- `TranslationUI.ts` — **[Código Modular Nuevo]** (246 líneas: render de tarjetas de proyectos, telemetría y sincronización de navegación).
- `TranslationEventBridge.ts` — **[Código Modular Nuevo]** (156 líneas: puente desacoplado de eventos del DOM, inputs, filtros y drag-and-drop).
- `TranslationStudio.ts` — **[Código Modular Nuevo]** (467 líneas: coordinador modular principal e integración con `GlobalEventHub`).
- `index.ts` — **[Código Modular Nuevo]** (12 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/Mods/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (46 líneas: contratos e interfaces `ActiveMod`, `PlatformInfo`, `CustomPathValidationResult`, `VfsCollision`).
- `PlatformDetector.ts` — **[Código Modular Nuevo]** (101 líneas: escaneo de rutas de SO Steam/GOG/Stardock y validador de rutas con permisos RW/.exe).
- `MinimodInjector.ts` — **[Código Modular Nuevo]** (110 líneas: inyección quirúrgica P999 en cascada de `EnabledMods.txt` y badges reactivos).
- `ModVfsManager.ts` — **[Código Modular Nuevo]** (164 líneas: orquestador de prioridades VFS, monitor de presupuesto RAM LAA 3250 MB y colisiones).
- `ModUI.ts` — **[Código Modular Nuevo]** (98 líneas: renderizado dinámico de tarjetas de mod, badges de carpetas huérfanas y estado Vanilla).
- `ModManager.ts` — **[Código Modular Nuevo]** (198 líneas: coordinador maestro de subpestañas y persistencia en `EnabledMods.txt`).
- `index.ts` — **[Código Modular Nuevo]** (10 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/Entities/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (58 líneas: contratos `EntityItem`, `EntityWeapon`, `EntityAbility`, `CombatStats`).
- `CombatCalculator.ts` — **[Código Modular Nuevo]** (44 líneas: física de combate Sins Rebellion, EHP, mitigación de armadura y ratio de escudo).
- `EntityCatalog.ts` — **[Código Modular Nuevo]** (72 líneas: carga de catálogo de naves capitales, filtros por facción y búsqueda).
- `EntityUI.ts` — **[Código Modular Nuevo]** (187 líneas: render de tarjetas de nave, armas tácticas, habilidades y formulario de atributos).
- `EntityEditor.ts` — **[Código Modular Nuevo]** (182 líneas: coordinador maestro del editor de entidades e integración con EventHub).
- `index.ts` — **[Código Modular Nuevo]** (9 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/GalaxyForge/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (44 líneas: contratos `GalaxyPlanet`, `GalaxyStar`, `PhaseLane`, `GalaxyScenario`).
- `GalaxyTopologyValidator.ts` — **[Código Modular Nuevo]** (70 líneas: algoritmo BFS de conexidad para evitar planetas aislados sin rutas hiperespaciales).
- `GalaxyCanvasRenderer.ts` — **[Código Modular Nuevo]** (111 líneas: renderizador 2D Canvas de espacio profundo, cuadrícula y phase lanes).
- `GalaxyExporter.ts` — **[Código Modular Nuevo]** (36 líneas: generador canónico de archivos `galaxyScenarioDef` .galaxy).
- `GalaxyUI.ts` — **[Código Modular Nuevo]** (61 líneas: resumen topológico, listado de nodos y detalles del cuerpo celeste).
- `GalaxyForge.ts` — **[Código Modular Nuevo]** (114 líneas: coordinador del modelador galáctico).
- `index.ts` — **[Código Modular Nuevo]** (10 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/ConvertCli/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (21 líneas: contratos `ConvertOptions`, `ConvertResult`).
- `ConvertCli.ts` — **[Código Modular Nuevo]** (88 líneas: pipeline de conversión binario/texto para `ConvertData_Rebellion.exe`).
- `index.ts` — **[Código Modular Nuevo]** (6 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/SystemHealth/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (18 líneas: contratos `SystemHealthData`).
- `SystemHealth.ts` — **[Código Modular Nuevo]** (85 líneas: diagnóstico fail-fast de variables de entorno y estado del servidor).
- `index.ts` — **[Código Modular Nuevo]** (6 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/Dashboard/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (20 líneas: contratos `ExecutionItem`).
- `DashboardExecutions.ts` — **[Código Modular Nuevo]** (93 líneas: listado de ejecuciones, paginación de 8 registros y filtrado).
- `DashboardHandler.ts` — **[Código Modular Nuevo]** (124 líneas: coordinador de eventos de ejecución y búsqueda en panel).
- `index.ts` — **[Código Modular Nuevo]** (7 líneas: barrel export unificado del módulo).

#### 📂 `/src/core/modules/Navigation/` — **[Código Modular Nuevo]**
- `types.ts` — **[Código Modular Nuevo]** (29 líneas: contratos `ModuleMetadata`, `TelemetryCardDef`).
- `Preloader.ts` — **[Código Modular Nuevo]** (37 líneas: animación y transición de inicio del kernel).
- `SidebarTree.ts` — **[Código Modular Nuevo]** (88 líneas: árbol jerárquico de carpetas de proyecto e inspector de archivos).
- `TelemetryManager.ts` — **[Código Modular Nuevo]** (208 líneas: carrusel dinámico de telemetría contextual por vista).
- `ViewNavigator.ts` — **[Código Modular Nuevo]** (235 líneas: enrutador SPA de vistas, sincronización de hash y colapso de sidebar).
- `index.ts` — **[Código Modular Nuevo]** (9 líneas: barrel export unificado del módulo).

---

### 📁 `/src/core/engine/` & `/src/core/services/`
- `/core/engine/ui/toast.component.ts` — **[Código Modular Nuevo]** (150 líneas: sistema no bloqueante para erradicar `window.alert`).
- `/core/engine/ui/modal.component.ts` — **[Código Modular Nuevo]** (59 líneas: componente de modal reusable).
- `/core/engine/ui/empty-state.component.ts` — **[Código Modular Nuevo]** (42 líneas: renderizado de estados vacíos estándar).
- `/core/engine/ui/pagination.component.ts` — **[Código Modular Nuevo]** (64 líneas: paginador reusable de registros).
- `/core/engine/ui/tab-carousel.component.ts` — **[Código Modular Nuevo]** (48 líneas: carrusel horizontal de subpestañas).
- `/core/engine/ui/telemetry-card.component.ts` — **[Código Modular Nuevo]** (38 líneas: tarjetas de telemetría métrica).
- `/core/engine/ui/nexus-components.ts` — **[Código Modular Nuevo]** (52 líneas: registro central de componentes).
- `/core/engine/ui/nexus-ui.ts` — **[Código Modular Nuevo]** (65 líneas: coordinador de ciclo de vida UI).
- `/core/engine/ixd/contextual-actions.ts` — **[Código Modular Nuevo]** (95 líneas: acciones de cabecera contextuales y publicación en EventHub).
- `/core/kernel.ts` — **[Código Modular Nuevo]** (23 líneas: micro-kernel de inicialización de subsistemas).
- `/core/services/event-hub.ts` — **[Código Modular Nuevo]** (25 líneas: bus desacoplado de eventos pub/sub).
- `/core/services/logger.ts` — **[Código Modular Nuevo]** (18 líneas: servicio central de logging con niveles).

---

### 📁 `/src/frontend/` (Estado Final — Cero Código Legacy)
- `src/frontend/main.ts` — **[Código Modular Nuevo]** (48 líneas: importa exclusivamente paquetes desde `@core/modules/*`).
- `src/frontend/router/view-navigator.router.ts` — **[Código Modular Nuevo]** (108 líneas: router complementario).
- `src/frontend/types/translation.types.ts` — **[Código Modular Nuevo]** (159 líneas: interfaces TypeScript).
- `src/frontend/modules/` — **[TOTALMENTE ELIMINADO]** (Directorio borrado del proyecto tras completar la migración de todos sus archivos).

---

## 2. Resumen de Archivos Monolíticos Eliminados

Todos los archivos antiguos fueron sustituidos por submódulos de bajo volumen y eliminados:
1. ❌ `translation-studio.ts` (1.846 líneas) ➔ Sustituido por `/src/core/modules/Translation/` (8 submódulos).
2. ❌ `mod-manager.ts` (~260 líneas) ➔ Sustituido por `/src/core/modules/Mods/` (7 submódulos).
3. ❌ `minimod-injector.ts` (~140 líneas) ➔ Sustituido por `/src/core/modules/Mods/MinimodInjector.ts`.
4. ❌ `platform-detector.ts` (~45 líneas) ➔ Sustituido por `/src/core/modules/Mods/PlatformDetector.ts`.
5. ❌ `entity-editor.ts` (~355 líneas) ➔ Sustituido por `/src/core/modules/Entities/` (6 submódulos).
6. ❌ `galaxy-forge.ts` (~235 líneas) ➔ Sustituido por `/src/core/modules/GalaxyForge/` (7 submódulos).
7. ❌ `convert-cli.ts` (~65 líneas) ➔ Sustituido por `/src/core/modules/ConvertCli/` (3 submódulos).
8. ❌ `system-health.ts` (~60 líneas) ➔ Sustituido por `/src/core/modules/SystemHealth/` (3 submódulos).
9. ❌ `dashboard-handler.ts` (~250 líneas) ➔ Sustituido por `/src/core/modules/Dashboard/` (4 submódulos).
10. ❌ `sidebar-tree.ts` (~110 líneas) ➔ Sustituido por `/src/core/modules/Navigation/SidebarTree.ts`.
11. ❌ `telemetry-manager.ts` (~404 líneas) ➔ Sustituido por `/src/core/modules/Navigation/TelemetryManager.ts`.
12. ❌ `view-navigator.ts` (~270 líneas) ➔ Sustituido por `/src/core/modules/Navigation/ViewNavigator.ts`.
13. ❌ `preloader-manager.ts` (~32 líneas) ➔ Sustituido por `/src/core/modules/Navigation/Preloader.ts`.

---

## 3. Estado de Verificación del Sistema

- **Validación de Líneas de Código:** Todos los archivos están por debajo de 470 líneas (la mayoría entre 15 y 200 líneas).
- **Verificación de Tipos (`tsc --noEmit`):** 0 errores, 0 advertencias, `"noImplicitAny": true`.
- **Compilación de Producción (`npm run build`):** Exitosa (`dist/assets/js/bundle.js`, `lib/engine.js`, `main-theme.css`, `index.html`).
- **Directivas iFrame:** Cero `alert()` y cero `window.open` en todo el codebase.
