# DESIGN.md — Sistema de Diseño Semiotic UI

> **Para qué sirve este archivo:** es la guía de diseño que deben leer los agentes de IA (y las personas) antes de generar o modificar interfaces que usen **Semiotic UI** (`semiotic-ui`). Vale tanto dentro del repositorio de la librería como en cualquier proyecto que la consuma.
>
> **Versión de la librería:** `semiotic-ui@0.1.0`
>
> **Jerarquía de verdad:** si este documento contradice el código, manda el código: `src/css/tokens.css` (valores de tokens) y la API pública de la librería. Dentro del repositorio SemioticUI, además, `docs/constitution.md` está por encima de este archivo. Ante una contradicción, no la resuelvas por tu cuenta: avisa a la persona.
>
> **Coherencia verificada:** en el repositorio de la librería, un test automático compara este documento con los tokens y componentes reales. Las tablas cuya primera columna es `Token` y el inventario de la sección 7 siguen un formato fijo; respétalo al editarlas.

---

## 0. Instrucciones para agentes de IA

1. **Usa solo lo que existe.** El inventario cerrado de la versión declarada está en la sección 7. No inventes clases `.sm-*`, etiquetas `<semiotic-*>`, atributos, eventos ni tokens `--sm-*` que no figuren en este documento.
2. **Consume tokens, nunca valores literales.** Colores, bordes, sombras, espaciados, fuentes y transiciones salen de las Custom Properties `--sm-*` de nivel semántico (Tier 2). Nada de colores hexadecimales, `rgb()` ni nombres de color en el CSS de componentes.
3. **Geometría ortogonal sin excepciones.** Radio `0`. Sombras duras con difuminado `0`. Sin gradientes decorativos.
4. **Prefiere HTML nativo + clases.** Un `<button class="sm-btn">` antes que un `<div>` con eventos. Los Web Components solo existen para comportamiento interactivo.
5. **Si falta un componente**, constrúyelo en el proyecto consumidor con **su propio prefijo** (por ejemplo `.app-*`) y con los tokens de Semiotic UI (ver sección 11). Nunca uses el prefijo `sm-` fuera de la librería.
6. **Antes de entregar**, recorre la lista de control de la sección 13.

---

## 1. Norte Creativo: "El Estándar de a Bordo"

Semiotic UI se inspira en el *Semiotic Standard* que Ron Cobb diseñó para la nave Nostromo (*Alien*, 1979): la señalética industrial de una nave de carga, pensada para ser leída en un segundo, bajo presión y sin ambigüedad. La interfaz no es un producto de consumo amable: es **un panel de control impreso en chapa**.

Principios rectores:

- **Función antes que adorno.** Cada borde, sombra o color comunica estructura o estado. Si un elemento no informa nada, sobra.
- **Contraste estructural.** Las zonas se separan con bordes sólidos y bloques de superficie, no con matices sutiles ni sombras difusas.
- **Materialidad física.** Las sombras son desplazamientos sólidos; los botones se comportan como teclas mecánicas que se elevan y se hunden.
- **Codificación técnica.** Los elementos importantes llevan etiquetas alfanuméricas cortas (`SEC-04`, `WARN-702`) que actúan como anclas visuales, igual que la rotulación de una sala de máquinas.
- **Semántica cerrada.** Hay cuatro estados y nada más: `info`, `success`, `warning`, `danger`. La paleta no se usa para decorar.

---

## 2. Color y Lógica de Superficies

El sistema tiene **dos niveles de tokens**:

- **Tier 1 — Paleta literal (`--sm-palette-*`):** los valores crudos. Solo se usan para definir el Tier 2 o un tema propio. Los componentes no los consumen (salvo el texto sobre fondos de estado documentado en la sección 7.2).
- **Tier 2 — Tokens semánticos (`--sm-bg-*`, `--sm-text-*`, `--sm-color-*`, `--sm-border-color`):** lo único que deben consumir los componentes y layouts. El tema oscuro redefine exclusivamente este nivel.

### 2.1 Paleta literal (Tier 1)

La paleta no cambia entre temas.

| Token | Valor claro | Rol inspirador |
| :--- | :--- | :--- |
| `--sm-palette-ivory-50` | `#f4f1ea` | Papel técnico, superficie clara |
| `--sm-palette-ivory-100` | `#e8e2d3` | Lienzo claro |
| `--sm-palette-ivory-200` | `#d5cdba` | Superficie atenuada |
| `--sm-palette-carbon-950` | `#111315` | Tinta, bordes, sombras |
| `--sm-palette-carbon-900` | `#1b1e22` | Superficie oscura |
| `--sm-palette-carbon-800` | `#262b30` | Superficie oscura atenuada |
| `--sm-palette-carbon-700` | `#3d444d` | Texto secundario claro |
| `--sm-palette-carbon-500` | `#69727d` | Texto atenuado |
| `--sm-palette-amber-400` | `#f5b700` | Precaución industrial |
| `--sm-palette-amber-500` | `#d99b00` | Precaución, hover |
| `--sm-palette-amber-100` | `#fef3c7` | Precaución, superficie tenue |
| `--sm-palette-red-500` | `#d62828` | Emergencia |
| `--sm-palette-red-600` | `#b01c1c` | Emergencia, hover |
| `--sm-palette-red-100` | `#fde2e2` | Emergencia, superficie tenue |
| `--sm-palette-green-500` | `#1f8a4c` | Sistema nominal |
| `--sm-palette-green-600` | `#166a39` | Sistema nominal, hover |
| `--sm-palette-green-100` | `#dcfce7` | Sistema nominal, superficie tenue |
| `--sm-palette-cyan-500` | `#0f6cbd` | Telemetría |
| `--sm-palette-cyan-600` | `#0a5291` | Telemetría, hover |
| `--sm-palette-cyan-100` | `#dbeafe` | Telemetría, superficie tenue |

### 2.2 Superficies, texto y bordes (Tier 2)

| Token | Valor claro | Valor oscuro | Uso |
| :--- | :--- | :--- | :--- |
| `--sm-bg-canvas` | `var(--sm-palette-ivory-100)` | `var(--sm-palette-carbon-950)` | Fondo de la página (`body`) |
| `--sm-bg-surface` | `var(--sm-palette-ivory-50)` | `var(--sm-palette-carbon-900)` | Paneles, tarjetas, botón por defecto |
| `--sm-bg-surface-muted` | `var(--sm-palette-ivory-200)` | `var(--sm-palette-carbon-800)` | Cabeceras de panel, etiquetas, zonas hundidas |
| `--sm-bg-inverse` | `var(--sm-palette-carbon-950)` | `var(--sm-palette-ivory-50)` | Bloques invertidos, botón primario |
| `--sm-text-primary` | `var(--sm-palette-carbon-950)` | `var(--sm-palette-ivory-50)` | Texto principal |
| `--sm-text-secondary` | `var(--sm-palette-carbon-700)` | `var(--sm-palette-ivory-200)` | Texto de apoyo, subtítulos |
| `--sm-text-muted` | `var(--sm-palette-carbon-500)` | `#9aa3ae` | Metadatos, texto de baja prioridad |
| `--sm-text-inverse` | `var(--sm-palette-ivory-50)` | `var(--sm-palette-carbon-950)` | Texto sobre `--sm-bg-inverse` |
| `--sm-border-color` | `var(--sm-palette-carbon-950)` | `var(--sm-palette-ivory-100)` | **Todos** los bordes y **todas** las sombras |

### 2.3 Colores de estado

Cada estado tiene tres tokens: base, `-hover` y `-surface` (fondo tenue). Los valores base y `-hover` no cambian entre temas; los `-surface` se oscurecen en el tema oscuro.

| Estado | Significado | Etiqueta canónica |
| :--- | :--- | :--- |
| `info` | Telemetría, información neutra | `INFO` |
| `success` | Sistema nominal, operación correcta | `NOMINAL` |
| `warning` | Precaución, requiere atención | `CAUTION` |
| `danger` | Emergencia, error, acción destructiva | `ALERT` |

| Token | Valor claro | Valor oscuro | Uso |
| :--- | :--- | :--- | :--- |
| `--sm-color-info` | `var(--sm-palette-cyan-500)` | | Base de `info` |
| `--sm-color-info-hover` | `var(--sm-palette-cyan-600)` | | Hover de `info` |
| `--sm-color-info-surface` | `var(--sm-palette-cyan-100)` | `#132a42` | Fondo tenue de `info` |
| `--sm-color-success` | `var(--sm-palette-green-500)` | | Base de `success` |
| `--sm-color-success-hover` | `var(--sm-palette-green-600)` | | Hover de `success` |
| `--sm-color-success-surface` | `var(--sm-palette-green-100)` | `#122d1f` | Fondo tenue de `success` |
| `--sm-color-warning` | `var(--sm-palette-amber-400)` | | Base de `warning` |
| `--sm-color-warning-hover` | `var(--sm-palette-amber-500)` | | Hover de `warning` |
| `--sm-color-warning-surface` | `var(--sm-palette-amber-100)` | `#332708` | Fondo tenue de `warning` |
| `--sm-color-danger` | `var(--sm-palette-red-500)` | | Base de `danger` |
| `--sm-color-danger-hover` | `var(--sm-palette-red-600)` | | Hover de `danger` |
| `--sm-color-danger-surface` | `var(--sm-palette-red-100)` | `#3b1315` | Fondo tenue de `danger` |

### 2.4 Reglas de uso del color

- **El color es semántico, no decorativo.** Rojo solo para peligro o acciones destructivas; ámbar solo para precaución. No uses un color de estado "porque queda bien".
- **La jerarquía visual principal es blanco y negro.** La acción principal de una pantalla es `.sm-btn--primary` (bloque invertido carbón/ivory), no un color de estado.
- **Texto sobre ámbar siempre oscuro** (`--sm-palette-carbon-950`). Nunca texto claro sobre `--sm-color-warning`.
- **Nunca uses rojo ni ámbar para párrafos largos.** Los colores de estado son para bordes, franjas de acento, insignias, fondos de botón y etiquetas cortas.
- **No transmitas el estado solo con color.** Acompáñalo siempre de texto (`CAUTION`, `ALERT`) o de un código técnico.
- **Sombras y bordes usan `--sm-border-color`**, que se invierte en el tema oscuro. No fijes `black` ni `--sm-palette-carbon-950` a mano: rompe el tema oscuro.

### 2.5 Tema oscuro ("consola CRT")

- Se activa con `data-sm-theme="dark"` en `<html>` o con la clase `.sm-theme-dark` en cualquier contenedor (permite zonas oscuras dentro de una página clara).
- El sistema declara `color-scheme: light dark` pero **no** cambia de tema automáticamente según `prefers-color-scheme`: la activación es explícita. Si el proyecto quiere seguir la preferencia del sistema operativo, debe poner el atributo con su propio código.
- Un tema propio se construye redefiniendo **solo tokens Tier 2** en un selector del consumidor. Nunca redefinas los tokens Tier 1 para "retocar" un componente.

---

## 3. Tipografía

| Token | Valor claro | Rol |
| :--- | :--- | :--- |
| `--sm-font-mono` | `'JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace` | **Voz técnica:** encabezados `h1`–`h6`, botones, títulos de tarjeta, etiquetas, códigos, insignias, estados, `code`/`pre`/`kbd`/`samp` |
| `--sm-font-sans` | `'Space Grotesk', 'IBM Plex Sans', 'Inter', system-ui, -apple-system, sans-serif` | **Voz de contenido:** cuerpo de texto, párrafos, descripciones |

Reglas:

- **Encabezados y rótulos en monoespaciada**, peso `700`, normalmente en `uppercase`.
- **Espaciado de letras positivo** en texto monoespaciado en mayúsculas: entre `0.04em` (encabezados) y `0.08em` (etiquetas pequeñas). No uses espaciado negativo.
- **Cuerpo en sans** con `line-height: 1.5`. Nunca pongas párrafos largos en mayúsculas ni en monoespaciada.
- **La librería no descarga fuentes** (no carga recursos remotos por diseño). Si el proyecto quiere JetBrains Mono y Space Grotesk, debe autoalojarlas; si no, se usan los respaldos del sistema y el diseño debe seguir funcionando.

Escala de tamaños observada en los componentes (no hay tokens de tamaño tipográfico en esta versión; reutiliza estos valores para mantener coherencia):

| Tamaño | Uso |
| :--- | :--- |
| `0.75rem` | Etiquetas técnicas, insignias, botón pequeño |
| `0.8125rem` | Bloques de código |
| `0.875rem` | Botón por defecto |
| `0.9375rem` | Título de tarjeta, encabezado y cuerpo de alerta |
| `1rem` | Cuerpo de página, botón grande |

---

## 4. Geometría, Bordes y Elevación

### 4.1 Tokens geométricos

| Token | Valor claro | Uso |
| :--- | :--- | :--- |
| `--sm-radius` | `0px` | Todo. Sin excepciones. |
| `--sm-border-width` | `2px` | Borde estándar de controles, tarjetas, etiquetas, divisores |
| `--sm-border-width-heavy` | `3px` | Paneles estructurales y anclas de layout (cabecera de página, barra lateral) |
| `--sm-shadow-sm` | `2px 2px 0 0 var(--sm-border-color)` | Elementos presionados, zonas de demostración, hover del botón fantasma |
| `--sm-shadow-md` | `4px 4px 0 0 var(--sm-border-color)` | Elevación por defecto: botones, tarjetas, alertas |
| `--sm-shadow-lg` | `6px 6px 0 0 var(--sm-border-color)` | Elemento destacado, panel principal, hover de botón |
| `--sm-shadow-none` | `0 0 0 0 transparent` | Botón deshabilitado, botón fantasma en reposo |

### 4.2 Reglas de elevación

- **Sombra dura o nada.** El difuminado siempre es `0`. No existen sombras ambientales, resplandores ni `filter: blur()` decorativo.
- **La sombra comunica jerarquía física**, no "bonito". Escala: `--sm-shadow-none` (plano, inactivo) < `--sm-shadow-sm` (hundido) < `--sm-shadow-md` (en reposo) < `--sm-shadow-lg` (destacado o elevado).
- **No inventes sombras mayores a `6px`.** Para destacar algo, combina `--sm-shadow-lg` con `--sm-border-width-heavy`.
- **Franjas de acento laterales:** el estado de un panel se señala con un borde izquierdo grueso del color de estado (`border-inline-start`): `6px` en cabeceras de tarjeta, `8px` en alertas. Es el único lugar donde el borde supera los `3px`.
- **Capas por superficie:** para jerarquía sin sombra, alterna `--sm-bg-surface` y `--sm-bg-surface-muted` (efecto de bandeja hundida en un panel de control), siempre separadas por un borde sólido.
- **Líneas finas:** el único uso permitido de `1px` es en divisores internos de baja jerarquía (por ejemplo, separadores discontinuos entre filas dentro de un mismo panel) y en el chip de código de la alerta. Los contenedores siempre llevan al menos `2px`.

---

## 5. Espaciado y Layout

### 5.1 Escala de espaciado

| Token | Valor claro |
| :--- | :--- |
| `--sm-space-1` | `0.25rem` |
| `--sm-space-2` | `0.5rem` |
| `--sm-space-3` | `0.75rem` |
| `--sm-space-4` | `1rem` |
| `--sm-space-5` | `1.5rem` |
| `--sm-space-6` | `2rem` |

Usa siempre la escala. Si necesitas un valor fuera de ella, probablemente el layout tiene un problema.

### 5.2 Patrones de layout

- **Paneles modulares, no scroll infinito.** El contenido vive en bloques con borde, contenidos en una rejilla. La estructura (bordes, divisores) es parte de la estética: déjala a la vista.
- **Cabecera de sección técnica:** etiqueta `.sm-code-tag` + encabezado, sobre un borde inferior de `--sm-border-width`.
- **Rejilla de tarjetas:** `grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr))` con `gap: var(--sm-space-4)`.
- **Ancho de lectura:** contenedor principal de unos `68rem`; párrafos limitados a `52ch`–`70ch`.
- **Asimetría con ancla:** en layouts con barra lateral, ubícala a la izquierda y dale `--sm-border-width-heavy`, mientras el contenido usa el borde estándar. La pieza más pesada ancla la composición.
- **Separación entre secciones:** `--sm-space-6`; dentro de una sección, `--sm-space-3` o `--sm-space-4`.
- **Responsive con container queries** para componentes (como hace `<semiotic-alert>`) y media queries solo para el layout global de página.
- **Propiedades lógicas** (`padding-inline`, `border-block-end`, `margin-inline`) en lugar de `left/right/top/bottom`.

---

## 6. Movimiento e Interacción

| Token | Valor claro | Uso |
| :--- | :--- | :--- |
| `--sm-focus-color` | `var(--sm-palette-cyan-500)` | Color del anillo de foco |
| `--sm-focus-width` | `3px` | Grosor del anillo de foco |
| `--sm-focus-offset` | `2px` | Separación del anillo respecto del control |
| `--sm-transition-fast` | `80ms steps(2, end)` | Transición mecánica de botones |

- **Transición mecánica:** el movimiento es seco, por pasos, como un relé; nada de curvas elásticas ni animaciones largas.
- **Botón como tecla física:**
  - Reposo: `--sm-shadow-md`.
  - Hover: se eleva `translate(-1px, -1px)` y pasa a `--sm-shadow-lg`.
  - Activo (presionado): se hunde `translate(2px, 2px)` y pasa a `--sm-shadow-sm`.
- **Foco visible:** contorno sólido con `--sm-focus-width`, `--sm-focus-color` y `--sm-focus-offset`. Usa `:focus-visible`. Nunca elimines el foco sin reemplazo.
- **Deshabilitado:** `opacity: 0.52`, sin sombra, `cursor: not-allowed`. Soporta `disabled` nativo y `aria-disabled="true"` (para enlaces).
- **Estados sin depender del orden de reglas:** `:hover:not(:disabled, [aria-disabled='true'])`.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` se anulan transiciones y desplazamientos. Todo componente nuevo debe respetarlo.

---

## 7. Componentes (inventario cerrado)

<!-- design-check:inventory -->

| Pieza | Tipo | Estado |
| :--- | :--- | :--- |
| `.sm-code-tag` | Clase CSS | Disponible |
| `.sm-btn` | Clase CSS | Disponible |
| `.sm-card` | Clase CSS | Disponible |
| `<semiotic-alert>` | Web Component | Disponible |
| Reset base de tipografía (`body`, `h1`–`h6`, `p`, `code`) | CSS global en capa | Disponible |

<!-- design-check:nonexistent -->
**No existen en esta versión y no deben usarse:** `.sm-badge`, `.sm-input` (ni ningún otro control de formulario), `<semiotic-modal>` y `<semiotic-tabs>`.
<!-- /design-check:nonexistent -->

### 7.1 Etiqueta técnica

Código alfanumérico corto con borde, en monoespaciada mayúscula. Ancla visual de secciones, tarjetas y registros.

| Clase | Uso |
| :--- | :--- |
| `.sm-code-tag` | Etiqueta técnica en línea |

```html
<span class="sm-code-tag">SEC-04</span>
```

- Contenido: códigos cortos estilo `AAA-00` (`SYS-01`, `NAV-09`, `WARN-12`, `DOC-00 // V0.1.0`). No la uses para frases.
- No es un botón ni un indicador de estado: no la hagas interactiva.

### 7.2 Botón

Funciona sobre `<button>`, `<a>` e `<input type="submit">` / `<input type="button">`.

```html
<button class="sm-btn sm-btn--primary" type="button">Execute</button>
<a class="sm-btn sm-btn--ghost" href="/logs">View Logs</a>
<button class="sm-btn sm-btn--danger sm-btn--sm" type="button">Purge Cache</button>
```

| Clase | Apariencia | Cuándo usarla |
| :--- | :--- | :--- |
| `.sm-btn` | Superficie clara, texto principal | Base obligatoria; sola, es la acción secundaria |
| `.sm-btn--primary` | Bloque invertido (`--sm-bg-inverse`) | Acción principal; una por vista o grupo |
| `.sm-btn--info` | Cian, texto claro | Acción de consulta o sincronización |
| `.sm-btn--success` | Verde, texto claro | Confirmar una operación nominal |
| `.sm-btn--warning` | Ámbar, texto carbón | Acción que requiere precaución |
| `.sm-btn--danger` | Rojo, texto claro | Acción destructiva o irreversible |
| `.sm-btn--ghost` | Transparente, borde discontinuo, sin sombra | Acción terciaria, de baja jerarquía |
| `.sm-btn--sm` | Altura `2rem` | Densidad alta |
| `.sm-btn--lg` | Altura `3rem` | Acción destacada; por defecto la altura es `2.5rem` |

- Texto en mayúsculas automáticamente: escribe el rótulo como verbo corto (`Sync`, `Verify Seal`, `Engage Thrusters`).
- Siempre declara `type` en `<button>`. En enlaces deshabilitados usa `aria-disabled="true"`.
- No combines dos variantes de color en el mismo botón.

### 7.3 Tarjeta / Panel

Contenedor estructural en columna con cabecera, cuerpo y pie opcionales.

```html
<article class="sm-card sm-card--warning">
  <header class="sm-card-header">
    <h3 class="sm-card-title">Airlock Deck B</h3>
    <span class="sm-code-tag">WARN-12</span>
  </header>
  <div class="sm-card-body">
    <p>Outer seal manual override engaged.</p>
  </div>
  <footer class="sm-card-footer">
    <button class="sm-btn sm-btn--warning sm-btn--sm" type="button">Verify Seal</button>
  </footer>
</article>
```

| Clase | Descripción |
| :--- | :--- |
| `.sm-card` | Contenedor con borde estándar y `--sm-shadow-md` |
| `.sm-card-header` | Banda `--sm-bg-surface-muted` con franja de acento izquierda de `6px` y borde inferior |
| `.sm-card-title` | Título en monoespaciada mayúscula (`0.9375rem`) |
| `.sm-card-body` | Contenido en columna, separado por `--sm-space-3` |
| `.sm-card-footer` | Acciones alineadas a la derecha, borde superior |
| `.sm-card--info` | Franja de acento cian |
| `.sm-card--success` | Franja de acento verde |
| `.sm-card--warning` | Franja de acento ámbar |
| `.sm-card--danger` | Franja de acento roja |
| `.sm-card--compact` | Reduce los rellenos internos |

- Patrón de cabecera: título a la izquierda, `.sm-code-tag` a la derecha.
- La variante de estado solo tiñe la franja de acento; el cuerpo sigue siendo neutro. No pintes el fondo entero de la tarjeta con un color de estado.

### 7.4 Alerta — `<semiotic-alert>`

Web Component con Shadow DOM para mensajes de estado, con cierre opcional. Configurable solo con atributos HTML (compatible con Thymeleaf `th:attr` y HTMX).

| Custom Element | Uso |
| :--- | :--- |
| `<semiotic-alert>` | Mensaje de estado con insignia, código técnico, encabezado y cierre opcional |

```html
<semiotic-alert variant="warning" code="WARN-702" heading="Coolant Drift" dismissible>
  Secondary loop temperature above baseline threshold.
</semiotic-alert>
```

**Atributos** (reflejados como propiedades):

| Atributo | Propiedad | Tipo | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `variant` | `variant` | `info` \| `success` \| `warning` \| `danger` | `info` | Un valor inválido se normaliza a `info` sin error |
| `code` | `code` | texto | vacío | Código técnico mostrado como chip |
| `heading` | `heading` | texto | vacío | Encabezado; el slot `heading` tiene prioridad |
| `dismissible` | `dismissible` | booleano por presencia | ausente | Muestra el botón de cierre `ACK` |
| `dismissed` | `dismissed` | booleano por presencia | ausente | Alerta cerrada (oculta) |
| `close-label` | `closeLabel` | texto | `Dismiss alert` | `aria-label` del botón de cierre |

**Slots:** el slot por defecto recibe el cuerpo del mensaje. Slots con nombre:

| Slot | Uso |
| :--- | :--- |
| `heading` | Encabezado con marcado propio |

**Métodos:** `dismiss()` (emite `sm-dismiss`; devuelve `true` si cerró) y `show()` (reabre y emite `sm-show`).

**Eventos** (`bubbles` y `composed`):

| Evento | Cancelable | `detail` |
| :--- | :--- | :--- |
| `sm-dismiss` | Sí: `preventDefault()` impide el cierre | `{ variant, code }` |
| `sm-show` | No | `{ variant, code }` |

**Partes para `::part()`:**

| Parte | Elemento |
| :--- | :--- |
| `base` | Contenedor de la alerta |
| `badge` | Insignia de estado (`INFO`, `NOMINAL`, `CAUTION`, `ALERT`) |
| `header` | Zona de código y encabezado |
| `code` | Chip del código técnico |
| `heading` | Encabezado |
| `body` | Cuerpo del mensaje |
| `close-button` | Botón de cierre `ACK` |

**Estados personalizados** (si el navegador soporta `CustomStateSet`): `:state(dismissible)`, `:state(dismissed)`.

**Accesibilidad:** rol `alert` para `danger` (interrumpe al lector de pantalla) y `status` para el resto. Usa `danger` solo para lo realmente urgente.

**Personalización:** a través de los tokens `--sm-*` heredados o de `::part()`. No intentes estilar el interior con selectores descendentes: el Shadow DOM lo impide.

**Carga:** mientras el script no registró el elemento, `semiotic-alert:not(:defined)` permanece oculto; si el script falla, se muestra igualmente a los 2 segundos.

### 7.5 Tema oscuro

| Clase | Uso |
| :--- | :--- |
| `.sm-theme-dark` | Activa el tema oscuro en el subárbol del contenedor (ver sección 2.5) |

### 7.6 Exportaciones del punto de entrada

| Exportación | Uso |
| :--- | :--- |
| `registerAll()` | Registra todos los Web Components; idempotente y seguro en SSR |
| `registerSemioticAlert()` | Registra solo `<semiotic-alert>` |
| `SemioticAlert` | Clase del Custom Element, para extender o tipar |

<!-- /design-check:inventory -->

---

## 8. Voz, Microcopy y Codificación Técnica

- **Tono:** operativo, conciso, imperativo. Habla como un manual de mantenimiento, no como una app de marketing.
- **Rótulos de acción:** verbo + objeto, cortos (`Sync`, `Inspect`, `Verify Seal`, `Restore Dismissed Alerts`).
- **Códigos técnicos:** prefijo de dominio en mayúsculas + guion + número (`SYS-01`, `PWR-02`, `HULL-911`). Mantén un esquema coherente por proyecto (por ejemplo, el prefijo indica el módulo y el número el elemento).
- **Etiquetas de estado canónicas:** `INFO`, `NOMINAL`, `CAUTION`, `ALERT`. No inventes sinónimos para los mismos estados.
- **Separadores técnicos:** `//` para combinar segmentos en una etiqueta (`DOC-00 // V0.1.0`).
- **Datos con unidades explícitas** (`101.3 kPa`, `+4.2 C`, `98.4%`).
- **Prohibidos los emojis** en la interfaz, el código y la documentación.

---

## 9. Iconografía

- Semiotic UI **no incluye** un set de iconos en esta versión.
- Si el proyecto necesita iconos: geométricos, monocromos, de trazo uniforme de `2px` (igual a `--sm-border-width`), extremos rectos (`stroke-linecap: square`, `stroke-linejoin: miter`) y color heredado (`currentColor`).
- Formas preferidas: pictogramas de señalética industrial (flechas, triángulos de advertencia, círculos de prohibición, cuadrados de estado). Evita iconos redondeados, rellenos degradados o ilustrativos.
- Un icono nunca reemplaza al texto en acciones críticas: acompáñalo de un rótulo o de `aria-label`.

---

## 10. Integración en Proyectos Consumidores

### 10.1 Instalación

**Con bundler (React, Astro, Vite):**

```js
// Estilos unificados y registro automatico de los Web Components
import 'semiotic-ui/css';
import 'semiotic-ui';
```

Las exportaciones disponibles están en la sección 7.6. El registro es idempotente y seguro en SSR (importar en Node no rompe).

**Solo tokens** (para un proyecto que quiere la paleta y la geometría sin los componentes):

```js
import 'semiotic-ui/tokens.css';
```

**Sin bundler (Thymeleaf, HTMX, HTML estático):**

```html
<!-- Reemplazar BASE_URL por la ruta real del CDN o de los estaticos del proyecto -->
<link rel="stylesheet" href="BASE_URL/semiotic-ui.css" />
<script src="BASE_URL/semiotic-ui.umd.js" defer></script>
```

El script UMD expone el global `SemioticUI` y registra los componentes automáticamente.

### 10.2 Capas de cascada

Todo el CSS de la librería vive en `@layer sm.reset, sm.tokens, sm.base, sm.components`. Consecuencias prácticas:

- **El CSS del proyecto que no está en ninguna capa siempre gana** a la librería, sin importar la especificidad. Úsalo a tu favor para personalizar, pero cuidado: un reset global del proyecto (por ejemplo `button { all: unset; }` o un *preflight* de un framework de utilidades) anula los estilos `.sm-*`. Si el proyecto tiene un reset propio, ponlo dentro de una capa declarada **antes** de las capas `sm`.
- Para ajustes de tema, redefine tokens Tier 2; no sobrescribas propiedades de `.sm-*` una por una.

### 10.3 Temas en el proyecto

```css
/* Ajuste del tema oscuro del proyecto: redefine solo tokens semanticos */
:root[data-sm-theme='dark'] {
  --sm-bg-canvas: var(--sm-palette-carbon-900);
}
```

Zona oscura dentro de una página clara (los tokens se redefinen para todo el subárbol):

```html
<section class="sm-theme-dark">
  <article class="sm-card">...</article>
</section>
```

Ten en cuenta que `.sm-theme-dark` redefine los tokens pero no pinta el fondo del contenedor: dale `background-color: var(--sm-bg-canvas)` en el CSS del proyecto si la zona debe verse oscura.

### 10.4 Thymeleaf y HTMX

```html
<semiotic-alert
  th:attr="variant=${alert.severity}, code=${alert.code}, heading=${alert.title}"
  dismissible
  hx-on:sm-dismiss="htmx.trigger('#alerts', 'alert-ack')">
  <span th:text="${alert.message}">Diagnostic payload</span>
</semiotic-alert>
```

- Los atributos son strings o booleanos por presencia: se renderizan directamente desde el servidor.
- El componente hace *upgrade* sobre el HTML ya renderizado y tolera que HTMX lo mueva o reemplace.
- Para el valor de `variant`, mapea en el servidor tus severidades a los cuatro valores permitidos.

### 10.5 React

Los eventos personalizados no se capturan con props tipo `onSmDismiss`. Usa una referencia y `addEventListener`:

```jsx
import { useEffect, useRef } from 'react';

export function CoolantAlert({ onDismiss }) {
  const alertRef = useRef(null);

  useEffect(() => {
    const element = alertRef.current;
    if (!element) return undefined;
    // Suscripcion explicita al evento personalizado del Web Component
    element.addEventListener('sm-dismiss', onDismiss);
    return () => element.removeEventListener('sm-dismiss', onDismiss);
  }, [onDismiss]);

  return (
    <semiotic-alert ref={alertRef} variant="warning" code="WARN-702" heading="Coolant Drift" dismissible>
      Secondary loop temperature above baseline threshold.
    </semiotic-alert>
  );
}
```

En JSX, las clases de los componentes CSS van en `className` (`className="sm-btn sm-btn--primary"`).

---

## 11. Extender el Sistema

### 11.1 En un proyecto consumidor

Cuando necesites algo que no está en el inventario (sección 7):

1. Usa el prefijo del proyecto (`.app-*` o el que corresponda), nunca `sm-`.
2. Construye con tokens Tier 2: `--sm-border-width`, `--sm-border-color`, `--sm-radius`, `--sm-shadow-*`, `--sm-space-*`, `--sm-font-*`, `--sm-color-*`, `--sm-focus-*`, `--sm-transition-fast`.
3. Copia los patrones de interacción de `.sm-btn` (sección 6) y los de estructura de `.sm-card` (sección 7.3).
4. Respeta las prohibiciones de la sección 12.

Ejemplo — campo de texto del proyecto, coherente con el sistema:

```css
.app-input {
  min-height: 2.5rem;
  padding-block: var(--sm-space-2);
  padding-inline: var(--sm-space-3);
  border: var(--sm-border-width) solid var(--sm-border-color);
  border-radius: var(--sm-radius);
  background-color: var(--sm-bg-surface);
  color: var(--sm-text-primary);
  font: inherit;
}

/* El foco reutiliza el anillo de alto contraste del sistema */
.app-input:focus-visible {
  outline: var(--sm-focus-width) solid var(--sm-focus-color);
  outline-offset: var(--sm-focus-offset);
}

/* Estado de error senalizado con borde y franja de acento, nunca solo con color de texto */
.app-input[aria-invalid='true'] {
  border-inline-start: 6px solid var(--sm-color-danger);
}

.app-label {
  font-family: var(--sm-font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

### 11.2 Dentro del repositorio SemioticUI

Un componente nuevo de la librería no se improvisa: requiere una spec aprobada (`seb-harness`) y seguir el flujo de `docs/constitution.md` (sección D). Además, hay que actualizar este documento: el test de coherencia falla si un token, clase, Custom Element, atributo, evento, parte, slot o exportación no figura aquí. En resumen:

- Sin estado ni eventos complejos: clase CSS en `@layer sm.components`, nunca un Custom Element.
- Con interacción: `src/components/semiotic-<nombre>.js`, Shadow DOM abierto, configuración por atributos primitivos, eventos `sm-<accion>` con `bubbles` y `composed`, `:host([hidden]) { display: none; }`, registro idempotente `registerSemiotic<Nombre>()`, sin acceso a `window`/`document` a nivel de módulo.
- Nombres: `.sm-<bloque>`, `.sm-<bloque>-<elemento>`, `.sm-<bloque>--<modificador>`; tokens `--sm-*`; alias internos `--_*`.
- El lint de estilos (`npm run lint:css`) rechaza radios distintos de `0`, sombras con difuminado, colores hexadecimales fuera de `tokens.css`, el selector universal y `:host-context()`.

---

## 12. Lo que Sí y lo que No

### Sí

- Bordes sólidos de `2px` (estándar) y `3px` (estructural) en todo contenedor.
- Sombras duras desplazadas con los tokens `--sm-shadow-*`.
- Encabezados y rótulos en monoespaciada mayúscula; cuerpo en sans.
- Una acción `.sm-btn--primary` por vista o grupo; el resto, `.sm-btn` o `.sm-btn--ghost`.
- Etiquetas técnicas (`.sm-code-tag`) como anclas de secciones y tarjetas.
- Franjas de acento laterales para indicar estado.
- Exponer la rejilla: divisores y bordes visibles forman parte del diseño.
- HTML semántico nativo (`<button>`, `<a>`, `<article>`, `<header>`, `<footer>`).
- Probar cada pantalla en tema claro y oscuro.

### No

- **Ningún radio** distinto de `0`: ni en botones, ni en inputs, ni en avatares, ni en imágenes.
- **Ninguna sombra difuminada**, resplandor ni `backdrop-filter` decorativo.
- **Ningún gradiente** decorativo (tampoco "efecto retroiluminado" en botones).
- **Ningún color literal** (`#hex`, `rgb()`, nombres de color) en CSS de componentes o layouts.
- Bordes de `4px` o más en contenedores generales (solo las franjas de acento superan los `3px`).
- Recrear controles nativos con `<div>` o `<span>` clicables.
- Inventar clases `sm-*`, variantes de estado nuevas o tokens que no existen.
- Configurar Web Components solo con JSON en atributos o propiedades JS.
- Usar `!important` para pelear con la librería (usa capas o tokens).
- Texto en rojo o ámbar para párrafos; texto claro sobre ámbar.
- Emojis, ilustraciones amigables o estética "SaaS suave" (pasteles, tarjetas flotantes, esquinas redondeadas).

---

## 13. Lista de Control antes de Entregar una Interfaz

- [ ] Solo se usan componentes del inventario de la sección 7; lo demás lleva prefijo propio del proyecto.
- [ ] Ningún valor de color, sombra, borde, radio o espaciado está escrito a mano: todo sale de tokens `--sm-*`.
- [ ] Radio `0` y sombras con difuminado `0` en todo el CSS nuevo.
- [ ] Encabezados, botones y etiquetas en `--sm-font-mono`; cuerpo en `--sm-font-sans`.
- [ ] Los estados se comunican con color **y** texto o código.
- [ ] Una sola acción `.sm-btn--primary` por grupo; acciones destructivas con `.sm-btn--danger`.
- [ ] Foco visible en todos los elementos interactivos (`:focus-visible` con los tokens de foco).
- [ ] `prefers-reduced-motion` respetado en cualquier animación nueva.
- [ ] La pantalla se ve correcta en tema claro y con `data-sm-theme="dark"`.
- [ ] Los eventos de Web Components se escuchan con `addEventListener` (o `hx-on:` en HTMX).
- [ ] Sin emojis en la interfaz ni en el código.
