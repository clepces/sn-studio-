# Plan de Implementación: Migración a Arquitectura Kernel/Engine

## Visión Arquitectónica
Transformar Solaris Nexus Studio en un sistema modular donde el `Kernel` orquesta la lógica y el `Engine` gestiona la experiencia de usuario (UI/UX/IXD).

## Fases de Implementación

### Fase 1: Kernelización e Infraestructura
- [ ] Crear estructura `/src/core` y `/src/core/engine`.
- [ ] Implementar `/src/core/kernel.ts` (Orquestador principal).
- [ ] Migrar lógica de inicialización (DOM, EventBus, Stores) al `Kernel`.
- [ ] Eliminar dependencias directas de `window` en el arranque.

### Fase 2: Extracción del Motor (Engine)
- [ ] Mover componentes de UI a `/src/core/engine/ui/`.
- [ ] Mover lógica de interacción a `/src/core/engine/interaction/`.
- [ ] Definir interfaces tipadas estrictas para el Engine (sin `any`).
- [ ] Desacoplar el Engine de la lógica de API (debe comunicarse vía Kernel).

### Fase 3: IXD y Puente de Interacción
- [ ] Establecer el protocolo de comunicación `Kernel` <-> `Engine` (Eventos).
- [ ] Refactorizar `view-navigator` para que sea gestionado por el Engine bajo órdenes del Kernel.
- [ ] Implementar manejo centralizado de estados visuales.

### Fase 4: Optimización y Estabilización
- [ ] Eliminación sistemática de `any` y `window.*`.
- [ ] Auditoría de seguridad de tipos y rutas (Path Traversal guard).
- [ ] Verificación de rendimiento y carga de recursos.
