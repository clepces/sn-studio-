# Diseño de Interfaz, Temas y Arquitectura SASS (7-1) - Solaris Nexus Studio

## 1. Filosofía Visual y Estética Reagle

Solaris Nexus Studio implementa un lenguaje visual denominado **Reagle Theme**, caracterizado por una distribución espacial inspirada en estaciones de trabajo aeroespaciales de alta densidad con:
* **Dock Lateral Flotante:** Acceso rápido y conmutación entre módulos sin recargar la página.
* **Barra Lateral Colapsable:** Con árbol de navegación por directorios y selección de módulos.
* **Espacio de Trabajo Reactivo:** Área central de alto contraste con tarjetas neumórficas, indicadores de salud y carruseles de subpestañas segmentadas.

---

## 2. Arquitectura de Hojas de Estilo SASS 7-1

El código de estilos se encuentra estructurado en `src/interface/scss/` bajo el estándar 7-1:

```text
src/interface/scss/
├── abstracts/
│   ├── _functions.scss     # Funciones matemáticas de escala y color
│   ├── _mixins.scss        # Mixins de flexbox, sombras y efectos de vidrio
│   └── _variables.scss     # Tokens de diseño, tipografías y paletas
├── base/
│   ├── _animations.scss    # Transiciones y keyframes (@keyframes paneFadeSlideIn)
│   ├── _reset.scss         # Reseteo CSS consistente
│   ├── _scrollbar.scss     # Barras de desplazamiento estilizadas
│   ├── _typography.scss    # Jerarquía tipográfica e importación de fuentes
│   └── _utilities.scss     # Clases de apoyo (.u-hidden, .u-truncate, etc.)
├── components/
│   ├── _buttons.scss       # Botones de acción, variantes primarias y destructivas
│   ├── _cards.scss         # Tarjetas de datos y paneles
│   ├── _datatable-virtual.scss # Tabla de renderizado virtual de alto rendimiento
│   ├── _empty-state.scss   # Estados vacíos universales guiados
│   ├── _inputs.scss        # Campos de texto, áreas de texto y selectores
│   ├── _metrics.scss       # Tarjetas métricas hero y badges de estado
│   ├── _modals.scss        # Modales de confirmación, ajustes y edición
│   ├── _pagination.scss    # Paginadores compactos
│   ├── _progress.scss      # Barras de progreso de memoria y tareas
│   ├── _tabs-carousel.scss # Carruseles de subpestañas con navegación prev/next
│   └── _tabs-nav.scss      # Pestañas segmentadas
├── layout/
│   ├── _dock.scss          # Cápsula de navegación flotante izquierda
│   ├── _grid.scss          # Cuadrículas de diseño responsivo
│   ├── _header.scss        # Encabezado contextual dinámico
│   ├── _sidebar.scss       # Menú lateral colapsable con persistencia de estado
│   ├── _window.scss        # Ventana contenedora principal
│   └── _workspace.scss     # Contenedor del área de trabajo
├── modes/
│   ├── _dark.scss          # Variables y contrastes para modo oscuro
│   ├── _index.scss         # Exportación de modos
│   └── _light.scss         # Variables y contrastes para modo claro
├── pages/                  # Estilos específicos de cada una de las 12 vistas
│   ├── _convert.scss
│   ├── _dashboard.scss
│   ├── _entities.scss
│   ├── _galaxy.scss
│   ├── _mods.scss
│   ├── _network.scss
│   ├── _pipeline.scss
│   ├── _studio.scss
│   ├── _swarm.scss
│   ├── _system.scss
│   ├── _translation.scss
│   └── _vault.scss
├── themes/
│   ├── _base.scss          # Tema limpio estándar
│   ├── _index.scss         # Conmutador de temas
│   ├── _theme-glassmorphism.scss # Superficies con desenfoque translúcido (backdrop-filter)
│   └── _theme-neumorphism.scss   # Relieves de doble sombra extruida (soft-ui)
└── main.scss               # Entrada central que compila a public/assets/css/main-theme.css
```

---

## 3. Modos y Temas Dinámicos

La aplicación soporta la combinación independiente de dos atributos en el elemento raíz `<html>`:
* `data-mode`: `"light"` | `"dark"`
* `data-theme`: `"base"` | `"neumorphism"` | `"glassmorphism"`

Ambos estados se guardan automáticamente en `localStorage` (`solaris_color_mode` y `solaris_surface_theme`) para persistir la preferencia visual del usuario entre recargas de página.
