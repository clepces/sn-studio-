# Estructura de Arquitectura y Árbol de Directorios Maestro - Solaris Nexus Studio

## 1. Principios de Arquitectura en Google AI Studio
1. **Pila de Ejecución Moderna:** La plataforma opera sobre **Node.js 22 LTS** con un backend unificado en **Express + TypeScript** (`server.ts`) escuchando en `0.0.0.0:3000`.
2. **Empaquetado y Compilación Rápida:** Los bundles de frontend se generan mediante **esbuild** y **sass** compilando TypeScript (`src/frontend/main.ts`) y hojas de estilo modulares (`src/interface/scss/main.scss`) hacia `public/assets/`.
3. **Ensamblaje Declarativo de Plantillas:** La SPA se ensambla a partir de plantillas semánticas (`src/frontend/templates/layouts` y `views`) mediante `scripts/build-html.ts` tanto en tiempo de compilación como en tiempo de ejecución.
4. **Protocolo Cero Exposición (UUID Safety):** Todos los errores de API generan identificadores únicos criptográficos (`UUID v4`), enmascaran trazas internas y emiten un sobre JSON canónico.
5. **Cero Dependencia de PHP o Servidores Externos:** Toda la lógica de negocio ha sido portada a TypeScript puro dentro del entorno de ejecución estándar de AI Studio.

---

## 2. Árbol de Archivos Maestro del Proyecto

```text
solaris-nexus-studio/
├── .env.example                                # Variables de entorno recomendadas (PORT, APP_ENV, GEMINI_API_KEY)
├── .gitignore                                  # Exclusiones de control de versiones (node_modules, storage/logs)
├── index.html                                  # Punto de entrada HTML ensamblado de la SPA
├── metadata.json                               # Manifiesto y capacidades de Google AI Studio
├── package.json                                # Dependencias (Express, SASS, tsx, esbuild, TypeScript) y scripts de build
├── tsconfig.json                               # Configuración estricta de TypeScript (Strict, No-Implicit-Any)
├── vite.config.js                              # Configuración de bundler y resolución de alias (@/, @shared/)
├── server.ts                                   # Servidor central Express con los 29 endpoints REST y despacho SPA
├── Informe.md                                  # Informe de auditoría exhaustivo y soluciones óptimas
├── readme.md                                   # Resumen del proyecto y comandos de despliegue
│
├── scripts/                                    # Scripts de automatización y soporte de compilación
│   └── build-html.ts                           # Compilador de plantillas hacia el index.html raíz
│
├── docs/                                       # Documentación técnica actualizada
│   ├── readme.md                               # Índice general de la documentación
│   ├── structure.md                            # Esta especificación de árbol y arquitectura
│   ├── api.md                                  # Especificación de endpoints REST y protocolo de respuesta
│   ├── database.md                             # Modelo de persistencia y Memoria de Traducción
│   ├── events.md                               # Bus de eventos reactivo y ciclo de vida cliente
│   ├── interface.md                            # Diseño visual, temas (Neumorphic/Glass) y SASS 7-1
│   ├── components.md                           # Catálogo de componentes de UI y estados vacíos
│   ├── game-engine.md                          # Especificación Iron Engine (Sins Rebellion v1.85)
│   └── migration-roadmap.md                    # Historial y bitácora de migración
│
├── public/                                     # Recursos públicos estáticos compilados
│   └── assets/
│       ├── css/
│       │   └── main-theme.css                  # Hoja de estilos comprimida compilada desde SASS
│       ├── js/
│       │   ├── bundle.js                       # Bundle de TypeScript compilado con esbuild
│       │   ├── nexus-core.js                   # Servicios cliente centrales y estado reactivo
│       │   ├── nexus-ui.js                     # Coordinador de inicialización de la interfaz
│       │   └── modules/                        # Submódulos cliente especializados
│       │       ├── contextual-actions.js       # Acciones dinámicas de barra superior
│       │       ├── convert-cli.js              # Controlador visual para ConvertData CLI
│       │       ├── dashboard-handler.js        # Gestor de telemetría y métricas del dashboard
│       │       ├── entity-editor.js            # Editor e inspector de naves capitales (.entity)
│       │       ├── galaxy-forge.js             # Modelador gráfico de topologías estelares (.galaxy)
│       │       ├── minimod-injector.js         # Inyector de minimods de idioma P999
│       │       ├── mod-manager.js              # Gestor de EnabledMods.txt y monitor LAA
│       │       ├── nexus-components.js         # Componentes y empty states en DOM
│       │       ├── platform-detector.js        # Detección de plataformas (Steam/GOG/Custom)
│       │       ├── sidebar-tree.js             # Árbol de navegación y explorador lateral
│       │       ├── system-health.js            # Auditor de salud y diagnósticos del sistema
│       │       ├── translation-studio.js       # Estudio de traducción y Token Guard
│       │       └── view-navigator.js           # Enrutador cliente y pestañas
│       └── media/                              # Media, iconos y recursos gráficos
│
├── src/                                        # Código fuente de desarrollo
│   ├── frontend/                               # Código TypeScript y plantillas del cliente
│   │   ├── main.ts                             # Punto de entrada de inicialización frontend
│   │   ├── api-client/                         # Clientes HTTP fuertemente tipados
│   │   │   ├── base-api.client.ts              # Cliente HTTP base con control de errores
│   │   │   ├── entity-api.client.ts            # Cliente para catálogo e inspección de entidades
│   │   │   ├── galaxy-api.client.ts            # Cliente para topologías galácticas
│   │   │   ├── mod-api.client.ts               # Cliente para mods y EnabledMods.txt
│   │   │   ├── string-api.client.ts            # Cliente para proyectos y cadenas .str
│   │   │   └── system-api.client.ts            # Cliente para salud, telemetría y conversiones
│   │   ├── components/                         # Componentes TypeScript
│   │   │   ├── empty-state.component.ts        # Renderizador de tarjetas de estado vacío
│   │   │   ├── modal.component.ts              # Controlador de modales accesibles
│   │   │   ├── pagination.component.ts         # Componente de paginación virtual
│   │   │   ├── tab-carousel.component.ts       # Carrusel horizontal de pestañas
│   │   │   └── telemetry-card.component.ts     # Tarjetas neumórficas de métricas
│   │   ├── modules/                            # Módulos de aplicación en TypeScript
│   │   │   └── translation-studio.ts           # Módulo principal del estudio de traducción
│   │   ├── router/                             # Enrutamiento de vistas cliente
│   │   │   └── view-navigator.router.ts        # Router reactivo desacoplado
│   │   ├── state/                              # Gestión del estado global
│   │   │   ├── app-store.state.ts              # Store reactivo central de la aplicación
│   │   │   └── event-bus.ts                    # Bus de eventos Pub/Sub global
│   │   ├── templates/                          # Plantillas HTML modulares
│   │   │   ├── layouts/                        # Estructura del cascarón (App Shell)
│   │   │   │   ├── app-shell.template.html     # Cascarón maestro
│   │   │   │   ├── dock.template.html          # Dock lateral flotante
│   │   │   │   ├── header.template.html        # Encabezado contextual y métricas hero
│   │   │   │   ├── modal-edit.template.html    # Modales de edición y ajustes
│   │   │   │   └── sidebar.template.html       # Barra lateral de navegación y árbol
│   │   │   └── views/                          # Las 12 vistas funcionales de la SPA
│   │   │       ├── convert.template.html       # Vista de ConvertData CLI
│   │   │       ├── dashboard.template.html     # Vista de Dashboard y telemetría
│   │   │       ├── entities.template.html      # Vista de Editor de Entidades
│   │   │       ├── galaxy.template.html        # Vista de Galaxy Forge Companion
│   │   │       ├── mods.template.html          # Vista de Gestor de Mods VFS
│   │   │       ├── network.template.html       # Vista de Red Galáctica y Workshop
│   │   │       ├── pipeline.template.html      # Vista de Pipeline de Texturas y Shaders
│   │   │       ├── studio.template.html        # Vista unificada Master Studio
│   │   │       ├── swarm.template.html         # Vista de Swarm Bus y Colaboración P2P
│   │   │       ├── system.template.html        # Vista de Diagnóstico y Salud
│   │   │       ├── translation.template.html   # Vista de Estudio de Traducción .str
│   │   │       └── vault.template.html         # Vista de Bóveda de Resguardos (.bak)
│   │   └── types/                              # Definiciones de tipos TypeScript del frontend
│   │       └── translation.types.ts
│   │
│   ├── interface/scss/                         # Hojas de estilo estructuradas bajo SASS 7-1
│   │   ├── abstracts/                          # Mixins, funciones y variables de diseño
│   │   ├── base/                               # Reset, tipografía, utilidades y animaciones
│   │   ├── components/                         # Componentes (botones, tarjetas, modales, tablas)
│   │   ├── layout/                             # Layout (dock, header, sidebar, workspace)
│   │   ├── modes/                              # Modos de color claro y oscuro
│   │   ├── pages/                              # Estilos específicos de cada vista
│   │   ├── themes/                             # Temas base, neumórfico y glassmórfico
│   │   └── main.scss                           # Punto de compilación de todos los estilos
│   │
│   └── shared/                                 # Tipos y constantes compartidos
│       ├── constants/
│       │   ├── engine-limits.constants.ts      # Límites de Iron Engine (3.250 MB LAA)
│       │   └── reserved-tokens.constants.ts    # Tokens reservados de Token Guard
│       └── types/
│           ├── api-response.types.ts           # Contratos envelope de la API REST
│           ├── entity-inspection.types.ts      # Tipos de datos para naves capitales
│           ├── localization.types.ts           # Tipos de diccionarios .str y proyectos
│           └── mod-vfs.types.ts                # Tipos de manifiestos y estado de mods
│
├── storage/                                    # Almacenamiento local de la aplicación
│   ├── backups/                                # Copias de seguridad atómicas generadas
│   ├── cache/                                  # Caché temporal
│   └── logs/                                   # Registros de eventos y seguridad
│
└── tests/fixtures/                             # Recursos de prueba de Iron Engine
    ├── sample-valid.str                        # Muestra válida de diccionario .str
    ├── sample-corrupted.str                    # Muestra con fallos de sintaxis para pruebas
    ├── sample_demo.entity                      # Muestra de nave capital en formato TXT
    └── sample_demo.entity.converted            # Muestra de archivo convertido
```
