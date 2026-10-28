# ESTÁNDARES DE DISEÑO SASS Y PROHIBICIÓN DE CSS EN LÍNEA
**Módulo:** `src/interface/scss/` & `src/frontend/templates/`  
**Objetivo:** Eliminar estilos en línea (`style="..."`), evitar colisiones de especificidad y consolidar la arquitectura 7-1 Neumórfica.

---

## 1. PROHIBICIÓN ABSOLUTA DE CSS EN LÍNEA
1. **Cero Atributos `style="..."`:**
   - Ninguna plantilla HTML en `src/frontend/templates/` debe contener estilos directos en etiquetas HTML.
   - Todo layout, espaciado, color o animación debe definirse mediante clases CSS estructuradas.
2. **Impacto de la Especificidad:**
   - Un atributo `style=""` posee una especificidad descomunal de `(1, 0, 0, 0)`, lo que destruye el sistema de temas dinámico y sobreescrituras limpias.

---

## 2. ARQUITECTURA SASS 7-1 Y BEM
1. **Metodología BEM Obligatoria:**
   - Bloque: `.c-entity-card`
   - Elemento: `.c-entity-card__header`
   - Modificador: `.c-entity-card--active`
2. **Organización en `src/interface/scss/`:**
   - `abstracts/`: Variables, tokens neumórficos, mixins y funciones.
   - `base/`: Reset y tipografía global.
   - `components/`: Componentes atómicos reutilizables (botones, modales, tarjetas, barras de progreso).
   - `layout/`: Grillas, sidebar, topbar y contenedores principales.
   - `pages/`: Modificadores de vistas específicas (Galaxy Forge, Entity Inspector, Translation Studio).
3. **Cero `!important`:**
   - Salvo utilidades de visibilidad extrema, está prohibido el uso de `!important`.
