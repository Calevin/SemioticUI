# MEMORY.md — Bitácora Técnica y Restricciones (seb-harness)

> **Regla de Higiene de Contexto:** Este archivo almacena lo aprendido empíricamente en el proyecto entre sesiones.
> - **Límite duro:** Máximo 150 líneas (~15 KB). Resume o elimina entradas obsoletas.
> - **Promoción:** Si un aprendizaje se vuelve una ley permanente de arquitectura, muévelo a `docs/constitution.md`.
> - **Seguridad:** Prohibido guardar credenciales, tokens, rutas privadas del host o datos personales.
> - **Invariante del Agente:** Antes de proponer un diseño en `seb-planificador` o escribir código, verifica las secciones 2 y 3 para no reintentar enfoques fallidos.

## 1. Estado Actual del Proyecto
- **Fase SDD activa:** Spec 002 (`coherencia_documento_diseno`) implementada; `seb verify` 32/32 `[PASA]` (2026-11-19). Pendiente de commit.
- **Código existente (previo a seb):** tokens, `base.css`, `.sm-btn`, `.sm-card`, `<semiotic-alert>` y sitio Astro con página inicial. `<semiotic-alert>` queda cubierto por los tests de línea base de la Spec 001.
- **Última Spec verificada:** 002 (`seb verify` 32/32 `[PASA]`, unos 30 s). La 001 sigue verificada (32/32).
- **Estado de la suite de verificación:** `npm run quality` en verde; 224 tests Vitest (130 de la 001 + 94 de la 002).

## 2. Callejones sin Salida y Enfoques Descartados (NO REINTENTAR)
*Registro de librerías, patrones o configuraciones que se probaron en este proyecto y fallaron o resultaron incompatibles.*
- *(Vacío inicialmente — Formato requerido: `[Fecha] [Tarea/Spec] Qué se intentó -> Por qué falló -> Alternativa adoptada`)*

## 3. Restricciones Técnicas y Trampas Conocidas (Gotchas)
*Limitaciones del entorno (NixOS, kernel, contenedores, base de datos, versiones del compilador/runtime) o del dominio que no son obvias leyendo el código.*
- [Tooling] Comandos oficiales desde la Spec 001: `npm test` (Vitest + happy-dom), `npm run lint:css` (Stylelint + plugin local `semiotic/*`), `npm run quality` (build + test + lint). Requieren el dev shell.
- [docs] `npm --workspace=docs run check` (`astro check`) requiere `@astrojs/check` + `typescript`, no instalados -> No usar en verificadores hasta que una spec apruebe esas devDependencies.
- [Entorno NixOS] Node.js 22 solo está disponible dentro de `nix develop` / direnv (`.envrc`); el host no tiene `python3` -> Los scripts de verificación deben usar `node`, `bash`, `grep` o `test`.

- [Vitest 5] `vitest run -t "<filtro>"` sin coincidencias sale con `0` (control vacío); un archivo inexistente o sin tests sale con `1` -> Los verificadores filtran por archivo y exigen `numPassedTests === numTotalTests` en el reporte JSON.
- [seb verify] Los comandos viven dentro de una tabla Markdown -> Prohibido el carácter de tubería (incluido el OR lógico de shell) y los backticks dentro del comando; usar `if ...; then ...; fi`.
- [Stylelint 18] Con `stylelint-config-standard@41`, el CSS de la línea base `6fa86a0` da 20 violaciones de estilo (líneas vacías, `no-descending-specificity`, `value-keyword-case` en nombres de fuente) y ninguna de 001-RF-13 a 001-RF-18 -> Se resuelven ajustando la config, no el CSS.
- [Stylelint 18] `length-zero-no-unit` (config estándar) rechaza `0px` aunque la regla de radio lo permita -> En tests de "acepta X" afirmar solo la ausencia de la regla bajo prueba, no `errored === false`.
- **[2026-11-19] [Restricciones Técnicas]** [002] DESIGN.md tiene un contrato de formato verificado por tests/design-doc/coherence.test.js: version unica semiotic-ui@X.Y.Z en el encabezado; tablas Token / Valor claro / Valor oscuro con un token por fila y referencias completas var(--sm-...); inventario entre <!-- design-check:inventory --> y su cierre, con tablas Clase, Custom Element, Atributo, Evento, Parte, Slot y Exportacion; prohibidos los modificadores abreviados (--primary). Ver specs/002_coherencia_documento_diseno_plan.md seccion 3.3.
- **[2026-11-19] [Restricciones Técnicas]** [Vitest 5] El reporter JSON incluye testResults[].name (ruta absoluta), status, startTime y endTime por archivo, y el mensaje de expect(valor, mensaje) se imprime completo sin truncar: sirve para controles de caja negra con grep.

## 4. Riesgos Conocidos y Deuda Técnica Activa
*Riesgos arquitectónicos o casos borde postergados conscientemente para futuras specs.*
- [sin-spec] El código preexistente (`.sm-btn`, `.sm-card`, `<semiotic-alert>`) nunca pasó por `seb verify` -> Mitigar con una spec de línea base que formalice y verifique el estado actual.
- [001] `semiotic/no-blurred-shadow` no detecta un blur expresado con `var()` (ej. `2px 2px var(--b) red`): un `var()` dentro de una capa se trata como color porque su rol no se deduce del valor -> Mitigación vigente: los tokens de sombra (`--*shadow*`) se validan donde se declaran.
- [sin-spec] `badges.css` y `forms.css` figuran en el prompt fundacional pero no existen -> Pendientes de specs propias.
- **[2026-11-19] [Deuda Técnica / Scope Fork]** Spec 002: Funcionalidad de distribuir DESIGN.md dentro del paquete npm (package.json#files) excluida; los consumidores lo copian a mano y puede desalinearse de la versión instalada; requiere spec futura.

## 5. Decisiones Técnicas Relevantes (Histórico Reciente)
- [D-01] Artefactos `semiotic-ui.css`, `semiotic-ui.es.js`, `semiotic-ui.umd.js` (ya minificados) -> Descartados los nombres `semiotic-ui.min.css`/`.min.js` del prompt fundacional -> Es el contrato real de `vite.config.js` y `package.json#exports`.
- [D-03] Ninguna spec crea, modifica ni configura hooks (de git: `.git/hooks`, `core.hooksPath`; ni de agentes: `.agents/hooks`, `hooks.json`) -> Descartado enganchar la Puerta de Calidad al pre-commit (Spec 001, retirada en clarificación) -> Decisión del humano: la verificación se hace exclusivamente con los comandos de la tabla de `specs/<NNN>_<tarea>_verificador.md` vía `seb verify`.
- [D-02] `AGENTS.pre-seb.md` asimilado en `docs/constitution.md` (secciones B-E) -> No se mantiene un `AGENT.md` paralelo -> Evitar split-brain de reglas.
- **[2026-11-19] [Decisiones Técnicas]** [001] Tests de línea base contra src/ (no dist/) con happy-dom; importar src/index.js fuera del ejecutor de tests falla por los imports de CSS, por eso 001-RF-05 se evalúa dentro de Vitest en entorno node.
- **[2026-11-19] [Decisiones Técnicas]** [002] DESIGN.md (documento de diseño para agentes de IA) queda bajo verificación automática dentro de npm test: todo cambio de tokens, clases .sm-*, Custom Elements, atributos, eventos, partes, slots o exportaciones obliga a actualizarlo. Pendiente: el humano debe enmendar docs/constitution.md sección D (flujo obligatorio de creación de componentes) para incluir la actualización de DESIGN.md.
