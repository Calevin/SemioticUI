// Ficha "Sidebar" (005-RF-16, 005-RF-17, 005-RF-19): reutiliza los snippets de la demo de la Spec 004.
// Los id de la demo no chocan con los del sitio (nav-getting-started, nav-components, main-content).
import { importStatement, CSS_SPECIFIER } from './imports.js';

const html = `<div class="sm-sidebar-layout">
  <nav class="sm-sidebar" aria-label="Ship systems">
    <div class="sm-sidebar-menu">
      <h3 class="sm-sidebar-label" id="nav-ops">Operations</h3>
      <ul aria-labelledby="nav-ops">
        <li><a class="sm-sidebar-item" href="#preview-title" aria-current="page">Navigation Console</a></li>
        <li><a class="sm-sidebar-item" href="#code-title">Alert Board</a></li>
        <li><a class="sm-sidebar-item" href="#code-title">Life Support Telemetry and Atmospheric Scrubbers</a></li>
      </ul>
    </div>
    <div class="sm-sidebar-menu">
      <h3 class="sm-sidebar-label" id="nav-maint">Maintenance</h3>
      <ul aria-labelledby="nav-maint">
        <li><a class="sm-sidebar-item" href="#code-title">Thruster Diagnostics</a></li>
        <li><a class="sm-sidebar-item" aria-disabled="true">Reactor Core (Locked)</a></li>
      </ul>
    </div>
  </nav>
  <div class="sm-card">
    <div class="sm-card-body">
      <p>Main content region. Below 48rem of its own width the layout stacks the sidebar on top.</p>
    </div>
  </div>
</div>`;

const thymeleaf = `<div class="sm-sidebar-layout">
  <nav class="sm-sidebar" aria-label="Ship systems">
    <div class="sm-sidebar-menu" th:each="group : \${navigation.groups}">
      <h3 class="sm-sidebar-label" th:id="\${group.id}" th:text="\${group.label}">Operations</h3>
      <ul th:attr="aria-labelledby=\${group.id}">
        <li th:each="item : \${group.items}">
          <a th:if="\${!item.disabled}" class="sm-sidebar-item"
             th:href="@{\${item.path}}"
             th:attr="aria-current=\${item.path == currentPath} ? 'page' : null"
             hx-boost="true"
             th:text="\${item.label}">Navigation Console</a>
          <a th:if="\${item.disabled}" class="sm-sidebar-item" aria-disabled="true"
             th:text="\${item.label}">Reactor Core</a>
        </li>
      </ul>
    </div>
  </nav>
  <main th:insert="~{:: content}"></main>
</div>`;

const react = `${importStatement(CSS_SPECIFIER)}

export function ShipNavigation({ groups, currentPath, children }) {
  return (
    <div className="sm-sidebar-layout">
      <nav className="sm-sidebar" aria-label="Ship systems">
        {groups.map((group) => (
          <div className="sm-sidebar-menu" key={group.id}>
            <h3 className="sm-sidebar-label" id={group.id}>{group.label}</h3>
            <ul aria-labelledby={group.id}>
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.disabled ? (
                    <a className="sm-sidebar-item" aria-disabled="true">{item.label}</a>
                  ) : (
                    <a
                      className="sm-sidebar-item"
                      href={item.path}
                      aria-current={item.path === currentPath ? 'page' : undefined}>
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}`;

export default {
  name: 'Sidebar',
  slug: 'sidebar',
  piece: '.sm-sidebar',
  what:
    'A stateless side navigation built only with classes on a native nav, lists and links, with no JavaScript. Groups (.sm-sidebar-menu) hold an optional label and a list of full width items.',
  when:
    'Use it for the primary navigation of a documentation site or an application shell, inside .sm-sidebar-layout as its first child. Mark the active item with aria-current="page" on the server or in your framework, and a disabled item with aria-disabled="true" and no href. It has no collapse, sticky position or submenus.',
  preview: { html, thymeleaf, react },
  variants: [],
};
