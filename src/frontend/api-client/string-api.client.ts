import { BaseApiClient } from './base-api.client';
import type { LocalizationFileAst, StringDiffEntry } from '@shared/types/localization.types';

export class StringApiClient extends BaseApiClient {
  public static async parseStrFile(content: string): Promise<LocalizationFileAst> {
    return this.request<LocalizationFileAst>('api/strings/parse', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  public static async validateEntry(payload: { original: string; translated: string }): Promise<StringDiffEntry> {
    return this.request<StringDiffEntry>('api/strings/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async exportStrFile(entries: readonly { id: string; value: string }[]): Promise<{ downloadUrl: string; bytes: number }> {
    return this.request<{ downloadUrl: string; bytes: number }>('api/strings/export', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  }
}
