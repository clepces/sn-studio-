# Catálogo de Componentes UI - Solaris Nexus Studio

## 1. Principio de Componentes Modulares
Los componentes de interfaz en Solaris Nexus Studio están diseñados para ser declarativos, reutilizables y accesibles, desacoplando la capa de presentación de la lógica de negocio.

---

## 2. Catálogo de Componentes

### 2.1 Componente de Estado Vacío (`EmptyStateComponent`)
* **Ubicación:** `src/frontend/components/empty-state.component.ts`
* **Propósito:** Mostrar una interfaz guiada cuando una colección no contiene elementos (sin proyectos, sin resultados de búsqueda, sin mods activos).
* **Propiedades:** `icon`, `title`, `description`, `actionLabel`, `actionCallback`.

### 2.2 Componente Modal Accesible (`ModalComponent`)
* **Ubicación:** `src/frontend/components/modal.component.ts`
* **Propósito:** Ventana emergente con desenfoque de fondo (*backdrop blur*), soporte de tecla `Escape`, trampa de foco y limpieza automática de temporizadores e intervalos para prevenir fugas de memoria.
* **Variantes:**
  - `modal-str-project-settings`: Ajustes y metadatos de diccionario `.str`.
  - `modal-str-create-project`: Formulario de creación de proyectos canónicos.
  - `modal-str-delete-confirm`: Confirmación crítica con distinción entre borrado digital y físico.
  - `edit-modal`: Editor modal de cadenas con validación en tiempo real por Token Guard.

### 2.3 Carrusel Horizontal de Pestañas (`TabCarouselComponent`)
* **Ubicación:** `src/frontend/components/tab-carousel.component.ts`
* **Propósito:** Agrupación horizontal de subpestañas con desplazamiento suave y botones de navegación izquierda/derecha.
* **Integración:** Utilizado en el estudio de traducción para alternar entre *Workspace*, *Editor en Vivo*, *Telemetría*, *Memoria de Traducción* y *Agentes de IA*.

### 2.4 Tarjeta de Telemetría Hero (`TelemetryCardComponent`)
* **Ubicación:** `src/frontend/components/telemetry-card.component.ts`
* **Propósito:** Renderizar indicadores visuales de salud de motor, memoria RAM utilizada, recuento de cadenas y estado de conexión relacional.
* **Estados:** `status-optimal` (verde), `status-warning` (ámbar), `status-critical` (rojo).

### 2.5 Paginación Virtual y Virtual Scroll
* **Ubicación:** `src/frontend/components/pagination.component.ts`
* **Propósito:** Navegación fluida por listas de más de 7.000 cadenas léxicas sin sobrecargar el árbol de renderizado del navegador.
