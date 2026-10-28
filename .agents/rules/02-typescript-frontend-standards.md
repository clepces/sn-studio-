# ESTÁNDARES FRONTEND Y TYPESCRIPT 2026
**Módulo:** `src/frontend/`  
**Objetivo:** Eliminar deuda técnica, código legado en `window.*` y garantizar tipado estricto.

---

## 1. COMPILADOR Y CONFIGURACIÓN ESTRICTA
- **Target:** `ESNext` / `ES2025`
- **Strict Mode Activo:**
  - `"noImplicitAny": true` -> Cero `any` tolerados. Usar `unknown`, genéricos o interfaces tipadas.
  - `"noUncheckedIndexedAccess": true` -> Todo acceso por índice `arr[i]` o `obj[key]` debe ser verificado ante `undefined`.
  - `"strictNullChecks": true` -> Manejo exhaustivo de `null` y `undefined`.
  - `"noImplicitReturns": true` -> Toda rama de ejecución debe retornar explícitamente.

---

## 2. ELIMINACIÓN DE `window.*` Y COMUNICACIÓN REACTIVA
1. **Prohibido Contaminar el Ámbito Global:**
   - No registrar módulos, estados ni utilidades en el objeto global `window`.
   - La arquitectura de comunicación entre módulos es **100% Pub/Sub** mediante el Event Bus centralizado (`src/frontend/state/event-bus.ts`).
2. **Ciclo de Vida de Eventos:**
   - Todo listener registrado debe tener su método de desuscripción para prevenir fugas de memoria (`unsubscribe`).
   - Usar tipado estricto para eventos y sus payloads.

---

## 3. RELACIÓN ENTRE `src/frontend/` Y `public/assets/js/`
- `src/frontend/`: Fuente única de la verdad. Aquí se programa en TypeScript moderno.
- `public/assets/js/bundle.js`: Artefacto compilado generado exclusivamente por Vite / Esbuild (`npm run build:ts`).
- **Regla de Oro:** Todo script vanilla alojado en `public/assets/js/modules/` es código legado en proceso de migración y eliminación. Nunca debe añadirse código nuevo allí.
