/**
 * @fileoverview Punto de Entrada Principal (Main Entry Point)
 * @description Inicializa los cimientos del ecosistema BUCA, incluyendo estilos globales,
 * registro de Service Workers (PWA) y el arranque coordinado del núcleo.
 * @version 5.2.0
 */

import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/shared/styles/main.scss';

import kernel from '@/core/kernel.js';
import { initUIBridge } from '@/shared/utils/ui-bridge.js';

/**
 * @function bootstrap
 * @description Función autoejecutable que orquestar el encendido de la aplicación.
 * Sigue una secuencia estricta: Puente de UI -> PWA -> Kernel Boot.
 */
(async function bootstrap() {
    try {
        // 1. Inicializar el puente de UI para compatibilidad global
        // Permite que funciones legacy accedan a la nueva arquitectura.
        initUIBridge();

        // 2. Registro de Service Worker (Capacidades PWA y Offline)
        if ('serviceWorker' in navigator) {
            _registerServiceWorker();
        }

        // 3. Lanzar el arranque del Núcleo (Kernel)
        // Se ejecuta una vez que el DOM está listo para manipulación.
        document.addEventListener('DOMContentLoaded', async () => {
            await kernel.boot();
        });

    } catch (error) {
        console.error('%c [Critical Error] ', 'background: red; color: white;', error);
    }
})();

/**
 * @private
 * @function _registerServiceWorker
 * @description Registra el controlador de Service Worker para habilitar la 
 * persistencia offline y la instalación como App nativa.
 */
function _registerServiceWorker() {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('[PWA] -> Controlador de servicio activo:', reg.scope);
            })
            .catch(err => {
                console.warn('[PWA] -> El registro del Service Worker falló:', err);
            });
    });
}
