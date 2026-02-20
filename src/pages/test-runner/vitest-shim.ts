/**
 * Vitest Browser Shim
 *
 * Provides vitest-compatible describe/it/expect/vi/beforeEach/afterEach
 * that run in the browser and collect structured results.
 *
 * Usage:
 *   1. Create a TestRunner instance
 *   2. Call runner.run(testModuleLoader) to execute
 *   3. Read runner.results for the structured output
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export type TestStatus = "idle" | "running" | "pass" | "fail" | "skip";

export interface TestResult {
  type: "test";
  name: string;
  status: TestStatus;
  duration: number;
  error?: string;
}

export interface SuiteResult {
  type: "suite";
  name: string;
  status: TestStatus;
  children: (SuiteResult | TestResult)[];
  duration: number;
}

export type TestEvent =
  | { type: "suite:start"; name: string; path: string[] }
  | { type: "suite:end"; name: string; path: string[]; status: TestStatus }
  | { type: "test:start"; name: string; path: string[] }
  | {
      type: "test:end";
      name: string;
      path: string[];
      status: TestStatus;
      duration: number;
      error?: string;
    }
  | { type: "run:start"; file: string }
  | {
      type: "run:end";
      file: string;
      passed: number;
      failed: number;
      total: number;
    };

// ═══════════════════════════════════════════════════════════════════
// Expect — minimal assertion library
// ═══════════════════════════════════════════════════════════════════

class ExpectationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpectationError";
  }
}

function createExpect(actual: any) {
  const matchers = {
    toBe(expected: any) {
      if (!Object.is(actual, expected)) {
        throw new ExpectationError(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toEqual(expected: any) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new ExpectationError(`Expected ${b}, got ${a}`);
      }
    },
    toStrictEqual(expected: any) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new ExpectationError(`Expected strict ${b}, got ${a}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new ExpectationError(
          `Expected truthy, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new ExpectationError(
          `Expected falsy, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new ExpectationError(
          `Expected null, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new ExpectationError(
          `Expected undefined, got ${JSON.stringify(actual)}`,
        );
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new ExpectationError("Expected defined, got undefined");
      }
    },
    toBeGreaterThan(expected: number) {
      if (!(actual > expected)) {
        throw new ExpectationError(`Expected ${actual} > ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (!(actual >= expected)) {
        throw new ExpectationError(`Expected ${actual} >= ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (!(actual < expected)) {
        throw new ExpectationError(`Expected ${actual} < ${expected}`);
      }
    },
    toBeInstanceOf(expected: any) {
      if (!(actual instanceof expected)) {
        throw new ExpectationError(`Expected instance of ${expected.name}`);
      }
    },
    toContain(expected: any) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new ExpectationError(
            `Expected array to contain ${JSON.stringify(expected)}`,
          );
        }
      } else if (typeof actual === "string") {
        if (!actual.includes(expected)) {
          throw new ExpectationError(
            `Expected string to contain "${expected}"`,
          );
        }
      } else {
        throw new ExpectationError("toContain requires array or string");
      }
    },
    toContainEqual(expected: any) {
      if (!Array.isArray(actual)) {
        throw new ExpectationError("toContainEqual requires array");
      }
      const found = actual.some(
        (item: any) => JSON.stringify(item) === JSON.stringify(expected),
      );
      if (!found) {
        throw new ExpectationError(
          `Expected array to contain equal ${JSON.stringify(expected)}`,
        );
      }
    },
    toHaveLength(expected: number) {
      if (actual?.length !== expected) {
        throw new ExpectationError(
          `Expected length ${expected}, got ${actual?.length}`,
        );
      }
    },
    toHaveProperty(key: string, value?: any) {
      const keys = key.split(".");
      let current = actual;
      for (const k of keys) {
        if (current == null || !(k in current)) {
          throw new ExpectationError(`Expected to have property "${key}"`);
        }
        current = current[k];
      }
      if (arguments.length > 1 && !Object.is(current, value)) {
        throw new ExpectationError(
          `Expected property "${key}" to be ${JSON.stringify(value)}, got ${JSON.stringify(current)}`,
        );
      }
    },
    toMatch(expected: string | RegExp) {
      const regex =
        typeof expected === "string" ? new RegExp(expected) : expected;
      if (!regex.test(actual)) {
        throw new ExpectationError(`Expected "${actual}" to match ${regex}`);
      }
    },
    toMatchObject(expected: any) {
      for (const key of Object.keys(expected)) {
        if (JSON.stringify(actual?.[key]) !== JSON.stringify(expected[key])) {
          throw new ExpectationError(
            `Expected property "${key}" to match ${JSON.stringify(expected[key])}, got ${JSON.stringify(actual?.[key])}`,
          );
        }
      }
    },
    toThrow(expected?: string | RegExp | typeof Error) {
      let threw = false;
      let error: any;
      try {
        if (typeof actual === "function") actual();
      } catch (e) {
        threw = true;
        error = e;
      }
      if (!threw) {
        throw new ExpectationError("Expected function to throw");
      }
      if (expected) {
        if (
          typeof expected === "string" &&
          !error?.message?.includes(expected)
        ) {
          throw new ExpectationError(
            `Expected error message to include "${expected}", got "${error?.message}"`,
          );
        }
        if (expected instanceof RegExp && !expected.test(error?.message)) {
          throw new ExpectationError(
            `Expected error message to match ${expected}, got "${error?.message}"`,
          );
        }
        if (typeof expected === "function" && !(error instanceof expected)) {
          throw new ExpectationError(
            `Expected error to be instance of ${expected.name}`,
          );
        }
      }
    },
    toHaveBeenCalled() {
      if (!actual?._isMockFn) {
        throw new ExpectationError("Expected a mock function");
      }
      if (actual.mock.calls.length === 0) {
        throw new ExpectationError("Expected function to have been called");
      }
    },
    toHaveBeenCalledTimes(expected: number) {
      if (!actual?._isMockFn) {
        throw new ExpectationError("Expected a mock function");
      }
      if (actual.mock.calls.length !== expected) {
        throw new ExpectationError(
          `Expected ${expected} calls, got ${actual.mock.calls.length}`,
        );
      }
    },
    toHaveBeenCalledWith(...args: any[]) {
      if (!actual?._isMockFn) {
        throw new ExpectationError("Expected a mock function");
      }
      const calls = actual.mock.calls;
      const found = calls.some(
        (call: any[]) => JSON.stringify(call) === JSON.stringify(args),
      );
      if (!found) {
        throw new ExpectationError(
          `Expected to have been called with ${JSON.stringify(args)}`,
        );
      }
    },
  };

  // Build .not proxy
  const negated: Record<string, (...args: any[]) => void> = {};
  for (const [key, fn] of Object.entries(matchers)) {
    negated[key] = (...args: any[]) => {
      try {
        (fn as any)(...args);
      } catch {
        return; // Not threw → negation passes
      }
      throw new ExpectationError(`Expected .not.${key} to fail`);
    };
  }

  return {
    ...matchers,
    not: negated,
    resolves: {
      ...matchers,
    },
  };
}

// Attach objectContaining etc as static
createExpect.objectContaining = (expected: any) => ({
  __objectContaining: true,
  expected,
});
createExpect.arrayContaining = (expected: any[]) => ({
  __arrayContaining: true,
  expected,
});
createExpect.any = (ctor: any) => ({
  __any: true,
  constructor: ctor,
});
createExpect.stringContaining = (expected: string) => ({
  __stringContaining: true,
  expected,
});
createExpect.stringMatching = (expected: string | RegExp) => ({
  __stringMatching: true,
  expected,
});

// ═══════════════════════════════════════════════════════════════════
// vi — minimal mock utility
// ═══════════════════════════════════════════════════════════════════

function createMockFn(impl?: (...args: any[]) => any) {
  const mock = {
    calls: [] as any[][],
    results: [] as any[],
    instances: [] as any[],
    lastCall: undefined as any[] | undefined,
  };

  const fn = Object.assign(
    (...args: any[]) => {
      mock.calls.push(args);
      mock.lastCall = args;
      try {
        const result = impl ? impl(...args) : undefined;
        mock.results.push({ type: "return", value: result });
        return result;
      } catch (error) {
        mock.results.push({ type: "throw", value: error });
        throw error;
      }
    },
    {
      _isMockFn: true,
      mock,
      mockImplementation(newImpl: (...args: any[]) => any) {
        impl = newImpl;
        return fn;
      },
      mockReturnValue(val: any) {
        impl = () => val;
        return fn;
      },
      mockReturnValueOnce(val: any) {
        const oldImpl = impl;
        let called = false;
        impl = (...args: any[]) => {
          if (!called) {
            called = true;
            return val;
          }
          return oldImpl ? oldImpl(...args) : undefined;
        };
        return fn;
      },
      mockReset() {
        mock.calls = [];
        mock.results = [];
        mock.instances = [];
        mock.lastCall = undefined;
        impl = undefined;
      },
      mockClear() {
        mock.calls = [];
        mock.results = [];
        mock.instances = [];
        mock.lastCall = undefined;
      },
      mockRestore() {
        fn.mockReset();
      },
    },
  );

  return fn;
}

const viObj = {
  fn: createMockFn,
  spyOn(obj: any, method: string) {
    const original = obj[method];
    const mock = createMockFn((...args: any[]) => original.apply(obj, args));
    obj[method] = mock;
    (mock as any).mockRestore = () => {
      obj[method] = original;
    };
    return mock;
  },
  restoreAllMocks() {
    // No-op in shim — spyOn handles its own restore
  },
  clearAllMocks() {
    // No-op
  },
  resetAllMocks() {
    // No-op
  },
};

// ═══════════════════════════════════════════════════════════════════
// TestRunner — the core runner
// ═══════════════════════════════════════════════════════════════════

interface SuiteRegistration {
  name: string;
  fn: () => void | Promise<void>;
  children: (SuiteRegistration | TestRegistration)[];
  beforeEach: Array<() => any>;
  afterEach: Array<() => any>;
}

interface TestRegistration {
  type: "test";
  name: string;
  fn: () => void | Promise<void>;
}

export class TestRunner {
  private rootSuites: SuiteRegistration[] = [];
  private suiteStack: SuiteRegistration[] = [];
  private _results: SuiteResult[] = [];
  private _onEvent: ((event: TestEvent) => void) | null = null;
  private currentPath: string[] = [];
  private globalBeforeEach: Array<() => any> = [];
  private globalAfterEach: Array<() => any> = [];
  private _restoreFns: Array<() => void> = [];

  get results(): SuiteResult[] {
    return this._results;
  }

  onEvent(handler: (event: TestEvent) => void) {
    this._onEvent = handler;
  }

  private emit(event: TestEvent) {
    this._onEvent?.(event);
  }

  // Registration API (injected into test files)
  private describe = (name: string, fn: () => void) => {
    const suite: SuiteRegistration = {
      name,
      fn,
      children: [],
      beforeEach: [],
      afterEach: [],
    };

    if (this.suiteStack.length > 0) {
      this.suiteStack[this.suiteStack.length - 1]!.children.push(suite);
    } else {
      this.rootSuites.push(suite);
    }

    this.suiteStack.push(suite);
    fn();
    this.suiteStack.pop();
  };

  private it = (name: string, fn: () => void | Promise<void>) => {
    const test: TestRegistration = { type: "test", name, fn };
    if (this.suiteStack.length > 0) {
      this.suiteStack[this.suiteStack.length - 1]!.children.push(test);
    } else {
      // Top-level test without describe
      const implicitSuite: SuiteRegistration = {
        name: "(root)",
        fn: () => {},
        children: [test],
        beforeEach: [],
        afterEach: [],
      };
      this.rootSuites.push(implicitSuite);
    }
  };

  // Also alias `test` to `it`
  private test = this.it;

  private beforeEachFn = (fn: () => any) => {
    if (this.suiteStack.length > 0) {
      this.suiteStack[this.suiteStack.length - 1]!.beforeEach.push(fn);
    } else {
      this.globalBeforeEach.push(fn);
    }
  };

  private afterEachFn = (fn: () => any) => {
    if (this.suiteStack.length > 0) {
      this.suiteStack[this.suiteStack.length - 1]!.afterEach.push(fn);
    } else {
      this.globalAfterEach.push(fn);
    }
  };

  private beforeAllFn = (_fn: () => any) => {
    // Simplified: treat as beforeEach for first test
    // In a full implementation, this would run once per suite
  };

  private afterAllFn = (_fn: () => any) => {
    // Simplified: no-op for now
  };

  // Execute a suite and all its children
  private async executeSuite(
    suite: SuiteRegistration,
    inheritedBeforeEach: Array<() => any>,
    inheritedAfterEach: Array<() => any>,
  ): Promise<SuiteResult> {
    const path = [...this.currentPath, suite.name];
    this.currentPath = path;
    this.emit({ type: "suite:start", name: suite.name, path });

    const result: SuiteResult = {
      type: "suite",
      name: suite.name,
      status: "running",
      children: [],
      duration: 0,
    };

    const start = performance.now();
    const allBeforeEach = [...inheritedBeforeEach, ...suite.beforeEach];
    const allAfterEach = [...suite.afterEach, ...inheritedAfterEach];

    let hasFailure = false;

    for (const child of suite.children) {
      if ("type" in child && child.type === "test") {
        const testResult = await this.executeTest(
          child,
          allBeforeEach,
          allAfterEach,
        );
        result.children.push(testResult);
        if (testResult.status === "fail") hasFailure = true;
      } else {
        const childSuite = child as SuiteRegistration;
        const suiteResult = await this.executeSuite(
          childSuite,
          allBeforeEach,
          allAfterEach,
        );
        result.children.push(suiteResult);
        if (suiteResult.status === "fail") hasFailure = true;
      }
    }

    result.duration = performance.now() - start;
    result.status = hasFailure ? "fail" : "pass";
    this.currentPath = path.slice(0, -1);
    this.emit({
      type: "suite:end",
      name: suite.name,
      path,
      status: result.status,
    });

    return result;
  }

  private async executeTest(
    test: TestRegistration,
    beforeEachFns: Array<() => any>,
    afterEachFns: Array<() => any>,
  ): Promise<TestResult> {
    const path = [...this.currentPath, test.name];
    this.emit({ type: "test:start", name: test.name, path });

    const start = performance.now();
    let status: TestStatus = "pass";
    let error: string | undefined;

    try {
      // Run beforeEach hooks
      for (const hook of beforeEachFns) {
        const cleanup = await hook();
        if (typeof cleanup === "function") {
          this._restoreFns.push(cleanup);
        }
      }

      // Run test
      await test.fn();
    } catch (e: any) {
      status = "fail";
      error =
        e instanceof ExpectationError ? e.message : e?.message || String(e);
    } finally {
      // Run afterEach hooks
      for (const hook of afterEachFns) {
        try {
          await hook();
        } catch {
          // afterEach failures don't override test result
        }
      }

      // Run cleanup fns from beforeEach
      for (const fn of this._restoreFns) {
        try {
          fn();
        } catch {
          // cleanup failures silent
        }
      }
      this._restoreFns = [];
    }

    const duration = performance.now() - start;

    this.emit({
      type: "test:end",
      name: test.name,
      path,
      status: status as TestStatus,
      duration,
      ...(error !== undefined ? { error } : {}),
    });

    return {
      type: "test",
      name: test.name,
      status,
      duration,
      ...(error !== undefined ? { error } : {}),
    };
  }

  /**
   * Run a test module.
   * The moduleLoader should return a module that was compiled with vitest
   * imports aliased to this shim.
   */
  async run(
    moduleLoader: () => Promise<any>,
    filePath: string,
  ): Promise<SuiteResult[]> {
    // Reset state
    this.rootSuites = [];
    this.suiteStack = [];
    this._results = [];
    this.currentPath = [];
    this.globalBeforeEach = [];
    this.globalAfterEach = [];
    this._restoreFns = [];

    this.emit({ type: "run:start", file: filePath });

    // Inject globals
    const prevDescribe = (globalThis as any).__vitest_shim_describe;
    const prevIt = (globalThis as any).__vitest_shim_it;
    const prevTest = (globalThis as any).__vitest_shim_test;
    const prevExpect = (globalThis as any).__vitest_shim_expect;
    const prevVi = (globalThis as any).__vitest_shim_vi;
    const prevBeforeEach = (globalThis as any).__vitest_shim_beforeEach;
    const prevAfterEach = (globalThis as any).__vitest_shim_afterEach;
    const prevBeforeAll = (globalThis as any).__vitest_shim_beforeAll;
    const prevAfterAll = (globalThis as any).__vitest_shim_afterAll;

    (globalThis as any).__vitest_shim_describe = this.describe;
    (globalThis as any).__vitest_shim_it = this.it;
    (globalThis as any).__vitest_shim_test = this.test;
    (globalThis as any).__vitest_shim_expect = createExpect;
    (globalThis as any).__vitest_shim_vi = viObj;
    (globalThis as any).__vitest_shim_beforeEach = this.beforeEachFn;
    (globalThis as any).__vitest_shim_afterEach = this.afterEachFn;
    (globalThis as any).__vitest_shim_beforeAll = this.beforeAllFn;
    (globalThis as any).__vitest_shim_afterAll = this.afterAllFn;

    try {
      await moduleLoader();
    } catch (e) {
      console.error("[TestRunner] Failed to load module:", e);
    }

    // Execute all registered suites
    for (const suite of this.rootSuites) {
      const result = await this.executeSuite(
        suite,
        this.globalBeforeEach,
        this.globalAfterEach,
      );
      this._results.push(result);
    }

    // Restore
    (globalThis as any).__vitest_shim_describe = prevDescribe;
    (globalThis as any).__vitest_shim_it = prevIt;
    (globalThis as any).__vitest_shim_test = prevTest;
    (globalThis as any).__vitest_shim_expect = prevExpect;
    (globalThis as any).__vitest_shim_vi = prevVi;
    (globalThis as any).__vitest_shim_beforeEach = prevBeforeEach;
    (globalThis as any).__vitest_shim_afterEach = prevAfterEach;
    (globalThis as any).__vitest_shim_beforeAll = prevBeforeAll;
    (globalThis as any).__vitest_shim_afterAll = prevAfterAll;

    let passed = 0;
    let failed = 0;
    const countResults = (nodes: (SuiteResult | TestResult)[]) => {
      for (const node of nodes) {
        if (node.type === "test") {
          if (node.status === "pass") passed++;
          else if (node.status === "fail") failed++;
        } else {
          countResults(node.children);
        }
      }
    };
    countResults(this._results);

    this.emit({
      type: "run:end",
      file: filePath,
      passed,
      failed,
      total: passed + failed,
    });

    return this._results;
  }
}
