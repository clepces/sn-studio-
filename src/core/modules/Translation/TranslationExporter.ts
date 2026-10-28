import type { StrEntryState, StrProject } from '../../../frontend/types/translation.types';
import { TranslationValidator } from './TranslationValidator';
import { ToastNotification } from '../../engine/ui/toast.component';

export class TranslationExporter {
  private validator = new TranslationValidator();

  exportStr(allEntries: StrEntryState[], currentProject: StrProject | null): void {
    if (!allEntries || allEntries.length === 0) {
      ToastNotification.warning('No hay cadenas para exportar.');
      return;
    }

    const lines: string[] = [];
    lines.push('\uFEFFStringInfo');
    lines.push('{');
    lines.push(`\tNumStrings ${allEntries.length}`);

    allEntries.forEach((item: StrEntryState) => {
      lines.push('\tString');
      lines.push('\t{');
      lines.push(`\t\tStringID "${item.id}"`);
      const val = (item.translated && item.translated.trim() !== '') ? item.translated : item.original;
      lines.push(`\t\tValue "${val}"`);
      lines.push('\t}');
    });

    lines.push('}');
    lines.push('');

    const content = lines.join('\r\n');
    const filename = currentProject ? (currentProject.name.replace(/\s+/g, '_') + '.str') : 'English.str';
    this.downloadBlob(content, filename, 'text/plain;charset=utf-8');
  }

  downloadBlob(content: string, filename: string, mime = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  async apiPost(endpoint: string, data: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json() as { success: boolean; data?: unknown; error?: string };
    } catch (err) {
      console.warn(`[TranslationExporter] Error en apiPost (${endpoint}):`, err);
      return { success: false, error: String(err) };
    }
  }

  parseStrFileContent(content: string): StrEntryState[] {
    const lines = content.split(/\r?\n/);
    let currentId = '';
    const parsedEntries: StrEntryState[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      const idMatch = line.match(/^StringID\s+"(.*)"$/i);
      if (idMatch && idMatch[1]) {
        currentId = idMatch[1];
        continue;
      }

      const valMatch = line.match(/^Value\s+"(.*)"$/i);
      if (valMatch && currentId && valMatch[1] !== undefined) {
        const val = valMatch[1];
        parsedEntries.push({
          id: currentId,
          original: val,
          translated: '',
          tokens: this.validator.extractTokens(val),
          status: 'UNTRANSLATED',
          entryId: parsedEntries.length + 1,
          index: parsedEntries.length
        });
        currentId = '';
      }
    }

    return parsedEntries;
  }
}
