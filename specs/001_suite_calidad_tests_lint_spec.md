# Spec 001 — Suite de Calidad: Tests Automatizados y Lint de Estilos

- **Tarea ID:** `001`
- **Identificador:** `suite_calidad_tests_lint`
- **Origen:** Prosa ("Empecemos agregando test, usemos vitest y también Stylelint")
- **Estado:** `APROBADA`
- **Afecta-UC:** `ninguno`

## 1. Contexto y Objetivo (El POR QUÉ)

Hoy el proyecto no tiene tests automatizados ni análisis estático de estilos. Por eso, los verificadores de `seb-harness` solo pueden comprobar que la compilación termine bien y que se generen los artefactos. Las reglas visuales y de compatibilidad de la constitución (radio `0px`, sombras sin difuminado, sin selector universal, SSR-safety, normalización de atributos, eventos `sm-*`) solo se revisan a ojo. Esta tarea agrega comandos de calidad deterministas, con tests de comportamiento y lint de estilos, que los verificadores de cada spec pueden invocar. Así, las specs siguientes van a poder apoyarse en verificación programática real, y baja la deuda de código existente sin verificar.

## 2. Actores y Usuarios

- **Desarrollador del Design System:** ejecuta tests y lint en local, dentro del entorno reproducible NixOS.
- **Agente `seb-verificador` / `.seb/bin/seb verify`:** ejecuta los comandos de la tabla del verificador y toma sus códigos de salida como única evidencia determinista.

## 3. Historias de Usuario

- **001-HU-01:** Como `desarrollador del Design System`, quiero ejecutar con un solo comando los tests de comportamiento de la librería para detectar regresiones en los Web Components antes de publicar.
- **001-HU-02:** Como `desarrollador del Design System`, quiero que el lint de estilos rechace las violaciones al lenguaje visual del Semiotic Standard para no depender de la revisión visual.
- **001-HU-03:** Como `agente seb-verificador`, quiero comandos con código de salida determinista para usarlos como evidencia en los verificadores de cualquier spec futura.

## 4. Definiciones de Dominio (Opcional)

- **Puerta de Calidad:** comando que agrupa la compilación de la librería, los tests y el lint de estilos, ejecutados en ese orden. Termina con código `0` solo si los tres terminan bien.
- **Hoja de estilos pública:** todo archivo CSS fuente de la librería que forma parte del CSS unificado distribuido.
- **Hoja de tokens:** la hoja de estilos pública que define la paleta literal y los tokens semánticos `--sm-*`.
- **Entorno sin navegador:** entorno del ejecutor de tests sobre Node.js donde no existen `window`, `document`, `HTMLElement` ni `customElements`, igual que en Astro SSR.
- **Entorno DOM simulado:** entorno del ejecutor de tests que provee `happy-dom`, con las APIs de Custom Elements y Shadow DOM.
- **Valor de radio permitido:** `0`, `0px` o una referencia `var(--sm-radius)` (con o sin fallback igual a `0`/`0px`).
- **Propiedad de radio:** `border-radius` y todas sus variantes por esquina, físicas (`border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`) y lógicas (`border-start-start-radius`, `border-start-end-radius`, `border-end-start-radius`, `border-end-end-radius`).
- **Sombra difuminada:** valor de `box-shadow` o `text-shadow`, o función `drop-shadow()` dentro de `filter` o `backdrop-filter`, cuyo radio de difuminado (blur) sea distinto de `0`. Un radio de difuminado omitido equivale a `0`.
- **Atributo de texto renderizado:** todo atributo público de un Web Component cuyo valor se muestra como contenido textual en su Shadow DOM. En `<semiotic-alert>` son `heading` y `code`.
- **CSS de línea base:** el CSS unificado compilado a partir del commit en el que se aprobó esta spec, antes de cualquier cambio de implementación.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

### 5.1 Ejecución de tests

- **001-RF-01 (Event-Driven):** CUANDO el desarrollador ejecute el comando oficial de tests y todos los tests pasen, EL SISTEMA DEBE terminar con código de salida `0`.
- **001-RF-02 (Unwanted Behavior):** SI al menos un test falla o lanza un error no capturado, ENTONCES EL SISTEMA DEBE terminar el comando oficial de tests con un código de salida distinto de `0`.
- **001-RF-03 (Unwanted Behavior):** SI el comando oficial de tests no encuentra ningún archivo de test, ENTONCES EL SISTEMA DEBE terminar con un código de salida distinto de `0`.
- **001-RF-04 (Ubiquitous):** EL SISTEMA DEBE ejecutar el comando oficial de tests en una sola pasada, sin interacción y sin modo watch, de modo que termine sin intervención humana.
- **001-RF-22 (Ubiquitous):** EL SISTEMA DEBE ejecutar los tests de línea base contra el código fuente de la librería, sin requerir una compilación previa de los artefactos distribuidos.

### 5.2 Tests de línea base sobre el código existente

- **001-RF-05 (Event-Driven):** CUANDO se importe el punto de entrada del código fuente de la librería en un entorno sin navegador, EL SISTEMA DEBE completar la importación sin lanzar error.
- **001-RF-06 (Event-Driven):** CUANDO se invoque dos veces seguidas la función de registro global en un entorno DOM simulado, EL SISTEMA DEBE dejar `semiotic-alert` registrado sin lanzar error.
- **001-RF-07 (Unwanted Behavior):** SI `<semiotic-alert>` recibe en el atributo `variant` un valor fuera del conjunto `info`, `success`, `warning`, `danger`, ENTONCES EL SISTEMA DEBE comportarse como la variante `info`. Un test debe verificarlo.
- **001-RF-08 (Event-Driven):** CUANDO se pida cerrar una `<semiotic-alert>`, EL SISTEMA DEBE emitir un evento `sm-dismiss` con `bubbles`, `composed` y `cancelable` en `true`. Un test debe verificarlo.
- **001-RF-09 (Unwanted Behavior):** SI un listener de `sm-dismiss` invoca `preventDefault()`, ENTONCES EL SISTEMA DEBE mantener visible la `<semiotic-alert>`, sin el atributo `dismissed`. Un test debe verificarlo.
- **001-RF-10 (Event-Driven):** CUANDO un atributo de texto renderizado de `<semiotic-alert>` reciba un valor con marcado HTML (por ejemplo `<img src=x onerror=alert(1)>`), EL SISTEMA DEBE mostrar ese valor como texto literal, sin crear elementos nuevos en el Shadow DOM. Un test por cada atributo de texto renderizado debe verificarlo.

### 5.3 Lint de estilos

- **001-RF-11 (Event-Driven):** CUANDO el desarrollador ejecute el comando oficial de lint de estilos y ninguna hoja de estilos pública tenga violaciones, EL SISTEMA DEBE terminar con código de salida `0`.
- **001-RF-12 (Unwanted Behavior):** SI una hoja de estilos pública contiene al menos una violación de lint, ENTONCES EL SISTEMA DEBE terminar el comando oficial de lint con un código de salida distinto de `0` e informar archivo, línea y regla incumplida.
- **001-RF-13 (Unwanted Behavior):** SI una declaración de una propiedad de radio usa un valor que no es un valor de radio permitido, ENTONCES EL SISTEMA DEBE reportarla como violación de lint.
- **001-RF-14 (Unwanted Behavior):** SI una declaración contiene una sombra difuminada, ENTONCES EL SISTEMA DEBE reportarla como violación de lint.
- **001-RF-15 (Unwanted Behavior):** SI una hoja de estilos pública usa el selector universal `*` o la pseudo-clase `:host-context()`, ENTONCES EL SISTEMA DEBE reportarlo como violación de lint.
- **001-RF-16 (Unwanted Behavior):** SI una clase CSS definida en una hoja de estilos pública no sigue el patrón `sm-<bloque>[-<elemento>][--<modificador>]` en kebab-case, ENTONCES EL SISTEMA DEBE reportarla como violación de lint.
- **001-RF-17 (Unwanted Behavior):** SI una Custom Property declarada en una hoja de estilos pública no empieza con `--sm-` ni con `--_`, ENTONCES EL SISTEMA DEBE reportarla como violación de lint.
- **001-RF-18 (Unwanted Behavior):** SI una hoja de estilos pública que no sea la hoja de tokens usa un color hexadecimal literal fuera del fallback de un `var()`, ENTONCES EL SISTEMA DEBE reportarlo como violación de lint.
- **001-RF-23 (Ubiquitous):** EL SISTEMA DEBE aplicar las reglas `001-RF-14` y `001-RF-18` como reglas del mismo comando oficial de lint de estilos, implementadas con código propio del repositorio y sin dependencias externas adicionales.

### 5.4 Puerta de calidad y estado inicial

- **001-RF-19 (Event-Driven):** CUANDO el desarrollador ejecute el comando oficial de la Puerta de Calidad, EL SISTEMA DEBE ejecutar en orden compilación, tests y lint de estilos, y terminar con código `0` solo si los tres terminan con código `0`.
- **001-RF-20 (Unwanted Behavior):** SI una etapa de la Puerta de Calidad falla, ENTONCES EL SISTEMA DEBE terminar con un código de salida distinto de `0` sin ejecutar las etapas siguientes.
- **001-RF-21 (State-Driven):** MIENTRAS el repositorio esté en el estado que deja esta tarea, EL SISTEMA DEBE pasar la Puerta de Calidad completa con código `0` sobre el código existente (`.sm-btn`, `.sm-card`, tokens, base y `<semiotic-alert>`).
- **001-RF-26 (Unwanted Behavior):** SI el CSS unificado compilado al final de la tarea difiere del CSS de línea base, ENTONCES EL SISTEMA DEBE permitir solo diferencias que figuren, una por una, en una lista explícita de correcciones, cada una asociada a la regla de lint que la motiva. Cualquier selector agregado o eliminado, o declaración modificada que no esté en esa lista, se considera fallo.

## 6. Requisitos No Funcionales (Verificables)

- **001-RNF-01 (Aprobación de dependencias):** Esta spec autoriza explícitamente agregar como dependencias de **desarrollo** exclusivamente `vitest`, `happy-dom`, `stylelint` y `stylelint-config-standard`. Ninguna otra dependencia queda aprobada.
- **001-RNF-02 (Cero dependencias en runtime):** La lista de dependencias de runtime del paquete de la librería debe seguir vacía o ausente al terminar esta tarea.
- **001-RNF-03 (Artefacto distribuido intacto):** Los artefactos distribuidos (ES, UMD y CSS) no deben incluir código, configuración ni archivos de test o de lint.
- **001-RNF-04 (Determinismo):** Dos ejecuciones consecutivas de la Puerta de Calidad sobre el mismo commit deben dar el mismo código de salida, sin acceso a red durante tests ni lint.
- **001-RNF-05 (Tiempo):** El comando oficial de tests debe completar la línea base en menos de 30 segundos en el entorno de desarrollo NixOS (Node.js 22).
- **001-RNF-06 (Entorno):** Todos los comandos oficiales deben funcionar dentro del dev shell de `flake.nix` sin binarios de sistema adicionales (sin descargar navegadores ni depender de `python3`).
- **001-RNF-07 (Configuración base de lint):** Las reglas heredadas de `stylelint-config-standard` pueden desactivarse o ajustarse cuando choquen con el CSS existente o con las convenciones de la constitución. Ningún ajuste puede desactivar ni relajar las reglas de `001-RF-13` a `001-RF-18`.

## 7. Casos Límite (Edge Cases)

- **001-CL-01 (Valores vacíos):** Una hoja de estilos pública vacía o sin reglas no debe producir violaciones ni hacer fallar el lint.
- **001-CL-02 (Fallbacks en `var()`):** Las sombras difuminadas están prohibidas también dentro del fallback de un `var(--sm-*, <fallback>)`. Los colores hexadecimales, en cambio, solo se permiten como fallback.
- **001-CL-03 (Sombra neutra):** El token `--sm-shadow-none: 0 0 0 0 transparent` y el valor `none` no deben reportarse como violación.
- **001-CL-04 (Valores múltiples):** Una propiedad de sombra con varias sombras separadas por comas debe reportarse si cualquiera de ellas está difuminada.
- **001-CL-05 (Lint sobre código existente):** Si el CSS existente tiene violaciones de las reglas `001-RF-13` a `001-RF-18`, se corrige el CSS bajo el control de `001-RF-26`. Esas reglas no se pueden desactivar, ignorar con comentarios en línea ni relajar.
- **001-CL-06 (Atributo ausente):** `<semiotic-alert>` sin atributo `variant` debe comportarse como `info`, igual que con un valor inválido.
- **001-CL-07 (Radio con token):** `border-radius: var(--sm-radius)` no debe reportarse, y `border-radius: var(--sm-radius, 4px)` sí.
- **001-CL-08 (Comentarios de desactivación):** Un comentario en línea que intente desactivar alguna regla de `001-RF-13` a `001-RF-18` debe reportarse como violación o bien ser ignorado por el lint, de modo que la violación original se siga reportando.

## 8. Fuera de Alcance (Out of Scope)

- Lint de JavaScript (ESLint u otro) y formateo automático (Prettier u otro).
- Lint del CSS embebido como string en las plantillas de Shadow DOM de los Web Components.
- Lint de estilos y tests del sitio de documentación Astro.
- Tests sobre los artefactos compilados (`dist/`), tests de regresión visual, tests end-to-end en navegadores reales y tests de accesibilidad automatizados.
- Umbrales obligatorios de cobertura de código.
- Integración continua remota (GitHub Actions u otra).
- Cualquier creación, modificación o integración con hooks, tanto de git (`.git/hooks`, `core.hooksPath`) como de agentes (`.agents/hooks`, `.agents/hooks.json`). La verificación se hace exclusivamente con los comandos de la tabla del verificador ejecutados por `.seb/bin/seb verify`.
- Cambios en el comportamiento público de la librería distintos de las correcciones de CSS controladas por `001-RF-26`.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos `001-RF-XX` y `001-RNF-XX` vigentes cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify suite_calidad_tests_lint`.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

- Ninguna duda pendiente.

### Registro de Clarificaciones (2026-11-19)

1. Entorno DOM simulado: `happy-dom`.
2. Base de lint: se aprueba `stylelint-config-standard`. Sus reglas pueden desactivarse si chocan, pero nunca las de `001-RF-13` a `001-RF-18`.
3. Las reglas no nativas (`001-RF-14`, `001-RF-18`) se resuelven con código propio dentro del mismo lint (`001-RF-23`).
4. ~~La Puerta de Calidad se engancha al hook de pre-commit.~~ **Revisado (2026-11-19):** el humano descarta toda integración con hooks de git o de agentes. Los dos requisitos de integración con el pre-commit (antes numerados 24 y 25) se retiran y sus números no se reutilizan. La Puerta de Calidad queda solo como comando que pueden invocar los verificadores.
5. Los tests de línea base se ejecutan contra el código fuente sin compilar (`001-RF-22`).
6. La protección contra inyección de HTML cubre todo atributo de texto renderizado: hoy `heading` y `code` (`001-RF-10`).
7. Las reglas de radio cubren todas las variantes por esquina, físicas y lógicas.
8. La regla de sombras cubre `box-shadow`, `text-shadow` y `drop-shadow()` en `filter`/`backdrop-filter`.
9. Las correcciones del CSS existente se controlan con un diff contra la línea base y una lista explícita de correcciones (`001-RF-26`).
