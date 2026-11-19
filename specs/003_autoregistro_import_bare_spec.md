# Spec 003 — Auto-registro de Web Components al Importar el Paquete con Bundlers

- **Tarea ID:** `003`
- **Identificador:** `autoregistro_import_bare`
- **Origen:** Prosa (hallazgo verificado durante una prueba de consumo del paquete desde un proyecto Vite externo)
- **Estado:** `APROBADA`
- **Afecta-UC:** `nuevo`

## 1. Contexto y Objetivo (El POR QUÉ)

La constitución del proyecto declara que importar el punto de entrada de la librería auto-registra sus Web Components cuando existe un navegador. Ese contrato se cumple al cargar el artefacto UMD con una etiqueta `<script>` clásica y al invocar explícitamente la función de registro, pero **no se cumple** para un consumidor con bundler que importa el paquete por su nombre sin usar ninguno de sus exports. En una prueba real con Vite, esa importación produjo un bundle de 0,78 kB en el que `<semiotic-alert>` no quedó registrado, mientras que la importación con registro explícito produjo un bundle de 10,59 kB donde sí lo estaba. El consumidor no recibe ningún error: el elemento simplemente permanece como un elemento HTML desconocido. Esta tarea restituye el contrato de auto-registro para el consumo vía bundler, que es uno de los dos canales de distribución principales declarados en la constitución.

## 2. Actores y Usuarios

- **Desarrollador consumidor con bundler:** integra `semiotic-ui` en una aplicación (Vite, con Rollup como motor de empaquetado) y espera que importar el paquete deje los componentes listos.
- **Desarrollador consumidor sin bundler (CDN / servidor):** carga el artefacto UMD con `<script>` clásico desde HTML plano, Thymeleaf o HTMX.
- **Proceso de renderizado en servidor (SSR):** importa el paquete en Node sin navegador y no debe fallar.

## 3. Historias de Usuario

- **003-HU-01:** Como desarrollador consumidor con bundler, quiero que importar el paquete por su nombre registre los Web Components sin pasos adicionales, para que `<semiotic-alert>` funcione tal como indica la documentación del proyecto.
- **003-HU-02:** Como desarrollador consumidor sin bundler, quiero que el artefacto UMD siga auto-registrando los componentes, para no tener que modificar mis plantillas existentes.
- **003-HU-03:** Como desarrollador de un proceso SSR, quiero que importar el paquete en Node siga siendo seguro, para que la corrección no rompa el renderizado en servidor.

## 4. Definiciones de Dominio (Opcional)

- **Import bare:** importación del paquete por su nombre (`import 'semiotic-ui'`) sin enlazar ningún export con nombre ni usar ningún valor importado; el consumidor lo hace únicamente por el efecto de la importación.
- **Bundle de producción:** artefacto generado con Vite en modo de compilación optimizada, que incluye eliminación de código no referenciado (tree-shaking).
- **Entorno de referencia:** entorno DOM simulado (happy-dom). Toda mención de "ejecutar en un navegador" en esta spec se evalúa en este entorno; no se exige un navegador real.
- **Modalidades de consumo:** las dos formas en que un proyecto consumidor obtiene el paquete. (a) *Paquete empaquetado:* el resultado de empaquetar el proyecto tal como se publicaría, instalado en el consumidor. (b) *Enlace local:* instalación del proyecto por ruta local mediante enlace simbólico, como en una prueba de desarrollo.
- **Auto-registro:** definición del Custom Element `semiotic-alert` en el registro (`customElements`) como consecuencia de cargar el paquete, sin que el consumidor invoque una función de registro.
- **Componente incluido:** el código del Custom Element forma parte del bundle resultante y su etiqueta queda definida al ejecutarlo en el entorno de referencia.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **003-RF-01 (Event-Driven):** CUANDO un proyecto consumidor construye con Vite un bundle de producción cuyo único uso del paquete es un import bare, EL SISTEMA DEBE dejar incluido en ese bundle el código del Custom Element `semiotic-alert`, tanto en la modalidad de consumo por paquete empaquetado como en la de enlace local.
- **003-RF-02 (Event-Driven):** CUANDO el bundle de producción descrito en 003-RF-01 se ejecuta en el entorno de referencia, EL SISTEMA DEBE dejar la etiqueta `semiotic-alert` definida en el registro de Custom Elements sin que el consumidor invoque ninguna función de registro, en ambas modalidades de consumo.
- **003-RF-03 (Event-Driven):** CUANDO un proyecto consumidor construye con Vite un bundle de producción que importa el paquete con exports con nombre (por ejemplo la función de registro global o la clase del componente), EL SISTEMA DEBE dejar la etiqueta `semiotic-alert` definida tras ejecutar el bundle en el entorno de referencia, en ambas modalidades de consumo.
- **003-RF-04 (Unwanted Behavior):** SI la etiqueta `semiotic-alert` ya está definida en el registro de Custom Elements cuando el paquete se carga (por una segunda importación o por una invocación explícita previa del registro), ENTONCES EL SISTEMA DEBE completar la carga sin lanzar excepción y conservar la definición existente.
- **003-RF-05 (Unwanted Behavior):** SI el paquete se importa en un entorno sin `window`, `document` ni `customElements`, ENTONCES EL SISTEMA DEBE completar la importación sin lanzar `ReferenceError` ni ninguna otra excepción y sin registrar ningún componente, tanto por su punto de entrada ESM como por su punto de entrada UMD.
- **003-RF-06 (Event-Driven):** CUANDO el artefacto UMD se carga como script clásico (sin sistema de módulos) en el entorno de referencia, EL SISTEMA DEBE dejar la etiqueta `semiotic-alert` definida sin invocación adicional.
- **003-RF-07 (Ubiquitous):** EL SISTEMA DEBE mantener sin cambios la API pública del paquete: el conjunto de exports con nombre, los nombres de los artefactos de distribución, el global UMD `SemioticUI` y los especificadores de importación publicados.

## 6. Requisitos No Funcionales (Verificables)

- **003-RNF-01:** La comprobación de 003-RF-01 y 003-RF-02 debe ser determinista y ejecutable sin acceso a red, terminando con código de salida `0` si el componente está incluido y registrado, y distinto de `0` en caso contrario.
- **003-RNF-02:** La corrección no debe añadir dependencias de runtime ni de desarrollo. La única excepción es que resulte estrictamente imprescindible para cumplir un `003-RF-XX` o una decisión de esta spec, caso en el que el plan debe justificarla y requerirá aprobación explícita del humano antes de aplicarse.
- **003-RNF-03:** La suite de verificación existente (`npm run quality`, que incluye las pruebas de las Specs 001 y 002) debe seguir terminando con código de salida `0` tras la corrección.

## 7. Casos Límite (Edge Cases)

- **003-CL-01 (Importación múltiple):** si el paquete se importa varias veces en el mismo bundle (import bare más import con nombre en módulos distintos), el componente queda registrado una única vez y sin errores.
- **003-CL-02 (Solo clase importada):** si el consumidor importa únicamente la clase del componente sin invocar el registro, el auto-registro igualmente deja la etiqueta definida.

## 8. Fuera de Alcance (Out of Scope)

- Cambiar la estrategia de auto-registro por una de registro opt-in (decisión de contrato público que requeriría spec propia y bump de versión mayor).
- Hacer que el import bare cargue también la hoja de estilos; el consumidor sigue importándola por su especificador dedicado.
- Modificar documentación (`DESIGN.md`, sitio Astro, casos de uso) más allá de lo estrictamente requerido por las pruebas existentes.
- Cualquier cambio a tokens, clases `.sm-*`, atributos, eventos o comportamiento de `<semiotic-alert>`.
- Publicación del paquete en npm o GitHub Packages.
- Garantías para otros bundlers (webpack, esbuild u otros): solo Vite/Rollup es el bundler de referencia; los demás requieren una spec futura.
- Verificación en un navegador real: el entorno de referencia es exclusivamente el DOM simulado.
- Comportamiento en el servidor de desarrollo del bundler y coexistencia con la importación de la hoja de estilos, retirados del alcance por decisión del humano por no tener criterio verificable.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos (`003-RF-01` a `003-RF-07`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify autoregistro_import_bare`.
- Los requisitos no funcionales `003-RNF-01` a `003-RNF-03` están respaldados por comandos con código de salida determinista.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

Ninguna duda pendiente.

Decisiones del humano incorporadas en la clarificación: bundler de referencia Vite/Rollup; `Afecta-UC: nuevo`; consumo verificado en ambas modalidades (paquete empaquetado y enlace local); entorno de referencia happy-dom; SSR cubierto en los puntos de entrada ESM y UMD; retirados el requisito de "segunda copia del paquete" y los casos límite de hoja de estilos y modo desarrollo; prohibidas dependencias nuevas salvo imprescindibles.
