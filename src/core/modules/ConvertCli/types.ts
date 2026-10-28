/**
 * Solaris Nexus Studio - ConvertCli Types
 * Strict typing for ConvertData_Rebellion.exe pipeline & binary conversions
 */

export interface ConvertOptions {
  resource_type: string;
  direction: string;
  file_path: string;
}

export interface ConvertResult {
  mode: string;
  outputPath: string;
  checksum: string;
}

export interface ConvertCliInterface {
  init(): void;
  run(): Promise<void>;
}
