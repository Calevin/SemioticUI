// Plugin local de Stylelint con las reglas del Semiotic Standard que no existen de forma nativa (Spec 001).
import stylelint from 'stylelint';
import { extractDropShadows, findBlurredShadows, findHexOutsideVarFallback } from './css-value-utils.js';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const NAMESPACE = 'semiotic';

// Propiedades cuyo valor es directamente una lista de sombras
const SHADOW_PROPERTIES = new Set(['box-shadow', 'text-shadow']);
// Propiedades cuyo valor puede contener funciones drop-shadow()
const FILTER_PROPERTIES = new Set(['filter', 'backdrop-filter']);

/**
 * Devuelve la funcion de regla validando que la opcion primaria sea `true`.
 */
function defineRule(ruleName, messages, check) {
  const rule = (primary) => (root, result) => {
    const valid = validateOptions(result, ruleName, { actual: primary, possible: [true] });
    if (!valid) return;
    root.walkDecls((decl) => {
      for (const { message, word } of check(decl, messages)) {
        report({ ruleName, result, node: decl, message, word });
      }
    });
  };
  rule.ruleName = ruleName;
  rule.messages = messages;
  return createPlugin(ruleName, rule);
}

const blurredShadowRuleName = `${NAMESPACE}/no-blurred-shadow`;
const blurredShadowMessages = ruleMessages(blurredShadowRuleName, {
  rejected: (layer) => `Unexpected blurred shadow "${layer}" (Semiotic Standard requires blur 0)`,
});

const noBlurredShadow = defineRule(blurredShadowRuleName, blurredShadowMessages, (decl, messages) => {
  const property = decl.prop.toLowerCase();
  const isShadowToken = property.startsWith('--') && property.includes('shadow');
  let layers = [];

  if (SHADOW_PROPERTIES.has(property) || isShadowToken) {
    layers = findBlurredShadows(decl.value);
  } else if (FILTER_PROPERTIES.has(property)) {
    layers = extractDropShadows(decl.value).flatMap((args) => findBlurredShadows(args));
  }

  return layers.map((layer) => ({ message: messages.rejected(layer), word: layer }));
});

const literalHexRuleName = `${NAMESPACE}/no-literal-hex-color`;
const literalHexMessages = ruleMessages(literalHexRuleName, {
  rejected: (hex) => `Unexpected literal hex color "${hex}" outside the tokens stylesheet; use a --sm-* token`,
});

const noLiteralHexColor = defineRule(literalHexRuleName, literalHexMessages, (decl, messages) =>
  findHexOutsideVarFallback(decl.value).map((hex) => ({ message: messages.rejected(hex), word: hex })),
);

export default [noBlurredShadow, noLiteralHexColor];
