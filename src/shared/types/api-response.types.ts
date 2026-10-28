/**
 * Esquema estándar de respuestas de la API REST de Solaris Nexus Studio.
 * Protocolo de Cero Stack Traces y tipado estricto (cero `any`).
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error_uuid: string;
  message: string;
  code?: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'critical';
  version: string;
  database: 'connected' | 'disconnected';
  engine_fs: 'valid' | 'invalid_path';
}
