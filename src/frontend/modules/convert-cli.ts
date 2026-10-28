/**
 * Solaris Nexus Studio - ConvertCli Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class ConvertCliModule {
  public async run(): Promise<void> {
    const type = (document.getElementById('convert-resource-type') as HTMLSelectElement | null)?.value || 'entity';
    const direction = (document.getElementById('convert-direction') as HTMLSelectElement | null)?.value || 'bin_to_txt';
    const filePath = (document.getElementById('convert-file-path') as HTMLInputElement | null)?.value || 'tests/fixtures/sample_demo.entity';
    const resultBox = document.getElementById('convert-result-box');

    if (!resultBox) return;

    resultBox.classList.add('active');
    resultBox.innerHTML = `
      <div class="cli-output-log">
        > Inicializando ConvertData_Rebellion.exe...<br>
        > Modo: ${direction} | Tipo: ${type}<br>
        > Ruta objetivo: ${filePath}
      </div>
    `;

    const res = await GlobalNexusCore.apiPost('engine/convert', {
      resource_type: type,
      direction: direction,
      file_path: filePath
    });

    if (res && res.success && res.data) {
      window.DashboardHandler?.logExecution('CLI', `Conversión ${direction} (${type}): ${filePath}`, 'DirectX OK');
      resultBox.innerHTML = `
        <div class="cli-output-success">✓ CONVERSIÓN COMPLETADA EXITOSAMENTE (${res.data.mode})</div>
        <div class="cli-output-meta">
          <div><strong>Ruta de Salida:</strong> ${res.data.outputPath}</div>
          <div class="cli-output-checksum"><strong>Checksum SHA-256:</strong> <span class="checksum-hash">${res.data.checksum}</span></div>
          <div class="cli-output-sub">DirectX 9 Vertex & String Alignment OK.</div>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="cli-output-error">✗ ERROR EN PIPELINE DE CONVERSIÓN</div>
        <div class="cli-output-sub">${res?.message || 'Error de procesamiento en subproceso proc_open.'}</div>
      `;
    }
  }

  public init(): void {
    document.getElementById('btn-run-cli-main')?.addEventListener('click', () => this.run());
  }
}

export const GlobalConvertCli = new ConvertCliModule();

declare global {
  interface Window {
    ConvertCliModule: ConvertCliModule;
  }
}

if (typeof window !== 'undefined') {
  window.ConvertCliModule = GlobalConvertCli;
}
