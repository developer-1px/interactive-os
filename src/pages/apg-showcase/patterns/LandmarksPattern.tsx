/**
 * APG Landmarks Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 * Practice: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
 *
 * W3C APG spec:
 * - 8 landmark roles: banner, main, navigation, complementary, contentinfo, search, form, region
 * - Keyboard interaction: "Not applicable" — landmarks are structural, not interactive
 * - Semantic HTML elements create implicit landmark roles (e.g., <main>, <nav>, <header>, <footer>)
 * - Multiple instances of same role require unique aria-label/aria-labelledby
 * - All page content should reside within landmark regions
 * - One banner, one main, one contentinfo per page
 *
 * ZIFT classification: NONE
 *   Landmarks have zero keyboard interaction, zero OS state, zero ARIA state attributes.
 *   They are purely structural/semantic HTML — no Zone, Item, Field, or Trigger.
 *
 * OS pattern:
 *   No defineApp, no createZone, no bind. Pure semantic HTML showcase.
 *   This component demonstrates correct landmark usage for assistive technology.
 */

// ─── Landmark Definition ───

interface LandmarkDef {
  id: string;
  role: string;
  htmlElement: string;
  label: string;
  description: string;
  rules: string[];
}

const LANDMARKS: LandmarkDef[] = [
  {
    id: "lm-banner",
    role: "banner",
    htmlElement: "<header>",
    label: "Banner",
    description:
      "Site-oriented content at the beginning of each page: logo, site identity, search.",
    rules: [
      "One per page",
      "Top-level only (not nested in article, aside, main, nav, section)",
      "HTML <header> in <body> context creates implicit banner role",
    ],
  },
  {
    id: "lm-navigation",
    role: "navigation",
    htmlElement: "<nav>",
    label: "Navigation",
    description: "Groups of links for navigating the website or page content.",
    rules: [
      "Multiple allowed — each must have a unique label",
      "Identical nav sets on multiple pages should share the same label",
      "Can be nested",
    ],
  },
  {
    id: "lm-main",
    role: "main",
    htmlElement: "<main>",
    label: "Main",
    description: "The primary content of the page.",
    rules: [
      "Exactly one per page",
      "Top-level only",
      "All primary content resides here",
    ],
  },
  {
    id: "lm-complementary",
    role: "complementary",
    htmlElement: "<aside>",
    label: "Complementary",
    description:
      "Supporting content, meaningful when separated from main content.",
    rules: [
      "Top-level only (not nested in other landmarks)",
      "Multiple allowed — each must have a unique label",
    ],
  },
  {
    id: "lm-search",
    role: "search",
    htmlElement: "<search>",
    label: "Search",
    description: "A collection of items that combine to create search functionality.",
    rules: [
      "Multiple allowed — each must have a unique label",
      "Preferred over 'form' when content is search-related",
      "Can be nested",
    ],
  },
  {
    id: "lm-form",
    role: "form",
    htmlElement: "<form>",
    label: "Form",
    description:
      "A collection of form items when no other landmark role applies.",
    rules: [
      "Must have an accessible name (aria-label or aria-labelledby)",
      "Use 'search' instead when the form serves search functionality",
      "Can be nested",
    ],
  },
  {
    id: "lm-region",
    role: "region",
    htmlElement: "<section>",
    label: "Region",
    description:
      "A perceivable section with sufficiently important content for landmark navigation.",
    rules: [
      "Must have an accessible name (always)",
      "Used when named landmarks do not describe the content",
      "Can be nested",
    ],
  },
  {
    id: "lm-contentinfo",
    role: "contentinfo",
    htmlElement: "<footer>",
    label: "Contentinfo",
    description:
      "Common footer information: copyright, privacy statements, accessibility links.",
    rules: [
      "One per page",
      "Top-level only",
      "HTML <footer> in <body> context creates implicit contentinfo role",
    ],
  },
];

// ─── Landmark Card ───

function LandmarkCard({ landmark }: { landmark: LandmarkDef }) {
  return (
    <div
      id={landmark.id}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">
            {landmark.role.charAt(0).toUpperCase()}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              role=&quot;{landmark.role}&quot;
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              HTML: <code className="text-indigo-600">{landmark.htmlElement}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-700">{landmark.description}</p>

        {/* Rules */}
        <div>
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Rules
          </h5>
          <ul className="space-y-1">
            {landmark.rules.map((rule, idx) => (
              <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">-</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Live Demo Section ───

function LandmarksLiveDemo() {
  return (
    <div className="border-2 border-dashed border-indigo-300 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-200">
        <h4 className="text-sm font-semibold text-indigo-800">
          Live Demo: Page with Landmarks
        </h4>
        <p className="text-xs text-indigo-600 mt-0.5">
          Each colored region below is a landmark. Screen readers can jump between them.
        </p>
      </div>

      <div className="bg-white">
        {/* Banner */}
        <header
          role="banner"
          aria-label="Demo site banner"
          className="px-5 py-3 bg-slate-800 text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500" />
            <span className="text-sm font-bold">Acme Corp</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
            banner
          </span>
        </header>

        {/* Navigation (primary) */}
        <nav
          aria-label="Primary"
          className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between"
        >
          <div className="flex gap-4">
            <a href="#" className="text-xs text-indigo-600 hover:underline">Home</a>
            <a href="#" className="text-xs text-indigo-600 hover:underline">Products</a>
            <a href="#" className="text-xs text-indigo-600 hover:underline">About</a>
            <a href="#" className="text-xs text-indigo-600 hover:underline">Contact</a>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
            navigation &quot;Primary&quot;
          </span>
        </nav>

        <div className="flex">
          {/* Main */}
          <main
            aria-label="Demo main content"
            className="flex-1 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Welcome</h3>
              <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                main
              </span>
            </div>
            <p className="text-sm text-gray-600">
              This is the primary content area. It should contain the page&apos;s
              central purpose. Exactly one <code>main</code> landmark per page.
            </p>

            {/* Search */}
            <search
              aria-label="Site search"
              className="border border-amber-200 rounded-md p-3 bg-amber-50"
            >
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="demo-search" className="text-xs font-medium text-amber-800">
                  Search
                </label>
                <span className="text-[10px] uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                  search
                </span>
              </div>
              <input
                id="demo-search"
                type="search"
                placeholder="Search articles..."
                className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded bg-white"
              />
            </search>

            {/* Form */}
            <form
              aria-labelledby="demo-form-heading"
              className="border border-green-200 rounded-md p-3 bg-green-50"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 id="demo-form-heading" className="text-xs font-medium text-green-800">
                  Newsletter Signup
                </h4>
                <span className="text-[10px] uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded">
                  form
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="flex-1 px-3 py-1.5 text-sm border border-green-300 rounded bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Subscribe
                </button>
              </div>
            </form>

            {/* Region */}
            <section
              aria-labelledby="demo-region-heading"
              className="border border-purple-200 rounded-md p-3 bg-purple-50"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 id="demo-region-heading" className="text-xs font-medium text-purple-800">
                  Featured Articles
                </h4>
                <span className="text-[10px] uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                  region
                </span>
              </div>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>Getting Started with Accessibility</li>
                <li>Understanding ARIA Landmarks</li>
                <li>Keyboard Navigation Best Practices</li>
              </ul>
            </section>
          </main>

          {/* Complementary */}
          <aside
            aria-label="Related resources"
            className="w-48 p-4 bg-teal-50 border-l border-teal-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-teal-800">Sidebar</h4>
              <span className="text-[10px] uppercase tracking-wider text-teal-600 bg-teal-100 px-2 py-0.5 rounded">
                complementary
              </span>
            </div>
            <ul className="space-y-1.5">
              <li className="text-xs text-teal-700">Related link 1</li>
              <li className="text-xs text-teal-700">Related link 2</li>
              <li className="text-xs text-teal-700">Related link 3</li>
            </ul>
          </aside>
        </div>

        {/* Navigation (secondary) */}
        <nav
          aria-label="Footer"
          className="px-5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between"
        >
          <div className="flex gap-4">
            <a href="#" className="text-xs text-gray-600 hover:underline">Privacy</a>
            <a href="#" className="text-xs text-gray-600 hover:underline">Terms</a>
            <a href="#" className="text-xs text-gray-600 hover:underline">Sitemap</a>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
            navigation &quot;Footer&quot;
          </span>
        </nav>

        {/* Contentinfo */}
        <footer
          role="contentinfo"
          aria-label="Demo site footer"
          className="px-5 py-3 bg-slate-800 text-slate-400 flex items-center justify-between"
        >
          <span className="text-xs">&copy; 2026 Acme Corp. All rights reserved.</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
            contentinfo
          </span>
        </footer>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function LandmarksPattern() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Landmarks</h3>
        <p className="text-sm text-gray-500 mb-1">
          W3C APG Landmarks Pattern: 8 roles that identify major page sections
          for assistive technology navigation. Keyboard interaction: Not applicable.{" "}
          <a
            href="https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            W3C APG Spec
          </a>{" "}
          |{" "}
          <a
            href="https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            Landmark Regions Practice
          </a>
        </p>
        <p className="text-xs text-gray-400">
          ZIFT classification: None (structural/semantic, no interaction).
          No defineApp, no createZone, no bind.
        </p>
      </div>

      {/* Live Demo */}
      <LandmarksLiveDemo />

      {/* Reference Cards */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          All 8 Landmark Roles
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LANDMARKS.map((lm) => (
            <LandmarkCard key={lm.id} landmark={lm} />
          ))}
        </div>
      </div>
    </div>
  );
}
