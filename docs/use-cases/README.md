# Catálogo de Casos de Uso — semiotic-ui

Documentación funcional de caja negra del comportamiento observable de la librería. Cada caso de uso se deriva de una spec verificada con `seb verify` o, cuando se indica "Línea base", del código previo a seb-harness generado con el prompt fundacional (`prompt_de_inicializaci_n_semiotic_ui.md`) y fijado por los tests de la Spec 001.

Las Specs 001 (`suite_calidad_tests_lint`) y 002 (`coherencia_documento_diseno`) declaran `Afecta-UC: ninguno`: son infraestructura de calidad y no generan casos de uso propios, aunque se citan como respaldo de verificación.

| ID Caso de Uso | Dominio | Descripcion Funcional | Spec Originaria | Specs de Evolución | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [UC-package_import_bundler](UC-package_import_bundler.md) | package | Importar el paquete con Vite/Rollup (import bare o con nombre) y obtener los Web Components auto-registrados | `specs/003_autoregistro_import_bare_spec.md` | - | Verificado |
| [UC-package_load_script](UC-package_load_script.md) | package | Cargar el artefacto UMD con script clásico (CDN, Thymeleaf, HTMX) y obtener el auto-registro y el global `SemioticUI` | `specs/003_autoregistro_import_bare_spec.md` | - | Verificado |
| [UC-package_import_ssr](UC-package_import_ssr.md) | package | Importar el paquete en Node (SSR) sin DOM sin excepciones ni registro | `specs/003_autoregistro_import_bare_spec.md` | - | Verificado |
| [UC-alert_dismiss](UC-alert_dismiss.md) | alert | Mostrar, cerrar (cancelable) y restaurar una `<semiotic-alert>` con eventos `sm-dismiss` / `sm-show` | Línea base (prompt fundacional, commit `12ff178`) | - | Línea base (tests de `specs/001_suite_calidad_tests_lint_spec.md`) |
| [UC-styles_apply_classes](UC-styles_apply_classes.md) | styles | Maquetar botones, tarjetas y etiquetas técnicas con clases `.sm-*` y alternar el tema oscuro | Línea base (prompt fundacional, commit `12ff178`) | - | Línea base (lint de `specs/001_suite_calidad_tests_lint_spec.md`) |
