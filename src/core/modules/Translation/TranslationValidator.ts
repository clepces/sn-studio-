import type { AuditFileResult, TokenValidationResult, StrEntryState } from '../../../frontend/types/translation.types';

export class TranslationValidator {
  /**
   * Audits a .str file for NumStrings header accuracy, token preservation, and BOM presence.
   */
  async auditFile(filePath: string): Promise<AuditFileResult> {
    try {
      const res = await fetch('/api/strings/audit-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      return await res.json() as AuditFileResult;
    } catch (err) {
      console.warn('[TranslationValidator] Error al verificar archivo:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Extracts token variables like [VALUE], %s, {0}, etc.
   */
  extractTokens(text: string): string[] {
    if (!text) return [];
    const tokens: string[] = [];
    const valueRegex = /\[[A-Za-z0-9_]+\]/g;
    const printfRegex = /%[0-9]*[sdif]/g;
    const braceRegex = /\{[0-9]+\}/g;

    let m: RegExpExecArray | null;
    while ((m = valueRegex.exec(text)) !== null) {
      if (!tokens.includes(m[0])) tokens.push(m[0]);
    }
    while ((m = printfRegex.exec(text)) !== null) {
      if (!tokens.includes(m[0])) tokens.push(m[0]);
    }
    while ((m = braceRegex.exec(text)) !== null) {
      if (!tokens.includes(m[0])) tokens.push(m[0]);
    }
    return tokens;
  }

  /**
   * Validates that all tokens in the original string are preserved in the translated string.
   */
  validateTokenSyntax(orig: string, trans: string): TokenValidationResult {
    const origTokens = this.extractTokens(orig);
    const transTokens = this.extractTokens(trans);

    const missing = origTokens.filter(t => !trans.includes(t));
    const extra = transTokens.filter(t => !origTokens.includes(t));

    return {
      valid: missing.length === 0 && extra.length === 0,
      missing,
      extra
    };
  }

  /**
   * Parses .STR syntax into structured StrEntryState items.
   */
  parseStrContent(content: string): { entries: StrEntryState[] } {
    const entries: StrEntryState[] = [];
    const lines = content.split(/\r?\n/);
    let curId = '';
    let curVal = '';
    let idx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      if (line.startsWith('StringID')) {
        const match = line.match(/StringID\s+"(.*)"/);
        if (match && match[1] !== undefined) curId = match[1];
      } else if (line.startsWith('Value')) {
        const match = line.match(/Value\s+"(.*)"/);
        if (match && match[1] !== undefined) curVal = match[1];
      } else if (line === '}' && curId) {
        entries.push({
          id: curId,
          original: curVal,
          translated: '',
          tokens: this.extractTokens(curVal),
          status: 'UNTRANSLATED',
          index: idx++
        });
        curId = '';
        curVal = '';
      }
    }
    return { entries };
  }
}
