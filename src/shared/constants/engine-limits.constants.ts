/**
 * Constantes y umbrales de seguridad para el motor C++ de 32 bits de Ironclad Games.
 * Sins of a Solar Empire: Rebellion opera bajo DirectX 9 con límite LAA de ~3.2 GB.
 */

export const ENGINE_LIMITS = {
  // Límite de memoria virtual crítico antes de MiniDump Crash (MB)
  MAX_SAFE_RAM_MB: 2800,
  WARNING_RAM_MB: 3100,
  CRITICAL_RAM_MB: 3350,

  // Consumo base estimado del motor sin mods
  BASE_GAME_RAM_MB: 1400,

  // Consumos típicos estimados por categoría de mod
  EXPANSION_MOD_RAM_MB: 450,
  TOTAL_CONVERSION_RAM_MB: 1250,
  MINIMOD_HD_TEXTURES_RAM_MB: 700,

  // Heurística de expansión de longitud de cadenas (EN -> ES)
  TEXT_EXPANSION_RATIO_SAFE: 1.35,
  TEXT_EXPANSION_RATIO_WARNING: 1.6,

  // Prioridad máxima reservada para minimods de localización VFS
  TRANSLATION_MINIMOD_PRIORITY: 999,

  // Formato canónico de archivo
  CANONICAL_ENCODING: 'UTF-8',
  BOM_BYTES: [0xef, 0xbb, 0xbf] as const,
  LINE_ENDING: '\r\n',
  REQUIRED_HEADER: 'TXT',
  REQUIRED_NUMSTRINGS_PREFIX: 'NumStrings',
} as const;
