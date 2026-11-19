# Plan Técnico — suite_calidad_tests_lint (Spec 001)

- **Spec Origen:** `specs/001_suite_calidad_tests_lint_spec.md`
- **Verificador Asociado:** `specs/001_suite_calidad_tests_lint_verificador.md`
- **Estado:** `PLANIFICADO`
- **Commit de línea base (`001-RF-26`):** `6fa86a0`. El contenido de `src/` y `vite.config.js` es idéntico al del momento de aprobar la spec. Como referencia informativa, el CSS compilado en ese commit tiene SHA-256 `93fd2b27e29e8b138c1bb74c60edb2d72e070e145d09f8a40c3cb52a361c8743`.
- **Precondición de ejecución:** todos los comandos, `.seb/bin/seb verify` incluido, se ejecutan dentro del dev shell (`nix develop` o direnv). Fuera de él no existen `node` ni `npm` (ver `MEMORY.md` §3).
- **Fuente única de verificación:** la tabla de `specs/001_suite_calidad_tests_lint_verificador.md`, ejecutada por `.seb/bin/seb verify suite_calidad_tests_lint`. Esta tarea no crea, modifica ni configura hooks de git ni de agentes.

## 1. Resumen Arquitectónico y Aislamiento de Lógica

Son dos piezas independientes, más un script npm que las agrupa. Todo son dependencias de **desarrollo**: nada entra en `dist/` ni en el runtime de la librería.

1. **Tests (Vitest 5 + happy-dom 21):**
   - La configuración vive en un `vitest.config.js` propio, separado de `vite.config.js`, para no mezclar el Library Mode con el runner.
   - El entorno por defecto es `node`. Los tests de Web Components declaran `// @vitest-environment happy-dom` por archivo, y los de SSR, `// @vitest-environment node`.
   - Los tests importan siempre desde `src/`, nunca desde `dist/` (`001-RF-22`).
2. **Lint de estilos (Stylelint 18 + stylelint-config-standard 41):**
   - La configuración vive en `stylelint.config.js` (ESM).
   - Las reglas `001-RF-13`, `15`, `16` y `17` se resuelven con reglas nativas de Stylelint.
   - `001-RF-14` y `001-RF-18` se resuelven con un plugin local de dos reglas (`semiotic/no-blurred-shadow` y `semiotic/no-literal-hex-color`). Su lógica de análisis de valores son **funciones puras** en un módulo aparte, testeables sin Stylelint, con un tokenizador propio y sin importar `postcss-value-parser` ni otra dependencia transitiva (`001-RF-23`).
3. **Puerta de Calidad:** el script npm `quality` encadena `build`, `test` y `lint:css` con `&&`, lo que da orden y cortocircuito nativos (`001-RF-19`, `001-RF-20`). Es un comando para el desarrollador y para los verificadores; no se engancha a ningún hook.

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción | Responsabilidad Técnica | Requisitos Cubiertos |
| :--- | :--- | :--- | :--- |
| `package.json` | `MODIFICAR` | devDependencies exactas; scripts `test`, `lint:css`, `quality` | `001-RF-04`, `001-RF-11`, `001-RF-19`, `001-RF-20`, `001-RNF-01`, `001-RNF-02` |
| `package-lock.json` | `MODIFICAR` | Lockfile regenerado por `npm install` | `001-RNF-04` |
| `vitest.config.js` | `CREAR` | Configuración del runner: `include`, entorno por defecto, sin `passWithNoTests` | `001-RF-01` a `001-RF-04`, `001-RF-22` |
| `stylelint.config.js` | `CREAR` | Configuración estándar + reglas del Semiotic Standard + plugin local + `ignoreDisables` | `001-RF-11` a `001-RF-18`, `001-CL-01`, `001-CL-08`, `001-RNF-07` |
| `tools/stylelint/semiotic-plugin.js` | `CREAR` | Registro de las reglas `semiotic/no-blurred-shadow` y `semiotic/no-literal-hex-color` | `001-RF-14`, `001-RF-18`, `001-RF-23` |
| `tools/stylelint/css-value-utils.js` | `CREAR` | Funciones puras de tokenización y detección (sin dependencias) | `001-RF-14`, `001-RF-18`, `001-CL-02` a `001-CL-04` |
| `src/css/*.css` | `MODIFICAR` (solo si hace falta) | Correcciones de formato que no cambian el CSS compilado | `001-RF-21`, `001-RF-26` |
| `tests/ssr/import-without-dom.test.js` | `CREAR` | Importación de `src/index.js` sin DOM | `001-RF-05` |
| `tests/components/semiotic-alert/registration.test.js` | `CREAR` | `registerAll()` invocado dos veces | `001-RF-06` |
| `tests/components/semiotic-alert/variant-normalization.test.js` | `CREAR` | Variante inválida y variante ausente | `001-RF-07`, `001-CL-06` |
| `tests/components/semiotic-alert/dismiss-event.test.js` | `CREAR` | Flags de `sm-dismiss` | `001-RF-08` |
| `tests/components/semiotic-alert/dismiss-prevented.test.js` | `CREAR` | `preventDefault()` mantiene visible la alerta | `001-RF-09` |
| `tests/components/semiotic-alert/text-attribute-escaping.test.js` | `CREAR` | `heading` y `code` con marcado HTML | `001-RF-10` |
| `tests/lint/radius.test.js` | `CREAR` | Propiedades de radio | `001-RF-13`, `001-CL-07` |
| `tests/lint/blurred-shadow.test.js` | `CREAR` | Sombras difuminadas | `001-RF-14`, `001-CL-02`, `001-CL-03`, `001-CL-04` |
| `tests/lint/forbidden-selectors.test.js` | `CREAR` | `*` y `:host-context()` | `001-RF-15` |
| `tests/lint/class-pattern.test.js` | `CREAR` | Patrón de clases `sm-*` | `001-RF-16` |
| `tests/lint/custom-property-pattern.test.js` | `CREAR` | Prefijos `--sm-` y `--_` | `001-RF-17` |
| `tests/lint/literal-hex-color.test.js` | `CREAR` | Hexadecimales fuera de tokens y de fallback | `001-RF-18`, `001-CL-02` |
| `tests/lint/disable-comments.test.js` | `CREAR` | Comentarios de desactivación ignorados | `001-CL-08` |
| `tests/lint/empty-stylesheet.test.js` | `CREAR` | Hoja vacía sin violaciones | `001-CL-01` |
| `tests/lint/css-value-utils.test.js` | `CREAR` | Tests unitarios de las funciones puras | `001-RF-23` |
| `MEMORY.md` | `MODIFICAR` | Registrar hallazgos nuevos de implementación | Sección F de la constitución |

**No se modifican:** `docs/`, `vite.config.js`, `src/index.js`, `src/components/`, `.agents/` (hooks y `hooks.json` incluidos), `.git/hooks/` ni la configuración de git (`core.hooksPath`).

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 `package.json`

- `devDependencies`, con `^` sobre la major validada:
  - `vite` (sin cambios), `vitest@^5.1.1`, `happy-dom@^21.0.4`, `stylelint@^18.0.0`, `stylelint-config-standard@^41.0.0`.
  - No se agrega nada más, no se crea `dependencies` y no se agregan scripts de ciclo de vida (`prepare`, `postinstall`, etc.).
- Scripts (cadenas exactas, las verifican `001-CHK-01`, `001-CHK-12` y `001-CHK-23`):
  - `"test": "vitest run"`
  - `"lint:css": "stylelint \"src/css/**/*.css\""`
  - `"quality": "npm run build && npm test && npm run lint:css"`

### 3.2 `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    // Sin passWithNoTests: un run sin archivos debe fallar (001-RF-03)
  },
});
```

### 3.3 `stylelint.config.js`

```js
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['./tools/stylelint/semiotic-plugin.js'],
  // Los comentarios stylelint-disable no tienen efecto (001-CL-08)
  ignoreDisables: true,
  rules: {
    // Hoja vacia valida (001-CL-01)
    'no-empty-source': null,
    'declaration-property-value-allowed-list': {
      '/^border(?:-[a-z]+)*-radius$/': ['/^0(?:px)?$/', '/^var\\(--sm-radius(?:,\\s*0(?:px)?)?\\)$/'],
    },
    'semiotic/no-blurred-shadow': true,
    'selector-max-universal': 0,
    'selector-pseudo-class-disallowed-list': ['host-context'],
    'selector-class-pattern': ['^sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$'],
    'custom-property-pattern': ['^(?:sm-[a-z0-9]+(?:-[a-z0-9]+)*|_[a-z0-9]+(?:-[a-z0-9]+)*)$'],
    'semiotic/no-literal-hex-color': true,
    // Ajustes permitidos por 001-RNF-07 (ver seccion 4, Decision 5)
  },
  overrides: [
    // Unica excepcion permitida: la hoja de tokens define la paleta literal (001-RF-18)
    { files: ['src/css/tokens.css'], rules: { 'semiotic/no-literal-hex-color': null } },
  ],
};
```

`001-CHK-31` exige tres cosas:
- que las siete reglas anteriores estén presentes y no sean `null`;
- que `ignoreDisables` sea `true`;
- que el único override que anule una de ellas sea el de `src/css/tokens.css` para `semiotic/no-literal-hex-color`.

### 3.4 `tools/stylelint/css-value-utils.js` (funciones puras)

```js
// Divide un valor en capas separadas por comas de nivel superior (respeta parentesis)
export function splitTopLevel(value, separator) {}           // -> string[]
// Tokeniza por espacios de nivel superior; una funcion completa (calc(...), var(...)) es un token
export function tokenize(value) {}                            // -> string[]
export function isLengthToken(token) {}                       // /^[+-]?(\d*\.)?\d+([a-z%]+)?$/i
export function isZeroLength(token) {}                        // valor numerico === 0
// Devuelve las capas de sombra difuminadas; recorre recursivamente los fallbacks de var()
export function findBlurredShadows(value) {}                  // -> string[]
// Extrae los argumentos de cada drop-shadow(...) presente en un valor de filter
export function extractDropShadows(value) {}                  // -> string[]
// Devuelve los hex (#rgb, #rgba, #rrggbb, #rrggbbaa) fuera del fallback de un var()
export function findHexOutsideVarFallback(value) {}           // -> string[]
```

Algoritmo de `findBlurredShadows(value)`:

1. Si `value` (normalizado) es `none`, devolver `[]`.
2. Para cada capa de `splitTopLevel(value, ',')`:
   - Si la capa es exactamente `var(--x)` sin fallback, ignorarla (el token se valida donde se declara).
   - Si la capa contiene `var(--x, <fallback>)`, aplicar recursivamente sobre `<fallback>` (`001-CL-02`).
   - Tomar en orden los tokens de longitud, ignorando `inset` y los colores. Si hay 3 o más, el tercero es el blur. Si ese tercer token no es un cero literal (por ejemplo, un `calc()` o un `var()` en esa posición), la capa cuenta como difuminada.
3. Devolver las capas difuminadas. Para `001-CL-04` basta con una.

Propiedades que analiza `semiotic/no-blurred-shadow`:
- `box-shadow` y `text-shadow`;
- custom properties cuyo nombre contenga `shadow`, para que un token `--sm-shadow-*` difuminado también se rechace;
- los `drop-shadow()` dentro de `filter` y `backdrop-filter`.

`semiotic/no-literal-hex-color` analiza todas las declaraciones, custom properties incluidas, con `findHexOutsideVarFallback`. Permite los hex dentro del fallback de un `var()` (`001-CL-02`).

Las dos reglas reportan con `stylelint.utils.report` sobre el nodo de la declaración, así la salida muestra archivo, línea y nombre de regla (`001-RF-12`). Las dos exportan `ruleName` y `messages`.

### 3.5 Contratos de los tests de componentes

- Cada archivo empieza con `// @vitest-environment happy-dom` e importa desde `../../../src/index.js`.
- `text-attribute-escaping.test.js` tiene **al menos un test por atributo** (`heading` y `code`). Cada test:
  - asigna `<img src=x onerror=alert(1)>` al atributo;
  - comprueba que `shadowRoot.querySelector('img')` sea `null`;
  - comprueba que el texto literal aparezca en el `textContent` del Shadow DOM.
- Prohibido:
  - `test.skip`, `test.todo` y `.only`;
  - assertions vacías;
  - nombres de test con identificadores de requisitos (constitución, regla de identificadores).

### 3.6 Restricciones textuales impuestas por el verificador

- Ningún archivo bajo `tests/` puede contener la cadena `dist/` (`001-CHK-05`).
- `tools/stylelint/css-value-utils.js` y `tools/stylelint/semiotic-plugin.js` no pueden contener las cadenas `postcss` ni `require(`, tampoco en comentarios (`001-CHK-20`). El plugin solo importa `stylelint`.
- Los siguientes archivos y carpetas no pueden contener `python3`, `playwright` ni `puppeteer` (`001-CHK-30`): `scripts/` (si existe), `tools/`, `vitest.config.js`, `stylelint.config.js` y `package.json`.
- Ningún archivo de `dist/` puede contener `vitest`, `stylelint`, `happy-dom` ni `semiotic/no-` (`001-CHK-27`).
- Cantidad mínima de tests por archivo que exige el verificador. Los archivos que no figuran aquí necesitan al menos 1.

  | Archivo de test | Mínimo |
  | :--- | :--- |
  | `blurred-shadow` | 5 |
  | `css-value-utils` | 5 |
  | `radius` | 3 |
  | `literal-hex-color` | 3 |
  | `variant-normalization` | 2 |
  | `text-attribute-escaping` | 2 |
  | `forbidden-selectors` | 2 |
  | `class-pattern` | 2 |
  | `custom-property-pattern` | 2 |
  | `disable-comments` | 2 |

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: ninguna integración con hooks.** La Puerta de Calidad es solo un script npm. La verificación de la tarea se hace exclusivamente con la tabla del verificador, ejecutada por `seb verify`.
  - _Alternativa descartada:_ engancharla al pre-commit mediante `core.hooksPath` o editando `.agents/hooks/`. La descartó explícitamente el humano (ver la spec, registro de clarificaciones, punto 4).
- **Decisión 2: un archivo de test por requisito y control mediante el reporte JSON.**
  - _Alternativa descartada:_ filtrar con `vitest run -t "<nombre>"`. Comprobado empíricamente: con un filtro que no encuentra tests, Vitest 5 sale con `0`, así que el control pasaría sin probar nada.
  - Un archivo inexistente o sin tests sale con `1`, y el reporte JSON permite exigir `numPassedTests === numTotalTests`, lo que rechaza los tests omitidos.
- **Decisión 3: `ignoreDisables: true` en la configuración.**
  - _Alternativa descartada:_ la opción secundaria `reportDisables` por regla. Es más granular, pero `ignoreDisables` ya está comprobado en Stylelint 18 (incluido el `stylelint-disable` global) y cubre `001-CL-08` con una sola línea.
- **Decisión 4: tokenizador propio en el plugin.**
  - _Alternativa descartada:_ importar `postcss-value-parser`. Es una dependencia transitiva no declarada: frágil y contraria a `001-RF-23` y `001-RNF-01`.
- **Decisión 5: violaciones del CSS existente frente a `stylelint-config-standard`.** Sobre el CSS actual hay 20 violaciones comprobadas empíricamente, y **ninguna** corresponde a `001-RF-13` a `001-RF-18`.
  - `custom-property-empty-line-before` (14 en `tokens.css`) y `declaration-empty-line-before` (2 en `buttons.css`): **se desactivan**. Las líneas vacías agrupan los tokens por familia, que es una convención deliberada del proyecto.
  - `no-descending-specificity` (2 en `buttons.css`): **se desactiva**. Corregirla obliga a reordenar selectores, lo que cambia el CSS compilado (`001-RF-26`) y el orden de la cascada.
  - `value-keyword-case` (3 en `tokens.css`, en nombres de familias tipográficas): se configura como `['lower', { ignoreProperties: ['/^--sm-font-/'] }]`. Pasar los nombres de fuente a minúsculas cambiaría el CSS compilado.
  - Resultado esperado: **ninguna corrección en `src/css/`**, así que el CSS compilado queda byte a byte igual al de la línea base. Si al instalar aparece otra violación, se prefiere desactivar o ajustar reglas de la configuración estándar antes que modificar CSS.
- **Decisión 6: la línea base de `001-RF-26` se compila al vuelo desde `6fa86a0` con la misma cadena de herramientas.**
  - _Alternativa descartada:_ fijar en el verificador el SHA-256 del CSS compilado. Cualquier cambio de la versión de esbuild en el lockfile lo invalidaría aunque no haya diferencia de fondo.
  - Si hicieran falta correcciones al CSS, el control acepta un script `scripts/verify/css-baseline-diff.mjs` que compare contra una lista explícita de correcciones en `tests/fixtures/css-corrections.json`. Cada entrada lleva `selector`, `property`, `before`, `after` y `rule`, donde `rule` es una regla de `001-RF-13` a `001-RF-18`. El script se crea **solo** si hace falta.
- **Decisión 7: Vitest 5.1 sobre el Vite 6.4.6 instalado.** Su peer `vite ^6.4.0` ya se cumple, así que no hace falta actualizar Vite (la constitución prohíbe reemplazarlo).
  - _Alternativa descartada:_ Vitest 3, que tiene menos soporte a futuro y no aporta nada a cambio.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el agente implementador: ejecutar UNA tarea por vez, en orden de dependencia. Primero se escribe el test y se comprueba que falle (rojo); después, el código mínimo para que pase (verde). Todos los comandos, dentro del dev shell._

- [ ] **T1. Instalar el runner y configurarlo** (`001-RF-01` a `001-RF-04`, `001-RF-22`, `001-RNF-01`, `001-RNF-02`)
  - _Archivos:_ `package.json`, `package-lock.json`, `vitest.config.js`.
  - _Hecho cuando:_ `001-CHK-02`, `001-CHK-03`, `001-CHK-05` y `001-CHK-26` devuelven `0`. `001-CHK-01` y `001-CHK-04` pasan recién cuando exista el primer test, en T2.
- [ ] **T2. Test de importación sin DOM** (`001-RF-05`)
  - _Archivos:_ `tests/ssr/import-without-dom.test.js`.
  - _Hecho cuando:_ `001-CHK-01`, `001-CHK-04` y `001-CHK-06` devuelven `0`.
- [ ] **T3. Tests de línea base de `<semiotic-alert>`** (`001-RF-06` a `001-RF-10`, `001-CL-06`)
  - _Archivos:_ los cinco archivos de `tests/components/semiotic-alert/`.
  - _Hecho cuando:_ `001-CHK-07` a `001-CHK-11` devuelven `0`. No se modifica `src/components/`: si un test revela un defecto real, la tarea se detiene y se registra en `MEMORY.md`.
- [ ] **T4. Configuración de Stylelint con reglas nativas** (`001-RF-11`, `001-RF-12`, `001-RF-13`, `001-RF-15` a `001-RF-17`, `001-CL-01`, `001-CL-07`, `001-CL-08`, `001-RNF-07`)
  - _Archivos:_
    - `stylelint.config.js`, todavía sin plugin;
    - en `tests/lint/`: `radius.test.js`, `forbidden-selectors.test.js`, `class-pattern.test.js`, `custom-property-pattern.test.js`, `disable-comments.test.js` y `empty-stylesheet.test.js`.
  - _Hecho cuando:_ `001-CHK-13`, `001-CHK-14`, `001-CHK-16` a `001-CHK-18`, `001-CHK-21` y `001-CHK-22` devuelven `0`.
- [ ] **T5. Funciones puras de análisis de valores** (`001-RF-23`)
  - _Archivos:_ `tools/stylelint/css-value-utils.js`, `tests/lint/css-value-utils.test.js`.
  - _Hecho cuando:_ `node_modules/.bin/vitest run tests/lint/css-value-utils.test.js` pasa y cubre estos casos:
    - blur cero y blur distinto de cero;
    - varias capas, `inset` y `none`;
    - `var()` con y sin fallback;
    - `drop-shadow()`;
    - hex de 3, 4, 6 y 8 dígitos, y hex dentro de un fallback.
- [ ] **T6. Plugin `semiotic/*` integrado en la configuración** (`001-RF-14`, `001-RF-18`, `001-RF-23`, `001-CL-02` a `001-CL-04`)
  - _Archivos:_ `tools/stylelint/semiotic-plugin.js`, `stylelint.config.js`, `tests/lint/blurred-shadow.test.js`, `tests/lint/literal-hex-color.test.js`.
  - _Hecho cuando:_ `001-CHK-15`, `001-CHK-19`, `001-CHK-20` y `001-CHK-31` devuelven `0`.
- [ ] **T7. Ajuste de la configuración estándar sobre el CSS existente** (`001-RF-11`, `001-RF-21`, `001-RF-26`, `001-RNF-07`)
  - _Archivos:_ `stylelint.config.js`, con los ajustes de la Decisión 5. `src/css/*.css` solo si fuera imprescindible.
  - _Hecho cuando:_ `001-CHK-12` y `001-CHK-25` devuelven `0`.
- [ ] **T8. Puerta de Calidad y regresión global** (`001-RF-19` a `001-RF-21`, `001-RNF-03` a `001-RNF-06`)
  - _Archivos:_ `package.json` (script `quality`).
  - _Hecho cuando:_ `001-CHK-23`, `001-CHK-24`, `001-CHK-27` a `001-CHK-30` y `001-CHK-99` devuelven `0`, y `.seb/bin/seb verify suite_calidad_tests_lint` reporta el 100 % en `[PASA]`.

## 6. Riesgos y Notas Operativas

- **Duración de `seb verify`:** la tabla compila varias veces (en `001-CHK-24`, `001-CHK-25`, dos veces en `001-CHK-28` y en `001-CHK-99`). Se estima entre uno y dos minutos por ejecución completa; es el costo aceptado de que cada control sea independiente.
- **Dev shell obligatorio:** fuera de `nix develop`, todos los controles fallan por falta de `node`. No es un fallo de la implementación.
