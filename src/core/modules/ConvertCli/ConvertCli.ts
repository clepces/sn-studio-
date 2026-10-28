/**
 * Solaris Nexus Studio - ConvertCli Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { ToastNotification } from '../../engine/ui/toast.component';
import type { ConvertOptions, ConvertResult, ConvertCliInterface } from './types';

export class ConvertCli implements ConvertCliInterface {
  public async run(): Promise<void> {
    const type = (document.getElementById('convert-resource-type') as HTMLSelectElement | null)?.value || 'entity';
    const direction = (document.getElementById('convert-direction') as HTMLSelectElement | null)?.value || 'bin_to_txt';
    const filePath = (document.getElementById('convert-file-path') as HTMLInputElement | null)?.value || 'tests/fixtures/sample_demo.entity';
    const resultBox = document.getElementById('convert-result-box');

    if (!resultBox) return;

    resultBox.classList.add('active');
    resultBox.innerHTML = `
      <div class="cli-output-log">
        &gt; Inicializando ConvertData_Rebellion.exe...<br>
        &gt; Modo: ${direction} | Tipo: ${type}<br>
        &gt; Ruta objetivo: ${filePath}
      </div>
    `;

    try {
      const payload: ConvertOptions = {
        resource_type: type,
        direction: direction,
        file_path: filePath
      };

      const res = await GlobalNexusCore.apiPost('engine/convert', payload) as {
        success: boolean;
        message?: string;
        data?: ConvertResult;
      };

      if (res && res.success && res.data) {
        GlobalEventHub.publish('execution:log', {
          module: 'CLI',
          message: `Conversión ${direction} (${type}): ${filePath}`,
          status: 'DirectX OK'
        });

        resultBox.innerHTML = `
          <div class="cli-output-success">✓ CONVERSIÓN COMPLETADA EXITOSAMENTE (${res.data.mode})</div>
          <div class="cli-output-meta">
            <div><strong>Ruta de Salida:</strong> ${res.data.outputPath}</div>
            <div class="cli-output-checksum"><strong>Checksum SHA-256:</strong> <span class="checksum-hash">${res.data.checksum}</span></div>
            <div class="cli-output-sub">DirectX 9 Vertex & String Alignment OK.</div>
          </div>
        `;

        ToastNotification.success(`Conversión ${direction} completada exitosamente.`);
      } else {
        resultBox.innerHTML = `
          <div class="cli-output-error">✗ ERROR EN PIPELINE DE CONVERSIÓN</div>
          <div class="cli-output-sub">${res?.message || 'Error de procesamiento en subproceso proc_open.'}</div>
        `;
        ToastNotification.error(res?.message || 'Error en pipeline de conversión.');
      }
    } catch (err) {
      console.warn('[ConvertCli] Error durante la ejecución:', err);
      ToastNotification.error('Fallo en el pipeline de conversión.');
    }
  }

  public init(): void {
    document.getElementById('btn-run-cli-main')?.addEventListener('click', () => this.run());
    GlobalEventHub.subscribe('convert:run', () => this.run());
  }
}

export const GlobalConvertCli = new ConvertCli();

declare global {
  interface Window {
    ConvertCliModule?: ConvertCli;
  }
}

if (typeof window !== 'undefined') {
  window.ConvertCliModule = GlobalConvertCli;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalConvertCli.init());
  } else {
    setTimeout(() => GlobalConvertCli.init(), 20);
  }
}
