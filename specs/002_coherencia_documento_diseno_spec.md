# Spec 002 — Coherencia del Documento de Diseño con los Tokens y Componentes de la Librería

- **Tarea ID:** `002`
- **Identificador:** `coherencia_documento_diseno`
- **Origen:** Prosa ("Test automatizado que detecte desfasajes entre DESIGN.md y src/css/tokens.css, y entre su inventario de componentes y lo que existe en src/")
- **Estado:** `APROBADA`
- **Afecta-UC:** `ninguno`
- **Dependencias:** `001`

## 1. Contexto y Objetivo (El POR QUÉ)

El repositorio tiene un documento de diseño en Markdown (`DESIGN.md`) que leen los agentes de IA para generar interfaces coherentes con Semiotic UI. Ese documento se usa en este repositorio y también se copia en los proyectos que consumen la librería. El documento repite a mano los nombres y valores de los tokens `--sm-*` y el inventario de componentes (clases `.sm-*`, etiquetas `<semiotic-*>`, atributos, eventos, partes y slots). Hoy nada impide que el código cambie y el documento quede desactualizado. Cuando eso pasa, los agentes generan interfaces con tokens inexistentes, valores equivocados o componentes que no existen, y el error se propaga a todos los proyectos que copiaron el documento. Esta tarea agrega una comprobación automática, dentro del comando oficial de tests, que falla ante cualquier desfasaje entre el documento y el código. Así, el documento queda bajo el mismo control determinista que el resto de la librería. El documento se sigue escribiendo a mano: la comprobación verifica, no genera.

## 2. Actores y Usuarios

- **Desarrollador del Design System:** modifica tokens o componentes y necesita saber, sin revisar a mano, si debe actualizar el documento de diseño.
- **Agente de IA (en este repositorio o en un proyecto consumidor):** lee el documento de diseño como fuente de reglas; necesita que lo que dice sea cierto para la versión de la librería que declara.
- **Agente `seb-verificador` / `.seb/bin/seb verify`:** usa el código de salida del comando oficial de tests como evidencia.

## 3. Historias de Usuario

- **002-HU-01:** Como `desarrollador del Design System`, quiero que los tests fallen si cambio un token o un componente sin actualizar el documento de diseño, para no publicar documentación desfasada.
- **002-HU-02:** Como `agente de IA en un proyecto consumidor`, quiero que todo token, valor y componente que menciona el documento de diseño exista en la versión declarada, para no generar interfaces rotas.
- **002-HU-03:** Como `agente seb-verificador`, quiero que la coherencia del documento se evalúe con un comando de código de salida determinista, para usarla como evidencia en cualquier spec futura que toque tokens o componentes.

## 4. Definiciones de Dominio (Opcional)

- **Documento de diseño:** el archivo `DESIGN.md` de la raíz del repositorio.
- **Hoja de tokens:** la hoja de estilos pública que define la paleta literal y los tokens semánticos (misma definición que en la Spec 001).
- **Hojas de estilos públicas:** misma definición que en la Spec 001.
- **Token público:** toda Custom Property cuyo nombre empieza con `--sm-` y que se declara en la hoja de tokens. Los alias internos `--_*` no son tokens públicos.
- **Valor claro de un token:** el valor con que la hoja de tokens declara el token en el tema por defecto.
- **Valor oscuro efectivo de un token:** el valor con que la hoja de tokens redefine el token en el tema oscuro o, si no lo redefine, su valor claro.
- **Tabla de tokens:** tabla Markdown del documento de diseño cuya primera columna se titula `Token`, que tiene una columna de valor del tema claro y, opcionalmente, una columna de valor del tema oscuro. Cada fila presenta exactamente un token por su nombre completo.
- **Token documentado:** token público que figura en una fila de una tabla de tokens. **Solo las tablas de tokens documentan valores:** la prosa y los bloques de código nunca cuentan como valor documentado.
- **Mención de token:** toda aparición de un nombre con forma de token (`--sm-` seguido de uno o más segmentos en kebab-case) en cualquier parte del documento de diseño, incluidos los bloques de código, que no forme parte de un nombre de clase completo.
- **Patrón de tokens:** mención que termina en comodín (`--sm-space-*`) o que agrupa alternativas (`--sm-shadow-sm|md|lg`, `--sm-color-{info|success}`). Representa al conjunto de tokens públicos que coinciden con él.
- **Valores equivalentes:** dos valores CSS que son iguales después de normalizar los espacios en blanco consecutivos a uno solo, quitar los espacios al inicio y al final, y pasar a minúsculas los colores hexadecimales. Un valor declarado como `var(--sm-x)` es equivalente a `var(--sm-x)` o a `--sm-x` escritos con el nombre completo del token referenciado, y no a su valor resuelto. Las referencias abreviadas (por ejemplo `ivory-100` en lugar de `--sm-palette-ivory-100`) no son equivalentes.
- **Mención de clase:** toda aparición de un nombre de clase con prefijo `sm-` en el documento de diseño, ya sea precedida de un punto (`.sm-card-title`) o como valor dentro de un atributo `class` o `className` de un bloque de código.
- **Mención de Custom Element:** toda etiqueta de apertura o de cierre con prefijo `semiotic-` (`<semiotic-alert>`, `</semiotic-alert>`, `<semiotic-alert variant="info">`) en cualquier parte del documento de diseño. El nombre del paquete (`semiotic-ui`) y de sus artefactos no son menciones de Custom Element.
- **Patrón notacional:** nombre que usa comodines o marcadores de posición para describir una convención (`.sm-*`, `.sm-<bloque>--<modificador>`, `<semiotic-*>`, `<semiotic-<nombre>>`). No es una mención de clase ni de Custom Element.
- **Inventario de componentes:** la parte del documento de diseño que enumera, para la versión declarada, las clases `.sm-*`, los Custom Elements `<semiotic-*>` y, por cada Custom Element, sus atributos observados, eventos emitidos, partes (`::part`) y slots con nombre, además de las exportaciones públicas del punto de entrada.
- **Lista de componentes inexistentes:** la parte del inventario que declara explícitamente piezas que no existen en la versión declarada (hoy `.sm-badge`, controles de formulario, `<semiotic-modal>`, `<semiotic-tabs>`).
- **Prefijo de consumidor:** clases de ejemplo para proyectos consumidores (hoy `.app-*`), que no forman parte de la librería.
- **Declaración de versión:** la única línea del encabezado del documento de diseño que declara la versión de la librería con el formato de especificador de paquete npm `semiotic-ui@<MAYOR>.<MENOR>.<PARCHE>` (por ejemplo `semiotic-ui@0.1.0`). Las versiones que aparezcan en ejemplos (como `DOC-00 // V0.1.0`) no son declaraciones de versión.
- **Atributos observados:** los atributos que el Custom Element declara como observados.
- **Partes y slots con nombre:** los valores de `part` y los `name` de `<slot>` presentes en el Shadow DOM de una instancia del Custom Element creada en el entorno DOM simulado de la Spec 001, sin atributos.
- **Eventos emitidos:** los nombres literales de evento con prefijo `sm-` que aparecen como tipo de evento creado en el código fuente del Custom Element.
- **Discrepancia:** cualquier incumplimiento de los requisitos `002-RF-03` a `002-RF-19`.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

### 5.1 Ejecución e informe

- **002-RF-01 (Ubiquitous):** EL SISTEMA DEBE ejecutar la comprobación de coherencia del documento de diseño como parte del comando oficial de tests definido en la Spec 001, sin un comando adicional.
- **002-RF-02 (Unwanted Behavior):** SI la comprobación encuentra al menos una discrepancia, ENTONCES EL SISTEMA DEBE hacer terminar el comando oficial de tests con un código de salida distinto de `0` e informar, por cada discrepancia, el nombre del token o pieza afectada, el tipo de discrepancia y, cuando aplique, el valor documentado y el valor del código.
- **002-RF-03 (Unwanted Behavior):** SI el documento de diseño no existe o está vacío, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia, sin omitir ni saltear la comprobación.

### 5.2 Tokens

- **002-RF-04 (Unwanted Behavior):** SI una mención de token del documento de diseño no corresponde a ningún token público, ENTONCES EL SISTEMA DEBE reportarla como discrepancia.
- **002-RF-05 (Unwanted Behavior):** SI un patrón de tokens del documento de diseño no coincide con al menos un token público, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-06 (Unwanted Behavior):** SI un token público no es un token documentado, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-07 (Unwanted Behavior):** SI el valor del tema claro que una tabla de tokens atribuye a un token documentado no es equivalente a su valor claro, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-08 (Unwanted Behavior):** SI el valor del tema oscuro que una tabla de tokens atribuye a un token documentado no es equivalente a su valor oscuro efectivo, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-09 (Unwanted Behavior):** SI un token público se redefine en el tema oscuro y ninguna tabla de tokens le atribuye un valor de tema oscuro, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-10 (Unwanted Behavior):** SI la primera columna de una fila de una tabla de tokens contiene más de un token, una mención abreviada con sufijos (por ejemplo `-500` / `-100`) o un patrón de tokens, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.
- **002-RF-11 (Unwanted Behavior):** SI el documento de diseño contiene una aparición de `--` seguida de una letra o de `_` que no es una mención de token, un patrón de tokens, el patrón de alias internos `--_*` ni parte de un nombre de clase completo (por ejemplo un modificador abreviado como `--primary` o `--sm` en lugar de `.sm-btn--primary` o `.sm-btn--sm`), ENTONCES EL SISTEMA DEBE reportarla como discrepancia.

### 5.3 Inventario de componentes

- **002-RF-12 (Unwanted Behavior):** SI el conjunto de clases `.sm-*` del inventario de componentes difiere del conjunto de clases `.sm-*` definidas en las hojas de estilos públicas, ENTONCES EL SISTEMA DEBE reportar como discrepancia cada clase sobrante y cada clase faltante.
- **002-RF-13 (Unwanted Behavior):** SI una mención de clase de cualquier parte del documento de diseño no corresponde a una clase definida en las hojas de estilos públicas, ENTONCES EL SISTEMA DEBE reportarla como discrepancia.
- **002-RF-14 (Unwanted Behavior):** SI el conjunto de Custom Elements del inventario de componentes difiere del conjunto de Custom Elements que registra la función de registro global, ENTONCES EL SISTEMA DEBE reportar como discrepancia cada elemento sobrante y cada elemento faltante.
- **002-RF-15 (Unwanted Behavior):** SI una mención de Custom Element de cualquier parte del documento de diseño no corresponde a un Custom Element registrado por la función de registro global, ENTONCES EL SISTEMA DEBE reportarla como discrepancia.
- **002-RF-16 (Unwanted Behavior):** SI, para un Custom Element, los atributos observados, los eventos emitidos o las partes y slots con nombre del inventario difieren de los del componente, ENTONCES EL SISTEMA DEBE reportar como discrepancia cada elemento sobrante y cada elemento faltante, indicando el componente y la categoría.
- **002-RF-17 (Unwanted Behavior):** SI el conjunto de exportaciones públicas del inventario difiere del conjunto de exportaciones del punto de entrada de la librería, ENTONCES EL SISTEMA DEBE reportar como discrepancia cada exportación sobrante y cada exportación faltante.
- **002-RF-18 (Unwanted Behavior):** SI una pieza de la lista de componentes inexistentes existe en el código (clase definida en una hoja de estilos pública o Custom Element registrado), ENTONCES EL SISTEMA DEBE reportarla como discrepancia.
- **002-RF-19 (Unwanted Behavior):** SI el documento de diseño no tiene declaración de versión, tiene más de una, o la versión declarada difiere de la versión del paquete, ENTONCES EL SISTEMA DEBE reportarlo como discrepancia.

### 5.4 Estado al terminar la tarea

- **002-RF-20 (State-Driven):** MIENTRAS el repositorio esté en el estado que deja esta tarea, EL SISTEMA DEBE pasar la comprobación de coherencia sin discrepancias y el comando oficial de tests debe terminar con código `0`.
- **002-RF-21 (Event-Driven):** CUANDO la comprobación se ejecute sobre contenidos alterados en memoria o en archivos temporales con una discrepancia controlada de cada tipo (token inexistente mencionado, patrón sin coincidencias, token público sin documentar, valor claro distinto, valor oscuro distinto, token redefinido en oscuro sin valor oscuro, fila con varios tokens, modificador abreviado, clase faltante en el inventario, mención de clase inexistente, mención de Custom Element inexistente, atributo sobrante, evento faltante, parte faltante, exportación faltante, pieza inexistente que pasa a existir, versión ausente, duplicada o distinta), EL SISTEMA DEBE detectarla y hacer fallar la comprobación. Un test por cada tipo debe verificarlo sin modificar nunca los archivos reales del repositorio.

## 6. Requisitos No Funcionales (Verificables)

- **002-RNF-01 (Sin dependencias nuevas):** Esta spec no aprueba ninguna dependencia nueva, ni de runtime ni de desarrollo. La comprobación se implementa con las herramientas aprobadas en la Spec 001 y código propio del repositorio.
- **002-RNF-02 (Determinismo):** Dos ejecuciones consecutivas de la comprobación sobre el mismo commit deben dar el mismo resultado, sin acceso a red y sin depender del orden de los archivos en disco.
- **002-RNF-03 (Tiempo):** La comprobación de coherencia debe completar en menos de 5 segundos en el entorno de desarrollo NixOS (Node.js 22).
- **002-RNF-04 (Artefactos intactos):** Los artefactos distribuidos (ES, UMD y CSS) no deben incluir código de la comprobación.
- **002-RNF-05 (Legibilidad del documento):** El documento de diseño debe seguir siendo Markdown legible por personas, sin marcadores de máquina visibles en el texto renderizado. Se admiten comentarios HTML de Markdown como delimitadores si el plan los necesita.
- **002-RNF-06 (Entorno):** La comprobación debe funcionar dentro del dev shell de `flake.nix`, sin binarios de sistema adicionales.

## 7. Casos Límite (Edge Cases)

- **002-CL-01 (Prefijo de consumidor):** Las clases con prefijo de consumidor (`.app-*`) que aparecen en ejemplos no se comparan con el código y no generan discrepancia.
- **002-CL-02 (Menciones dentro de bloques de código):** Las menciones de token, de clase y de Custom Element dentro de bloques de código se controlan igual que las del texto (`002-RF-04`, `002-RF-13`, `002-RF-15`). Un bloque de código de ejemplo que redefine un token existente no documenta un valor y no se compara con `002-RF-07` ni `002-RF-08`.
- **002-CL-03 (Modificadores que contienen `--sm`):** Un nombre de clase completo como `.sm-btn--sm` no debe interpretarse como mención de token ni como modificador abreviado.
- **002-CL-04 (Valores compuestos):** Los tokens con valores de varias partes (sombras, pilas tipográficas, transiciones) se comparan completos, incluida la referencia al color de la sombra. Documentar solo una parte del valor es una discrepancia.
- **002-CL-05 (Token redefinido en oscuro con el mismo valor):** Si la hoja de tokens redefine un token en el tema oscuro con un valor equivalente al claro, la tabla puede mostrar el mismo valor en ambos temas sin discrepancia.
- **002-CL-06 (Valores con fallback en Shadow DOM):** Los valores de respaldo de `var(--sm-*, <fallback>)` dentro de las plantillas de los Web Components no son tokens públicos y no se comparan con el documento.
- **002-CL-07 (Clases de tema):** La clase de tema oscuro `.sm-theme-dark` es una clase `.sm-*` definida en una hoja de estilos pública y debe figurar en el inventario.
- **002-CL-08 (Duplicados):** Si las tablas de tokens atribuyen a un mismo token dos valores distintos para el mismo tema, se reporta como discrepancia aunque uno de ellos coincida con el código.
- **002-CL-09 (Lista de inexistentes):** Las menciones de la lista de componentes inexistentes no se controlan con `002-RF-13` ni `002-RF-15`; se controlan solo con `002-RF-18`.
- **002-CL-10 (Patrones notacionales):** Los patrones notacionales no generan discrepancias de `002-RF-13` ni `002-RF-15`.
- **002-CL-11 (Delimitadores de Markdown):** Los separadores de tablas (`| :--- |`), los comentarios HTML (`<!--`, `-->`) y los guiones largos de la prosa no son apariciones de `--` seguida de una letra y no se controlan con `002-RF-11`.

## 8. Fuera de Alcance (Out of Scope)

- Verificar afirmaciones en prosa que no sean nombres ni valores de tokens o piezas del inventario (por ejemplo, desplazamientos de hover, tamaños tipográficos observados, reglas de uso del color o de microcopy).
- Verificar métodos públicos (`dismiss()`, `show()`), propiedades reflejadas (`closeLabel`) y estados personalizados (`:state(...)`) de los Custom Elements.
- Verificar que los fragmentos de ejemplo del documento (HTML, CSS, JSX) compilen, pasen el lint o funcionen.
- Generar automáticamente el documento de diseño o sus tablas a partir de la hoja de tokens.
- Agregar a los Custom Elements una declaración estática de eventos u otro cambio de su API pública.
- Corregir los snippets del sitio de documentación Astro (incluido el ejemplo de React que asigna `onsmDismiss`).
- Incluir el documento de diseño en el paquete npm distribuido (registrado como deuda técnica en `MEMORY.md`).
- Enmendar `docs/constitution.md` para incluir el documento de diseño en el flujo obligatorio de creación de componentes (decisión registrada en `MEMORY.md`; la enmienda la hace el humano).
- Crear tokens de escala tipográfica u otros tokens nuevos.
- Cualquier cambio en tokens, clases o Web Components de la librería: esta tarea solo agrega la comprobación y ajusta el documento de diseño para cumplirla.
- Cualquier creación, modificación o integración con hooks de git o de agentes.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos (`002-RF-01` a `002-RF-21`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify coherencia_documento_diseno`.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

- Ninguna duda pendiente.

### Registro de Clarificaciones (2026-11-19)

1. Enfoque: se verifica el documento escrito a mano; no se generan sus tablas.
2. Solo las tablas de tokens documentan valores; la prosa y los bloques de código nunca cuentan como valor documentado.
3. Las referencias entre tokens se escriben con el nombre completo del token referenciado; las abreviadas no son equivalentes.
4. Un token por fila en las tablas de tokens (`002-RF-10`).
5. Toda mención de clase `.sm-*` o de Custom Element `<semiotic-*>` en cualquier parte del documento debe existir, salvo la lista de inexistentes y el prefijo de consumidor (`002-RF-13`, `002-RF-15`).
6. Los modificadores abreviados se detectan como toda aparición de `--` seguida de una letra o `_` que no sea token, patrón, alias `--_*` ni parte de una clase completa (`002-RF-11`).
7. Partes y slots con nombre se obtienen instanciando el componente en el entorno DOM simulado de la Spec 001.
8. Los eventos se obtienen de los nombres literales de evento `sm-*` en el código fuente del componente.
9. Métodos, propiedades reflejadas y estados personalizados quedan fuera de esta iteración.
10. La versión se declara una sola vez, en el encabezado, como especificador npm `semiotic-ui@X.Y.Z` (`002-RF-19`).
11. Los tests de discrepancias controladas trabajan sobre contenidos en memoria o archivos temporales, nunca sobre los archivos reales (`002-RF-21`).
12. La inclusión del documento en el flujo obligatorio de creación de componentes de la constitución se registra en `MEMORY.md` para que el humano enmiende la sección D.
13. La distribución del documento en el paquete npm queda fuera de alcance y se registra como deuda técnica en `MEMORY.md`.
