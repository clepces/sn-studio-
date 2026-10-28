/**
 * Solaris Nexus Studio - SystemHealth Types
 * Strict typing for system telemetry, diagnostic reporting, and environment audit
 */

export interface SystemHealthData {
  phpVersion: string;
  appName: string;
  version: string;
  company: string;
  memoryUsageMb: number;
  database: string;
}

export interface SystemHealthInterface {
  init(): void;
  runAudit(): Promise<void>;
}
