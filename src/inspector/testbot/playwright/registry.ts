/**
 * Playwright Test Registry
 *
 * Stores test entries registered by side-effect execution of spec files.
 * Separated from index.ts to avoid circular imports with loader.tsx.
 */

export interface TestEntry {
  type: "test" | "describe";
  name: string;
  fn: Function;
  parent?: string;
  children?: TestEntry[];
  beforeEach?: Function[];
  sourceFile?: string | null;
}

export const registry: TestEntry[] = [];
let currentSuite: TestEntry | null = null;

// ── Context Tracking ───────────────────────────────────────────
// Set by the Vite spec-wrapper plugin before spec execution.
let currentLoadingFile: string | null = null;

export function setLoadingContext(path: string | null) {
  currentLoadingFile = path;
}

// ── Registry Functions ─────────────────────────────────────────

export function pushTest(name: string, fn: Function) {
  const entry: TestEntry = {
    type: "test",
    name,
    fn,
    sourceFile: currentLoadingFile,
  };
  if (currentSuite) {
    currentSuite.children = currentSuite.children || [];
    currentSuite.children.push(entry);
  } else {
    registry.push(entry);
  }
}

export function pushDescribe(name: string, fn: Function) {
  const suite: TestEntry = {
    type: "describe",
    name,
    fn,
    children: [],
    sourceFile: currentLoadingFile,
  };
  const parent = currentSuite;

  if (parent) {
    parent.children = parent.children || [];
    parent.children.push(suite);
  } else {
    registry.push(suite);
  }

  currentSuite = suite;
  fn(); // execution populates children via side-effects
  currentSuite = parent;
}

export function pushBeforeEach(fn: Function) {
  if (currentSuite) {
    currentSuite.beforeEach = currentSuite.beforeEach || [];
    currentSuite.beforeEach.push(fn);
  }
}

/**
 * Get entries matching a specific source file.
 */
export function getEntriesByFile(filePath: string): TestEntry[] {
  return registry.filter((e) => e.sourceFile === filePath);
}

/**
 * Remove all entries for a specific source file.
 * Used before re-running a spec to avoid duplicates.
 */
export function clearEntriesForFile(filePath: string) {
  for (let i = registry.length - 1; i >= 0; i--) {
    if (registry[i]!.sourceFile === filePath) {
      registry.splice(i, 1);
    }
  }
}
