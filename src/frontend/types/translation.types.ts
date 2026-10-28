/**
 * Tipos estrictos para el módulo Translation Studio (Cero `any`)
 * Solaris Nexus Studio - Clepces org. ltd
 */

export interface StrProject {
  project_id: string;
  name: string;
  version?: string;
  base_file_path?: string;
  target_file_path?: string;
  total_strings?: number | string;
  total_entries?: number | string;
  translated_count?: number | string;
  tokens_count?: number | string;
  sha256?: string;
  updated_at?: string;
}

export interface StrEntryState {
  id: string;
  original: string;
  translated: string;
  tokens: string[];
  status: 'TRANSLATED' | 'UNTRANSLATED' | string;
  entryId?: number | string;
  index: number;
}

export interface DiscoveredFileItem {
  name: string;
  rel_path: string;
  full_path?: string;
  size_bytes: number;
  tokens_count?: number;
  total_strings?: number;
  declared_numstrings?: number;
  status?: string;
  status_label?: string;
  badge_color?: string;
  encoding?: string;
  description?: string;
  issue_type?: string;
}

export interface DiscoveredLanguageGroup {
  lang_name: string;
  locale: string;
  flag: string;
  status?: string;
  status_label?: string;
  badge_color?: string;
  description?: string;
  files: DiscoveredFileItem[];
}

export interface DiscoveredModGroup {
  mod_name: string;
  mod_path: string;
  status?: string;
  status_label?: string;
  badge_color?: string;
  description?: string;
  files: DiscoveredFileItem[];
}

export interface DiscoveredFilesData {
  total_base?: number;
  total_mods?: number;
  base_languages?: DiscoveredLanguageGroup[];
  mods?: DiscoveredModGroup[];
  test_fixtures?: DiscoveredFileItem[];
}

export interface WorkspacePayload {
  projects?: StrProject[];
  discovered_files?: DiscoveredFilesData;
}

export interface TmItem {
  source_text: string;
  translated_text: string;
  usage_count: number;
  verified?: number;
}

export interface TmStatsPayload {
  total_segments?: number;
  total_reuses?: number;
  verified_count?: number;
  recent?: TmItem[];
}

export interface NexusCoreBridge {
  state: {
    allEntries: StrEntryState[];
    filteredEntries: StrEntryState[];
    page: number;
    pageSize: number | string;
    currentFilter: string;
  };
  extractTokens: (text: string) => string[];
  validateTokenSyntax: (orig: string, trans: string) => { valid: boolean; missing: string[]; extra: string[] };
  downloadBlob: (content: string, filename: string, mime?: string) => void;
  apiPost: (endpoint: string, data: unknown) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}
