import type { ApiResponse } from '@shared/types/api-response.types';

export class BaseApiClient {
  protected static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    const body = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !body.success) {
      const errPayload = body as { message?: string; error_uuid?: string };
      throw new Error(`[${errPayload.error_uuid ?? 'HTTP_ERR'}] ${errPayload.message ?? 'Fallo en la petición REST'}`);
    }

    return body.data;
  }
}
