# Spec 005 — Navegación del Sitio de Documentación con Sidebar y Fichas de Componentes

- **Tarea ID:** `005`
- **Identificador:** `navegacion_sitio_docs`
- **Origen:** Prosa (pedido del humano de mejorar la interfaz del sitio con un sidebar; dividido en clarificación previa en la Spec 004, el componente, y esta spec, la navegación del sitio)
- **Estado:** `APROBADA`
- **Afecta-UC:** `nuevo`
- **Depends-On**: 004

## 1. Contexto y Objetivo (El POR QUÉ)

Hoy el sitio de documentación concentra todo en una sola página inicial. A medida que la librería suma componentes, encontrar uno, entender cuándo usarlo y copiar su código se vuelve cada vez más lento, y no hay una guía de instalación ni una presentación del proyecto separadas. Esta tarea organiza el sitio en una navegación lateral persistente, construida con el componente Sidebar de la Spec 004, que es a la vez la primera prueba real de ese componente. La navegación tiene dos grupos: "Getting started" (presentación e instalación) y "Components" (una ficha por componente del inventario de la librería). Cada destino tiene su propia URL, así se puede enlazar, usar el historial del navegador y navegar sin JavaScript. Cada ficha de componente sigue la misma estructura: nombre, propósito, preview en vivo, código y variantes.

## 2. Actores y Usuarios

- **Desarrollador que consulta la documentación:** evalúa la librería, la instala y copia snippets de los componentes, navegando con puntero o teclado.
- **Mantenedor de la librería:** agrega componentes nuevos y necesita que su ficha siga una estructura fija y verificable.

## 3. Historias de Usuario

- **005-HU-01:** Como desarrollador que consulta la documentación, quiero un menú lateral con secciones fijas para llegar a la introducción, la instalación o cualquier componente en un solo clic.
- **005-HU-02:** Como desarrollador que consulta la documentación, quiero una guía de instalación paso a paso para integrar la librería tanto con bundler como con script clásico.
- **005-HU-03:** Como desarrollador que consulta la documentación, quiero ver para cada componente qué es, cuándo usarlo, una preview en vivo y el código exacto de esa preview y de sus variantes, para copiarlo sin adivinar el marcado.
- **005-HU-04:** Como desarrollador que consulta la documentación, quiero que cada sección tenga su propia URL para compartirla y volver a ella con el historial del navegador.
- **005-HU-05:** Como desarrollador que navega con teclado o lector de pantalla, quiero saltar el menú y distinguir cada página por su título, para no recorrer toda la navegación en cada página.

## 4. Definiciones de Dominio (Opcional)

- **Página de documentación:** cada destino navegable del sitio, con una URL propia y generado de forma estática.
- **Ficha de componente:** página de documentación dedicada a un componente del catálogo.
- **Catálogo de componentes:** las piezas del inventario cerrado del documento de diseño de la librería (sección 7 de `DESIGN.md`), excepto el reset global de tipografía. Hoy son cinco, con estos nombres visibles y URLs:

  | Nombre visible | Pieza del inventario | URL |
  | :--- | :--- | :--- |
  | Buttons | `.sm-btn` | `/components/buttons/` |
  | Cards | `.sm-card` | `/components/cards/` |
  | Code Tags | `.sm-code-tag` | `/components/code-tags/` |
  | Interactive Alerts | `<semiotic-alert>` | `/components/interactive-alerts/` |
  | Sidebar | `.sm-sidebar` | `/components/sidebar/` |

- **Esquema de URLs:** la raíz `/` es la página "Introduction" (no existe una `/introduction/` aparte); "Installation" vive en `/installation/`; cada ficha vive en `/components/<slug>/`, con el slug en kebab-case derivado del nombre visible.
- **Preview:** instancia en vivo del componente renderizada con la librería real, no una imagen.
- **Preview principal:** la preview que encabeza la ficha. Muestra el componente base y, cuando corresponde, sus estados: un botón deshabilitado en Buttons, una alerta descartable (`dismissible`) en Interactive Alerts y un item activo y otro deshabilitado en Sidebar.
- **Snippet:** bloque de código mostrado como texto literal que reproduce el marcado de una preview o de una variante.
- **Variante:** cada modificador `.sm-<bloque>--<modificador>` del bloque del componente y cada valor del atributo `variant` que documenta el inventario. Los estados y los atributos booleanos no son variantes. Con el inventario actual:
  - Buttons: `primary`, `info`, `success`, `warning`, `danger`, `ghost`, `sm` y `lg`.
  - Cards: `info`, `success`, `warning`, `danger` y `compact`.
  - Interactive Alerts: `info`, `success`, `warning` y `danger`.
  - Code Tags y Sidebar: ninguna.
- **Cabecera del sitio:** franja común a todas las páginas con la marca del sistema, su etiqueta técnica de versión y el control para alternar el tema.
- **Entorno de referencia:** igual que en las Specs 003 y 004, el DOM simulado (happy-dom). No se exige un navegador real.

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

**Estructura común**

- **005-RF-01 (Ubiquitous):** EL SISTEMA DEBE presentar cada página de documentación con un Layout con sidebar (Spec 004) cuyo primer hijo es el Sidebar de navegación del sitio, con nombre accesible, y cuyo segundo hijo es la región de contenido principal.
- **005-RF-02 (Ubiquitous):** EL SISTEMA DEBE mostrar en todas las páginas de documentación la cabecera del sitio.
- **005-RF-03 (Ubiquitous):** EL SISTEMA DEBE ofrecer en cada página, como primer elemento enfocable, un enlace "Skip to content" que lleve a la región de contenido principal.
- **005-RF-04 (Ubiquitous):** EL SISTEMA DEBE dar a cada página de documentación un título de documento distinto de los de las demás, que incluya el nombre de la página.

**Navegación**

- **005-RF-05 (Ubiquitous):** EL SISTEMA DEBE mostrar como primer SidebarMenu del sitio uno con etiqueta "Getting started" que contenga, en este orden, los SidebarMenuItem "Introduction" e "Installation".
- **005-RF-06 (Ubiquitous):** EL SISTEMA DEBE mostrar como segundo SidebarMenu del sitio uno con etiqueta "Components" que contenga exactamente un SidebarMenuItem por cada componente del catálogo, en orden alfabético por su nombre visible.
- **005-RF-07 (Event-Driven):** CUANDO el usuario activa un SidebarMenuItem, EL SISTEMA DEBE navegar a la URL que le asigna el esquema de URLs y mostrar el contenido de esa página en la región de contenido principal, mediante un enlace que no dependa de JavaScript.
- **005-RF-08 (State-Driven):** MIENTRAS se muestra una página de documentación, EL SISTEMA DEBE marcar como item activo (`aria-current="page"`) únicamente el SidebarMenuItem que corresponde a esa página.
- **005-RF-09 (Event-Driven):** CUANDO el usuario accede a la URL raíz del sitio, EL SISTEMA DEBE mostrar el contenido de "Introduction" y marcar "Introduction" como item activo.

**Tema**

- **005-RF-10 (Event-Driven):** CUANDO el usuario activa el control de tema de la cabecera, EL SISTEMA DEBE alternar entre el tema claro y el oscuro de la librería en la página actual.
- **005-RF-11 (Event-Driven):** CUANDO el usuario abre otra página de documentación después de elegir un tema, EL SISTEMA DEBE aplicar el tema elegido antes de mostrar el contenido de esa página, recordándolo en el almacenamiento local del navegador.
- **005-RF-12 (Unwanted Behavior):** SI el almacenamiento local del navegador no está disponible o contiene un valor de tema desconocido, ENTONCES EL SISTEMA DEBE mostrar la página en tema claro, sin errores en la consola, y el control de tema debe seguir alternando el tema de la página actual.

**Getting started**

- **005-RF-13 (Ubiquitous):** EL SISTEMA DEBE mostrar en la página "Introduction" un título, un párrafo que describa el propósito de la librería y su lenguaje visual Semiotic Standard, y la enumeración de sus dos canales de consumo (aplicaciones con bundler y aplicaciones con script clásico desde CDN o servidor).
- **005-RF-14 (Ubiquitous):** EL SISTEMA DEBE mostrar en la página "Installation" una guía para consumidores de la librería, como lista ordenada de pasos en la que cada paso tenga una descripción y al menos un snippet, y que cubra como mínimo: instalar el paquete desde el registro npm, importar la librería y su hoja de estilos desde una aplicación con bundler, y cargar los artefactos con etiquetas de script y de hoja de estilos clásicas desde una CDN.
- **005-RF-15 (Ubiquitous):** EL SISTEMA DEBE usar en los snippets de "Installation" solo los especificadores de importación y los nombres de artefactos que el paquete publica, y construir las URLs de CDN con el nombre del paquete y su versión vigente.

**Fichas de componentes**

- **005-RF-16 (Ubiquitous):** EL SISTEMA DEBE presentar cada ficha de componente con las siguientes secciones en este orden: título con el nombre visible del componente; descripción de qué es y cuándo usarlo; preview principal; código de la preview principal; variantes.
- **005-RF-17 (Ubiquitous):** EL SISTEMA DEBE mostrar el código de la preview principal de cada ficha en los formatos HTML/Thymeleaf/HTMX y React/Astro.
- **005-RF-18 (Ubiquitous):** EL SISTEMA DEBE mostrar en la sección de variantes de cada ficha una preview en vivo y un snippet HTML por cada variante del componente.
- **005-RF-19 (Unwanted Behavior):** SI un componente del catálogo no tiene variantes, ENTONCES EL SISTEMA DEBE omitir la sección de variantes de su ficha, sin título ni contenedor vacío.
- **005-RF-20 (Ubiquitous):** EL SISTEMA DEBE garantizar que el snippet HTML de la preview principal y de cada variante, normalizados los espacios en blanco, coincida con el marcado renderizado de esa preview o variante. La coincidencia no se exige a los snippets Thymeleaf/HTMX ni React/Astro.
- **005-RF-21 (Ubiquitous):** EL SISTEMA DEBE mostrar cada snippet como texto literal, de forma que ningún fragmento del snippet se interprete como marcado ni se ejecute.
- **005-RF-22 (Event-Driven):** CUANDO el usuario descarta una `<semiotic-alert>` en la ficha "Interactive Alerts", EL SISTEMA DEBE ocultarla con el comportamiento funcional de la librería, porque la página carga el código que registra el componente y sus alertas descartables declaran `dismissible`.
- **005-RF-23 (Ubiquitous):** EL SISTEMA DEBE mostrar en la ficha "Interactive Alerts" un control que restaure las alertas descartadas y un registro visible del último evento `sm-dismiss` o `sm-show` emitido.

**Errores**

- **005-RF-24 (Unwanted Behavior):** SI el usuario accede a una URL que no corresponde a ninguna página de documentación, ENTONCES EL SISTEMA DEBE ofrecer una página de "no encontrado" con la cabecera, el mismo Layout con sidebar y ningún SidebarMenuItem activo.

## 6. Requisitos No Funcionales (Verificables)

- **005-RNF-01:** La compilación del sitio de documentación (`npm run docs:build`) debe terminar con código de salida `0` y generar exactamente un documento HTML estático por cada URL del esquema de URLs, más la página de "no encontrado".
- **005-RNF-02:** La tarea no debe añadir dependencias de runtime ni de desarrollo. El resaltado de sintaxis, si se incluye, debe salir de capacidades ya disponibles en el stack aprobado.
- **005-RNF-03:** La suite de calidad existente (`npm run quality`) debe seguir terminando con código de salida `0`, y la suite completa de Vitest debe seguir terminando en menos de 30 s (presupuesto de `003-CHK-10`).
- **005-RNF-04:** El sitio no debe cargar recursos remotos (fuentes, imágenes, scripts) ni emitir telemetría, en línea con la sección E de la constitución. Las URLs de CDN aparecen solo como texto dentro de snippets.
- **005-RNF-05:** La tarea no debe modificar la API pública de la librería ni sus artefactos de distribución: los cambios se limitan al sitio de documentación y a sus herramientas de verificación.
- **005-RNF-06:** Los comportamientos que requieren ejecutar JavaScript en el cliente (005-RF-10, 005-RF-11, 005-RF-12, 005-RF-22 y 005-RF-23) se verifican sin navegador real. Vale la evidencia estática sobre el sitio compilado (controles presentes y código cargado) o ejecutar su lógica aislada en el entorno de referencia. El comportamiento de descartar alertas ya está cubierto por los tests de la Spec 001.
- **005-RNF-07:** La página de "no encontrado" se verifica sobre el documento que genera la compilación. Cómo la sirve el servidor de publicación queda fuera de alcance.

## 7. Casos Límite (Edge Cases)

- **005-CL-01 (Componente nuevo futuro):** si el inventario del documento de diseño suma una pieza (excepto el reset global) sin su SidebarMenuItem o sin una ficha que siga la estructura de 005-RF-16, la verificación debe fallar en lugar de pasar en silencio.
- **005-CL-02 (Recarga tras descartar una alerta):** recargar la ficha "Interactive Alerts" restaura todas las alertas descartadas, porque la documentación no persiste el estado de las alertas.
- **005-CL-03 (Pantalla angosta):** por debajo del ancho de referencia de la Spec 004, el Sidebar de navegación queda arriba del contenido principal, todos sus SidebarMenuItem siguen alcanzables y el enlace de 005-RF-03 permite saltarlo.
- **005-CL-04 (Tema oscuro):** con el tema oscuro activo, el Sidebar, las previews y los snippets siguen legibles con los tokens semánticos oscuros.
- **005-CL-05 (Ruta sin barra final):** la navegación del sitio usa siempre las URLs del esquema con barra final; los enlaces internos no apuntan a variantes sin barra.

## 8. Fuera de Alcance (Out of Scope)

- Guía para contribuidores del repositorio (entorno Nix, `npm install`, comandos de calidad) en la página "Installation".
- Documentar GitHub Packages o la configuración de registros privados: el registro documentado es npm.
- Buscador dentro del sitio, botón "copiar código", tabla de contenidos por página y navegación anterior/siguiente.
- Documentación de tokens, paleta o guía de diseño como páginas propias.
- Versionado de la documentación o selector de versión.
- Internacionalización: los textos de navegación quedan en inglés, como se pidió.
- Sidebar colapsable o fijo en la ventana (excluido en la Spec 004).
- Seguir la preferencia de tema del sistema operativo (`prefers-color-scheme`).
- Publicación o despliegue del sitio y comportamiento del servidor ante URLs inexistentes.
- Cambios en el comportamiento o la API de Buttons, Cards, Code Tags, Interactive Alerts o Sidebar.
- Ejecución dinámica del bundle del sitio o verificación en un navegador real (005-RNF-06).
- Mantener en `[PASA]` los controles sellados `004-CHK-11` y `004-CHK-12`. Revisan la demo del Sidebar en la página raíz del sitio, que esta tarea reemplaza por "Introduction", y quedan como evidencia histórica de la Spec 004. Resellarlos requiere una Operación One-Off que ejecuta el humano.
- La sección "Integration Snippets" de la página actual se elimina: cada ficha trae su propio código.

## 9. Criterios de Finalización (Definition of Done)

- La dependencia `004` (`componente_sidebar`) está verificada (`verified: true` y `commit_hash` no vacío en `.seb/seb.lock`) antes de planificar esta spec.
- Todos los requisitos (`005-RF-01` a `005-RF-24`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify navegacion_sitio_docs`.
- Los requisitos no funcionales `005-RNF-01` a `005-RNF-07` están respaldados por comandos con código de salida determinista.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

Ninguna duda pendiente.

Decisiones del humano incorporadas en la clarificación:
- **Installation:** solo para consumidores, con npm como registro oficial; GitHub Packages queda fuera de alcance. La URL de CDN se arma con el nombre y la versión del paquete.
- **Catálogo:** se deriva del inventario del documento de diseño, sin el reset global, y suma "Code Tags". "Interactive Alerts" cubre solo `<semiotic-alert>`.
- **Contenido actual del sitio:**
  - La cabecera y el control de tema pasan a todas las páginas.
  - El control de restaurar alertas y el registro de eventos van a la ficha "Interactive Alerts".
  - La sección "Integration Snippets" se elimina.
  - La demo del Sidebar pasa a su ficha.
- **Snippets:** la coincidencia entre snippet y preview se exige solo al HTML.
- **Controles sellados de la Spec 004:** `004-CHK-11` y `004-CHK-12` quedan como evidencia histórica y se resellan con una One-Off.
- **URLs:** la raíz es Introduction, sin duplicado.
- **Variantes:** cada modificador y cada valor de `variant`; los estados y los booleanos van en la preview principal.
- **Verificación:** evidencia estática para descartar alertas, y la página 404 se verifica sobre el documento que genera la compilación.
- **Accesibilidad:** enlace "Skip to content" y título de documento distinto por página.
- **Tema:** el elegido persiste entre páginas en el almacenamiento local, con tema claro como valor por defecto si el almacenamiento falla.
- **Verificación de JavaScript del cliente:** el criterio de evidencia estática se extiende al control de tema y a la restauración de alertas (005-RNF-06).
