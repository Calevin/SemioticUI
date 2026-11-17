const VALID_VARIANTS = new Set(['info', 'success', 'warning', 'danger']);

const VARIANT_LABELS = {
  info: 'INFO',
  success: 'NOMINAL',
  warning: 'CAUTION',
  danger: 'ALERT',
};

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

let cachedTemplate = null;

/**
 * Construye de forma perezosa la plantilla del Shadow DOM para evitar errores en entornos SSR sin document.
 */
function getAlertTemplate() {
  if (cachedTemplate) return cachedTemplate;

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      @layer base, variants;

      @layer base {
        :host {
          --_alert-bg: var(--sm-bg-surface, #f4f1ea);
          --_alert-fg: var(--sm-text-primary, #111315);
          --_alert-border: var(--sm-border-color, #111315);
          --_alert-border-width: var(--sm-border-width, 2px);
          --_alert-shadow: var(--sm-shadow-md, 4px 4px 0 0 #111315);
          --_alert-accent: var(--sm-color-info, #0f6cbd);
          --_alert-accent-surface: var(--sm-color-info-surface, #dbeafe);
          --_alert-accent-fg: #f4f1ea;
          --_alert-font-mono: var(--sm-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
          --_alert-font-sans: var(--sm-font-sans, system-ui, sans-serif);

          display: block;
          container-type: inline-size;
          color: var(--_alert-fg);
          font-family: var(--_alert-font-sans);
        }

        :host([hidden]),
        :host([dismissed]) {
          display: none;
        }

        .alert {
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-areas:
            'badge header close'
            'body body body';
          align-items: start;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border: var(--_alert-border-width) solid var(--_alert-border);
          border-inline-start: 8px solid var(--_alert-accent);
          border-radius: var(--sm-radius, 0px);
          background-color: var(--_alert-bg);
          box-shadow: var(--_alert-shadow);
        }

        .badge {
          grid-area: badge;
          display: inline-flex;
          align-items: center;
          padding: 0.125rem 0.5rem;
          border: var(--_alert-border-width) solid var(--_alert-border);
          background-color: var(--_alert-accent);
          color: var(--_alert-accent-fg);
          font-family: var(--_alert-font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1.25;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .header {
          grid-area: header;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }

        .code {
          padding: 0.125rem 0.375rem;
          border: 1px solid var(--_alert-border);
          background-color: var(--_alert-accent-surface);
          color: var(--_alert-fg);
          font-family: var(--_alert-font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .heading {
          margin: 0;
          font-family: var(--_alert-font-mono);
          font-size: 0.9375rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .body {
          grid-area: body;
          min-width: 0;
          font-size: 0.9375rem;
          line-height: 1.5;
        }

        .close-btn {
          grid-area: close;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
          min-height: 2rem;
          padding: 0.25rem 0.5rem;
          border: var(--_alert-border-width) solid var(--_alert-border);
          border-radius: var(--sm-radius, 0px);
          background-color: var(--_alert-accent-surface);
          color: inherit;
          font: inherit;
          font-family: var(--_alert-font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .close-btn:hover {
          background-color: var(--_alert-accent);
          color: var(--_alert-accent-fg);
        }

        .close-btn:focus-visible {
          outline: var(--sm-focus-width, 3px) solid var(--sm-focus-color, #0f6cbd);
          outline-offset: var(--sm-focus-offset, 2px);
        }

        [hidden] {
          display: none;
        }

        @container (min-width: 34rem) {
          .alert {
            grid-template-columns: auto 1fr auto;
            grid-template-areas:
              'badge header close'
              'badge body close';
          }
        }
      }

      @layer variants {
        :host([variant='success']) {
          --_alert-accent: var(--sm-color-success, #1f8a4c);
          --_alert-accent-surface: var(--sm-color-success-surface, #dcfce7);
          --_alert-accent-fg: #f4f1ea;
        }

        :host([variant='warning']) {
          --_alert-accent: var(--sm-color-warning, #f5b700);
          --_alert-accent-surface: var(--sm-color-warning-surface, #fef3c7);
          --_alert-accent-fg: #111315;
        }

        :host([variant='danger']) {
          --_alert-accent: var(--sm-color-danger, #d62828);
          --_alert-accent-surface: var(--sm-color-danger-surface, #fde2e2);
          --_alert-accent-fg: #f4f1ea;
        }
      }
    </style>
    <div class="alert" part="base">
      <span class="badge" part="badge"></span>
      <div class="header" part="header">
        <span class="code" part="code" hidden></span>
        <span class="heading" part="heading" hidden>
          <slot name="heading"></slot>
        </span>
      </div>
      <div class="body" part="body">
        <slot></slot>
      </div>
      <button type="button" class="close-btn" part="close-button" hidden>ACK</button>
    </div>
  `;

  cachedTemplate = template;
  return cachedTemplate;
}

/**
 * Web Component nativo para alertas tecnicas y de estado con soporte para Thymeleaf, HTMX y frameworks JS.
 * @element semiotic-alert
 * @fires sm-dismiss - Se emite cuando el usuario o codigo solicita cerrar la alerta. Cancelable con preventDefault().
 * @fires sm-show - Se emite cuando la alerta vuelve a mostrarse mediante show().
 */
export class SemioticAlert extends BaseElement {
  static observedAttributes = [
    'variant',
    'code',
    'heading',
    'dismissible',
    'dismissed',
    'close-label',
  ];

  #internals = null;
  #badgeEl = null;
  #codeEl = null;
  #headingEl = null;
  #headingSlotEl = null;
  #headingTextNode = null;
  #closeBtn = null;
  #isInitialized = false;

  constructor() {
    super();

    if (typeof document === 'undefined') return;

    this.attachShadow({ mode: 'open' });

    if (typeof this.attachInternals === 'function') {
      try {
        this.#internals = this.attachInternals();
      } catch {
        this.#internals = null;
      }
    }

    const fragment = getAlertTemplate().content.cloneNode(true);
    this.shadowRoot.append(fragment);

    this.#badgeEl = this.shadowRoot.querySelector('.badge');
    this.#codeEl = this.shadowRoot.querySelector('.code');
    this.#headingEl = this.shadowRoot.querySelector('.heading');
    this.#headingSlotEl = this.shadowRoot.querySelector('slot[name="heading"]');
    this.#closeBtn = this.shadowRoot.querySelector('.close-btn');

    this.#headingTextNode = document.createTextNode('');
    this.#headingEl.prepend(this.#headingTextNode);

    this.#closeBtn.addEventListener('click', () => this.dismiss());
    this.#headingSlotEl.addEventListener('slotchange', () => this.#syncHeading());
    this.#isInitialized = true;
  }

  connectedCallback() {
    if (!this.#isInitialized) return;
    // Sincroniza estado inicial al conectarse o al hacer upgrade sobre HTML SSR
    this.#syncUI();
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (!this.#isInitialized || oldValue === newValue) return;
    this.#syncUI();
  }

  get variant() {
    const raw = (this.getAttribute('variant') ?? 'info').toLowerCase();
    return VALID_VARIANTS.has(raw) ? raw : 'info';
  }

  set variant(value) {
    const normalized = String(value ?? 'info').toLowerCase();
    const next = VALID_VARIANTS.has(normalized) ? normalized : 'info';
    if (this.getAttribute('variant') !== next) {
      this.setAttribute('variant', next);
    }
  }

  get code() {
    return this.getAttribute('code') ?? '';
  }

  set code(value) {
    if (value) {
      this.setAttribute('code', String(value));
    } else {
      this.removeAttribute('code');
    }
  }

  get heading() {
    return this.getAttribute('heading') ?? '';
  }

  set heading(value) {
    if (value) {
      this.setAttribute('heading', String(value));
    } else {
      this.removeAttribute('heading');
    }
  }

  get dismissible() {
    return this.hasAttribute('dismissible');
  }

  set dismissible(value) {
    this.toggleAttribute('dismissible', Boolean(value));
  }

  get dismissed() {
    return this.hasAttribute('dismissed');
  }

  set dismissed(value) {
    this.toggleAttribute('dismissed', Boolean(value));
  }

  get closeLabel() {
    return this.getAttribute('close-label') ?? 'Dismiss alert';
  }

  set closeLabel(value) {
    if (value) {
      this.setAttribute('close-label', String(value));
    } else {
      this.removeAttribute('close-label');
    }
  }

  /**
   * Cierra la alerta emitiendo el evento cancelable sm-dismiss.
   */
  dismiss() {
    if (this.dismissed) return false;

    const event = new CustomEvent('sm-dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: {
        variant: this.variant,
        code: this.code,
      },
    });

    this.dispatchEvent(event);
    if (!event.defaultPrevented) {
      this.dismissed = true;
      return true;
    }
    return false;
  }

  /**
   * Vuelve a mostrar una alerta cerrada previamente y emite sm-show.
   */
  show() {
    if (!this.dismissed) return;
    this.dismissed = false;

    this.dispatchEvent(
      new CustomEvent('sm-show', {
        bubbles: true,
        composed: true,
        detail: {
          variant: this.variant,
          code: this.code,
        },
      })
    );
  }

  #syncUI() {
    const currentVariant = this.variant;
    this.#badgeEl.textContent = VARIANT_LABELS[currentVariant];

    const codeText = this.code.trim();
    this.#codeEl.textContent = codeText;
    this.#codeEl.hidden = codeText.length === 0;

    this.#syncHeading();

    const canDismiss = this.dismissible;
    this.#closeBtn.hidden = !canDismiss;
    this.#closeBtn.setAttribute('aria-label', this.closeLabel);

    this.#syncAccessibility(currentVariant, canDismiss);
  }

  #syncHeading() {
    const attrHeading = this.heading.trim();
    const hasSlottedHeading = this.#headingSlotEl.assignedNodes({ flatten: true }).length > 0;
    this.#headingTextNode.textContent = hasSlottedHeading ? '' : attrHeading;
    this.#headingEl.hidden = !hasSlottedHeading && attrHeading.length === 0;
  }

  #syncAccessibility(variant, canDismiss) {
    const targetRole = variant === 'danger' ? 'alert' : 'status';

    if (this.#internals && 'role' in this.#internals) {
      this.#internals.role = targetRole;
    } else if (!this.hasAttribute('role')) {
      this.setAttribute('role', targetRole);
    }

    if (this.#internals?.states) {
      if (canDismiss) {
        this.#internals.states.add('dismissible');
      } else {
        this.#internals.states.delete('dismissible');
      }

      if (this.dismissed) {
        this.#internals.states.add('dismissed');
      } else {
        this.#internals.states.delete('dismissed');
      }
    }
  }
}

/**
 * Registra el Custom Element <semiotic-alert> de forma segura e idempotente.
 */
export function registerSemioticAlert() {
  if (typeof customElements !== 'undefined' && !customElements.get('semiotic-alert')) {
    customElements.define('semiotic-alert', SemioticAlert);
  }
}
