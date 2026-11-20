# Plan Técnico — componente_sidebar (Spec 004)

- **Spec Origen:** `specs/004_componente_sidebar_spec.md`
- **Verificador Asociado:** `specs/004_componente_sidebar_verificador.md`
- **Estado:** `PLANIFICADO`
- **Dependencias:** ninguna declarada en la spec. `004-CHK-99` reejecuta la Puerta de Calidad y la compilación del sitio para detectar regresiones de las Specs 001 a 003.
- **Línea base de comparación:** commit `4178cb8` (HEAD al planificar). Los controles de API, componentes y tokens se comparan contra él.
- **Precondición de ejecución:** todos los comandos, `.seb/bin/seb verify` incluido, se ejecutan dentro del dev shell (`nix develop` o direnv), con `npm install` ya ejecutado (`MEMORY.md` sección 3).
- **Fuente única de verificación:** la tabla de `specs/004_componente_sidebar_verificador.md`, ejecutada por `.seb/bin/seb verify componente_sidebar`. Esta tarea no crea, modifica ni configura hooks (`MEMORY.md` D-03).

## 1. Resumen Arquitectónico y Aislamiento de Lógica

**Componente CSS-first puro.** Se crea una sola hoja `src/css/sidebar.css` dentro de `@layer sm.components`, que se importa desde `src/index.js` (para que entre en `semiotic-ui.css`) y desde `docs/src/layouts/BaseLayout.astro` (que importa las hojas una por una para evitar el FOUC). No hay Custom Element, JavaScript ni tokens nuevos.

**Layout por container query.** `.sm-sidebar-layout` declara `container-type: inline-size` y `container-name: sm-sidebar-layout`. Un contenedor no puede consultarse a sí mismo, así que la disposición la aplican sus hijos: el layout es un `flex` con `flex-wrap: wrap`. Por defecto el Sidebar y el contenido principal ocupan `100 %` cada uno, y quedan apilados con el Sidebar primero por orden del DOM. Dentro de `@container sm-sidebar-layout (width >= 48rem)`, el Sidebar pasa a `flex: 0 0 16rem` y el contenido a `flex: 1 1 0`, y quedan en una sola fila. El Sidebar tiene que ser el primer hijo del layout: es un contrato de marcado y queda documentado.

**Estados sin depender del orden de las reglas (constitución, sección D).** Los selectores de hover y de item activo se excluyen entre sí (sección 3.2), así que ninguno gana por posición en la hoja.

**Verificación en tres capas:**

1. **Modelo CSS para tests (`tests/components/sidebar/css-rules.js`, no es un `.test.js`):** un parser puro que entiende llaves anidadas y devuelve las reglas con su cadena de at-rules (`@layer`, `@container`, `@media`). Fusiona en orden de aparición las reglas que tienen el mismo selector normalizado y el mismo contexto, y la última gana. También resuelve tokens `var()` contra `src/css/tokens.css` en los dos temas y calcula el contraste WCAG 2.x. Los requisitos de geometría se verifican con estas reglas declaradas (`004-RNF-06`).
2. **Tests por grupo de requisitos**, con mensajes de aserción fijos (sección 3.4).
3. **Controles de caja negra en el verificador:** copian el repositorio a un directorio temporal, agregan al final de `sidebar.css` una regla con el mismo selector que rompe el requisito y exigen que el test falle con el mensaje esperado. El modelo fusiona la regla agregada, así que la mutación no depende de cómo esté escrito el resto del archivo.

**Demo del sitio fuera de Vitest.** La compilación de Astro tarda varios segundos, y el control sellado `003-CHK-10` exige que la suite completa de Vitest termine en menos de 30 s. Por eso el chequeo de la demo es una herramienta (`tools/docs-check/`) que el verificador ejecuta sobre la salida de `npm run docs:build`. Su lógica pura se prueba en Vitest con fixtures HTML, lo que es rápido.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción | Responsabilidad Técnica | Requisitos Cubiertos |
| :--- | :--- | :--- | :--- |
| `src/css/sidebar.css` | `CREAR` | Reglas del Sidebar y del Layout con sidebar según el contrato de la sección 3.2 | `004-RF-01` a `004-RF-14`, `004-RF-17` |
| `src/index.js` | `MODIFICAR` | Agregar `import './css/sidebar.css';` después de `cards.css`. Sin otros cambios | `004-RF-02` |
| `docs/src/layouts/BaseLayout.astro` | `MODIFICAR` | Agregar el import de `sidebar.css` junto a los demás | `004-RF-16` |
| `docs/src/pages/index.astro` | `MODIFICAR` | Nueva sección `MOD-05` con la demo en vivo y tres snippets (HTML, Thymeleaf + HTMX, React/Astro) según la sección 3.3 | `004-RF-16`, `004-RF-18` |
| `DESIGN.md` | `MODIFICAR` | Fila `.sm-sidebar` en el inventario y subsección `7.7 Navegación lateral` con la tabla `Clase` de las cinco clases, un snippet y las reglas de marcado, dentro de la región `design-check:inventory` | `004-RF-15` |
| `tests/components/sidebar/css-rules.js` | `CREAR` | Parser de reglas, fusión, resolución de tokens y contraste (sección 3.1) | Soporte de `004-RF-01` a `004-RF-17` |
| `tests/components/sidebar/structure.test.js` | `CREAR` | Capa, tipografía de etiqueta, ancho de item, ajuste de texto, etiqueta ausente, sidebar vacío y lista larga | `004-RF-01` a `004-RF-04`, `004-RF-09`, `004-RF-10`, `004-CL-02`, `004-CL-04` |
| `tests/components/sidebar/states.test.js` | `CREAR` | Activo, hover, foco, deshabilitado y sus combinaciones | `004-RF-05` a `004-RF-08`, `004-CL-01`, `004-CL-03`, `004-CL-05` |
| `tests/components/sidebar/layout.test.js` | `CREAR` | Disposición horizontal y apilada por container query | `004-RF-11`, `004-RF-12` |
| `tests/components/sidebar/tokens-theme.test.js` | `CREAR` | Solo tokens Tier 2 existentes, sin tokens propios, sin reglas de tema oscuro | `004-RF-13`, `004-RF-14`, `004-RNF-05` |
| `tests/components/sidebar/contrast.test.js` | `CREAR` | Contraste `>= 4.5` en cada estado y en los dos temas | `004-RF-17` |
| `tools/docs-check/sidebar-demo.js` | `CREAR` | Función pura `checkSidebarDemo(document, stylesheets)` que devuelve la lista de problemas | `004-RF-16`, `004-RF-18` |
| `tools/docs-check/check-sidebar-demo.js` | `CREAR` | CLI: carga `<dir>/index.html` y sus hojas enlazadas con happy-dom, imprime los códigos y sale con `1` si hay problemas | `004-RF-16`, `004-RF-18` |
| `tests/docs/sidebar-demo-check.test.js` | `CREAR` | Tests de `checkSidebarDemo` con fixtures HTML válidas y una por cada código de problema | `004-RF-16`, `004-RF-18` |
| `MEMORY.md` | `MODIFICAR` | Entradas ya registradas por el planificador; el implementador solo agrega hallazgos nuevos con `seb memory-add` | Constitución, sección F |

**No se modifican:** `src/components/`, `src/css/tokens.css`, `src/css/base.css`, `src/css/buttons.css`, `src/css/cards.css`, `package.json`, `package-lock.json`, `docs/package.json`, `vite.config.js`, `vitest.config.js`, `stylelint.config.js`, `tools/design-doc/`, `tools/stylelint/`, los tests de las Specs 001 a 003, `docs/constitution.md` ni `.agents/`.

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 API del modelo CSS (`tests/components/sidebar/css-rules.js`)

```js
// Lee y parsea una hoja: devuelve reglas con selector normalizado y contexto de at-rules
export function parseRules(css) // -> Array<{ selector: string, context: string[], declarations: Map<string,string> }>
// Fusiona reglas con igual selector y contexto, en orden de aparicion (gana la ultima)
export function mergeRules(rules) // -> Map<string /* context.join(' / ') + ' | ' + selector */, Map<string,string>>
// Busca las declaraciones efectivas de un selector exacto en un contexto exacto
export function findRule(merged, selector, context = ['@layer sm.components']) // -> Map | undefined
// Tokens del tema claro y oscuro (el oscuro hereda del claro) desde src/css/tokens.css
export function loadThemes() // -> { light: Map, dark: Map }
// Resuelve var(--x) y var(--x, fallback) de forma recursiva hasta un valor literal
export function resolveValue(value, theme) // -> string
// Relacion de contraste WCAG 2.x entre dos colores hex
export function contrastRatio(hexA, hexB) // -> number
export function loadSidebarModel() // -> mergeRules(parseRules(readFileSync('src/css/sidebar.css')))
```

- Selector normalizado: espacios colapsados, comillas dobles convertidas a simples y la lista de selectores separada por `, `.
- Las rutas se resuelven desde `import.meta.dirname`, nunca desde el directorio de trabajo, y se arman con `join` (ningún test contiene la cadena `dist/`, por `001-CHK-05`).

### 3.2 Contrato de selectores y declaraciones de `src/css/sidebar.css`

Todas las reglas viven dentro de `@layer sm.components`. Los tests buscan estos selectores exactos:

| Selector exacto | Contexto adicional | Declaraciones obligatorias | Requisitos |
| :--- | :--- | :--- | :--- |
| `.sm-sidebar` | - | `display: flex`, `flex-direction: column`, `background-color: var(--sm-bg-surface)`, `color: var(--sm-text-primary)`, `min-width: 0`. Prohibidos `position: sticky/fixed`, `height`, `max-height`, `min-height`, `overflow*` | `004-RF-09`, `004-CL-02`, `004-CL-04` |
| `.sm-sidebar-menu` | - | Sin `padding*` de bloque inicial, sin `min-height`, `height` ni `grid-template-rows` | `004-RF-10` |
| `.sm-sidebar-label` | - | `font-family: var(--sm-font-mono)`, `text-transform: uppercase`, `letter-spacing` en `em` dentro de `[0.04, 0.08]`, `color: var(--sm-text-secondary)`, `overflow-wrap: anywhere`. El espaciado de la etiqueta se declara solo aquí | `004-RF-03`, `004-RF-09`, `004-RF-10`, `004-RF-17` |
| `.sm-sidebar-item` | - | `display: block`, `color: var(--sm-text-primary)`, `background-color: var(--sm-bg-surface)`, `border-inline-start: 6px solid transparent`, `text-decoration: none`, `overflow-wrap: anywhere`, `transition` con `var(--sm-transition-fast)`. Prohibidos `width`, `inline-size`, `max-width`, `white-space: nowrap`, `text-overflow`, `overflow*` | `004-RF-04`, `004-RF-09`, `004-RF-17` |
| `.sm-sidebar-item:hover:not([aria-disabled='true'])` | - | `background-color: var(--sm-bg-surface-muted)`, `color: var(--sm-text-primary)` | `004-RF-06` |
| `.sm-sidebar-item:focus-visible` | - | `outline: var(--sm-focus-width) solid var(--sm-focus-color)`, `outline-offset: calc(var(--sm-focus-width) * -1)` | `004-RF-07` |
| `.sm-sidebar-item[aria-current='page']` | - | `border-inline-start-color: var(--sm-color-warning)` | `004-RF-05`, `004-CL-03` |
| `.sm-sidebar-item[aria-current='page']:not([aria-disabled='true'], :hover)` | - | `background-color: var(--sm-bg-inverse)`, `color: var(--sm-text-inverse)` | `004-RF-05` |
| `.sm-sidebar-item[aria-disabled='true']` | - | `color: var(--sm-text-secondary)`, `cursor: not-allowed`. Prohibido `pointer-events: none` | `004-RF-08`, `004-CL-03`, `004-CL-05` |
| `.sm-sidebar-layout` | - | `container-type: inline-size`, `container-name: sm-sidebar-layout`, `display: flex`, `flex-wrap: wrap` (longhands de contenedor, sin el shorthand `container`) | `004-RF-11`, `004-RF-12` |
| `.sm-sidebar-layout > .sm-sidebar`, `.sm-sidebar-layout > :not(.sm-sidebar)` | - | `flex: 1 1 100%`, `min-width: 0`. Prohibido `order` | `004-RF-12` |
| `.sm-sidebar-layout > .sm-sidebar` | `@container sm-sidebar-layout (width >= 48rem)` | `flex: 0 0 16rem` | `004-RF-11` |
| `.sm-sidebar-layout > :not(.sm-sidebar)` | `@container sm-sidebar-layout (width >= 48rem)` | `flex: 1 1 0` | `004-RF-11` |
| `.sm-sidebar-item` | `@media (prefers-reduced-motion: reduce)` | `transition: none` (regla del documento de diseño, sección 6) | Constitución / `DESIGN.md` |

Además se permite un reset de listas de baja especificidad (`:where(.sm-sidebar-menu) :where(ul, ol, li)` con `margin: 0`, `padding: 0`, `list-style: none`). Ningún selector puede mencionar `data-sm-theme` ni `sm-theme-dark`, y no se declara ninguna custom property `--sm-*`.

**Contraste esperado con los tokens actuales** (calculado al planificar):

| Estado | Texto / Fondo | Claro | Oscuro |
| :--- | :--- | :--- | :--- |
| Reposo | `--sm-text-primary` / `--sm-bg-surface` | 16.51 | 14.83 |
| Hover (también sobre activo) | `--sm-text-primary` / `--sm-bg-surface-muted` | 11.77 | 12.66 |
| Activo | `--sm-text-inverse` / `--sm-bg-inverse` | 16.51 | 16.51 |
| Deshabilitado (también activo y deshabilitado) | `--sm-text-secondary` / `--sm-bg-surface` | 8.73 | 10.57 |
| Etiqueta | `--sm-text-secondary` / `--sm-bg-surface` | 8.73 | 10.57 |

`--sm-text-muted` sobre `--sm-bg-surface` da 4.33 en el tema claro, así que no sirve para el deshabilitado. El verificador usa justamente ese reemplazo como mutación.

### 3.3 Contrato de la demo y de los snippets (`docs/src/pages/index.astro`)

- Nueva sección `<section class="doc-section" aria-labelledby="sec-sidebar">` con `MOD-05` y el título `Sidebar (.sm-sidebar)`, ubicada después de la sección de alertas.
- Demo en vivo: `div.sm-sidebar-layout` cuyo primer hijo es `nav.sm-sidebar` con `aria-label`, seguido de una región de contenido. El `nav` contiene al menos dos `div.sm-sidebar-menu`. Cada uno tiene un `.sm-sidebar-label` con `id` y una `ul` con `aria-labelledby` igual a ese `id`, más items `a.sm-sidebar-item`. Hay un item con `aria-current="page"` y un item con `aria-disabled="true"` sin `href`. Los destinos de la demo son anclas locales (`#...`).
- Tres snippets en `<pre class="doc-pre"><code>{...}</code></pre>` (texto literal, interpolado por Astro):
  - **HTML:** marcado equivalente a la demo, con `class=` y sin `th:` ni `className`.
  - **Thymeleaf + HTMX:** usa `th:each` o `th:href` sobre los items y `th:attr` para `aria-current`; conserva `aria-label`, `aria-labelledby` y `aria-disabled="true"`.
  - **React / Astro:** usa `className=`, `aria-label`, `aria-labelledby`, `aria-disabled="true"` y `aria-current` (literal o expresión).

**Códigos de `checkSidebarDemo`** (los imprime el CLI, uno por línea):

| Código | Condición de fallo |
| :--- | :--- |
| `demo-markup-invalid` | Falta el `nav.sm-sidebar` con nombre accesible como primer hijo de `.sm-sidebar-layout`, hay menos de dos `.sm-sidebar-menu`, falta el item activo o falta el item deshabilitado sin `href` |
| `label-not-associated` | Algún `.sm-sidebar-label` no tiene `id` o la lista de su menú no lo referencia con `aria-labelledby` |
| `snippet-missing` | Falta alguno de los tres snippets (HTML, Thymeleaf, React/Astro) que contengan `sm-sidebar` |
| `snippet-not-literal` | Algún `pre code` con `sm-sidebar` tiene elementos hijos en lugar de texto |
| `a11y-markup-invalid` | El snippet HTML, parseado con `DOMParser`, no cumple las mismas reglas que la demo, o los snippets Thymeleaf o React no contienen `aria-label`, `aria-labelledby`, `aria-disabled="true"` y `aria-current` |
| `stylesheet-missing` | Ninguna hoja enlazada ni bloque `<style>` del documento contiene `.sm-sidebar-item` |

### 3.4 Mensajes de aserción (contrato con el verificador)

Toda aserción usa la forma `expect(valor, 'mensaje')`:

| Mensaje | Archivo de test | Significa |
| :--- | :--- | :--- |
| `css-rule-missing` | `structure` | Falta un selector obligatorio de la sección 3.2 o hay reglas fuera de `@layer sm.components` |
| `label-typography-invalid` | `structure` | La etiqueta no usa mono, mayúsculas o un `letter-spacing` entre `0.04em` y `0.08em` |
| `item-not-full-width` | `structure` | El item no es de bloque o declara un ancho |
| `text-overflow-possible` | `structure` | Falta `overflow-wrap: anywhere` o hay `nowrap`, `text-overflow`, `overflow` o falta `min-width: 0` |
| `label-space-reserved` | `structure` | El menú reserva espacio de bloque para la etiqueta o declara altura mínima |
| `sidebar-height-constrained` | `structure` | El Sidebar declara `sticky`/`fixed`, altura o desplazamiento propio |
| `active-state-invalid` | `states` | El activo no tiene fondo y texto distintos del reposo o la franja no es sólida, de `6px` a `8px` y visible |
| `state-not-distinct` | `states` | El hover no cambia el fondo o el deshabilitado no cambia el texto, en algún tema |
| `focus-outline-invalid` | `states` | El contorno de foco no es sólido o mide menos de `2px` |
| `activation-blocked` | `states` | El deshabilitado declara `pointer-events: none` o el hover no lo excluye |
| `layout-rule-missing` | `layout` | Falta el contenedor, la regla apilada o la regla horizontal con `48rem` y ancho fijo en `rem` |
| `token-not-allowed` | `tokens-theme` | Se usa un token inexistente o de paleta Tier 1, o se declara un `--sm-*` |
| `theme-rule-declared` | `tokens-theme` | Hay un selector o media query de tema oscuro en la hoja |
| `contrast-below-minimum` | `contrast` | Algún par texto/fondo queda por debajo de `4.5` en algún tema |

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: container query sobre `.sm-sidebar-layout` con `flex-wrap` en lugar de `grid` condicionado.** Un contenedor no puede consultar su propio ancho, así que el cambio de disposición lo hacen los hijos con `flex-basis`. Con `100 %` se apilan y con `16rem` más `1 1 0` comparten fila. Respeta la decisión del humano de medir sobre el layout.
  - _Alternativa descartada:_ `@media (min-width: 48rem)`. Mide la ventana, contrario a la definición de la spec.
  - _Alternativa descartada:_ un envoltorio interno extra con `grid`. Agrega una clase pública que la spec no declara (`004-RNF-03`).
- **Decisión 2: ancho fijo de `16rem`.** Es un valor fijo en `rem` sin token público, como pidió el humano; el consumidor lo puede sobrescribir gracias a `@layer`.
- **Decisión 3: deshabilitado con `--sm-text-secondary`.** Es el único token de texto existente distinto del principal que supera `4.5` en los dos temas (sección 3.2). Así se cumple `004-RNF-05` sin tokens nuevos.
- **Decisión 4: hover y activo mutuamente excluyentes por selector.** El hover sobre un item activo usa el estilo de hover (fondo distinto, `004-RF-06`) y conserva la franja de ubicación. Ninguna regla depende de su posición en la hoja (constitución, sección D).
- **Decisión 5: franja de ubicación como borde lateral transparente en todos los items.** El color se asigna solo en el activo, lo que evita saltos de layout. La regla de franja no excluye el deshabilitado, así que se cumple `004-CL-03`.
- **Decisión 6: verificación por reglas declaradas con un parser propio en `tests/`.** `postcss` existe solo como dependencia transitiva de `stylelint`: importarlo sin declararlo es frágil, y declararlo viola `004-RNF-01`. El parser solo necesita llaves, at-rules y declaraciones de una hoja controlada.
- **Decisión 7: el chequeo de la demo es una herramienta fuera de Vitest.** Compilar Astro dentro de la suite pondría en riesgo el límite de 30 s de `003-CHK-10`. La lógica pura sí se prueba en Vitest con fixtures.
- **Decisión 8: mutaciones por regla agregada al final.** El modelo fusiona por selector, así que `printf ... >> sidebar.css` rompe el requisito sin depender de las líneas exactas que escriba el implementador.
- **Riesgo conocido, fuera de esta tarea:** el control sellado `001-CHK-25` exige que `semiotic-ui.css` sea byte-idéntico al de la línea base `6fa86a0`, o que sus diferencias estén en `tests/fixtures/css-corrections.json`, que no existe. Cualquier componente CSS nuevo, este incluido, hace fallar una reverificación futura de la Spec 001. No afecta a `seb verify componente_sidebar` ni a `npm run quality`. Resolverlo requiere una Operación One-Off o una spec, que decide el humano (registrado en `MEMORY.md`).
- **Estado de partida (honestidad del ciclo TDD):** todos los tests nuevos están en rojo antes de crear `sidebar.css`, salvo los fixtures de `checkSidebarDemo`, que prueban la herramienta y no el sitio.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: ejecuta UNA tarea a la vez en orden. Está prohibido editar `docs/constitution.md`, `specs/004_*_spec.md` y `specs/004_*_verificador.md`, y debilitar un test para que pase. Ningún archivo bajo `tests/` puede contener la cadena `dist/`._

- [ ] **T1. Modelo CSS y tests de estructura en rojo** (`004-RF-01` a `004-RF-04`, `004-RF-09`, `004-RF-10`, `004-CL-02`, `004-CL-04`)
  - _Archivos:_ `tests/components/sidebar/css-rules.js`, `tests/components/sidebar/structure.test.js`
  - _Hecho cuando:_ `vitest run tests/components/sidebar/structure.test.js` falla solo por la ausencia de `sidebar.css` o por `css-rule-missing`.
- [ ] **T2. Hoja base e integración en la entrada y en el sitio** (`004-RF-01` a `004-RF-04`, `004-RF-09`, `004-RF-10`)
  - _Archivos:_ `src/css/sidebar.css`, `src/index.js`, `docs/src/layouts/BaseLayout.astro`
  - _Hecho cuando:_ los comandos `004-CHK-01`, `004-CHK-02` y `004-CHK-03` devuelven exit code `0`.
- [ ] **T3. Estados del item** (`004-RF-05` a `004-RF-08`, `004-CL-01`, `004-CL-03`, `004-CL-05`)
  - _Archivos:_ `tests/components/sidebar/states.test.js` (primero en rojo) y `src/css/sidebar.css`
  - _Hecho cuando:_ los comandos `004-CHK-04` y `004-CHK-05` devuelven exit code `0`.
- [ ] **T4. Layout con sidebar** (`004-RF-11`, `004-RF-12`)
  - _Archivos:_ `tests/components/sidebar/layout.test.js` (primero en rojo) y `src/css/sidebar.css`
  - _Hecho cuando:_ el comando `004-CHK-06` devuelve exit code `0`.
- [ ] **T5. Tokens, tema oscuro, contraste y lint** (`004-RF-13`, `004-RF-14`, `004-RF-17`, `004-RNF-05`)
  - _Archivos:_ `tests/components/sidebar/tokens-theme.test.js`, `tests/components/sidebar/contrast.test.js` (primero en rojo) y `src/css/sidebar.css`
  - _Hecho cuando:_ los comandos `004-CHK-07`, `004-CHK-08` y `004-CHK-09` devuelven exit code `0`.
- [ ] **T6. Documento de diseño** (`004-RF-15`)
  - _Archivos:_ `DESIGN.md`
  - _Hecho cuando:_ el comando `004-CHK-10` devuelve exit code `0` (la suite `tests/design-doc` completa en verde).
- [ ] **T7. Herramienta de chequeo de la demo y sus tests** (`004-RF-16`, `004-RF-18`)
  - _Archivos:_ `tools/docs-check/sidebar-demo.js`, `tools/docs-check/check-sidebar-demo.js`, `tests/docs/sidebar-demo-check.test.js`
  - _Hecho cuando:_ `vitest run tests/docs/sidebar-demo-check.test.js` pasa y el CLI sobre la compilación actual del sitio sale con `1` reportando `demo-markup-invalid` (rojo esperado).
- [ ] **T8. Demo y snippets en el sitio** (`004-RF-16`, `004-RF-18`)
  - _Archivos:_ `docs/src/pages/index.astro`
  - _Hecho cuando:_ los comandos `004-CHK-11` y `004-CHK-12` devuelven exit code `0`.
- [ ] **T9. Requisitos no funcionales y no regresión** (`004-RNF-01` a `004-RNF-06`)
  - _Archivos:_ ninguno nuevo; si algún control falla se corrige el código o los tests sin relajarlos. Registrar hallazgos con `seb memory-add`.
  - _Hecho cuando:_ los comandos `004-CHK-13` a `004-CHK-17` y `004-CHK-99` devuelven exit code `0` y `.seb/bin/seb verify componente_sidebar` reporta el 100 % en `[PASA]`.
