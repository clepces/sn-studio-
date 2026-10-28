# Integración con Iron Engine e Ingeniería Inversa - Sins of a Solar Empire: Rebellion (v1.85)

## 1. Visión General del Motor de Juego
**Iron Engine** es el motor propietario de *Ironclad Games* que impulsa *Sins of a Solar Empire: Rebellion*. Este documento detalla las especificaciones de bajo nivel indispensables para manipular archivos de juego sin provocar fallos en el ejecutable (*Crash to Desktop* o *MiniDump*).

---

## 2. Archivos de Localización Léxica (.str)

### 2.1 Especificaciones de Formato Canónico
* **Cabecera Mandatoria:** La primera línea debe ser invariablemente `TXT`.
* **Directiva NumStrings:** La segunda línea debe contener `NumStrings N`, donde `N` es exactamente igual al recuento de bloques `StringInfo`.
* **Bloques StringInfo:** Cada entrada se delimita con sangría tabulada `\t`:
  ```ini
  TXT
  NumStrings 2
  StringInfo
  	ID "IDS_MAIN_MENU_TITLE"
  	Value "Sins of a Solar Empire: Rebellion"
  StringInfo
  	ID "IDS_FLEET_STATUS"
  	Value "Flota %s manteniendo posición con [VALUE] naves."
  ```
* **BOM UTF-8 Obligatorio:** El archivo debe comenzar con los bytes `\xEF\xBB\xBF` (`\uFEFF`). La omisión de este BOM corrompe caracteres acentuados y signos de apertura en las fuentes de DirectX 9.
* **Terminación de Línea:** Requiere **CRLF** (`\r\n`). Las terminaciones estilo Unix (`\n`) provocan que el parser de 32 bits concatene líneas consecutivas.
* **Escapado de Comillas:** El motor de Rebellion no admite comillas dobles escapadas con barra invertida (`\"`). Debe usarse comillas dobles repetidas `""` o evitar comillas literales en el valor.

---

## 3. Subsistema de Seguridad Sintáctica: Token Guard

Iron Engine sustituye variables dinámicas en tiempo de ejecución. La pérdida o alteración de un token en la traducción genera excepciones de lectura en C++:

| Familia de Tokens | Sintaxis de Ejemplo | Tipo de Dato en Motor | Impacto de Omisión |
| :--- | :--- | :--- | :--- |
| **DirectX Value** | `[VALUE]`, `[VALUE0]`, `[VALUE1]` | Números flotantes / enteros de balance | Desalineación de buffers numéricos |
| **Format Strings** | `%s`, `%d`, `%.1f`, `%f` | Punteros a nombres de naves, estrellas | **Crash inmediato (Access Violation)** |
| **Índices Posicionales** | `{0}`, `{1}`, `{2}` | Variables compuestas de interfaz | Cadena mostrada en blanco |
| **Comillas Huérfanas** | `"` no escapada | Delimitador léxico | Truncado de cadena y error de sintaxis |

El servicio **Token Guard** valida en tiempo real cada edición antes de guardarla.

---

## 4. Techo de Memoria Virtual LAA (32-Bit Large Address Aware: 3.250 MB)

* **Arquitectura del Ejecutable:** `Sins of a Solar Empire Rebellion.exe` es un proceso x86 de 32 bits.
* **Límite Práctico de Estabilidad:** Aunque LAA permite teóricamente direccionar hasta 4.096 MB, la fragmentación de la memoria heap producida por FMOD (audio) y los vertex buffers de DirectX 9 sitúa el umbral crítico de colapso en **3.250 MB - 3.350 MB**.
* **Cálculo de Presupuesto con Resolución VFS:**  
  El consumo de RAM no es una simple suma acumulativa de carpetas. Si un mod con prioridad P999 reemplaza texturas de otro mod con prioridad P10, únicamente el archivo prioritario en la jerarquía VFS es cargado en memoria.

---

## 5. Entidades de Juego (.entity) y Checksums de Red

* **Estructura:** Archivos de definición de naves, estructuras y habilidades en formato `TXT` o `TXT2`.
* **Riesgo Multijugador:** La mutación de parámetros como `HullPoints`, `ShieldPoints`, `ArmorPoints` o `dps` altera el checksum de comprobación de Ironclad Online (ICO) y partidas en red local (LAN). Si difiere del anfitrión (*Host*), el jugador es expulsado con el error:
  `"Version Mismatch / Data Checksum Failed"`.
* **Protocolo de Protección:** Toda modificación debe aislarse en un minimod independiente y generar un respaldo `.bak` previo en `storage/backups/`.

---

## 6. Topología de Escenarios Galácticos (.galaxy)

* **Grafo de Conectividad Estelar:** Los mapas `.galaxy` definen coordenadas de estrellas, planetas orbitales y líneas de salto hiperespacial (`jumpLane`).
* **Regla de No-Aislamiento:** Todo planeta debe pertenecer a un grafo conexo con rutas bidireccionales. Si la IA encuentra un planeta aislado sin salida de fase o una línea de salto intersecta la zona de exclusión gravitatoria de una estrella, el hilo de cálculo de rutas entra en un bucle infinito (*Pathfinding Freeze*).
