# MEMORY.md — Bitácora Técnica y Restricciones (seb-harness)

> **Regla de Higiene de Contexto:** Este archivo almacena lo aprendido empíricamente en el proyecto entre sesiones.
> - **Límite duro:** Máximo 150 líneas (~15 KB). Resume o elimina entradas obsoletas.
> - **Promoción:** Si un aprendizaje se vuelve una ley permanente de arquitectura, muévelo a `docs/constitution.md`.
> - **Seguridad:** Prohibido guardar credenciales, tokens, rutas privadas del host o datos personales.
> - **Invariante del Agente:** Antes de proponer un diseño en `seb-planificador` o escribir código, verifica las secciones 2 y 3 para no reintentar enfoques fallidos.

## 1. Estado Actual del Proyecto
- **Fase SDD activa:** Constitución generada (`docs/constitution.md`, 2026-11-19). Lista para `seb-especificador`.
- **Código existente (previo a seb):** tokens, `base.css`, `.sm-btn`, `.sm-card`, `<semiotic-alert>` y sitio Astro con página inicial. Sin specs asociadas.
- **Última Spec verificada:** Ninguna.
- **Estado de la suite de verificación:** Pendiente de primera ejecución con `.seb/bin/seb verify`.

## 2. Callejones sin Salida y Enfoques Descartados (NO REINTENTAR)
*Registro de librerías, patrones o configuraciones que se probaron en este proyecto y fallaron o resultaron incompatibles.*
- *(Vacío inicialmente — Formato requerido: `[Fecha] [Tarea/Spec] Qué se intentó -> Por qué falló -> Alternativa adoptada`)*

## 3. Restricciones Técnicas y Trampas Conocidas (Gotchas)
*Limitaciones del entorno (NixOS, kernel, contenedores, base de datos, versiones del compilador/runtime) o del dominio que no son obvias leyendo el código.*
- [Tooling] No existe runner de tests ni linter instalado -> Los verificadores deben basarse en `npm run build`, `npm run docs:build` y comprobaciones `test`/`grep`/`node` sin dependencias sobre `dist/` y `src/`.
- [docs] `npm --workspace=docs run check` (`astro check`) requiere `@astrojs/check` + `typescript`, no instalados -> No usar en verificadores hasta que una spec apruebe esas devDependencies.
- [Entorno NixOS] Node.js 22 solo está disponible dentro de `nix develop` / direnv (`.envrc`); el host no tiene `python3` -> Los scripts de verificación deben usar `node`, `bash`, `grep` o `test`.

## 4. Riesgos Conocidos y Deuda Técnica Activa
*Riesgos arquitectónicos o casos borde postergados conscientemente para futuras specs.*
- [sin-spec] El código preexistente (`.sm-btn`, `.sm-card`, `<semiotic-alert>`) nunca pasó por `seb verify` -> Mitigar con una spec de línea base que formalice y verifique el estado actual.
- [sin-spec] `badges.css` y `forms.css` figuran en el prompt fundacional pero no existen -> Pendientes de specs propias.

## 5. Decisiones Técnicas Relevantes (Histórico Reciente)
- [D-01] Artefactos `semiotic-ui.css`, `semiotic-ui.es.js`, `semiotic-ui.umd.js` (ya minificados) -> Descartados los nombres `semiotic-ui.min.css`/`.min.js` del prompt fundacional -> Es el contrato real de `vite.config.js` y `package.json#exports`.
- [D-02] `AGENTS.pre-seb.md` asimilado en `docs/constitution.md` (secciones B-E) -> No se mantiene un `AGENT.md` paralelo -> Evitar split-brain de reglas.
