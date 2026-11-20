# Spec 004 — Componente Sidebar de Navegación Lateral (CSS-first)

- **Tarea ID:** `004`
- **Identificador:** `componente_sidebar`
- **Origen:** Prosa (pedido del humano de mejorar la interfaz del sitio con un sidebar; dividido en clarificación previa en esta spec, el componente de la librería, y la Spec 005, la navegación del sitio de documentación)
- **Estado:** `APROBADA`
- **Afecta-UC:** `UC-styles_apply_classes`

## 1. Contexto y Objetivo (El POR QUÉ)

La librería no ofrece hoy ningún componente de navegación: un consumidor que quiere un menú lateral con el lenguaje visual Semiotic Standard tiene que maquetarlo y estilizarlo por su cuenta, sin garantía de que cumpla los invariantes del dominio (geometría ortogonal, bordes sólidos, sombras sin difuminado, tipografía monoespaciada en etiquetas, tokens semánticos). Esta tarea incorpora a la API pública un componente Sidebar sin estado. Se resuelve solo con clases sobre elementos HTML nativos de navegación, lista y enlace, y es consumible igual desde aplicaciones con bundler y desde plantillas renderizadas en servidor (Thymeleaf, HTMX, HTML plano). El mismo componente es el que va a usar el sitio de documentación en la Spec 005.

## 2. Actores y Usuarios

- **Desarrollador consumidor con bundler:** maqueta un menú lateral en React, Astro o Vite aplicando las clases del componente.
- **Desarrollador consumidor sin bundler (CDN / servidor):** maqueta el mismo menú desde plantillas Thymeleaf, HTMX o HTML plano, con el marcado que genera el servidor.
- **Usuario final de la aplicación consumidora:** navega con puntero o teclado por los elementos del menú.
- **Sitio de documentación (Spec 005):** primer consumidor interno del componente.

## 3. Historias de Usuario

- **004-HU-01:** Como desarrollador consumidor, quiero aplicar clases de la librería a una estructura de navegación HTML nativa para obtener un sidebar con grupos etiquetados y elementos enlazables, sin escribir CSS propio.
- **004-HU-02:** Como usuario final, quiero distinguir a simple vista en qué elemento del menú estoy y cuál tiene el foco del teclado, para orientarme en la aplicación.
- **004-HU-03:** Como desarrollador consumidor, quiero que el sidebar y el contenido principal se reorganicen solos en contenedores angostos, para no mantener reglas responsivas propias.

## 4. Definiciones de Dominio (Opcional)

- **Sidebar:** contenedor de navegación lateral que agrupa uno o más SidebarMenu.
- **SidebarMenu:** grupo de navegación dentro del Sidebar, compuesto por una etiqueta visible opcional (SidebarMenuLabel) y una lista de SidebarMenuItem.
- **SidebarMenuLabel:** texto corto que nombra a un SidebarMenu (ej. "Getting started", "Components").
- **SidebarMenuItem:** elemento enlazable de un SidebarMenu que lleva a un destino de la aplicación.
- **Layout con sidebar:** composición de dos regiones hermanas, el Sidebar y el contenido principal.
- **Item activo:** SidebarMenuItem marcado con `aria-current="page"` por el consumidor.
- **Item deshabilitado:** SidebarMenuItem marcado con `aria-disabled="true"` por el consumidor. Es un estado exclusivamente visual: la librería no impide su activación.
- **Ancho de referencia del layout:** `48rem`, medido sobre el ancho del propio Layout con sidebar (no sobre el de la ventana). Es el umbral que separa la disposición horizontal de la apilada.
- **Nomenclatura pública:** bloque `sm-sidebar`, subelementos `sm-sidebar-menu`, `sm-sidebar-label` y `sm-sidebar-item`, y bloque de composición `sm-sidebar-layout`, según la convención de nombres de la constitución (sección D). Son contrato público una vez publicados.
- **Contraste:** relación de contraste entre color de texto y color de fondo calculada con la fórmula de luminancia relativa de WCAG 2.x a partir de los valores de los tokens semánticos.
- **Entorno de referencia:** entorno DOM simulado (happy-dom), igual que en la Spec 003. Como no calcula layout, los requisitos de geometría (anchos, disposición, ajuste de líneas, desbordamiento) se consideran cumplidos cuando las reglas CSS declaradas para el componente establecen el comportamiento pedido bajo la condición indicada (evidencia por reglas declaradas).

## 5. Requisitos Funcionales (Criterios de Aceptación en EARS)

- **004-RF-01 (Ubiquitous):** EL SISTEMA DEBE proveer el componente Sidebar únicamente mediante clases aplicables a elementos HTML nativos (contenedor de navegación, lista y enlace), sin definir ningún Custom Element nuevo y sin requerir JavaScript para su presentación.
- **004-RF-02 (Ubiquitous):** EL SISTEMA DEBE incluir las reglas del Sidebar y del Layout con sidebar en la hoja de estilos unificada de distribución, dentro de la capa de componentes de la librería.
- **004-RF-03 (Ubiquitous):** EL SISTEMA DEBE presentar cada SidebarMenuLabel con la familia tipográfica monoespaciada de la librería, en mayúsculas y con un espaciado entre letras de entre `0.04em` y `0.08em`.
- **004-RF-04 (Ubiquitous):** EL SISTEMA DEBE presentar cada SidebarMenuItem ocupando todo el ancho disponible del Sidebar, de forma que el área activable no se limite al texto del enlace.
- **004-RF-05 (State-Driven):** MIENTRAS un SidebarMenuItem sea item activo, EL SISTEMA DEBE presentarlo con un color de fondo y un color de texto distintos de los de un SidebarMenuItem no activo y con una franja de acento lateral sólida de entre `6px` y `8px` de ancho.
- **004-RF-06 (State-Driven):** MIENTRAS el puntero esté sobre un SidebarMenuItem que no sea item deshabilitado, EL SISTEMA DEBE presentarlo con un color de fondo distinto del de su estado de reposo.
- **004-RF-07 (State-Driven):** MIENTRAS un SidebarMenuItem tenga el foco del teclado (foco visible), EL SISTEMA DEBE mostrar un contorno sólido de al menos `2px`, sin difuminado y con radio `0`.
- **004-RF-08 (Unwanted Behavior):** SI un SidebarMenuItem es item deshabilitado, ENTONCES EL SISTEMA DEBE presentarlo con un color de texto distinto del estado normal, no aplicarle el estilo de 004-RF-06 y mostrar el cursor de acción no permitida, sin bloquear su activación.
- **004-RF-09 (Unwanted Behavior):** SI el texto de un SidebarMenuItem o de un SidebarMenuLabel es más largo que el ancho del Sidebar, ENTONCES EL SISTEMA DEBE dividirlo en varias líneas dentro del Sidebar, sin desbordamiento horizontal ni recorte del texto.
- **004-RF-10 (Unwanted Behavior):** SI un SidebarMenu no tiene SidebarMenuLabel, ENTONCES EL SISTEMA DEBE presentar su lista de SidebarMenuItem sin reservar espacio vacío para la etiqueta ausente.
- **004-RF-11 (State-Driven):** MIENTRAS el ancho del Layout con sidebar sea mayor o igual al ancho de referencia, EL SISTEMA DEBE ubicar el Sidebar a la izquierda del contenido principal, con un único ancho fijo expresado en `rem` que no dependa de su contenido, y dar al contenido principal el ancho restante.
- **004-RF-12 (State-Driven):** MIENTRAS el ancho del Layout con sidebar sea menor al ancho de referencia, EL SISTEMA DEBE apilar el Sidebar arriba del contenido principal, ambos con el ancho completo del layout.
- **004-RF-13 (Ubiquitous):** EL SISTEMA DEBE construir las reglas del Sidebar y del Layout con sidebar solo con tokens semánticos (Tier 2) ya existentes, con radio `0`, bordes sólidos y sombras sin difuminado, de modo que el lint de estilos de la Spec 001 no reporte ninguna violación sobre ellas.
- **004-RF-14 (State-Driven):** MIENTRAS el tema oscuro esté activo, EL SISTEMA DEBE presentar el Sidebar con los valores oscuros de los tokens semánticos, sin que el componente declare reglas propias para el tema oscuro.
- **004-RF-15 (Ubiquitous):** EL SISTEMA DEBE declarar todas las clases públicas del Sidebar y del Layout con sidebar en el inventario del documento de diseño de la librería, y la verificación de coherencia de la Spec 002 debe aprobarlo.
- **004-RF-16 (Ubiquitous):** EL SISTEMA DEBE mostrar en la estructura actual del sitio de documentación una demo en vivo del Sidebar con al menos dos SidebarMenu, un item activo y un item deshabilitado, acompañada de snippets en los formatos HTML/Thymeleaf/HTMX y React/Astro que exige la constitución (sección D).
- **004-RF-17 (Ubiquitous):** EL SISTEMA DEBE garantizar un contraste de al menos `4.5:1` entre el color de texto y el color de fondo de cada SidebarMenuItem en sus estados de reposo, puntero encima, activo y deshabilitado, y de cada SidebarMenuLabel, tanto en el tema claro como en el oscuro.
- **004-RF-18 (Ubiquitous):** EL SISTEMA DEBE usar en la demo y en los snippets de 004-RF-16 un marcado de referencia accesible: contenedor de navegación como landmark con nombre accesible, `aria-current="page"` en el item activo, cada SidebarMenuLabel asociado como nombre accesible de la lista de su SidebarMenu y el item deshabilitado sin destino de navegación.

## 6. Requisitos No Funcionales (Verificables)

- **004-RNF-01:** El componente no debe añadir dependencias de runtime ni de desarrollo al proyecto.
- **004-RNF-02:** La suite de calidad existente (`npm run quality`, con las pruebas de las Specs 001, 002 y 003) y la compilación del sitio de documentación (`npm run docs:build`) deben terminar con código de salida `0` tras incorporar el componente.
- **004-RNF-03:** La API pública previa (tokens, clases `.sm-*`, Custom Elements, atributos, eventos, partes y exportaciones) debe seguir sin cambios: el componente solo agrega los nombres de clase de la sección 4.
- **004-RNF-04:** Los artefactos JavaScript de distribución (ESM y UMD) no deben contener ningún nombre de clase del Sidebar ni del Layout con sidebar.
- **004-RNF-05:** El componente no debe declarar tokens nuevos (`--sm-*`): el conjunto de tokens del inventario del documento de diseño sigue siendo el mismo antes y después de la tarea.
- **004-RNF-06:** Los requisitos de geometría (004-RF-04, 004-RF-09, 004-RF-11 y 004-RF-12) se verifican en el entorno de referencia por evidencia por reglas declaradas, con comandos deterministas sin acceso a red que terminan con código de salida `0` solo si se cumplen.

## 7. Casos Límite (Edge Cases)

- **004-CL-01 (Varios items activos):** si el consumidor marca más de un SidebarMenuItem como item activo, cada uno se presenta con el estilo de 004-RF-05. La librería no corrige el marcado porque no tiene estado.
- **004-CL-02 (Sidebar vacío):** un Sidebar sin SidebarMenu, o un SidebarMenu sin SidebarMenuItem, se presenta sin errores y sin elementos residuales visibles más allá del propio contenedor.
- **004-CL-03 (Item activo y deshabilitado a la vez):** prevalece la presentación de item deshabilitado (004-RF-08) y la franja de acento de 004-RF-05 se conserva para que siga indicando la ubicación.
- **004-CL-04 (Lista larga):** si la altura de los SidebarMenu supera la de la ventana, el Sidebar crece con su contenido y la página se desplaza de forma normal. No hay desplazamiento independiente en esta iteración.
- **004-CL-05 (Item deshabilitado con destino):** si el consumidor deja un destino de navegación en un item deshabilitado, el item sigue siendo activable. Es responsabilidad del consumidor omitir el destino, como muestra el marcado de referencia de 004-RF-18.

## 8. Fuera de Alcance (Out of Scope)

- Cualquier comportamiento interactivo: colapsar/expandir el Sidebar, botón de apertura en contenedores angostos, submenús anidados desplegables, persistencia del estado. Requieren un Web Component y una spec propia.
- Bloquear la activación de un item deshabilitado (por puntero o teclado): el estado deshabilitado es solo visual.
- Listas estáticas anidadas dentro de un SidebarMenuItem.
- Dirección de escritura de derecha a izquierda (RTL): 004-RF-11 se define solo para izquierda a derecha.
- Sidebar fijo en la ventana (*sticky*) o con desplazamiento independiente.
- Marcado automático del item activo según la URL: es responsabilidad del consumidor.
- Íconos dentro de los SidebarMenuItem e insignias o contadores.
- Tokens nuevos, incluido un token público para el ancho del Sidebar. El consumidor puede sobrescribir el ancho con una regla propia, ya que el CSS público vive dentro de capas.
- Verificación en un navegador real: el entorno de referencia es exclusivamente el DOM simulado.
- Subir la versión del paquete o la declarada en el documento de diseño: corresponde a un proceso de release aparte.
- Reorganizar el sitio de documentación con el Sidebar: es el alcance de la Spec 005. Esta spec solo agrega la demo del componente (004-RF-16) a la estructura actual del sitio, como trabajo transitorio aceptado para cumplir la sección D de la constitución.
- Variantes semánticas (`info`, `success`, `warning`, `danger`) del Sidebar.

## 9. Criterios de Finalización (Definition of Done)

- Todos los requisitos (`004-RF-01` a `004-RF-18`) cuentan con verificación programática en `[PASA]` ejecutada mediante `.seb/bin/seb verify componente_sidebar`.
- Los requisitos no funcionales `004-RNF-01` a `004-RNF-06` están respaldados por comandos con código de salida determinista.
- Cero violaciones a `docs/constitution.md`.

## 10. Dudas Abiertas y Puntos por Clarificar

Ninguna duda pendiente.

Decisiones del humano incorporadas en la clarificación: bloque de composición `sm-sidebar-layout`; ancho de referencia `48rem` medido sobre el layout; ancho del Sidebar fijo en `rem` sin token público; demo transitoria en la estructura actual del sitio; requisitos de geometría verificados por reglas declaradas en happy-dom, sin navegador real; item deshabilitado solo visual, con el consumidor responsable de omitir el destino; solo tokens Tier 2 existentes (si no alcanzan, el planificador aborta y la spec vuelve a clarificación); contraste mínimo `4.5:1` en todos los estados y ambos temas; 004-RNF-04 reformulado como ausencia de nombres de clase del Sidebar en los artefactos JavaScript; subida de versión fuera de alcance; marcado de referencia accesible obligatorio en demo y snippets; listas anidadas y RTL fuera de alcance.
