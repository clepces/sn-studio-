# Especificación de la API REST - Solaris Nexus Studio

## 1. Protocolo de Comunicación y Estándar de Seguridad

1. **Protocolo Cero Exposición (UUID Safety):**  
   Toda respuesta de error genera un identificador único seguro (`UUID v4`), ocultando detalles de la infraestructura interna y retornando un sobre JSON estructurado:
   ```json
   {
     "success": false,
     "message": "Mensaje de error sanitizado para el usuario.",
     "error_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
     "timestamp": "2026-10-27T14:00:00.000Z"
   }
   ```
2. **Sobre Canónico de Respuesta (JSON Envelope):**  
   Todas las respuestas JSON exitosas cumplen con el formato:
   ```json
   {
     "success": true,
     "data": { ... },
     "timestamp": "2026-10-27T14:00:00.000Z"
   }
   ```
3. **Servidor y Puerto:**  
   El backend se ejecuta sobre **Node.js 22 LTS / Express** en el puerto `3000` (`http://0.0.0.0:3000/api/*`).

---

## 2. Catálogo Exhaustivo de Endpoints

### 2.1 Subsistema de Sistema y Diagnóstico (`/api/system`)

#### `GET /api/system/health`
* **Descripción:** Comprueba el estado de salud, memoria utilizada, versión del runtime y conectividad del storage.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "appName": "Solaris Nexus Studio",
      "company": "Clepces org. ltd",
      "version": "v0.4.1.0-alpha",
      "env": "production",
      "database": "connected",
      "engine_fs": "valid",
      "phpVersion": "8.2.18 (Node.js 22 Enterprise)",
      "memoryUsageMb": 18.42
    },
    "timestamp": "2026-10-27T14:00:00.000Z"
  }
  ```

#### `GET /api/system/environment`
* **Descripción:** Inspecciona el entorno real de juego, diccionarios en disco, recuento de entidades, escenarios galácticos y presupuesto de memoria LAA.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "game": {
        "installed": true,
        "path": "C:/Games/Sins of a Solar Empire Rebellion",
        "spanishLocalization": {
          "exists": true,
          "file": "Localizations/es/String/English.str",
          "stringCount": 7828
        },
        "entitiesCount": 1872,
        "galaxiesCount": 126
      },
      "mods": {
        "exists": true,
        "path": "Documents/My Games/Ironclad Games/Sins of a Solar Empire Rebellion/Mods-Rebellion v1.85",
        "activeCount": 3,
        "active": [
          "[ES] Spanish Translation Pack P999",
          "Enhanced 4X Rebellion Mod",
          "Sins Community Balance Patch"
        ],
        "activeDetailed": [
          { "name": "[ES] Spanish Translation Pack P999", "exists": true, "hasContent": true, "state": "OK", "isMinimod": true, "priority": 999, "ramMb": 15 },
          { "name": "Enhanced 4X Rebellion Mod", "exists": true, "hasContent": true, "state": "OK", "isMinimod": false, "priority": 989, "ramMb": 250 },
          { "name": "Sins Community Balance Patch", "exists": true, "hasContent": true, "state": "OK", "isMinimod": false, "priority": 979, "ramMb": 250 }
        ],
        "hasMissingDirs": false,
        "availableCount": 5,
        "available": [
          "[ES] Spanish Translation Pack P999",
          "Enhanced 4X Rebellion Mod",
          "Sins Community Balance Patch",
          "Star Wars Interregnum",
          "Armada III Star Trek"
        ],
        "ramBudget": {
          "totalActiveRamMb": 515,
          "laaCeilingMb": 3250,
          "freeBudgetMb": 2735,
          "isSafe": true,
          "usagePercent": 16
        }
      }
    },
    "timestamp": "2026-10-27T14:00:00.000Z"
  }
  ```

#### `GET /api/system/executions`
* **Descripción:** Retorna el historial de operaciones y tareas ejecutadas por el sistema.
* **Respuesta Exitosa (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "executions": [
        {
          "exec_id": 5,
          "exec_type": "SYS",
          "description": "Verificación de base de datos relacional y storage",
          "details": "storage/database.sqlite conectado",
          "result": "OK",
          "created_at": "2026-10-27T13:59:00.000Z"
        }
      ]
    },
    "timestamp": "2026-10-27T14:00:00.000Z"
  }
  ```

#### `POST /api/system/executions`
* **Descripción:** Registra una nueva acción o evento de telemetría en el historial.
* **Payload:**
  ```json
  {
    "type": "CLI",
    "description": "Conversión TXT2 a binario",
    "details": "tests/fixtures/sample_demo.entity",
    "result": "OK"
  }
  ```

#### `GET /api/system/permissions`
* **Descripción:** Inspecciona permisos de lectura/escritura en directorios de juego, mods, boveda de backups y ejecutables.

#### `POST /api/system/deploy-native`
* **Descripción:** Despliega el diccionario de traducción al español en la ruta base del juego con respaldo atómico automático.

#### `POST /api/engine/convert`
* **Descripción:** Convierte entidades, mallas o recursos entre formato texto plano y binario, calculando checksum SHA-256.

---

### 2.2 Subsistema de Cadenas Léxicas y Localización (`/api/strings`)

#### `GET /api/strings/workspace`
* **Descripción:** Retorna la lista de proyectos registrados, archivos `.str` descubiertos por categoría y estado del motor de almacenamiento.

#### `GET /api/strings/project-strings`
* **Descripción:** Devuelve la lista paginada de cadenas de un proyecto con soporte de filtrado (`ALL`, `TRANSLATED`, `UNTRANSLATED`, `REVIEW`).
* **Parámetros Query:** `project_id`, `limit` (default: 100), `offset` (default: 0), `status`.

#### `POST /api/strings/save-entry`
* **Descripción:** Actualiza la traducción de una cadena individual y actualiza la Memoria de Traducción compartida.
* **Payload:**
  ```json
  {
    "project_id": "sins-rebellion-core",
    "key": "IDS_CAPITAL_SHIP_NAME",
    "translated": "Acorazado Clase Kol",
    "original": "Kol Class Battleship"
  }
  ```

#### `GET /api/strings/tm-stats`
* **Descripción:** Retorna estadísticas del banco de Memoria de Traducción (unidades totales, verificadas, coincidencias automáticas).

#### `GET /api/strings/tm-search` y `POST /api/strings/tm-search`
* **Descripción:** Búsqueda difusa de segmentos traducidos en el banco de memoria por término o clave.

#### `POST /api/strings/suggest-tm`
* **Descripción:** Sugiere traducciones para un texto de origen basándose en similitud fonética/léxica.

#### `POST /api/strings/auto-propagate`
* **Descripción:** Propaga traducciones automáticamente a todas las cadenas idénticas que carecen de traducción.

#### `POST /api/strings/parse`
* **Descripción:** Parsea el contenido en texto plano o archivo físico `.str` respetando la gramática canónica de Iron Engine (`TXT`, `NumStrings`, `StringInfo`).

#### `POST /api/strings/validate`
* **Descripción:** Valida la integridad sintáctica de una entrada mediante **Token Guard** (`[VALUE]`, `%s`, `%d`, `{0}`) y cálculo de riesgo por expansión de texto.

#### `POST /api/strings/export`
* **Descripción:** Serializa las entradas a un archivo `.str` canónico con codificación **UTF-8 con BOM** (`\uFEFF`) y terminación de línea **CRLF** (`\r\n`).

#### `POST /api/strings/create-project`
* **Descripción:** Registra un nuevo proyecto de localización en el workspace.

#### `POST /api/strings/delete-project`
* **Descripción:** Elimina un proyecto del espacio de trabajo con protocolo de borrado seguro.

---

### 2.3 Subsistema de Mods y VFS (`/api/mods`)

#### `GET /api/mods/detect-platforms`
* **Descripción:** Identifica instalaciones del juego en plataformas Steam, GOG Galaxy o rutas personalizadas.

#### `POST /api/mods/validate-custom-path`
* **Descripción:** Valida si una ruta contiene los ejecutables y directorios oficiales del juego.

#### `GET /api/mods/scan`
* **Descripción:** Escanea la carpeta `Mods-Rebellion v1.85` e identifica mods disponibles con estimación de memoria RAM.

#### `GET /api/mods/enabled`
* **Descripción:** Lee la lista de mods activos en cascada desde `EnabledMods.txt`.

#### `POST /api/mods/save`
* **Descripción:** Actualiza la jerarquía de mods en `EnabledMods.txt` con respaldo automático.

#### `POST /api/mods/synthesize-session`
* **Descripción:** Sintetiza el orden de carga con el minimod de idioma en prioridad P999.

---

### 2.4 Subsistema de Entidades y Naves (`/api/entities`)

#### `GET /api/entities/catalog`
* **Descripción:** Catálogo canónico de naves capitales con especificaciones reales del motor (Kol, Dunov, Marza, Radiance, Skirantra).
* **Campos devueltos:** `id`, `name`, `faction`, `role`, `hullPoints`, `shieldPoints`, `antiMatter`, `armorPoints`, `abilities`, `weapons`.

#### `POST /api/entities/inspect`
* **Descripción:** Parsea un archivo `.entity` en formato texto (`TXT` o `TXT2`) extrayendo sus atributos de combate con advertencia de checksum multijugador.

#### `POST /api/entities/update`
* **Descripción:** Actualiza parámetros de nave y genera respaldo atómico en `storage/backups`.

---

### 2.5 Subsistema de Topología Galáctica (`/api/galaxy`)

#### `POST /api/galaxy/parse`
* **Descripción:** Parsea un archivo de escenario galáctico `.galaxy` extrayendo estrellas, planetas y líneas de fase.

#### `POST /api/galaxy/generate`
* **Descripción:** Genera un escenario estelar procedural con topología balanceada, líneas de fase bidireccionales y cero planetas aislados.
