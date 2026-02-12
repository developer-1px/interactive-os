import "./TestDashboard.css";

// ═══════════════════════════════════════════════════
// Test Data — hardcoded from actual codebase analysis
// ═══════════════════════════════════════════════════

interface TestFile {
  file: string;
  path: string;
  describes: string[];
  testCount: number;
}

interface TestCategory {
  id: string;
  name: string;
  color: string;
  runner: string;
  command: string;
  files: TestFile[];
}

const categories: TestCategory[] = [
  {
    id: "vitest",
    name: "Vitest Unit Tests",
    color: "#729b1b",
    runner: "vitest",
    command: "npm test",
    files: [
      {
        file: "keybindings.test.ts",
        path: "src/os/keymaps",
        describes: ["Keybinding Resolution", "navigating", "editing"],
        testCount: 16,
      },
      {
        file: "zoneRegistry.test.ts",
        path: "src/os/2-contexts",
        describes: ["ZoneRegistry"],
        testCount: 9,
      },
      {
        file: "os-commands.test.ts",
        path: "src/os/3-commands",
        describes: ["CHECK", "SELECT", "ACTIVATE", "OS_DELETE", "OS_MOVE"],
        testCount: 9,
      },
      {
        file: "clipboard-commands.test.ts",
        path: "src/os/3-commands",
        describes: ["OS_COPY → CopyTodo", "OS_CUT → CutTodo", "round-trip"],
        testCount: 5,
      },
      {
        file: "resolveFocusId.test.ts",
        path: "src/os/3-commands/utils",
        describes: ["resolveFocusId"],
        testCount: 6,
      },
      {
        file: "inferPipeline.test.ts",
        path: "src/inspector/panels",
        describes: ["inferPipeline"],
        testCount: 12,
      },
      {
        file: "todo.test.ts",
        path: "src/apps/todo/tests",
        describes: [
          "CRUD",
          "Editing",
          "Selectors",
          "Ordering",
          "Category",
          "Clipboard",
          "View",
          "Undo/Redo",
          "Draft",
        ],
        testCount: 21,
      },
      {
        file: "todo.module.test.ts",
        path: "src/apps/todo/tests",
        describes: [
          "CRUD",
          "Editing",
          "Selectors",
          "Ordering",
          "Category",
          "Clipboard",
          "View",
          "Module Instance",
          "Draft",
        ],
        testCount: 21,
      },
      {
        file: "todo.v3.test.ts",
        path: "src/apps/todo/tests",
        describes: [
          "defineApp + createWidget",
          "CRUD",
          "Editing",
          "Selectors",
          "Ordering",
          "Category",
          "Clipboard",
          "View",
        ],
        testCount: 19,
      },
    ],
  },
  {
    id: "playwright",
    name: "Playwright E2E Tests",
    color: "#2d8cf0",
    runner: "playwright",
    command: "npx playwright test",
    files: [
      {
        file: "smoke.spec.ts",
        path: "e2e",
        describes: ["Smoke"],
        testCount: 1,
      },
      {
        file: "focus-showcase.spec.ts",
        path: "e2e/focus-showcase",
        describes: ["Focus Showcase"],
        testCount: 13,
      },
      {
        file: "dialog.spec.ts",
        path: "e2e/playground",
        describes: ["Dialog Playground"],
        testCount: 9,
      },
      {
        file: "todo.spec.ts",
        path: "e2e/todo",
        describes: ["Todo App"],
        testCount: 12,
      },
      {
        file: "todo-v2.spec.ts",
        path: "e2e/todo",
        describes: ["Todo App v2 (createModule)"],
        testCount: 12,
      },
      {
        file: "builder-spatial.spec.ts",
        path: "e2e/builder",
        describes: ["Builder Spatial Navigation"],
        testCount: 10,
      },
      {
        file: "grid.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Grid"],
        testCount: 7,
      },
      {
        file: "listbox.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Listbox"],
        testCount: 5,
      },
      {
        file: "menu.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Menu"],
        testCount: 5,
      },
      {
        file: "tabs.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Tabs"],
        testCount: 4,
      },
      {
        file: "tree.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Tree"],
        testCount: 3,
      },
      {
        file: "toolbar.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Toolbar"],
        testCount: 6,
      },
      {
        file: "radiogroup.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Radiogroup"],
        testCount: 5,
      },
      {
        file: "disclosure.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Disclosure"],
        testCount: 4,
      },
      {
        file: "complex-patterns.spec.ts",
        path: "e2e/aria-showcase",
        describes: ["Complex Patterns"],
        testCount: 12,
      },
    ],
  },
  {
    id: "testbot",
    name: "TestBot In-Browser Tests",
    color: "#e5a00d",
    runner: "testbot",
    command: "npm run dev → Inspector",
    files: [
      {
        file: "KernelLabBot.tsx",
        path: "src/pages/tests",
        describes: [
          "Increment",
          "Multiple increments",
          "Decrement",
          "Reset",
          "Add item",
          "Remove item",
          "Effect trigger",
          "Batch Add",
          "Transaction",
          "Time-travel",
          "Clear log",
          "Effect Log",
          "useComputed",
          "useDispatch",
        ],
        testCount: 16,
      },
      {
        file: "RadixPlaygroundBot.tsx",
        path: "src/pages/playground",
        describes: ["Radix Dialog", "Radix Modal"],
        testCount: 4,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════
// Derived stats
// ═══════════════════════════════════════════════════

const totalTests = categories.reduce(
  (sum, cat) => sum + cat.files.reduce((s, f) => s + f.testCount, 0),
  0,
);
const totalFiles = categories.reduce((sum, cat) => sum + cat.files.length, 0);
const totalDescribes = categories.reduce(
  (sum, cat) => sum + cat.files.reduce((s, f) => s + f.describes.length, 0),
  0,
);

// Areas covered by tests
const coveredModules = [
  { name: "OS Commands", tests: 14, module: "os/3-commands" },
  { name: "Keybindings", tests: 16, module: "os/keymaps" },
  { name: "Zone Registry", tests: 9, module: "os/2-contexts" },
  { name: "Focus Utils", tests: 6, module: "os/3-commands/utils" },
  { name: "Inspector Pipeline", tests: 12, module: "inspector/panels" },
  { name: "Todo App (v1)", tests: 21, module: "apps/todo (appSlice)" },
  { name: "Todo App (v2)", tests: 21, module: "apps/todo (createModule)" },
  { name: "Todo App (v3)", tests: 19, module: "apps/todo (defineApp)" },
  { name: "ARIA Showcase", tests: 56, module: "e2e/aria-showcase" },
  { name: "Builder Navigation", tests: 10, module: "e2e/builder" },
  { name: "Dialog Playground", tests: 9, module: "e2e/playground" },
  { name: "Kernel Lab", tests: 16, module: "testbot/KernelLab" },
];

const maxModuleTests = Math.max(...coveredModules.map((m) => m.tests));

// ═══════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════

function StatCard({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div className="td-stat">
      <span className="td-stat-value" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="td-stat-label">{label}</span>
    </div>
  );
}

function Treemap() {
  const maxCount = Math.max(
    ...categories.flatMap((c) => c.files.map((f) => f.testCount)),
  );

  return (
    <div className="td-treemap">
      <div className="td-treemap-title">Test Distribution by File</div>
      <div className="td-treemap-grid">
        {categories.flatMap((cat) =>
          cat.files
            .sort((a, b) => b.testCount - a.testCount)
            .map((file) => {
              const flex = Math.max(file.testCount / maxCount, 0.15);
              return (
                <div
                  key={`${cat.id}-${file.file}`}
                  className="td-treemap-cell"
                  style={{
                    flex,
                    backgroundColor: cat.color,
                    opacity: 0.4 + (file.testCount / maxCount) * 0.6,
                  }}
                  title={`${file.file}: ${file.testCount} tests`}
                >
                  {file.testCount >= 8 && (
                    <span className="td-treemap-cell-count">
                      {file.testCount}
                    </span>
                  )}
                  {file.testCount >= 8 && (
                    <span className="td-treemap-cell-label">
                      {file.file.replace(/\.(test|spec)\.(ts|tsx)$/, "")}
                    </span>
                  )}
                </div>
              );
            }),
        )}
      </div>
      <div className="td-legend">
        {categories.map((cat) => (
          <div key={cat.id} className="td-legend-item">
            <span
              className="td-legend-swatch"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverageOverview() {
  return (
    <div className="td-coverage">
      <div className="td-coverage-title">Module Test Coverage</div>
      <div className="td-coverage-grid">
        {coveredModules.map((mod) => {
          const ratio = mod.tests / maxModuleTests;
          const color =
            ratio > 0.6 ? "#4ade80" : ratio > 0.3 ? "#e5a00d" : "#f87171";
          return (
            <div key={mod.module} className="td-coverage-row">
              <span className="td-coverage-label">{mod.name}</span>
              <div className="td-coverage-bar-wrapper">
                <div
                  className="td-coverage-bar"
                  style={{
                    width: `${ratio * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="td-coverage-value">{mod.tests}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileCard({ file, color }: { file: TestFile; color: string }) {
  const maxCount = 21; // largest test file
  const ratio = file.testCount / maxCount;

  return (
    <div className="td-card">
      <div className="td-card-header">
        <span className="td-card-file">{file.file}</span>
        <span className="td-card-count" style={{ color }}>
          {file.testCount}
          <span style={{ fontSize: 10, opacity: 0.6 }}>tests</span>
        </span>
      </div>
      <div className="td-card-path">{file.path}/</div>
      <div className="td-describes">
        {file.describes.map((d) => (
          <span key={d} className="td-describe-tag">
            {d}
          </span>
        ))}
      </div>
      <div className="td-heatmap">
        <div
          className="td-heatmap-fill"
          style={{
            width: `${ratio * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: TestCategory }) {
  const totalInCategory = category.files.reduce(
    (sum, f) => sum + f.testCount,
    0,
  );

  return (
    <div className="td-category">
      <div className="td-category-header">
        <span
          className="td-category-dot"
          style={{ backgroundColor: category.color }}
        />
        <span className="td-category-title">{category.name}</span>
        <span className="td-category-badge">
          {category.files.length} files · {totalInCategory} tests
        </span>
        <span className="td-category-runner">{category.command}</span>
      </div>
      <div className="td-grid">
        {category.files
          .sort((a, b) => b.testCount - a.testCount)
          .map((file) => (
            <FileCard key={file.file} file={file} color={category.color} />
          ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════

export default function TestDashboard() {
  return (
    <div className="test-dashboard">
      <div className="td-header">
        <h1>Test Landscape</h1>
        <p>
          interactive-os 프로젝트의 테스트 현황 시각화 — {totalFiles} files,{" "}
          {totalTests} test cases
        </p>
      </div>

      <div className="td-stats">
        <StatCard value={totalTests} label="Total Tests" color="#4ade80" />
        <StatCard value={totalFiles} label="Test Files" />
        <StatCard value={totalDescribes} label="Describe Blocks" />
        <StatCard value={categories.length} label="Test Runners" />
      </div>

      <Treemap />
      <CoverageOverview />

      {categories.map((cat) => (
        <CategorySection key={cat.id} category={cat} />
      ))}
    </div>
  );
}
