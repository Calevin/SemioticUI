// Configuracion oficial del lint de estilos (Spec 001)
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['./tools/stylelint/semiotic-plugin.js'],
  // Los comentarios stylelint-disable no tienen efecto: las reglas del Semiotic Standard no se pueden saltear
  ignoreDisables: true,
  rules: {
    // Una hoja de estilos vacia es valida
    'no-empty-source': null,

    // Radio ortogonal: solo 0 o el token --sm-radius, en todas las variantes por esquina
    'declaration-property-value-allowed-list': {
      '/^border(?:-[a-z]+)*-radius$/': ['/^0(?:px)?$/', '/^var\\(--sm-radius(?:,\\s*0(?:px)?)?\\)$/'],
    },
    // Sombras duras: blur 0 en box-shadow, text-shadow, drop-shadow() y tokens de sombra
    'semiotic/no-blurred-shadow': true,
    // Sin selector universal ni :host-context() (sin soporte en Firefox/Safari)
    'selector-max-universal': 0,
    'selector-pseudo-class-disallowed-list': ['host-context'],
    // Clases sm-<bloque>[-<elemento>][--<modificador>]
    'selector-class-pattern': ['^sm-[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$'],
    // Custom properties publicas --sm-* o alias internos --_*
    'custom-property-pattern': ['^(?:sm-[a-z0-9]+(?:-[a-z0-9]+)*|_[a-z0-9]+(?:-[a-z0-9]+)*)$'],
    // Los componentes consumen tokens, nunca colores literales
    'semiotic/no-literal-hex-color': true,

    // Ajustes de la configuracion estandar permitidos por 001-RNF-07 (plan de la Spec 001, Decision 5)
    // Las lineas vacias agrupan tokens y alias por familia: convencion deliberada del proyecto
    'custom-property-empty-line-before': null,
    'declaration-empty-line-before': null,
    // Corregirla obliga a reordenar selectores y altera el orden de la cascada del CSS distribuido
    'no-descending-specificity': null,
    // Los nombres de familias tipograficas conservan su capitalizacion oficial
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--sm-font-/'] }],
  },
  overrides: [
    // Unica excepcion permitida: la hoja de tokens define la paleta literal
    {
      files: ['src/css/tokens.css'],
      rules: { 'semiotic/no-literal-hex-color': null },
    },
  ],
};
