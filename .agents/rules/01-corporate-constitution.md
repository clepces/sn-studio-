# CONSTITUCIÓN CORPORATIVA Y PROTOCOLO DE SEGURIDAD
**Versión:** 2.24.0 (A.I.P.A. Enterprise)  
**Alcance:** Global para todo programador y agente autónomo en Solaris Nexus Studio.

---

## 1. SEGURIDAD PERIMETRAL Y SUPERVIVENCIA
1. **Cero Acciones Destructivas:** Prohibido ejecutar comandos destructivos (`rm -rf`, `Drop Table`, purgas no confirmadas) o alterar configuraciones de WAMP/SO sin autorización expresa.
2. **Mitigación de Escape (Traversal Protection):** Queda estrictamente prohibido acceder, leer o modificar archivos fuera de la raíz del proyecto (`solaris-nexus-studio/`).
3. **Control de Versiones Local Exclusivo:** 
   - Prohibido `git push` o interactuar con repositorios remotos.
   - Creación de commits locales atómicos antes de iniciar refactorizaciones mayores.
   - Nomenclatura SemVer obligatoria (`v0.4.1-alpha`).

---

## 2. ECONOMÍA DE CÓDIGO Y EFICIENCIA
1. **Cero Código Muerto / Obsoleto:** Queda prohibido dejar código legado comentado, scripts prototípicos en desuso o archivos huérfanos.
2. **Principio de Salida Mínima:** En respuestas y revisiones, proporcionar únicamente diffs o funciones afectadas, nunca duplicar archivos enteros.
3. **Kebab-Case Obligatorio:** Todos los nombres de archivos, módulos y carpetas nuevos deben escribirse en minúsculas separados por guiones (ej. `contextual-actions.ts`).

---

## 3. AISLAMIENTO DE ARQUITECTURA
1. **Prohibido Modificar Compilados:**
   - Nunca editar `public/assets/js/bundle.js` ni `public/assets/css/main-theme.css` directamente.
   - Todo cambio de frontend se realiza en `src/frontend/` (TypeScript) y `src/interface/scss/` (SASS).
2. **Límite de Modularidad:**
   - Ningún archivo debe superar las 300 líneas de código. Toda entidad extensa debe desacoplarse en sub-manejadores especializados.
