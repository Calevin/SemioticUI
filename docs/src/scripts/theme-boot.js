// Arranque del tema del sitio de documentacion (005-RF-11, 005-RF-12).
// Script clasico insertado en linea en el head: aplica el tema oscuro guardado antes del primer pintado.
// Ante un almacenamiento inaccesible o un valor desconocido deja el tema claro, sin escribir en la consola.
(function () {
  try {
    if (window.localStorage.getItem('sm-docs-theme') === 'dark') {
      document.documentElement.setAttribute('data-sm-theme', 'dark');
    }
  } catch (error) {
    // Almacenamiento no disponible: se conserva el tema claro
  }
})();
