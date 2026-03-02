/**
 * APG Tabs Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * W3C APG Example: Code editor with HTML/CSS/JS tabs.
 *
 * Headless pattern:
 *   OS injects data-focused, aria-selected, role, tabIndex onto Item.
 *   CSS reads those attributes. No render-prop, no JS state for selection.
 *
 * ARIA semantics:
 *   - tablist: horizontal container (role="tablist")
 *   - tab: each tab button (role="tab", aria-selected)
 *   - tabpanel: content panel (role="tabpanel", aria-labelledby)
 *
 * Keyboard:
 *   - Left/Right Arrow: navigate tabs (wraps)
 *   - Home/End: first/last tab
 *   - Auto-activation: selection follows focus (followFocus=true)
 */

import { defineApp } from "@/os/app/defineApp";

// ─── Tab Data ───

interface TabDefinition {
  id: string;
  label: string;
  language: string;
  code: string;
}

const TABS: TabDefinition[] = [
  {
    id: "tab-html",
    label: "HTML",
    language: "html",
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Example</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>A simple web page.</p>
    <script src="app.js"></script>
  </body>
</html>`,
  },
  {
    id: "tab-css",
    label: "CSS",
    language: "css",
    code: `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 2rem;
  background: #f5f5f5;
}

h1 {
  color: #1a1a1a;
  font-size: 2rem;
}

p {
  color: #555;
  line-height: 1.6;
}`,
  },
  {
    id: "tab-js",
    label: "JavaScript",
    language: "javascript",
    code: `// Greet the user
function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);

// Update the page title
document.title = message;`,
  },
];

// ─── App + Zone (defineApp pattern) ───

const TabsApp = defineApp<Record<string, never>>("apg-tabs-app", {});
const tabsZone = TabsApp.createZone("apg-tablist");
const TabsUI = tabsZone.bind({ role: "tablist" });

// ─── Tab Row ───
// Zero render-prop. Zero JS state for tab activation.
// OS → aria-selected → CSS reads it. Panel shown via Item.Region.
function TabButton({ tab }: { tab: TabDefinition }) {
  return (
    <TabsUI.Item
      id={tab.id}
      className="
        group relative px-5 py-3 text-sm font-medium
        cursor-pointer select-none whitespace-nowrap
        border-b-2 border-transparent
        text-gray-500
        hover:text-gray-700 hover:border-gray-300
        aria-selected:text-indigo-600 aria-selected:border-indigo-600
        data-[focused=true]:outline-none data-[focused=true]:ring-2
        data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-inset
        transition-colors
      "
    >
      {tab.label}
    </TabsUI.Item>
  );
}

function TabPanel({ tab }: { tab: TabDefinition }) {
  return (
    <TabsUI.Item.Region for={tab.id} className="p-0">
      <div className="relative">
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-800 text-gray-400 uppercase tracking-wider select-none">
          {tab.language}
        </div>
        <pre className="overflow-x-auto p-5 pt-8 text-sm font-mono leading-relaxed text-gray-200 min-h-48">
          <code>{tab.code}</code>
        </pre>
      </div>
    </TabsUI.Item.Region>
  );
}

// ─── Main Component ───

export function TabsPattern() {
  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Tabs</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Example: Code editor with HTML, CSS, and JavaScript tabs.
        Left/Right arrows navigate. Selection follows focus automatically.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
      </p>

      <div className="rounded-xl border-2 border-gray-400 overflow-hidden shadow-lg bg-gray-900">
        {/* Tab List */}
        <TabsUI.Zone
          className="flex border-b border-gray-700 bg-gray-800 px-2 pt-2"
          aria-label="Code editor tabs"
        >
          {TABS.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </TabsUI.Zone>

        {/* Tab Panels */}
        <div>
          {TABS.map((tab) => (
            <TabPanel key={tab.id} tab={tab} />
          ))}
        </div>
      </div>
    </div>
  );
}
