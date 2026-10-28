/**
 * Definiciones de tipos para el motor de localización y AST de archivos .str
 */

export interface TokenOccurrence {
  raw: string;
  type: 'variable' | 'format_specifier' | 'newline' | 'dynamic_tag';
  index: number;
}

export interface StringEntry {
  id: string;
  value: string;
  lineNumber: number;
  tokens: readonly TokenOccurrence[];
  isModified?: boolean;
}

export interface LocalizationFileAst {
  header: 'TXT';
  numStrings: number;
  entries: readonly StringEntry[];
  encoding: 'UTF-8-BOM';
  lineEnding: 'CRLF';
}

export type TextExpansionRisk = 'SAFE' | 'WARNING' | 'OVERFLOW_RISK';

export interface StringDiffEntry {
  id: string;
  originalValue: string;
  translatedValue: string;
  tokenMismatch: boolean;
  expansionRisk: TextExpansionRisk;
}
