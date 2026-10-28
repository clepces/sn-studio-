# AUDITORÍA INTEGRAL DE ARQUITECTURA, CÓDIGO Y SUBSISTEMAS
**Solaris Nexus Studio (Clepces org. ltd)**  
*Versión de Análisis Base:* v0.4.2 Enterprise  
*Entorno Original Heredado:* WAMP / PHP 8.2 + SQLite3 + Vanilla TS + Modular SASS (7-1) + IronEngine (Sins of a Solar Empire: Rebellion v1.85)  
*Entorno Migrado de Producción:* Google AI Studio (Node.js 22 LTS + Express + TypeScript + Vite / esbuild / SASS)

---

## ESTRUCTURA DE LOS INFORMES DE AUDITORÍA

1. [📋 INFORME 1: BUGS CRÍTICOS, DESINCRONIZACIONES Y CÓDIGO INSEGURO](#informe-1-bugs-críticos-desincronizaciones-y-código-inseguro)
2. [🎮 INFORME 2: INTEGRIDAD DE ARCHIVOS DE JUEGO (IRON ENGINE, VFS & LAA 32-BIT)](#informe-2-integridad-de-archivos-de-juego-iron-engine-vfs--laa-32-bit)
3. [🧱 INFORME 3: MONOLITISMO, MODULARIZACIÓN Y DUPLICIDAD ARQUITECTÓNICA](#informe-3-monolitismo-modularización-y-duplicidad-arquitectónica)
4. [📊 INFORME 4: DESINCRONIZACIÓN DE TELEMETRÍA, ESTADOS VACÍOS (EMPTY STATES) Y UX](#informe-4-desincronización-de-telemetría-estados-vacíos-empty-states-y-ux)
5. [🚀 INFORME 5: PLAN MAESTRO DE ACCIÓN Y REFACTORIZACIÓN PASO A PASO](#informe-5-plan-maestro-de-acción-y-refactorización-paso-a-paso)

---

<a name="informe-1-bugs-críticos-desincronizaciones-y-código-inseguro"></a>
## 📋 INFORME 1: BUGS CRÍTICOS, DESINCRONIZACIONES Y CÓDIGO INSEGURO

### 1.1. El Bug del "Proyecto Zombi" (Resurrección en bucle de proyectos eliminados)

* **Ubicación Original:** `StringController.php`, método `workspace()`, líneas 105-115.
* **Mecanismo del Fallo:**
  ```php
  $projects = $repo->listProjects();
  // Si la base de datos está vacía, inicializar proyectos canónicos con archivos reales
  if (empty($projects)) {
      $this->seedInitialProjects($repo, $config);
      $projects = $repo->listProjects();
  }
  ```
  Cuando un usuario elimina el proyecto *"Sins of a Solar Empire: Rebellion (Vanilla Base)"* (mediante borrado digital o físico), la tabla `tbl_projects` queda con 0 registros (`empty($projects) === true`). En la siguiente petición HTTP a `/api/strings/workspace`, el backend volvía a disparar incondicionalmente `seedInitialProjects()`, recreando el proyecto y sus 7.828 registros en `tbl_string_entries`. El usuario jamás podía dejar su espacio de trabajo en blanco.
* **Consecuencia en Frontend (`translation-studio.ts`):**  
  Al refrescar el workspace, el cliente recibía de nuevo el proyecto supuestamente eliminado y lo seleccionaba automáticamente si no había otro en memoria (`selectProject(firstProj.project_id)`), provocando la ilusión de que el botón "Eliminar" falló o no guardó los cambios.

> 💡 **Comentario y Solución Más Óptima:**  
> 1. **Para entornos PHP/SQL tradicionales:** Retirar de raíz la auto-inicialización en `workspace()`. Si `count($projects) === 0`, el backend debe responder con `projects: []` y permitir que el frontend renderice su correspondiente **Empty State**. La creación de fixtures o proyectos iniciales debe delegarse a una acción explícita del usuario mediante un botón *"Sembrar proyecto de ejemplo"* o un endpoint administrativo (`POST /api/strings/seed-fixtures`).  
> 2. **Implementación en Google AI Studio (Node.js/Express):** En el nuevo `server.ts`, cuando un usuario ejecuta `POST /api/strings/delete-project`, el proyecto se elimina de la colección. Si la lista queda vacía, se devuelve una lista vacía `projects: []`, permitiendo al usuario crear proyectos limpios desde cero mediante el modal correspondiente sin reapariciones involuntarias.

---

### 1.2. Fallos de Seguridad: Path Traversal y Manipulación de Archivos en Disco

* **Ubicación Original:** `StringController::createProject`, `StringController::deleteProject` y `ConvertCliModule`.
* **Vulnerabilidad de Escape de Directorio:**
  ```php
  // StringController.php
  $rootDir = dirname(__DIR__, 3);
  $fullPath = $rootDir . '/' . ltrim($targetPath, '/\\');
  // Se valida únicamente:
  if (str_contains($targetPath, '..') || str_contains($basePath, '..')) {
      throw new \InvalidArgumentException('Ruta no permitida: traversal detectado.');
  }
  ```
  La comprobación ingenua con `str_contains('..')` es eludible en entornos Windows mediante caracteres de barra combinados o rutas absolutas como `C:/Windows/...` o unidades de red UNC (`\\server\share`). Si `$targetPath` es una ruta absoluta, `ltrim($targetPath, '/\\')` en Windows no elimina la letra de unidad (`C:`), provocando que `$rootDir . '/' . 'C:/...'` genere comportamientos anómalos o escrituras fuera del directorio seguro (`storage/`).
* **Truncado Involuntario de Archivos (.str Destructivo):**
  ```php
  if (!file_exists($fullPath)) {
      $initialStr = "\xEF\xBB\xBFStringInfo\r\n{\r\n\tNumStrings 0\r\n}\r\n";
      @file_put_contents($fullPath, $initialStr);
  }
  ```
  Si se introduce una ruta que no se puede verificar por permisos o problemas de mayúsculas/minúsculas en sistemas case-sensitive (Linux/Docker), el sistema creaba un archivo en blanco en el lugar incorrecto o sobrescribía punteros de archivo sin validación canónica de lectura previa.

> 💡 **Comentario y Solución Más Óptima:**  
> 1. **Para PHP:** Resolver la ruta canónica estricta con `realpath()` o construir rutas relativas confinadas mediante `pathinfo()` validando contra un directorio base prefijado:
>    ```php
>    $canonicalRoot = realpath($config['storage_dir']);
>    $resolvedPath = realpath(dirname($fullPath));
>    if ($resolvedPath === false || !str_starts_with($resolvedPath, $canonicalRoot)) {
>        throw new \SecurityException("Intento de acceso fuera del sandbox permitido.");
>    }
>    ```
> 2. **Implementación en Google AI Studio:** Se normalizan las rutas mediante `path.resolve()` asegurando que cualquier entrada esté restringida al espacio de trabajo o a directorios virtuales seguros (`storage/`), rechazando prefijos de unidad Windows no permitidos y protegiendo la integridad del sistema de archivos.

---

### 1.3. Concurrencia en SQLite3 y Ausencia de Claves Foráneas Reales

* **Ubicación Original:** `DatabaseConfig.php`, `DatabaseMigrator.php` y `ProjectRepository.php`.
* **Falta de Enlace de Claves Foráneas:**  
  SQLite por defecto tiene deshabilitado el soporte de claves foráneas a nivel de motor. Aunque `DatabaseMigrator` declaraba:
  ```sql
  FOREIGN KEY (project_id) REFERENCES tbl_projects(project_id) ON DELETE CASCADE
  ```
  Al abrir la conexión PDO en `DatabaseConfig`, no se ejecutaba `PRAGMA foreign_keys = ON;`.
  *Impacto:* Si se borraba un proyecto mediante una consulta manual o una transacción fallida, `tbl_string_entries` acumulaba miles de entradas huérfanas, incrementando el peso del archivo `.sqlite` y corrompiendo los conteos de `COUNT(e.entry_id)`.
* **Riesgo de Bloqueo SQLITE_BUSY (Database Locked):**  
  La autopropagación (`autoPropagate`) y la inserción por lotes (`batchInsertEntries`) abrían transacciones largas (`$this->pdo->beginTransaction()`). Si mientras tanto el frontend solicitaba telemetría (`/api/strings/tm-stats`) o el poller de ejecuciones consultaba `tbl_executions`, SQLite bloqueaba el archivo completo (*database is locked*), disparando errores 500 no capturados.

> 💡 **Comentario y Solución Más Óptima:**  
> 1. **Para SQLite en PHP:** Al instanciar PDO, forzar siempre:
>    ```php
>    $pdo->exec('PRAGMA foreign_keys = ON;');
>    $pdo->exec('PRAGMA journal_mode = WAL;'); // Concurrencia lector-escritor
>    $pdo->setAttribute(PDO::ATTR_TIMEOUT, 5); // Espera activa de 5s ante bloqueos
>    ```
> 2. **Implementación en Google AI Studio:** La arquitectura en Node.js 22 utiliza un repositorio en memoria reactivo con persistencia de instantáneas atómicas, eliminando por diseño los bloqueos de archivo de base de datos (`SQLITE_BUSY`) y garantizando tiempos de respuesta sub-milisegundo.

---

### 1.4. Inyección en CLI y Emulación Ficticia en ConvertDataService

* **Ubicación Original:** `ConvertDataService.php`, líneas 84-124.
* **Construcción de Comando Insegura:**
  ```php
  $cmd = sprintf('"%s" %s "%s" "%s" %s', $this->cliExecutablePath, $type, $inputPath, $outputPath, $targetFormat);
  $process = @proc_open($cmd, $descriptors, $pipes, $cwd);
  ```
  Los argumentos `$inputPath` y `$outputPath` provenían directamente de `$payload['file_path']` sin usar `escapeshellarg()`. Una ruta con comillas o caracteres especiales (`&`, `|`, `;`) en Windows/Linux permitía inyección arbitraria de comandos en el shell del sistema.
* **Emulación Binaria Falsa (Simulación Corrupta):**  
  Cuando el ejecutable oficial `ConvertData_Rebellion.exe` no existía, el servicio hacía:
  ```php
  // Emulación binaria: remover cabecera TXT y escribir con prefijo binario
  $emulated = str_starts_with($content, 'TXT') ? substr($content, 3) : $content;
  file_put_contents($outputPath, $emulated);
  ```
  *Gravedad:* El formato binario de IronEngine no es texto plano sin "TXT"; es un flujo serializado binario compilado con alineación de estructuras C++ y vertex buffers de DirectX. Si un usuario intentaba cargar este archivo generado en el juego real, el ejecutable de Rebellion abortaba inmediatamente con un *Crash to Desktop (CTD)* de lectura de puntero nulo.

> 💡 **Comentario y Solución Más Óptima:**  
> 1. **Seguridad CLI:** Utilizar paso de argumentos por array (sin shell) como `child_process.spawnFile` o `proc_open` con paso directo de arrays de argumentos, evitando concatenación de cadenas de shell.
> 2. **Manejo de Ejecutables Nativos en Entornos Web:** No generar pseudo-binarios corruptos. Si `ConvertData_Rebellion.exe` no está disponible en el contenedor o servidor, el sistema debe reportarlo transparentemente como *"Entorno de emulación / Validación de sintaxis"* con hash de integridad real, sin corromper el contenido del archivo original ni prometer compatibilidad DirectX binaria falsa.

---

### 1.5. Fugas de Memoria en Frontend: Intervalos Huérfanos

* **Ubicación Original:** `translation-studio.ts`, función `openDeleteConfirmModal()`.
* **El Problema:**
  ```typescript
  deleteCountdownInterval = setInterval(() => {
    timeLeft--;
    // ...
  }, 1000);
  ```
  Si el usuario presionaba la tecla Escape o hacía clic en el fondo oscuro (*backdrop*) antes de que terminaran los 5 segundos, el modal se cerraba visualmente pero el `setInterval` continuaba ejecutándose en segundo plano, mutando elementos del DOM que ya no estaban visibles o generando errores si el modal era reabierto en un estado diferente.

> 💡 **Comentario y Solución Más Óptima:**  
> Implementar un gestor de modales que limpie automáticamente temporizadores en cualquier evento de descarte:
> ```typescript
> function closeDeleteConfirmModal() {
>   if (deleteCountdownInterval) {
>     clearInterval(deleteCountdownInterval);
>     deleteCountdownInterval = null;
>   }
>   modalEl.classList.remove('active');
> }
> ```
> Asegurar que los listeners de `Escape`, clic exterior y botones de cancelar invoquen invariablemente la función unificada de cierre y limpieza.

---

<a name="informe-2-integridad-de-archivos-de-juego-iron-engine-vfs--laa-32-bit"></a>
## 🎮 INFORME 2: INTEGRIDAD DE ARCHIVOS DE JUEGO (IRON ENGINE, VFS & LAA 32-BIT)

### 2.1. Arquitectura de Archivos de Cadenas Léxicas (.str)
* **Especificación Estricta de Iron Engine:**
  1. **BOM UTF-8 Obligatorio:** Si el archivo no inicia con los bytes hexadecimales `0xEF 0xBB 0xBF`, los caracteres no ASCII del español (á, é, í, ó, ú, ñ, ¿, ¡) se renderizan como signos de interrogación o cajas negras en la fuente de DirectX 9.
  2. **Saltos de Línea Canónicos:** El motor requiere terminación Windows CRLF (`\r\n`). Si se guarda con `\n` (estilo UNIX), el parser del ejecutable de 32 bits lee la línea siguiente como parte del valor anterior.
  3. **Directiva NumStrings:** Debe coincidir exactamente con el número de bloques `StringInfo`. Si `NumStrings` declara 7828 y se parsean 7827, el juego aborta la carga en la pantalla de splash inicial (*MiniDump crash*).
* **Deficiencia Detectada en `StrParserService.php`:**  
  El método `serialize()` escapaba comillas así:
  ```php
  $escapedValue = preg_replace('/(?<!\\\\)"/', '\"', $value);
  ```
  Sin embargo, el motor de Rebellion **no utiliza barras invertidas** para escapar comillas dobles dentro de strings de valor; el motor utiliza comillas dobles repetidas `""` o espera que las comillas no formen parte de la cadena gramatical. Además, cadenas con saltos de línea embebidos literales se rompían al usar `preg_split("/\r\n|\n|\r/", $content)` sobre valores multilínea.

> 💡 **Comentario y Solución Más Óptima:**  
> Implementar un serializador canónico con buffer exacto:
> 1. Inyectar `\uFEFF` (BOM UTF-8) en la primera posición del buffer.
> 2. Escribir cabecera: `"TXT\r\nNumStrings " + entries.length + "\r\n"`.
> 3. En cada entrada, usar tabulación estricta `\t`:
>    `"StringInfo\r\n\tID \"" + id + "\"\r\n\tValue \"" + sanitizado + "\"\r\n"`.
> 4. Forzar que todos los saltos de línea del archivo exportado sean invariablemente `\r\n`.

---

### 2.2. Techo de Memoria Virtual LAA (32-Bit Large Address Aware: 3.250 MB)

* **El Límite del Motor:**  
  `Sins of a Solar Empire: Rebellion.exe` es un proceso x86 de 32 bits. Incluso con la bandera Large Address Aware (LAA) habilitada, el límite físico teórico es de 4.096 MB, pero la biblioteca de sonido FMOD y las asignaciones de buffers de DirectX 9 provocan fragmentación de memoria heap a partir de los 3.250 MB - 3.350 MB, produciendo:
  ```
  EXCEPTION_ACCESS_VIOLATION (0xC0000005) al realizar saltos hiperespaciales entre estrellas.
  ```
* **Problema en el Cálculo Original de Presupuesto:**  
  El cálculo sumaba valores estáticos sin considerar colisiones VFS:
  ```php
  $baseEngine = 1400; // MB
  // Mod A (+700 MB) + Mod B (+1250 MB)
  ```
  Si un mod con prioridad 999 sobrescribe las texturas de un mod en prioridad 980, ambos archivos **no se cargan simultáneamente en memoria**: solo se carga el ganador del VFS.

> 💡 **Comentario y Solución Más Óptima:**  
> El calculador de presupuesto debe aplicar la resolución de jerarquía VFS:
> 1. Considerar 1.400 MB como base del motor Rebellion.
> 2. Ponderar minimods de localización en apenas 15-25 MB (solo diccionarios de texto).
> 3. Ponderar mods de texturas y conversión total aplicando factor de exclusión cuando comparten directorios de assets (`Textures/`, `Mesh/`).
> 4. Advertir con semáforo rojo cuando el total supere los 3.250 MB de techo seguro.

---

### 2.3. Estructura Gramatical de EnabledMods.txt
* **Gramática Canónica Requerida:**
  ```ini
  TXT2
  SinsArchiveVersion 197
  Version 0
  enabledModNameCount N
  enabledModName "NombreMod_1"
  enabledModName "NombreMod_2"
  ```
* **Fallo en Inyección de Minimod:**  
  Al inyectar el minimod de idioma en prioridad 999, si no existe el directorio físico `{NombreMod}/String/English.str`, el motor carga el mod en blanco pero consume descriptores de archivo abiertos innecesarios.

> 💡 **Comentario y Solución Más Óptima:**  
> Verificar siempre la existencia del directorio y del archivo de cadenas antes de registrarlo en `EnabledMods.txt`. Si no existe, crearlo atómicamente con su estructura canónica de carpetas (`/String/English.str`) y su respaldo correspondiente en `storage/backups/`.

---

### 2.4. Entidades de Flota (.entity) y Checksums Multijugador

* **Riesgo:**  
  Modificar valores como `HullPoints`, `shieldPoints` o `dps` en archivos `.entity` dentro de la carpeta `GameInfo` principal altera el checksum de red de Ironclad Online (ICO). Cualquier intento de jugar en línea o LAN provoca la expulsión inmediata:
  ```ini
  "Version Mismatch / Data Checksum Failed"
  ```

> 💡 **Comentario y Solución Más Óptima:**  
> 1. En la UI, mostrar una advertencia clara: *"Modificación de Parámetros de Entidad: Altera checksums de red. Uso exclusivo en partidas Sandbox / Singleplayer"*.  
> 2. Generar automáticamente una copia de respaldo con sufijo `.bak` antes de escribir cualquier mutación.  
> 3. Facilitar la exportación hacia una carpeta de minimod independiente en vez de sobreescribir el `GameInfo/` raíz de la instalación.

---

### 2.5. Topología de Escenarios Galácticos (.galaxy) y Congelamiento de IA

* **Riesgo de Islas de Fase y Grafos Inconexos:**  
  En mapas `.galaxy`, si una línea de salto (`jumpLane`) no está declarada de forma bidireccional o pasa por una zona de exclusión estelar, la IA del juego entra en un bucle infinito de cálculo de ruta (*Pathfinding Freeze*).

> 💡 **Comentario y Solución Más Óptima:**  
> El generador procedural de galaxias debe garantizar que el grafo sea **100% conexo**:
> 1. Generar anillo perimetral cerrado entre planetas continuos.
> 2. Agregar cuerdas transversales simétricas bidireccionales (`from <-> to`).
> 3. Verificar que no exista ningún nodo con grado de conexión 0 (planeta aislado).

---

<a name="informe-3-monolitismo-modularización-y-duplicidad-arquitectónica"></a>
## 🧱 INFORME 3: MONOLITISMO, MODULARIZACIÓN Y DUPLICIDAD ARQUITECTÓNICA

### 3.1. Duplicación Masiva entre TypeScript y JavaScript Compilado (Doble Pila)

* **Diagnóstico del Fallo:**  
  En la plantilla original `app-shell.template.html`, se importaban concurrentemente ambas pilas:
  ```html
  <script src="assets/js/nexus-core.js?v=0.4.2"></script>
  <script src="assets/js/modules/view-navigator.js?v=0.4.2"></script>
  <script src="assets/js/modules/translation-studio.js?v=0.4.2"></script>
  <!-- Y además el bundle compilado de TypeScript: -->
  <script type="module" src="assets/js/bundle.js?v=0.4.2"></script>
  ```
  `window.ViewNavigator` (escrito en Vanilla JS dentro de `view-navigator.js`) y `GlobalRouter` (instanciado desde `view-navigator.router.ts`) escuchaban simultáneamente los eventos `hashchange` y clics en el DOM. Cada cambio de pestaña provocaba dos mutaciones paralelas en almacenes de memoria distintos (`NexusCore.state` y `GlobalStore.state`).

> 💡 **Comentario y Solución Más Óptima:**  
> Unificar la arquitectura del cliente:
> 1. Compilar todo el código TypeScript con `esbuild` o `vite` en un único punto de entrada coherente.
> 2. Centralizar el estado en un único `GlobalStore` / `AppStore` reactivo con `EventBus`.
> 3. Eliminar scripts sueltos redundantes que compitan por manipular los mismos elementos del DOM.

---

### 3.2. Monolitismo en Hojas de Estilo (`_translation.scss` - 727 líneas)

* **Incumplimiento del Patrón SASS 7-1:**  
  `_translation.scss` acumulaba estilos de layout, modales globales, animaciones marquee, tablas virtuales, paginadores y tarjetas de agentes.
* **Profundidad de Anidamiento Excesiva:**  
  Selectores anidados hasta 6 niveles como:
  ```scss
  #tab-translation .str-subtab-bar.is-live-mode .str-nav-contextual-group .str-ctx-left .str-breadcrumb-pill .breadcrumb-active .crumb-file:hover
  ```
  Esto impedía que temas como `_theme-glassmorphism.scss` y modos oscuros pudieran sobrescribir propiedades sin recurrir a `!important`.

> 💡 **Comentario y Solución Más Óptima:**  
> Desacoplar bajo la arquitectura canónica SASS 7-1:
> - Modales a `src/interface/scss/components/_modals.scss`.
> - Tabla virtual y filas a `src/interface/scss/components/_datatable-virtual.scss`.
> - Paginación a `src/interface/scss/components/_pagination.scss`.
> - Dejar en `_translation.scss` únicamente el layout y distribución de la vista específica.

---

### 3.3. Monolitismo en Backend: StringController.php (485 líneas)

* **Violación de SRP:**  
  Un solo archivo administraba parseo, serialización, linter, exploración física de disco, persistencia de proyectos, memoria de traducción, autopropagación y sembrado de fixtures.

> 💡 **Comentario y Solución Más Óptima:**  
> En el nuevo stack Node.js/Express, las responsabilidades se encuentran organizadas en módulos de servicio dedicados y rutas REST especializadas:
> - Rutas de proyectos (`/api/strings/workspace`, `project-strings`, `save-entry`, `create-project`, `delete-project`).
> - Rutas de Memoria de Traducción (`/api/strings/tm-stats`, `tm-search`, `suggest-tm`, `auto-propagate`).
> - Rutas de compilación e inspección (`/api/strings/parse`, `validate`, `export`).

---

<a name="informe-4-desincronización-de-telemetría-estados-vacíos-empty-states-y-ux"></a>
## 📊 INFORME 4: DESINCRONIZACIÓN DE TELEMETRÍA, ESTADOS VACÍOS (EMPTY STATES) Y UX

### 4.1. Desincronización de Telemetría
* **Causa:**  
  La función `updateTelemetry()` en el cliente dependía exclusivamente de `state.allEntries`. Si el usuario ingresaba a la pestaña Telemetría directamente sin haber abierto previamente un archivo en el editor, las variables quedaban congeladas en `--` o `0`.

> 💡 **Comentario y Solución Más Óptima:**  
> Conectar la telemetría con el estado del proyecto activo en el backend o en el `GlobalStore`. Al cargar la vista de telemetría, si no hay entradas en memoria pero hay un proyecto activo en el espacio de trabajo, solicitar agregados calculados al backend (`/api/system/environment` y `/api/strings/workspace`) para mostrar métricas reales y consistentes.

---

### 4.2. Matriz de Estados Vacíos (Empty States)

| Módulo / Vista | Condición Vacía | Comportamiento Anterior Defectuoso | Comportamiento Canónico Óptimo |
| :--- | :--- | :--- | :--- |
| **Workspace Proyectos** | `projects.length === 0` | Resurrección en bucle del proyecto o pantalla congelada | Tarjeta neumórfica limpia con icono, explicación y botón *"Crear Nuevo Proyecto .str"* |
| **Editor en Vivo** | `filteredEntries.length === 0` | Bloque gris genérico sin información | Indicador interactivo del filtro activo con botón de restablecimiento |
| **Archivos Físicos** | `totalFiles === 0` | Listas colapsables vacías sin feedback | Banner explicativo de rutas de búsqueda y botón para escanear |
| **Historial Ejecuciones** | `executions.length === 0` | Texto plano desalineado | Componente estructurado con estado de conexión y sello de tiempo |
| **Memoria (TM)** | `items.length === 0` | Texto plano en cursiva pequeño | Panel de estado *"0 coincidencias exactas o difusas en el banco TM"* |

---

### 4.3. Problemas de UX y Animaciones CSS
* **Efecto Cinta (Marquee) en Breadcrumbs:**  
  `min(0px, calc(-100% + 140px))` en navegadores Blink generaba parpadeos (*jitter*) cuando el ancho del contenedor variaba.
* **Modal de Confirmación Crítica:**  
  Los botones permanecían deshabilitados 5 segundos sin indicador visual de progreso ni explicación clara de la diferencia entre borrado digital (preservar archivo físico) y borrado físico destructivo.

> 💡 **Comentario y Solución Más Óptima:**  
> 1. Sustituir el marquee oscilante por un truncado elegante con elipsis CSS (`text-overflow: ellipsis`) y un tooltip nativo `title` con la ruta completa.  
> 2. En el modal de eliminación, implementar una barra de progreso animada de 5 segundos con colores distintivos (ámbar para borrado digital, rojo para borrado físico irreversible).

---

<a name="informe-5-plan-maestro-de-acción-y-refactorización-paso-a-paso"></a>
## 🚀 INFORME 5: PLAN MAESTRO DE ACCIÓN Y REFACTORIZACIÓN PASO A PASO

### Matriz de Acciones Ejecutadas en la Migración a Google AI Studio

| Submódulo | Diagnóstico Anterior | Solución Más Óptima Ejecutada en la Migración | Estado |
| :--- | :--- | :--- | :---: |
| **Servidor y Runtime** | WAMP / Apache / PHP 8.2 (Incompatible con AI Studio) | Migración a **Node.js 22 LTS + Express** sirviendo en `0.0.0.0:3000` con `tsx` | ✅ **Resuelto** |
| **Proyectos Zombi** | Auto-seeding forzado en `count === 0` | Almacenamiento limpio en `server.ts`; si no hay proyectos, se respeta el espacio en blanco | ✅ **Resuelto** |
| **Seguridad de Archivos** | Path traversal eludible en Windows | Aislamiento y resolución de rutas canónicas en sandbox seguro | ✅ **Resuelto** |
| **Bases de Datos & Bloqueos** | `SQLITE_BUSY` por transacciones concurrentes | Modelo de persistencia reactivo en memoria con soporte de instantáneas y UUID v4 | ✅ **Resuelto** |
| **ConvertData CLI** | Inyección en `proc_open` y simulación binaria corrupta | Endpoint seguro `/api/engine/convert` con hashing SHA-256 sin corromper archivos | ✅ **Resuelto** |
| **Frontend Doble Pila** | JS legacy compitiendo con TypeScript bundle | Unificación en bundle compilado con scripts y enrutador sincronizados | ✅ **Resuelto** |
| **Estilos SASS** | Monolito de 727 líneas en `_translation.scss` | Compilación modular con `sass` hacia `public/assets/css/main-theme.css` | ✅ **Resuelto** |
| **Documentación** | Documentación antigua referenciando WAMP/PHP | Depuración de `docs/legacy/` y actualización completa de especificaciones | ✅ **Resuelto** |

---
*Fin del Informe Técnico de Auditoría.*
