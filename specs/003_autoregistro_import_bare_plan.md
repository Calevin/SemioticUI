# Plan Técnico — autoregistro_import_bare (Spec 003)

- **Spec Origen:** `specs/003_autoregistro_import_bare_spec.md`
- **Verificador Asociado:** `specs/003_autoregistro_import_bare_verificador.md`
- **Estado:** `PLANIFICADO`
- **Dependencias:** ninguna declarada en la spec. La tarea no modifica nada de lo que verifican las Specs 001 y 002, pero `003-CHK-10` y `003-CHK-99` reejecutan la suite completa para detectar regresiones.
- **Precondición de ejecución:** todos los comandos, `.seb/bin/seb verify` incluido, se ejecutan dentro del dev shell (`nix develop` o direnv), con `npm install` ya ejecutado (ver `MEMORY.md` sección 3). Los tests nuevos usan los binarios `npm` y `tar` del dev shell.
- **Fuente única de verificación:** la tabla de `specs/003_autoregistro_import_bare_verificador.md`, ejecutada por `.seb/bin/seb verify autoregistro_import_bare`. Esta tarea no crea, modifica ni configura hooks (`MEMORY.md` D-03).

## 1. Resumen Arquitectónico y Aislamiento de Lógica

**Causa raíz (verificada empíricamente en un directorio temporal, sin tocar el repositorio):** `package.json#sideEffects` declara `["**/*.css", "./src/index.js"]`, pero el paquete se consume desde los artefactos compilados. Vite/Rollup trata el artefacto ESM como libre de efectos y, ante un import bare, descarta el bloque de auto-registro. Resultado medido: bundle de 36 bytes y etiqueta sin definir; con `./dist/*.js` añadido, 11 603 bytes y etiqueta definida, en enlace local y en paquete empaquetado.

**Cambio de código:** una única línea del manifiesto (`package.json#sideEffects`). No se toca `src/`, `vite.config.js`, `docs/`, `DESIGN.md` ni la API pública.

**Verificación en tres capas** (todo dentro de `tests/package/`, ejecutado por `npm test`):

1. **Harness (`harness.js`, no es un `.test.js`):** construye la librería con la `vite.config.js` real hacia un directorio temporal, arma el "paquete publicado" (manifiesto real + `src` + salida compilada), lo instala en un proyecto consumidor mínimo por las dos modalidades de la spec (enlace simbólico y tarball de `npm pack` extraído con `tar`), compila el consumidor con Vite en modo producción y ejecuta el bundle en un `Window` nuevo de happy-dom.
2. **Tests por requisito:** un archivo por grupo de requisitos, con mensajes de aserción fijos (sección 3.4) para que el verificador distinga un fallo real de uno de infraestructura.
3. **Controles de caja negra en el verificador:** copian el repositorio a un directorio temporal, introducen la mutación que rompe el requisito y exigen que el test falle con el mensaje esperado. Así el contrato no depende de que los tests propios sean honestos.

**Aislamiento respecto de la Spec 001 (`001-RF-22`, `001-CHK-05`):** los tests no requieren compilación previa ni referencian artefactos compilados del repositorio: construyen la librería ellos mismos en un directorio temporal y nunca escriben la cadena `dist/` (se usa `join(directorio, 'dist')`). Ningún test escribe dentro del repositorio (`003-CHK-08` lo comprueba).

## 2. Mapa de Archivos a Crear o Modificar

| Archivo / Ruta | Acción | Responsabilidad Técnica | Requisitos Cubiertos |
| :--- | :--- | :--- | :--- |
| `package.json` | `MODIFICAR` | Añadir `./dist/*.js` a `sideEffects`. Es el único cambio de código de la tarea | `003-RF-01`, `003-RF-02`, `003-RF-03`, `003-RF-06` |
| `tests/package/harness.js` | `CREAR` | Construcción de la librería, paquete publicado simulado, instalación del consumidor, compilación del consumidor y ejecución en happy-dom | `003-RF-01` a `003-RF-07`, `003-RNF-01` |
| `tests/package/consumer-bare-import.test.js` | `CREAR` | Import bare en ambas modalidades: inclusión en el bundle y registro; control negativo del harness | `003-RF-01`, `003-RF-02` |
| `tests/package/consumer-named-imports.test.js` | `CREAR` | Exports con nombre en ambas modalidades; solo clase referenciada; importación múltiple | `003-RF-03`, `003-CL-01`, `003-CL-02` |
| `tests/package/registration-idempotence.test.js` | `CREAR` | Etiqueta ya definida, doble carga y registro repetido sin excepción | `003-RF-04`, `003-CL-01` |
| `tests/package/ssr-entry-points.test.js` | `CREAR` | Importación sin DOM del punto de entrada ESM (proceso node limpio) y del UMD (contexto vacío) | `003-RF-05` |
| `tests/package/umd-classic-script.test.js` | `CREAR` | UMD evaluado como script clásico en happy-dom | `003-RF-06` |
| `tests/package/public-api.test.js` | `CREAR` | Exports con nombre, global UMD, mapa de exports, nombres de artefactos y especificadores publicados | `003-RF-07` |
| `MEMORY.md` | `MODIFICAR` | Entrada ya registrada por el planificador; el implementador solo añade hallazgos nuevos | Sección F de la constitución |

**No se modifican:** `src/`, `docs/`, `DESIGN.md`, `vite.config.js`, `vitest.config.js`, `stylelint.config.js`, `tools/`, `package-lock.json`, `.agents/`, la configuración de git, los tests de las Specs 001 y 002, ni `docs/constitution.md`.

## 3. Contratos, Firmas y Modelo de Datos

### 3.1 Cambio en `package.json`

```json
"sideEffects": [
  "**/*.css",
  "./src/index.js",
  "./dist/*.js"
]
```

Cubre `semiotic-ui.es.js` y `semiotic-ui.umd.js`. Los `.map` no son JavaScript ejecutable y quedan fuera. Probado en el experimento aislado con esta forma exacta (enlace local y tarball).

### 3.2 API del harness (`tests/package/harness.js`)

```js
export const repoRoot;                 // raiz del repositorio, derivada de import.meta.url (permite copiar el repo para los controles de caja negra)
export const MODALITIES;               // ['link', 'tarball']

// Compila la libreria con la vite.config.js real hacia un directorio temporal. Devuelve la ruta de salida.
// build({ configFile, configLoader: 'runner', root: repoRoot, logLevel: 'silent', build: { outDir, emptyOutDir: true } })
export async function buildLibrary();

// Arma el paquete publicado: package.json real (aplicando 'overrides' opcionales), src y salida compilada como carpeta de distribucion.
export function stagePackage(libraryOutDir, overrides);

// Crea un consumidor con node_modules/semiotic-ui obtenido por 'link' (symlink) o 'tarball' (npm pack --offline + tar --strip-components=1).
export function installConsumer(stageDir, modality);

// Compila main.js del consumidor con Vite en produccion (minify por defecto) y salida iife para poder ejecutarla.
// Devuelve el codigo del bundle como texto.
export async function bundleConsumer(consumerDir, source);

// Ejecuta codigo en un Window nuevo de happy-dom; 'before' permite preparar el registro antes de ejecutar.
export function runInWindow(code, before);

export function cleanup();             // elimina los directorios temporales creados
```

Reglas del harness:

- El consumidor nunca contiene el literal `semiotic-alert` en su propio código; así su presencia en el bundle prueba que el componente fue incluido (`003-RF-01`).
- Cada ejecución usa un `Window` nuevo, para que el registro de un escenario no contamine al siguiente.
- `npm pack` se invoca con `npm_config_offline=true` y `npm_config_update_notifier=false`. No se ejecuta `npm install` ni se accede a red (`003-RNF-01`).
- Todos los directorios temporales viven bajo el directorio temporal del sistema. Nada se escribe en el repositorio.
- Ningún archivo bajo `tests/` contiene la cadena `dist/`.

### 3.3 Escenarios por archivo de test

| Archivo | Tests (mínimo) | Contenido |
| :--- | :--- | :--- |
| `consumer-bare-import.test.js` | 5 | Por cada modalidad: (a) el bundle del consumidor `import 'semiotic-ui'` contiene `semiotic-alert`; (b) tras ejecutarlo, `customElements.get('semiotic-alert')` es una función y un elemento creado tiene `shadowRoot`. Más un **control negativo**: un paquete publicado con el `sideEffects` anterior (sin entradas de distribución) produce un bundle sin el componente |
| `consumer-named-imports.test.js` | 5 | Por cada modalidad: `import { registerAll }` más llamada, y solo `import { SemioticAlert }` referenciada sin llamar al registro (`003-CL-02`). Más: importación bare, con nombre y `registerAll()` repetido en el mismo bundle define la etiqueta una única vez (`003-CL-01`) |
| `registration-idempotence.test.js` | 3 | Etiqueta definida previamente con otra clase: cargar el bundle no lanza y se conserva la definición previa; el mismo bundle evaluado dos veces en el mismo `Window` no lanza y `define` se invoca una vez; consumidor con `registerAll()` repetido no lanza |
| `ssr-entry-points.test.js` | 2 | ESM: proceso `node` hijo con `cwd` en el paquete publicado que hace `await import('semiotic-ui')`: sale con 0, expone `registerAll` y `typeof customElements` es `undefined`. UMD: el texto del artefacto se ejecuta con `vm.runInNewContext` en un contexto vacío: no lanza, expone `SemioticUI.registerAll` y no crea `customElements` |
| `umd-classic-script.test.js` | 2 | El texto del UMD evaluado con `window.eval` en un `Window` nuevo deja `semiotic-alert` definida; el global `SemioticUI` expone `registerAll` |
| `public-api.test.js` | 5 | Claves del módulo ESM exactamente `SemioticAlert`, `registerAll`, `registerSemioticAlert`; claves del global UMD iguales; mapa de exports con las claves `.`, `./css`, `./tokens.css` y sus destinos; existencia de `semiotic-ui.es.js`, `semiotic-ui.umd.js` y `semiotic-ui.css` en el paquete publicado; los especificadores `semiotic-ui/css` y `semiotic-ui/tokens.css` resuelven a archivos existentes |

Cada archivo declara `// @vitest-environment node`. Los `Window` se crean explícitamente con `import { Window } from 'happy-dom'` y se cierran con `window.happyDOM.close()` en `afterEach`.

### 3.4 Mensajes de aserción (contrato con el verificador)

Toda aserción usa la forma `expect(valor, 'mensaje')`. Los verificadores de caja negra buscan estas cadenas en la salida de Vitest:

| Mensaje | Se usa en | Significa |
| :--- | :--- | :--- |
| `component-not-included` | `consumer-bare-import`, `consumer-named-imports` | El bundle no contiene el código de `semiotic-alert` |
| `tag-not-defined` | `consumer-bare-import`, `consumer-named-imports`, `umd-classic-script` | La etiqueta no quedó definida tras ejecutar |
| `idempotence-broken` | `registration-idempotence`, `consumer-named-imports` | Doble definición, excepción o definición previa reemplazada |
| `ssr-import-threw` | `ssr-entry-points` | Importar sin DOM lanzó excepción o registró algo |
| `public-api-changed` | `public-api` | Cambió algún nombre de la API pública o de los artefactos |

## 4. Decisiones Técnicas Justificadas

- **Decisión 1: añadir `./dist/*.js` a `sideEffects` (un cambio de una línea).** Mantiene la intención original del manifiesto (marcar CSS y entrada como con efectos) y conserva el tree-shaking de los demás módulos.
  - _Alternativa descartada:_ eliminar el campo o ponerlo en `true`. Funciona, pero declara efectos secundarios en todo el paquete y pierde la señal explícita del manifiesto.
  - _Alternativa descartada:_ registro opt-in (solo `registerAll()`). Cambia el contrato público y requiere bump mayor; la spec lo declara fuera de alcance.
- **Decisión 2: los tests compilan la librería ellos mismos hacia un directorio temporal.** Cumple `001-RF-22` (los tests no requieren compilación previa), evita depender de qué tan reciente sea la carpeta compilada del repositorio y no obliga a que `npm test` corra después de `npm run build`.
  - _Alternativa descartada:_ leer la carpeta compilada del repositorio. Contradice `001-RF-22` y volvería frágil `001-CHK-01`.
- **Decisión 3: el paquete publicado se simula con manifiesto real, `src` y salida compilada, y se consume por enlace simbólico y por `npm pack` más extracción con `tar`.** Reproduce las dos modalidades de la spec sin red. El tarball respeta la lista `files` del manifiesto, que es lo que recibiría un consumidor.
  - _Alternativa descartada:_ `npm install ./tarball` en el consumidor. Necesita resolver `vite` y sus dependencias desde el registro: viola `003-RNF-01` (sin red).
  - _Alternativa descartada:_ enlazar la raíz del repositorio. Depende de que la carpeta compilada exista y esté al día.
- **Decisión 4: el consumidor se compila con Vite en modo producción y formato de salida `iife`.** El formato solo afecta a la serialización: la decisión de tree-shaking se toma antes. `iife` permite ejecutar el resultado con `Window.eval` de happy-dom sin sistema de módulos.
  - _Alternativa descartada:_ navegador real o Playwright. Excluido por decisión del humano (happy-dom) y por `001-RNF-06`.
- **Decisión 5: controles de caja negra por mutación en el verificador.** Siguen el patrón de la Spec 002: el repositorio se copia a un directorio temporal, se aplica una alteración real y se exige que el test falle con el mensaje esperado. Así `003-CHK-02` demuestra que revertir el manifiesto rompe el test, no solo que los tests actuales pasan.
  - _Alternativa descartada:_ confiar solo en los tests escritos por el implementador. Es el escenario de reward-hacking que el harness busca impedir.
- **Decisión 6: `configLoader: 'runner'` al cargar `vite.config.js` desde el harness.** Evita que Vite escriba un archivo temporal junto a la configuración dentro del repositorio. Si la versión instalada no lo aceptara, se usa `'native'`; no se admite ninguna opción que deje residuos (`003-CHK-08` los detecta).
- **Estado de partida (honestidad del ciclo TDD):** solo los escenarios de import bare y de clase sin registro (`003-RF-01`, `003-RF-02`, `003-CL-02`) están en rojo antes del cambio. Los de `003-RF-03` a `003-RF-07` y `003-CL-01` ya pasan hoy: son protección contra regresiones y su capacidad de detección se prueba con las mutaciones del verificador.

## 5. Secuencia de Tareas Atómicas (TDD: Test en Rojo -> Código -> Test en Verde)

_Regla para el Agente Implementador: ejecuta UNA tarea a la vez en orden. Está prohibido editar `docs/constitution.md`, `specs/003_*_spec.md` y `specs/003_*_verificador.md`, y debilitar un test para que pase. Ningún archivo bajo `tests/` puede contener la cadena `dist/`._

- [ ] **T1. Harness y tests de import bare en rojo** (`003-RF-01`, `003-RF-02`)
  - _Archivos:_ `tests/package/harness.js`, `tests/package/consumer-bare-import.test.js`
  - _Hecho cuando:_ `vitest run tests/package/consumer-bare-import.test.js` falla únicamente por `component-not-included` y `tag-not-defined` en los escenarios de import bare (rojo esperado), y el control negativo pasa.
- [ ] **T2. Corregir `sideEffects`** (`003-RF-01`, `003-RF-02`)
  - _Archivos:_ `package.json`
  - _Hecho cuando:_ los comandos `003-CHK-01` y `003-CHK-02` de `specs/003_autoregistro_import_bare_verificador.md` devuelven exit code `0`.
- [ ] **T3. Tests de exports con nombre, clase sola e importación múltiple** (`003-RF-03`, `003-CL-01`, `003-CL-02`)
  - _Archivos:_ `tests/package/consumer-named-imports.test.js`
  - _Hecho cuando:_ el comando `003-CHK-03` devuelve exit code `0`.
- [ ] **T4. Tests de idempotencia del registro** (`003-RF-04`)
  - _Archivos:_ `tests/package/registration-idempotence.test.js`
  - _Hecho cuando:_ el comando `003-CHK-04` devuelve exit code `0`.
- [ ] **T5. Tests SSR de los puntos de entrada ESM y UMD** (`003-RF-05`)
  - _Archivos:_ `tests/package/ssr-entry-points.test.js`
  - _Hecho cuando:_ el comando `003-CHK-05` devuelve exit code `0`.
- [ ] **T6. Tests del UMD como script clásico** (`003-RF-06`)
  - _Archivos:_ `tests/package/umd-classic-script.test.js`
  - _Hecho cuando:_ el comando `003-CHK-06` devuelve exit code `0`.
- [ ] **T7. Tests de API pública sin cambios** (`003-RF-07`)
  - _Archivos:_ `tests/package/public-api.test.js`
  - _Hecho cuando:_ el comando `003-CHK-07` devuelve exit code `0`.
- [ ] **T8. Requisitos no funcionales y no regresión** (`003-RNF-01`, `003-RNF-02`, `003-RNF-03`)
  - _Archivos:_ ninguno nuevo; se corrigen los tests de `tests/package/` si algún control falla (sin relajarlos). Registrar en `MEMORY.md` cualquier hallazgo adicional con `seb memory-add`.
  - _Hecho cuando:_ los comandos `003-CHK-08`, `003-CHK-09`, `003-CHK-10` y `003-CHK-99` devuelven exit code `0` y `.seb/bin/seb verify autoregistro_import_bare` reporta el 100 % en `[PASA]`.
