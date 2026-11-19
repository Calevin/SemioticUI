# Plan Técnico — coherencia_documento_diseno (Spec 002)

- **Spec Origen:** `specs/002_coherencia_documento_diseno_spec.md`
- **Verificador Asociado:** `specs/002_coherencia_documento_diseno_verificador.md`
- **Estado:** `PLANIFICADO`
- **Dependencia verificada:** `001` (`verified: true`, `commit_hash: 6fa86a0` en `.seb/seb.lock`).
- **Precondición de ejecución:** todos los comandos, `.seb/bin/seb verify` incluido, se ejecutan dentro del dev shell (`nix develop` o direnv), con `npm install` ya ejecutado (ver `MEMORY.md` §3).
- **Fuente única de verificación:** la tabla de `specs/002_coherencia_documento_diseno_verificador.md`, ejecutada por `.seb/bin/seb verify coherencia_documento_diseno`. Esta tarea no crea, modifica ni configura hooks.

## 1. Resumen Arquitectónico y Aislamiento de Lógica

La comprobación se divide en tres capas. Solo la última toca el sistema de archivos o el DOM:

1. **Núcleo puro (`tools/design-doc/`):** parsers y reglas sin I/O, sin DOM y sin dependencias (ni `postcss`, ni parsers de Markdown). Recibe textos y un modelo de la librería ya recolectado, y devuelve una lista de discrepancias tipadas. Es testeable en entorno `node` con entradas en memoria.
2. **Recolector (`tests/design-doc/repository-sources.js`):** helper de tests, no es un archivo `.test.js`. Lee los archivos reales del repositorio con `node:fs` y construye el modelo de la librería instanciando los Custom Elements en `happy-dom`.
3. **Tests (`tests/design-doc/*.test.js`):** los tests unitarios del núcleo con fixtures en memoria; los tests de discrepancias controladas sobre el contenido real alterado en memoria (`002-RF-21`); y el test de coherencia del repositorio real (`002-RF-01`, `002-RF-20`).

Nada de esto entra en `dist/`: el bundle parte de `src/index.js` y ni `tools/` ni `tests/` son alcanzables desde ahí (`002-RNF-04`). No se modifica `src/`, `docs/`, `package.json` ni la configuración de Vitest: los tests nuevos entran por el `include: ['tests/**/*.test.js']` existente y corren con `npm test` (`002-RF-01`).

`DESIGN.md` se reestructura para cumplir el contrato de formato de la sección 3.3. Es el único archivo no técnico que se modifica.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción | Responsabilidad Técnica | Requisitos Cubiertos |
| :--- | :--- | :--- | :--- |
| `tools/design-doc/css-model.js` | `CREAR` | Funciones puras: tokens claro/oscuro de la hoja de tokens y clases `.sm-*` de las hojas públicas | `002-RF-06` a `002-RF-09`, `002-RF-12`, `002-RF-18` |
| `tools/design-doc/markdown-model.js` | `CREAR` | Funciones puras: bloques de código, tablas, regiones delimitadas, encabezados, menciones, patrones, abreviaturas, declaración de versión | `002-RF-04`, `002-RF-05`, `002-RF-10`, `002-RF-11`, `002-RF-13`, `002-RF-15`, `002-RF-19`, `002-CL-02`, `002-CL-03`, `002-CL-10`, `002-CL-11` |
| `tools/design-doc/check-design-doc.js` | `CREAR` | `checkDesignDoc()` y `formatDiscrepancies()`: reglas y formato del informe | `002-RF-02` a `002-RF-19`, `002-CL-01` a `002-CL-11` |
| `tests/design-doc/repository-sources.js` | `CREAR` | `loadRepositorySources()` (lee archivos reales) y `collectLibraryModel()` (`happy-dom` y lectura de fuentes de componentes) | `002-RF-14`, `002-RF-16`, `002-RF-17` |
| `tests/design-doc/css-model.test.js` | `CREAR` | Tests unitarios del parser CSS | `002-RF-06` a `002-RF-09`, `002-RF-12` |
| `tests/design-doc/markdown-model.test.js` | `CREAR` | Tests unitarios del parser Markdown | `002-RF-04`, `002-RF-05`, `002-RF-10`, `002-RF-11`, `002-RF-19`, `002-CL-02`, `002-CL-03`, `002-CL-10`, `002-CL-11` |
| `tests/design-doc/token-checks.test.js` | `CREAR` | Reglas de tokens con fixtures | `002-RF-04` a `002-RF-10`, `002-CL-04`, `002-CL-05`, `002-CL-08` |
| `tests/design-doc/name-checks.test.js` | `CREAR` | Abreviaturas y menciones de clases y elementos | `002-RF-11`, `002-RF-13`, `002-RF-15`, `002-CL-01`, `002-CL-09`, `002-CL-10`, `002-CL-11` |
| `tests/design-doc/inventory-checks.test.js` | `CREAR` | Inventario, inexistentes, versión, documento ausente e informe | `002-RF-02`, `002-RF-03`, `002-RF-12`, `002-RF-14`, `002-RF-16` a `002-RF-19`, `002-CL-07` |
| `tests/design-doc/library-model.test.js` | `CREAR` | Recolector sobre la librería real (`happy-dom`) | `002-RF-14`, `002-RF-16`, `002-RF-17`, `002-CL-06` |
| `tests/design-doc/controlled-discrepancies.test.js` | `CREAR` | Un test por tipo de discrepancia sobre contenido real alterado en memoria | `002-RF-21` |
| `tests/design-doc/coherence.test.js` | `CREAR` | Coherencia del repositorio real; informe en el mensaje de fallo | `002-RF-01`, `002-RF-02`, `002-RF-03`, `002-RF-20` |
| `DESIGN.md` | `MODIFICAR` | Reestructurar según el contrato de formato (sección 3.3) | `002-RF-20`, `002-RNF-05` |
| `MEMORY.md` | `MODIFICAR` | Registrar hallazgos de implementación | Sección F de la constitución |

**No se modifican:** `src/`, `docs/`, `package.json`, `package-lock.json`, `vitest.config.js`, `vite.config.js`, `stylelint.config.js`, `tools/stylelint/`, `.agents/`, la configuración de git ni los tests de la Spec 001.

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 Modelo de entrada del núcleo

```js
// Entrada de checkDesignDoc: textos y modelo ya recolectados, sin I/O
const input = {
  markdown: '...',            // contenido de DESIGN.md, o null si el archivo no existe
  tokenSheetCss: '...',       // contenido de src/css/tokens.css
  stylesheets: [{ path: 'src/css/base.css', css: '...' }], // todas las hojas publicas, ordenadas por path
  library: {
    version: '0.1.0',         // package.json#version
    elements: [{
      name: 'semiotic-alert',
      attributes: ['variant', 'code'], // observedAttributes
      events: ['sm-dismiss', 'sm-show'], // analisis estatico de la fuente
      parts: ['base', 'badge'],          // atributos part del Shadow DOM
      slots: ['heading'],                // name de cada <slot> con nombre
    }],
    exports: ['registerAll', 'SemioticAlert', 'registerSemioticAlert'],
  },
};
```

### 3.2 Firmas del núcleo (`tools/design-doc/`)

```js
// css-model.js
export function stripCssComments(css) {}
export function parseTokenSheet(css) {} // -> { light: Map<string,string>, dark: Map<string,string> }
export function collectDefinedClasses(stylesheets) {} // -> Set<string> con nombres sin punto

// markdown-model.js
export function splitFencedCode(markdown) {} // -> [{ text, isCode, startLine }]
export function parseTables(markdown) {} // -> [{ headers, rows: [{ cells, line }], line, region }] fuera de bloques de codigo
export function findRegions(markdown) {} // -> { inventory: {start,end}|null, nonexistent: {start,end}|null }
export function findTokenMentions(markdown) {} // -> [{ name, kind: 'exact'|'wildcard'|'alternatives', expansion, line }]
export function findAbbreviatedNames(markdown) {} // -> [{ text, line }]
export function findClassMentions(markdown) {} // -> [{ name, line, offset }]
export function findElementMentions(markdown) {} // -> [{ name, line, offset }]
export function findVersionDeclarations(markdown) {} // -> [{ version, line, inHeader }]

// check-design-doc.js
export function normalizeCssValue(value) {}
export function checkDesignDoc(input) {} // -> Discrepancy[] ordenado (type, subject, line)
export function formatDiscrepancies(list) {} // -> string, una linea por discrepancia
```

`Discrepancy = { type, subject, documented?, actual?, line?, detail? }`. Los códigos de `type` son contrato y los usan los tests y el verificador:

| `type` | Requisito |
| :--- | :--- |
| `document-missing` | `002-RF-03` |
| `token-unknown` | `002-RF-04` |
| `token-pattern-unmatched` | `002-RF-05` |
| `token-undocumented` | `002-RF-06` |
| `token-light-mismatch` | `002-RF-07` |
| `token-dark-mismatch` | `002-RF-08` |
| `token-dark-undocumented` | `002-RF-09` |
| `token-row-malformed` | `002-RF-10` |
| `token-duplicate-conflict` | `002-CL-08` |
| `abbreviated-name` | `002-RF-11` |
| `inventory-missing` | `002-RF-12`, `002-RF-14`, `002-RF-18` (región delimitada ausente) |
| `class-inventory-extra` / `class-inventory-missing` | `002-RF-12` |
| `class-unknown` | `002-RF-13` |
| `element-inventory-extra` / `element-inventory-missing` | `002-RF-14` |
| `element-unknown` | `002-RF-15` |
| `member-extra` / `member-missing` | `002-RF-16` (`subject` = `<elemento>/<attribute|event|part|slot>/<nombre>`) |
| `export-extra` / `export-missing` | `002-RF-17` |
| `nonexistent-exists` | `002-RF-18` |
| `version-missing` / `version-duplicate` / `version-mismatch` | `002-RF-19` |

**Formato del informe (`002-RF-02`):** una línea por discrepancia, en el orden de la lista:

```text
[<type>] <subject> documented="<valor>" actual="<valor>" (line <n>)
```

`documented`, `actual` y `line` aparecen solo cuando aplican. Forma del `subject`, que también es contrato:

- **Tokens:** el nombre (`--sm-radius`).
- **Patrones:** el texto tal como aparece en el documento (`--sm-zz-*`).
- **Clases:** con punto inicial (`.sm-badge`).
- **Custom Elements:** el nombre sin ángulos (`semiotic-alert`).
- **Miembros:** `<elemento>/<categoría>/<nombre>`.
- **Exportaciones:** el identificador.
- **Abreviaturas:** el texto encontrado (`--primary`).
- **Versión y documento:** `semiotic-ui` y `DESIGN.md`.
- **Filas malformadas:** el texto de la primera celda. En `token-light-mismatch` y `token-dark-mismatch`, `documented` es el valor de la tabla y `actual` el de la hoja de tokens, ambos normalizados. En `version-mismatch`, `documented` es la versión declarada y `actual` la del paquete.

### 3.3 Contrato de formato de `DESIGN.md`

1. **Encabezado:** todo lo anterior al primer encabezado `## `. Contiene exactamente una declaración de versión `semiotic-ui@X.Y.Z`, por ejemplo `> **Versión de la librería:** \`semiotic-ui@0.1.0\``. Cualquier otra aparición de `semiotic-ui@<semver>` en el documento, incluidos los bloques de código, cuenta como duplicado. Una declaración fuera del encabezado no cuenta como declaración: si es la única aparición, el resultado es `version-missing`; si el encabezado ya tiene una, es `version-duplicate`.
2. **Tablas de tokens:** fuera de bloques de código, con la primera cabecera exactamente `Token`, una columna `Valor claro` obligatoria y una `Valor oscuro` opcional. Las demás columnas se ignoran.
   - La celda `Token` contiene exactamente un code span con un nombre completo `--sm-...`.
   - La celda `Valor claro` contiene exactamente un code span.
   - La celda `Valor oscuro` está vacía (no documenta valor oscuro) o contiene exactamente un code span.
   - Las celdas no contienen `|`.
   - Una fila que no cumple genera `token-row-malformed`. Una tabla `Token` sin columna `Valor claro` genera `token-row-malformed` en cada fila.
3. **Regiones delimitadas** (comentarios HTML invisibles al renderizar, `002-RNF-05`):
   - `<!-- design-check:inventory -->` ... `<!-- /design-check:inventory -->`: el inventario de componentes.
   - `<!-- design-check:nonexistent -->` ... `<!-- /design-check:nonexistent -->`: la lista de componentes inexistentes, anidada dentro del inventario.
   - Cada delimitador aparece una sola vez. Si falta uno, se reporta `inventory-missing`.
4. **Tablas del inventario:** dentro de la región de inventario y fuera de la de inexistentes, reconocidas por la primera cabecera. Cada celda de la primera columna contiene exactamente un code span:
   - `Clase`: `.sm-...` con nombre completo.
   - `Custom Element`: `<semiotic-...>`.
   - `Atributo`, `Evento`, `Parte` y `Slot`: el nombre a secas. Se asocian al Custom Element mencionado en el encabezado Markdown más cercano anterior a la tabla. Una tabla de miembros sin encabezado asociable genera `inventory-missing` con `detail`.
   - `Exportación`: un identificador, con `()` final opcional que se descarta.
5. **Lista de inexistentes:** las menciones de clase y de Custom Element dentro de su región forman el conjunto de piezas inexistentes. Se excluyen de `002-RF-13` y `002-RF-15` (`002-CL-09`) y se contrastan con el código (`002-RF-18`). Debe incluir al menos `.sm-badge`, `.sm-input`, `<semiotic-modal>` y `<semiotic-tabs>`: "controles de formulario" se concreta como `.sm-input` para que sea verificable.

### 3.4 Gramáticas léxicas

Se aplican sobre el documento completo, incluidos los bloques de código (`002-CL-02`), salvo indicación contraria.

- **Mención de token:** `(?<![A-Za-z0-9_-])--sm-((?:[a-z0-9]+-)*[a-z0-9]*)`, seguida opcionalmente de una cola de patrón.
  - Cola `*`: comodín de prefijo.
  - Cola `{a|b|...}`: alternativas que se expanden en el lugar; puede haber varias.
  - Cola `|x|y` inmediatamente después del último segmento: alternativas del último segmento (`--sm-shadow-sm|md|lg`).
  - Sin cola, con nombre terminado en `-` o vacío (`--sm-`): se trata como comodín de prefijo.
  - Un patrón debe coincidir con al menos un token público (`002-RF-05`). Una mención exacta debe ser un token público (`002-RF-04`).
  - El lookbehind excluye los modificadores de clase (`.sm-btn--sm`, `002-CL-03`).
- **Nombre abreviado (`002-RF-11`):** toda aparición de `(?<![A-Za-z0-9_-])--(?=[A-Za-z_])` que no inicie una mención de token (`--sm-` + segmento, o `--sm-` como prefijo) ni sea exactamente `--_*`.
  - `--sm` seguido de algo distinto de `-` es abreviatura.
  - Los separadores `:---`, los `-->` y los guiones largos no coinciden (`002-CL-11`).
- **Mención de clase:** dos variantes.
  - `(?<![A-Za-z0-9_])\.(sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?)`, descartando las que van seguidas de `*`, `<`, `-*`, `-<`, `--*` o `--<` (`002-CL-10`).
  - Cada palabra con prefijo `sm-` dentro de `class="..."` o `className="..."`.
- **Mención de Custom Element:** `</?(semiotic-[a-z0-9]+(?:-[a-z0-9]+)*)(?=[\s>/])`. `<semiotic-*>` y `<semiotic-<nombre>>` no coinciden (`002-CL-10`).
- **Prefijo de consumidor:** como solo se reconocen clases `sm-*`, `.app-*` nunca se controla (`002-CL-01`).

### 3.5 Algoritmo del parser CSS (`css-model.js`)

1. Quitar los comentarios `/* ... */`.
2. Recorrer los bloques más internos con `/([^{}]+)\{([^{}]*)\}/g`. El preludio es el texto posterior al último `;` dentro del grupo capturado; así se descartan sentencias como `@layer a, b;`.
3. Construir el modelo de tokens:
   - **Claro:** bloques cuyo preludio normalizado es exactamente `:root`.
   - **Oscuro:** bloques cuya lista de selectores incluye `:root[data-sm-theme='dark']` (comillas simples o dobles indistintas).
   - Las declaraciones son las coincidencias de `/(--sm-[a-z0-9-]+)\s*:\s*([^;]+);/g`, y una declaración posterior pisa a la anterior. `color-scheme` y las demás propiedades no `--sm-` se ignoran.
4. Construir el conjunto de clases definidas: las clases `\.(sm-[a-z0-9-]+)` de los preludios de todas las hojas públicas. Las declaraciones y los nombres de `@keyframes` no cuentan.
5. **Tokens públicos:** la unión de los nombres claros y oscuros. **Valor oscuro efectivo:** `dark.get(t) ?? light.get(t)`.

### 3.6 Normalización de valores (`normalizeCssValue`)

1. Colapsar espacios en blanco y recortar.
2. Pasar a minúsculas los hexadecimales `#[0-9a-fA-F]{3,8}`.
3. Si el valor documentado es exactamente `--sm-x`, convertirlo a `var(--sm-x)`.
4. Comparar por igualdad de strings. No se resuelven referencias: `ivory-100` no equivale a `var(--sm-palette-ivory-100)`.

### 3.7 Recolector (`tests/design-doc/repository-sources.js`)

```js
// Rutas resueltas desde import.meta.dirname, nunca desde process.cwd()
export function loadRepositorySources() {}
// -> { markdown (null si no existe), tokenSheetCss, stylesheets (src/css/*.css ordenadas), packageVersion, readComponentSource(name) }

export async function collectLibraryModel(sources) {}
// Requiere entorno happy-dom
```

`collectLibraryModel` hace lo siguiente:

1. Envuelve `customElements.define` con un registrador **antes** del `import()` dinámico de `src/index.js`. Luego invoca `registerAll()`, que es idempotente, y obtiene la lista de nombres definidos.
2. Construye `exports` con `Object.keys(module)`, ordenado.
3. Para cada elemento:
   - `attributes`: `customElements.get(name).observedAttributes`.
   - `parts` y `slots`: crea la instancia con `document.createElement(name)`, sin atributos, y recorre `shadowRoot.querySelectorAll('[part]')` (separando por espacios) y `slot[name]`.
   - `events`: análisis estático de `src/components/<name>.js` con `/new\s+(?:Custom)?Event\(\s*(['"`])(sm-[a-z0-9-]+)\1/g`. Si el archivo no existe, la lista queda vacía y el modelo marca `sourceMissing: true`; el checker lo reporta como `member-missing` con `detail`.
   - Si un elemento no tiene `shadowRoot` o no expone `observedAttributes`, las listas correspondientes quedan vacías, sin lanzar error (caso de `002-CHK-19`).
   - Todas las listas se ordenan y deduplican (`002-RNF-02`).

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: parsers propios basados en expresiones regulares, sin `postcss` ni parser de Markdown.**
  - _Alternativa descartada:_ usar `postcss` (dependencia transitiva de Stylelint) o un parser Markdown (`marked`, `remark`). `002-RNF-01` no aprueba dependencias nuevas, y la Spec 001 ya fijó el criterio de no importar dependencias transitivas (`001-RF-23`). La hoja de tokens no tiene bloques con llaves dentro de valores, y el documento se controla con un contrato de formato propio, de modo que el subconjunto de la gramática necesario es acotado y testeable.
- **Decisión 2: regiones delimitadas con comentarios HTML para el inventario y los inexistentes.**
  - _Alternativa descartada:_ inferir el inventario por títulos de sección. Es frágil ante renombres y traducciones. `002-RNF-05` admite comentarios HTML como delimitadores.
- **Decisión 3: tablas reconocidas por la primera cabecera (`Token`, `Clase`, `Custom Element`, `Atributo`, `Evento`, `Parte`, `Slot`, `Exportación`).**
  - _Alternativa descartada:_ listas con viñetas. Las tablas ya son la forma del documento, son legibles y permiten un elemento por fila (Clarificación 4).
- **Decisión 4: registrador sobre `customElements.define` antes del import dinámico.**
  - _Alternativa descartada:_ mantener a mano una lista de nombres en el test, que reintroduce el desfasaje que la spec quiere evitar. La API `CustomElementRegistry` no permite enumerar los elementos definidos.
- **Decisión 5: eventos por análisis estático de la fuente del componente (Clarificación 8).**
  - _Alternativa descartada:_ ejercitar métodos (no escala sin conocer cada componente) o una declaración estática nueva (cambia la API, fuera de alcance). La ruta de la fuente sale de la convención de la constitución D (`src/components/semiotic-<nombre>.js`).
- **Decisión 6: la comprobación es un test de Vitest y el informe va en el mensaje de la aserción.**
  - _Alternativa descartada:_ un script npm aparte, que contradice `002-RF-01` ("sin un comando adicional"). El test usa `expect(list, formatDiscrepancies(list)).toEqual([])`, y Vitest imprime el mensaje completo.
- **Decisión 7: núcleo en `tools/design-doc/` y recolector en `tests/design-doc/`.**
  - _Alternativa descartada:_ todo en `tests/`. Se sigue el precedente de `tools/stylelint/` (Spec 001): lógica pura reutilizable fuera de los tests. El recolector depende de `happy-dom` y del manejo de imports CSS de Vitest (`MEMORY.md` §5, decisión de la Spec 001), por eso vive junto a los tests.
- **Decisión 8: el verificador además muta copias temporales del repositorio** (patrón de `001-CHK-25`).
  - Corre el test de coherencia en un directorio temporal con alteraciones reales sobre `DESIGN.md`, la hoja de tokens, las hojas públicas, el componente, `src/index.js` o `package.json`. Exige que falle y que el informe nombre el tipo y el sujeto. Es un control de caja negra independiente de los tests escritos por el implementador.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: ejecuta UNA tarea a la vez, en orden. Primero escribe el test y comprueba que falla (Rojo); luego escribe el código mínimo hasta que pase (Verde). Prohibido usar `test.skip`, `test.todo`, `.only` o aserciones vacías._

- [ ] **T1. Parser CSS puro** (`002-RF-06` a `002-RF-09`, `002-RF-12`)
  - _Archivos:_ `tools/design-doc/css-model.js`, `tests/design-doc/css-model.test.js` (al menos 5 tests: claro, oscuro con las dos variantes de comillas, comentarios con `--sm-` ignorados, clases en `@media` anidado, `@layer a, b;` y `@keyframes` sin clases espurias).
  - _Hecho cuando:_ `002-CHK-04` devuelve `0`.
- [ ] **T2. Parser Markdown puro** (`002-RF-04`, `002-RF-05`, `002-RF-10`, `002-RF-11`, `002-RF-13`, `002-RF-15`, `002-RF-19`)
  - _Archivos:_ `tools/design-doc/markdown-model.js`, `tests/design-doc/markdown-model.test.js` (al menos 12 tests que cubran cada gramática de 3.4, bloques de código, regiones, tablas fuera de código y encabezado de versión).
  - _Hecho cuando:_ `002-CHK-05` devuelve `0`.
- [ ] **T3. Reglas de tokens** (`002-RF-04` a `002-RF-10`, `002-CL-04`, `002-CL-05`, `002-CL-08`)
  - _Archivos:_ `tools/design-doc/check-design-doc.js` (primera parte), `tests/design-doc/token-checks.test.js` (al menos 10 tests, fixtures en memoria).
  - _Hecho cuando:_ `002-CHK-06` devuelve `0`.
- [ ] **T4. Reglas de nombres** (`002-RF-11`, `002-RF-13`, `002-RF-15`, `002-CL-01`, `002-CL-09` a `002-CL-11`)
  - _Archivos:_ `tools/design-doc/check-design-doc.js`, `tests/design-doc/name-checks.test.js` (al menos 8 tests).
  - _Hecho cuando:_ `002-CHK-07` devuelve `0`.
- [ ] **T5. Reglas de inventario, versión, documento ausente e informe** (`002-RF-02`, `002-RF-03`, `002-RF-12`, `002-RF-14`, `002-RF-16` a `002-RF-19`, `002-CL-07`)
  - _Archivos:_ `tools/design-doc/check-design-doc.js`, `tests/design-doc/inventory-checks.test.js` (al menos 12 tests, incluido el formato exacto de `formatDiscrepancies`).
  - _Hecho cuando:_ `002-CHK-08` devuelve `0`.
- [ ] **T6. Recolector de la librería real** (`002-RF-14`, `002-RF-16`, `002-RF-17`, `002-CL-06`)
  - _Archivos:_ `tests/design-doc/repository-sources.js`, `tests/design-doc/library-model.test.js` (`// @vitest-environment happy-dom`; al menos 5 tests que afirmen `semiotic-alert`, sus 6 atributos observados, los eventos `sm-dismiss` y `sm-show`, las 7 partes, el slot `heading` y las 3 exportaciones).
  - _Hecho cuando:_ `002-CHK-09` devuelve `0`.
- [ ] **T7. Discrepancias controladas sobre contenido real en memoria** (`002-RF-21`)
  - _Archivos:_ `tests/design-doc/controlled-discrepancies.test.js` (`happy-dom`). Parte de `loadRepositorySources()` y `collectLibraryModel()`, y aplica una mutación por caso sobre las cadenas o sobre el modelo. Cada caso exige que la lista contenga el `type` esperado con el `subject` esperado. Hay un caso por cada código de 002-RF-21, con al menos 20 tests. No escribe archivos.
  - _Hecho cuando:_ `002-CHK-10` devuelve `0`.
- [ ] **T8. Test de coherencia del repositorio** (`002-RF-01`, `002-RF-02`, `002-RF-03`, `002-RF-20`)
  - _Archivos:_ `tests/design-doc/coherence.test.js` (`happy-dom`). Queda en Rojo con el `DESIGN.md` actual: es el resultado esperado de este paso.
  - _Hecho cuando:_ el test falla con un informe legible sobre el `DESIGN.md` actual, y `002-CHK-02`, `002-CHK-03` y `002-CHK-11` a `002-CHK-24` devuelven `0`.
- [ ] **T9. Adecuar `DESIGN.md` al contrato de 3.3** (`002-RF-20`, `002-RNF-05`)
  - _Archivos:_ `DESIGN.md`. Cambios mínimos conocidos:
    - declaración `semiotic-ui@0.1.0` única en el encabezado;
    - tablas `Token` / `Valor claro` / `Valor oscuro` con un token por fila, nombres completos de referencia (`var(--sm-palette-ivory-100)`) y sombras con su color;
    - documentar los tokens `-hover`, `-surface`, de foco y de transición;
    - modificadores con nombre de clase completo (`.sm-btn--primary`, `.sm-card--compact`);
    - regiones delimitadas del inventario y de los inexistentes;
    - tablas `Clase` (incluida `.sm-theme-dark`), `Custom Element`, `Atributo`, `Evento`, `Parte`, `Slot` y `Exportación`;
    - quitar `.sm-badge` y demás piezas inexistentes de fuera de su región.
  - _Hecho cuando:_ `002-CHK-01` y `002-CHK-30` devuelven `0`.
- [ ] **T10. Puerta de calidad completa y memoria**
  - _Archivos:_ `MEMORY.md` (hallazgos nuevos, vía `.seb/bin/seb memory-add`).
  - _Hecho cuando:_ todos los controles, de `002-CHK-01` a `002-CHK-99`, devuelven `0` con `.seb/bin/seb verify coherencia_documento_diseno`.
