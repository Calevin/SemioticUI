# Constitución del Proyecto — Semiotic UI (`semiotic-ui`)

> **Ley Suprema (`seb-harness`):** Este documento define los principios innegociables del proyecto. Toda especificación (`*_spec.md`), plan (`*_plan.md`), verificador (`*_verificador.md`) e implementación debe cumplirlos estrictamente.
>
> **Origen:** Consolidado a partir de `prompt_de_inicializaci_n_semiotic_ui.md` (prompt fundacional), `AGENTS.pre-seb.md` (constitución técnica previa) y el código existente en `src/`, `docs/`, `vite.config.js` y `flake.nix`.

## A. Naturaleza del Proyecto

- **Propósito y Misión:** UI Kit / Design System personal de estilo Neo-Brutalista industrial inspirado en el *Semiotic Standard* de Ron Cobb (Nostromo): alto contraste, bordes sólidos, sombras duras sin difuminado, geometría ortogonal, tipografía monoespaciada y etiquetas técnicas codificadas. Su valor es ofrecer **un único código fuente** consumible sin fricción desde cualquier stack web.
- **Usuarios / Consumidores:**
  1. Aplicaciones con bundler (React, Astro, Vite) vía paquete npm / GitHub Packages (`dist/semiotic-ui.es.js` + `dist/semiotic-ui.css`).
  2. Aplicaciones renderizadas en servidor (Java Thymeleaf, HTMX, HTML plano) vía `<script>` y `<link>` clásicos servidos por CDN (`dist/semiotic-ui.umd.js` + `dist/semiotic-ui.css`).
  3. Desarrolladores que consultan el sitio de documentación Astro (`/docs`).
- **Tipo de Sistema y Alcance:** Librería frontend de distribución dual (ESM + UMD + CSS unificado) más un sitio de documentación estático. Fuera de alcance: lógica de servidor, persistencia, wrappers específicos de framework (React/Vue/Angular) dentro del core, y estilos utilitarios tipo Tailwind.

## B. Stack Tecnológico (Reglas de Implementación)

- **Lenguaje y Runtime:** JavaScript ES2022+ (ES Modules, `"type": "module"`), CSS moderno (`@layer`, Custom Properties, container queries). Runtime de desarrollo: Node.js 22 provisto por `flake.nix` (`nix develop` / `direnv` con `.envrc`) sobre NixOS. Navegadores objetivo: características *Baseline Widely Available*; APIs más recientes (`ElementInternals` ARIA mixin, `CustomStateSet`, etc.) solo con degradación elegante.
- **Frameworks y Librerías Core:**
  - **Runtime de la librería (`src/`): cero dependencias.** Solo APIs nativas (`HTMLElement`, `customElements`, Shadow DOM, `CustomEvent`, `ElementInternals`).
  - **Build:** Vite (`^6.3.5`) en *Library Mode* (`vite.config.js`), formatos `es` y `umd`, CSS unificado (`cssCodeSplit: false`), minificación `esbuild`, sourcemaps activos.
  - **Documentación:** Astro (`^5.7.0`) como workspace npm `docs`, que consume `src/index.js` mediante alias `semiotic-ui` en `docs/astro.config.mjs`.
- **Persistencia e Infraestructura:** No aplica. Artefactos de salida: `dist/semiotic-ui.es.js`, `dist/semiotic-ui.umd.js`, `dist/semiotic-ui.css` (+ `.map`) y `docs/dist/`. Ambos directorios son generados y están en `.gitignore`.
- **Comandos Oficiales de Verificación Programática:**
  - **Instalación:** `npm install` (raíz; instala también el workspace `docs`).
  - **Compilación / Build de la librería:** `npm run build`
  - **Compilación del sitio de documentación:** `npm run docs:build`
  - **Tests Unitarios / Integración:** *No existe suite de tests a la fecha.* Hasta que una spec dedicada introduzca un runner aprobado, los verificadores deben usar comandos deterministas sobre los artefactos (ej. `test -f dist/semiotic-ui.umd.js`, `grep -q 'semiotic-alert' dist/semiotic-ui.es.js`, scripts `node -e` / `node --test` sin dependencias que importen `dist/semiotic-ui.es.js` o `src/index.js` en Node y verifiquen la ausencia de `ReferenceError`).
  - **Linter / Análisis Estático:** *No configurado a la fecha.* `npm --workspace=docs run check` (`astro check`) requiere `@astrojs/check` y `typescript`, que no están instalados; no puede usarse como verificación hasta que una spec apruebe esas dependencias.
- **Prohibiciones de Stack:**
  - Prohibido añadir nuevas dependencias externas (runtime o dev) sin aprobación explícita en la spec/plan.
  - Prohibido añadir **cualquier** dependencia de runtime a la librería core (`dependencies` del `package.json` raíz debe permanecer vacío o ausente).
  - Prohibido usar React, Vue, Lit, Stencil, Tailwind u otro framework/motor de utilidades dentro de `src/`.
  - Prohibido reemplazar Vite o Astro por alternativas equivalentes.

## C. Reglas de Dominio y Lógica de Negocio

- **Invariantes del Dominio (Lenguaje Visual Semiotic Standard):**
  - **Radios:** `--sm-radius: 0px` en todos los contenedores, botones y controles. Geometría estrictamente ortogonal.
  - **Bordes:** sólidos; `--sm-border-width: 2px` estándar, `--sm-border-width-heavy: 3px` para paneles estructurales y franjas de acento laterales de `6px`–`8px` en alertas/paneles. Prohibidos bordes difusos y gradientes decorativos.
  - **Sombras:** duras, desplazamiento sólido y `blur` igual a `0` (`--sm-shadow-sm|md|lg` = `2px|4px|6px` sobre `--sm-border-color`). Prohibidas sombras con difuminado.
  - **Tipografía:** `--sm-font-mono` obligatoria en encabezados, botones, badges, códigos y etiquetas de estado (normalmente `uppercase`, `letter-spacing` `0.04em`–`0.08em`); `--sm-font-sans` para cuerpo de texto.
  - **Paleta:** Tier 1 literal (`--sm-palette-*`: ivory, carbon, amber, red, green, cyan) y Tier 2 semántico (`--sm-bg-*`, `--sm-text-*`, `--sm-color-{info|success|warning|danger}[-hover|-surface]`). Los componentes consumen **solo** tokens Tier 2, nunca valores hex directos (excepto fallbacks dentro de `var(..., fallback)` en Shadow DOM).
  - **Estados semánticos fijos:** `info` (cian telemetría), `success` (verde nominal), `warning` (ámbar industrial), `danger` (rojo emergencia). No se añaden variantes sin spec.
  - **Etiquetas técnicas:** códigos identificadores cortos (`.sm-code-tag` o atributo `code="..."`, ej. `SEC-04`, `WARN-702`) como anclas visuales.
  - **Tema oscuro:** activable con `[data-sm-theme="dark"]` o `.sm-theme-dark`, redefiniendo exclusivamente tokens Tier 2.
- **Fronteras de Datos y Consistencia (Contrato Público y Compatibilidad):**
  - La API pública está formada por: nombres de tokens `--sm-*`, clases `.sm-*`, etiquetas `<semiotic-*>`, sus atributos, eventos `sm-*`, partes `::part(...)`, y las exportaciones de `src/index.js` (`registerAll`, clases `Semiotic*`, funciones `registerSemiotic*`). Renombrar o eliminar cualquiera de ellos es un cambio incompatible y requiere spec explícita con bump de versión mayor (SemVer).
  - Los nombres de artefactos de `dist/` (`semiotic-ui.es.js`, `semiotic-ui.umd.js`, `semiotic-ui.css`) y el global UMD `SemioticUI` son contrato estable.
  - Todo CSS público vive dentro del orden de capas `@layer sm.reset, sm.tokens, sm.base, sm.components;` para no competir en especificidad con el consumidor.
- **Aislamiento de Lógica:**
  - **CSS-First:** componentes sin estado ni eventos complejos (botones, tarjetas, badges, inputs, alertas estáticas) se resuelven exclusivamente con CSS y clases `.sm-*` sobre elementos HTML nativos. Prohibido envolverlos en Custom Elements.
  - **Web Components** solo para comportamiento interactivo, configurables mediante atributos HTML primitivos (strings y booleanos por presencia) compatibles con `th:attr` (Thymeleaf) y `hx-*` (HTMX).
  - **SSR-safety:** importar `src/index.js` o `dist/semiotic-ui.es.js` en Node/Astro SSR no debe lanzar `ReferenceError`. Prohibido referenciar `window`, `document` o `HTMLElement` a nivel de módulo sin guardas (`typeof HTMLElement !== 'undefined'`); las plantillas se construyen de forma perezosa.
  - **Upgrade sobre HTML SSR:** `connectedCallback` idempotente (HTMX o `moveBefore` pueden reubicar nodos) que lee atributos y slots ya renderizados por el servidor.
  - **Registro:** cada componente expone `registerSemiotic<Nombre>()` que verifica `customElements.get(...)` antes de `define` (idempotente). `src/index.js` auto-registra solo si existen `window` y `customElements`.

## D. Estructura y Estilo de Código

- **Topología de Directorios:**
  - `src/css/` — `tokens.css` (capas y tokens), `base.css` (reset mínimo), hojas de componentes sin estado (`buttons.css`, `cards.css`; previstos `badges.css`, `forms.css`).
  - `src/components/` — Web Components Vanilla JS, un archivo por componente: `semiotic-<nombre>.js`.
  - `src/index.js` — punto de entrada: importa todas las hojas CSS, exporta clases y funciones de registro, define `registerAll()`.
  - `docs/` — workspace Astro: `src/layouts/`, `src/pages/` (demos en vivo y snippets HTML/Thymeleaf/HTMX y React/Astro); `docs/use-cases/` reservado a `seb-documentador`.
  - `dist/` — salida generada por Vite (no versionada).
  - `specs/` — artefactos SDD (`<NNN>_<tarea>_{spec,plan,verificador}.md`).
  - `flake.nix`, `.envrc` — entorno reproducible NixOS.
- **Patrones Arquitectónicos:** Design System de dos niveles de tokens (paleta literal -> semántico); cascada por `@layer`; Web Components con Shadow DOM abierto (`attachShadow({ mode: 'open' })`), theming por Custom Properties heredables `--sm-*` y `::part(...)`, accesibilidad por `ElementInternals` con fallback a atributos ARIA; reflexión atributo/propiedad vía `observedAttributes`.
- **Convenciones de Nomenclatura e Idioma:**
  - Tokens públicos: `--sm-*`; alias internos de componente / Shadow DOM: `--_*`.
  - Clases: `.sm-<bloque>`, subelementos `.sm-<bloque>-<elemento>` (guion simple), modificadores `.sm-<bloque>--<modificador>` (doble guion).
  - Custom Elements: `<semiotic-<nombre>>` (kebab-case); clases JS `Semiotic<Nombre>` (PascalCase); eventos `sm-<accion>` (ej. `sm-dismiss`, `sm-show`).
  - Sintaxis, nombres de archivo, variables, clases y literales en **inglés**; comentarios dentro del código estrictamente en **español**; documentación del repositorio y specs en español.
  - **Prohibido el uso de emojis** en cualquier archivo o bloque de código.
- **Prohibiciones de Diseño:**
  - Prohibidas reglas sobre el selector universal `*` en `base.css`; usar `:where(...)` sobre selectores explícitos.
  - Prohibido `:host-context()` (sin soporte en Firefox/Safari).
  - Prohibido recrear controles nativos con `<div>`; todo `<button>`/control en Shadow DOM declara `font: inherit; color: inherit;`.
  - Todo Web Component define `:host([hidden]) { display: none; }`.
  - Estados de interacción sin depender del orden de reglas: `:hover:not(:disabled, [aria-disabled='true'])`.
  - Prohibido configurar un Web Component **únicamente** mediante JSON en atributos o propiedades JS.
  - Prohibido estado global mutable compartido entre instancias, salvo cachés inmutables de plantillas.
- **Flujo Obligatorio de Creación de Componentes:** (1) implementar en `src/` (CSS en `@layer sm.components` o Web Component en `src/components/semiotic-<nombre>.js`); (2) importar/exportar en `src/index.js` e incluir su registro en `registerAll()`; (3) documentar demo interactiva y snippets HTML/Thymeleaf/HTMX y React/Astro en `docs/src/pages/`; (4) verificar `npm run build` y `npm run docs:build` sin errores y con los tres artefactos de `dist/` generados.

## E. Manejo de Errores y Validaciones

- **Estrategia de Errores:** Los componentes **nunca** lanzan excepciones por entradas de atributos inválidas: normalizan a un valor por defecto documentado (ej. `variant` inválido -> `info`, validado contra un `Set` de valores permitidos). Las APIs opcionales del navegador (`attachInternals`, `CustomStateSet`) se envuelven en detección de capacidad / `try...catch` con fallback silencioso. La comunicación hacia el consumidor se hace exclusivamente mediante `CustomEvent` con `{ bubbles: true, composed: true }`; acciones cancelables usan `cancelable: true` y respetan `preventDefault()`.
- **Validación de Entradas:** Toda entrada pública (atributos, propiedades) se valida y normaliza en el setter / `attributeChangedCallback` antes de afectar el render. El contenido proporcionado por el consumidor se proyecta mediante `<slot>`; prohibido interpolar valores de atributos en `innerHTML` (usar `textContent` o propiedades del DOM) para evitar XSS en contextos SSR.
- **Observabilidad y Seguridad:** La librería no emite `console.log` en producción; solo `console.warn` puntual para usos incorrectos detectables por el desarrollador. Prohibido incluir telemetría, llamadas de red o carga de recursos remotos (fuentes, imágenes) desde el core. Prohibido registrar o almacenar secretos, credenciales o PII. Astro opera con `ASTRO_TELEMETRY_DISABLED=1` en el dev shell.

## F. Comportamiento del Agente de IA (Reglas SDD — `seb-harness`)

1. **La Spec Manda:** Ninguna funcionalidad se implementa sin un archivo `specs/<NNN>_<tarea>_spec.md` aprobado y sin etiquetas `[NECESITA ACLARACIÓN]`.
2. **Testabilidad Programática Obligatoria:** Ningún plan (`specs/<NNN>_<tarea>_plan.md`) es válido sin su correspondiente `specs/<NNN>_<tarea>_verificador.md` con comandos que devuelvan código de salida `0`.
3. **Anti-Reward-Hacking:** Está terminantemente prohibido modificar `docs/constitution.md`, `specs/*_spec.md` o `specs/*_verificador.md` durante la implementación, así como deshabilitar o relajar tests para forzar que pasen.
4. **Memoria Persistente (`MEMORY.md`):** Antes de planificar o codificar, el agente debe consultar `MEMORY.md` para evitar callejones sin salida ya documentados, y registrar allí cualquier nueva limitación técnica descubierta.
5. **Commits Protegidos:** Todo commit de código debe pasar la puerta determinista `.seb/bin/seb verify <tarea>`.
