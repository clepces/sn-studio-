import type { Response } from 'express';
import crypto from 'node:crypto';

/**
 * Standard API response wrapper
 */
export function jsonEnvelope(res: Response, data: any, status = 200): void {
  res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard API error wrapper
 */
export function errorEnvelope(res: Response, message: string, status = 400): void {
  res.status(status).json({
    success: false,
    message,
    error_uuid: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
}
