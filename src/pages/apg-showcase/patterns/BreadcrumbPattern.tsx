/**
 * APG Breadcrumb Pattern -- Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * W3C APG Breadcrumb spec:
 *   - nav element with aria-label="Breadcrumb"
 *   - Ordered list (ol) containing link items
 *   - Last link has aria-current="page"
 *   - No keyboard interaction beyond standard link behavior
 *   - Visual separators excluded from accessibility tree
 *
 * ZIFT Classification: NONE (static landmark structure)
 *   No Zone, no Field, no Trigger.
 *   Pure structural ARIA -- no defineApp, no createZone, no bind.
 *   Each link is a standard <a> that participates in the normal Tab order.
 */

// -- Breadcrumb Data --

interface BreadcrumbItem {
  label: string;
  href: string;
}

const BREADCRUMB_ITEMS: BreadcrumbItem[] = [
  { label: "Home", href: "#home" },
  { label: "Products", href: "#products" },
  { label: "Accessories", href: "#accessories" },
  { label: "Wireless Earbuds", href: "#wireless-earbuds" },
];

// -- Separator --

function Separator() {
  return (
    <span aria-hidden="true" className="mx-2 text-gray-400 select-none">
      /
    </span>
  );
}

// -- Main Component --

export function BreadcrumbPattern() {
  const lastIndex = BREADCRUMB_ITEMS.length - 1;

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Breadcrumb</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Example: A breadcrumb trail showing the page hierarchy. The
        last link indicates the current page via{" "}
        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
          aria-current=&quot;page&quot;
        </code>
        . Separators are hidden from assistive technology.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
      </p>

      <nav aria-label="Breadcrumb">
        <ol className="flex items-center flex-wrap text-sm">
          {BREADCRUMB_ITEMS.map((item, index) => {
            const isCurrent = index === lastIndex;

            return (
              <li key={item.label} className="flex items-center">
                {index > 0 && <Separator />}
                <a
                  href={item.href}
                  {...(isCurrent ? { "aria-current": "page" as const } : {})}
                  className={
                    isCurrent
                      ? "font-semibold text-indigo-700"
                      : "text-gray-600 hover:text-indigo-600 hover:underline transition-colors"
                  }
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
