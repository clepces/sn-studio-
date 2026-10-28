/**
 * Solaris Nexus Studio - Dashboard Types
 * Strict typing for enterprise workflow executions, task metrics, and audit logs
 */

export interface ExecutionItem {
  id?: string;
  exec_type: string;
  description: string;
  details?: string;
  result: string;
  created_at: string;
}

export interface DashboardInterface {
  init(): void;
  logExecution(execType: string, description: string, result: string, details?: string): void;
  applyDashboardSearch(): void;
  clearDashboardSearch(): void;
}
