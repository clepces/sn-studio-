# Documentación Técnica Central - Solaris Nexus Studio

Bienvenido al repositorio central de especificaciones de ingeniería y arquitectura de **Solaris Nexus Studio**.

Esta versión ha sido modernizada y adaptada para ejecutarse sobre el entorno **Google AI Studio** utilizando una arquitectura full-stack moderna basada en **Node.js 22 LTS**, **TypeScript**, **Express**, **esbuild / Vite** y **SASS Modular (7-1)**.

---

## Índice de Documentos Técnicos

1. **[Estructura y Árbol de Directorios (structure.md)](./structure.md)**  
   Arquitectura del sistema, árbol de archivos maestro, responsabilidades por capa y aislamiento de fuentes.

2. **[Especificación de la API REST (api.md)](./api.md)**  
   Catálogo de los 29 endpoints REST (`/api/system`, `/api/strings`, `/api/mods`, `/api/entities`, `/api/galaxy`, `/api/engine`), envelope canónico JSON y protocolo UUID Safety.

3. **[Arquitectura de Persistencia y Modelado de Datos (database.md)](./database.md)**  
   Modelos en memoria reactivos, instantáneas de respaldo atómico, Memoria de Traducción (TM) y ruta de integración con Cloud SQL.

4. **[Bus de Eventos y Ciclo de Vida Reactivo (events.md)](./events.md)**  
   Arquitectura guiada por eventos (`GlobalEventBus`), contratos de eventos del sistema, sincronización de telemetría y ciclo de vida de la SPA.

5. **[Diseño de Interfaz, Temas y SASS (interface.md)](./interface.md)**  
   Guía de diseño atómico, tokens de diseño CSS, modos claro/oscuro, temas neumórficos y glassmórficos, y arquitectura SASS 7-1.

6. **[Catálogo de Componentes UI (components.md)](./components.md)**  
   Catálogo de componentes visuales: barra lateral desacoplada, dock de estado, tablas virtuales, modales de confirmación y empty states.

7. **[Integración con Iron Engine e Ingeniería Inversa (game-engine.md)](./game-engine.md)**  
   Especificación de archivos del motor *Sins of a Solar Empire: Rebellion v1.85*: diccionarios `.str` (UTF-8 BOM y CRLF), Token Guard, presupuesto de RAM virtual LAA (3.250 MB), entidades `.entity` y escenarios `.galaxy`.

8. **[Hoja de Ruta de Migración (migration-roadmap.md)](./migration-roadmap.md)**  
   Bitácora de la migración desde la arquitectura heredada WAMP/PHP hacia Google AI Studio (Node.js 22), problemas neutralizados e hitos futuros.
