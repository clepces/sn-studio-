

AUDITORÍA INTEGRAL DE ARQUITECTURA, CÓDIGO Y SUBSISTEMAS
Solaris Nexus Studio (Clepces org. ltd)
Versión de análisis: v0.4.2 Enterprise | Entorno de ejecución: WAMP / PHP 8.2 + SQLite3 + Vanilla TS + Modular SASS (7-1) + IronEngine (Sins of a Solar Empire: Rebellion v1.85).

========================================================================================
ESTRUCTURA DE LOS INFORMES DE AUDITORÍA
========================================================================================
📋 INFORME 1: BUGS CRÍTICOS, DESINCRONIZACIONES Y CÓDIGO INSEGURO
🎮 INFORME 2: INTEGRIDAD DE ARCHIVOS DE JUEGO (IRON ENGINE, VFS & LAA 32-BIT)
🧱 INFORME 3: MONOLITISMO, MODULARIZACIÓN Y DUPLICIDAD ARQUITECTÓNICA
📊 INFORME 4: DESINCRONIZACIÓN DE TELEMETRÍA, ESTADOS VACÍOS (EMPTY STATES) Y UX
🚀 INFORME 5: PLAN MAESTRO DE ACCIÓN Y REFACTORIZACIÓN PASO A PASO
========================================================================================

📋 INFORME 1: BUGS CRÍTICOS, DESINCRONIZACIONES Y CÓDIGO INSEGURO
1.1. El Bug del "Proyecto Zombi" (Resurrección en bucle de proyectos eliminados)

☻ Ubicación: StringController.php, método workspace(), líneas 105-115.
☻ Mecanismo del Fallo:

```php
		$projects = $repo->listProjects();
		// Si la base de datos está vacía, inicializar proyectos canónicos con archivos reales
		if (empty($projects)) {
		    $this->seedInitialProjects($repo, $config);
		    $projects = $repo->listProjects();
		}
```
Cuando un usuario elimina el proyecto "Sins of a Solar Empire: Rebellion (Vanilla Base)" (mediante borrado digital o físico), la tabla tbl_projects queda con 0 registros (empty($projects) === true). En la siguiente petición a /api/strings/workspace, el backend vuelve a ejecutar seedInitialProjects(), recreando el proyecto y sus 7.828 registros en tbl_string_entries. El usuario jamás puede dejar su espacio de trabajo en blanco.
	
☻ Consecuencia en Frontend (translation-studio.ts):
	Al refrescar el workspace, el cliente recibe de nuevo el proyecto supuestamente eliminado y lo selecciona automáticamente si no hay otro en memoria (selectProject(firstProj.project_id)), provocando la ilusión de que el botón "Eliminar" falló o no guardó los cambios.

1.2. Fallos de Seguridad: Path Traversal y Manipulación de Archivos en Disco

☻ Ubicación: StringController::createProject, StringController::deleteProject y ConvertCliModule.
☻ Vulnerabilidad de Escape de Directorio:

```php

// StringController.php
$rootDir = dirname(__DIR__, 3);
$fullPath = $rootDir . '/' . ltrim($targetPath, '/\\');
// Se valida únicamente:
if (str_contains($targetPath, '..') || str_contains($basePath, '..')) {
    throw new \InvalidArgumentException('Ruta no permitida: traversal detectado.');
}
```
La comprobación con str_contains('..') es eludible en entornos Windows mediante caracteres de barra combinados o rutas absolutas como C:/Windows/... o unidades de red UNC (\\server\share). Si $targetPath es una ruta absoluta, ltrim($targetPath, '/\\') en Windows no elimina la letra de unidad (C:), provocando que $rootDir . '/' . 'C:/...' genere comportamientos anómalos o escrituras fuera del directorio seguro (storage/).

☻ Truncado Involuntario de Archivos (.str Destructivo):
En createProject:

```php

if (!file_exists($fullPath)) {
    $initialStr = "\xEF\xBB\xBFStringInfo\r\n{\r\n\tNumStrings 0\r\n}\r\n";
    @file_put_contents($fullPath, $initialStr);
}
```
Si se introduce una ruta que no se puede verificar por permisos o problemas de mayúsculas/minúsculas en sistemas case-sensitive (Linux/Docker), el sistema crea un archivo en blanco en el lugar incorrecto o sobrescribe punteros de archivo sin validación canónica de lectura previa.

1.3. Concurrencia en SQLite3 y Ausencia de Claves Foráneas Reales
Ubicación: DatabaseConfig.php, DatabaseMigrator.php y ProjectRepository.php.
Falta de Enlace de Claves Foráneas:
SQLite por defecto tiene deshabilitado el soporte de claves foráneas a nivel de motor. Aunque DatabaseMigrator declara:

```sql

FOREIGN KEY (project_id) REFERENCES tbl_projects(project_id) ON DELETE CASCADE
```
Al abrir la conexión PDO en DatabaseConfig, no se ejecuta PRAGMA foreign_keys = ON;.
Impacto: Si se borra un proyecto mediante una consulta manual o una transacción fallida, tbl_string_entries acumula miles de entradas huérfanas, incrementando el peso del archivo .sqlite y corrompiendo los conteos de COUNT(e.entry_id).

☻ Riesgo de Bloqueo SQLITE_BUSY (Database Locked):
La autopropagación (autoPropagate) y la inserción por lotes (batchInsertEntries) abren transacciones largas ($this->pdo->beginTransaction()). Si mientras tanto el frontend solicita telemetría (/api/strings/tm-stats) o el poller de ejecuciones consulta tbl_executions, SQLite bloquea el archivo completo (database is locked), disparando errores 500 no capturados.

1.4. Inyección en CLI y Emulación Ficticia en ConvertDataService
Ubicación: ConvertDataService.php, líneas 84-124.
Construcción de Comando Insegura:

```php

$cmd = sprintf('"%s" %s "%s" "%s" %s', $this->cliExecutablePath, $type, $inputPath, $outputPath, $targetFormat);
$process = @proc_open($cmd, $descriptors, $pipes, $cwd);
```
Los argumentos $inputPath y $outputPath provienen directamente de $payload['file_path'] sin usar escapeshellarg(). Una ruta con comillas o caracteres especiales (&, |, ;) en Windows/Linux permite inyección arbitraria de comandos en el shell del sistema.

☻ Emulación Binaria Falsa (Simulación Corrupta):
Cuando el ejecutable oficial ConvertData_Rebellion.exe no existe, el servicio hace:

```php
// Emulación binaria: remover cabecera TXT y escribir con prefijo binario
$emulated = str_starts_with($content, 'TXT') ? substr($content, 3) : $content;
file_put_contents($outputPath, $emulated);
```
Gravedad: El formato binario de IronEngine no es texto plano sin "TXT"; es un flujo serializado binario compilado con alineación de estructuras C++ y vertex buffers de DirectX. Si un usuario intenta cargar este archivo generado en el juego real, el ejecutable de Rebellion aborta inmediatamente con un Crash to Desktop (CTD) de lectura de puntero nulo.

1.5. Fugas de Memoria en Frontend: Intervalos Huérfanos
☻ Ubicación: translation-studio.ts, función openDeleteConfirmModal().
☻ El Problema:

```typescript

deleteCountdownInterval = setInterval(() => {
  timeLeft--;
  // ...
}, 1000);
```

Si el usuario presiona la tecla Escape o hace clic en el fondo oscuro (backdrop) antes de que terminen los 5 segundos, el modal se cierra visualmente pero el setInterval continúa ejecutándose en segundo plano, mutando elementos del DOM que ya no están visibles o generando errores si el modal es reabierto en un estado diferente.

🎮 INFORME 2: INTEGRIDAD DE ARCHIVOS DE JUEGO (IRON ENGINE, VFS & LAA 32-BIT)

2.1. Arquitectura de Archivos de Cadenas Léxicas (.str)
☻ Especificación Estricta de Iron Engine:

1. BOM UTF-8 Obligatorio: Si el archivo no inicia con los bytes hexadecimales 0xEF 0xBB 0xBF, los caracteres no ASCII del español (á, é, í, ó, ú, ñ, ¿, ¡) se renderizan como signos de interrogación o cajas negras en la fuente de DirectX 9.

2. Saltos de Línea Canónicos: El motor requiere terminación Windows CRLF (\r\n). Si se guarda con \n (estilo UNIX), el parser del ejecutable de 32 bits lee la línea siguiente como parte del valor anterior.

3. Directiva NumStrings: Debe coincidir exactamente con el número de bloques StringInfo. Si NumStrings declara 7828 y se parsean 7827, el juego aborta la carga en la pantalla de splash inicial ("MiniDump crash").

☻ Deficiencia Detectada en StrParserService.php:
El método serialize() escapa comillas así:

```PHP
$escapedValue = preg_replace('/(?<!\\\\)"/', '\"', $value);
```
Sin embargo, el motor de Rebellion no utiliza barras invertidas para escapar comillas dobles dentro de strings de valor; el motor utiliza comillas dobles repetidas "" o espera que las comillas no formen parte de la cadena gramatical. Además, cadenas con saltos de línea embebidos literales deben codificarse como \r\n o \n textual, pero el parser actual las divide por líneas físicas con preg_split("/\r\n|\n|\r/", $content), lo que rompe cualquier entrada que contenga saltos de línea multilínea dentro de un solo Value "...".

2.2. Techo de Memoria Virtual LAA (32-Bit Large Address Aware: 3.250 MB)

☻ El Límite del Motor:
	Sins of a Solar Empire: Rebellion.exe es un proceso x86 de 32 bits. Incluso con la bandera Large Address Aware (LAA) habilitada, el límite físico teórico es de 4.096 MB, pero la biblioteca de sonido FMOD y las asignaciones de buffers de DirectX 9 provocan fragmentación de memoria heap a partir de los 3.250 MB - 3.350 MB, produciendo el famoso cuelgue:

```
EXCEPTION_ACCESS_VIOLATION (0xC0000005) al realizar saltos hiperespaciales entre estrellas.
```

☻ Problema en RamProfilerService.ts / php:
El presupuesto de RAM suma valores estáticos:

```PHP
$baseEngine = 1400; // MB
// Mod con texturas 4K = +700 MB
// Total Conversion = +1250 MB
```
No toma en cuenta la resolución de colisiones VFS. Si un mod en prioridad 999 sobrescribe texturas de un mod en prioridad 10, ambos archivos no se cargan simultáneamente en memoria: solo se carga el ganador del VFS. El cálculo actual sobreestima el consumo de RAM sumando mods que se cancelan entre sí, o subestima si hay mallas no empaquetadas sin comprimir en GameInfo/.

2.3. Estructura Gramatical de EnabledMods.txt
Gramática Canónica Requerida:

```INI
TXT2
SinsArchiveVersion 197
Version 0
enabledModNameCount N
enabledModName "NombreMod_1"
enabledModName "NombreMod_2"
```

☻ Fallo en ModOrchestrator::injectTranslationMinimod:
Cuando se inyecta el minimod de idioma en la cima (prioridad 999), el orquestador actualiza el nombre del mod, pero si el archivo físico en la carpeta de mods no tiene la estructura de directorios mínima:
{NombreMod}/String/English.str
el juego carga el mod como vacío, pero el motor lo toma en cuenta en el conteo de archivos abiertos, pudiendo agotar los descriptores de archivo del sistema operativo.

2.4. Entidades de Flota (.entity) y Cheksums Multijugador
☻ Alerta Crítica en EntityController.php:
Modificar atributos como HullPoints, shieldPoints o dps en archivos .entity dentro de la carpeta GameInfo principal modifica el hash SHA-256 local.
Al intentar unirse a una partida multijugador online a través de Ironclad Online (ICO) o LAN, el juego compara el hash de los archivos de juego con el anfitrión (Host). Si hay una diferencia de 1 byte, el jugador es expulsado con el mensaje:

```ini
"Version Mismatch / Data Checksum Failed".
```
☻ Falta en la UI: El editor permite guardar directamente sin crear una copia de respaldo automática o aislar los cambios dentro de un minimod sandbox independiente.

2.5. Topología de Escenarios Galácticos (.galaxy)
Riesgo de Islas de Fase y Grafos Inconexos:
En GalaxyForgeService.php, la generación de líneas de fase transversales no valida la simetría de saltos:

```php
$phaseLanes[] = ['source' => $planets[0]['name'], 'target' => $planets[(int)($planetCount / 2)]['name']];

```

En el motor de Rebellion, si una línea de salto (jumpLane) no está declarada bidireccionalmente o intersecta la zona de exclusión de gravedad de otra estrella, la IA del juego entra en un bucle infinito de cálculo de ruta (Pathfinding Freeze), congelando el hilo principal del ejecutable.

🧱 INFORME 3: MONOLITISMO, MODULARIZACIÓN Y DUPLICIDAD ARQUITECTÓNICA

ESTADO ACTUAL DE LA ARQUITECTURA: FRAGMENTACIÓN Y DOBLE PILA
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DUAL DETECTADA                     │
├───────────────────────────────────┬────────────────────────────────────┤
│ Pila 1: Vanilla JS Legacy         │ Pila 2: TypeScript Enterprise      │
├───────────────────────────────────┼────────────────────────────────────┤
│ • nexus-core.js (objeto global)   │ • main.ts / app-store.state.ts     │
│ • translation-studio.js (bundled) │ • translation-studio.ts (modular)  │
│ • view-navigator.js               │ • view-navigator.router.ts         │
│ • window.NexusCore / NexusUI      │ • GlobalEventBus / GlobalStore     │
│ • Variables en window             │ • Clases fuertemente tipadas       │
└───────────────────────────────────┴────────────────────────────────────┘

3.1. Duplicación Masiva entre TypeScript y JavaScript Compilado
En el archivo app-shell.template.html, se importan ambas pilas simultáneamente:

```html
<script src="assets/js/nexus-core.js?v=0.4.2"></script>
<script src="assets/js/modules/view-navigator.js?v=0.4.2"></script>
<script src="assets/js/modules/translation-studio.js?v=0.4.2"></script>
<!-- Y además el bundle compilado de TypeScript: -->
<script type="module" src="assets/js/bundle.js?v=0.4.2"></script>
```

☻ Colisión de Controladores:
`window.ViewNavigator` (escrito en Vanilla JS dentro de view-navigator.js) y GlobalRouter (instanciado desde view-navigator.router.ts) están escuchando concurrentemente los eventos hashchange y clicks en el DOM. Cada clic en un botón con `data-tab` ejecuta dos cambios de estado paralelos en almacenes de memoria distintos (`NexusCore.state` y `GlobalStore.state`).

3.2. Monolitismo en Hojas de Estilo (`_translation.scss` - 727 líneas)

☻ Incumplimiento del Patrón SASS 7-1:

A pesar de que el proyecto cuenta con carpetas abstracts/, base/, components/ y pages/, el archivo pages/_translation.scss es un monolito gigante que contiene:
1. Estilos del layout de navegación contextual del editor.
2. Modales globales (creación, edición y confirmación de eliminación).
3. Efectos de animación marquee (@keyframes strMarquee).
4. Tablas virtuales y paginadores que deberían pertenecer a components/datatable-virtual.scss y components/pagination.scss.
5. Tarjetas de agentes neurales y avisos IA.

☻ Profundidad de Anidamiento Excesiva:
Se observan selectores anidados hasta 6 niveles:
 #tab-translation .str-subtab-bar.is-live-mode .str-nav-contextual-group .str-ctx-left .str-breadcrumb-pill .breadcrumb-active .crumb-file:hover
Esto dispara la especificidad CSS de forma innecesaria, impidiendo que los temas (themes/theme-glassmorphism.scss y modes/dark.scss) sobrescriban colores sin usar !important.

3.3. Monolitismo en Backend: StringController.php (485 líneas)
☻ StringController viola abiertamente el principio de responsabilidad única (Single Responsibility Principle):
○ Parseo y serialización: Métodos parse y export.
○ Auditoría de cadenas: validateEntry.
○ Exploración de disco físico: scanFilesystemStrFiles (exploración recursiva glob de carpetas locales y mods).
○ Persistencia relacional: workspace, getProjectStrings, saveEntry.
○ Gestión de Memoria de Traducción (TM): getTmStats, searchTm, suggestTm, autoPropagate.
○ Sembrado de fixtures: seedInitialProjects.
○ CRUD de Proyectos: createProject, deleteProject.
☻ Solución Arquitectónica: Debe desacoplarse en al menos 4 controladores especializados:
1. ProjectController.php: CRUD y metadatos de proyectos en SQLite.
2. TranslationMemoryController.php: Banco de memoria TM, búsqueda difusa y autopropagación.
3. LocalizationCompilerController.php: Parser, linter, exportación y Token Guard.
4. VfsInspectionController.php: Escaneo de rutas físicas del juego y fixtures.

📊 INFORME 4: DESINCRONIZACIÓN DE TELEMETRÍA, ESTADOS VACÍOS (EMPTY STATES) Y UX

4.1. Desincronización y Pérdida de Contexto en la Telemetría
☻ El Problema:
	En translation.template.html, la subpestaña #subtab-str-telemetry contiene los identificadores:
	#telemetry-total-strings, #telemetry-coverage-percent, #telemetry-tokens-count.
☻ Causa de Desincronización: 
1. La función `updateTelemetry()` en `translation-studio.ts` solo calcula métricas a partir del array en memoria `state.allEntries`.
2. Si el usuario ingresa a la pestaña de Telemetría directamente desde el menú lateral sin haber hecho clic previamente en "Editar en Vivo" sobre un proyecto específico, `state.allEntries está vacío ([])`. La interfaz muestra métricas congeladas en (--) o (0) pendientes.
3. No existe un selector de proyecto en la pestaña de telemetría ni comunicación reactiva con `ProjectRepository::listProjects()`, que sí dispone de agregados calculados en SQLite3 (`total_entries`, `translated_count`, tokens_count`).
4. El botón telemetry:recheck simplemente llama a updateTelemetry() sobre el mismo array local en memoria en lugar de hacer una consulta atómica de validación al backend.

4.2. Ausencia de Estados Vacíos (Empty States) Universales
Módulo / Vista		| 	Condición Vacía 		| Comportamiento Actual Defectuoso	| Comportamiento Canónico Requerido
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Workspace Proyectos 	projects.length === 0	Resucita el proyecto vanilla base 
												en PHP o se queda en "Cargando...".	 Tarjeta neumórfica con icono de 
																					 archivo, badges de SQLite3 y botón directo a "Crear Proyecto".
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Grid Editor en Vivo		filteredEntries.length 
						=== 0					Bloque gris genérico "Sin resultados 
												para el filtro".	
																					Estado guiado: indicador de filtro activo + botón de restablecimiento rápido.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Archivos Físicos 
Detectados				totalFiles === 0		Listas colapsables vacías sin 
												feedback de lectura de disco.		Banner informativo: "No se encontraron
																					 archivos .str en la ruta de instalación configurada".
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Historial de 
Ejecuciones				executions.length 
						=== 0					Mensaje estático en texto simple
												 desalineado.						
												 									Componente NexusComponents.renderEmptyState con timestamp y estado de base de datos.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Buscador de Memoria 
(TM)					items.length === 0		Texto plano en cursiva pequeño.		Panel de concordancia: "0 coincidencias
																					exactas o difusas en la base de datos TM".
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
																					
4.3. Problemas de UX y Animaciones CSS
☻ Efecto Cinta de Noticias (Marquee) en Breadcrumbs:
En _translation.scss:

```css
@keyframes strMarquee {
  0%, 18% { transform: translateX(0); }
  82%, 100% { transform: translateX(min(0px, calc(-100% + 140px))); }
}
```
La función min(0px, calc(-100% + 140px)) en navegadores basados en WebKit/Blink genera parpadeos (subpixel rendering jitter) si el contenedor padre tiene un ancho variable o si el nombre del archivo es más corto que 140px.
Modal de Confirmación Crítica:
La cuenta regresiva de 5 segundos deshabilita los botones de borrado (disabled = true), pero no muestra una barra de progreso visual de cuenta atrás ni aclara la diferencia de riesgo entre Borrado Digital (desvincular de SQLite conservando el archivo físico) y Borrado Físico (destrucción irreversible con unlink()).

🚀 INFORME 5: PLAN MAESTRO DE ACCIÓN Y REFACTORIZACIÓN PASO A PASO
Para garantizar la integridad y estabilidad de Solaris Nexus Studio, se establece el siguiente orden técnico de ejecución:
code
Code
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   SECUENCIA DE EJECUCIÓN TÉCNICA SINCRONIZADA                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. SANEAMIENTO BACKEND ──► Desactivar auto-seeding y blindar transacciones PDO. │
│ 2. ARQUITECTURA STR    ──► Refactorizar parser CRLF/BOM y Token Guard Service.   │
│ 3. UNIFICACIÓN CLIENTE ──► Eliminar scripts legacy y compilar solo TypeScript.    │
│ 4. EMPTY STATES & UI   ──► Inyectar vistas de estado vacío y sincronizar TM.     │
│ 5. MODULARIZACIÓN SASS ──► Desglosar _translation.scss bajo el estándar 7-1.     │
└──────────────────────────────────────────────────────────────────────────────────┘

Fase 1: Saneamiento de Controladores y Persistencia (Backend PHP & SQLite3)
1. Erradicación del Auto-seeding Compulsivo:
	○ En StringController::workspace, eliminar la llamada automática a seedInitialProjects().
	○ Si empty($projects) es verdadero, retornar un payload limpio con projects: [].
	○ Trasladar la siembra de pruebas a una acción explícita invocada solo por demanda del usuario (ej. endpoint /api/strings/seed-fixtures).
2. Activación de Claves Foráneas y Aislamiento SQLite:
	○ En DatabaseConfig::getConnection, ejecutar inmediatamente tras abrir el PDO:

```php
$pdo->exec('PRAGMA foreign_keys = ON;');
$pdo->exec('PRAGMA journal_mode = WAL;'); // Write-Ahead Logging para evitar "database is locked"
$pdo->setAttribute(PDO::ATTR_TIMEOUT, 5); // 5 segundos de espera antes de fallar
```
3. Desacople de StringController.php:
	○ Extraer la lógica de Memoria de Traducción hacia TranslationMemoryController.php.
	○ Extraer la exploración física de disco hacia VfsScannerService.php.
	○ Validar rutas canónicas con realpath() y restringir operaciones a las carpetas configuradas en .env (SINS_INSTALL_PATH, SINS_MODS_PATH, storage/).

Fase 2: Robustecimiento del Motor de Localización Iron Engine

1. Corrección de Parser y Serializador .str:
	○ Soportar formalmente el estándar canónico de lectura por bloques StringInfo:
		◘ Cabecera TXT (línea 1).
		◘ NumStrings N (línea 2).
		◘ Bloques con sangría tabulada \t estricta.
	○ Manejo estricto de terminación CRLF y BOM UTF-8 \xEF\xBB\xBF mediante ByteBufferHelper.

2. Blindaje de Token Guard: 
	○ Integrar validación estricta de las 4 familias de variables de Ironclad Games:
		◘ [VALUE], [VALUE0], [VALUE1], [VALUE2]
		◘ %s, %d, %.1f, %f
		◘ {0}, {1}, {2}
		◘ Modificadores de color y formato hexadecimal del motor.

Fase 3: Unificación del Frontend en TypeScript Puro

1. Depuración de la Doble Pila:
	○ Retirar las etiquetas <script src="assets/js/nexus-core.js"> y sus módulos hermanos de app-shell.template.html.
	○ Centralizar todo el estado de la aplicación en AppStore (src/frontend/state/app-store.state.ts) y la comunicación en GlobalEventBus (event-bus.ts).

2. Sincronización Reactiva de Telemetría:
	○ Al seleccionar un proyecto, emitir el evento project:selected con sus métricas consolidadas.
	○ La subpestaña de Telemetría escuchará este evento y renderizará automáticamente los datos reales del proyecto activo, mostrando un selector si no hay ninguno seleccionado.

Fase 4: Implementación de Estados Vacíos (Empty States) Estéticos

1. Diseño e Integración del Empty State de Proyectos:
 	○ Cuando workspaceData.projects.length === 0, inyectar la tarjeta neumórfica estructurada con badges interactivos, explicación clara de SQLite3 desconectada de proyectos y botones de acción ("Crear Nuevo .str" e "Importar Archivo").

2. Feedback Contextual de Borrado Crítico:
	○ En el modal de eliminación, reemplazar el botón con cuenta regresiva por una barra de progreso visual de 5 segundos con aviso explícito del protocolo seleccionado (Digital = Preservar archivo en disco; Físico = Destrucción con unlink).

Fase 5: Modularización Modular de Estilos SASS (Arquitectura 7-1)
1. Desglose de _translation.scss:
	○ Mover modales a src/frontend/scss/components/_modals.scss.
	○ Mover componentes de datatable y virtual scroll a src/frontend/scss/components/_datatable-virtual.scss.
	○ Mover la barra de paginación a src/frontend/scss/components/_pagination.scss.
	○ Crear la carpeta src/frontend/scss/pages/translation/ y dividir en:
		◘ _layout.scss (estructura flex, barras contextuales y carrusel de subpestañas).
		◘ _workspace.scss (tarjetas de proyectos, layout dual y explorador de archivos detectados).
		◘ _live-editor.scss (toolbar live, breadcrumbs y marquee).
		◘ _telemetry.scss (cajas métricas y registro de cambios de persistencia).
		◘ _memory.scss (banco relacional de segmentos TM y buscador difuso).
		◘ _agents.scss (módulos neuronales experimentales y Token Guard notice).

Resumen del Diagnóstico

Submódulo Evaluado 	|	Diagnóstico Actual 		|	Riesgo Operativo				|		Solución Inmediata

Proyectos SQLite3	  
						Auto-seeding compulsivo 
						cuando count == 0			Crítico (Bug de Proyecto Zombi)		Retirar auto-seeding en 
																						StringController.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Telemetría				Datos desfasados, 
						variables en --,
						sin proyecto activo				Alto (Desincronización)			Vincular con GlobalStore y 
																							endpoint reactivo.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

VFS / SQLite3			Múltiples IDs de proyecto
						para el mismo archivo físico	Alto (Integridad de Datos)		Validación de unicidad por 
																							ruta canónica.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

ConvertData CLI 		Inyección en proc_open y 
						emulación binaria falsa	Crítico 	(Seguridad / CTD Crash)		Usar escapeshellarg() y remover 
																							emulación corrupta.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Frontend Scripts		Doble importación concurrente 
						(JS Legacy + TS Bundle)				Medio (Colisiones en DOM)		Eliminar imports legacy y
																								compilar solo TS.
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Hojas de Estilo			Monolito de 727 líneas en 
						_translation.scss	Bajo 				(Mantenibilidad)				Modularizar bajo el estándar 
																										SASS 7-1.