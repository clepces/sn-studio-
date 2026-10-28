# Bus Central de Eventos y Ciclo de Vida Reactivo - Solaris Nexus Studio

## 1. Arquitectura Basada en Eventos (Pub/Sub)

Solaris Nexus Studio implementa un bus de eventos desacoplado en TypeScript (`src/frontend/state/event-bus.ts`) que garantiza la sincronización en tiempo real entre los submódulos de la aplicación sin acoplamiento directo entre vistas.

```text
[ Vistas / Módulos UI ]  ── emit(evento, datos) ──►  [ GlobalEventBus ]
                                                            │
                                                            ▼
                                                   [ Suscriptores / Store ]
                                                   (AppStore, Telemetry, UI)
```

---

## 2. Catálogo Canónico de Eventos

### 2.1 Eventos del Sistema y Entorno
* `system:ready`: Emitido cuando el cliente completa la verificación inicial de salud (`SystemApiClient.getHealth()`).
* `system:environment-loaded`: Emitido cuando los datos del juego, mods y telemetría de memoria se cargan desde `/api/system/environment`.
* `system:execution-logged`: Notifica que una nueva acción fue registrada en el historial.

### 2.2 Eventos de Localización y Cadenas (.str)
* `project:selected`: Emitido al cambiar el proyecto activo en el espacio de trabajo. Carga las cadenas asociadas en la tabla virtual y sincroniza la subpestaña de telemetría.
* `project:created`: Notifica la creación de un nuevo proyecto `.str`.
* `project:deleted`: Notifica la eliminación de un proyecto, disparando la actualización del workspace y los empty states correspondientes.
* `string:saved`: Emitido cuando una traducción individual es guardada en el backend.
* `string:validated`: Notifica el resultado del análisis sintáctico de **Token Guard**.

### 2.3 Eventos de VFS y Mods
* `mods:hierarchy-updated`: Emitido al reorganizar el orden de carga en `EnabledMods.txt`.
* `minimod:toggled`: Notifica la activación o desactivación del parche de localización P999.
* `ram-budget:calculated`: Notifica la actualización del presupuesto de memoria virtual LAA (límite de 3.250 MB).

### 2.4 Eventos de Interfaz y Navegación
* `view:switched`: Emitido al alternar entre las 12 vistas maestras (`dashboard`, `studio`, `translation`, `mods`, etc.).
* `sidebar:toggled`: Notifica el colapso o expansión del menú lateral.
* `theme:changed`: Notifica el cambio de modo de color (`light`, `dark`) o tema de superficie (`base`, `neumorphism`, `glassmorphism`).

---

## 3. Ejemplo de Uso en TypeScript

```typescript
import { GlobalEventBus } from '@/state/event-bus';

// Suscripción
const unsubscribe = GlobalEventBus.on('project:selected', (project) => {
  console.info(`Proyecto activo cambiado a: ${project.name}`);
  updateTelemetryView(project);
});

// Emisión
GlobalEventBus.emit('project:selected', {
  project_id: 'sins-rebellion-core',
  name: 'Sins Base Rebellion English.str',
  total_strings: 7828
});

// Cancelación de suscripción
// unsubscribe();
```
