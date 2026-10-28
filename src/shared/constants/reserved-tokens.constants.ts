/**
 * Expresiones regulares y patrones de tokens reservados del motor C++ de Ironclad Games.
 * Cualquier alteración de estos tokens en las cadenas de traducción provoca cierres del juego.
 */

export const RESERVED_TOKENS = {
  // Variables numéricas y de cadena dinámicas del motor: [VALUE], [VALUE0], etc.
  VALUE_VARIABLES: /\[VALUE\d*\]/g,

  // Especificadores de formato printf de C++: %s, %d, %f, %1.2f, etc.
  PRINTF_SPECIFIERS: /%(\d+\$)?([-+# 0]*)?(\d+)?(\.\d+)?([diouxXeEfgGaAcpsn%])/g,

  // Índices de sustitución posicional: {0}, {1}, {2}
  POSITIONAL_INDICES: /\{\d+\}/g,

  // Saltos de línea embebidos explícitos: \n o \r\n
  EMBEDDED_NEWLINES: /\\r?\\n/g,

  // Comillas dobles internas que deben ser escapadas o no balanceadas
  UNESCAPED_DOUBLE_QUOTES: /(?<!\\)"/g,
} as const;

export const RESERVED_TOKEN_KEYS = [
  '[VALUE]',
  '%s',
  '%d',
  '%f',
  '\\n',
] as const;
